'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AudioPlayer from '@/components/AudioPlayer';
import Recorder from '@/components/Recorder';
import { checkDictation, WordResult } from '@/lib/dictation';
import { isLoggedIn } from '@/lib/auth';

const SHADOWING_CHUNK = "I go to school every morning.";
const DICTATION_TEXT = "My class starts at seven o'clock.";

const STATUS_COLORS: Record<WordResult['status'], string> = {
  correct: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  wrong: 'bg-red-100 text-red-800 border-red-200',
  missing: 'bg-amber-100 text-amber-800 border-amber-200 line-through opacity-70',
  extra: 'bg-gray-100 text-gray-600 border-gray-200 opacity-60',
};

type Tab = 'shadowing' | 'dictation';

export default function HomeDemoSection() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>('dictation');

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setMounted(true);
  }, []);

  if (!mounted || loggedIn) return null;

  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<WordResult[]>([]);
  const [accuracy, setAccuracy] = useState(0);

  function handleCheck() {
    if (!input.trim()) return;
    const result = checkDictation(input, DICTATION_TEXT);
    setResults(result.results);
    setAccuracy(result.accuracy);
    setSubmitted(true);
  }

  function handleRetry() {
    setInput('');
    setSubmitted(false);
    setResults([]);
    setAccuracy(0);
  }

  function handleTabChange(t: Tab) {
    setTab(t);
    handleRetry();
  }

  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-violet-50 text-violet-700 text-sm font-semibold px-4 py-2 rounded-full mb-4 border border-violet-100">
          ✨ No account needed
        </div>
        <h2 className="text-3xl font-black text-gray-800 mb-3">Try It Yourself</h2>
        <p className="text-gray-500 text-lg max-w-lg mx-auto">
          Experience a real lesson right here — no sign-up required.
        </p>
      </div>

      <div className="max-w-xl mx-auto">
        {/* Tab switcher */}
        <div className="flex bg-gray-100 rounded-2xl p-1.5 mb-5 gap-1">
          <button
            onClick={() => handleTabChange('dictation')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'dictation'
                ? 'bg-white shadow-sm text-violet-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✏️ Dictation
          </button>
          <button
            onClick={() => handleTabChange('shadowing')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              tab === 'shadowing'
                ? 'bg-white shadow-sm text-blue-700'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            🎧 Shadowing
          </button>
        </div>

        {/* ── DICTATION DEMO ── */}
        {tab === 'dictation' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-to-r from-violet-500 to-purple-600 px-6 py-4">
              <p className="text-white font-black text-base">Dictation: Starter Level</p>
              <p className="text-violet-200 text-xs mt-0.5">Listen carefully and type what you hear</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-sm font-bold text-gray-700">Press play and listen</p>
                </div>
                <AudioPlayer src="" text={DICTATION_TEXT} label="Listen carefully" />
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-700 text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-sm font-bold text-gray-700">Type what you heard</p>
                </div>

                {!submitted ? (
                  <>
                    <textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type the sentence here..."
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 resize-none text-base"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleCheck();
                      }}
                    />
                    <button
                      onClick={handleCheck}
                      disabled={!input.trim()}
                      className="w-full mt-3 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Check My Answer
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    {/* Score */}
                    <div className={`rounded-xl p-4 border ${
                      accuracy >= 80 ? 'bg-emerald-50 border-emerald-200' :
                      accuracy >= 50 ? 'bg-amber-50 border-amber-200' :
                      'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800 text-sm">Your Score</span>
                        <span className={`text-2xl font-black ${
                          accuracy >= 80 ? 'text-emerald-600' :
                          accuracy >= 50 ? 'text-amber-600' :
                          'text-red-600'
                        }`}>{accuracy}%</span>
                      </div>
                      <div className="w-full h-2 bg-white/70 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            accuracy >= 80 ? 'bg-emerald-500' :
                            accuracy >= 50 ? 'bg-amber-500' :
                            'bg-red-500'
                          }`}
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                      <p className="text-xs mt-2 font-medium text-gray-600">
                        {accuracy === 100 ? '🎉 Perfect!' :
                         accuracy >= 80 ? '👍 Great job!' :
                         accuracy >= 50 ? '💪 Keep trying!' :
                         '🔄 Try again!'}
                      </p>
                    </div>

                    {/* Word feedback */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Word-by-word</p>
                      <div className="flex flex-wrap gap-1.5">
                        {results.map((r, i) => (
                          <span
                            key={i}
                            className={`px-2.5 py-1 rounded-lg border text-sm font-medium ${STATUS_COLORS[r.status]}`}
                          >
                            {r.word}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Correct answer */}
                    <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                      <p className="text-xs font-bold text-blue-700 mb-1">Correct answer:</p>
                      <p className="text-gray-700 text-sm italic">&ldquo;{DICTATION_TEXT}&rdquo;</p>
                    </div>

                    <button
                      onClick={handleRetry}
                      className="w-full py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">50+ lessons across 5 topics</p>
                <Link
                  href="/lessons?type=dictation"
                  className="text-sm font-bold text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                >
                  Practice more →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── SHADOWING DEMO ── */}
        {tab === 'shadowing' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header strip */}
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
              <p className="text-white font-black text-base">Shadowing: Starter Level</p>
              <p className="text-blue-100 text-xs mt-0.5">Listen to each chunk, then repeat out loud</p>
            </div>

            <div className="p-6 space-y-5">
              {/* Step 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center flex-shrink-0">1</span>
                  <p className="text-sm font-bold text-gray-700">Listen to the sentence</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 mb-3">
                  <p className="text-gray-800 font-semibold text-lg leading-relaxed">
                    &ldquo;{SHADOWING_CHUNK}&rdquo;
                  </p>
                </div>
                <AudioPlayer src="" text={SHADOWING_CHUNK} label="Tap play to hear it" />
              </div>

              {/* Step 2 */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black flex items-center justify-center flex-shrink-0">2</span>
                  <p className="text-sm font-bold text-gray-700">Now say it yourself</p>
                </div>
                <Recorder label="Record your pronunciation" />
              </div>

              {/* Footer CTA */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-400">Full lessons have 4–6 chunks</p>
                <Link
                  href="/lessons?type=shadowing"
                  className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  Practice more →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 mb-3">
            Like it? Create a free account to track your progress.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-violet-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md hover:shadow-lg"
          >
            Start for Free →
          </Link>
        </div>
      </div>
    </section>
  );
}
