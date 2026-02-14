from fastapi import FastAPI
import requests
# 1. Create an instance of the FastAPI class
app = FastAPI()

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
