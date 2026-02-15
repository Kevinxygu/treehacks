from fastapi import FastAPI
from pydantic import BaseModel
import requests
from analysis import TranscriptAnalyzer, generate_summary, generate_longitudinal_summary
from analysis.transcript_analyzer import analyze_transcript, analyze_sessions
from preventative_care.preventative_care import get_preventative_care_recommendations
from companionship.controller import router as companionship_router
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
import os
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, Form # Add UploadFile, File, Form
from pydantic import BaseModel
import requests
from analysis import TranscriptAnalyzer, generate_summary, generate_longitudinal_summary
from analysis.transcript_analyzer import analyze_transcript, analyze_sessions
from preventative_care.preventative_care import get_preventative_care_recommendations
from companionship.controller import router as companionship_router
from fastapi.middleware.cors import CORSMiddleware # Import CORSMiddleware
from elevenlabs.client import ElevenLabs # Import the client
import tempfile # For temporary file handling

# Load the .env file immediately
load_dotenv() 

# Now you can verify it loaded (optional)
if not os.getenv("ANTHROPIC_API_KEY"):
    print("WARNING: ANTHROPIC_API_KEY not found in environment!")

# Set Eleven Labs API key
elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
if elevenlabs_api_key:
    # Removed the set_api_key call, as it's no longer needed globally
    print("Eleven Labs API key loaded.")
else:
    print("WARNING: ELEVENLABS_API_KEY not found in environment!")
app = FastAPI()

# Add CORS middleware (Expo / Metro: 8081; Expo Go: 19000, 19006)
origins = [
    "http://localhost",
    "http://127.0.0.1",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:52766",
    "http://127.0.0.1:52766",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
    "http://localhost:19000",
    "http://127.0.0.1:19000",
    "http://localhost:19006",
    "http://127.0.0.1:19006",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(companionship_router)

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


class PreventativeCareRequest(BaseModel):
    ai_summary: str

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

@app.post("/upload-audio")
async def upload_audio(
    audio_file: UploadFile = File(...),
    session_id: str = Form(...),
    session_date: str = Form(...),
):
    print(f"Received audio upload for session_id: {session_id}, session_date: {session_date}, filename: {audio_file.filename}")

    # Preserve uploaded file extension for ElevenLabs (e.g. .m4a from iOS)
    suffix = os.path.splitext(audio_file.filename or "")[1] or ".m4a"
    if not suffix.startswith("."):
        suffix = "." + suffix
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
        tmp_file.write(await audio_file.read())
        tmp_file_path = tmp_file.name
    
    transcribed_text = "Transcription failed." # Default in case of error

    try:
        if elevenlabs_api_key:
            client = ElevenLabs(api_key=elevenlabs_api_key)
            
            with open(tmp_file_path, "rb") as audio:
                transcript = client.speech_to_text.convert(
                    audio=audio,
                    model_id="eleven_multilingual_v2" # Specify the Scribe v2 model as per docs
                )
            transcribed_text = transcript.text # Assuming the result object has a .text attribute

            print(f"Transcribed Text: {transcribed_text}")
        else:
            print("Eleven Labs API key not set, skipping transcription.")

    except Exception as e:
        print(f"Error during transcription: {e}")
    finally:
        os.remove(tmp_file_path) # Clean up the temporary file

    # Return a dummy AnalysisResult for now, as expected by the mobile app
    # The mobile app expects a JSON with specific keys, so we construct a minimal valid response.
    return {
        "ai_summary": f"Transcribed: {transcribed_text}",
        "risk_score": 0,
        "rule_based_summary": f"Transcribed: {transcribed_text}",
        "session_id": session_id,
        "session_date": session_date,
        "rule_based": {
            "session_id": session_id,
            "session_date": session_date,
            "total_words": len(transcribed_text.split()),
            "unique_words": len(set(transcribed_text.lower().split())),
            "total_sentences": transcribed_text.count('.') + transcribed_text.count('?') + transcribed_text.count('!'),
            "risk_score": 0,
            "summary": f"Transcribed: {transcribed_text}",
            "flagged_excerpts": [],
            "markers": [],
            "raw_metrics": {},
        },
    }


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


@app.post("/preventative-care-recommendations")
async def get_preventative_care_recommendations_endpoint(req: PreventativeCareRequest):
    """
    Generates preventative care recommendations based on provided summaries.
    """
    recommendations = get_preventative_care_recommendations(
        req.ai_summary,
    )
    return recommendations
