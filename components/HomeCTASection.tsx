'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { isLoggedIn } from '@/lib/auth';

export default function HomeCTASection() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setMounted(true);
  }, []);

  if (!mounted) return null;
  if (loggedIn) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 pb-20">
      <div className="bg-gradient-to-br from-blue-600 to-violet-700 rounded-3xl p-10 text-center text-white">
        <h2 className="text-3xl font-black mb-4">Ready to improve your English?</h2>
        <p className="text-blue-100 mb-8 text-lg">
          Join thousands of learners building better English skills every day.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="px-8 py-3.5 bg-white text-blue-700 rounded-xl font-black hover:bg-blue-50 transition-all shadow-lg"
          >
            Start for Free
          </Link>
          <Link
            href="/lessons"
            className="px-8 py-3.5 bg-white/10 text-white rounded-xl font-bold border border-white/30 hover:bg-white/20 transition-all"
          >
            Browse Lessons
          </Link>
        </div>
      </div>
    </section>
  );
}
