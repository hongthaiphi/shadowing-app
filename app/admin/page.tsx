'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getSupabase } from '@/lib/supabase';
import { fetchTopics, persistTopics, type Topic } from '@/lib/topics';
import { fetchLevels, persistLevels, getColorOptions, getLevelColor, type Level } from '@/lib/levels';
import shadowingLessonsRaw from '@/data/shadowing-lessons.json';
import dictationLessonsRaw from '@/data/dictation-lessons.json';
import speakingLessonsRaw from '@/data/speaking-lessons.json';
import ReadingAdmin from '@/app/admin/tabs/ReadingAdmin';
import WritingAdmin from '@/app/admin/tabs/WritingAdmin';
import SubmissionsAdmin from '@/app/admin/tabs/SubmissionsAdmin';

type LessonEntry = {
  id: string;
  title: string;
  level: string;
  topic: string;
  type: string;
  transcript?: string;
  chunks?: string[];
  subtype?: string;
  durationMinutes: number;
  // media
  audioUrl?: string;
  audioSlowUrl?: string;
  imageUrl?: string;
  // speaking-specific
  prompt?: string;
  exampleAnswer?: string;
  hints?: string[];
};

type ParsedImport = LessonEntry & { _error?: string };

type ModalMode = 'add' | 'edit' | null;

type AdminTab = 'lessons' | 'topics' | 'levels' | 'stats' | 'reading' | 'writing' | 'submissions';

type StudentStat = {
  id: string;
  name: string;
  email: string;
  role: string;
  completions: number;
  totalMinutes: number;
  avgAccuracy: number | null;
  lastActive: string | null;
};

type RecentActivity = {
  userId: string;
  studentName: string;
  lessonId: string;
  lessonTitle: string;
  lessonType: string;
  completedAt: string;
  score: number | null;
  timeSpent: number;
};

// Legacy: migrate any locally-stored custom lessons to Supabase on first load
async function migrateLegacyLessons(supabase: ReturnType<typeof import('@/lib/supabase').getSupabase>): Promise<void> {
  const STORAGE_KEY = 'shadowspeak_custom_lessons';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const lessons = JSON.parse(raw) as LessonEntry[];
    if (lessons.length === 0) return;
    await supabase.from('lessons').upsert(
      lessons.map((l) => lessonToRow(l)),
      { onConflict: 'id', ignoreDuplicates: true }
    );
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* best-effort */ }
}

function lessonToRow(l: LessonEntry) {
  return {
    id: l.id,
    title: l.title,
    type: l.type,
    level: l.level,
    topic: l.topic,
    subtype: l.subtype ?? null,
    transcript: l.transcript ?? null,
    chunks: l.chunks ?? null,
    prompt: l.prompt ?? null,
    example_answer: l.exampleAnswer ?? null,
    hints: l.hints ?? null,
    audio_url: l.audioUrl ?? null,
    audio_slow_url: l.audioSlowUrl ?? null,
    image_url: l.imageUrl ?? null,
    duration_minutes: l.durationMinutes ?? 5,
  };
}

function rowToLesson(row: Record<string, unknown>): LessonEntry {
  return {
    id: String(row.id),
    title: String(row.title),
    type: String(row.type),
    level: String(row.level),
    topic: String(row.topic),
    subtype: row.subtype ? String(row.subtype) : undefined,
    transcript: row.transcript ? String(row.transcript) : undefined,
    chunks: Array.isArray(row.chunks) ? (row.chunks as string[]) : undefined,
    prompt: row.prompt ? String(row.prompt) : undefined,
    exampleAnswer: row.example_answer ? String(row.example_answer) : undefined,
    hints: Array.isArray(row.hints) ? (row.hints as string[]) : undefined,
    audioUrl: row.audio_url ? String(row.audio_url) : undefined,
    audioSlowUrl: row.audio_slow_url ? String(row.audio_slow_url) : undefined,
    imageUrl: row.image_url ? String(row.image_url) : undefined,
    durationMinutes: Number(row.duration_minutes) || 5,
  };
}

const VALID_TYPES = ['shadowing', 'dictation', 'speaking'];

const TEMPLATE_JSON: Partial<LessonEntry>[] = [
  {
    title: 'My School Day',
    level: 'Starter',
    topic: 'school',
    type: 'shadowing',
    transcript: 'I go to school every morning. My class starts at seven.',
    chunks: ['I go to school every morning.', 'My class starts at seven.'],
    durationMinutes: 5,
  },
  {
    title: 'Listen and Write',
    level: 'Starter',
    topic: 'school',
    type: 'dictation',
    subtype: 'sentence',
    transcript: 'My class starts at seven o\'clock.',
    durationMinutes: 5,
  },
  {
    title: 'Talk About Your School',
    level: 'Starter',
    topic: 'school',
    type: 'speaking',
    prompt: 'Describe your school. What time do you go? What subjects do you study?',
    exampleAnswer: 'I go to school at seven. I study English and Math.',
    hints: ['classroom', 'subject', 'favorite'],
    durationMinutes: 5,
  },
];

const emptyForm: Omit<LessonEntry, 'id'> = {
  title: '',
  level: 'Starter',
  topic: 'school',
  type: 'shadowing',
  transcript: '',
  chunks: [],
  subtype: 'sentence',
  durationMinutes: 5,
  audioUrl: '',
  audioSlowUrl: '',
  imageUrl: '',
};

