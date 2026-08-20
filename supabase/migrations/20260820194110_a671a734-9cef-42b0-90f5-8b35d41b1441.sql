CREATE TABLE public.academy_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_level text NOT NULL DEFAULT 'beginner',
  career_interest text,
  weekly_hours integer NOT NULL DEFAULT 5,
  learning_goal text,
  recommended_path text,
  onboarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_profiles TO authenticated;
GRANT ALL ON public.academy_profiles TO service_role;
ALTER TABLE public.academy_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own academy profile" ON public.academy_profiles FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.academy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path_slug text NOT NULL,
  course_slug text NOT NULL,
  lesson_id text NOT NULL,
  lesson_title text NOT NULL DEFAULT '',
  completed boolean NOT NULL DEFAULT false,
  listened_seconds integer NOT NULL DEFAULT 0,
  completed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_progress TO authenticated;
GRANT ALL ON public.academy_progress TO service_role;
ALTER TABLE public.academy_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own academy progress" ON public.academy_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read academy progress" ON public.academy_progress FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE INDEX academy_progress_user_idx ON public.academy_progress (user_id, updated_at DESC);

CREATE TABLE public.academy_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  course_slug text NOT NULL,
  lesson_title text NOT NULL DEFAULT '',
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_bookmarks TO authenticated;
GRANT ALL ON public.academy_bookmarks TO service_role;
ALTER TABLE public.academy_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own academy bookmarks" ON public.academy_bookmarks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.academy_quiz_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id text NOT NULL,
  course_slug text NOT NULL,
  kind text NOT NULL DEFAULT 'lesson',
  score integer NOT NULL DEFAULT 0,
  total integer NOT NULL DEFAULT 0,
  weak_topics jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academy_quiz_results TO authenticated;
GRANT ALL ON public.academy_quiz_results TO service_role;
ALTER TABLE public.academy_quiz_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own academy quiz results" ON public.academy_quiz_results FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.academy_lessons (
  lesson_id text PRIMARY KEY,
  course_slug text NOT NULL,
  path_slug text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_takeaways jsonb NOT NULL DEFAULT '[]'::jsonb,
  glossary jsonb NOT NULL DEFAULT '[]'::jsonb,
  tools jsonb NOT NULL DEFAULT '[]'::jsonb,
  knowledge_check jsonb NOT NULL DEFAULT '[]'::jsonb,
  narration text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.academy_lessons TO authenticated;
GRANT ALL ON public.academy_lessons TO service_role;
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Signed-in learners read lesson library" ON public.academy_lessons FOR SELECT TO authenticated USING (true);

CREATE TRIGGER academy_profiles_updated_at BEFORE UPDATE ON public.academy_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER academy_progress_updated_at BEFORE UPDATE ON public.academy_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER academy_lessons_updated_at BEFORE UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();