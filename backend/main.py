from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import assemblyai as aai
import asyncio
import os
import requests
import logging
from typing import Optional
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local development
        "http://127.0.0.1:5173",  # Local development alternative
        "https://funtimestranscription.vercel.app",  # Vercel production
        "https://funtimestranscription-git-main-sirakinb.vercel.app",  # Vercel preview
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure AssemblyAI
aai.settings.api_key = os.getenv("ASSEMBLYAI_API_KEY", "52c880bb9c4e4797b6342fbc9e03146e")
logger.info(f"AssemblyAI API Key configured: {aai.settings.api_key[:8]}...")

# Make.com webhook URL
MAKE_WEBHOOK_URL = "https://hook.us2.make.com/nuz92po16a43gj0wkxsgspqglrhjktkk"

# Constants
MAX_FILE_SIZE = 1024 * 1024 * 100  # 100MB
MAX_RETRIES = 3
RETRY_DELAY = 2  # seconds

@app.get("/test")
async def test():
    """Test endpoint to verify API is working"""
    return {"status": "ok", "api_key_configured": bool(aai.settings.api_key)}

def transcribe_with_retry(file_path: str, config: aai.TranscriptionConfig) -> Optional[aai.Transcript]:
    """Attempt transcription with retries"""
    for attempt in range(MAX_RETRIES):
        try:
            transcriber = aai.Transcriber()
            return transcriber.transcribe(file_path, config=config)
        except Exception as e:
            if attempt == MAX_RETRIES - 1:  # Last attempt
                raise  # Re-raise the last exception
            logger.warning(f"Transcription attempt {attempt + 1} failed: {str(e)}")
            time.sleep(RETRY_DELAY)  # Wait before retrying

@app.post("/upload")
async def upload_file(file: UploadFile):
    file_path = None
    try:
        logger.info(f"Received file: {file.filename}")
        
        # Read file content
        content = await file.read()
        
        # Check file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"File too large. Maximum size is {MAX_FILE_SIZE/1024/1024}MB"
            )
        
        # Save the uploaded file temporarily
        file_path = f"temp_{file.filename}"
        with open(file_path, "wb") as buffer:
            buffer.write(content)
        logger.info(f"File saved temporarily as: {file_path}")

        # Create a transcription config
        config = aai.TranscriptionConfig(
            speaker_labels=True,
            speakers_expected=2
        )
        logger.info("Transcription config created")

        # Start the transcription with retry logic
        logger.info("Starting transcription...")
        transcript = transcribe_with_retry(file_path, config)
        logger.info("Transcription completed")

        # Format the response
        utterances = []
        for utterance in transcript.utterances:
            utterances.append({
                "speaker": utterance.speaker,
                "text": utterance.text,
                "start": utterance.start,
                "end": utterance.end
            })
        logger.info(f"Processed {len(utterances)} utterances")

        return JSONResponse({
            "text": transcript.text,
            "utterances": utterances
        })

    except Exception as e:
        logger.error(f"Error during transcription: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Clean up the temporary file in the finally block
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info("Temporary file cleaned up")
            except Exception as e:
                logger.error(f"Error cleaning up temporary file: {str(e)}")

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