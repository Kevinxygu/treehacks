import os
import requests
from urllib.parse import urlparse, unquote

BEEPER_BASE = os.environ.get("BEEPER_API_BASE", "http://localhost:23373")


def _headers():
    token = os.environ.get("BEEPER_ACCESS_TOKEN")
    if not token:
        raise ValueError("BEEPER_ACCESS_TOKEN not set")
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def list_messages(chat_id: str, cursor: str | None = None, direction: str | None = None) -> tuple[list[dict], str | None]:
    params = {}
    if cursor and direction:
        params["cursor"] = cursor
        params["direction"] = direction
    r = requests.get(
        f"{BEEPER_BASE}/v1/chats/{chat_id}/messages",
        headers=_headers(),
        params=params if params else None,
        timeout=30,
    )
    r.raise_for_status()
    data = r.json()
    items = data.get("items") or []
    next_cursor = items[-1]["sortKey"] if items else cursor
    return items, next_cursor


def download_attachment(mxc_or_id: str) -> str | None:
    r = requests.post(
        f"{BEEPER_BASE}/v1/assets/download",
        headers=_headers(),
        json={"url": mxc_or_id},
        timeout=60,
    )
    r.raise_for_status()
    out = r.json()
    return out.get("srcURL")


def read_local_file(src_url: str) -> bytes:
    parsed = urlparse(src_url)
    path = parsed.path if parsed.scheme == "file" else src_url
    path = unquote(path)
    return __import__("pathlib").Path(path).expanduser().resolve().read_bytes()
