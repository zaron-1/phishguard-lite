-- 1. Roles enum + table
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2. Security-definer role check (prevents recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Expand profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_picture text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE POLICY "Admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Search history
CREATE TABLE public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_category text,
  search_results_count integer NOT NULL DEFAULT 0,
  ip_address text,
  searched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_history TO authenticated;
GRANT ALL ON public.search_history TO service_role;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own search history" ON public.search_history
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read all search history" ON public.search_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 5. Admin actions log
CREATE TABLE public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  target_user_id uuid,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.admin_actions TO authenticated;
GRANT ALL ON public.admin_actions TO service_role;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read action log" ON public.admin_actions
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- 6. Auto-assign roles on signup (extend existing trigger function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, phone, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(COALESCE(NEW.email, ''), '@', 1))
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    CASE WHEN lower(NEW.email) = 'ikolshlib@gmail.com'
      THEN 'admin'::public.app_role
      ELSE 'user'::public.app_role
    END
  )
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 7. Backfill roles for existing users
INSERT INTO public.user_roles (user_id, role)
SELECT id,
  CASE WHEN lower(email) = 'ikolshlib@gmail.com'
    THEN 'admin'::public.app_role
    ELSE 'user'::public.app_role
  END
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;