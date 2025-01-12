from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import assemblyai as aai
import asyncio
import os

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure AssemblyAI
aai.settings.api_key = "45fcdb83f3a143bd988d4ffc4f3e9655"

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 