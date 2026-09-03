CREATE OR REPLACE FUNCTION public.guard_academy_active_path()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
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
REVOKE EXECUTE ON FUNCTION public.guard_academy_active_path() FROM PUBLIC, anon, authenticated;