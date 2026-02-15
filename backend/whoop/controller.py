import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse

from whoop.service import (
    get_weekly_sleep,
    get_weekly_cycle,
    get_weekly_recovery,
    get_auth_url,
    exchange_code_for_token,
    is_whoop_connected,
)

router = APIRouter(prefix="/whoop", tags=["whoop"])

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3002").rstrip("/")


def _mock_week_sleep():
    base = datetime.utcnow()
    return [
        {
            "start": (base - timedelta(days=i)).strftime("%Y-%m-%dT06:00:00Z"),
            "end": (base - timedelta(days=i)).strftime("%Y-%m-%dT14:00:00Z"),
            "score": {
                "sleep_performance_percentage": 70 + (i % 25),
                "sleep_consistency_percentage": 75,
                "sleep_efficiency_percentage": 80,
                "stage_summary": {"total_in_bed_time_milli": 7 * 3600 * 1000},
                "sleep_needed": {"baseline_milli": 8 * 3600 * 1000},
            },
        }
        for i in range(7)
    ]


def _mock_week_cycle():
    base = datetime.utcnow()
    return [
        {
            "start": (base - timedelta(days=i)).strftime("%Y-%m-%dT00:00:00Z"),
            "end": (base - timedelta(days=i)).strftime("%Y-%m-%dT23:59:59Z"),
            "score": {"strain": 8 + (i % 8), "kilojoule": 1200, "average_heart_rate": 72, "max_heart_rate": 140},
        }
        for i in range(7)
    ]


def _mock_week_recovery():
    base = datetime.utcnow()
    return [
        {
            "created_at": (base - timedelta(days=i)).strftime("%Y-%m-%dT08:00:00Z"),
            "score": {"recovery_score": 60 + (i % 35), "resting_heart_rate": 58, "hrv_rmssd_milli": 45, "spo2_percentage": 97},
        }
        for i in range(7)
    ]


def _whoop_error(e: Exception) -> HTTPException:
    print(f"WHOOP ERROR: {type(e).__name__}: {str(e)}")
    import traceback
    traceback.print_exc()
    if isinstance(e, ValueError):
        return HTTPException(status_code=500, detail=str(e))
    return HTTPException(status_code=502, detail=f"Whoop service error: {str(e)}")


@router.get("/status")
async def whoop_status():
    return {"connected": is_whoop_connected()}


@router.get("/auth-url")
async def whoop_auth_url():
    try:
        url = get_auth_url()
        return {"authUrl": url}
    except Exception as e:
        raise _whoop_error(e)


@router.get("/callback")
async def whoop_callback(code: str | None = None, state: str | None = None):
    if not code or not state:
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?whoop=error")
    try:
        exchange_code_for_token(code, state)
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?whoop=connected")
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_URL}/dashboard?whoop=error")


@router.get("/sleep/weekly")
async def weekly_sleep():
    """Return sleep data for the past 7 days from WHOOP API, or hardcoded week if unavailable."""
    try:
        records = get_weekly_sleep()
        return {"records": records}
    except Exception as e:
        _whoop_error(e)
        return {"records": _mock_week_sleep()}


@router.get("/cycle/weekly")
async def weekly_cycle():
    """Return physiological cycle data (strain, HR) for the past 7 days from WHOOP API, or hardcoded week if unavailable."""
    try:
        records = get_weekly_cycle()
        return {"records": records}
    except Exception as e:
        _whoop_error(e)
        return {"records": _mock_week_cycle()}


@router.get("/recovery/weekly")
async def weekly_recovery():
    """Return recovery scores and metrics for the past 7 days from WHOOP API, or hardcoded week if unavailable."""
    try:
        records = get_weekly_recovery()
        return {"records": records}
    except Exception as e:
        _whoop_error(e)
        return {"records": _mock_week_recovery()}
