import json
import datetime
import ipaddress
import asyncio
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.models.models import Event, Endpoint
from backend.app.schemas.schemas import EventIngest
from backend.app.detection.engine import detection_engine
from backend.app.websocket.manager import ws_manager

class EventService:
    def validate_and_normalize(self, data: EventIngest) -> Dict[str, Any]:
        """Validate timestamps, IP addresses, normalize categories and severities."""
        ts = data.timestamp or datetime.datetime.utcnow()
        
        # Clean IP addresses
        source_ip = None
        if data.source_ip:
            try:
                source_ip = str(ipaddress.ip_address(data.source_ip.strip()))
            except ValueError:
                source_ip = data.source_ip.strip()

        dest_ip = None
        if data.destination_ip:
            try:
                dest_ip = str(ipaddress.ip_address(data.destination_ip.strip()))
            except ValueError:
                dest_ip = data.destination_ip.strip()

        # Normalize category
        cat = (data.category or "system").lower()
        if data.event_type in ["failed_login", "auth_success", "user_login", "sudo_elevation"]:
            cat = "authentication"
        elif data.event_type in ["port_scan", "network_connection", "dns_lookup"]:
            cat = "network"
        elif data.event_type in ["suspicious_process", "process_creation"]:
            cat = "process"
        elif data.event_type in ["file_modified", "fim_alert", "file_created"]:
            cat = "file_integrity"

        # Normalize severity
        sev = (data.severity or "low").lower()
        if sev not in ["critical", "high", "medium", "low", "info"]:
            sev = "low"

        return {
            "timestamp": ts,
            "source": data.source or "agent",
            "hostname": data.hostname.strip(),
            "source_ip": source_ip,
            "destination_ip": dest_ip,
            "source_port": data.source_port,
            "destination_port": data.destination_port,
            "protocol": (data.protocol or "TCP").upper(),
            "event_type": data.event_type.strip(),
            "category": cat,
            "severity": sev,
            "username": data.username.strip() if data.username else None,
            "process_name": data.process_name.strip() if data.process_name else None,
            "process_id": data.process_id,
            "command_line": data.command_line,
            "message": data.message,
            "raw_log": data.raw_log or data.message,
            "normalized_data": json.dumps(data.normalized_data or {}),
            "is_synthetic": data.is_synthetic or False
        }

    def ingest_event(self, db: Session, data: EventIngest) -> Tuple[Event, List[Any]]:
        norm = self.validate_and_normalize(data)
        event = Event(**norm)
        db.add(event)
        db.commit()
        db.refresh(event)

        # Update or register endpoint
        ep = db.query(Endpoint).filter(Endpoint.hostname == event.hostname).first()
        if ep:
            ep.last_heartbeat = datetime.datetime.utcnow()
            if event.source_ip and not ep.ip_address:
                ep.ip_address = event.source_ip
            db.commit()
        else:
            new_ep = Endpoint(
                hostname=event.hostname,
                ip_address=event.source_ip or "192.168.1.100",
                os_type="Linux",
                os_version="Ubuntu 22.04 LTS",
                status="online",
                last_heartbeat=datetime.datetime.utcnow()
            )
            db.add(new_ep)
            db.commit()

        # Run detection engine
        alerts = detection_engine.evaluate_event(db, event)

        # Broadcast via WebSockets if active loop exists
        try:
            loop = asyncio.get_running_loop()
            event_dict = {
                "id": event.id,
                "timestamp": event.timestamp.isoformat(),
                "source": event.source,
                "hostname": event.hostname,
                "source_ip": event.source_ip,
                "destination_ip": event.destination_ip,
                "event_type": event.event_type,
                "category": event.category,
                "severity": event.severity,
                "message": event.message
            }
            loop.create_task(ws_manager.broadcast_event(event_dict))

            for alert in alerts:
                alert_dict = {
                    "id": alert.id,
                    "alert_id": alert.alert_id,
                    "title": alert.title,
                    "severity": alert.severity,
                    "source_ip": alert.source_ip,
                    "hostname": alert.hostname,
                    "rule_name": alert.rule_name,
                    "risk_score": alert.risk_score,
                    "created_at": alert.created_at.isoformat()
                }
                loop.create_task(ws_manager.broadcast_alert(alert_dict))
        except (RuntimeError, Exception):
            pass

        return event, alerts

    def get_events(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        category: Optional[str] = None,
        severity: Optional[str] = None,
        source_ip: Optional[str] = None,
        hostname: Optional[str] = None,
        event_type: Optional[str] = None,
        search: Optional[str] = None
    ) -> Tuple[List[Event], int]:
        q = db.query(Event)
        if category:
            q = q.filter(Event.category == category)
        if severity:
            q = q.filter(Event.severity == severity)
        if source_ip:
            q = q.filter(Event.source_ip.contains(source_ip))
        if hostname:
            q = q.filter(Event.hostname.contains(hostname))
        if event_type:
            q = q.filter(Event.event_type == event_type)
        if search:
            q = q.filter(
                (Event.message.contains(search)) |
                (Event.source_ip.contains(search)) |
                (Event.hostname.contains(search)) |
                (Event.username.contains(search)) |
                (Event.event_type.contains(search))
            )

        total = q.count()
        events = q.order_by(desc(Event.timestamp)).offset(skip).limit(limit).all()
        return events, total

event_service = EventService()
