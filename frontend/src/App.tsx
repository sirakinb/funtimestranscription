import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

interface Utterance {
  speaker: string
  text: string
  start: number
  end: number
}

interface TranscriptionResult {
  text: string
  utterances: Utterance[]
}

interface SpeakerNames {
  [key: string]: string
}

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)
  const [speakerNames, setSpeakerNames] = useState<SpeakerNames>({})
  const [isSaving, setIsSaving] = useState(false)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsLoading(true)
    setSpeakerNames({})
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      setTranscription(result)
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to transcribe audio')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/mp4': ['.m4a'],
    },
    maxFiles: 1,
  })

  const downloadTranscript = () => {
    if (!transcription) return

    const text = transcription.utterances
      .map(u => `[${speakerNames[u.speaker] || u.speaker}]: ${u.text}`)
      .join('\n\n')
    
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transcript.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSpeakerNameChange = (speaker: string, name: string) => {
    setSpeakerNames(prev => ({
      ...prev,
      [speaker]: name
    }))
  }

  const saveToMake = async () => {
    if (!transcription) return
    setIsSaving(true)

    const formattedTranscript = {
      text: transcription.text,
      utterances: transcription.utterances.map(u => ({
        ...u,
        speaker: speakerNames[u.speaker] || u.speaker
      }))
    }

    try {
      const response = await fetch(`${API_URL}/save-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formattedTranscript),
      })

      if (!response.ok) {
        throw new Error('Failed to save transcript')
      }

      alert('Transcript saved successfully!')
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to save transcript')
    } finally {
      setIsSaving(false)
    }
  }

  const uniqueSpeakers = transcription 
    ? Array.from(new Set(transcription.utterances.map(u => u.speaker)))
    : []

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">
          FunTimes Transcription
        </h1>

        <div {...getRootProps()} className="drop-zone">
          <input {...getInputProps()} />
          <ArrowUpTrayIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p>Drop the audio file here...</p>
          ) : (
            <p>Drag & drop an audio file here, or click to select</p>
          )}
          <p className="text-sm text-gray-500 mt-2">Supports MP3 and M4A files</p>
        </div>

        {isLoading && (
          <div className="text-center mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4">Transcribing your audio...</p>
          </div>
        )}

        {transcription && (
          <div className="transcript-container">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold flex items-center">
                <DocumentTextIcon className="w-6 h-6 mr-2" />
                Transcription
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={saveToMake}
                  className="btn-primary flex items-center"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={downloadTranscript}
                  className="btn-primary flex items-center"
                >
                  <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                  Download
                </button>
              </div>
            </div>

            <div className="mb-6 p-4 bg-dark-100 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Name the Speakers</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {uniqueSpeakers.map((speaker) => (
                  <div key={speaker} className="flex items-center gap-2">
                    <label className="text-sm text-gray-300">{speaker}:</label>
                    <input
                      type="text"
                      value={speakerNames[speaker] || ''}
                      onChange={(e) => handleSpeakerNameChange(speaker, e.target.value)}
                      placeholder="Enter name..."
                      className="flex-1 px-3 py-1 rounded bg-dark-200 border border-gray-600 focus:border-primary focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {transcription.utterances.map((utterance, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-dark-100"
                >
                  <div className="font-semibold text-primary mb-1">
                    {speakerNames[utterance.speaker] || utterance.speaker}
                  </div>
                  <div>{utterance.text}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
