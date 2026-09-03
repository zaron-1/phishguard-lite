CREATE POLICY "Assessment banks are server managed"
ON public.academy_module_assessments
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Assessment attempts are server managed"
ON public.academy_assessment_attempts
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);

REVOKE EXECUTE ON FUNCTION public.guard_academy_active_path() FROM PUBLIC, anon, authenticated;