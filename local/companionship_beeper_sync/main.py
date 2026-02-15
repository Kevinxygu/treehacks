"""
Polls Beeper Desktop API for new messages in the WhatsApp family chat,
downloads image attachments, and uploads them via backend presigned URLs.
Run on the machine where Beeper Desktop is running (Settings → Developers: enable API).
"""
from dotenv import load_dotenv
load_dotenv()

import os
import time
import requests
from beeper_client import list_messages, download_attachment, read_local_file

POLL_INTERVAL_SEC = int(os.environ.get("BEEPER_POLL_INTERVAL_SEC", "5"))
DELAY_AFTER_UPLOAD_SEC = int(os.environ.get("DELAY_AFTER_UPLOAD_SEC", "5"))
FAMILY_ID = os.environ.get("FAMILY_ID", "default")
BACKEND_URL = os.environ.get("BACKEND_URL", "https://treehacks-backend-pi.vercel.app")
PRESIGN_PATH = "/companionship/get-upload-presign"
SYNC_STARTED_PATH = "/companionship/sync-started"
SYNC_FINISHED_PATH = "/companionship/sync-finished"


def get_presigned_url(filename: str, content_type: str) -> str | None:
    if not BACKEND_URL:
        return None
    url = f"{BACKEND_URL.rstrip('/')}{PRESIGN_PATH}"
    r = requests.post(
        url,
        json={"family_id": FAMILY_ID, "filename": filename, "content_type": content_type},
        timeout=10,
    )
    r.raise_for_status()
    return r.json().get("upload_url")


def upload_to_presigned(url: str, data: bytes, content_type: str) -> bool:
    r = requests.put(url, data=data, headers={"Content-Type": content_type}, timeout=30)
    return r.status_code == 200

def post_sync_status(path: str) -> bool:
    if not BACKEND_URL:
        return False
    try:
        r = requests.post(f"{BACKEND_URL.rstrip('/')}{path}", timeout=5)
        return r.status_code == 200
    except requests.RequestException:
        return False


def poll_once(chat_id: str, last_cursor: str | None, seen_ids: set[str]) -> tuple[str | None, int]:
    direction = "after" if last_cursor else None
    cursor = last_cursor
    messages, next_cursor = list_messages(chat_id, cursor=cursor, direction=direction)
    uploaded = 0
    for msg in messages:
        mid = msg.get("id")
        if not mid or mid in seen_ids:
            continue
        seen_ids.add(mid)
        for att in msg.get("attachments") or []:
            if att.get("type") not in ("img", "video"):
                continue
            mxc = att.get("id")
            if not mxc:
                continue
            try:
                src_url = download_attachment(mxc)
                if not src_url:
                    continue
                data = read_local_file(src_url)
                ctype = att.get("mimeType") or "image/jpeg"
                name = att.get("fileName") or ("video.mp4" if ctype.startswith("video/") else "image.jpg")
                presigned = get_presigned_url(name, ctype)
                if presigned and upload_to_presigned(presigned, data, ctype):
                    uploaded += 1
                    print(f"Uploaded {name} from message {mid}")
                elif not BACKEND_URL:
                    print(f"New image (no BACKEND_URL): {name} from {mid}")
            except Exception as e:
                print(f"Skip attachment {mxc[:50]}...: {e}")
    return (next_cursor if messages else last_cursor, uploaded)

def run():
    chat_id = os.environ.get("BEEPER_CHAT_ID")
    seen_ids: set[str] = set()
    last_cursor: str | None = None
    print(f"Polling chat {chat_id} every {POLL_INTERVAL_SEC}s (family_id={FAMILY_ID})")
    if not BACKEND_URL:
        print("BACKEND_URL not set: will only log new images, no upload")
    while True:
        try:
            post_sync_status(SYNC_STARTED_PATH)
            last_cursor, uploaded = poll_once(chat_id, last_cursor, seen_ids)
            if uploaded > 0:
                time.sleep(DELAY_AFTER_UPLOAD_SEC)
            post_sync_status(SYNC_FINISHED_PATH)
        except requests.RequestException as e:
            print("Poll error:", e)
            post_sync_status(SYNC_FINISHED_PATH)
        time.sleep(POLL_INTERVAL_SEC)


if __name__ == "__main__":
    run()
