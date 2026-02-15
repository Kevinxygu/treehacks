from fastapi import APIRouter, HTTPException

from whoop.service import get_weekly_sleep

router = APIRouter(prefix="/whoop", tags=["whoop"])


@router.get("/sleep/weekly")
async def weekly_sleep():
    """Return sleep data for the past 7 days from WHOOP API."""
    try:
        records = get_weekly_sleep()
        return {"records": records}
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))
