from fastapi import APIRouter, HTTPException

from whoop.service import get_weekly_sleep, get_weekly_cycle, get_weekly_recovery

router = APIRouter(prefix="/whoop", tags=["whoop"])


def _whoop_error(e: Exception) -> HTTPException:
    if isinstance(e, ValueError):
        return HTTPException(status_code=500, detail=str(e))
    return HTTPException(status_code=502, detail=str(e))


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
