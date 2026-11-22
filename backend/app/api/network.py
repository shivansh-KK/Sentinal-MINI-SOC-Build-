from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Dict, Any, List

from backend.app.api.deps import get_db
from backend.app.models.models import Event, Alert

router = APIRouter(prefix="/network", tags=["Network Monitoring"])

@router.get("/overview")
def get_network_overview(db: Session = Depends(get_db)):
    # Protocol distribution
    protocols = db.query(Event.protocol, func.count(Event.id))\
        .group_by(Event.protocol).all()

    # Top source IPs by connection count
    top_sources = db.query(Event.source_ip, func.count(Event.id))\
        .filter(Event.source_ip.isnot(None))\
        .group_by(Event.source_ip)\
        .order_by(desc(func.count(Event.id)))\
        .limit(8).all()

    # Top destination ports
    top_ports = db.query(Event.destination_port, func.count(Event.id))\
        .filter(Event.destination_port.isnot(None))\
        .group_by(Event.destination_port)\
        .order_by(desc(func.count(Event.id)))\
        .limit(8).all()

    # Recent network alerts
    net_alerts = db.query(Alert)\
        .filter(Alert.rule_id.in_(["DET-001", "DET-003", "DET-007"]))\
        .order_by(desc(Alert.created_at))\
        .limit(10).all()

    return {
        "protocols": [{"protocol": p or "TCP", "count": c} for p, c in protocols],
        "top_sources": [{"ip": ip, "count": c} for ip, c in top_sources],
        "top_ports": [{"port": port, "count": c} for port, c in top_ports],
        "recent_alerts": net_alerts
    }

@router.get("/connections")
def get_network_connections(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    connections = db.query(Event)\
        .filter(Event.source_ip.isnot(None))\
        .order_by(desc(Event.timestamp))\
        .offset(skip).limit(limit).all()

    return connections
