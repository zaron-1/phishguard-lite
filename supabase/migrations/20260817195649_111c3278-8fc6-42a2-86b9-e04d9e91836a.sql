CREATE TABLE public.security_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null default 'Security Assessment Report',
  risk_rating text,
  summary text,
  content text not null,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.security_reports TO authenticated;
GRANT ALL ON public.security_reports TO service_role;
ALTER TABLE public.security_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own reports" ON public.security_reports FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all reports" ON public.security_reports FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.site_content (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid
);
GRANT SELECT ON public.site_content TO anon;
GRANT SELECT ON public.site_content TO authenticated;
GRANT ALL ON public.site_content TO service_role;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site content" ON public.site_content FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.site_content (key, value) VALUES
('landing', '{
  "badge": "AI-powered cybersecurity platform",
  "headline": "Stop phishing before it hooks you.",
  "subheadline": "Paste any link to get an instant AI risk verdict, sharpen your skills with a cybersecurity AI tutor, and keep your passwords safe — all in one secure, lightweight app.",
  "ctaLabel": "Analyze a link",
  "heroCardTitle": "Your all-in-one cyber shield",
  "heroCardText": "Analyze suspicious links, learn security skills, and lock your passwords away safely.",
  "heroImageUrl": "",
  "vaultTitle": "Never forget a password again.",
  "vaultText": "Generate strong, unique passwords and store them securely in your personal vault. One master sign-in, total peace of mind.",
  "announcement": ""
}'::jsonb);