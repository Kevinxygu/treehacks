import os
import random
import string
import requests
from datetime import datetime, timedelta
from pathlib import Path
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler

from dotenv import load_dotenv

load_dotenv()
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/developer"
REDIRECT_URI = "http://127.0.0.1:8765/callback"
SCOPES = "read:sleep offline"


def refresh_access_token() -> tuple[str, str]:
    client_id = os.environ["WHOOP_CLIENT_ID"]
    client_secret = os.environ["WHOOP_CLIENT_SECRET"]
    refresh_token = os.environ.get("WHOOP_REFRESH_TOKEN")
    if not refresh_token:
        raise ValueError("WHOOP_REFRESH_TOKEN not set")

    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": client_id,
            "client_secret": client_secret,
            "scope": SCOPES,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    data = resp.json()
    return data["access_token"], data.get("refresh_token") or refresh_token


def run_oauth_flow() -> str:
    client_id = os.environ["WHOOP_CLIENT_ID"]
    client_secret = os.environ["WHOOP_CLIENT_SECRET"]
    state = "".join(random.choices(string.ascii_letters + string.digits, k=8))
    params = {
        "client_id": client_id,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": state,
    }
    auth_full = f"{AUTH_URL}?{urlencode(params)}"
    code_holder: dict[str, str | None] = {}

    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            parsed = urlparse(self.path)
            if parsed.path == "/callback":
                qs = parse_qs(parsed.query)
                if qs.get("state", [None])[0] != state:
                    self.send_response(400)
                    self.end_headers()
                    self.wfile.write(b"state mismatch")
                    return
                code_holder["code"] = (qs.get("code") or [None])[0]
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            self.wfile.write(b"<p>Authorized. You can close this tab.</p>")

        def log_message(self, format, *args):
            pass

    server = HTTPServer(("127.0.0.1", 8765), Handler)
    print("Open this URL in your browser (add http://127.0.0.1:8765/callback as Redirect URI in WHOOP Dashboard if needed):")
    print(auth_full)
    server.handle_request()
    code = code_holder.get("code")
    if not code:
        raise RuntimeError("No authorization code received. Ensure redirect URI is http://127.0.0.1:8765/callback in WHOOP Developer Dashboard.")
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": client_id,
            "client_secret": client_secret,
            "redirect_uri": REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    data = resp.json()
    new_refresh = data.get("refresh_token")
    if new_refresh:
        print("Set WHOOP_REFRESH_TOKEN for next runs:", new_refresh)
    return data["access_token"]


def get_access_token() -> str:
    if os.environ.get("WHOOP_REFRESH_TOKEN"):
        access_token, _ = refresh_access_token()
        return access_token
    return run_oauth_flow()


def get_weekly_sleep() -> list[dict]:
    access_token = get_access_token()
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=7)
    params = {
        "start": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "end": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "limit": 25,
    }
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    url = f"{API_BASE}/v2/activity/sleep"
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    records = []
    for r in data.get("records", []):
        score = r.get("score", {})
        stage_summary = score.get("stage_summary", {})
        in_bed_ms = stage_summary.get("total_in_bed_time_milli", 0)
        hours = round(in_bed_ms / (1000 * 60 * 60), 2)
        records.append({
            "date": r["start"][:10],
            "performance_percent": score.get("sleep_performance_percentage"),
            "consistency_percent": score.get("sleep_consistency_percentage"),
            "hours_in_bed": hours,
        })
    return records


if __name__ == "__main__":
    import json
    print(json.dumps(get_weekly_sleep(), indent=2))
