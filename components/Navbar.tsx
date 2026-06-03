'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUser, logout, User } from '@/lib/auth';
import { getStreak } from '@/lib/progress';

function BrandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12 q 3 -7 6 0 t 6 0" />
      <path d="M16 12 h3" />
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [streak, setStreak] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
    setStreak(getStreak());
  }, [pathname]);

  async function handleLogout() {
    await logout();
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  }

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  const navLinks = [
    ...(user ? [{ href: '/dashboard', label: 'Today' }] : []),
    { href: '/lessons', label: 'Library' },
    ...(user ? [{ href: '/progress', label: 'Progress' }] : []),
    ...(user && (user.role === 'admin' || user.role === 'teacher')
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ];

  const initial = user?.name?.[0]?.toUpperCase() ?? 'G';

  return (
    <div className="cd-nav-shell">
      <header style={{ maxWidth: 'var(--maxw)', margin: '0 auto', padding: '14px var(--pad)', display: 'flex', alignItems: 'center', gap: 26, position: 'relative' }}>
        {/* Brand */}
        <Link href="/" className="brand" aria-label="Cadence home">
          <span className="brand-mark"><BrandIcon /></span>
          Cadence
        </Link>

        {/* Desktop nav */}
        <nav className="nav-links" aria-label="Main navigation">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(link.href) ? 'on' : ''}>
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Streak chip */}
        {streak > 0 && (
          <div className="nav-streak" aria-label={`${streak}-day streak`}>
            🔥 {streak}-day streak
          </div>
        )}

        {/* Auth / avatar */}
        <div className="nav-auth">
          {user ? (
            <>
              {user.role !== 'student' && (
                <span style={{
                  fontSize: 11, padding: '3px 8px', borderRadius: 6, fontWeight: 700,
                  textTransform: 'capitalize', letterSpacing: '0.04em',
                  background: 'var(--violet-t)', color: 'var(--violet)',
                }}>
                  {user.role}
                </span>
              )}
              <button
                className="nav-av"
                onClick={handleLogout}
                title={`${user.name} — click to sign out`}
                aria-label="Sign out"
              >
                {initial}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="nav-ghost">Sign in</Link>
              <Link href="/register" className="nav-solid">Start free →</Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="nav-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          <span style={{ transform: menuOpen ? 'translateY(3.5px) rotate(45deg)' : 'none' }} />
          <span style={{ opacity: menuOpen ? 0 : 1 }} />
          <span style={{ transform: menuOpen ? 'translateY(-3.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div style={{
          borderTop: '1px solid var(--line)',
          padding: '12px var(--pad) 16px',
          display: 'flex', flexDirection: 'column', gap: 4,
          background: 'var(--bg)',
        }}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 12px', borderRadius: 10, fontSize: 15,
                fontWeight: isActive(link.href) ? 700 : 500,
                color: isActive(link.href) ? 'var(--accent)' : 'var(--muted)',
                background: isActive(link.href) ? 'color-mix(in oklab, var(--accent), transparent 92%)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px dashed var(--line)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {user ? (
              <button
                onClick={handleLogout}
                style={{ textAlign: 'left', padding: '10px 12px', borderRadius: 10, fontSize: 14, color: 'var(--coral)', fontWeight: 600, background: 'var(--coral-t)' }}
              >
                Sign out ({user.name})
              </button>
            ) : (
              <>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{ padding: '10px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600, color: 'var(--ink)', textAlign: 'center', border: '1px solid var(--line)' }}>
                  Sign in
                </Link>
                <Link href="/register" onClick={() => setMenuOpen(false)} style={{ padding: '11px 12px', borderRadius: 10, fontSize: 14, fontWeight: 700, textAlign: 'center', background: 'var(--accent)', color: '#fff' }}>
                  Start free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
