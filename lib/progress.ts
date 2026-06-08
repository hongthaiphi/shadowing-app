import { getSupabase } from './supabase';

export interface LessonProgress {
  lessonId: string;
  completedAt: string; // ISO string
  timeSpent: number;   // seconds
  score?: number;      // 0-100
  type?: 'shadowing' | 'dictation' | 'speaking' | 'reading' | 'writing';
}

const STORAGE_KEY = 'shadowspeak_progress';

function getAll(): LessonProgress[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as LessonProgress[];
  } catch {
    return [];
  }
}

function saveAll(data: LessonProgress[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function markComplete(
  lessonId: string,
  timeSpent: number,
  score?: number,
  type?: 'shadowing' | 'dictation' | 'speaking' | 'reading' | 'writing'
): void {
  const all = getAll();
  const existing = all.findIndex((p) => p.lessonId === lessonId);
  const entry: LessonProgress = {
    lessonId,
    completedAt: new Date().toISOString(),
    timeSpent,
    score,
    type,
  };
  if (existing >= 0) {
    all[existing] = entry;
  } else {
    all.push(entry);
  }
  saveAll(all);

  // Background sync to Supabase (fire and forget)
  if (typeof window !== 'undefined') {
    const supabase = getSupabase();
    supabase.auth.getUser().then(({ data }: { data: { user: { id: string } | null } }) => {
      if (!data.user) return;
      supabase.from('progress').upsert({
        user_id: data.user.id,
        lesson_id: lessonId,
        lesson_type: type ?? null,
        time_spent: timeSpent,
        score: score ?? null,
        completed_at: entry.completedAt,
      }).then();
    });
  }
}

export function getProgress(): LessonProgress[] {
  return getAll().sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

// Sync read from localStorage cache — used only immediately after markComplete()
// for instant UI feedback within the same session.
export function getCompletedIds(): string[] {
  return getAll().map((p) => p.lessonId);
}

// Async version — DB is source of truth, updates localStorage cache.
// Use this on page mount so cross-device progress is always accurate.
export async function fetchCompletedIds(): Promise<string[]> {
  const progress = await fetchProgressFromDB();
  return progress.map((p) => p.lessonId);
}

export function getStreak(): number {
  const all = getAll();
  if (all.length === 0) return 0;

  const dates = all.map((p) => {
    const d = new Date(p.completedAt);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const uniqueDates = Array.from(new Set(dates)).sort().reverse();
  if (uniqueDates.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // Streak must include today or yesterday
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export function getTotalMinutes(): number {
  const all = getAll();
  const totalSeconds = all.reduce((sum, p) => sum + p.timeSpent, 0);
  return Math.round(totalSeconds / 60);
}

export function getDictationAccuracy(): number {
  const all = getAll().filter((p) => p.type === 'dictation' && p.score !== undefined);
  if (all.length === 0) return 0;
  const total = all.reduce((sum, p) => sum + (p.score ?? 0), 0);
  return Math.round(total / all.length);
}

// Fetch all progress for the current user from Supabase (DB is the source of truth)
export async function fetchProgressFromDB(): Promise<LessonProgress[]> {
  try {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return getAll();
    const { data, error } = await supabase
      .from('progress')
      .select('lesson_id, lesson_type, completed_at, time_spent, score')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false });
    if (error || !data) return getAll();
    const progress: LessonProgress[] = (data as Record<string, unknown>[]).map((p) => ({
      lessonId: p.lesson_id as string,
      completedAt: p.completed_at as string,
      timeSpent: p.time_spent as number,
      score: p.score != null ? (p.score as number) : undefined,
      type: p.lesson_type as LessonProgress['type'] ?? undefined,
    }));
    // Update localStorage cache so offline helpers stay in sync
    saveAll(progress);
    return progress;
  } catch {
    return getAll();
  }
}
