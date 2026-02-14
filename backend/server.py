from fastapi import FastAPI
from pydantic import BaseModel
import requests
from analysis import TranscriptAnalyzer, generate_summary, generate_longitudinal_summary
from analysis.transcript_analyzer import analyze_transcript, analyze_sessions

# 1. Create an instance of the FastAPI class
app = FastAPI()

analyzer = TranscriptAnalyzer()


class TranscriptRequest(BaseModel):
    transcript: str
    session_id: str = ""
    session_date: str = ""


class SessionEntry(BaseModel):
    text: str
    session_id: str = ""
    date: str = ""


class LongitudinalRequest(BaseModel):
    sessions: list[SessionEntry]

# 2. Define a route (the path) and the HTTP method (get)
@app.get("/")
async def root():
    # 3. Return a dictionary (FastAPI converts this to JSON automatically)
    return {"message": "Hello World"}

@app.get("/vital-api")
async def root():
    response = callVitalApi('test.webm')
    
    return {"message": response}

def callVitalApi(file_path):
    url = "https://api.qr.sonometrik.vitalaudio.io/analyze-audio"

    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:147.0) Gecko/20100101 Firefox/147.0",
        "Accept": "*/*",
        "Referer": "https://qr.sonometrik.vitalaudio.io/",
        "Priority": "u=4"
    }

    # Form fields based on the log entries
    data = {
        "name": "john",           # [cite: 34]
        "email": "john@john.com", # [cite: 35]
        "phone": ""               # [cite: 35]
    }

    try:
        with open(file_path, "rb") as audio_file:
            # 'audio_file' is the key expected by the backend 
            files = {
                "audio_file": (
                    "recording.webm", 
                    audio_file, 
                    "audio/webm;codecs=opus" # 
                )
            }

            print(f"Sending request to {url}...")
            response = requests.post(url, headers=headers, data=data, files=files)

            # Check response
            if response.status_code == 200:
                print("vital api call Success!")
                return response.json()
            else:
                print(f"Failed with status code: {response.status_code}")
                return response.text

    except FileNotFoundError:
        print(f"Error: The file at {file_path} was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")


# --- Cognitive Decline Analysis Endpoints ---

@app.post("/analyze-transcript")
async def analyze_single_transcript(req: TranscriptRequest):
    """Analyze a single Zingage call transcript for cognitive decline markers (rule-based only)."""
    result = analyze_transcript(req.transcript, req.session_id, req.session_date)
    return result


@app.post("/analyze-transcript-ai")
async def analyze_single_transcript_ai(req: TranscriptRequest):
    """Analyze a transcript with rule-based scoring + Claude AI summary and interventions."""
    rule_based = analyze_transcript(req.transcript, req.session_id, req.session_date)
    ai_result = generate_summary(rule_based)
    return {**ai_result, "rule_based": rule_based}


@app.post("/analyze-sessions")
async def analyze_multiple_sessions(req: LongitudinalRequest):
    """Analyze multiple call transcripts over time (rule-based only)."""
    sessions = [{"text": s.text, "session_id": s.session_id, "date": s.date} for s in req.sessions]
    result = analyze_sessions(sessions)
    return result


@app.post("/analyze-sessions-ai")
async def analyze_multiple_sessions_ai(req: LongitudinalRequest):
    """Analyze multiple sessions with rule-based scoring + Claude AI trends and interventions."""
    sessions = [{"text": s.text, "session_id": s.session_id, "date": s.date} for s in req.sessions]
    rule_based = analyze_sessions(sessions)
    ai_result = generate_longitudinal_summary(rule_based)
    return {**ai_result, "rule_based": rule_based}
