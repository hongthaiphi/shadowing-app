'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUser, logout, User } from '@/lib/auth';

function WaveIcon() {
  return (
    <svg
      viewBox="0 0 28 28" width="22" height="22" fill="none"
      stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 14 Q 9 6 14 14 T 23 14" />
      <path d="M5 14 Q 9 22 14 14 T 23 14" opacity=".4" />
    </svg>
  );
}

/* Hamburger bar shared style */
const BAR: React.CSSProperties = {
  display: 'block', width: 18, height: 1.5,
  background: 'var(--ink)', borderRadius: 2,
  transition: 'transform .2s, opacity .2s',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setUser(getUser());
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
    { href: '/lessons',  label: 'Lessons' },
    ...(user ? [{ href: '/progress', label: 'Progress' }] : []),
    ...(user && (user.role === 'admin' || user.role === 'teacher')
      ? [{ href: '/admin', label: 'Admin' }]
      : []),
  ];

  return (
    <header className="ss-nav" role="banner">
      {/* ── Logo ── */}
      <Link href="/" className="ss-logo" aria-label="ShadowSpeak home">
        <span className="ss-logo-mark"><WaveIcon /></span>
        <span className="ss-logo-word">Shadow<em>speak</em></span>
      </Link>

      {/* ── Desktop centre nav ── */}
      <nav className="ss-nav-links" aria-label="Main navigation">
        {navLinks.map((link) => (
          <Link key={link.href} href={link.href} className={isActive(link.href) ? 'on' : ''}>
            {link.label}
          </Link>
        ))}
      </nav>

      {/* ── Desktop right (auth + hamburger) ── */}
      <div className="ss-nav-cta">
        {/* Auth area — hidden on mobile via .ss-nav-cta-auth class */}
        <span className="ss-nav-cta-auth" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>
                {user.name}
                {user.role !== 'student' && (
                  <span style={{
                    marginLeft: 6, fontSize: 11, padding: '2px 7px',
                    borderRadius: 4,
                    background: 'color-mix(in oklab, var(--accent), transparent 85%)',
                    color: 'var(--accent)', fontWeight: 600, textTransform: 'capitalize',
                  }}>
                    {user.role}
                  </span>
                )}
              </span>
              <button className="ss-btn-ghost" onClick={handleLogout}>Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login"    className="ss-btn-ghost">Sign in</Link>
              <Link href="/register" className="ss-btn-solid">Start free →</Link>
            </>
          )}
        </span>

        {/* Hamburger — shown on mobile via CSS */}
        <button
          className="ss-mobile-menu-btn"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle navigation menu"
          aria-expanded={menuOpen}
          style={{
            width: 36, height: 36, borderRadius: 8, cursor: 'pointer',
            border: '1px solid color-mix(in oklab, var(--ink), transparent 88%)',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
            background: 'transparent',
          }}
        >
          <span style={{ ...BAR, transform: menuOpen ? 'translateY(3.5px) rotate(45deg)' : 'none' }} />
          <span style={{ ...BAR, opacity: menuOpen ? 0 : 1 }} />
          <span style={{ ...BAR, transform: menuOpen ? 'translateY(-3.5px) rotate(-45deg)' : 'none' }} />
        </button>
      </div>

      {/* ── Mobile drawer (only rendered when open) ── */}
      {menuOpen && (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: '12px 0 4px',
            borderTop: '1px solid color-mix(in oklab, var(--ink), transparent 90%)',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              style={{
                padding: '10px 16px', borderRadius: 8, fontSize: 15,
                fontWeight: isActive(link.href) ? 600 : 400,
                color: isActive(link.href) ? 'var(--ink)' : 'var(--muted)',
                background: isActive(link.href)
                  ? 'color-mix(in oklab, var(--ink), transparent 92%)'
                  : 'transparent',
              }}
            >
              {link.label}
            </Link>
          ))}

          <div style={{
            marginTop: 8, paddingTop: 12,
            borderTop: '1px dashed color-mix(in oklab, var(--ink), transparent 88%)',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {user ? (
              <>
                <span style={{ padding: '0 16px', fontSize: 13, color: 'var(--muted)' }}>
                  {user.email}
                </span>
                <button
                  onClick={handleLogout}
                  style={{
                    textAlign: 'left', padding: '10px 16px', borderRadius: 8,
                    fontSize: 14, color: 'var(--accent)', fontWeight: 500,
                    background: 'color-mix(in oklab, var(--accent), transparent 92%)',
                    cursor: 'pointer', border: 'none',
                  }}
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: '10px 16px', borderRadius: 8, fontSize: 14,
                    fontWeight: 500, color: 'var(--ink)', textAlign: 'center',
                    border: '1px solid color-mix(in oklab, var(--ink), transparent 85%)',
                  }}
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    padding: '11px 16px', borderRadius: 999, fontSize: 14,
                    fontWeight: 500, textAlign: 'center',
                    background: 'var(--ink)', color: 'var(--bg)',
                  }}
                >
                  Start free →
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
