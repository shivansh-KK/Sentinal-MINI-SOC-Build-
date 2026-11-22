from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional

from backend.app.api.deps import get_db, get_current_user
from backend.app.schemas.schemas import ResponseActionResponse, ResponseApprovalAction, ResponseModeConfig
from backend.app.models.models import ResponseAction, ResponseApproval, User, AuditLog, SystemSetting
from backend.app.response.engine import response_engine

router = APIRouter(prefix="/response", tags=["Automated Incident Response"])

@router.get("/actions", response_model=List[ResponseActionResponse])
def list_response_actions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    status: Optional[str] = None,
    execution_mode: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(ResponseAction)
    if status:
        q = q.filter(ResponseAction.status == status)
    if execution_mode:
        q = q.filter(ResponseAction.execution_mode == execution_mode)
    return q.order_by(desc(ResponseAction.created_at)).offset(skip).limit(limit).all()

@router.post("/actions/{action_id}/approve", response_model=ResponseActionResponse)
def approve_action(
    action_id: str,
    payload: ResponseApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    action = db.query(ResponseAction).filter(ResponseAction.action_id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    approval = db.query(ResponseApproval).filter(ResponseApproval.action_id == action_id).first()
    if approval:
        approval.status = "approved"
        approval.approved_by = actor
        approval.notes = payload.notes
        db.commit()

    # Execute the approved action
    executed_action = response_engine.execute_action(db, action_id, actor=actor)
    return executed_action

@router.post("/actions/{action_id}/reject", response_model=ResponseActionResponse)
def reject_action(
    action_id: str,
    payload: ResponseApprovalAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    action = db.query(ResponseAction).filter(ResponseAction.action_id == action_id).first()
    if not action:
        raise HTTPException(status_code=404, detail="Response action not found")

    action.status = "rejected"
    action.output_details = f"Action rejected by {actor}. Notes: {payload.notes or 'No reason provided'}"

    approval = db.query(ResponseApproval).filter(ResponseApproval.action_id == action_id).first()
    if approval:
        approval.status = "rejected"
        approval.approved_by = actor
        approval.notes = payload.notes

    audit = AuditLog(
        actor=actor,
        action="REJECT_RESPONSE",
        resource_type="response_action",
        resource_id=action_id,
        outcome="success",
        details=f"Response action {action_id} rejected"
    )
    db.add(audit)
    db.commit()
    return action

@router.post("/actions/{action_id}/rollback", response_model=ResponseActionResponse)
def rollback_action(
    action_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    actor = current_user.username if current_user else "analyst"
    try:
        rolled_back = response_engine.rollback_action(db, action_id, actor=actor)
        return rolled_back
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/mode")
def get_response_mode(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter(SystemSetting.key == "response_mode").first()
    current_mode = setting.value if setting else response_engine.default_mode
    return {"current_mode": current_mode}

@router.post("/mode")
def set_response_mode(
    payload: ResponseModeConfig,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    valid_modes = ["simulation", "approval_required", "lab_enforcement"]
    if payload.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Mode must be one of {valid_modes}")

    setting = db.query(SystemSetting).filter(SystemSetting.key == "response_mode").first()
    if setting:
        setting.value = payload.mode
    else:
        setting = SystemSetting(key="response_mode", value=payload.mode, description="Global incident response mode")
        db.add(setting)

    response_engine.default_mode = payload.mode
    db.commit()

    actor = current_user.username if current_user else "admin"
    audit = AuditLog(
        actor=actor,
        action="CHANGE_RESPONSE_MODE",
        resource_type="system_settings",
        resource_id="response_mode",
        outcome="success",
        details=f"Global response operating mode updated to '{payload.mode}'"
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "mode": payload.mode}
