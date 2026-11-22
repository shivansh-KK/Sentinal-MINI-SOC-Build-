from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List

from backend.app.api.deps import get_db, require_viewer
from backend.app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return dashboard_service.get_summary(db)

@router.get("/trends")
def get_dashboard_trends(range_hours: int = Query(24, ge=1, le=168), db: Session = Depends(get_db)):
    return dashboard_service.get_trends(db, range_hours=range_hours)

@router.get("/distribution")
def get_dashboard_distribution(db: Session = Depends(get_db)):
    return dashboard_service.get_distributions(db)
