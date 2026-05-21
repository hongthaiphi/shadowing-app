'use client';

import { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  text?: string;
  label?: string;
  onEnded?: () => void;
  compact?: boolean;
}

export default function AudioPlayer({ src, text, label, onEnded, compact = false }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [usingSynth, setUsingSynth] = useState(false);
  const [audioLoading, setAudioLoading] = useState(!!src);
  const [audioError, setAudioError] = useState(false);

  useEffect(() => {
    return () => {
      if (usingSynth && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [usingSynth]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  function speakText() {
    if (!text || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = speed === 0.75 ? 0.75 : 1;
    utter.lang = 'en-US';
    setUsingSynth(true);
    setPlaying(true);
    utter.onend = () => {
      setPlaying(false);
      setUsingSynth(false);
      onEnded?.();
    };
    window.speechSynthesis.speak(utter);
  }

  function handleAudioError() {
    setAudioLoading(false);
    if (!text) {
      setAudioError(true);
    }
  }

  function handleCanPlay() {
    setAudioLoading(false);
    setAudioError(false);
  }

  function togglePlay() {
    if (!src && text) {
      if (playing) {
        window.speechSynthesis?.cancel();
        setPlaying(false);
        setUsingSynth(false);
      } else {
        speakText();
      }
      return;
    }

    if (audioError && text) {
      speakText();
      return;
    }

    const audio = audioRef.current;
    if (!audio || audioLoading) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play().catch(() => {
        speakText();
      });
      setPlaying(true);
    }
  }

  function handleTimeUpdate() {
    const audio = audioRef.current;
    if (!audio) return;
    setProgress(audio.currentTime);
    setDuration(audio.duration || 0);
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Number(e.target.value);
    setProgress(audio.currentTime);
  }

  function toggleSpeed() {
    const newSpeed = speed === 1 ? 0.75 : 1;
    setSpeed(newSpeed);
    const audio = audioRef.current;
    if (audio) audio.playbackRate = newSpeed;
  }

  function handleEnded() {
    setPlaying(false);
    setProgress(0);
    onEnded?.();
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        {src && (
          <audio
            ref={audioRef}
            src={src}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onEnded={handleEnded}
            onCanPlay={handleCanPlay}
            onError={handleAudioError}
          />
        )}
        <button
          onClick={togglePlay}
          disabled={audioLoading}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-wait"
          aria-label={audioLoading ? 'Loading…' : playing ? 'Pause' : 'Play'}
        >
          {audioLoading ? (
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          ) : playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>
        <span className="text-sm text-gray-600 truncate">{label || 'Play audio'}</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {src && (
        <audio
          ref={audioRef}
          src={src}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleTimeUpdate}
          onEnded={handleEnded}
          onCanPlay={handleCanPlay}
          onError={handleAudioError}
        />
      )}
      {label && (
        <p className="text-sm font-medium text-gray-600 mb-3">{label}</p>
      )}

      {audioError && (
        <div className="mb-3 flex items-start gap-2.5 p-3 bg-red-50 border border-red-200 rounded-xl text-sm">
          <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <p className="font-semibold text-red-800">Audio failed to load</p>
            <p className="text-xs text-red-600 mt-0.5">Check your internet connection and try refreshing the page.</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-4">
        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={audioLoading}
          className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0 disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100 disabled:hover:shadow-md"
          aria-label={audioLoading ? 'Loading…' : playing ? 'Pause' : 'Play'}
        >
          {audioLoading ? (
            <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round"/>
            </svg>
          ) : playing ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          ) : (
            <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          )}
        </button>

        {/* Progress + times */}
        <div className="flex-1 min-w-0">
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={progress}
            onChange={handleSeek}
            disabled={usingSynth || !src || audioLoading}
            className="w-full h-2 rounded-full bg-gray-200 appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>{formatTime(progress)}</span>
            <span>{duration ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        {/* Speed toggle */}
        <button
          onClick={toggleSpeed}
          disabled={audioLoading}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all disabled:opacity-50 ${
            speed === 0.75
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {speed === 0.75 ? '0.75x' : '1x'}
        </button>
      </div>

      {!src && text && (
        <p className="mt-2 text-xs text-gray-400 italic">Using browser speech synthesis (no audio file)</p>
      )}
      {audioError && text && (
        <p className="mt-2 text-xs text-amber-600 italic">Audio unavailable — using browser speech synthesis.</p>
      )}
    </div>
  );
}
