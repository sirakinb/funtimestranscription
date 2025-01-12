import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { ArrowUpTrayIcon, DocumentTextIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline'

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

function App() {
  const [isLoading, setIsLoading] = useState(false)
  const [transcription, setTranscription] = useState<TranscriptionResult | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    setIsLoading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://localhost:8000/upload', {
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
      .map(u => `[${u.speaker}]: ${u.text}`)
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-primary">
          Audio Transcription Tool
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
              <button
                onClick={downloadTranscript}
                className="btn-primary flex items-center"
              >
                <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                Download
              </button>
            </div>

            <div className="space-y-4">
              {transcription.utterances.map((utterance, index) => (
                <div
                  key={index}
                  className="p-4 rounded-lg bg-dark-100"
                >
                  <div className="font-semibold text-primary mb-1">
                    {utterance.speaker}
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
