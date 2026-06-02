'use client';

import { LessonProgress } from '@/lib/progress';

interface Props {
  progress: LessonProgress[];
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WEEKS = 12;

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

  const dow = today.getDay();
  const daysToMonday = (dow + 6) % 7;
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - daysToMonday);

  const startDate = new Date(thisMonday);
  startDate.setDate(thisMonday.getDate() - (WEEKS - 1) * 7);

  type CalDay = {
    dateStr: string;
    count: number;
    isToday: boolean;
    isFuture: boolean;
    label: string;
    month: number;
    dayOfMonth: number;
  };

  const weeks: CalDay[][] = [];
  for (let w = 0; w < WEEKS; w++) {
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
        month: date.getMonth(),
        dayOfMonth: date.getDate(),
      });
    }
    weeks.push(week);
  }

  return weeks;
}

function cellClass(count: number, isFuture: boolean, isToday: boolean): string {
  const base = 'w-full rounded transition-colors cursor-default flex items-center justify-center';
  const ring = isToday ? ' ring-2 ring-offset-1 ring-emerald-500' : '';
  if (isFuture) return `${base} bg-gray-50${ring}`;
  if (count === 0) return `${base} bg-gray-100 hover:bg-gray-200${ring}`;
  if (count === 1) return `${base} bg-emerald-200 hover:bg-emerald-300${ring}`;
  if (count === 2) return `${base} bg-emerald-400 hover:bg-emerald-500${ring}`;
  if (count === 3) return `${base} bg-emerald-500 hover:bg-emerald-600${ring}`;
  return `${base} bg-emerald-700 hover:bg-emerald-800${ring}`;
}

function dayTextClass(count: number, isFuture: boolean): string {
  if (isFuture) return 'text-gray-300';
  if (count === 0) return 'text-gray-400';
  if (count <= 2) return 'text-emerald-800';
  return 'text-white';
}

function getMonthLabels(weeks: ReturnType<typeof buildWeeks>) {
  const labels: { month: string; colStart: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const firstDay = week[0];
    if (firstDay.month !== lastMonth) {
      labels.push({
        month: new Date(firstDay.dateStr).toLocaleDateString('en-GB', { month: 'short' }),
        colStart: wi,
      });
      lastMonth = firstDay.month;
    }
  });
  return labels;
}

export default function ActivityCalendar({ progress }: Props) {
  const weeks = buildWeeks(progress);
  const allDays = weeks.flat();
  const activeDays = allDays.filter((d) => !d.isFuture && d.count > 0).length;
  const totalLessons = allDays.reduce((s, d) => s + d.count, 0);
  const monthLabels = getMonthLabels(weeks);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-800">Practice Activity</h2>
          <p className="text-xs text-gray-400 mt-0.5">Last {WEEKS} weeks</p>
        </div>
        <div className="text-right">
          <p className="text-xl font-black text-emerald-600">{activeDays}</p>
          <p className="text-xs text-gray-400">active {activeDays === 1 ? 'day' : 'days'}</p>
        </div>
      </div>

      {/* Month labels */}
      <div className="relative mb-1" style={{ display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
        {monthLabels.map((m) => (
          <div
            key={m.month + m.colStart}
            className="text-xs text-gray-400 font-medium"
            style={{ gridColumnStart: m.colStart + 1 }}
          >
            {m.month}
          </div>
        ))}
      </div>

      {/* Main grid: columns = weeks, rows = days */}
      <div className="flex gap-1">
        {/* Day labels on the left */}
        <div className="flex flex-col gap-1 pt-0" style={{ minWidth: 24 }}>
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              className="text-xs text-gray-400 font-medium flex items-center"
              style={{ height: 12, visibility: i % 2 === 0 ? 'visible' : 'hidden' }}
            >
              {d[0]}
            </div>
          ))}
        </div>

        {/* Calendar columns (one per week) */}
        <div className="flex-1 grid gap-1" style={{ gridTemplateColumns: `repeat(${WEEKS}, minmax(0, 1fr))` }}>
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {week.map((day) => (
                <div
                  key={day.dateStr}
                  title={`${day.label}: ${day.isFuture ? '—' : day.count === 0 ? 'No practice' : `${day.count} lesson${day.count > 1 ? 's' : ''}`}`}
                  className={cellClass(day.count, day.isFuture, day.isToday)}
                  style={{ aspectRatio: '1', fontSize: '9px' }}
                >
                  <span className={`font-medium select-none ${dayTextClass(day.count, day.isFuture)}`}>
                    {day.dayOfMonth}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-400">
          {totalLessons === 0
            ? 'No lessons yet — start practising!'
            : `${totalLessons} lesson${totalLessons > 1 ? 's' : ''} in the last ${WEEKS} weeks`}
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400">Less</span>
          <div className="w-3 h-3 rounded-sm bg-gray-100 border border-gray-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-200" />
          <div className="w-3 h-3 rounded-sm bg-emerald-400" />
          <div className="w-3 h-3 rounded-sm bg-emerald-500" />
          <div className="w-3 h-3 rounded-sm bg-emerald-700" />
          <span className="text-xs text-gray-400">More</span>
        </div>
      </div>
    </div>
  );
}
