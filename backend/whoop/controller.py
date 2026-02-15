import os
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

FRONTEND_DASHBOARD_URL = os.environ.get("FRONTEND_DASHBOARD_URL", "http://localhost:3002/dashboard").rstrip("/")


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
        return RedirectResponse(url=f"{FRONTEND_DASHBOARD_URL}?whoop=error")
    try:
        exchange_code_for_token(code, state)
        return RedirectResponse(url=f"{FRONTEND_DASHBOARD_URL}?whoop=connected")
    except Exception:
        return RedirectResponse(url=f"{FRONTEND_DASHBOARD_URL}?whoop=error")


@router.get("/sleep/weekly")
async def weekly_sleep():
    """Return sleep data for the past 7 days from WHOOP API."""
    try:
        records = get_weekly_sleep()
        return {"records": records}
    except Exception as e:
        raise _whoop_error(e)


@router.get("/cycle/weekly")
async def weekly_cycle():
    """Return physiological cycle data (strain, HR) for the past 7 days from WHOOP API."""
    try:
        records = get_weekly_cycle()
        return {"records": records}
    except Exception as e:
        raise _whoop_error(e)


@router.get("/recovery/weekly")
async def weekly_recovery():
    """Return recovery scores and metrics for the past 7 days from WHOOP API."""
    try:
        records = get_weekly_recovery()
        return {"records": records}
    except Exception as e:
        raise _whoop_error(e)
