import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type VaultCredential = {
  id: string;
  siteName: string;
  siteUrl: string | null;
  username: string;
  password: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapRow(r: any): VaultCredential {
  return {
    id: r.id,
    siteName: r.site_name,
    siteUrl: r.site_url,
    username: r.username,
    password: r.password,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const getMyCredentials = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<VaultCredential[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("vault_credentials")
      .select("id, site_name, site_url, username, password, notes, created_at, updated_at")
      .eq("user_id", userId)
      .order("site_name", { ascending: true })
      .limit(500);
    if (error) throw new Error("Could not load your vault.");
    return (data ?? []).map(mapRow);
  });

const CredentialInput = z.object({
  siteName: z.string().trim().min(1).max(120),
  siteUrl: z.string().trim().max(2048).optional().or(z.literal("")),
  username: z.string().trim().min(1).max(255),
  password: z.string().min(1).max(512),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const addCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CredentialInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("vault_credentials").insert({
      user_id: userId,
      site_name: data.siteName,
      site_url: data.siteUrl || null,
      username: data.username,
      password: data.password,
      notes: data.notes || null,
    });
    if (error) throw new Error("Could not save credential.");
    return { ok: true };
  });

export const deleteCredential = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // RLS scopes deletion to the owner; explicit filter is defense in depth.
    const { error } = await supabase
      .from("vault_credentials")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error("Could not delete credential.");
    return { ok: true };
  });
