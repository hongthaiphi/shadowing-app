'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import { fetchTopics, type Topic } from '@/lib/topics';
import { fetchLevels, getLevelColor, type Level } from '@/lib/levels';

// ─── Types ────────────────────────────────────────────────────────────────────

// Fix #9: ModalMode at module scope (was inside component body)
type ModalMode = 'add' | 'edit' | null;

type TaskType = 'descriptive' | 'opinion' | 'narrative' | 'compare-contrast';

interface SuggestedStructure {
  introduction: string;
  body:         string[];
  conclusion:   string;
}

interface WritingLesson {
  id:                   string;
  title:                string;
  level:                string;
  topic:                string;
  task_type:            TaskType;
  word_target:          number;
  duration_minutes:     number;
  prompt:               string;
  requirements:         string[];
  suggested_ideas:      string[];
  suggested_vocabulary: string[];
  suggested_structure:  SuggestedStructure;
  created_at?:          string;
  updated_at?:          string;
}

type FormState = Omit<WritingLesson, 'id' | 'created_at' | 'updated_at'>;

const TASK_TYPE_OPTIONS: { value: TaskType; label: string }[] = [
  { value: 'descriptive',      label: '📝 Descriptive'        },
  { value: 'opinion',          label: '💬 Opinion'            },
  { value: 'narrative',        label: '📖 Narrative'          },
  { value: 'compare-contrast', label: '⚖️ Compare & Contrast'  },
];