function validateLesson(item: unknown, existingIds: Set<string>): ParsedImport {
  const lesson = item as Record<string, unknown>;
  const errors: string[] = [];

  if (!lesson.title || typeof lesson.title !== 'string' || !lesson.title.trim()) {
    errors.push('missing title');
  }
  if (!lesson.type || !VALID_TYPES.includes(lesson.type as string)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }
  if (!lesson.level || typeof lesson.level !== 'string') {
    errors.push('missing level');
  }
  if (!lesson.topic || typeof lesson.topic !== 'string') {
    errors.push('missing topic');
  }
  if (lesson.type === 'speaking') {
    if (!lesson.prompt && !lesson.exampleAnswer) {
      errors.push('speaking lesson needs prompt or exampleAnswer');
    }
  } else {
    if (!lesson.transcript || typeof lesson.transcript !== 'string') {
      errors.push('missing transcript');
    }
  }

  const id = typeof lesson.id === 'string' && lesson.id.trim()
    ? lesson.id.trim()
    : `import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  if (existingIds.has(id) && lesson.id) {
    errors.push(`id "${id}" already exists — will get a new id`);
  }

  return {
    id: existingIds.has(id) ? `import_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` : id,
    title: String(lesson.title || '').trim(),
    level: String(lesson.level || 'Starter'),
    topic: String(lesson.topic || 'school'),
    type: String(lesson.type || 'shadowing'),
    transcript: lesson.transcript ? String(lesson.transcript) : undefined,
    chunks: Array.isArray(lesson.chunks) ? lesson.chunks.map(String) : undefined,
    subtype: lesson.subtype ? String(lesson.subtype) : undefined,
    durationMinutes: Number(lesson.durationMinutes) || 5,
    prompt: lesson.prompt ? String(lesson.prompt) : undefined,
    exampleAnswer: lesson.exampleAnswer ? String(lesson.exampleAnswer) : undefined,
    hints: Array.isArray(lesson.hints) ? lesson.hints.map(String) : undefined,
    _error: errors.length > 0 ? errors.join('; ') : undefined,
  };
}

// Build lesson title lookup from all JSON data
const ALL_JSON_LESSONS = [
  ...(shadowingLessonsRaw as LessonEntry[]),
  ...(dictationLessonsRaw as LessonEntry[]),
  ...(speakingLessonsRaw as LessonEntry[]),
];
const JSON_LESSON_MAP: Record<string, string> = Object.fromEntries(
  ALL_JSON_LESSONS.map((l) => [l.id, l.title])
);

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('lessons');
  const [customLessons, setCustomLessons] = useState<LessonEntry[]>([]);
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [editingLesson, setEditingLesson] = useState<LessonEntry | null>(null);
  const [form, setForm] = useState<Omit<LessonEntry, 'id'>>(emptyForm);
  const [chunksText, setChunksText] = useState('');
  const [hintsText, setHintsText] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Stats state
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState('');
  const [studentStats, setStudentStats] = useState<StudentStat[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [statsLoaded, setStatsLoaded] = useState(false);
  const [allProfiles, setAllProfiles] = useState<Array<{ id: string; name: string; email: string; role: string }>>([]);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicFormOpen, setTopicFormOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicForm, setTopicForm] = useState<Topic>({ id: '', label: '', emoji: '' });
  const [deleteTopicId, setDeleteTopicId] = useState<string | null>(null);
  const [topicFormError, setTopicFormError] = useState('');

  // Levels state
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelFormOpen, setLevelFormOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [levelForm, setLevelForm] = useState<Level>({ id: '', label: '', color: 'bg-emerald-100 text-emerald-700' });
  const [deleteLevelId, setDeleteLevelId] = useState<string | null>(null);
  const [levelFormError, setLevelFormError] = useState('');

  // Upload state (for Add/Edit modal)
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioSlowFile, setAudioSlowFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importRaw, setImportRaw] = useState('');
  const [importParsed, setImportParsed] = useState<ParsedImport[]>([]);
  const [importParseError, setImportParseError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // NOTE: This localStorage-based check is a UX fast-path only.
    // The real security gate is in middleware.ts (lines 41–51), which
    // verifies the Supabase JWT and fetches the role from the DB on every
    // request — that cannot be spoofed from the client.
    const user = getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'teacher')) {
      router.push('/login');
      return;
    }
    setCurrentUserRole(user.role);

    // Load custom lessons from Supabase
    const supabase = getSupabase();

    // Load topics and levels from DB (falls back to localStorage cache if DB unreachable)
    fetchTopics().then(setTopics);
    fetchLevels().then(setLevels);

    migrateLegacyLessons(supabase).then(() => {
      supabase.from('lessons').select('*').order('created_at', { ascending: false }).then(({ data }: { data: Record<string, unknown>[] | null }) => {
        setCustomLessons((data ?? []).map((r) => rowToLesson(r as Record<string, unknown>)));
        setLoading(false);
      });
    });
  }, [router]);

  async function loadCustomLessonsFromSupabase() {
    const supabase = getSupabase();
    const { data } = await supabase.from('lessons').select('*').order('created_at', { ascending: false });
    setCustomLessons((data ?? []).map((r) => rowToLesson(r as Record<string, unknown>)));
  }

  async function loadStats(force = false) {
    if (statsLoaded && !force) return;
    setStatsLoading(true);
    setStatsError('');
    try {
      const supabase = getSupabase();

      const [{ data: profiles, error: profErr }, { data: progress, error: progErr }] =
        await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('progress').select('*').order('completed_at', { ascending: false }),
        ]);

      if (profErr) throw new Error(profErr.message);
      if (progErr) throw new Error(progErr.message);

      const profileList = (profiles ?? []) as Array<{ id: string; name: string; email: string; role: string; created_at: string }>;
      const progressList = (progress ?? []) as Array<{ user_id: string; lesson_id: string; lesson_type: string; completed_at: string; time_spent: number; score: number | null }>;

      // Build custom lesson title map from already-loaded state
      const customMap: Record<string, string> = Object.fromEntries(
        customLessons.map((l) => [l.id, l.title])
      );
      const titleMap = { ...JSON_LESSON_MAP, ...customMap };

      // Per-student aggregation
      const stats: StudentStat[] = profileList
        .filter((p) => p.role === 'student')
        .map((profile) => {
          const userProg = progressList.filter((p) => p.user_id === profile.id);
          const dictProg = userProg.filter((p) => p.lesson_type === 'dictation' && p.score !== null);
          return {
            id: profile.id,
            name: profile.name,
            email: profile.email,
            role: profile.role,
            completions: userProg.length,
            totalMinutes: Math.round(userProg.reduce((s, p) => s + (p.time_spent ?? 0), 0) / 60),
            avgAccuracy: dictProg.length > 0
              ? Math.round(dictProg.reduce((s, p) => s + (p.score ?? 0), 0) / dictProg.length)
              : null,
            lastActive: userProg[0]?.completed_at ?? null,
          };
        })
        .sort((a, b) => b.completions - a.completions);

      // Recent activity (last 20)
      const profileMap = Object.fromEntries(profileList.map((p) => [p.id, p]));
      const recent: RecentActivity[] = progressList.slice(0, 20).map((p) => ({
        userId: p.user_id,
        studentName: profileMap[p.user_id]?.name ?? 'Unknown',
        lessonId: p.lesson_id,
        lessonTitle: titleMap[p.lesson_id] ?? p.lesson_id,
        lessonType: p.lesson_type ?? '',
        completedAt: p.completed_at,
        score: p.score,
        timeSpent: p.time_spent,
      }));

      setStudentStats(stats);
      setRecentActivity(recent);
      setAllProfiles(profileList);
      setStatsLoaded(true);
    } catch (err) {
      setStatsError((err as Error).message);
    } finally {
      setStatsLoading(false);
    }
  }

  function handleTabChange(tab: AdminTab) {
    setActiveTab(tab);
    if (tab === 'stats') loadStats();
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingRoleId(userId);
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      if (error) throw new Error(error.message);
      setAllProfiles((prev) =>
        prev.map((p) => (p.id === userId ? { ...p, role: newRole } : p))
      );
      setStudentStats((prev) =>
        newRole !== 'student' ? prev.filter((s) => s.id !== userId) : prev
      );
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUpdatingRoleId(null);
    }
  }

  const builtInLessons: LessonEntry[] = [
    ...(shadowingLessonsRaw as LessonEntry[]),
    ...(dictationLessonsRaw as LessonEntry[]),
    ...(speakingLessonsRaw as LessonEntry[]),
  ];

  const allLessons = [...builtInLessons, ...customLessons];

  // ── Supabase Storage upload helper ──────────────────
  async function uploadToStorage(file: File, pathNoExt: string): Promise<string> {
    const supabase = getSupabase();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const fullPath = `${pathNoExt}.${ext}`;
    const { data, error } = await supabase.storage
      .from('audio')
      .upload(fullPath, file, { upsert: true, contentType: file.type });
    if (error) throw new Error(`Upload failed: ${error.message}`);
    const { data: urlData } = supabase.storage.from('audio').getPublicUrl(data.path);
    return urlData.publicUrl;
  }

  // ── Add/Edit modal ──────────────────────────────────
  function openAdd() {
    setForm({ ...emptyForm, topic: topics[0]?.id || '', level: levels[0]?.id || '' });
    setChunksText('');
    setHintsText('');
    setAudioFile(null);
    setAudioSlowFile(null);
    setImageFile(null);
    setUploadError('');
    setEditingLesson(null);
    setModalMode('add');
  }

  function openEdit(lesson: LessonEntry) {
    setForm({ ...lesson });
    setChunksText(lesson.chunks?.join('\n') || '');
    setHintsText(lesson.hints?.join(', ') || '');
    setAudioFile(null);
    setAudioSlowFile(null);
    setImageFile(null);
    setUploadError('');
    setEditingLesson(lesson);
    setModalMode('edit');
  }

  function handleFormChange(key: keyof typeof emptyForm, value: string | number) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    if (form.type !== 'speaking' && !form.transcript?.trim()) return;

    setUploading(true);
    setUploadError('');

    try {
      // Determine lesson ID upfront so we can use it in Storage paths
      const lessonId = (modalMode === 'edit' && editingLesson)
        ? editingLesson.id
        : `custom_${Date.now()}`;

      // Resolve media URLs: upload new file, or keep existing URL
      let audioUrl = form.audioUrl || '';
      let audioSlowUrl = form.audioSlowUrl || '';
      let imageUrl = form.imageUrl || '';

      if (audioFile) {
        audioUrl = await uploadToStorage(audioFile, `custom/audio/${lessonId}-normal`);
      }
      if (audioSlowFile) {
        audioSlowUrl = await uploadToStorage(audioSlowFile, `custom/audio/${lessonId}-slow`);
      }
      if (imageFile) {
        imageUrl = await uploadToStorage(imageFile, `custom/images/${lessonId}`);
      }

      const chunks = chunksText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
      const hints = hintsText
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

      const lessonData: LessonEntry = {
        ...form,
        id: lessonId,
        audioUrl,
        audioSlowUrl,
        imageUrl,
        chunks: form.type === 'shadowing' ? chunks : undefined,
        hints: form.type === 'speaking' ? hints : undefined,
      };

      const supabase = getSupabase();
      const { error: dbError } = await supabase
        .from('lessons')
        .upsert(lessonToRow(lessonData), { onConflict: 'id' });
      if (dbError) throw new Error(dbError.message);

      await loadCustomLessonsFromSupabase();
      setAudioFile(null);
      setAudioSlowFile(null);
      setImageFile(null);
      setModalMode(null);
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    const supabase = getSupabase();
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    await loadCustomLessonsFromSupabase();
    setDeleteId(null);
  }

  // ── Topic CRUD ──────────────────────────────────────
  function openTopicAdd() {
    setTopicForm({ id: '', label: '', emoji: '📚' });
    setEditingTopic(null);
    setTopicFormError('');
    setTopicFormOpen(true);
  }

  function openTopicEdit(topic: Topic) {
    setTopicForm({ ...topic });
    setEditingTopic(topic);
    setTopicFormError('');
    setTopicFormOpen(true);
  }

  function handleTopicSave() {
    // Normalise: lowercase, collapse spaces → hyphens, strip non-slug chars.
    // Spaces must become hyphens — a bare space in a topic ID breaks URL
    // query-params and filter comparisons (e.g. ?topic=daily-routine).
    const id = topicForm.id.trim().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    const label = topicForm.label.trim();
    if (!id || !label) {
      setTopicFormError('ID and label are required');
      return;
    }
    // Check for duplicate ID
    const duplicate = topics.find(
      (t) => t.id === id && (!editingTopic || t.id !== editingTopic.id)
    );
    if (duplicate) {
      setTopicFormError(`Topic ID "${id}" already exists`);
      return;
    }
    const entry: Topic = { id, label, emoji: topicForm.emoji || '📚' };
    let updated: Topic[];
    if (editingTopic) {
      updated = topics.map((t) => (t.id === editingTopic.id ? entry : t));
    } else {
      updated = [...topics, entry];
    }
    setTopics(updated);
    persistTopics(updated);
    setTopicFormOpen(false);
  }

  function handleTopicDelete(id: string) {
    const updated = topics.filter((t) => t.id !== id);
    setTopics(updated);
    persistTopics(updated);
    setDeleteTopicId(null);
  }

  function getLessonsUsingTopic(topicId: string): LessonEntry[] {
    return allLessons.filter((l) => l.topic === topicId);
  }

  // ── Level CRUD ──────────────────────────────────────
  function openLevelAdd() {
    setLevelForm({ id: '', label: '', color: 'bg-emerald-100 text-emerald-700' });
    setEditingLevel(null);
    setLevelFormError('');
    setLevelFormOpen(true);
  }

  function openLevelEdit(level: Level) {
    setLevelForm({ ...level });
    setEditingLevel(level);
    setLevelFormError('');
    setLevelFormOpen(true);
  }

  function handleLevelSave() {
    const id = levelForm.id.trim();
    const label = levelForm.label.trim();
    if (!id || !label) {
      setLevelFormError('ID and label are required');
      return;
    }
    const duplicate = levels.find(
      (l) => l.id === id && (!editingLevel || l.id !== editingLevel.id)
    );
    if (duplicate) {
      setLevelFormError(`Level ID "${id}" already exists`);
      return;
    }
    const entry: Level = { id, label, color: levelForm.color };
    let updated: Level[];
    if (editingLevel) {
      updated = levels.map((l) => (l.id === editingLevel.id ? entry : l));
    } else {
      updated = [...levels, entry];
    }
    setLevels(updated);
    persistLevels(updated);
    setLevelFormOpen(false);
  }

  function handleLevelDelete(id: string) {
    const updated = levels.filter((l) => l.id !== id);
    setLevels(updated);
    persistLevels(updated);
    setDeleteLevelId(null);
  }

  function getLessonsUsingLevel(levelId: string): LessonEntry[] {
    return allLessons.filter((l) => l.level === levelId);
  }

  // ── Import ──────────────────────────────────────────
  function parseImportRaw(raw: string) {
    setImportRaw(raw);
    setImportParseError('');
    setImportParsed([]);
    if (!raw.trim()) return;

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        setImportParseError('JSON must be an array [ { ... }, { ... } ]');
        return;
      }
      const existingIds = new Set(allLessons.map((l) => l.id));
      const validated = parsed.map((item) => validateLesson(item, existingIds));
      setImportParsed(validated);
    } catch {
      setImportParseError('Invalid JSON — check for missing commas or brackets');
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      parseImportRaw(text);
    };
    reader.readAsText(file);
  }

  function downloadTemplate() {
    const blob = new Blob([JSON.stringify(TEMPLATE_JSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shadowspeak-lessons-template.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportConfirm() {
    const valid = importParsed.filter((l) => !l._error);
    if (valid.length === 0) return;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const toImport: LessonEntry[] = valid.map(({ _error, ...rest }) => rest);
    const supabase = getSupabase();
    await supabase.from('lessons').upsert(toImport.map(lessonToRow), { onConflict: 'id' });
    await loadCustomLessonsFromSupabase();
    setImportOpen(false);
    setImportRaw('');
    setImportParsed([]);
  }

  function closeImport() {
    setImportOpen(false);
    setImportRaw('');
    setImportParsed([]);
    setImportParseError('');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-400 text-lg">Loading...</div>
      </div>
    );
  }

  const validCount = importParsed.filter((l) => !l._error).length;
  const errorCount = importParsed.filter((l) => !!l._error).length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2">Admin Panel</h1>
            <p className="text-gray-300">Manage lessons and content for ShadowSpeak</p>
          </div>
          {activeTab === 'lessons' && (
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={() => setImportOpen(true)}
                className="px-5 py-2.5 bg-white/10 border border-white/30 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import JSON
              </button>
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
          )}
          {activeTab === 'stats' && statsLoaded && (
            <button
              onClick={() => loadStats(true)}
              className="px-4 py-2 bg-white/10 border border-white/30 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          )}
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap gap-2 mt-6">
          {([
            { key: 'lessons',     label: '📚 Lessons'     },
            { key: 'reading',     label: '📖 Reading'     },
            { key: 'writing',     label: '✍️ Writing'     },
            { key: 'submissions', label: '📝 Submissions' },
            { key: 'topics',      label: '🏷️ Topics'      },
            { key: 'levels',      label: '📈 Levels'      },
            { key: 'stats',       label: '📊 Stats'       },
          ] as { key: AdminTab; label: string }[]).map((t) => (
            <button
              key={t.key}
              onClick={() => handleTabChange(t.key)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                activeTab === t.key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'bg-white/10 text-white/80 hover:bg-white/20'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LESSONS TAB ─────────────────────────────────── */}
      {activeTab === 'lessons' && (<>

      {/* Lesson counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Lessons', value: allLessons.length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
          { label: 'Shadowing', value: allLessons.filter(l => l.type === 'shadowing').length, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
          { label: 'Dictation', value: allLessons.filter(l => l.type === 'dictation').length, color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Speaking', value: allLessons.filter(l => l.type === 'speaking').length, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">All Lessons</h2>
            <p className="text-sm text-gray-500 mt-0.5">Built-in lessons are read-only. Custom lessons can be edited.</p>
          </div>
          {customLessons.length > 0 && (
            <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
              {customLessons.length} custom
            </span>
          )}
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
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${getLevelColor(lesson.level)}`}>
                        {lesson.level}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 capitalize">{lesson.topic}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        lesson.type === 'shadowing' ? 'bg-cyan-100 text-cyan-700' :
                        lesson.type === 'speaking' ? 'bg-orange-100 text-orange-700' :
                        'bg-violet-100 text-violet-700'
                      }`}>
                        {lesson.type === 'shadowing' ? '🎧 Shadowing' : lesson.type === 'speaking' ? '🗣️ Speaking' : '✏️ Dictation'}
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

      </>)}

      {/* ── READING TAB ─────────────────────────────────── */}
      {activeTab === 'reading' && (
        <ReadingAdmin />
      )}

      {/* ── WRITING TAB ─────────────────────────────────── */}
      {activeTab === 'writing' && (
        <WritingAdmin />
      )}

      {/* ── SUBMISSIONS TAB ─────────────────────────────── */}
      {activeTab === 'submissions' && (
        <SubmissionsAdmin />
      )}

      {/* ── TOPICS TAB ──────────────────────────────────── */}
      {activeTab === 'topics' && (<>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Topics</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {topics.length} topic{topics.length !== 1 ? 's' : ''} defined. Topics are used to categorize lessons.
            </p>
          </div>
          <button
            onClick={openTopicAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Topic
          </button>
        </div>

        {topics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">🏷️</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No topics yet</h3>
            <p className="text-gray-400">Click &ldquo;Add Topic&rdquo; to create your first topic</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-2xl">
                    {topic.emoji}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openTopicEdit(topic)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit topic"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteTopicId(topic.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete topic"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-gray-800 text-lg">{topic.label}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">id: {topic.id}</p>
              </div>
            ))}
          </div>
        )}

        {/* Topic Add/Edit Modal */}
        {topicFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-800">
                  {editingTopic ? 'Edit Topic' : 'Add Topic'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Emoji</label>
                  <input
                    type="text"
                    value={topicForm.emoji}
                    onChange={(e) => setTopicForm((p) => ({ ...p, emoji: e.target.value }))}
                    placeholder="📚"
                    maxLength={4}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 text-2xl text-center"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label *</label>
                  <input
                    type="text"
                    value={topicForm.label}
                    onChange={(e) => setTopicForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Travel"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ID (slug) *
                    {editingTopic && (
                      <span className="text-xs text-amber-600 font-normal ml-1">— changing ID will not update existing lessons</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={topicForm.id}
                    onChange={(e) => setTopicForm((p) => ({ ...p, id: e.target.value }))}
                    placeholder="e.g. travel"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                {topicFormError && (
                  <p className="text-sm text-red-600 font-medium">{topicFormError}</p>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setTopicFormOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleTopicSave}
                  disabled={!topicForm.id.trim() || !topicForm.label.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingTopic ? 'Save Changes' : 'Add Topic'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Topic Delete Confirmation */}
        {deleteTopicId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Topic?</h3>
              <p className="text-gray-500 text-sm mb-1">
                This will remove the topic from the list. Lessons using this topic will still show the topic ID as plain text.
              </p>
              {(() => {
                const affected = getLessonsUsingTopic(deleteTopicId);
                if (affected.length > 0) {
                  return (
                    <p className="text-amber-600 text-xs font-medium mt-2 mb-4 bg-amber-50 px-3 py-2 rounded-lg">
                      {affected.length} lesson{affected.length !== 1 ? 's' : ''} currently use this topic.
                    </p>
                  );
                }
                return <div className="mb-4" />;
              })()}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTopicId(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleTopicDelete(deleteTopicId)}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ── LEVELS TAB ──────────────────────────────────── */}
      {activeTab === 'levels' && (<>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Levels</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {levels.length} level{levels.length !== 1 ? 's' : ''} defined. Levels are used to categorize lesson difficulty.
            </p>
          </div>
          <button
            onClick={openLevelAdd}
            className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Level
          </button>
        </div>

        {levels.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <div className="text-5xl mb-4">📈</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">No levels yet</h3>
            <p className="text-gray-400">Click &ldquo;Add Level&rdquo; to create your first level</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {levels.map((level) => (
              <div
                key={level.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${level.color}`}>
                    {level.label}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openLevelEdit(level)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit level"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setDeleteLevelId(level.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete level"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1 font-mono">id: {level.id}</p>
              </div>
            ))}
          </div>
        )}

        {/* Level Add/Edit Modal */}
        {levelFormOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-black text-gray-800">
                  {editingLevel ? 'Edit Level' : 'Add Level'}
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Label *</label>
                  <input
                    type="text"
                    value={levelForm.label}
                    onChange={(e) => setLevelForm((p) => ({ ...p, label: e.target.value }))}
                    placeholder="e.g. Advanced"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    ID (slug) *
                    {editingLevel && (
                      <span className="text-xs text-amber-600 font-normal ml-1">— changing ID will not update existing lessons</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={levelForm.id}
                    onChange={(e) => setLevelForm((p) => ({ ...p, id: e.target.value }))}
                    placeholder="e.g. advanced"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Badge Color</label>
                  <div className="grid grid-cols-4 gap-2">
                    {getColorOptions().map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setLevelForm((p) => ({ ...p, color: opt.value }))}
                        className={`text-xs font-bold px-2 py-2 rounded-xl border-2 transition-all ${
                          levelForm.color === opt.value
                            ? 'border-gray-800 ring-2 ring-gray-300'
                            : 'border-transparent hover:border-gray-300'
                        } ${opt.value}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Preview */}
                <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Preview:</span>
                  <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${levelForm.color}`}>
                    {levelForm.label || 'Label'}
                  </span>
                </div>
                {levelFormError && (
                  <p className="text-sm text-red-600 font-medium">{levelFormError}</p>
                )}
              </div>
              <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  onClick={() => setLevelFormOpen(false)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLevelSave}
                  disabled={!levelForm.id.trim() || !levelForm.label.trim()}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {editingLevel ? 'Save Changes' : 'Add Level'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Level Delete Confirmation */}
        {deleteLevelId && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Delete Level?</h3>
              <p className="text-gray-500 text-sm mb-1">
                This will remove the level from the list. Lessons using this level will still show the level ID as plain text.
              </p>
              {(() => {
                const affected = getLessonsUsingLevel(deleteLevelId);
                if (affected.length > 0) {
                  return (
                    <p className="text-amber-600 text-xs font-medium mt-2 mb-4 bg-amber-50 px-3 py-2 rounded-lg">
                      {affected.length} lesson{affected.length !== 1 ? 's' : ''} currently use this level.
                    </p>
                  );
                }
                return <div className="mb-4" />;
              })()}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteLevelId(null)}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleLevelDelete(deleteLevelId)}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </>)}

      {/* ── STATS TAB ───────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div>
          {statsLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-gray-400 text-sm">Loading student data…</p>
            </div>
          )}

          {statsError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6">
              <p className="text-red-700 font-semibold mb-1">Could not load student stats</p>
              <p className="text-red-600 text-sm">{statsError}</p>
              <p className="text-red-500 text-xs mt-2">
                Make sure you ran the RLS policy SQL in Supabase SQL Editor.
              </p>
            </div>
          )}

          {!statsLoading && !statsError && statsLoaded && (<>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Students', icon: '👥',
                  value: studentStats.length,
                  sub: 'registered',
                  color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100',
                },
                {
                  label: 'Completions', icon: '✅',
                  value: studentStats.reduce((s, st) => s + st.completions, 0),
                  sub: 'total lessons done',
                  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100',
                },
                {
                  label: 'Avg Accuracy', icon: '🎯',
                  value: (() => {
                    const withScore = studentStats.filter(s => s.avgAccuracy !== null);
                    if (!withScore.length) return '—';
                    return Math.round(withScore.reduce((s, st) => s + (st.avgAccuracy ?? 0), 0) / withScore.length) + '%';
                  })(),
                  sub: 'dictation average',
                  color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100',
                },
                {
                  label: 'Total Minutes', icon: '⏱️',
                  value: studentStats.reduce((s, st) => s + st.totalMinutes, 0),
                  sub: 'time practising',
                  color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100',
                },
              ].map((s) => (
                <div key={s.label} className={`bg-white rounded-2xl border p-5 ${s.bg}`}>
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                  <p className="text-sm font-semibold text-gray-700 mt-0.5">{s.label}</p>
                  <p className="text-xs text-gray-400">{s.sub}</p>
                </div>
              ))}
            </div>

            {/* Student table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
              <div className="p-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800">Student Activity</h2>
                <p className="text-sm text-gray-500 mt-0.5">{studentStats.length} student{studentStats.length !== 1 ? 's' : ''} registered</p>
              </div>

              {studentStats.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="text-4xl mb-3">👤</div>
                  <p className="text-gray-500 font-medium">No students yet</p>
                  <p className="text-gray-400 text-sm mt-1">Students will appear here after they register</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Student</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Lessons</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Minutes</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Accuracy</th>
                        <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Last Active</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {studentStats.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-800 text-sm">{s.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-sm font-black ${s.completions > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {s.completions}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600">{s.totalMinutes} min</td>
                          <td className="px-5 py-4">
                            {s.avgAccuracy !== null ? (
                              <span className={`text-sm font-bold ${
                                s.avgAccuracy >= 80 ? 'text-emerald-600' :
                                s.avgAccuracy >= 50 ? 'text-amber-600' : 'text-red-500'
                              }`}>
                                {s.avgAccuracy}%
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400 italic">no dictation</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-500">
                            {s.lastActive ? formatDate(s.lastActive) : <span className="text-gray-300 italic">never</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Recent Activity */}
            {recentActivity.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-800">Recent Activity</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Last {recentActivity.length} completions across all students</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {recentActivity.map((a, i) => (
                    <div key={i} className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0 ${
                        a.lessonType === 'shadowing' ? 'bg-cyan-100' :
                        a.lessonType === 'speaking' ? 'bg-orange-100' : 'bg-violet-100'
                      }`}>
                        {a.lessonType === 'shadowing' ? '🎧' : a.lessonType === 'speaking' ? '🗣️' : '✏️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{a.lessonTitle}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          <span className="font-medium text-gray-600">{a.studentName}</span>
                          {' · '}{formatDate(a.completedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {a.score !== null && (
                          <span className={`text-sm font-bold ${
                            a.score >= 80 ? 'text-emerald-600' :
                            a.score >= 50 ? 'text-amber-600' : 'text-red-500'
                          }`}>
                            {a.score}%
                          </span>
                        )}
                        <span className="text-xs text-gray-400">{Math.round(a.timeSpent / 60)} min</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── All Users / Role Management ─────────── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mt-6">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">All Users</h2>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {currentUserRole === 'admin'
                      ? 'Click the role badge to promote or demote a user.'
                      : 'User list — role editing requires admin access.'}
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {allProfiles.length} total
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Role</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allProfiles.map((profile) => {
                      const isUpdating = updatingRoleId === profile.id;
                      return (
                        <tr key={profile.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <p className="font-semibold text-gray-800 text-sm">{profile.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{profile.email}</p>
                          </td>
                          <td className="px-5 py-4">
                            {currentUserRole === 'admin' ? (
                              <div className="flex items-center gap-2">
                                <select
                                  value={profile.role}
                                  disabled={isUpdating}
                                  onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                                  className={`text-xs font-bold px-3 py-1.5 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                                    profile.role === 'admin'
                                      ? 'bg-red-50 text-red-700 border-red-200'
                                      : profile.role === 'teacher'
                                      ? 'bg-violet-50 text-violet-700 border-violet-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  <option value="student">Student</option>
                                  <option value="teacher">Teacher</option>
                                  <option value="admin">Admin</option>
                                </select>
                                {isUpdating && (
                                  <div className="w-4 h-4 border-2 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
                                )}
                              </div>
                            ) : (
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                                profile.role === 'admin'
                                  ? 'bg-red-50 text-red-700'
                                  : profile.role === 'teacher'
                                  ? 'bg-violet-50 text-violet-700'
                                  : 'bg-blue-50 text-blue-700'
                              }`}>
                                {profile.role}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </>)}
        </div>
      )}

      {/* ── Import Modal ─────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-gray-800">Import Lessons</h3>
                <p className="text-sm text-gray-500 mt-0.5">Paste a JSON array of lesson objects</p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Template
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Upload or paste */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-semibold text-gray-700">Paste JSON</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs font-semibold text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    Or upload .json file
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <textarea
                  value={importRaw}
                  onChange={(e) => parseImportRaw(e.target.value)}
                  placeholder={`[\n  {\n    "title": "My Lesson",\n    "type": "shadowing",\n    "level": "Starter",\n    "topic": "school",\n    "transcript": "...",\n    "durationMinutes": 5\n  }\n]`}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                />
                {importParseError && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {importParseError}
                  </p>
                )}
              </div>

              {/* Preview */}
              {importParsed.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <p className="text-sm font-bold text-gray-700">
                      Preview — {importParsed.length} lesson{importParsed.length !== 1 ? 's' : ''} found
                    </p>
                    {validCount > 0 && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {validCount} valid
                      </span>
                    )}
                    {errorCount > 0 && (
                      <span className="text-xs font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                        {errorCount} error{errorCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="rounded-xl border border-gray-200 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase">#</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase">Title</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase">Type</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase">Level</th>
                          <th className="text-left px-4 py-2 text-xs font-bold text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {importParsed.map((item, i) => (
                          <tr key={i} className={item._error ? 'bg-red-50/50' : 'bg-white'}>
                            <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                            <td className="px-4 py-2.5 font-medium text-gray-800 max-w-[180px] truncate">{item.title || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600 capitalize">{item.type || '—'}</td>
                            <td className="px-4 py-2.5 text-gray-600">{item.level || '—'}</td>
                            <td className="px-4 py-2.5">
                              {item._error ? (
                                <span className="text-xs text-red-600 font-medium" title={item._error}>
                                  ❌ {item._error.length > 30 ? item._error.slice(0, 30) + '…' : item._error}
                                </span>
                              ) : (
                                <span className="text-xs text-emerald-600 font-semibold">✅ Valid</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={closeImport}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                disabled={validCount === 0}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Import {validCount > 0 ? `${validCount} lesson${validCount !== 1 ? 's' : ''}` : '…'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add/Edit Modal ────────────────────────────── */}
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
                    <option value="shadowing">🎧 Shadowing</option>
                    <option value="dictation">✏️ Dictation</option>
                    <option value="speaking">🗣️ Speaking</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Level *</label>
                  <select
                    value={form.level}
                    onChange={(e) => handleFormChange('level', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
                  >
                    {levels.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                    {!levels.some((l) => l.id === form.level) && form.level && (
                      <option value={form.level}>{form.level}</option>
                    )}
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
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.emoji} {t.label}</option>
                    ))}
                    {!topics.some((t) => t.id === form.topic) && form.topic && (
                      <option value={form.topic}>{form.topic}</option>
                    )}
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

              {form.type === 'speaking' ? (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Speaking Prompt *</label>
                    <textarea
                      value={form.prompt || ''}
                      onChange={(e) => handleFormChange('prompt', e.target.value)}
                      placeholder="What question should students answer?"
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Example Answer</label>
                    <textarea
                      value={form.exampleAnswer || ''}
                      onChange={(e) => handleFormChange('exampleAnswer', e.target.value)}
                      placeholder="Model answer for students to listen to..."
                      rows={3}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Vocabulary Hints</label>
                    <input
                      type="text"
                      value={hintsText}
                      onChange={(e) => setHintsText(e.target.value)}
                      placeholder="word1, word2, word3"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                    />
                    <p className="text-xs text-gray-400 mt-1">Comma-separated list of vocabulary hints</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Transcript *</label>
                    <textarea
                      value={form.transcript || ''}
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
                        placeholder={'First sentence.\nSecond sentence.\nThird sentence.'}
                        rows={5}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none font-mono"
                      />
                      <p className="text-xs text-gray-400 mt-1">Each line becomes one practice chunk</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* ── Media uploads ── */}
            <div className="border-t border-gray-100 pt-4 space-y-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Media files</p>

              {/* Audio normal speed — shadowing & dictation */}
              {(form.type === 'shadowing' || form.type === 'dictation') && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Audio — Normal Speed
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="flex-1 truncate">
                      {audioFile ? audioFile.name : 'Upload MP3 / WAV'}
                    </span>
                    {audioFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setAudioFile(null); }}
                        className="text-red-400 hover:text-red-600 font-bold flex-shrink-0"
                      >✕</button>
                    )}
                    <input
                      type="file" accept="audio/*" className="hidden"
                      onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {form.audioUrl && !audioFile && (
                    <p className="text-xs text-emerald-600 mt-1 truncate">✓ Current: {form.audioUrl}</p>
                  )}
                </div>
              )}

              {/* Audio slow speed — shadowing only */}
              {form.type === 'shadowing' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Audio — Slow Speed <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span className="flex-1 truncate">
                      {audioSlowFile ? audioSlowFile.name : 'Upload slow-speed MP3 / WAV'}
                    </span>
                    {audioSlowFile && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); setAudioSlowFile(null); }}
                        className="text-red-400 hover:text-red-600 font-bold flex-shrink-0"
                      >✕</button>
                    )}
                    <input
                      type="file" accept="audio/*" className="hidden"
                      onChange={(e) => setAudioSlowFile(e.target.files?.[0] || null)}
                    />
                  </label>
                  {form.audioSlowUrl && !audioSlowFile && (
                    <p className="text-xs text-emerald-600 mt-1 truncate">✓ Current: {form.audioSlowUrl}</p>
                  )}
                </div>
              )}

              {/* Image — all types */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Lesson Image <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2.5 border border-dashed border-gray-300 rounded-xl text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span className="flex-1 truncate">
                    {imageFile ? imageFile.name : 'Upload JPG / PNG / WebP'}
                  </span>
                  {imageFile && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setImageFile(null); }}
                      className="text-red-400 hover:text-red-600 font-bold flex-shrink-0"
                    >✕</button>
                  )}
                  <input
                    type="file" accept="image/*" className="hidden"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                  />
                </label>
                {form.imageUrl && !imageFile && (
                  <p className="text-xs text-emerald-600 mt-1 truncate">✓ Current: {form.imageUrl}</p>
                )}
              </div>

              {uploadError && (
                <p className="text-sm text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {uploadError}
                </p>
              )}
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end">
              <button
                onClick={() => setModalMode(null)}
                disabled={uploading}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!form.title.trim() || (form.type !== 'speaking' && !form.transcript?.trim()) || uploading}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-violet-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Uploading…
                  </>
                ) : (
                  modalMode === 'add' ? 'Add Lesson' : 'Save Changes'
                )}
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
