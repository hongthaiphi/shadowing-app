export interface Level {
  id: string;
  label: string;
  color: string; // Tailwind classes for badge, e.g. "bg-emerald-100 text-emerald-700"
}

const STORAGE_KEY = 'shadowspeak_levels';

const DEFAULT_LEVELS: Level[] = [
  { id: 'Starter', label: 'Starter', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'Level 1', label: 'Level 1', color: 'bg-blue-100 text-blue-700' },
  { id: 'Level 2', label: 'Level 2', color: 'bg-indigo-100 text-indigo-700' },
];

const COLOR_OPTIONS: { label: string; value: string }[] = [
  { label: 'Emerald', value: 'bg-emerald-100 text-emerald-700' },
  { label: 'Blue', value: 'bg-blue-100 text-blue-700' },
  { label: 'Indigo', value: 'bg-indigo-100 text-indigo-700' },
  { label: 'Amber', value: 'bg-amber-100 text-amber-700' },
  { label: 'Rose', value: 'bg-rose-100 text-rose-700' },
  { label: 'Cyan', value: 'bg-cyan-100 text-cyan-700' },
  { label: 'Violet', value: 'bg-violet-100 text-violet-700' },
  { label: 'Orange', value: 'bg-orange-100 text-orange-700' },
  { label: 'Teal', value: 'bg-teal-100 text-teal-700' },
  { label: 'Pink', value: 'bg-pink-100 text-pink-700' },
  { label: 'Slate', value: 'bg-slate-100 text-slate-700' },
  { label: 'Red', value: 'bg-red-100 text-red-700' },
];

export function loadLevels(): Level[] {
  if (typeof window === 'undefined') return DEFAULT_LEVELS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_LEVELS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_LEVELS;
    return parsed;
  } catch {
    return DEFAULT_LEVELS;
  }
}

export function saveLevels(levels: Level[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(levels));
}

export function getLevelColor(id: string): string {
  const levels = loadLevels();
  const level = levels.find((l) => l.id === id);
  return level?.color ?? 'bg-gray-100 text-gray-600';
}

export function getLevelLabel(id: string): string {
  const levels = loadLevels();
  const level = levels.find((l) => l.id === id);
  return level?.label ?? id;
}

export function getColorOptions(): { label: string; value: string }[] {
  return COLOR_OPTIONS;
}
