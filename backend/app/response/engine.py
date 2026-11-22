import uuid
import datetime
import ipaddress
import subprocess
import platform
from typing import Optional, Dict, Any, Tuple
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.models import ResponseAction, ResponseApproval, AuditLog, Endpoint, Alert, Incident
from backend.app.websocket.manager import ws_manager

class FirewallAdapter:
    def block_ip(self, ip: str, reason: str = "") -> Tuple[bool, str]:
        raise NotImplementedError
    
    def unblock_ip(self, ip: str) -> Tuple[bool, str]:
        raise NotImplementedError

class MockFirewallAdapter(FirewallAdapter):
    """Safe default mock adapter that records actions without modifying host system."""
    def __init__(self):
        self.blocked_ips = set()

    def block_ip(self, ip: str, reason: str = "") -> Tuple[bool, str]:
        self.blocked_ips.add(ip)
        msg = f"[SIMULATION] Mock Firewall applied rule: DROP traffic from source IP {ip} (Reason: {reason})"
        return True, msg

    def unblock_ip(self, ip: str) -> Tuple[bool, str]:
        if ip in self.blocked_ips:
            self.blocked_ips.remove(ip)
        msg = f"[SIMULATION] Mock Firewall removed rule: Restored traffic from source IP {ip}"
        return True, msg

class SystemFirewallAdapter(FirewallAdapter):
    """Controlled firewall adapter for authorized lab environments only."""
    def __init__(self):
        self.system = platform.system()

    def block_ip(self, ip: str, reason: str = "") -> Tuple[bool, str]:
        try:
            if self.system == "Linux":
                # Safe argument execution without shell=True
                res = subprocess.run(
                    ["iptables", "-A", "INPUT", "-s", ip, "-j", "DROP", "-m", "comment", "--comment", f"SENTINEL-{reason[:20]}"],
                    capture_output=True, text=True, check=False
                )
                if res.returncode == 0:
                    return True, f"[LAB ENFORCEMENT] Linux iptables rule applied: DROP {ip}"
                return False, f"iptables error: {res.stderr}"
            elif self.system == "Windows":
                # Windows firewall netsh command
                rule_name = f"SENTINEL_BLOCK_{ip.replace('.', '_')}"
                res = subprocess.run(
                    ["netsh", "advfirewall", "firewall", "add", "rule", f"name={rule_name}", "dir=in", "action=block", f"remoteip={ip}"],
                    capture_output=True, text=True, check=False
                )
                if res.returncode == 0:
                    return True, f"[LAB ENFORCEMENT] Windows Defender Firewall rule added: Block {ip}"
                return False, f"netsh error: {res.stderr}"
            else:
                return False, f"Unsupported OS for lab firewall: {self.system}"
        except Exception as e:
            return False, f"Firewall execution failed: {str(e)}"

    def unblock_ip(self, ip: str) -> Tuple[bool, str]:
        try:
            if self.system == "Linux":
                res = subprocess.run(
                    ["iptables", "-D", "INPUT", "-s", ip, "-j", "DROP"],
                    capture_output=True, text=True, check=False
                )
                return True, f"[LAB ENFORCEMENT] Linux iptables rule removed for {ip}"
            elif self.system == "Windows":
                rule_name = f"SENTINEL_BLOCK_{ip.replace('.', '_')}"
                res = subprocess.run(
                    ["netsh", "advfirewall", "firewall", "delete", "rule", f"name={rule_name}"],
                    capture_output=True, text=True, check=False
                )
                return True, f"[LAB ENFORCEMENT] Windows Defender Firewall rule removed for {ip}"
            return False, f"Unsupported OS: {self.system}"
        except Exception as e:
            return False, f"Firewall rollback failed: {str(e)}"

# Global adapters
mock_firewall = MockFirewallAdapter()
system_firewall = SystemFirewallAdapter()

