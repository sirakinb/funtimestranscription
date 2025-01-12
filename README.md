# Audio Transcription Tool

A modern web application for transcribing audio files with speaker diarization using AssemblyAI's API. The tool features a sleek dark-themed UI and supports MP3 and M4A audio files.

## Features

- 🎯 Accurate audio transcription with speaker diarization
- 🎨 Modern, dark-themed UI
- 📱 Responsive design
- 🔊 Support for MP3 and M4A audio files
- 💾 Downloadable transcripts
- 👥 Speaker identification (up to 2 speakers)

## Prerequisites

- Python 3.8+
- Node.js 14+
- AssemblyAI API key

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/sirakinb/funtimestranscription.git
   cd funtimestranscription
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Configure your AssemblyAI API key:
   - Open `backend/main.py`
   - Replace the API key with your own from [AssemblyAI](https://www.assemblyai.com/)

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   uvicorn main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Drag and drop an audio file (MP3 or M4A) onto the upload zone
2. Wait for the transcription to complete
3. View the transcribed text with speaker labels
4. Download the transcript using the download button

## Technologies Used

- Frontend:
  - React with TypeScript
  - Tailwind CSS
  - Hero Icons
  - React Dropzone

- Backend:
  - FastAPI
  - AssemblyAI API
  - Python 3

## License

MIT 