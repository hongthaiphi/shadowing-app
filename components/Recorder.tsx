'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface RecorderProps {
  onRecordingComplete?: (blob: Blob) => void;
  label?: string;
}

type RecordingState = 'idle' | 'recording' | 'stopped';

export default function Recorder({ onRecordingComplete, label }: RecorderProps) {
  const [state, setState] = useState<RecordingState>('idle');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopVolumeMonitor = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setVolume(0);
  }, []);

  useEffect(() => {
    return () => {
      stopVolumeMonitor();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [stopVolumeMonitor]);

  function startVolumeMonitor(stream: MediaStream) {
    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.frequencyBinCount);
    function tick() {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      setVolume(Math.min(100, avg * 2));
      animFrameRef.current = requestAnimationFrame(tick);
    }
    tick();
  }

  async function startRecording() {
    setError(null);
    setAudioUrl(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      startVolumeMonitor(stream);

      // Pick the first MIME type the browser actually supports.
      // iOS Safari only supports audio/mp4; Chrome prefers audio/webm.
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4']
        .find((t) => MediaRecorder.isTypeSupported(t)) ?? '';

      const mr = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      mediaRecorderRef.current = mr;

      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mr.onstop = () => {
        // Use the recorder's actual mimeType so the blob is playable on all browsers
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mimeType || 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        onRecordingComplete?.(blob);
        stream.getTracks().forEach((t) => t.stop());
        stopVolumeMonitor();
        setState('stopped');
      };

      mr.start(100);
      setState('recording');
    } catch (err) {
      const e = err as Error;
      if (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError') {
        setError('Microphone access denied. Click the lock icon in your browser\'s address bar to allow microphone access, then refresh the page.');
      } else if (e.name === 'NotFoundError' || e.name === 'DevicesNotFoundError') {
        setError('No microphone found. Please connect a microphone and try again.');
      } else if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
        setError('Microphone is already in use by another app. Please close other apps using the microphone and try again.');
      } else if (e.name === 'NotSupportedError') {
        setError('Audio recording is not supported in this browser. Please use Chrome or Firefox.');
      } else {
        setError('Could not start recording. Please check your microphone and try again.');
      }
      console.error(err);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
  }

  function reset() {
    setAudioUrl(null);
    setState('idle');
    setVolume(0);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      {label && (
        <p className="text-sm font-semibold text-gray-700 mb-4">{label}</p>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
          <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-red-800">Microphone Error</p>
            <p className="text-sm text-red-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Volume meter */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-gray-500 font-medium">Volume</span>
          {state === 'recording' && (
            <span className="text-xs text-red-500 animate-pulse font-medium">● Recording</span>
          )}
        </div>
        <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${volume}%`,
              background: volume > 70 ? 'linear-gradient(to right, #f59e0b, #ef4444)' :
                         volume > 30 ? 'linear-gradient(to right, #22c55e, #10b981)' :
                                       'linear-gradient(to right, #94a3b8, #64748b)',
            }}
          />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all hover:shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
            Record
          </button>
        )}

        {state === 'recording' && (
          <button
            onClick={stopRecording}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gray-600 to-gray-800 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all hover:shadow-md active:scale-95"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="4" y="4" width="16" height="16" rx="2" />
            </svg>
            Stop
          </button>
        )}

        {state === 'stopped' && (
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Re-record
          </button>
        )}
      </div>

      {/* Playback */}
      {audioUrl && (
        <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="text-xs font-semibold text-emerald-700 mb-2">Your recording:</p>
          <audio controls src={audioUrl} className="w-full h-9" />
        </div>
      )}
    </div>
  );
}
