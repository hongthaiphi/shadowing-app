'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getUser } from '@/lib/auth';
import { markComplete, fetchCompletedIds } from '@/lib/progress';
import { getSupabase } from '@/lib/supabase';
import readingLessons from '@/data/reading-lessons.json';

// ─── Types ──────────────────────────────────────────────────────────────────

interface MultipleChoiceQuestion {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  answer: string; // 'A' | 'B' | 'C' | 'D'
  explanation?: string;
}

interface TFNGQuestion {
  id: string;
  type: 'true-false-not-given';
  question: string;
  answer: 'True' | 'False' | 'Not Given';
  explanation?: string;
}

interface FillBlankQuestion {
  id: string;
  type: 'fill-blank';
  question: string;
  answer: string; // pipe-separated alternatives e.g. "science|Science"
  explanation?: string;
}

interface ShortAnswerQuestion {
  id: string;
  type: 'short-answer';
  question: string;
  answer: string; // model answer shown after submit
}

type ReadingQuestion =
  | MultipleChoiceQuestion
  | TFNGQuestion
  | FillBlankQuestion
  | ShortAnswerQuestion;

interface ReadingLesson {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: 'reading';
  image?: string;
  durationMinutes: number;
  wordCount?: number;
  paragraphs: string[];
  questions: ReadingQuestion[];
}

type AnnotationType = 'highlight' | 'underline';
type AnnotationColor = 'yellow' | 'green' | 'pink' | 'blue';

interface Annotation {
  id: string;
  /** character offset from the start of paragraphs.join('\n\n') */
  start: number;
  end: number;
  type: AnnotationType;
  color: AnnotationColor;
}

type TextSegment = {
  text: string;
  annotation?: Annotation;
};

// ─── Constants ───────────────────────────────────────────────────────────────

const HIGHLIGHT_COLORS: Record<AnnotationColor, { bg: string; border: string; label: string }> = {
  yellow: { bg: 'bg-yellow-200',   border: 'border-yellow-400', label: 'Yellow' },
  green:  { bg: 'bg-green-200',    border: 'border-green-400',  label: 'Green'  },
  pink:   { bg: 'bg-pink-200',     border: 'border-pink-400',   label: 'Pink'   },
  blue:   { bg: 'bg-blue-200',     border: 'border-blue-400',   label: 'Blue'   },
};

const TFNG_OPTIONS: Array<'True' | 'False' | 'Not Given'> = ['True', 'False', 'Not Given'];

const FONT_SIZES = ['text-sm', 'text-base', 'text-lg', 'text-xl'] as const;
type FontSizeIndex = 0 | 1 | 2 | 3;

// ─── Utility: annotation storage ─────────────────────────────────────────────

const annCacheKey = (id: string) => `reading_ann_${id}`;

function annFromCache(lessonId: string): Annotation[] {
  try {
    const raw = localStorage.getItem(annCacheKey(lessonId));
    return raw ? (JSON.parse(raw) as Annotation[]) : [];
  } catch { return []; }
}

async function loadAnnotations(lessonId: string): Promise<Annotation[]> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return annFromCache(lessonId);
    const { data } = await supabase
      .from('reading_annotations')
      .select('annotations')
      .eq('user_id', user.id)
      .eq('lesson_id', lessonId)
      .single();
    const annotations = (data?.annotations as Annotation[]) ?? [];
    localStorage.setItem(annCacheKey(lessonId), JSON.stringify(annotations));
    return annotations;
  } catch {
    return annFromCache(lessonId);
  }
}

function saveAnnotations(lessonId: string, annotations: Annotation[]): void {
  // Write to cache immediately for instant UI
  localStorage.setItem(annCacheKey(lessonId), JSON.stringify(annotations));
  // Async persist to Supabase
  const supabase = getSupabase();
  supabase.auth.getUser().then(({ data }) => {
    if (!data.user) return;
    supabase.from('reading_annotations').upsert({
      user_id: data.user.id,
      lesson_id: lessonId,
      annotations,
    }).then();
  });
}

// ─── Utility: compute char offset of a DOM node inside the passage ───────────

/**
 * Given a Selection anchored inside a paragraph element with data-para-start,
 * returns [start, end] offsets relative to paragraphs.join('\n\n').
 * Returns null if the selection cannot be mapped.
 */
