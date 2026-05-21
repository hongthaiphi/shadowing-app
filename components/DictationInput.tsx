'use client';

import { useState } from 'react';
import AudioPlayer from './AudioPlayer';
import { checkDictation, WordResult } from '@/lib/dictation';

interface DictationInputProps {
  transcript: string;
  audioSrc: string;
  onComplete: (accuracy: number) => void;
  initialBestAccuracy?: number;
  initialAttempts?: number;
}

export default function DictationInput({
  transcript,
  audioSrc,
  onComplete,
  initialBestAccuracy = 0,
  initialAttempts = 0,
}: DictationInputProps) {
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<WordResult[]>([]);
  const [accuracy, setAccuracy] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [attemptCount, setAttemptCount] = useState(initialAttempts);
  const [bestAccuracy, setBestAccuracy] = useState(initialBestAccuracy);

  function handleSubmit() {
    if (!input.trim()) return;
    const result = checkDictation(input, transcript);
    const newAttempt = attemptCount + 1;
    const newBest = Math.max(bestAccuracy, result.accuracy);
    setResults(result.results);
    setAccuracy(result.accuracy);
    setAttemptCount(newAttempt);
    setBestAccuracy(newBest);
    setSubmitted(true);
    setShowAnswer(false);
    onComplete(result.accuracy);
  }

  function handleRetry() {
    setInput('');
    setSubmitted(false);
    setResults([]);
    setAccuracy(0);
    setShowAnswer(false);
  }

  const statusColors: Record<WordResult['status'], string> = {
    correct: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    wrong: 'bg-red-100 text-red-800 border-red-200',
    missing: 'bg-amber-100 text-amber-800 border-amber-200 line-through opacity-70',
    extra: 'bg-gray-100 text-gray-600 border-gray-200 opacity-60',
  };

  const statusLabels: Record<WordResult['status'], string> = {
    correct: 'Correct',
    wrong: 'Wrong',
    missing: 'Missing',
    extra: 'Extra',
  };

  return (
    <div className="space-y-5">
      {/* Audio player */}
      <AudioPlayer
        src={audioSrc}
        text={transcript}
        label="Listen and type what you hear"
      />

      {/* Attempt stats bar */}
      {(attemptCount > 0 || initialAttempts > 0) && (
        <div className="flex items-center gap-4 px-4 py-2.5 bg-violet-50 rounded-xl border border-violet-100 text-sm">
          <span className="text-violet-700 font-medium">
            🔄 Attempts: <strong>{attemptCount}</strong>
          </span>
          {bestAccuracy > 0 && (
            <span className="text-violet-700 font-medium">
              🏆 Best: <strong>{bestAccuracy}%</strong>
            </span>
          )}
        </div>
      )}

      {/* Input area */}
      {!submitted ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Type what you hear:
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type the words you hear here..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 resize-none text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSubmit();
            }}
          />
          <p className="text-xs text-gray-400 mt-1 mb-4">Tip: Press Ctrl+Enter to submit</p>

          {/* Show answer toggle */}
          <button
            onClick={() => setShowAnswer((v) => !v)}
            className="w-full py-2.5 mb-3 text-sm font-semibold text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-violet-400 hover:text-violet-600 transition-colors"
          >
            {showAnswer ? '🙈 Hide Answer' : '👁️ Show Answer'}
          </button>

          {showAnswer && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-bold text-amber-700 mb-1">Answer (peek mode):</p>
              <p className="text-gray-700 text-sm italic">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!input.trim()}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Check My Answer
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Score */}
          <div className={`rounded-2xl p-5 border ${
            accuracy >= 80 ? 'bg-emerald-50 border-emerald-200' :
            accuracy >= 50 ? 'bg-amber-50 border-amber-200' :
            'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-gray-800">Your Score</span>
              <span className={`text-3xl font-black ${
                accuracy >= 80 ? 'text-emerald-600' :
                accuracy >= 50 ? 'text-amber-600' :
                'text-red-600'
              }`}>
                {accuracy}%
              </span>
            </div>
            {bestAccuracy > 0 && accuracy < bestAccuracy && (
              <p className="text-xs text-gray-500 mb-2">Best score: {bestAccuracy}%</p>
            )}
            <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  accuracy >= 80 ? 'bg-emerald-500' :
                  accuracy >= 50 ? 'bg-amber-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${accuracy}%` }}
              />
            </div>
            <p className="text-sm mt-2 font-medium">
              {accuracy === 100 ? '🎉 Perfect! Excellent work!' :
               accuracy >= 80 ? '👍 Great job! Almost perfect.' :
               accuracy >= 50 ? '💪 Good effort! Keep practising.' :
               '🔄 Keep trying — you\'ll get there!'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Attempt #{attemptCount}</p>
          </div>

          {/* Word-by-word results */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Word-by-word breakdown:</h3>
            <div className="flex flex-wrap gap-2">
              {results.map((r, i) => (
                <span
                  key={i}
                  title={statusLabels[r.status]}
                  className={`px-2.5 py-1 rounded-lg border text-sm font-medium ${statusColors[r.status]}`}
                >
                  {r.word}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 mt-4 text-xs">
              {(['correct', 'wrong', 'missing', 'extra'] as const).map((s) => (
                <span key={s} className={`px-2 py-0.5 rounded border ${statusColors[s]}`}>
                  {statusLabels[s]}
                </span>
              ))}
            </div>
          </div>

          {/* Correct answer */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="text-sm font-bold text-blue-800 mb-2">Correct answer:</h3>
            <p className="text-gray-700 leading-relaxed italic">&ldquo;{transcript}&rdquo;</p>
          </div>

          {/* Your answer */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2">Your answer:</h3>
            <p className="text-gray-600 leading-relaxed">{input}</p>
          </div>

          {/* Retry */}
          <button
            onClick={handleRetry}
            className="w-full py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
