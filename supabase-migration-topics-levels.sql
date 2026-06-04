-- Chạy file này trong Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cykksxxcjduehsgtppet/sql

CREATE TABLE IF NOT EXISTS public.app_topics (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  emoji      TEXT NOT NULL DEFAULT '📚',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.app_levels (
  id         TEXT PRIMARY KEY,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT 'bg-gray-100 text-gray-600',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS: everyone can read, only admin/teacher can write
ALTER TABLE public.app_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "topics_read" ON public.app_topics
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "topics_write" ON public.app_topics
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

CREATE POLICY "levels_read" ON public.app_levels
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "levels_write" ON public.app_levels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Seed default data (chỉ insert nếu chưa có)
INSERT INTO public.app_topics (id, label, emoji, sort_order) VALUES
  ('school',        'School',        '🏫', 0),
  ('hobbies',       'Hobbies',       '🎨', 1),
  ('family',        'Family',        '👨‍👩‍👧', 2),
  ('food',          'Food',          '🍽️', 3),
  ('daily routine', 'Daily Routine', '⏰', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.app_levels (id, label, color, sort_order) VALUES
  ('Starter', 'Starter', 'bg-emerald-100 text-emerald-700', 0),
  ('Level 1', 'Level 1', 'bg-blue-100 text-blue-700',       1),
  ('Level 2', 'Level 2', 'bg-indigo-100 text-indigo-700',   2)
ON CONFLICT (id) DO NOTHING;