const EMPTY_FORM: FormState = {
  title:                '',
  level:                'Starter',
  topic:                'school',
  task_type:            'descriptive',
  word_target:          100,
  duration_minutes:     10,
  prompt:               '',
  requirements:         [],
  suggested_ideas:      [],
  suggested_vocabulary: [],
  suggested_structure:  { introduction: '', body: [], conclusion: '' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Fix #10: add random suffix to prevent millisecond collisions
function generateId(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  return `w_${slug}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function linesToArray(text: string): string[] {
  return text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
}

function commaToArray(text: string): string[] {
  return text.split(',').map((l) => l.trim()).filter((l) => l.length > 0);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

// Fix #5: StatusBadge added (WritingAdmin was missing save confirmation)
// Fix #3: no error prop — save errors are shown inline in the modal body
function StatusBadge({ saving, saved }: { saving: boolean; saved: boolean }) {
  if (saving) return <span className="text-xs text-blue-600 font-medium">Saving…</span>;
  if (saved)  return <span className="text-xs text-emerald-600 font-medium">✓ Saved</span>;
  return null;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function WritingAdmin() {
  const [lessons, setLessons]       = useState<WritingLesson[]>([]);
  const [loading, setLoading]       = useState(true);
  const [loadError, setLoadError]   = useState('');

  const [modalMode, setModalMode]   = useState<ModalMode>(null);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);

  // Human-friendly string bindings for array fields
  const [requirementsText, setRequirementsText] = useState('');
  const [ideasText, setIdeasText]               = useState('');
  const [vocabText, setVocabText]               = useState('');
  const [structIntro, setStructIntro]           = useState('');
  const [structBodyText, setStructBodyText]     = useState('');
  const [structConclusion, setStructConclusion] = useState('');

  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState('');
  // Fix #5: added saveOk state for post-save confirmation
  const [saveOk, setSaveOk]         = useState(false);

  const [deleteId, setDeleteId]     = useState<string | null>(null);
  // Fix #6: replace alert() with inline error state for delete
  const [deleteError, setDeleteError] = useState('');

  const [topics, setTopics] = useState<Topic[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadLessons = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('writing_lessons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      setLessons((data ?? []) as WritingLesson[]);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLessons();
    fetchTopics().then(setTopics);
    fetchLevels().then(setLevels);
  }, [loadLessons]);

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
    setForm({ ...EMPTY_FORM, topic: topics[0]?.id || 'school', level: levels[0]?.id || 'Starter' });
    setRequirementsText('');
    setIdeasText('');
    setVocabText('');
    setStructIntro('');
    setStructBodyText('');
    setStructConclusion('');
    setEditingId(null);
    setSaveError('');
    setSaveOk(false);
    setModalMode('add');
  }

  function openEdit(lesson: WritingLesson) {
    setForm({
      title:                lesson.title,
      level:                lesson.level,
      topic:                lesson.topic,
      task_type:            lesson.task_type,
      word_target:          lesson.word_target,
      duration_minutes:     lesson.duration_minutes,
      prompt:               lesson.prompt,
      requirements:         lesson.requirements,
      suggested_ideas:      lesson.suggested_ideas,
      suggested_vocabulary: lesson.suggested_vocabulary,
      suggested_structure:  lesson.suggested_structure,
    });
    setRequirementsText((lesson.requirements ?? []).join('\n'));
    setIdeasText((lesson.suggested_ideas ?? []).join('\n'));
    setVocabText((lesson.suggested_vocabulary ?? []).join(', '));
    setStructIntro(lesson.suggested_structure?.introduction ?? '');
    setStructBodyText((lesson.suggested_structure?.body ?? []).join('\n'));
    setStructConclusion(lesson.suggested_structure?.conclusion ?? '');
    setEditingId(lesson.id);
    setSaveError('');
    setSaveOk(false);
    setModalMode('edit');
  }

  function closeModal() {
    setModalMode(null);
    setEditingId(null);
    setSaveError('');
  }

  // ── Build + save ──────────────────────────────────────────────────────────────
  function buildLesson():
    | { ok: false; msg: string }
    | { ok: true; lesson: Omit<WritingLesson, 'created_at' | 'updated_at'> } {
    if (!form.title.trim())  return { ok: false, msg: 'Title is required' };
    if (!form.prompt.trim()) return { ok: false, msg: 'Prompt is required' };

    const requirements         = linesToArray(requirementsText);
    const suggested_ideas      = linesToArray(ideasText);
    const suggested_vocabulary = commaToArray(vocabText);
    const structBody           = linesToArray(structBodyText);

    const id = modalMode === 'edit' && editingId ? editingId : generateId(form.title);

    return {
      ok: true,
      lesson: {
        id,
        title:                form.title.trim(),
        level:                form.level,
        topic:                form.topic,
        task_type:            form.task_type,
        word_target:          Number(form.word_target) || 100,
        duration_minutes:     Number(form.duration_minutes) || 10,
        prompt:               form.prompt.trim(),
        requirements,
        suggested_ideas,
        suggested_vocabulary,
        suggested_structure: {
          introduction: structIntro.trim(),
          body:         structBody,
          conclusion:   structConclusion.trim(),
        },
      },
    };
  }

  async function handleSave() {
    const result = buildLesson();
    if (!result.ok) { setSaveError(result.msg); return; }

    setSaving(true);
    setSaveError('');
    setSaveOk(false);

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('writing_lessons')
        .upsert(result.lesson, { onConflict: 'id' });
      if (error) throw new Error(error.message);
      // Show success confirmation, reload the list, THEN close.
      // loadLessons() must resolve first so that a reload failure is still
      // visible — if closeModal() fired from a setTimeout before the await,
      // the error state would be cleared before the admin could read it.
      setSaveOk(true);
      await loadLessons();
      setTimeout(() => {
        setSaveOk(false);
        closeModal();
      }, 800);
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeleteError('');
    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('writing_lessons').delete().eq('id', id);
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
          <h2 className="text-xl font-bold text-gray-800">Writing Lessons</h2>
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
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Writing Lesson
          </button>
        </div>
      </div>

      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',           value: lessons.length,                                                                                      color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100'   },
          { label: 'Descriptive',     value: lessons.filter((l) => l.task_type === 'descriptive').length,                                         color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100'     },
          { label: 'Opinion',         value: lessons.filter((l) => l.task_type === 'opinion').length,                                             color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Narrative / C&C', value: lessons.filter((l) => l.task_type === 'narrative' || l.task_type === 'compare-contrast').length,     color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100' },
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
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">No writing lessons yet</h3>
          <p className="text-gray-400">Click &ldquo;Add Writing Lesson&rdquo; to create the first one</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Level</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Target</th>
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
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700">
                        {TASK_TYPE_OPTIONS.find((o) => o.value === lesson.task_type)?.label ?? lesson.task_type}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{lesson.word_target} words</td>
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
                  {modalMode === 'add' ? '✍️ Add Writing Lesson' : '✏️ Edit Writing Lesson'}
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
                    placeholder="e.g. Describe Your Favourite Place"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level *</label>
                  <select
                    value={form.level}
                    onChange={(e) => setForm((f) => ({ ...f, level: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
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
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Task Type *</label>
                  <select
                    value={form.task_type}
                    onChange={(e) => setForm((f) => ({ ...f, task_type: e.target.value as TaskType }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 bg-white"
                  >
                    {TASK_TYPE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Word Target</label>
                  <input
                    type="number"
                    min={20}
                    max={1000}
                    value={form.word_target}
                    onChange={(e) => setForm((f) => ({ ...f, word_target: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.duration_minutes}
                    onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                  />
                </div>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Writing Prompt *</label>
                <textarea
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  rows={4}
                  placeholder="Write about a time when you helped someone. Describe what happened and how it made you feel."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                />
              </div>

              {/* Requirements */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Requirements
                  <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                </label>
                <textarea
                  value={requirementsText}
                  onChange={(e) => setRequirementsText(e.target.value)}
                  rows={4}
                  placeholder={'Use at least 80 words\nInclude an introduction and conclusion\nUse past tense throughout'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                />
              </div>

              {/* Ideas */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Suggested Ideas
                  <span className="text-gray-400 font-normal ml-1">(one per line)</span>
                </label>
                <textarea
                  value={ideasText}
                  onChange={(e) => setIdeasText(e.target.value)}
                  rows={4}
                  placeholder={'Think about who you helped\nDescribe the situation\nExplain how they reacted'}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                />
              </div>

              {/* Vocabulary */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Suggested Vocabulary
                  <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
                </label>
                <input
                  type="text"
                  value={vocabText}
                  onChange={(e) => setVocabText(e.target.value)}
                  placeholder="helpful, grateful, opportunity, assist, volunteer"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                />
              </div>

              {/* Structure */}
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-3">Suggested Structure</p>
                <div className="space-y-3 pl-4 border-l-2 border-amber-200">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Introduction
                    </label>
                    <input
                      type="text"
                      value={structIntro}
                      onChange={(e) => setStructIntro(e.target.value)}
                      placeholder="Introduce the topic and give your main idea"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Body Points
                      <span className="text-gray-400 font-normal normal-case ml-1">(one per line)</span>
                    </label>
                    <textarea
                      value={structBodyText}
                      onChange={(e) => setStructBodyText(e.target.value)}
                      rows={3}
                      placeholder={'Paragraph 1: Setting & background\nParagraph 2: What happened\nParagraph 3: The outcome'}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Conclusion
                    </label>
                    <input
                      type="text"
                      value={structConclusion}
                      onChange={(e) => setStructConclusion(e.target.value)}
                      placeholder="Summarise your ideas and give a final thought"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                    />
                  </div>
                </div>
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
              {/* Fix #5: StatusBadge now present — shows saving/saved states */}
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
                  disabled={saving || !form.title.trim() || !form.prompt.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
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
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Writing Lesson?</h3>
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
