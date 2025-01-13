from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import assemblyai as aai
import asyncio
import os
import requests

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "https://funtimestranscription.vercel.app",  # Vercel production
        "https://funtimestranscription-git-main-sirakinb.vercel.app",  # Vercel preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure AssemblyAI
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY", "45fcdb83f3a143bd988d4ffc4f3e9655")

# Make.com webhook URL
MAKE_WEBHOOK_URL = "https://hook.us1.make.com/qppd33dn2791jjpv0spo2xbq6brvnnn4"

@app.post("/upload")
async def upload_file(file: UploadFile):
    try:
        # Save the uploaded file temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Create a transcription config
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speakers_expected=2
        )

        # Create the transcriber
        transcriber = aai.Transcriber()

        # Start the transcription
        transcript = transcriber.transcribe(
            file_path,
            config=config
        )

        # Clean up the temporary file
        os.remove(file_path)

        # Format the response
        utterances = []
        for utterance in transcript.utterances:
            utterances.append({
                "speaker": utterance.speaker,
                "text": utterance.text,
                "start": utterance.start,
                "end": utterance.end
            })

        return JSONResponse({
            "text": transcript.text,
            "utterances": utterances
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/save-transcript")
async def save_transcript(transcript: dict):
    try:
        # Create formatted transcript with speaker labels
        formatted_transcript = "\n\n".join([
            f"[{utterance['speaker']}]: {utterance['text']}"
            for utterance in transcript['utterances']
        ])

        # Add formatted transcript to the payload
        webhook_payload = {
            "text": transcript['text'],  # Original full transcript
            "formatted_transcript": formatted_transcript,  # New formatted version with speaker labels
            "utterances": transcript['utterances']  # Original utterances array
        }

        # Send the transcript to Make.com webhook
        response = requests.post(MAKE_WEBHOOK_URL, json=webhook_payload)
        response.raise_for_status()
        return JSONResponse({"message": "Transcript saved successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 