function getSelectionOffsets(
  selection: Selection,
  containerRef: React.RefObject<HTMLDivElement | null>
): [number, number] | null {
  if (!containerRef.current) return null;
  const { anchorNode, focusNode, anchorOffset, focusOffset } = selection;
  if (!anchorNode || !focusNode) return null;

  // Find the paragraph <p> element for a given DOM node
  function findPara(node: Node): HTMLElement | null {
    let cur: Node | null = node;
    while (cur && cur !== containerRef.current) {
      if (cur instanceof HTMLElement && cur.tagName === 'P' && cur.dataset.paraStart !== undefined) {
        return cur;
      }
      cur = cur.parentNode;
    }
    return null;
  }

  const anchorPara = findPara(anchorNode);
  const focusPara  = findPara(focusNode);
  if (!anchorPara || !focusPara) return null;

  const anchorParaStart = parseInt(anchorPara.dataset.paraStart ?? '0', 10);
  const focusParaStart  = parseInt(focusPara.dataset.paraStart ?? '0', 10);

  // Walk the text nodes inside a paragraph to get the offset from para start
  function getOffsetInPara(para: HTMLElement, targetNode: Node, targetOffset: number): number {
    let total = 0;
    const walker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (node === targetNode) return total + targetOffset;
      total += node.length;
    }
    return total;
  }

  const anchorAbsolute = anchorParaStart + getOffsetInPara(anchorPara, anchorNode, anchorOffset);
  const focusAbsolute  = focusParaStart  + getOffsetInPara(focusPara, focusNode, focusOffset);

  const start = Math.min(anchorAbsolute, focusAbsolute);
  const end   = Math.max(anchorAbsolute, focusAbsolute);
  if (start === end) return null;
  return [start, end];
}

/**
 * Build a list of TextSegments for a single paragraph given its absolute
 * start offset and the list of all annotations.
 */
function buildSegments(
  text: string,
  paraStart: number,
  annotations: Annotation[]
): TextSegment[] {
  const paraEnd = paraStart + text.length;

  // Gather annotations that overlap this paragraph
  const relevant = annotations
    .filter((a) => a.start < paraEnd && a.end > paraStart)
    .sort((a, b) => a.start - b.start);

  if (relevant.length === 0) return [{ text }];

  const segments: TextSegment[] = [];
  let cursor = 0; // relative to para start

  for (const ann of relevant) {
    const relStart = Math.max(0, ann.start - paraStart);
    const relEnd   = Math.min(text.length, ann.end - paraStart);

    if (relStart > cursor) {
      segments.push({ text: text.slice(cursor, relStart) });
    }
    if (relEnd > relStart) {
      segments.push({ text: text.slice(relStart, relEnd), annotation: ann });
    }
    cursor = Math.max(cursor, relEnd);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor) });
  }

  return segments;
}

// ─── Utility: answer checking ─────────────────────────────────────────────────

function checkFillBlank(userAnswer: string, correctAnswer: string): boolean {
  const alternatives = correctAnswer.split('|').map((s) => s.trim().toLowerCase());
  return alternatives.includes(userAnswer.trim().toLowerCase());
}

function checkMultipleChoice(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toUpperCase() === correctAnswer.trim().toUpperCase();
}

