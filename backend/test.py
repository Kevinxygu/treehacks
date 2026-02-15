import requests
import os

def test_preventative_care():
    # 1. Configuration
    url = "http://127.0.0.1:8000/preventative-care-recommendations"
    file_path = "preventative_care/good_message.txt"

    # 2. Read the file content
    try:
        if not os.path.exists(file_path):
            print(f"Error: File not found at {file_path}")
            return

        with open(file_path, "r", encoding="utf-8") as f:
            file_content = f.read()
            
        print(f"Successfully read {len(file_content)} characters from {file_path}")

    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return

    # 3. Prepare the payload
    # This matches your PreventativeCareRequest(BaseModel)
    payload = {
        "ai_summary": file_content
    }

    # 4. Send the POST request
    print(f"Sending POST request to {url}...")
    try:
        response = requests.post(url, json=payload)

        # 5. Handle the response
        if response.status_code == 200:
            print("\n--- Success! ---")
            print("Recommendations Received:")
            print(response.json())
        else:
            print(f"\n--- Failed ---")
            print(f"Status Code: {response.status_code}")
            print(f"Response Text: {response.text}")

    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Is your FastAPI app running?")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

if __name__ == "__main__":
    test_preventative_care()