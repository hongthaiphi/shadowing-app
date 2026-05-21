import { getSupabase } from './supabase';

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  email: string;
  role: Role;
  name: string;
}

function cacheUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
  document.cookie = `user_session=${encodeURIComponent(
    JSON.stringify({ email: user.email, role: user.role })
  )}; path=/; max-age=604800`;
}

function clearCache() {
  localStorage.removeItem('user');
  localStorage.removeItem('shadowspeak_progress');
  document.cookie = 'user_session=; path=/; max-age=0';
}

async function syncProgressFromSupabase(userId: string) {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('progress')
    .select('*')
    .eq('user_id', userId);
  if (data && data.length > 0) {
    const local = data.map((p) => ({
      lessonId: p.lesson_id,
      completedAt: p.completed_at,
      timeSpent: p.time_spent,
      score: p.score ?? undefined,
      type: p.lesson_type ?? undefined,
    }));
    localStorage.setItem('shadowspeak_progress', JSON.stringify(local));
  }
}

export async function login(email: string, password: string): Promise<User> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);

  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', data.user.id)
    .single();

  const user: User = {
    email: email.toLowerCase(),
    role: (profile?.role as Role) || 'student',
    name: profile?.name || email.split('@')[0],
  };

  cacheUser(user);
  await syncProgressFromSupabase(data.user.id);
  return user;
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<{ user: User; needsConfirmation: boolean }> {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error('Registration failed. Please try again.');

  if (!data.session) {
    return {
      user: { email: email.toLowerCase(), role: 'student', name },
      needsConfirmation: true,
    };
  }

  await new Promise((r) => setTimeout(r, 600));
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', data.user.id)
    .single();

  const user: User = {
    email: email.toLowerCase(),
    role: (profile?.role as Role) || 'student',
    name: profile?.name || name,
  };

  cacheUser(user);
  return { user, needsConfirmation: false };
}

export async function logout(): Promise<void> {
  const supabase = getSupabase();
  await supabase.auth.signOut();
  clearCache();
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
