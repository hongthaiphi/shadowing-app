-- Chạy file này trong Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cykksxxcjduehsgtppet/sql

CREATE TABLE IF NOT EXISTS public.lessons (
  id               TEXT PRIMARY KEY,
  title            TEXT NOT NULL,
  type             TEXT NOT NULL CHECK (type IN ('shadowing', 'dictation', 'speaking')),
  level            TEXT NOT NULL,
  topic            TEXT NOT NULL,
  subtype          TEXT,
  transcript       TEXT,
  chunks           JSONB,
  prompt           TEXT,
  example_answer   TEXT,
  hints            JSONB,
  audio_url        TEXT,
  audio_slow_url   TEXT,
  image_url        TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 5,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_read" ON public.lessons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "lessons_write" ON public.lessons
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lessons_updated_at
  BEFORE UPDATE ON public.lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
