import { getSupabase } from './supabase';

export type Role = 'student' | 'teacher' | 'admin';

export interface User {
  email: string;
  role: Role;
  name: string;
}

function cacheUser(user: User) {
  localStorage.setItem('user', JSON.stringify(user));
}

function clearCache() {
  localStorage.removeItem('user');
  localStorage.removeItem('shadowspeak_progress');
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

export async function requestPasswordReset(email: string): Promise<void> {
  const supabase = getSupabase();
  const redirectTo = `${window.location.origin}/reset-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
}

export async function updatePassword(newPassword: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
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

// Verifies the real Supabase session and syncs localStorage.
// Returns the User if session is valid, null if the session has expired/is missing.
// Call this in the login page useEffect to avoid stale-localStorage redirect loops.
export async function refreshSession(): Promise<User | null> {
  const supabase = getSupabase();
  const { data: { user: supaUser } } = await supabase.auth.getUser();
  if (!supaUser) {
    clearCache();
    return null;
  }
  const cached = getUser();
  if (cached) return cached;
  // localStorage was cleared but session is still valid — re-build from profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role')
    .eq('id', supaUser.id)
    .single();
  const user: User = {
    email: supaUser.email!.toLowerCase(),
    role: (profile?.role as Role) || 'student',
    name: profile?.name || supaUser.email!.split('@')[0],
  };
  cacheUser(user);
  return user;
}
