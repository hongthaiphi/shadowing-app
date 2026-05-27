'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getSupabase } from '@/lib/supabase';
import { loadTopics } from '@/lib/topics';
import { loadLevels, getLevelColor } from '@/lib/levels';

// ─── Types ────────────────────────────────────────────────────────────────────

// Fix #9: ModalMode at module scope (was inside component body)
type ModalMode = 'add' | 'edit' | null;

interface Question {
  id:           string;
  type:         'multiple-choice' | 'true-false-not-given' | 'fill-blank' | 'short-answer';
  question:     string;
  options?:     string[];
  answer:       string;
  explanation?: string;
}

interface ReadingLesson {
  id:               string;
  title:            string;
  level:            string;
  topic:            string;
  // Fix #2: allow null so we don't need `null as unknown as undefined`
  image_url?:       string | null;
  word_count?:      number;
  duration_minutes: number;
  paragraphs:       string[];
  questions:        Question[];
  created_at?:      string;
  updated_at?:      string;
}

type FormState = Omit<ReadingLesson, 'id' | 'created_at' | 'updated_at'>;

const EMPTY_FORM: FormState = {
  title:            '',
  level:            'Starter',
  topic:            'school',
  image_url:        null,
  word_count:       undefined,
  duration_minutes: 10,
  paragraphs:       [],
  questions:        [],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fix #10: add random suffix to prevent millisecond collisions
function generateId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  return `r_${slug}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function validateQuestionsJson(
  raw: string,
): { ok: true; questions: Question[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return { ok: false, error: 'Must be a JSON array' };
    for (const q of parsed) {
      if (!q.id || !q.type || !q.question || q.answer === undefined) {
        return {
          ok: false,
          error: `Question missing required field (id, type, question, answer): ${JSON.stringify(q).slice(0, 80)}`,
        };
      }
      const validTypes = ['multiple-choice', 'true-false-not-given', 'fill-blank', 'short-answer'];
      if (!validTypes.includes(q.type)) {
        return { ok: false, error: `Unknown question type: "${q.type}"` };
      }
      if (q.type === 'multiple-choice' && (!Array.isArray(q.options) || q.options.length < 2)) {
        return { ok: false, error: `multiple-choice question "${q.id}" needs at least 2 options` };
      }
    }
    return { ok: true, questions: parsed as Question[] };
  } catch {
    return { ok: false, error: 'Invalid JSON — check for missing commas or brackets' };
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Fix #3: removed unused `error` prop — save errors are shown inline in the modal body
function StatusBadge({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) return <span className="text-xs text-blue-600 font-medium">Saving…</span>;
  if (saved)  return <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>;
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ReadingAdmin() {
  const [lessons, setLessons]         = useState<ReadingLesson[]>([]);
  const [loading, setLoading]         = useState(true);
  const [loadError, setLoadError]     = useState('');

  const [modalMode, setModalMode]     = useState<ModalMode>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [paragraphsText, setParagraphsText] = useState('');
  const [questionsJson, setQuestionsJson]   = useState('');
  const [questionsError, setQuestionsError] = useState('');

  const [deleteId, setDeleteId]       = useState<string | null>(null);
  // Fix #6: replace alert() with inline error state for delete
  const [deleteError, setDeleteError] = useState('');

  const [saving, setSaving]           = useState(false);
  const [saveError, setSaveError]     = useState('');
  const [saveOk, setSaveOk]           = useState(false);

  // Fix #4: memoize localStorage reads — not called on every render
  const topics = useMemo(() => loadTopics(), []);
  const levels = useMemo(() => loadLevels(), []);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadLessons = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('reading_lessons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      setLessons((data ?? []) as ReadingLesson[]);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadLessons(); }, [loadLessons]);

  // Fix #11: close modal on Escape key
  useEffect(() => {
    if (!modalMode) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeModal(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalMode]);

  // ── Modal helpers ─────────────────────────────────────────────────────────────
  function openAdd() {
    setForm({
      ...EMPTY_FORM,
      topic: topics[0]?.id || 'school',
      level: levels[0]?.id || 'Starter',
    });
    setParagraphsText('');
    setQuestionsJson('');
    setQuestionsError('');
    setEditingId(null);
    setSaveError('');
    setSaveOk(false);
    setModalMode('add');
  }

  function openEdit(lesson: ReadingLesson) {
    setForm({
      title:            lesson.title,
      level:            lesson.level,
      topic:            lesson.topic,
      image_url:        lesson.image_url ?? null,
      word_count:       lesson.word_count,
      duration_minutes: lesson.duration_minutes,
      paragraphs:       lesson.paragraphs,
      questions:        lesson.questions,
    });
    setParagraphsText((lesson.paragraphs ?? []).join('\n\n'));
    setQuestionsJson(JSON.stringify(lesson.questions ?? [], null, 2));
    setQuestionsError('');
    setEditingId(lesson.id);
    setSaveError('');
    setSaveOk(false);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setQuestionsError('');
    setSaveError('');
  }

  // ── Build + validate ──────────────────────────────────────────────────────────
  function buildLesson():
    | { ok: false; msg: string }
    | { ok: true; lesson: Omit<ReadingLesson, 'created_at' | 'updated_at'> } {
    if (!form.title.trim()) return { ok: false, msg: 'Title is required' };

    const paragraphs = paragraphsText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
    if (paragraphs.length === 0) return { ok: false, msg: 'At least one paragraph is required' };

    // Fix #12: validate image URL format
    const imageUrl = form.image_url?.trim() || null;
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
      return { ok: false, msg: 'Image URL must start with http:// or https://' };
    }

    const qResult = validateQuestionsJson(questionsJson || '[]');
    if (!qResult.ok) {
      setQuestionsError(qResult.error);
      return { ok: false, msg: 'Fix questions JSON first' };
    }
    setQuestionsError('');

    const id = modalMode === 'edit' && editingId ? editingId : generateId(form.title);

    return {
      ok: true,
      lesson: {
        id,
        title:            form.title.trim(),
        level:            form.level,
        topic:            form.topic,
        // Fix #2: no more `null as unknown as undefined` cast
        image_url:        imageUrl,
        // Use != null (not falsy) so an explicit 0 is preserved rather than
        // silently replaced by the auto-calculation (0 is falsy in JS).
        word_count:       form.word_count != null
          ? Number(form.word_count)
          : paragraphs.join(' ').split(/\s+/).length,
        duration_minutes: Number(form.duration_minutes) || 10,
        paragraphs,
        questions:        qResult.questions,
      },
    };
  }

  // ── Save (upsert) ─────────────────────────────────────────────────────────────
  async function handleSave() {
    const result = buildLesson();
    if (!result.ok) { setSaveError(result.msg); return; }

    setSaving(true);
    setSaveError('');
    setSaveOk(false);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('reading_lessons')
        .upsert(result.lesson, { onConflict: 'id' });
      if (error) throw new Error(error.message);

      // Reload list first, THEN close — ensures a reload failure remains
      // visible in saveError rather than being cleared by closeModal().
      setSaveOk(true);
      await loadLessons();
      setTimeout(() => setSaveOk(false), 3000);
      closeModal();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    setDeleteError('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('reading_lessons').delete().eq('id', id);
      if (error) throw new Error(error.message);
      setDeleteId(null);
      await loadLessons();
    } catch (err) {
      // Fix #6: show error in modal, not via alert()
      setDeleteError((err as Error).message);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Reading Lessons</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? 'Loading…'
              : `${lessons.length} lesson${lessons.length !== 1 ? 's' : ''} in Supabase`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadLessons}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Reading Lesson
          </button>
        </div>
      </div>

      {/* Load error */}
      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',    value: lessons.length,                                                                    color: 'text-green-700',  bg: 'bg-green-50 border-green-100'   },
          { label: 'Starter',  value: lessons.filter((l) => l.level === 'Starter').length,                               color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100'     },
          { label: 'Level 1',  value: lessons.filter((l) => l.level === 'Level 1').length,                               color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Level 2+', value: lessons.filter((l) => l.level !== 'Starter' && l.level !== 'Level 1').length,     color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📖</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No reading lessons yet</h3>
          <p className="text-gray-400">Click &ldquo;Add Reading Lesson&rdquo; to create the first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Topic</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Words</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Qs</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Updated</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lessons.map((lesson) => (
                  <tr key={lesson.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{lesson.title}</span>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">{lesson.id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelColor(lesson.level)}`}>
                        {lesson.level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 capitalize">{lesson.topic}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{lesson.word_count ?? '—'}</td>
                    <td className="px-5 py-4 text-sm text-gray-500">{lesson.questions?.length ?? 0}</td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {lesson.updated_at ? formatDate(lesson.updated_at) : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(lesson)}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => { setDeleteId(lesson.id); setDeleteError(''); }}
                          className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Add / Edit Modal ────────────────────────────────────────────────────── */}
      {/* Fix #11: Escape key listener added via useEffect above */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  {modalMode === 'add' ? '📖 Add Reading Lesson' : '✏️ Edit Reading Lesson'}
                </h3>
                {editingId && (
                  <p className="text-xs text-gray-400 font-mono mt-0.5">{editingId}</p>
                )}
              </div>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close (Esc)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. A Day at the Market"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level *</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                  >
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic *</label>
                  <select
                    value={form.topic}
                    onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 bg-white"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Word Count
                    <span className="text-gray-400 font-normal ml-1">(auto-calculated if empty)</span>
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.word_count ?? ''}
                    onChange={(e) => setForm((f) => ({
                      ...f,
                      word_count: e.target.value ? Number(e.target.value) : undefined,
                    }))}
                    placeholder="Auto"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
                <div className="sm:col-span-2">
                  {/* Fix #12: URL validation happens in buildLesson; placeholder communicates requirement */}
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Image URL
                    <span className="text-gray-400 font-normal ml-1">(optional — must start with https://)</span>
                  </label>
                  <input
                    type="text"
                    value={form.image_url ?? ''}
                    onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value || null }))}
                    placeholder="https://example.com/image.jpg"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                </div>
              </div>

              {/* Paragraphs */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Passage Paragraphs *
                  <span className="text-gray-400 font-normal ml-1">(separate paragraphs with a blank line)</span>
                </label>
                <textarea
                  value={paragraphsText}
                  onChange={(e) => setParagraphsText(e.target.value)}
                  rows={10}
                  placeholder={`First paragraph of the passage.\n\nSecond paragraph of the passage.\n\nThird paragraph…`}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-300 resize-y font-mono"
                />
                <p className="text-xs text-gray-400 mt-1">
                  {paragraphsText.split(/\n{2,}/).filter((p) => p.trim()).length} paragraph(s) detected
                </p>
              </div>

              {/* Questions JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-gray-700">
                    Questions (JSON)
                    <span className="text-gray-400 font-normal ml-1">— leave empty for passage-only lesson</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const r = validateQuestionsJson(questionsJson || '[]');
                      setQuestionsError(r.ok ? '' : r.error);
                    }}
                    className="text-xs font-semibold text-blue-600 px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Validate JSON
                  </button>
                </div>
                <textarea
                  value={questionsJson}
                  onChange={(e) => { setQuestionsJson(e.target.value); setQuestionsError(''); }}
                  rows={12}
                  placeholder={JSON.stringify([{
                    id: 'q1',
                    type: 'multiple-choice',
                    question: 'What is the main topic of the passage?',
                    options: ['A. School', 'B. Work', 'C. Travel', 'D. Food'],
                    answer: 'A',
                    explanation: 'The passage is about school.',
                  }], null, 2)}
                  className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 resize-y font-mono ${
                    questionsError
                      ? 'border-red-300 focus:ring-red-300'
                      : 'border-gray-200 focus:ring-green-300'
                  }`}
                />
                {questionsError && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {questionsError}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Supported types:{' '}
                  {['multiple-choice', 'true-false-not-given', 'fill-blank', 'short-answer'].map((t) => (
                    <code key={t} className="bg-gray-100 px-1 rounded mr-1">{t}</code>
                  ))}
                </p>
              </div>

              {/* Save error */}
              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex items-center justify-between gap-3">
              {/* Fix #3: StatusBadge no longer has a dead error prop */}
              <StatusBadge saving={saving} saved={saveOk} />
              <div className="flex items-center gap-3">
                <button
                  onClick={closeModal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || !paragraphsText.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {saving && (
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {modalMode === 'add' ? 'Add Lesson' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ──────────────────────────────────────────────────────── */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Reading Lesson?</h3>
            <p className="text-gray-500 text-sm mb-1">This will permanently remove the lesson from Supabase.</p>
            <p className="text-gray-400 text-xs font-mono mb-4">{deleteId}</p>
            {/* Fix #6: inline error replaces alert() */}
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {deleteError}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setDeleteId(null); setDeleteError(''); }}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
