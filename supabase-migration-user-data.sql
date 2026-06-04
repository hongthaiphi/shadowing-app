-- Chạy file này trong Supabase SQL Editor:
-- https://supabase.com/dashboard/project/cykksxxcjduehsgtppet/sql

-- Reading annotations (per user per lesson)
CREATE TABLE IF NOT EXISTS public.reading_annotations (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL,
  annotations JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.reading_annotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "annotations_own" ON public.reading_annotations
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Writing drafts (per user per lesson)
CREATE TABLE IF NOT EXISTS public.writing_drafts (
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  TEXT NOT NULL,
  draft_text TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, lesson_id)
);

ALTER TABLE public.writing_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "drafts_own" ON public.writing_drafts
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Auto-update updated_at trigger (reuse function if already exists)
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reading_annotations_updated_at
  BEFORE UPDATE ON public.reading_annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER writing_drafts_updated_at
  BEFORE UPDATE ON public.writing_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
