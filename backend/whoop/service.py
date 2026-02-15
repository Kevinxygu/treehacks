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
SCOPES = "read:sleep read:cycles read:recovery offline"

BACKEND_URL = os.environ.get("BACKEND_URL", "https://treehacks-backend-pi.vercel.app").rstrip("/")
REDIRECT_URI = f"{BACKEND_URL}/whoop/callback"
OAUTH_STATES: dict[str, bool] = {}

CLIENT_ID = os.environ["WHOOP_CLIENT_ID"]
CLIENT_SECRET = os.environ["WHOOP_CLIENT_SECRET"]
WHOOP_DIR = Path(__file__).resolve().parent
REFRESH_TOKEN_FILE = WHOOP_DIR / ".whoop_refresh_token"


def _get_refresh_token() -> str | None:
    token = os.environ.get("WHOOP_REFRESH_TOKEN", "").strip()
    if token:
        return token
    if REFRESH_TOKEN_FILE.exists():
        return REFRESH_TOKEN_FILE.read_text().strip() or None
    return None


def _set_refresh_token(token: str) -> None:
    REFRESH_TOKEN_FILE.write_text(token)


def refresh_access_token() -> tuple[str, str]:
    token = _get_refresh_token()
    if not token:
        raise RuntimeError("No refresh token. Connect WHOOP once from the dashboard (or set WHOOP_REFRESH_TOKEN after running OAuth).")
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": token,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope": SCOPES,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    if resp.status_code in (400, 401):
        try:
            err = resp.json()
            if err.get("error") == "invalid_grant" or resp.status_code == 401:
                if REFRESH_TOKEN_FILE.exists():
                    REFRESH_TOKEN_FILE.unlink()
                raise RuntimeError("Whoop refresh token expired or was revoked. Connect WHOOP again from the dashboard.")
        except (ValueError, KeyError):
            pass
    resp.raise_for_status()
    data = resp.json()
    new_refresh = data.get("refresh_token") or token
    if new_refresh != token:
        _set_refresh_token(new_refresh)
    return data["access_token"], new_refresh


LOCAL_REDIRECT_URI = "http://127.0.0.1:8765/callback"


def run_oauth_flow() -> str:
    state = "".join(random.choices(string.ascii_letters + string.digits, k=8))
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": LOCAL_REDIRECT_URI,
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
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": LOCAL_REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    data = resp.json()
    new_refresh = data.get("refresh_token")
    if new_refresh:
        _set_refresh_token(new_refresh)
        print("Refresh token saved to", REFRESH_TOKEN_FILE)
    return data["access_token"]


def get_auth_url() -> str:
    state = "".join(random.choices(string.ascii_letters + string.digits, k=12))
    OAUTH_STATES[state] = True
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": state,
    }
    return f"{AUTH_URL}?{urlencode(params)}"


def exchange_code_for_token(code: str, state: str) -> None:
    if state not in OAUTH_STATES:
        raise ValueError("invalid or expired state")
    del OAUTH_STATES[state]
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "authorization_code",
            "code": code,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "redirect_uri": REDIRECT_URI,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    data = resp.json()
    new_refresh = data.get("refresh_token")
    if new_refresh:
        _set_refresh_token(new_refresh)


def is_whoop_connected() -> bool:
    return _get_refresh_token() is not None


def get_access_token() -> str:
    if _get_refresh_token():
        access_token, _ = refresh_access_token()
        return access_token
    return run_oauth_flow()


def get_weekly_sleep() -> list[dict]:
    access_token = get_access_token()
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=DEFAULT_RANGE_DAYS)
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
    return data.get("records", [])


def _auth_headers() -> dict:
    access_token = get_access_token()
    return {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }


DEFAULT_RANGE_DAYS = 7


def _default_range_params() -> dict:
    end_time = datetime.utcnow()
    start_time = end_time - timedelta(days=DEFAULT_RANGE_DAYS)
    return {
        "start": start_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "end": end_time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "limit": 25,
    }


def get_weekly_cycle() -> list[dict]:
    url = f"{API_BASE}/v2/cycle"
    response = requests.get(url, headers=_auth_headers(), params=_default_range_params())
    response.raise_for_status()
    data = response.json()
    return data.get("records", [])


def get_weekly_recovery() -> list[dict]:
    url = f"{API_BASE}/v2/recovery"
    response = requests.get(url, headers=_auth_headers(), params=_default_range_params())
    response.raise_for_status()
    data = response.json()
    return data.get("records", [])


if __name__ == "__main__":
    import json
    print(json.dumps(get_weekly_sleep(), indent=2))
