import os
import uuid

import boto3
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

_sync_in_progress = False


def _get_bucket():
    bucket = os.environ.get("AWS_S3_BUCKET")
    if not bucket:
        raise HTTPException(status_code=500, detail="AWS_S3_BUCKET not configured")
    return bucket


class PresignRequest(BaseModel):
    family_id: str
    filename: str
    content_type: str = "image/jpeg"


class DownloadPresignRequest(BaseModel):
    key: str


@router.post("/get-upload-presign")
async def get_upload_presign(req: PresignRequest):
    bucket = _get_bucket()
    safe_name = os.path.basename(req.filename) or "image.jpg"
    key = f"families/{req.family_id}/{uuid.uuid4().hex}_{safe_name}"

    s3 = boto3.client("s3")
    url = s3.generate_presigned_url(
        "put_object",
        Params={"Bucket": bucket, "Key": key, "ContentType": req.content_type},
        ExpiresIn=900,
    )
    return {"upload_url": url, "key": key}


@router.post("/get-download-presign")
async def get_download_presign(req: DownloadPresignRequest):
    bucket = _get_bucket()
    s3 = boto3.client("s3")
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": bucket, "Key": req.key},
        ExpiresIn=900,
    )
    return {"download_url": url}


@router.post("/sync-started")
async def sync_started():
    global _sync_in_progress
    _sync_in_progress = True
    return {"ok": True}


@router.post("/sync-finished")
async def sync_finished():
    global _sync_in_progress
    _sync_in_progress = False
    return {"ok": True}


LATEST_PHOTOS_LIMIT = 5


@router.get("/family-photos")
async def family_photos(family_id: str = "default"):
    bucket = _get_bucket()
    prefix = f"families/{family_id}/"
    s3 = boto3.client("s3")
    paginator = s3.get_paginator("list_objects_v2")
    objects = []
    pages_info = []
    for page in paginator.paginate(Bucket=bucket, Prefix=prefix):
        page_contents = page.get("Contents")
        pages_info.append({
            "page_content_keys": [obj.get("Key") for obj in (page_contents or [])],
            "num_contents": len(page_contents) if page_contents else 0,
        })
        for obj in page_contents or []:
            key = obj.get("Key")
            if key and not key.endswith("/"):
                objects.append(
                    {"Key": key, "LastModified": obj.get("LastModified") or ""}
                )
    sorted_objects_debug = [{"Key": o["Key"], "LastModified": str(o["LastModified"])} for o in objects]
    objects.sort(key=lambda x: x["LastModified"], reverse=True)
    latest = objects[:LATEST_PHOTOS_LIMIT]
    urls = []
    for item in latest:
        url = s3.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": item["Key"]},
            ExpiresIn=900,
        )
        urls.append(url)
    result = {
        "photos": urls,
        "syncing": _sync_in_progress,
        "debug": {
            "family_id": family_id,
            "bucket": bucket,
            "prefix": prefix,
            "pages_info": pages_info,
            "objects_found": sorted_objects_debug,
            "num_objects": len(objects),
            "latest_keys": [item["Key"] for item in latest],
        },
    }
    print("family_photos result:", result)
    return result
