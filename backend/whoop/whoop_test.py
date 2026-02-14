import os
import random
import string
import requests
from datetime import datetime, timedelta
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import HTTPServer, BaseHTTPRequestHandler

CLIENT_ID = os.environ.get("WHOOP_CLIENT_ID", "32420dc8-1bb2-45d3-a2e4-a2d539262a4d")
CLIENT_SECRET = os.environ.get("WHOOP_CLIENT_SECRET", "597f890e38add4fb9aa9e2a4cc54455da460e85751172f40840fe1d33c3a16c9")
REFRESH_TOKEN = os.environ.get("WHOOP_REFRESH_TOKEN")

AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
API_BASE = "https://api.prod.whoop.com/developer"
REDIRECT_URI = "http://127.0.0.1:8765/callback"
SCOPES = "read:sleep offline"


def refresh_access_token():
    resp = requests.post(
        TOKEN_URL,
        data={
            "grant_type": "refresh_token",
            "refresh_token": REFRESH_TOKEN,
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "scope": SCOPES,
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    resp.raise_for_status()
    data = resp.json()
    return data["access_token"], data.get("refresh_token") or REFRESH_TOKEN


def run_oauth_flow():
    state = "".join(random.choices(string.ascii_letters + string.digits, k=8))
    params = {
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "response_type": "code",
        "scope": SCOPES,
        "state": state,
    }
    auth_full = f"{AUTH_URL}?{urlencode(params)}"
    code_holder = {}

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


def get_access_token():
    if REFRESH_TOKEN:
        access_token, _ = refresh_access_token()
        return access_token
    return run_oauth_flow()


def get_weekly_sleep():
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
    try:
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        print("--- Sleep Data (Past 7 Days) ---")
        for record in data.get("records", []):
            start = record["start"]
            score = record["score"]["sleep_performance_percentage"]
            consistency = record["score"]["sleep_consistency_percentage"]
            in_bed_ms = record["score"]["stage_summary"]["total_in_bed_time_milli"]
            hours = round(in_bed_ms / (1000 * 60 * 60), 2)
            print(f"Date: {start[:10]} | Performance: {score}% | Hours in Bed: {hours}h | Consistency: {consistency}%")
    except requests.exceptions.HTTPError as err:
        print("HTTP Error:", err)
        if hasattr(err.response, "text"):
            print(err.response.text)
    except Exception as e:
        print("Error:", e)


if __name__ == "__main__":
    get_weekly_sleep()
