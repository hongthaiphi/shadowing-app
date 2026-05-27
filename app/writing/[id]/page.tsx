'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { markComplete, getCompletedIds } from '@/lib/progress';
import { getSupabase } from '@/lib/supabase';
import writingLessons from '@/data/writing-lessons.json';

// ─── Types ────────────────────────────────────────────────────────────────────

type TaskType = 'descriptive' | 'opinion' | 'narrative' | 'compare-contrast';

interface SuggestedStructure {
  introduction: string;
  body: string[];
  conclusion: string;
}

interface WritingLesson {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: 'writing';
  taskType: TaskType;
  durationMinutes: number;
  wordTarget: number;
  prompt: string;
  requirements: string[];
  suggestedIdeas: string[];
  suggestedVocabulary: string[];
  suggestedStructure: SuggestedStructure;
}

type SaveStatus = 'idle' | 'saving' | 'saved';
type MobileTab  = 'prompt'  | 'write';

// ─── Draft storage ────────────────────────────────────────────────────────────

const DRAFT_KEY = (id: string) => `writing_draft_${id}`;

function loadDraft(id: string): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(DRAFT_KEY(id)) ?? '';
  } catch {
    return '';
  }
}

function persistDraft(id: string, text: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRAFT_KEY(id), text);
  } catch {
    // Storage quota exceeded — silently fail
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function countWords(text: string): number {
  const trimmed = text.trim();
  if (trimmed === '') return 0;
  return trimmed.split(/\s+/).length;
}

const TASK_TYPE_LABELS: Record<TaskType, string> = {
  'descriptive':      '📝 Descriptive',
  'opinion':          '💬 Opinion',
  'narrative':        '📖 Narrative',
  'compare-contrast': '⚖️ Compare & Contrast',
};

const TASK_TYPE_COLORS: Record<TaskType, string> = {
  'descriptive':      'bg-blue-100 text-blue-700',
  'opinion':          'bg-violet-100 text-violet-700',
  'narrative':        'bg-amber-100 text-amber-800',
  'compare-contrast': 'bg-teal-100 text-teal-700',
};

function wordCountColor(wordCount: number, target: number): string {
  const pct = wordCount / target;
  if (pct >= 1)    return 'text-emerald-600';
  if (pct >= 0.75) return 'text-amber-600';
  return 'text-gray-500';
}

function progressBarColor(wordCount: number, target: number): string {
  const pct = wordCount / target;
  if (pct >= 1)    return 'bg-emerald-500';
  if (pct >= 0.75) return 'bg-amber-400';
  return 'bg-blue-400';
}

// ─── Collapsible section ──────────────────────────────────────────────────────

function CollapsibleSection({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="font-semibold text-gray-700 text-sm flex items-center gap-2">
          <span>{icon}</span>
          {title}
        </span>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Prompt panel ─────────────────────────────────────────────────────────────

function PromptPanel({
  lesson,
  onInsertWord,
}: {
  lesson: WritingLesson;
  onInsertWord: (word: string) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">

        {/* Prompt card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TASK_TYPE_COLORS[lesson.taskType]}`}>
              {TASK_TYPE_LABELS[lesson.taskType]}
            </span>
            <span className="text-xs text-gray-500 ml-auto">
              Target: <span className="font-bold text-gray-700">{lesson.wordTarget} words</span>
            </span>
          </div>
          <p className="text-gray-800 text-sm leading-relaxed font-medium">
            {lesson.prompt}
          </p>
        </div>

        {/* Requirements */}
        {lesson.requirements.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2">
              ✅ Requirements
            </p>
            <ul className="space-y-1">
              {lesson.requirements.map((req, i) => (
                <li key={i} className="text-xs text-amber-800 flex items-start gap-2">
                  <span className="mt-0.5 text-amber-500 flex-shrink-0">•</span>
                  {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested ideas */}
        <CollapsibleSection title="Suggested Ideas" icon="💡" defaultOpen={true}>
          <ul className="space-y-1.5">
            {lesson.suggestedIdeas.map((idea, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="mt-0.5 text-emerald-500 flex-shrink-0 font-bold">→</span>
                {idea}
              </li>
            ))}
          </ul>
        </CollapsibleSection>

        {/* Vocabulary */}
        <CollapsibleSection title="Useful Vocabulary" icon="📚" defaultOpen={true}>
          <p className="text-xs text-gray-400 mb-2">Click a word to insert it into your essay.</p>
          <div className="flex flex-wrap gap-1.5">
            {lesson.suggestedVocabulary.map((word) => (
              <button
                key={word}
                onClick={() => onInsertWord(word)}
                className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-xs font-semibold text-blue-700 hover:bg-blue-100 hover:border-blue-400 transition-all active:scale-95"
              >
                {word}
              </button>
            ))}
          </div>
        </CollapsibleSection>

        {/* Sample structure */}
        <CollapsibleSection title="Sample Structure" icon="📋" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Introduction
              </p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100">
                {lesson.suggestedStructure.introduction}
              </p>
            </div>
            {lesson.suggestedStructure.body.map((para, i) => (
              <div key={i}>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                  Body Paragraph {i + 1}
                </p>
                <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100">
                  {para}
                </p>
              </div>
            ))}
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Conclusion
              </p>
              <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2 border border-gray-100">
                {lesson.suggestedStructure.conclusion}
              </p>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}

// ─── Writing area ─────────────────────────────────────────────────────────────

function WritingArea({
  lesson,
  draftText,
  saveStatus,
  completed,
  alreadyCompleted,
  textareaRef,
  onTextChange,
  onMarkComplete,
}: {
  lesson: WritingLesson;
  draftText: string;
  saveStatus: SaveStatus;
  completed: boolean;
  alreadyCompleted: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void;
  onMarkComplete: () => void;
}) {
  const wordCount   = countWords(draftText);
  const pct         = Math.min(100, Math.round((wordCount / lesson.wordTarget) * 100));
  const isOnTarget  = wordCount >= lesson.wordTarget;
  const isDone      = completed || alreadyCompleted;

  return (
    <div className="flex flex-col h-full">

      {/* Toolbar row */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        {/* Save indicator */}
        <div className="flex items-center gap-1.5 min-w-[80px]">
          {saveStatus === 'saving' && (
            <>
              <svg className="w-3.5 h-3.5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <span className="text-xs text-gray-400">Saving…</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              <span className="text-xs text-emerald-600 font-medium">Saved</span>
            </>
          )}
          {saveStatus === 'idle' && draftText.length > 0 && (
            <span className="text-xs text-gray-300">Auto-saved</span>
          )}
        </div>

        {/* Word count */}
        <div className={`text-sm font-bold tabular-nums ${wordCountColor(wordCount, lesson.wordTarget)}`}>
          {wordCount}
          <span className="text-gray-300 font-normal"> / {lesson.wordTarget} words</span>
        </div>
      </div>

      {/* Textarea */}
      <div className="flex-1 relative overflow-hidden">
        <textarea
          ref={textareaRef}
          value={draftText}
          onChange={(e) => onTextChange(e.target.value)}
          placeholder={`Start writing here…\n\n${lesson.suggestedStructure.introduction}`}
          disabled={isDone}
          className={`w-full h-full resize-none outline-none px-6 py-5 text-base leading-relaxed text-gray-800 placeholder-gray-300 font-['Georgia',serif] transition-colors ${
            isDone ? 'bg-gray-50 cursor-default' : 'bg-white focus:bg-white'
          }`}
          spellCheck
        />
      </div>

      {/* Word count progress bar */}
      <div className="flex-shrink-0 px-5 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${progressBarColor(wordCount, lesson.wordTarget)}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums w-10 text-right">
            {pct}%
          </span>
        </div>
        {isOnTarget && !isDone && (
          <p className="text-xs text-emerald-600 font-semibold mt-1.5 text-center">
            🎉 You&apos;ve reached the word target!
          </p>
        )}
      </div>

      {/* Mark complete */}
      <div className="flex-shrink-0 px-5 pb-5 pt-3 bg-white border-t border-gray-100">
        {isDone ? (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Lesson Complete!
            </div>
            <div className="flex gap-3">
              <Link
                href="/lessons?type=writing"
                className="flex-1 py-2 text-center bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                More Writing
              </Link>
              <Link
                href="/progress"
                className="flex-1 py-2 text-center bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                View Progress
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {!isOnTarget && (
              <p className="text-xs text-gray-400 text-center">
                Write at least {lesson.wordTarget} words before marking complete.
              </p>
            )}
            <button
              onClick={onMarkComplete}
              disabled={wordCount === 0}
              className={`w-full py-3 rounded-2xl font-bold text-sm transition-all shadow-sm ${
                wordCount === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isOnTarget
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:opacity-90'
                  : 'bg-gradient-to-r from-blue-400 to-violet-400 text-white hover:opacity-90'
              }`}
            >
              {isOnTarget ? '✓ Mark as Complete' : '✓ Mark as Complete (under target)'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Full-screen overlay ──────────────────────────────────────────────────────

function FullScreenWriter({
  lesson,
  draftText,
  saveStatus,
  textareaRef,
  onTextChange,
  onClose,
}: {
  lesson: WritingLesson;
  draftText: string;
  saveStatus: SaveStatus;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onTextChange: (text: string) => void;
  onClose: () => void;
}) {
  const wordCount  = countWords(draftText);
  const pct        = Math.min(100, Math.round((wordCount / lesson.wordTarget) * 100));
  const isOnTarget = wordCount >= lesson.wordTarget;

  // ESC to exit
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Mini toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className={`text-sm font-bold tabular-nums ${wordCountColor(wordCount, lesson.wordTarget)}`}>
            {wordCount} <span className="text-gray-300 font-normal">/ {lesson.wordTarget} words</span>
          </span>
          {isOnTarget && (
            <span className="text-xs text-emerald-600 font-semibold">🎉 Target reached!</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Save indicator */}
          {saveStatus === 'saving' && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Saving…
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
              Saved
            </span>
          )}

          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
            title="Exit full screen (Esc)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
            </svg>
            Exit full screen
          </button>
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={draftText}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Start writing here…"
        autoFocus
        className="flex-1 resize-none outline-none px-16 py-10 text-lg leading-loose text-gray-800 placeholder-gray-300 font-['Georgia',serif] max-w-3xl mx-auto w-full"
        spellCheck
      />

      {/* Bottom progress bar */}
      <div className="flex-shrink-0 px-6 pb-4">
        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-3xl mx-auto">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBarColor(wordCount, lesson.wordTarget)}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WritingLessonPage() {
  const params = useParams();
  const router = useRouter();
  const id     = params.id as string;

  const lesson = (writingLessons as WritingLesson[]).find((l) => l.id === id);

  // ─── State ──────────────────────────────────────────────────────────────

  const [draftText,        setDraftText]        = useState('');
  const [saveStatus,       setSaveStatus]       = useState<SaveStatus>('idle');
  const [fullScreen,       setFullScreen]       = useState(false);
  const [completed,        setCompleted]        = useState(false);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [mobileTab,        setMobileTab]        = useState<MobileTab>('prompt');

  // ─── Refs ────────────────────────────────────────────────────────────────

  const textareaRef      = useRef<HTMLTextAreaElement>(null) as React.RefObject<HTMLTextAreaElement>;
  const fullScreenRef    = useRef<HTMLTextAreaElement>(null) as React.RefObject<HTMLTextAreaElement>;
  const saveTimerRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startTimeRef     = useRef(Date.now());
  // For restoring cursor after vocabulary chip insert
  const pendingCursorRef = useRef<number | null>(null);

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push(`/login?redirect=/writing/${id}`);
      return;
    }
    if (lesson) {
      const saved = loadDraft(lesson.id);
      setDraftText(saved);
    }
    setAlreadyCompleted(getCompletedIds().includes(id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // ─── Cursor restore after vocab insert ──────────────────────────────────

  useLayoutEffect(() => {
    if (pendingCursorRef.current === null) return;
    const pos = pendingCursorRef.current;
    pendingCursorRef.current = null;

    // Set cursor in the visible textarea (or full-screen one if open)
    const ta = fullScreen ? fullScreenRef.current : textareaRef.current;
    if (ta) {
      ta.setSelectionRange(pos, pos);
      ta.focus();
    }
  }, [draftText, fullScreen]);

  // ─── Text change + auto-save ─────────────────────────────────────────────

  const handleTextChange = useCallback((text: string) => {
    setDraftText(text);

    if (saveTimerRef.current)  clearTimeout(saveTimerRef.current);
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);

    setSaveStatus('saving');
    saveTimerRef.current = setTimeout(() => {
      if (lesson) persistDraft(lesson.id, text);
      setSaveStatus('saved');
      clearTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }, 1500);
  }, [lesson]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (saveTimerRef.current)  clearTimeout(saveTimerRef.current);
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  // ─── Vocabulary chip insert ──────────────────────────────────────────────

  const handleInsertWord = useCallback((word: string) => {
    const ta = fullScreen ? fullScreenRef.current : textareaRef.current;
    const cursorPos = ta ? (ta.selectionStart ?? draftText.length) : draftText.length;
    const selEnd    = ta ? (ta.selectionEnd   ?? cursorPos)        : cursorPos;

    const before = draftText.slice(0, cursorPos);
    const after  = draftText.slice(selEnd);

    const spaceBefore = before.length > 0 && !/\s$/.test(before) ? ' ' : '';
    const spaceAfter  = after.length  > 0 && !/^\s/.test(after)  ? ' ' : '';

    const newText   = before + spaceBefore + word + spaceAfter + after;
    const newCursor = cursorPos + spaceBefore.length + word.length + spaceAfter.length;

    pendingCursorRef.current = newCursor;
    handleTextChange(newText);
  }, [draftText, fullScreen, handleTextChange]);

  // ─── Mark complete ───────────────────────────────────────────────────────

  const handleMarkComplete = useCallback(() => {
    if (!lesson || completed || alreadyCompleted) return;

    // Flush any pending auto-save immediately
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      persistDraft(lesson.id, draftText);
      setSaveStatus('saved');
      clearTimerRef.current = setTimeout(() => setSaveStatus('idle'), 2000);
    }

    const timeSpent = Math.round((Date.now() - startTimeRef.current) / 1000);
    markComplete(lesson.id, timeSpent, undefined, 'writing');
    setCompleted(true);

    // Fire-and-forget: upsert essay to Supabase writing_submissions.
    // Uses getSession() (reads local cache, no network) instead of
    // getUser() (makes an HTTP round-trip on every mark-complete).
    const currentDraft = draftText;
    const lessonId = lesson.id;
    (async () => {
      try {
        const supabase = getSupabase();
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;
        await supabase.from('writing_submissions').upsert(
          {
            user_id:    session.user.id,
            lesson_id:  lessonId,
            content:    currentDraft,
            word_count: countWords(currentDraft),
            saved_at:   new Date().toISOString(),
          },
          { onConflict: 'user_id,lesson_id' }
        );
      } catch {
        // Intentionally silent — local progress already saved
      }
    })();
  }, [lesson, completed, alreadyCompleted, draftText]);

  // ─── Guard ───────────────────────────────────────────────────────────────

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-5xl">✍️</div>
        <h2 className="text-xl font-bold text-gray-700">Lesson not found</h2>
        <Link href="/lessons?type=writing" className="text-blue-600 hover:underline text-sm">
          ← Back to Writing lessons
        </Link>
      </div>
    );
  }

  const isDone = completed || alreadyCompleted;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* Full-screen writing overlay */}
      {fullScreen && (
        <FullScreenWriter
          lesson={lesson}
          draftText={draftText}
          saveStatus={saveStatus}
          textareaRef={fullScreenRef}
          onTextChange={handleTextChange}
          onClose={() => setFullScreen(false)}
        />
      )}

      <div className="min-h-screen bg-gray-50">

        {/* Page header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-16 z-20">
          <div className="max-w-screen-xl mx-auto flex items-center gap-3">
            <Link
              href="/lessons?type=writing"
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 flex-shrink-0"
              title="Back to lessons"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
              </svg>
            </Link>

            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-gray-800 truncate">{lesson.title}</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400">{lesson.level}</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{lesson.durationMinutes} min</span>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-400">{lesson.wordTarget} word target</span>
                {isDone && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-xs text-emerald-600 font-semibold">✓ Completed</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Full-screen button */}
              {!isDone && (
                <button
                  onClick={() => setFullScreen(true)}
                  title="Full-screen writing mode"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                  </svg>
                  Focus mode
                </button>
              )}

              <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
                ✍️ Writing
              </span>
            </div>
          </div>
        </div>

        {/* ── MOBILE: tab switcher ── */}
        <div className="md:hidden">
          <div className="flex border-b border-gray-200 bg-white">
            <button
              onClick={() => setMobileTab('prompt')}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
                mobileTab === 'prompt'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              📋 Prompt & Ideas
            </button>
            <button
              onClick={() => setMobileTab('write')}
              className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
                mobileTab === 'write'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ✍️ Write
            </button>
          </div>

          {mobileTab === 'prompt' ? (
            <PromptPanel lesson={lesson} onInsertWord={handleInsertWord} />
          ) : (
            <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 10rem)' }}>
              {/* Mobile focus mode button */}
              {!isDone && (
                <div className="px-4 pt-3">
                  <button
                    onClick={() => setFullScreen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-semibold hover:bg-gray-200 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                    </svg>
                    Open focus mode
                  </button>
                </div>
              )}
              <WritingArea
                lesson={lesson}
                draftText={draftText}
                saveStatus={saveStatus}
                completed={completed}
                alreadyCompleted={alreadyCompleted}
                textareaRef={textareaRef}
                onTextChange={handleTextChange}
                onMarkComplete={handleMarkComplete}
              />
            </div>
          )}
        </div>

        {/* ── DESKTOP: split-screen ── */}
        <div className="hidden md:flex items-start max-w-screen-xl mx-auto">
          {/* Left 40%: prompt panel — sticky */}
          <div
            className="w-2/5 sticky border-r border-gray-200 bg-white overflow-hidden"
            style={{ top: 'calc(4rem + 57px)', height: 'calc(100vh - 4rem - 57px)' }}
          >
            <PromptPanel lesson={lesson} onInsertWord={handleInsertWord} />
          </div>

          {/* Right 60%: writing area */}
          <div
            className="w-3/5 bg-white"
            style={{ minHeight: 'calc(100vh - 4rem - 57px)' }}
          >
            <WritingArea
              lesson={lesson}
              draftText={draftText}
              saveStatus={saveStatus}
              completed={completed}
              alreadyCompleted={alreadyCompleted}
              textareaRef={textareaRef}
              onTextChange={handleTextChange}
              onMarkComplete={handleMarkComplete}
            />
          </div>
        </div>

      </div>
    </>
  );
}