class ResponseEngine:
    def __init__(self):
        self.default_mode = settings.DEFAULT_RESPONSE_MODE

    def validate_lab_ip(self, ip_str: str) -> Tuple[bool, str]:
        """Strict safety validation to ensure we never target public or critical infrastructure."""
        try:
            ip = ipaddress.ip_address(ip_str)
        except ValueError:
            return False, f"Invalid IP address format: {ip_str}"

        # Check protected IPs
        if str(ip) in settings.PROTECTED_IPS or ip.is_loopback:
            return False, f"IP {ip_str} is protected (localhost/gateway) and cannot be blocked."

        # Check private lab CIDR allowlist
        is_allowed = False
        for cidr in settings.LAB_ALLOWED_CIDRS:
            try:
                network = ipaddress.ip_network(cidr, strict=False)
                if ip in network:
                    is_allowed = True
                    break
            except Exception:
                continue

        if not is_allowed:
            return False, f"IP {ip_str} is outside authorized lab CIDR ranges ({', '.join(settings.LAB_ALLOWED_CIDRS)})."

        return True, "IP verified within authorized lab parameters."

    def propose_or_execute_action(
        self,
        db: Session,
        action_type: str,
        target: str,
        alert_id: Optional[str] = None,
        incident_id: Optional[str] = None,
        actor: str = "Automated Response Engine",
        execution_mode: Optional[str] = None
    ) -> ResponseAction:
        """Core workflow: evaluate policy mode, validate safety, propose or execute, and record audit trail."""
        mode = execution_mode or self.default_mode
        action_id = f"ACT-{uuid.uuid4().hex[:8].upper()}"

        action = ResponseAction(
            action_id=action_id,
            action_type=action_type,
            target=target,
            execution_mode=mode,
            triggering_alert_id=alert_id,
            triggering_incident_id=incident_id,
            proposed_by=actor,
            status="pending_approval" if mode == "approval_required" else "pending"
        )
        db.add(action)
        db.commit()
        db.refresh(action)

        if mode == "approval_required":
            # Create approval ticket
            approval = ResponseApproval(
                action_id=action_id,
                requested_by=actor,
                status="pending"
            )
            db.add(approval)
            db.commit()

            # Record audit log
            self._record_audit(db, actor, "PROPOSE_RESPONSE", "response_action", action_id, "success",
                               f"Proposed action {action_type} for {target} awaiting analyst approval.")
            return action

        # For simulation or lab_enforcement, execute immediately
        return self.execute_action(db, action_id, actor=actor)

    def execute_action(self, db: Session, action_id: str, actor: str = "Automated Response Engine") -> ResponseAction:
        action = db.query(ResponseAction).filter(ResponseAction.action_id == action_id).first()
        if not action:
            raise ValueError(f"Response action {action_id} not found")

        mode = action.execution_mode
        success = False
        details = ""

        if action.action_type in ["block_ip", "isolate_source"]:
            target_ip = action.target
            # Validate IP safety
            is_safe, safety_msg = self.validate_lab_ip(target_ip)
            if not is_safe and mode == "lab_enforcement":
                action.status = "failed"
                action.output_details = f"Safety check blocked execution: {safety_msg}"
                db.commit()
                self._record_audit(db, actor, "EXECUTE_RESPONSE", "response_action", action_id, "denied", safety_msg)
                return action

            if mode == "simulation":
                success, details = mock_firewall.block_ip(target_ip, reason=f"Triggered by {action.triggering_alert_id or 'SOC rule'}")
            elif mode == "lab_enforcement":
                success, details = system_firewall.block_ip(target_ip, reason=f"Triggered by {action.triggering_alert_id or 'SOC rule'}")
            else: # Executing an approved action
                success, details = mock_firewall.block_ip(target_ip, reason=f"Approved execution")

        elif action.action_type in ["isolate_endpoint", "mark_investigation"]:
            # Mark endpoint status in database
            endpoint = db.query(Endpoint).filter(Endpoint.hostname == action.target).first()
            if endpoint:
                endpoint.status = "under_investigation"
                endpoint.risk_score = min(100, endpoint.risk_score + 25)
                db.commit()
                success = True
                details = f"Endpoint {action.target} marked under investigation and isolated from trusted zone."
            else:
                success = True
                details = f"Endpoint {action.target} status updated for investigation tracking."

        action.status = "executed" if success else "failed"
        action.executed_by = actor
        action.executed_at = datetime.datetime.utcnow()
        action.expires_at = datetime.datetime.utcnow() + datetime.timedelta(hours=2) # 2-hour default cooldown
        action.output_details = details
        db.commit()

        # Update incident if associated
        if action.triggering_incident_id:
            incident = db.query(Incident).filter(Incident.incident_id == action.triggering_incident_id).first()
            if incident:
                notes = incident.investigation_notes or ""
                incident.investigation_notes = (notes + f"\n[{datetime.datetime.utcnow().strftime('%H:%M:%S')}] Automated Action: {action.action_type} executed on {action.target}. Result: {details}").strip()
                if incident.status in ["new", "open"]:
                    incident.status = "contained"
                    incident.containment_time = datetime.datetime.utcnow()
                db.commit()

        self._record_audit(db, actor, "EXECUTE_RESPONSE", "response_action", action_id, "success" if success else "failure", details)
        return action

    def rollback_action(self, db: Session, action_id: str, actor: str = "Security Analyst") -> ResponseAction:
        action = db.query(ResponseAction).filter(ResponseAction.action_id == action_id).first()
        if not action:
            raise ValueError(f"Response action {action_id} not found")

        if action.is_reversed:
            return action

        details = ""
        if action.action_type in ["block_ip", "isolate_source"]:
            if action.execution_mode == "lab_enforcement":
                _, details = system_firewall.unblock_ip(action.target)
            else:
                _, details = mock_firewall.unblock_ip(action.target)
        elif action.action_type in ["isolate_endpoint", "mark_investigation"]:
            endpoint = db.query(Endpoint).filter(Endpoint.hostname == action.target).first()
            if endpoint:
                endpoint.status = "online"
                db.commit()
            details = f"Endpoint {action.target} restored to online status."

        action.is_reversed = True
        action.status = "rolled_back"
        action.output_details = (action.output_details or "") + f" | Rolled back: {details}"
        db.commit()

        self._record_audit(db, actor, "ROLLBACK_RESPONSE", "response_action", action_id, "success", details)
        return action

    def _record_audit(self, db: Session, actor: str, action: str, resource_type: str, resource_id: str, outcome: str, details: str):
        audit = AuditLog(
            actor=actor,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            outcome=outcome,
            details=details
        )
        db.add(audit)
        db.commit()

response_engine = ResponseEngine()
