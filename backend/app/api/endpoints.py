import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from backend.app.api.deps import get_db
from backend.app.schemas.schemas import EndpointResponse, EndpointHeartbeat
from backend.app.models.models import Endpoint, Event, Alert, Incident

router = APIRouter(prefix="/endpoints", tags=["Endpoints Management"])

@router.get("", response_model=List[EndpointResponse])
def list_endpoints(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    q = db.query(Endpoint)
    if status:
        q = q.filter(Endpoint.status == status)
    if search:
        q = q.filter((Endpoint.hostname.contains(search)) | (Endpoint.ip_address.contains(search)))
    return q.offset(skip).limit(limit).all()

@router.get("/{endpoint_id}")
def get_endpoint_detail(endpoint_id: int, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.id == endpoint_id).first()
    if not ep:
        raise HTTPException(status_code=404, detail="Endpoint not found")

    recent_events = db.query(Event).filter(Event.hostname == ep.hostname).order_by(Event.timestamp.desc()).limit(15).all()
    recent_alerts = db.query(Alert).filter(Alert.hostname == ep.hostname).order_by(Alert.created_at.desc()).limit(10).all()
    recent_incidents = db.query(Incident).filter(Incident.affected_endpoint == ep.hostname).order_by(Incident.created_at.desc()).limit(5).all()

    return {
        "endpoint": ep,
        "recent_events": recent_events,
        "recent_alerts": recent_alerts,
        "recent_incidents": recent_incidents
    }

@router.post("/heartbeat")
def endpoint_heartbeat(data: EndpointHeartbeat, db: Session = Depends(get_db)):
    ep = db.query(Endpoint).filter(Endpoint.hostname == data.hostname).first()
    if ep:
        ep.last_heartbeat = datetime.datetime.utcnow()
        ep.ip_address = data.ip_address
        ep.status = "online"
        db.commit()
    else:
        ep = Endpoint(
            hostname=data.hostname,
            ip_address=data.ip_address,
            mac_address=data.mac_address,
            os_type=data.os_type or "Linux",
            os_version=data.os_version or "Ubuntu 22.04 LTS",
            agent_version=data.agent_version or "1.0.0",
            status="online",
            last_heartbeat=datetime.datetime.utcnow()
        )
        db.add(ep)
        db.commit()
    return {"status": "acknowledged", "hostname": ep.hostname, "timestamp": ep.last_heartbeat}
