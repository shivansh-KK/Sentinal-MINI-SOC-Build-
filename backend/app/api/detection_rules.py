from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from backend.app.api.deps import get_db, get_current_user
from backend.app.schemas.schemas import DetectionRuleResponse, DetectionRuleUpdate, RuleTestRequest
from backend.app.models.models import DetectionRule, User, AuditLog
from backend.app.services.event_service import event_service

router = APIRouter(prefix="/detection-rules", tags=["Detection Rules"])

@router.get("", response_model=List[DetectionRuleResponse])
def list_detection_rules(db: Session = Depends(get_db)):
    return db.query(DetectionRule).order_by(DetectionRule.rule_id).all()

@router.patch("/{rule_id}", response_model=DetectionRuleResponse)
def update_detection_rule(
    rule_id: str,
    update_data: DetectionRuleUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found")

    if update_data.is_enabled is not None:
        rule.is_enabled = update_data.is_enabled
    if update_data.threshold is not None:
        rule.threshold = update_data.threshold
    if update_data.time_window_seconds is not None:
        rule.time_window_seconds = update_data.time_window_seconds
    if update_data.severity is not None:
        rule.severity = update_data.severity
    if update_data.recommended_action is not None:
        rule.recommended_action = update_data.recommended_action

    db.commit()
    db.refresh(rule)

    actor = current_user.username if current_user else "admin"
    audit = AuditLog(
        actor=actor,
        action="UPDATE_RULE",
        resource_type="detection_rule",
        resource_id=rule_id,
        outcome="success",
        details=f"Rule {rule_id} parameters modified: enabled={rule.is_enabled}, threshold={rule.threshold}, window={rule.time_window_seconds}"
    )
    db.add(audit)
    db.commit()

    return rule

@router.post("/{rule_id}/test")
def test_detection_rule(
    rule_id: str,
    payload: RuleTestRequest,
    db: Session = Depends(get_db)
):
    rule = db.query(DetectionRule).filter(DetectionRule.rule_id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Detection rule not found")

    # Ingest test event and check whether this rule or any alert triggers
    event, alerts = event_service.ingest_event(db, payload.sample_event)
    rule_triggered = any(a.rule_id == rule_id for a in alerts)

    return {
        "rule_id": rule_id,
        "rule_name": rule.name,
        "triggered": rule_triggered,
        "alerts_generated": len(alerts),
        "test_event_id": event.id,
        "details": f"Rule {rule.rule_id} evaluated against event {event.id}. Trigger condition {'MET' if rule_triggered else 'NOT MET'}."
    }
