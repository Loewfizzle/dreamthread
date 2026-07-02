"use client";

import React, { useState, useRef, useEffect } from 'react';

interface VoiceRecorderProps {
  onTranscribed: (text: string) => void;
  onError?: (message: string) => void;
}

type RecorderState = 
  | 'idle' 
  | 'requesting' 
  | 'recording' 
  | 'recorded' 
  | 'transcribing' 
  | 'error';

export default function VoiceRecorder({ onTranscribed, onError }: VoiceRecorderProps) {
  const [state, setState] = useState<RecorderState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcribedPreview, setTranscribedPreview] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const MAX_DURATION_SECONDS = 180; // 3 minutes max for a dream recollection

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function cleanupStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }

  async function startRecording() {
    setErrorMessage(null);
    setState('requesting');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true,
          sampleRate: 44100 
        } 
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setRecordedAudio(audioBlob);
        setState('recorded');
        clearTimer();
        cleanupStream();
      };

      recorder.start();
      setState('recording');
      setDuration(0);

      // Start calm timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          if (next >= MAX_DURATION_SECONDS) {
            stopRecording();
          }
          return next;
        });
      }, 1000);
    } catch (err: unknown) {
      cleanupStream();
      clearTimer();
      const errorName = err && typeof err === 'object' && 'name' in err ? String((err as { name?: string }).name || '') : '';
      let msg = 'We couldn’t access your microphone.';
      if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
        msg = 'Microphone permission was denied. Please allow access in your browser settings and try again.';
      } else if (errorName === 'NotFoundError') {
        msg = 'No microphone was found on this device.';
      }
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else {
      cleanupStream();
      clearTimer();
      setState('idle');
    }
  }

  async function transcribeRecording() {
    if (!recordedAudio) return;

    setState('transcribing');
    setErrorMessage(null);
    setTranscribedPreview(null);

    try {
      const formData = new FormData();
      formData.append('audio', recordedAudio, 'dream.webm');

      const res = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        const msg = data.error || 'Transcription didn’t work this time.';
        setErrorMessage(msg);
        setState('error');
        onError?.(msg);
        return;
      }

      const text = data.text?.trim();
      if (text) {
        setTranscribedPreview(text);
        setState('recorded'); // stay in recorded to allow accept/discard
        // Don't auto-apply — let user decide
      } else {
        throw new Error('Empty transcription');
      }
    } catch {
      const msg = 'The words couldn’t be heard clearly. You can try recording again or type instead.';
      setErrorMessage(msg);
      setState('error');
      onError?.(msg);
    }
  }

  function acceptTranscription() {
    if (transcribedPreview) {
      onTranscribed(transcribedPreview);
      resetRecorder();
    }
  }

  function discardAndRetry() {
    resetRecorder();
    // Immediately allow new recording
    setTimeout(() => {
      startRecording();
    }, 50);
  }

  function resetRecorder() {
    clearTimer();
    cleanupStream();
    mediaRecorderRef.current = null;
    audioChunksRef.current = [];
    setRecordedAudio(null);
    setTranscribedPreview(null);
    setDuration(0);
    setErrorMessage(null);
    setState('idle');
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      cleanupStream();
    };
  }, []);

  const isRecording = state === 'recording';

  return (
    <div className="border border-midnight-500 rounded-3xl p-5 bg-midnight-800/30">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-sm font-medium text-text-200">Speak your dream</div>
          <div className="text-xs text-text-400">Up to 3 minutes • private on your device until transcribed</div>
        </div>
        {state !== 'idle' && state !== 'transcribing' && (
          <button 
            onClick={resetRecorder} 
            className="text-xs text-text-400 hover:text-text-200 px-2 py-1"
          >
            Reset
          </button>
        )}
      </div>

      {/* Main control area */}
      <div className="flex flex-col items-center">
        {/* Visual + controls */}
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="group flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 border-accent/60 hover:border-accent active:scale-[0.96] transition-all bg-midnight-700/50"
            aria-label="Start recording your dream"
          >
            <div className="text-3xl text-accent/90 group-hover:text-accent">🎙︎</div>
            <div className="text-[10px] text-text-400 mt-1 tracking-widest">RECORD</div>
          </button>
        )}

        {state === 'requesting' && (
          <div className="flex flex-col items-center py-3">
            <div className="w-16 h-16 rounded-full border-2 border-accent/40 flex items-center justify-center">
              <div className="w-3 h-3 bg-accent rounded-full animate-pulse" />
            </div>
            <div className="text-xs text-text-400 mt-3">Waiting for microphone…</div>
          </div>
        )}

        {isRecording && (
          <div className="flex flex-col items-center">
            <button
              onClick={stopRecording}
              className="relative flex items-center justify-center w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-400/70 active:scale-95 transition-all"
              aria-label="Stop recording"
            >
              {/* Pulsing calm ring */}
              <div className="absolute w-20 h-20 rounded-full border border-red-400/30 animate-[ping_1.5s_ease-in-out_infinite]" />
              <div className="w-6 h-6 rounded-sm bg-red-400/90" />
            </button>

            <div className="mt-3 text-center">
              <div className="font-mono text-xl text-red-300/90 tabular-nums tracking-[2px]">
                {formatTime(duration)}
              </div>
              <div className="text-[10px] text-text-400">Recording • Tap to stop</div>
            </div>
          </div>
        )}

        {state === 'transcribing' && (
          <div className="w-full py-4 text-center">
            <div className="inline-flex items-center gap-2 text-text-300">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-accent rounded-full animate-bounce" />
              </div>
              <span>Transcribing your dream…</span>
            </div>
            <p className="text-xs text-text-400 mt-2 max-w-[240px] mx-auto">
              The words are being gently turned into text.
            </p>
          </div>
        )}

        {state === 'recorded' && !transcribedPreview && (
          <div className="w-full space-y-3 text-center">
            <div className="text-sm text-text-200">Recording captured ({formatTime(duration)})</div>
            <div className="flex gap-3 justify-center">
              <button 
                onClick={transcribeRecording}
                className="btn text-sm px-6 py-2.5"
              >
                Transcribe with Whisper
              </button>
              <button 
                onClick={discardAndRetry}
                className="btn-secondary text-sm px-5 py-2.5"
              >
                Re-record
              </button>
            </div>
          </div>
        )}

        {state === 'recorded' && transcribedPreview && (
          <div className="w-full">
            <div className="text-xs uppercase tracking-widest text-text-400 mb-1.5 px-1">Transcription ready</div>
            <div className="card bg-midnight-750 p-4 text-sm text-text-100 leading-relaxed mb-4 max-h-[160px] overflow-auto">
              {transcribedPreview}
            </div>
            <div className="flex gap-3">
              <button onClick={acceptTranscription} className="btn flex-1 text-sm py-2.5">
                Use this in my dream
              </button>
              <button onClick={discardAndRetry} className="btn-secondary flex-1 text-sm py-2.5">
                Discard &amp; re-record
              </button>
            </div>
            <p className="text-[11px] text-text-400 text-center mt-3">You can still edit the text after adding it.</p>
          </div>
        )}

        {state === 'error' && (
          <div className="w-full text-center py-1">
            <div className="text-red-400/90 text-sm mb-2">{errorMessage}</div>
            <div className="flex gap-3 justify-center">
              <button onClick={resetRecorder} className="btn-secondary text-xs px-5 py-2">Try again</button>
              <button onClick={resetRecorder} className="text-xs text-text-400 px-3">Close</button>
            </div>
            <p className="text-[10px] text-text-500 mt-3">You can always write your dream by hand instead.</p>
          </div>
        )}
      </div>

      {/* Helpful calm note */}
      {state === 'idle' && (
        <p className="text-center text-[10px] text-text-500 mt-3 tracking-wide">
          Your voice stays on your device until you choose to transcribe.
        </p>
      )}
    </div>
  );
}
