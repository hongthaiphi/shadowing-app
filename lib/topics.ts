import { getSupabase } from '@/lib/supabase';

export interface Topic {
  id: string;
  label: string;
  emoji: string;
}

const STORAGE_KEY = 'shadowspeak_topics';

const DEFAULT_TOPICS: Topic[] = [
  { id: 'school', label: 'School', emoji: '🏫' },
  { id: 'hobbies', label: 'Hobbies', emoji: '🎨' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'daily routine', label: 'Daily Routine', emoji: '⏰' },
];

// Sync read from localStorage cache (used by non-async helpers)
export function loadTopics(): Topic[] {
  if (typeof window === 'undefined') return DEFAULT_TOPICS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_TOPICS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TOPICS;
    return parsed;
  } catch {
    return DEFAULT_TOPICS;
  }
}

function cacheTopics(topics: Topic[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
}

// Fetch topics from Supabase, update local cache, return list
export async function fetchTopics(): Promise<Topic[]> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('app_topics')
      .select('id, label, emoji')
      .order('sort_order', { ascending: true });
    if (error || !data || data.length === 0) return loadTopics();
    const topics = data as Topic[];
    cacheTopics(topics);
    return topics;
  } catch {
    return loadTopics();
  }
}

// Save topics to Supabase and update local cache
export async function persistTopics(topics: Topic[]): Promise<void> {
  cacheTopics(topics);
  try {
    const supabase = getSupabase();
    // Delete all then re-insert to handle reordering and deletions
    await supabase.from('app_topics').delete().neq('id', '__never__');
    if (topics.length > 0) {
      await supabase.from('app_topics').insert(
        topics.map((t, i) => ({ id: t.id, label: t.label, emoji: t.emoji, sort_order: i }))
      );
    }
  } catch {
    // Cache already updated; DB will sync next reload
  }
}

export function getTopicLabel(id: string): string {
  const topics = loadTopics();
  const topic = topics.find((t) => t.id === id);
  if (topic) return `${topic.emoji} ${topic.label}`;
  return id;
}

export function getTopicEmoji(id: string): string {
  const topics = loadTopics();
  const topic = topics.find((t) => t.id === id);
  return topic?.emoji ?? '';
}

export function getTopicDisplayName(id: string): string {
  const topics = loadTopics();
  const topic = topics.find((t) => t.id === id);
  return topic?.label ?? id;
}
