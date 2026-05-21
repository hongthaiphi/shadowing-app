export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  email: string;
  role: Role;
  name: string;
}

const ADMIN_EMAILS = ['admin@test.com'];
const TEACHER_EMAILS = ['teacher@test.com'];

function getRoleForEmail(email: string): Role {
  if (ADMIN_EMAILS.includes(email.toLowerCase())) return 'admin';
  if (TEACHER_EMAILS.includes(email.toLowerCase())) return 'teacher';
  return 'student';
}

function getNameFromEmail(email: string): string {
  const parts = email.split('@')[0].split('.');
  return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function login(email: string, _password: string): User {
  const role = getRoleForEmail(email);
  const name = getNameFromEmail(email);
  const user: User = { email: email.toLowerCase(), role, name };

  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    // Set a simple session cookie for middleware
    document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ email: user.email, role: user.role }))}; path=/; max-age=86400`;
  }

  return user;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
    document.cookie = 'user_session=; path=/; max-age=0';
  }
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function isLoggedIn(): boolean {
  return getUser() !== null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function register(name: string, email: string, _password: string): User {
  const role = getRoleForEmail(email);
  const user: User = { email: email.toLowerCase(), role, name };

  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
    document.cookie = `user_session=${encodeURIComponent(JSON.stringify({ email: user.email, role: user.role }))}; path=/; max-age=86400`;
  }

  return user;
}
