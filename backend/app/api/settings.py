import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from backend.app.api.deps import get_db, require_admin
from backend.app.models.models import SystemSetting, ApiKey, User, AuditLog
from backend.app.schemas.schemas import WazuhConfig, UserResponse
from backend.app.core.config import settings

router = APIRouter(prefix="/settings", tags=["System Settings & Integrations"])

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings_records = db.query(SystemSetting).all()
    s_map = {s.key: s.value for s in settings_records}

    wazuh_setting = s_map.get("wazuh_enabled", "false")
    return {
        "project_name": settings.PROJECT_NAME,
        "version": settings.PROJECT_VERSION,
        "default_response_mode": s_map.get("response_mode", settings.DEFAULT_RESPONSE_MODE),
        "lab_allowed_cidrs": settings.LAB_ALLOWED_CIDRS,
        "wazuh": {
            "enabled": wazuh_setting.lower() == "true",
            "api_url": s_map.get("wazuh_api_url", settings.WAZUH_API_URL),
            "username": s_map.get("wazuh_user", settings.WAZUH_USER),
            "status": "ready" if wazuh_setting.lower() == "true" else "disconnected"
        },
        "retention_days": int(s_map.get("retention_days", "30"))
    }

@router.post("/wazuh")
def configure_wazuh(payload: WazuhConfig, db: Session = Depends(get_db)):
    # Upsert wazuh configuration
    keys = {
        "wazuh_enabled": str(payload.enabled).lower(),
        "wazuh_api_url": payload.api_url,
        "wazuh_user": payload.username
    }
    for k, v in keys.items():
        rec = db.query(SystemSetting).filter(SystemSetting.key == k).first()
        if rec:
            rec.value = v
        else:
            db.add(SystemSetting(key=k, value=v, description="Wazuh connector configuration"))

    db.commit()

    audit = AuditLog(
        actor="admin",
        action="CONFIGURE_WAZUH",
        resource_type="integrations",
        outcome="success",
        details=f"Wazuh configuration updated: enabled={payload.enabled}, url={payload.api_url}"
    )
    db.add(audit)
    db.commit()

    return {"status": "success", "message": "Wazuh integration configured successfully", "enabled": payload.enabled}

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    return db.query(User).all()

@router.get("/api-keys")
def list_api_keys(db: Session = Depends(get_db)):
    keys = db.query(ApiKey).all()
    return [{"key_id": k.key_id, "name": k.name, "prefix": k.prefix, "role": k.role, "is_active": k.is_active, "created_at": k.created_at} for k in keys]

@router.post("/api-keys")
def generate_api_key(name: str, role: str = "agent", db: Session = Depends(get_db)):
    raw_secret = f"stnl_{uuid.uuid4().hex}"
    prefix = raw_secret[:10]
    key_hash = hashlib.sha256(raw_secret.encode()).hexdigest()
    key_id = f"KEY-{uuid.uuid4().hex[:6].upper()}"

    key = ApiKey(
        key_id=key_id,
        name=name,
        key_hash=key_hash,
        prefix=prefix,
        role=role
    )
    db.add(key)
    db.commit()

    return {
        "key_id": key_id,
        "name": name,
        "api_key": raw_secret, # Returned only once upon generation
        "prefix": prefix,
        "role": role
    }
