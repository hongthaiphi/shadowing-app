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

export function saveTopics(topics: Topic[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
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
