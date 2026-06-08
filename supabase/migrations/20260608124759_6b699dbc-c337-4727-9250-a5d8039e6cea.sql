CREATE TABLE public.vault_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name TEXT NOT NULL,
  site_url TEXT,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vault_credentials TO authenticated;
GRANT ALL ON public.vault_credentials TO service_role;

ALTER TABLE public.vault_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own credentials"
  ON public.vault_credentials
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_vault_credentials_updated_at
  BEFORE UPDATE ON public.vault_credentials
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();