'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';

// Maximum submissions fetched per load — prevents unbounded memory/network usage
const SUBMISSION_LIMIT = 500;

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  id:         string;
  user_id:    string;
  lesson_id:  string;
  content:    string;
  word_count: number;
  saved_at:   string;
}

interface Profile {
  id:    string;
  name:  string;
  email: string;
  role:  string;
}

interface EnrichedSubmission extends Submission {
  studentName:  string;
  studentEmail: string;
  lessonTitle:  string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SubmissionsAdmin() {
  const [submissions, setSubmissions]   = useState<EnrichedSubmission[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState('');

  // Filters
  const [searchText, setSearchText]     = useState('');
  const [lessonFilter, setLessonFilter] = useState('all');

  // View modal
  const [viewing, setViewing]           = useState<EnrichedSubmission | null>(null);

  // ── Load ────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const supabase = getSupabase();

      // 1. Fetch submissions (bounded to prevent unbounded memory/network usage)
      const { data: subs, error: subErr } = await supabase
        .from('writing_submissions')
        .select('*')
        .order('saved_at', { ascending: false })
        .limit(SUBMISSION_LIMIT);

      if (subErr) throw new Error(`Submissions: ${subErr.message}`);

      // 2. Derive the set of submitter IDs so we only fetch those profiles
      const submitterIds = Array.from(new Set(((subs ?? []) as Submission[]).map((s) => s.user_id)));

      // 3. Fetch profiles and lessons in parallel — profiles scoped to submitters only
      const [{ data: profiles, error: profErr }, { data: wLessons, error: wErr }] =
        await Promise.all([
          submitterIds.length > 0
            ? supabase.from('profiles').select('id, name, email, role').in('id', submitterIds)
            : Promise.resolve({ data: [] as Profile[], error: null }),
          supabase.from('writing_lessons').select('id, title'),
        ]);

      if (profErr) throw new Error(`Profiles: ${profErr.message}`);
      if (wErr)    throw new Error(`Writing lessons: ${wErr.message}`);

      const profileMap: Record<string, Profile> = Object.fromEntries(
        ((profiles ?? []) as Profile[]).map((p) => [p.id, p])
      );
      const lessonMap: Record<string, string> = Object.fromEntries(
        ((wLessons ?? []) as { id: string; title: string }[]).map((l) => [l.id, l.title])
      );

      const enriched: EnrichedSubmission[] = ((subs ?? []) as Submission[]).map((s) => ({
        ...s,
        studentName:  profileMap[s.user_id]?.name  ?? 'Unknown',
        studentEmail: profileMap[s.user_id]?.email ?? s.user_id,
        lessonTitle:  lessonMap[s.lesson_id]        ?? s.lesson_id,
      }));

      setSubmissions(enriched);
    } catch (err) {
      setLoadError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Close essay-view modal on Escape
  useEffect(() => {
    if (!viewing) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setViewing(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [viewing]);

  // ── Derived data ────────────────────────────────────────────
  const uniqueLessons = Array.from(
    new Map(submissions.map((s) => [s.lesson_id, s.lessonTitle])).entries()
  ).sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = submissions.filter((s) => {
    if (lessonFilter !== 'all' && s.lesson_id !== lessonFilter) return false;
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      if (
        !s.studentName.toLowerCase().includes(q) &&
        !s.studentEmail.toLowerCase().includes(q) &&
        !s.lessonTitle.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Student Writing Submissions</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
            ? 'Loading…'
            : `${submissions.length} submission${submissions.length !== 1 ? 's' : ''}${submissions.length >= SUBMISSION_LIMIT ? ` (showing latest ${SUBMISSION_LIMIT})` : ''}`
          }
          </p>
        </div>
        <button
          onClick={loadData}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {loadError && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          {loadError}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total',         value: submissions.length,                                              color: 'text-violet-700', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Students',      value: new Set(submissions.map(s => s.user_id)).size,                   color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-100'     },
          { label: 'Lessons',       value: new Set(submissions.map(s => s.lesson_id)).size,                 color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-100'   },
          { label: 'Avg Words',     value: submissions.length > 0 ? Math.round(submissions.reduce((s, r) => s + r.word_count, 0) / submissions.length) : 0, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
        ].map((s) => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search by student or lesson…"
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
          />
        </div>
        <select
          value={lessonFilter}
          onChange={(e) => setLessonFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white min-w-[180px]"
        >
          <option value="all">All Lessons</option>
          {uniqueLessons.map(([id, title]) => (
            <option key={id} value={id}>{title}</option>
          ))}
        </select>
        {(searchText || lessonFilter !== 'all') && (
          <button
            onClick={() => { setSearchText(''); setLessonFilter('all'); }}
            className="px-3 py-2 text-xs font-semibold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results note */}
      {(searchText || lessonFilter !== 'all') && (
        <p className="text-sm text-gray-500 mb-4">
          {filtered.length} result{filtered.length !== 1 ? 's' : ''} found
        </p>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <div className="text-5xl mb-4">📭</div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">
            {submissions.length === 0 ? 'No submissions yet' : 'No results match your filters'}
          </h3>
          <p className="text-gray-400 text-sm">
            {submissions.length === 0
              ? 'Student essays will appear here once they complete writing lessons'
              : 'Try adjusting your search or filter'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Lesson</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Words</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div>
                        <span className="font-medium text-gray-800 text-sm">{sub.studentName}</span>
                        <p className="text-xs text-gray-400 mt-0.5">{sub.studentEmail}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div>
                        <span className="text-sm text-gray-700 font-medium">{sub.lessonTitle}</span>
                        <p className="text-xs text-gray-400 font-mono mt-0.5">{sub.lesson_id}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-semibold ${
                        sub.word_count >= 100 ? 'text-emerald-600' :
                        sub.word_count >= 50  ? 'text-amber-600'   : 'text-red-500'
                      }`}>
                        {sub.word_count}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400">
                      {formatDate(sub.saved_at)}
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setViewing(sub)}
                        className="text-xs font-semibold text-violet-600 hover:text-violet-800 px-2.5 py-1.5 bg-violet-50 rounded-lg hover:bg-violet-100 transition-colors"
                      >
                        Read Essay
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Essay modal ───────────────────────────────────────── */}
      {viewing && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-800">
                    ✍️ {viewing.studentName}&apos;s Essay
                  </h3>
                  <p className="text-sm text-gray-500 mt-0.5">{viewing.lessonTitle}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                    <span>{viewing.word_count} words</span>
                    <span>·</span>
                    <span>{formatDate(viewing.saved_at)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setViewing(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Essay content */}
            <div className="p-6">
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[60vh] overflow-y-auto border border-gray-100">
                {viewing.content || <span className="text-gray-400 italic">No content</span>}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setViewing(null)}
                className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
