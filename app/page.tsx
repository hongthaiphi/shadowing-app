import Link from 'next/link';
import HomeDemoSection from '@/components/HomeDemoSection';
import HomeCTASection from '@/components/HomeCTASection';

const features = [
  {
    emoji: '🎧',
    title: 'Shadowing Practice',
    description: 'Listen and repeat sentence chunks to perfect your pronunciation and rhythm.',
    gradient: 'from-blue-500 to-cyan-500',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-100',
    href: '/lessons?type=shadowing',
  },
  {
    emoji: '✏️',
    title: 'Dictation Practice',
    description: 'Test your listening comprehension by writing what you hear word for word.',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'from-violet-50 to-purple-50',
    border: 'border-violet-100',
    href: '/lessons?type=dictation',
  },
  {
    emoji: '🗣️',
    title: 'Speaking Practice',
    description: 'Record yourself and compare with native speakers to improve fluency.',
    gradient: 'from-orange-400 to-pink-500',
    bg: 'from-orange-50 to-pink-50',
    border: 'border-orange-100',
    href: '/lessons',
  },
  {
    emoji: '📊',
    title: 'Track Progress',
    description: 'See your learning streak, completed lessons, and accuracy improvements.',
    gradient: 'from-emerald-500 to-teal-500',
    bg: 'from-emerald-50 to-teal-50',
    border: 'border-emerald-100',
    href: '/progress',
  },
];

const stats = [
  { value: '20', label: 'Practice lessons' },
  { value: '3', label: 'Difficulty levels' },
  { value: '5', label: 'Topics covered' },
];

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-violet-600 to-purple-700 opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.1)_0%,_transparent_60%)]" />

        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/30">
            <span>🎧</span> English Learning App
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
            Practice English
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 to-pink-200">
              Every Day
            </span>
          </h1>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Improve your listening, pronunciation, and writing with interactive shadowing and dictation exercises.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/lessons"
              className="px-8 py-4 bg-white text-blue-700 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
            >
              Start Practising →
            </Link>
            <Link
              href="/register"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm text-white rounded-2xl font-bold text-lg border border-white/30 hover:bg-white/20 transition-all"
            >
              Create Free Account
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-8 mt-16 flex-wrap">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-black text-white">{s.value}+</p>
                <p className="text-blue-200 text-sm font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-black text-gray-800 mb-4">How ShadowSpeak Works</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Four powerful methods to build your English skills, step by step.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className={`bg-gradient-to-br ${f.bg} rounded-2xl border ${f.border} p-6 hover:shadow-lg transition-all hover:-translate-y-1 group`}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center text-2xl mb-4 shadow-md group-hover:scale-110 transition-transform`}>
                {f.emoji}
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">{f.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{f.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Demo Section */}
      <HomeDemoSection />

      {/* CTA Section — hidden when logged in */}
      <HomeCTASection />
    </div>
  );
}
