import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type LandingContent = {
  badge: string;
  headline: string;
  subheadline: string;
  ctaLabel: string;
  heroCardTitle: string;
  heroCardText: string;
  heroImageUrl: string;
  vaultTitle: string;
  vaultText: string;
  announcement: string;
};

export const DEFAULT_LANDING: LandingContent = {
  badge: "AI-powered cybersecurity platform",
  headline: "Stop phishing before it hooks you.",
  subheadline:
    "Paste any link to get an instant AI risk verdict, sharpen your skills with a cybersecurity AI tutor, and keep your passwords safe — all in one secure, lightweight app.",
  ctaLabel: "Analyze a link",
  heroCardTitle: "Your all-in-one cyber shield",
  heroCardText: "Analyze suspicious links, learn security skills, and lock your passwords away safely.",
  heroImageUrl: "",
  vaultTitle: "Never forget a password again.",
  vaultText:
    "Generate strong, unique passwords and store them securely in your personal vault. One master sign-in, total peace of mind.",
  announcement: "",
};

const LandingSchema = z.object({
  badge: z.string().max(160),
  headline: z.string().max(200),
  subheadline: z.string().max(600),
  ctaLabel: z.string().max(60),
  heroCardTitle: z.string().max(120),
  heroCardText: z.string().max(400),
  heroImageUrl: z.string().max(2048),
  vaultTitle: z.string().max(160),
  vaultText: z.string().max(600),
  announcement: z.string().max(300),
});

async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Access denied: administrator privileges required.");
}

export const getLandingContent = createServerFn({ method: "GET" }).handler(
  async (): Promise<LandingContent> => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data } = await supabaseAdmin
        .from("site_content")
        .select("value")
        .eq("key", "landing")
        .maybeSingle();
      return { ...DEFAULT_LANDING, ...((data?.value as Partial<LandingContent>) ?? {}) };
    } catch {
      return DEFAULT_LANDING;
    }
  },
);

export const updateLandingContent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => LandingSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("site_content").upsert(
      {
        key: "landing",
        value: data as any,
        updated_at: new Date().toISOString(),
        updated_by: context.userId,
      },
      { onConflict: "key" },
    );
    if (error) throw new Error("Could not save site content.");
    await supabaseAdmin.from("admin_actions").insert({
      admin_id: context.userId,
      action: "update_site_content:landing",
      target_user_id: null,
      details: {} as any,
    });
    return { ok: true };
  });

const UploadSchema = z.object({
  fileName: z.string().trim().min(1).max(200),
  contentType: z.string().trim().max(120),
  dataBase64: z.string().min(10).max(8_000_000),
});

export const uploadSiteAsset = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UploadSchema.parse(input))
  .handler(async ({ data, context }): Promise<{ url: string }> => {
    await assertAdmin(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const binary = Uint8Array.from(atob(data.dataBase64), (c) => c.charCodeAt(0));
    const safeName = data.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `landing/${Date.now()}-${safeName}`;

    const { error } = await supabaseAdmin.storage
      .from("site-assets")
      .upload(path, binary, { contentType: data.contentType || "application/octet-stream", upsert: true });
    if (error) throw new Error("Upload failed.");

    const { data: signed, error: signErr } = await supabaseAdmin.storage
      .from("site-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365 * 10);
    if (signErr || !signed?.signedUrl) throw new Error("Could not create asset URL.");

    return { url: signed.signedUrl };
  });