function checkTFNG(userAnswer: string, correctAnswer: string): boolean {
  return userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// Passage toolbar: font size, highlight colour, underline, clear
function PassageToolbar({
  fontSizeIdx,
  setFontSizeIdx,
  activeColor,
  setActiveColor,
  activeTool,
  setActiveTool,
  onClearAll,
}: {
  fontSizeIdx: FontSizeIndex;
  setFontSizeIdx: (i: FontSizeIndex) => void;
  activeColor: AnnotationColor;
  setActiveColor: (c: AnnotationColor) => void;
  activeTool: AnnotationType;
  setActiveTool: (t: AnnotationType) => void;
  onClearAll: () => void;
}) {
  return (
    <div className="flex items-center flex-wrap gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
      {/* Font size */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setFontSizeIdx(Math.max(0, fontSizeIdx - 1) as FontSizeIndex)}
          disabled={fontSizeIdx === 0}
          className="w-7 h-7 rounded-lg bg-white border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
          title="Decrease font size"
        >
          A<span className="text-xs">−</span>
        </button>
        <button
          onClick={() => setFontSizeIdx(Math.min(3, fontSizeIdx + 1) as FontSizeIndex)}
          disabled={fontSizeIdx === 3}
          className="w-7 h-7 rounded-lg bg-white border border-gray-200 font-bold text-gray-600 hover:bg-gray-100 disabled:opacity-40 flex items-center justify-center"
          title="Increase font size"
        >
          A<span className="text-sm">+</span>
        </button>
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Tool: highlight vs underline */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setActiveTool('highlight')}
          title="Highlight tool"
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            activeTool === 'highlight'
              ? 'bg-yellow-300 border-yellow-400 text-yellow-900'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          🖊 Highlight
        </button>
        <button
          onClick={() => setActiveTool('underline')}
          title="Underline tool"
          className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
            activeTool === 'underline'
              ? 'bg-blue-100 border-blue-400 text-blue-900'
              : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100'
          }`}
        >
          U̲ Underline
        </button>
      </div>

      <div className="h-5 w-px bg-gray-200" />

      {/* Colour picker (only for highlight) */}
      {activeTool === 'highlight' && (
        <div className="flex items-center gap-1">
          {(Object.keys(HIGHLIGHT_COLORS) as AnnotationColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setActiveColor(color)}
              title={HIGHLIGHT_COLORS[color].label}
              className={`w-5 h-5 rounded-full border-2 transition-all ${HIGHLIGHT_COLORS[color].bg} ${
                activeColor === color ? HIGHLIGHT_COLORS[color].border + ' scale-125' : 'border-transparent'
              }`}
            />
          ))}
        </div>
      )}

      <div className="ml-auto">
        <button
          onClick={onClearAll}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-200 bg-white text-red-500 hover:bg-red-50 transition-all"
        >
          ✕ Clear all
        </button>
      </div>
    </div>
  );
}

// Single annotated paragraph
function AnnotatedParagraph({
  text,
  paraStart,
  annotations,
  fontSizeClass,
  onRemove,
}: {
  text: string;
  paraStart: number;
  annotations: Annotation[];
  fontSizeClass: string;
  onRemove: (id: string) => void;
}) {
  const segments = buildSegments(text, paraStart, annotations);

  return (
    <p
      data-para-start={paraStart}
      className={`leading-relaxed text-gray-700 mb-4 ${fontSizeClass}`}
    >
      {segments.map((seg, idx) => {
        if (!seg.annotation) {
          return <span key={idx}>{seg.text}</span>;
        }
        const ann = seg.annotation;
        if (ann.type === 'underline') {
          return (
            <span
              key={idx}
              data-ann-id={ann.id}
              onClick={() => onRemove(ann.id)}
              className="underline decoration-2 decoration-blue-500 cursor-pointer hover:decoration-red-400 transition-colors"
              title="Click to remove underline"
            >
              {seg.text}
            </span>
          );
        }
        return (
          <span
            key={idx}
            data-ann-id={ann.id}
            onClick={() => onRemove(ann.id)}
            className={`cursor-pointer rounded-sm px-0.5 transition-opacity hover:opacity-70 ${HIGHLIGHT_COLORS[ann.color].bg}`}
            title="Click to remove highlight"
          >
            {seg.text}
          </span>
        );
      })}
    </p>
  );
}

// Multiple choice question
function MCQuestion({
  q,
  userAnswer,
  onChange,
  submitted,
}: {
  q: MultipleChoiceQuestion;
  userAnswer: string;
  onChange: (val: string) => void;
  submitted: boolean;
}) {
  const letters = ['A', 'B', 'C', 'D'];
  const isCorrect = checkMultipleChoice(userAnswer, q.answer);

  return (
    <div className="space-y-2">
      {q.options.map((opt, i) => {
        const letter = letters[i];
        const isSelected = userAnswer === letter;
        const isAnswer = letter === q.answer;
        let optClass =
          'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ';

        if (!submitted) {
          optClass += isSelected
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-blue-50/50';
        } else {
          if (isAnswer) {
            optClass += 'border-emerald-400 bg-emerald-50';
          } else if (isSelected && !isCorrect) {
            optClass += 'border-red-400 bg-red-50';
          } else {
            optClass += 'border-gray-200 bg-white opacity-60';
          }
        }

        return (
          <label key={letter} className={optClass}>
            <input
              type="radio"
              name={q.id}
              value={letter}
              checked={isSelected}
              onChange={() => !submitted && onChange(letter)}
              disabled={submitted}
              className="mt-0.5 accent-blue-500 flex-shrink-0"
            />
            <span className="text-sm text-gray-700">
              <span className="font-bold mr-1">{letter}.</span>
              {opt}
            </span>
            {submitted && isAnswer && (
              <span className="ml-auto text-emerald-600 text-sm flex-shrink-0">✓</span>
            )}
            {submitted && isSelected && !isCorrect && isSelected && (
              <span className="ml-auto text-red-500 text-sm flex-shrink-0">✗</span>
            )}
          </label>
        );
      })}
      {submitted && q.explanation && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </div>
      )}
    </div>
  );
}

// True / False / Not Given question
function TFNGQuestion({
  q,
  userAnswer,
  onChange,
  submitted,
}: {
  q: TFNGQuestion;
  userAnswer: string;
  onChange: (val: string) => void;
  submitted: boolean;
}) {
  const isCorrect = checkTFNG(userAnswer, q.answer);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {TFNG_OPTIONS.map((opt) => {
          const isSelected = userAnswer === opt;
          const isAnswer = opt.toLowerCase() === q.answer.toLowerCase();
          let btnClass =
            'px-3 py-2 rounded-xl border text-sm font-semibold transition-all ';

          if (!submitted) {
            btnClass += isSelected
              ? 'border-blue-400 bg-blue-500 text-white'
              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300';
          } else {
            if (isAnswer) {
              btnClass += 'border-emerald-400 bg-emerald-500 text-white';
            } else if (isSelected && !isCorrect) {
              btnClass += 'border-red-400 bg-red-500 text-white';
            } else {
              btnClass += 'border-gray-200 bg-white text-gray-400 opacity-60';
            }
          }

          return (
            <button
              key={opt}
              onClick={() => !submitted && onChange(opt)}
              disabled={submitted}
              className={btnClass}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && q.explanation && (
        <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </div>
      )}
    </div>
  );
}

// Fill in the blank question
function FillBlankQuestion({
  q,
  userAnswer,
  onChange,
  submitted,
}: {
  q: FillBlankQuestion;
  userAnswer: string;
  onChange: (val: string) => void;
  submitted: boolean;
}) {
  const isCorrect = checkFillBlank(userAnswer, q.answer);
  const displayAnswer = q.answer.split('|')[0]; // show first alternative as model answer

  return (
    <div className="space-y-2">
      <input
        type="text"
        value={userAnswer}
        onChange={(e) => !submitted && onChange(e.target.value)}
        disabled={submitted}
        placeholder="Type your answer…"
        className={`w-full px-4 py-2.5 border rounded-xl text-sm transition-all outline-none ${
          !submitted
            ? 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            : isCorrect
            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
            : 'border-red-400 bg-red-50 text-red-800'
        }`}
      />
      {submitted && (
        <div className={`flex items-center gap-2 text-sm font-semibold ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
          {isCorrect ? '✓ Correct!' : `✗ Answer: ${displayAnswer}`}
        </div>
      )}
      {submitted && q.explanation && (
        <div className="mt-1 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="font-semibold">Explanation: </span>{q.explanation}
        </div>
      )}
    </div>
  );
}

