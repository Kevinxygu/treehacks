import os
import uuid

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()


class PresignRequest(BaseModel):
    family_id: str
    filename: str
    content_type: str = "image/jpeg"


class DownloadPresignRequest(BaseModel):
    key: str


@router.post("/companionship-get-upload-presign")
async def get_upload_presign(req: PresignRequest):
    """Return a presigned PUT URL for the local sync to upload a family photo to S3."""
    bucket = os.environ.get("AWS_S3_BUCKET")
    if not bucket:
        raise HTTPException(status_code=500, detail="AWS_S3_BUCKET not configured")

    safe_name = os.path.basename(req.filename) or "image.jpg"
    key = f"families/{req.family_id}/{uuid.uuid4().hex}_{safe_name}"

    s3 = boto3.client("s3")
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": req.content_type},
        ExpiresIn=900,
    )
    return {"upload_url": url}


@router.post("/companionship-get-download-presign")
async def get_download_presign(req: DownloadPresignRequest):
    """Return a presigned GET URL for downloading a family photo from S3."""
    bucket = os.environ.get("AWS_S3_BUCKET")
    if not bucket:
        raise HTTPException(status_code=500, detail="AWS_S3_BUCKET not configured")

    s3 = boto3.client("s3")
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": req.key},
        ExpiresIn=900,
    )
    return {"download_url": url}
