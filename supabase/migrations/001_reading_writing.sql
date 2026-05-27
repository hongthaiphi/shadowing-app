-- ============================================================
-- Migration: Reading & Writing lesson tables + submissions
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- reading_lessons
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reading_lessons (
  id               TEXT        PRIMARY KEY,
  title            TEXT        NOT NULL,
  level            TEXT        NOT NULL,
  topic            TEXT        NOT NULL,
  image_url        TEXT,
  word_count       INTEGER,
  duration_minutes INTEGER     NOT NULL DEFAULT 5,
  paragraphs       JSONB       NOT NULL DEFAULT '[]',
  questions        JSONB       NOT NULL DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reading_lessons_updated_at
  BEFORE UPDATE ON public.reading_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS: public read, teacher/admin write
ALTER TABLE public.reading_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reading_lessons_select_all"
  ON public.reading_lessons FOR SELECT
  USING (true);

CREATE POLICY "reading_lessons_insert_teacher"
  ON public.reading_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "reading_lessons_update_teacher"
  ON public.reading_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "reading_lessons_delete_admin"
  ON public.reading_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- writing_lessons
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.writing_lessons (
  id                  TEXT        PRIMARY KEY,
  title               TEXT        NOT NULL,
  level               TEXT        NOT NULL,
  topic               TEXT        NOT NULL,
  task_type           TEXT        NOT NULL
                        CHECK (task_type IN ('descriptive', 'opinion', 'narrative', 'compare-contrast')),
  word_target         INTEGER     NOT NULL DEFAULT 100,
  duration_minutes    INTEGER     NOT NULL DEFAULT 10,
  prompt              TEXT        NOT NULL DEFAULT '',
  requirements        JSONB       NOT NULL DEFAULT '[]',
  suggested_ideas     JSONB       NOT NULL DEFAULT '[]',
  suggested_vocabulary JSONB      NOT NULL DEFAULT '[]',
  suggested_structure  JSONB      NOT NULL DEFAULT '{}',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_writing_lessons_updated_at
  BEFORE UPDATE ON public.writing_lessons
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.writing_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "writing_lessons_select_all"
  ON public.writing_lessons FOR SELECT
  USING (true);

CREATE POLICY "writing_lessons_insert_teacher"
  ON public.writing_lessons FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "writing_lessons_update_teacher"
  ON public.writing_lessons FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "writing_lessons_delete_admin"
  ON public.writing_lessons FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- writing_submissions
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.writing_submissions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id  TEXT        NOT NULL,
  content    TEXT        NOT NULL DEFAULT '',
  word_count INTEGER     NOT NULL DEFAULT 0,
  saved_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, lesson_id)
);

-- Index for teacher queries by lesson
CREATE INDEX IF NOT EXISTS idx_writing_submissions_lesson_id
  ON public.writing_submissions (lesson_id);

-- Index for student dashboard queries
CREATE INDEX IF NOT EXISTS idx_writing_submissions_user_id
  ON public.writing_submissions (user_id);

ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;

-- Students can read/write their own submissions only
CREATE POLICY "writing_submissions_select_own"
  ON public.writing_submissions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "writing_submissions_insert_own"
  ON public.writing_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "writing_submissions_update_own"
  ON public.writing_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "writing_submissions_delete_own"
  ON public.writing_submissions FOR DELETE
  USING (auth.uid() = user_id);
