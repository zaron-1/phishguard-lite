ALTER TABLE public.academy_profiles
  ADD COLUMN IF NOT EXISTS active_path_slug text,
  ADD COLUMN IF NOT EXISTS path_completed boolean NOT NULL DEFAULT false;

UPDATE public.academy_profiles
SET active_path_slug = COALESCE(active_path_slug, recommended_path)
WHERE active_path_slug IS NULL;

CREATE OR REPLACE FUNCTION public.guard_academy_active_path()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.active_path_slug IS NULL THEN
      NEW.active_path_slug := NEW.recommended_path;
    END IF;
    NEW.path_completed := false;
    RETURN NEW;
  END IF;

  IF auth.role() = 'authenticated' THEN
    IF NEW.path_completed IS DISTINCT FROM OLD.path_completed THEN
      NEW.path_completed := OLD.path_completed;
    END IF;

    IF OLD.active_path_slug IS NOT NULL
      AND NEW.active_path_slug IS DISTINCT FROM OLD.active_path_slug
      AND NOT OLD.path_completed THEN
      RAISE EXCEPTION 'Complete the active learning path before choosing another path';
    END IF;
  END IF;

  IF NEW.active_path_slug IS NULL THEN
    NEW.active_path_slug := OLD.active_path_slug;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS academy_active_path_guard ON public.academy_profiles;
CREATE TRIGGER academy_active_path_guard
BEFORE INSERT OR UPDATE ON public.academy_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_academy_active_path();

ALTER TABLE public.academy_lessons
  ADD COLUMN IF NOT EXISTS narration_audio_base64 text;

CREATE TABLE public.academy_module_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_slug text NOT NULL,
  course_slug text NOT NULL,
  module_index integer NOT NULL,
  lessons_completed integer NOT NULL DEFAULT 0,
  lesson_count integer NOT NULL DEFAULT 0,
  last_lesson_id text,
  assessment_score integer,
  assessment_passed boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, course_slug, module_index)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_module_progress TO authenticated;
GRANT ALL ON public.academy_module_progress TO service_role;
ALTER TABLE public.academy_module_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own academy module progress"
ON public.academy_module_progress FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
CREATE INDEX academy_module_progress_user_idx
ON public.academy_module_progress (user_id, course_slug, module_index);
CREATE TRIGGER academy_module_progress_updated_at
BEFORE UPDATE ON public.academy_module_progress
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.academy_module_assessments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_slug text NOT NULL,
  course_slug text NOT NULL,
  module_index integer NOT NULL,
  module_title text NOT NULL,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  question_count integer NOT NULL DEFAULT 10,
  pass_percent integer NOT NULL DEFAULT 80,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_slug, module_index)
);
GRANT ALL ON public.academy_module_assessments TO service_role;
ALTER TABLE public.academy_module_assessments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER academy_module_assessments_updated_at
BEFORE UPDATE ON public.academy_module_assessments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.academy_assessment_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_slug text NOT NULL,
  course_slug text NOT NULL,
  module_index integer NOT NULL,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.academy_assessment_attempts TO service_role;
ALTER TABLE public.academy_assessment_attempts ENABLE ROW LEVEL SECURITY;
CREATE INDEX academy_assessment_attempts_user_idx
ON public.academy_assessment_attempts (user_id, course_slug, module_index, created_at DESC);