// Short answer question (self-graded)
function ShortAnswerQuestionComp({
  q,
  userAnswer,
  onChange,
  submitted,
  selfChecked,
  onSelfCheck,
}: {
  q: ShortAnswerQuestion;
  userAnswer: string;
  onChange: (val: string) => void;
  submitted: boolean;
  selfChecked: boolean;
  onSelfCheck: (val: boolean) => void;
}) {
  return (
    <div className="space-y-2">
      <textarea
        value={userAnswer}
        onChange={(e) => !submitted && onChange(e.target.value)}
        disabled={submitted}
        placeholder="Write your answer here…"
        rows={2}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm resize-none transition-all outline-none ${
          !submitted
            ? 'border-gray-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-100'
            : 'border-gray-300 bg-gray-50'
        }`}
      />
      {submitted && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-sm">
          <p className="font-semibold text-blue-800 mb-1">Model answer:</p>
          <p className="text-blue-700">{q.answer}</p>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selfChecked}
              onChange={(e) => onSelfCheck(e.target.checked)}
              className="accent-emerald-500 w-4 h-4"
            />
            <span className="text-xs font-semibold text-emerald-700">My answer is correct</span>
          </label>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ReadingLessonPage() {
  const params  = useParams();
  const router  = useRouter();
  const id      = params.id as string;

  // Lesson data
  const lesson = (readingLessons as ReadingLesson[]).find((l) => l.id === id);

  // Auth & completion
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);

  // Annotations state
  const [annotations,  setAnnotations]  = useState<Annotation[]>([]);
  const [activeColor,  setActiveColor]  = useState<AnnotationColor>('yellow');
  const [activeTool,   setActiveTool]   = useState<AnnotationType>('highlight');
  const [fontSizeIdx,  setFontSizeIdx]  = useState<FontSizeIndex>(1);
  const passageRef = useRef<HTMLDivElement>(null);

  // Answers state: keyed by question id
  const [answers,       setAnswers]       = useState<Record<string, string>>({});
  const [selfChecks,    setSelfChecks]    = useState<Record<string, boolean>>({});
  const [submitted,     setSubmitted]     = useState(false);
  const [score,         setScore]         = useState<number | null>(null);

  // UI state
  const [mobileTab,    setMobileTab]    = useState<'passage' | 'questions'>('passage');
  const [startTime]                      = useState(Date.now());
  const [completed,    setCompleted]    = useState(false);

  // ─── Init ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.push(`/login?redirect=/reading/${id}`);
      return;
    }
    if (lesson) {
      loadAnnotations(lesson.id).then(setAnnotations);
    }
    fetchCompletedIds().then((ids) => setAlreadyCompleted(ids.includes(id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (lesson) document.title = `${lesson.title} | ShadowSpeak`;
    return () => { document.title = 'ShadowSpeak — English Practice'; };
  }, [lesson]);

  // ─── Annotation helpers ──────────────────────────────────────────────────

  // Pre-compute the absolute start offset for each paragraph
  const paraStarts = useCallback((): number[] => {
    if (!lesson) return [];
    const starts: number[] = [];
    let offset = 0;
    lesson.paragraphs.forEach((p, i) => {
      starts.push(offset);
      offset += p.length + (i < lesson.paragraphs.length - 1 ? 2 : 0); // '\n\n' = 2 chars
    });
    return starts;
  }, [lesson]);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !passageRef.current) return;

    const offsets = getSelectionOffsets(selection, passageRef);
    if (!offsets) return;
    const [start, end] = offsets;

    const newAnn: Annotation = {
      id:    `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      start,
      end,
      type:  activeTool,
      color: activeTool === 'highlight' ? activeColor : 'blue',
    };

    setAnnotations((prev) => {
      const next = [...prev, newAnn];
      saveAnnotations(id, next);
      return next;
    });
    selection.removeAllRanges();
  }, [activeTool, activeColor, id]);

  const removeAnnotation = useCallback((annId: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((a) => a.id !== annId);
      saveAnnotations(id, next);
      return next;
    });
  }, [id]);

  const clearAllAnnotations = useCallback(() => {
    setAnnotations([]);
    saveAnnotations(id, []);
  }, [id]);

  // ─── Answer helpers ──────────────────────────────────────────────────────

  const setAnswer = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const setSelfCheck = (qId: string, val: boolean) => {
    setSelfChecks((prev) => ({ ...prev, [qId]: val }));
  };

  const handleSubmit = () => {
    if (!lesson) return;
    let autoCorrect = 0;
    let autoTotal   = 0;

    lesson.questions.forEach((q) => {
      if (q.type === 'short-answer') return; // self-graded, counted separately
      autoTotal++;
      const ans = answers[q.id] ?? '';
      if (q.type === 'multiple-choice' && checkMultipleChoice(ans, q.answer)) autoCorrect++;
      if (q.type === 'true-false-not-given' && checkTFNG(ans, (q as TFNGQuestion).answer)) autoCorrect++;
      if (q.type === 'fill-blank' && checkFillBlank(ans, (q as FillBlankQuestion).answer)) autoCorrect++;
    });

    setSubmitted(true);
    // Score finalised after self-checks via handleMarkComplete
    const pct = autoTotal > 0 ? Math.round((autoCorrect / lesson.questions.length) * 100) : 0;
    setScore(pct);
  };

  const handleMarkComplete = () => {
    if (!lesson || completed) return;
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    // Re-calc including self-checks
    if (submitted) {
      let correct = 0;
      lesson.questions.forEach((q) => {
        const ans = answers[q.id] ?? '';
        if (q.type === 'multiple-choice' && checkMultipleChoice(ans, q.answer)) correct++;
        else if (q.type === 'true-false-not-given' && checkTFNG(ans, (q as TFNGQuestion).answer)) correct++;
        else if (q.type === 'fill-blank' && checkFillBlank(ans, (q as FillBlankQuestion).answer)) correct++;
        else if (q.type === 'short-answer' && selfChecks[q.id]) correct++;
      });
      const finalScore = Math.round((correct / lesson.questions.length) * 100);
      markComplete(lesson.id, timeSpent, finalScore, 'reading');
      setScore(finalScore);
    } else {
      markComplete(lesson.id, timeSpent, undefined, 'reading');
    }

    setCompleted(true);
  };

  // ─── Guard ───────────────────────────────────────────────────────────────

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-5xl">📖</div>
        <h2 className="text-xl font-bold text-gray-700">Lesson not found</h2>
        <Link href="/lessons?type=reading" className="text-blue-600 hover:underline text-sm">
          ← Back to Reading lessons
        </Link>
      </div>
    );
  }

  const starts     = paraStarts();
  const fontClass  = FONT_SIZES[fontSizeIdx];
  const totalQ     = lesson.questions.length;
  const shortAnswerCount = lesson.questions.filter((q) => q.type === 'short-answer').length;

  // ─── Passage Panel ───────────────────────────────────────────────────────

  const passagePanel = (
    <div className="flex flex-col h-full">
      {/* Passage toolbar */}
      <PassageToolbar
        fontSizeIdx={fontSizeIdx}
        setFontSizeIdx={setFontSizeIdx}
        activeColor={activeColor}
        setActiveColor={setActiveColor}
        activeTool={activeTool}
        setActiveTool={setActiveTool}
        onClearAll={clearAllAnnotations}
      />

      {/* Lesson image */}
      {lesson.image && (
        <div className="mx-4 mt-4 rounded-xl overflow-hidden relative h-40">
          <Image
            src={lesson.image}
            alt={lesson.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority={false}
          />
        </div>
      )}

      {/* Scrollable passage body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div
          ref={passageRef}
          onMouseUp={handleMouseUp}
          className="select-text"
        >
          {lesson.paragraphs.map((para, i) => (
            <AnnotatedParagraph
              key={i}
              text={para}
              paraStart={starts[i]}
              annotations={annotations}
              fontSizeClass={fontClass}
              onRemove={removeAnnotation}
            />
          ))}
        </div>

        {/* Word count */}
        {lesson.wordCount && (
          <p className="text-xs text-gray-400 mt-2 text-right">
            {lesson.wordCount} words
          </p>
        )}
      </div>
    </div>
  );

  // ─── Questions Panel ─────────────────────────────────────────────────────

  const questionsPanel = (
    <div className="px-5 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-800">Questions</h2>
        <span className="text-xs text-gray-400">{totalQ} question{totalQ !== 1 ? 's' : ''}</span>
      </div>

      {/* Score banner */}
      {submitted && score !== null && (
        <div className={`rounded-2xl p-4 text-center border ${
          score >= 80 ? 'bg-emerald-50 border-emerald-200' :
          score >= 50 ? 'bg-amber-50 border-amber-200' :
          'bg-red-50 border-red-200'
        }`}>
          <p className={`text-3xl font-black mb-1 ${
            score >= 80 ? 'text-emerald-600' :
            score >= 50 ? 'text-amber-600' :
            'text-red-600'
          }`}>{score}%</p>
          <p className="text-sm text-gray-600">
            {score >= 80 ? '🎉 Excellent work!' : score >= 50 ? '👍 Good effort!' : '📚 Keep practising!'}
          </p>
          {shortAnswerCount > 0 && !completed && (
            <p className="text-xs text-gray-400 mt-1">
              Mark short-answer questions correct below, then click &quot;Mark Complete&quot;.
            </p>
          )}
        </div>
      )}

      {/* Individual questions */}
      {lesson.questions.map((q, idx) => (
        <div key={q.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-black mr-2 flex-shrink-0">
              {idx + 1}
            </span>
            {q.question}
          </p>

          {q.type === 'multiple-choice' && (
            <MCQuestion
              q={q as MultipleChoiceQuestion}
              userAnswer={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
              submitted={submitted}
            />
          )}
          {q.type === 'true-false-not-given' && (
            <TFNGQuestion
              q={q as TFNGQuestion}
              userAnswer={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
              submitted={submitted}
            />
          )}
          {q.type === 'fill-blank' && (
            <FillBlankQuestion
              q={q as FillBlankQuestion}
              userAnswer={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
              submitted={submitted}
            />
          )}
          {q.type === 'short-answer' && (
            <ShortAnswerQuestionComp
              q={q as ShortAnswerQuestion}
              userAnswer={answers[q.id] ?? ''}
              onChange={(v) => setAnswer(q.id, v)}
              submitted={submitted}
              selfChecked={selfChecks[q.id] ?? false}
              onSelfCheck={(v) => setSelfCheck(q.id, v)}
            />
          )}
        </div>
      ))}

      {/* Submit / complete buttons */}
      <div className="pt-2 space-y-3">
        {!submitted ? (
          <button
            onClick={handleSubmit}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
          >
            Submit Answers
          </button>
        ) : !completed ? (
          <button
            onClick={handleMarkComplete}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
          >
            ✓ Mark as Complete
          </button>
        ) : (
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-100 text-emerald-700 rounded-2xl font-bold text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Lesson Complete!
            </div>
            <div className="flex gap-3 justify-center">
              <Link
                href="/lessons?type=reading"
                className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                More Reading
              </Link>
              <Link
                href="/progress"
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all"
              >
                View Progress
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-screen-xl mx-auto flex items-center gap-3">
          <Link
            href="/lessons?type=reading"
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title="Back to lessons"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="font-bold text-gray-800 truncate">{lesson.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-gray-400">{lesson.level}</span>
              <span className="text-gray-300">·</span>
              <span className="text-xs text-gray-400">{lesson.durationMinutes} min</span>
              {(alreadyCompleted || completed) && (
                <>
                  <span className="text-gray-300">·</span>
                  <span className="text-xs text-emerald-600 font-semibold">✓ Completed</span>
                </>
              )}
            </div>
          </div>
          <span className="hidden sm:inline-block text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700">
            📖 Reading
          </span>
        </div>
      </div>

      {/* ── MOBILE: tab switcher ── */}
      <div className="md:hidden">
        <div className="flex border-b border-gray-200 bg-white sticky top-16 z-20">
          <button
            onClick={() => setMobileTab('passage')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              mobileTab === 'passage'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📄 Passage
          </button>
          <button
            onClick={() => setMobileTab('questions')}
            className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 ${
              mobileTab === 'questions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ❓ Questions ({totalQ})
          </button>
        </div>
        <div>
          {mobileTab === 'passage' ? passagePanel : questionsPanel}
        </div>
      </div>

      {/* ── DESKTOP: split-screen ── */}
      <div className="hidden md:flex items-start max-w-screen-xl mx-auto">
        {/* Left: passage — sticky, full viewport height minus navbar (4rem) + header */}
        <div
          className="w-1/2 sticky top-16 border-r border-gray-200 bg-white overflow-hidden"
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          {passagePanel}
        </div>

        {/* Right: questions — natural scroll */}
        <div className="w-1/2 bg-gray-50 min-h-screen">
          {questionsPanel}
        </div>
      </div>
    </div>
  );
}
