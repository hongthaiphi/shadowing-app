'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getUser, logout, User } from '@/lib/auth';

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

  const navLinks = [
    { href: '/', label: 'Home' },
    ...(user ? [
      { href: '/lessons', label: 'Lessons' },
      { href: '/progress', label: 'Progress' },
      ...(user.role === 'admin' || user.role === 'teacher' ? [{ href: '/admin', label: 'Admin' }] : []),
    ] : []),
  ];

  function isActive(href: string) {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  }

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-800 hover:opacity-80 transition-opacity">
            <span className="text-2xl">🎧</span>
            <span className="bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent">
              ShadowSpeak
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  isActive(link.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="block h-0.5 bg-gradient-to-r from-blue-500 to-violet-500 rounded-full mt-0.5" />
                )}
              </Link>
            ))}
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  <span className="font-medium text-gray-800">{user.name}</span>
                  {user.role !== 'student' && (
                    <span className="ml-1 text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium capitalize">
                      {user.role}
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-violet-500 px-4 py-2 rounded-xl hover:opacity-90 transition-opacity shadow-sm"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current rounded transition-all ${menuOpen ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current rounded transition-all ${menuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 bg-current rounded transition-all ${menuOpen ? '-rotate-45 -translate-y-1.5' : ''}`} />
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`block px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
                  isActive(link.href)
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-gray-100">
              {user ? (
                <div className="px-4">
                  <p className="text-sm text-gray-500 mb-2">{user.email}</p>
                  <button
                    onClick={handleLogout}
                    className="w-full text-sm text-left text-red-600 font-medium py-2 px-3 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 px-4">
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-medium text-center text-gray-700 py-2 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMenuOpen(false)}
                    className="text-sm font-bold text-center text-white bg-gradient-to-r from-blue-500 to-violet-500 py-2 px-4 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
