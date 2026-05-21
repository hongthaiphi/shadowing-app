'use client';

import { useState, useRef, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import Recorder from './Recorder';

interface ChunkPlayerProps {
  chunks: string[];
  audioUrl: string;
  onComplete: () => void;
}

type Phase = 'listen' | 'record' | 'review';

export default function ChunkPlayer({ chunks, audioUrl, onComplete }: ChunkPlayerProps) {
  const [currentChunk, setCurrentChunk] = useState(0);
  const [phase, setPhase] = useState<Phase>('listen');
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [fullPractice, setFullPractice] = useState(false);
  const [fullRecordingBlob, setFullRecordingBlob] = useState<Blob | null>(null);
  const [done, setDone] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const audioUrlRef = useRef<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  if (audioUrlRef.current && recordingBlob) {
    // cleanup handled elsewhere
  }

  // Auto-advance countdown
  useEffect(() => {
    if (autoAdvance && phase === 'review' && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            handleNextChunk();
            return 0;
          }
          return c - 1;
        });
      }, 1000);
    }
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvance, phase, countdown]);

  const isLastChunk = currentChunk === chunks.length - 1;

  function handleListenDone() {
    setPhase('record');
  }

  function handleRecordingComplete(blob: Blob) {
    setRecordingBlob(blob);
    setPhase('review');
    if (autoAdvance) setCountdown(3);
  }

  function handleNextChunk() {
    setCountdown(0);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (isLastChunk) {
      setFullPractice(true);
    } else {
      setCurrentChunk((c) => c + 1);
      setPhase('listen');
      setRecordingBlob(null);
    }
  }

  function handleFullRecordingComplete(blob: Blob) {
    setFullRecordingBlob(blob);
  }

  function handleFinish() {
    setDone(true);
    onComplete();
  }

  const phaseLabels: Record<Phase, string> = {
    listen: 'Listen carefully',
    record: 'Now you try!',
    review: 'Review your recording',
  };

  const phaseColors: Record<Phase, string> = {
    listen: 'text-blue-600',
    record: 'text-rose-600',
    review: 'text-emerald-600',
  };

  if (done) {
    return (
      <div className="text-center py-10">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">Lesson Complete!</h3>
        <p className="text-gray-500">Great job practising all the chunks!</p>
      </div>
    );
  }

  if (fullPractice) {
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
          <h3 className="text-lg font-bold text-emerald-800 mb-2">Full Sentence Practice</h3>
          <p className="text-gray-600 text-sm mb-4">Now practise the entire lesson from start to finish!</p>
          <div className="bg-white rounded-xl p-4 border border-emerald-100 mb-4">
            <p className="text-gray-700 leading-relaxed italic">
              &ldquo;{chunks.join(' ')}&rdquo;
            </p>
          </div>
          <AudioPlayer src={audioUrl} text={chunks.join(' ')} label="Full audio" />
        </div>
        <Recorder
          onRecordingComplete={handleFullRecordingComplete}
          label="Record your full practice"
        />
        {fullRecordingBlob && (
          <div className="text-center">
            <button
              onClick={handleFinish}
              className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg"
            >
              Finish Lesson ✓
            </button>
          </div>
        )}
        {!fullRecordingBlob && (
          <div className="text-center">
            <button
              onClick={handleFinish}
              className="text-sm text-gray-400 underline hover:text-gray-600 transition-colors"
            >
              Skip and finish
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600">
            Chunk {currentChunk + 1} of {chunks.length}
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setAutoAdvance((v) => !v)}
              className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-all ${
                autoAdvance
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}
            >
              {autoAdvance ? '⚡ Auto-advance ON' : '⚡ Auto-advance'}
            </button>
            <span className={`text-sm font-bold ${phaseColors[phase]}`}>
              {phaseLabels[phase]}
            </span>
          </div>
        </div>
        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-violet-500 rounded-full transition-all duration-500"
            style={{ width: `${((currentChunk + (phase === 'review' ? 1 : 0.5)) / chunks.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Chunks sidebar */}
        <div className="md:col-span-1">
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">All Chunks</p>
            <div className="space-y-2">
              {chunks.map((chunk, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl text-sm transition-all ${
                    idx === currentChunk
                      ? 'bg-blue-500 text-white font-medium shadow-sm'
                      : idx < currentChunk
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'text-gray-400 bg-white border border-gray-100'
                  }`}
                >
                  {idx < currentChunk && <span className="mr-1.5">✓</span>}
                  {idx === currentChunk && <span className="mr-1.5">▶</span>}
                  {chunk}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main area */}
        <div className="md:col-span-2 space-y-4">
          {/* Current chunk display */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Current chunk</p>
            <p className="text-xl font-medium text-gray-800 leading-relaxed">
              &ldquo;{chunks[currentChunk]}&rdquo;
            </p>
          </div>

          {/* Listen phase */}
          {phase === 'listen' && (
            <div className="space-y-3">
              <AudioPlayer
                src={audioUrl}
                text={chunks[currentChunk]}
                label="Listen to this chunk"
                onEnded={handleListenDone}
              />
              <div className="flex gap-3">
                <button
                  onClick={handleListenDone}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                >
                  I&apos;m ready to record →
                </button>
              </div>
            </div>
          )}

          {/* Record phase */}
          {phase === 'record' && (
            <Recorder
              onRecordingComplete={handleRecordingComplete}
              label={`Record: "${chunks[currentChunk]}"`}
            />
          )}

          {/* Review phase */}
          {phase === 'review' && (
            <div className="space-y-3">
              <div className="bg-emerald-50 rounded-2xl border border-emerald-100 p-4">
                <p className="text-sm font-semibold text-emerald-700 mb-3">Compare your pronunciation:</p>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-1">Original:</p>
                    <AudioPlayer
                      src={audioUrl}
                      text={chunks[currentChunk]}
                      label="Original audio"
                      compact
                    />
                  </div>
                  {recordingBlob && (
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Your recording:</p>
                      <audio controls src={URL.createObjectURL(recordingBlob)} className="w-full h-9" />
                    </div>
                  )}
                </div>
              </div>

              {autoAdvance && countdown > 0 && (
                <div className="text-center py-2 text-sm text-gray-500 font-medium">
                  ⚡ Auto-advancing in <span className="font-black text-blue-600">{countdown}s</span>…
                  <button onClick={() => { setCountdown(0); if (countdownRef.current) clearInterval(countdownRef.current); }} className="ml-2 text-xs text-red-400 underline">Cancel</button>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => { setPhase('record'); setRecordingBlob(null); setCountdown(0); if (countdownRef.current) clearInterval(countdownRef.current); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                >
                  Try Again
                </button>
                <button
                  onClick={handleNextChunk}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
                >
                  {isLastChunk ? 'Full Practice →' : 'Next Chunk →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
