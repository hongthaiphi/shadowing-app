'use client';

interface WordResult {
  word: string;
  accuracyScore: number;
  errorType: string;
}

interface PronunciationResultProps {
  accuracyScore: number;
  fluencyScore: number;
  completenessScore: number;
  words: WordResult[];
}

function scoreColor(score: number) {
  if (score >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (score >= 60) return 'text-amber-700 bg-amber-50 border-amber-200';
  return 'text-red-700 bg-red-50 border-red-200';
}

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-amber-400';
  return 'bg-red-500';
}

function scoreLabel(score: number) {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 60) return 'Fair';
  return 'Needs work';
}

export default function PronunciationResult({
  accuracyScore,
  fluencyScore,
  completenessScore,
  words,
}: PronunciationResultProps) {
  const overall = Math.round((accuracyScore + fluencyScore + completenessScore) / 3);

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-purple-50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-lg">🎯</span>
        <p className="text-sm font-bold text-violet-800">Pronunciation Assessment</p>
      </div>

      {/* Overall score */}
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-2xl border-2 flex flex-col items-center justify-center flex-shrink-0 ${scoreColor(overall)}`}>
          <span className="text-xl font-black leading-none">{overall}</span>
          <span className="text-xs font-medium opacity-70">/ 100</span>
        </div>
        <div className="flex-1 space-y-1.5">
          {[
            { label: 'Accuracy', score: Math.round(accuracyScore) },
            { label: 'Fluency', score: Math.round(fluencyScore) },
            { label: 'Completeness', score: Math.round(completenessScore) },
          ].map(({ label, score }) => (
            <div key={label} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24 flex-shrink-0">{label}</span>
              <div className="flex-1 h-1.5 bg-white/80 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="text-xs font-bold text-gray-600 w-8 text-right">{score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-word scores */}
      <div>
        <p className="text-xs font-semibold text-violet-700 mb-2">Word by word:</p>
        <div className="flex flex-wrap gap-1.5">
          {words.map((w, i) => (
            <span
              key={i}
              className={`inline-flex flex-col items-center px-2.5 py-1 rounded-lg border text-xs font-semibold ${
                w.errorType === 'Omission'
                  ? 'text-gray-400 bg-gray-50 border-gray-200 line-through'
                  : scoreColor(w.accuracyScore)
              }`}
              title={w.errorType === 'Omission' ? 'Word omitted' : `Score: ${Math.round(w.accuracyScore)}`}
            >
              <span>{w.word}</span>
              {w.errorType !== 'Omission' && (
                <span className="text-[10px] opacity-70 font-normal">{Math.round(w.accuracyScore)}</span>
              )}
            </span>
          ))}
        </div>
      </div>

      <p className={`text-xs font-semibold text-center py-1 rounded-lg ${scoreColor(overall)}`}>
        {scoreLabel(overall)} — {
          overall >= 90 ? 'Great pronunciation! 🌟' :
          overall >= 80 ? 'Keep it up, almost perfect!' :
          overall >= 60 ? 'Good effort, try again to improve.' :
          'Focus on the red words and try again.'
        }
      </p>
    </div>
  );
}
