'use client'

import { useActionState, useState, useRef, useEffect } from 'react'
import { createDreamAction, type NewDreamFormState } from './actions'

const moodOptions = [
  { value: '', label: 'No particular mood' },
  { value: 'calm', label: 'Calm' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'exciting', label: 'Exciting' },
  { value: 'happy', label: 'Happy / Joyful' },
  { value: 'scary', label: 'Scary or Nightmare' },
  { value: 'sad', label: 'Sad' },
  { value: 'vivid', label: 'Vivid / Intense' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'confusing', label: 'Confusing' },
]

const initialState: NewDreamFormState = {}

// Helper to format recording timer
function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default function NewDreamForm() {
  const [state, formAction, isPending] = useActionState(
    createDreamAction,
    initialState
  )

  const values = state.values ?? {
    title: '',
    content: '',
    mood: '',
    is_lucid: false,
  }

  // Controlled form fields (for transcription insertion + error repopulation)
  const [title, setTitle] = useState(values.title)
  const [content, setContent] = useState(values.content)
  const [mood, setMood] = useState(values.mood)
  const [isLucid, setIsLucid] = useState(values.is_lucid)

  // Sync with server action state (e.g. on validation error)
  useEffect(() => {
    if (state.values) {
      setTitle(state.values.title || '')
      setContent(state.values.content || '')
      setMood(state.values.mood || '')
      setIsLucid(state.values.is_lucid || false)
    }
  }, [state.values])

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [liveTranscript, setLiveTranscript] = useState('')
  const [speechSupported, setSpeechSupported] = useState(true)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const recognitionRef = useRef<any>(null)
  const liveTranscriptRef = useRef('')

  // Check speech support on mount
  useEffect(() => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSpeechSupported(!!SpeechRec)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch {}
      }
    }
  }, [])

  const startRecording = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Voice recording isn't supported in this browser. Please type your dream description instead."
      )
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      let final = ''
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += transcript
        } else {
          interim += transcript
        }
      }
      const combined = (final + interim).trim()
      setLiveTranscript(combined)
      liveTranscriptRef.current = combined
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event)
      stopRecording()
    }

    recognition.onend = () => {
      const finalText = liveTranscriptRef.current.trim()
      if (finalText) {
        // Append to content with nice separation for review/edit
        const separator = content.trim() ? '\n\n' : ''
        setContent((prev) => prev + separator + finalText)
      }

      setIsRecording(false)
      setLiveTranscript('')
      liveTranscriptRef.current = ''
      setRecordingTime(0)
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
      recognitionRef.current = null
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setIsRecording(true)
      setRecordingTime(0)
      setLiveTranscript('')

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1)
      }, 1000)
    } catch (err) {
      console.error('Failed to start recording:', err)
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch {}
      // onend handler will clean up state
    }
  }

  const reRecord = () => {
    // Start fresh recording (will append new transcription on stop)
    startRecording()
  }

  return (
    <form action={formAction} className="space-y-8">
      {/* Error banner */}
      {state.error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor="title"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Title <span className="text-muted">(optional)</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="A short title for this dream..."
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
      </div>

      {/* Voice recording - prominent, calm, mobile-optimized */}
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <label className="text-sm font-medium text-foreground">
            Speak your dream <span className="text-muted">(recommended)</span>
          </label>
          {!speechSupported && (
            <span className="text-[10px] text-muted">Not supported in this browser</span>
          )}
        </div>

        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          disabled={!speechSupported || isPending}
          className={`w-full flex items-center justify-center gap-3 rounded-3xl py-4 text-base font-medium transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed ${
            isRecording
              ? 'bg-red-600 text-white'
              : 'bg-primary text-primary-foreground hover:bg-primary/90'
          }`}
        >
          {isRecording ? (
            <>
              <span className="relative flex h-3 w-3 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white/70"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
              </span>
              Stop recording • {formatTimer(recordingTime)}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"
                />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="22" />
              </svg>
              Record with voice
            </>
          )}
        </button>

        {/* Live feedback while recording - calm and clear */}
        {isRecording && (
          <div className="mt-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
            <div className="flex items-center gap-2 text-accent font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              Listening... Speak clearly. Tap stop when done.
            </div>
            {liveTranscript && (
              <p className="mt-2 text-foreground/80 italic leading-relaxed line-clamp-3">
                {liveTranscript}
              </p>
            )}
            <p className="mt-1 text-[10px] text-muted">Transcription happens in your browser.</p>
          </div>
        )}

      </div>

      {/* Content - required */}
      <div>
        <label
          htmlFor="content"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          What happened in your dream? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="content"
          name="content"
          required
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          placeholder="Describe the dream in as much detail as you remember... (or use the voice button above)"
          className="w-full resize-y rounded-3xl border border-border bg-card px-4 py-4 text-base leading-relaxed text-foreground placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <p className="mt-1.5 text-xs text-muted">
          Speak or type. You can always edit before saving.
        </p>
      </div>

      {/* Mood select */}
      <div>
        <label
          htmlFor="mood"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Mood <span className="text-muted">(optional)</span>
        </label>
        <select
          id="mood"
          name="mood"
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-base text-foreground focus:border-primary focus:outline-none"
        >
          {moodOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Lucid checkbox */}
      <div className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <input
          id="is_lucid"
          name="is_lucid"
          type="checkbox"
          checked={isLucid}
          onChange={(e) => setIsLucid(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 accent-primary"
        />
        <div>
          <label
            htmlFor="is_lucid"
            className="text-sm font-medium text-foreground"
          >
            This was a lucid dream
          </label>
          <p className="text-xs text-muted">
            You were aware that you were dreaming while it was happening.
          </p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-2xl bg-primary py-3.5 text-base font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
      >
        {isPending ? 'Saving your dream…' : 'Save Dream Entry'}
      </button>

      <p className="text-center text-xs text-muted">
        Your dream is private and only visible to you.
      </p>
    </form>
  )
}
