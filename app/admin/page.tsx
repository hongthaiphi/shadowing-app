'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import shadowingLessonsRaw from '@/data/shadowing-lessons.json';
import dictationLessonsRaw from '@/data/dictation-lessons.json';

type LessonEntry = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  transcript: string;
  chunks?: string[];
  subtype?: string;
  durationMinutes: number;
};

type ModalMode = 'add' | 'edit' | null;

const STORAGE_KEY = 'shadowspeak_custom_lessons';

function loadCustomLessons(): LessonEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCustomLessons(lessons: LessonEntry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lessons));
}

const LEVEL_COLORS: Record<string, string> = {
  Starter: 'bg-emerald-100 text-emerald-700',
  'Level 1': 'bg-blue-100 text-blue-700',
  'Level 2': 'bg-indigo-100 text-indigo-700',
};

const emptyForm: Omit<LessonEntry, 'id'> = {
  title: '',
  level: 'Starter',
  topic: 'school',
  type: 'shadowing',
  transcript: '',
  chunks: [],
  subtype: 'sentence',
  durationMinutes: 5,
};

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [customLessons, setCustomLessons] = useState<LessonEntry[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingLesson, setEditingLesson] = useState<LessonEntry | null>(null);
  const [form, setForm] = useState<Omit<LessonEntry, 'id'>>(emptyForm);
  const [chunksText, setChunksText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const user = getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      router.push('/login');
      return;
    }
    setCustomLessons(loadCustomLessons());
    setLoading(false);
  }, [router]);

  const builtInLessons: LessonEntry[] = [
    ...(shadowingLessonsRaw as LessonEntry[]),
    ...(dictationLessonsRaw as LessonEntry[]),
  ];

  const allLessons = [...builtInLessons, ...customLessons];

  function openAdd() {
    setForm(emptyForm);
    setChunksText('');
    setEditingLesson(null);
    setModalMode('add');
  }

  function openEdit(lesson: LessonEntry) {
    setForm({ ...lesson });
    setChunksText(lesson.chunks?.join('\n') || '');
    setEditingLesson(lesson);
    setModalMode('edit');
  }

  function handleFormChange(key: keyof typeof emptyForm, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    if (!form.title.trim() || !form.transcript.trim()) return;

    const chunks = chunksText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (modalMode === 'add') {
      const newLesson: LessonEntry = {
        ...form,
        id: `custom_${Date.now()}`,
        chunks: form.type === 'shadowing' ? chunks : undefined,
      };
      const updated = [...customLessons, newLesson];
      setCustomLessons(updated);
      saveCustomLessons(updated);
    } else if (modalMode === 'edit' && editingLesson) {
      const updated = customLessons.map((l) =>
        l.id === editingLesson.id
          ? { ...form, id: l.id, chunks: form.type === 'shadowing' ? chunks : undefined }
          : l
      );
      setCustomLessons(updated);
      saveCustomLessons(updated);
    }

    setModalMode(null);
  }

  function handleDelete(id: string) {
    const updated = customLessons.filter((l) => l.id !== id);
    setCustomLessons(updated);
    saveCustomLessons(updated);
    setDeleteId(null);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2">Admin Panel</h1>
            <p className="text-gray-300">Manage lessons and content for ShadowSpeak</p>
          </div>
          <button
            onClick={openAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Lesson
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Lessons', value: allLessons.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Shadowing', value: allLessons.filter(l => l.type === 'shadowing').length, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
          { label: 'Dictation', value: allLessons.filter(l => l.type === 'dictation').length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Custom (Yours)', value: customLessons.length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">All Lessons</h2>
          <p className="text-sm text-gray-500 mt-0.5">Built-in lessons are read-only. Custom lessons can be edited.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Title</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Level</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Topic</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Type</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Duration</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {allLessons.map((lesson) => {
                const isCustom = customLessons.some((c) => c.id === lesson.id);
                return (
                  <tr key={lesson.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800 text-sm">{lesson.title}</span>
                        {isCustom && (
                          <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                            Custom
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${LEVEL_COLORS[lesson.level] || 'bg-gray-100 text-gray-600'}`}>
                        {lesson.level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 capitalize">{lesson.topic}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        lesson.type === 'shadowing' ? 'bg-cyan-100 text-cyan-700' : 'bg-violet-100 text-violet-700'
                      }`}>
                        {lesson.type === 'shadowing' ? '🎧 Shadowing' : '✏️ Dictation'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-500">{lesson.durationMinutes} min</td>
                    <td className="px-5 py-4">
                      {isCustom ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openEdit(lesson)}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-2.5 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteId(lesson.id)}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 px-2.5 py-1.5 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">Built-in</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalMode && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-800">
                {modalMode === 'add' ? 'Add New Lesson' : 'Edit Lesson'}
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  placeholder="Lesson title"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type *</label>
                  <select
                    value={form.type}
                    onChange={(e) => handleFormChange('type', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="shadowing">Shadowing</option>
                    <option value="dictation">Dictation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level *</label>
                  <select
                    value={form.level}
                    onChange={(e) => handleFormChange('level', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="Starter">Starter</option>
                    <option value="Level 1">Level 1</option>
                    <option value="Level 2">Level 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Topic *</label>
                  <select
                    value={form.topic}
                    onChange={(e) => handleFormChange('topic', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="school">School</option>
                    <option value="hobbies">Hobbies</option>
                    <option value="family">Family</option>
                    <option value="food">Food</option>
                    <option value="daily routine">Daily Routine</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Duration (min)</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={form.durationMinutes}
                    onChange={(e) => handleFormChange('durationMinutes', Number(e.target.value))}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
              </div>

              {form.type === 'dictation' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subtype</label>
                  <select
                    value={form.subtype}
                    onChange={(e) => handleFormChange('subtype', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    <option value="sentence">Sentence</option>
                    <option value="dialogue">Dialogue</option>
                    <option value="paragraph">Paragraph</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transcript *</label>
                <textarea
                  value={form.transcript}
                  onChange={(e) => handleFormChange('transcript', e.target.value)}
                  placeholder="Full transcript text..."
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
              </div>

              {form.type === 'shadowing' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Chunks (one per line)
                  </label>
                  <textarea
                    value={chunksText}
                    onChange={(e) => setChunksText(e.target.value)}
                    placeholder="First sentence.&#10;Second sentence.&#10;Third sentence."
                    rows={5}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
                  />
                  <p className="text-xs text-gray-400 mt-1">Each line will become one chunk</p>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalMode(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || !form.transcript.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {modalMode === 'add' ? 'Add Lesson' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Lesson?</h3>
            <p className="text-gray-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteId(null)}
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
