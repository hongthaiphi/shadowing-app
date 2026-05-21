'use client';

import { LessonProgress } from '@/lib/progress';

interface Props {
  progress: LessonProgress[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildWeeks(progress: LessonProgress[]) {
  const countMap: Record<string, number> = {};
  for (const p of progress) {
    const key = toDateStr(new Date(p.completedAt));
    countMap[key] = (countMap[key] || 0) + 1;
  }

  const today = new Date();
  const todayStr = toDateStr(today);

  // Find Monday of current week (Mon=1, so offset = (dow + 6) % 7 days back)
  const dow = today.getDay();
  const daysToMonday = (dow + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  // Start 3 weeks before this Monday → 4 weeks total
  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - 21);

  type CalDay = {
    dateStr: string;
    count: number;
    isToday: boolean;
    isFuture: boolean;
    label: string;
  };

  const weeks: CalDay[][] = [];
  for (let w = 0; w < 4; w++) {
    const week: CalDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + w * 7 + d);
      const dateStr = toDateStr(date);
      week.push({
        dateStr,
        count: countMap[dateStr] || 0,
        isToday: dateStr === todayStr,
        isFuture: date > today,
        label: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      });
    }
    weeks.push(week);
  }

  return weeks;
}

function cellClass(count: number, isFuture: boolean, isToday: boolean): string {
  const base = 'aspect-square rounded-md transition-colors';
  const ring = isToday ? ' ring-2 ring-offset-1 ring-emerald-500' : '';

  if (isFuture) return `${base} bg-gray-50${ring}`;
  if (count === 0) return `${base} bg-gray-100 hover:bg-gray-200${ring}`;
  if (count === 1) return `${base} bg-emerald-200 hover:bg-emerald-300${ring}`;
  if (count === 2) return `${base} bg-emerald-400 hover:bg-emerald-500${ring}`;
  return `${base} bg-emerald-600 hover:bg-emerald-700${ring}`;
}

function formatRange(weeks: ReturnType<typeof buildWeeks>): string {
  const first = weeks[0][0];
  const last = weeks[3][6];
  const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(new Date(first.dateStr))} – ${fmt(new Date(last.dateStr))}`;
}

export default function ActivityCalendar({ progress }: Props) {
  const weeks = buildWeeks(progress);
  const allDays = weeks.flat();
  const activeDays = allDays.filter((d) => !d.isFuture && d.count > 0).length;
  const totalLessons = allDays.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Practice Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">{formatRange(weeks)}</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-600">{activeDays}</p>
          <p className="text-xs text-gray-400">active {activeDays === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1.5 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs text-gray-400 font-semibold">
            {d[0]}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="space-y-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 gap-1.5">
            {week.map((day) => (
              <div
                key={day.dateStr}
                title={`${day.label}: ${day.isFuture ? '—' : day.count === 0 ? 'No practice' : `${day.count} lesson${day.count > 1 ? 's' : ''}`}`}
                className={cellClass(day.count, day.isFuture, day.isToday)}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-xs text-gray-400">
          {totalLessons === 0
            ? 'No lessons this month yet — start practising!'
            : `${totalLessons} lesson${totalLessons > 1 ? 's' : ''} completed this period`}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-600" />
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}
