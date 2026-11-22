from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Dict, Any

from backend.app.api.deps import get_db
from backend.app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

@router.get("/summary")
def get_report_summary(
    report_type: str = Query("daily_summary", description="daily_summary, weekly, monthly, critical_incidents, endpoint_health, responses"),
    db: Session = Depends(get_db)
):
    return report_service.generate_report(db, report_type=report_type)

@router.get("/export-csv")
def export_csv(
    data_type: str = Query("alerts", description="alerts, incidents, events, responses"),
    db: Session = Depends(get_db)
):
    csv_content = report_service.export_csv(db, data_type=data_type)
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=sentinel_{data_type}_export.csv"}
    )
