import { createServerFn } from "@tanstack/react-start";
import { getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// ---------- Types ----------
export type Role = "admin" | "user";

export type MyProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  profilePicture: string | null;
  status: string;
};

export type SearchRecord = {
  id: string;
  searchQuery: string;
  searchCategory: string | null;
  searchResultsCount: number;
  ipAddress: string | null;
  searchedAt: string;
};

export type AdminUserRow = {
  userId: string;
  displayName: string | null;
  email: string | null;
  status: string;
  roles: Role[];
  createdAt: string;
};

// ---------- Helpers ----------
async function assertAdmin(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Error("Access denied: administrator privileges required.");
  }
}

async function logAdminAction(adminId: string, action: string, targetUserId: string | null, details: Record<string, unknown>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  await supabaseAdmin.from("admin_actions").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details: details as any,
  });
}

// ---------- Current user role ----------
export const getMyRoles = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ roles: Role[] }> => {
    const { supabase, userId } = context;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
    return { roles: (data ?? []).map((r: any) => r.role as Role) };
  });

// ---------- Profile (own) ----------
export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<MyProfile | null> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, email, phone, bio, profile_picture, status")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      displayName: data.display_name,
      email: data.email,
      phone: data.phone,
      bio: data.bio,
      profilePicture: data.profile_picture,
      status: data.status,
    };
  });

const ProfileUpdate = z.object({
  displayName: z.string().trim().max(120).optional(),
  phone: z.string().trim().max(40).optional(),
  bio: z.string().trim().max(1000).optional(),
});

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ProfileUpdate.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // RLS guarantees the user can only update their own row.
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: data.displayName ?? null,
        phone: data.phone ?? null,
        bio: data.bio ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (error) throw new Error("Could not update profile.");
    return { ok: true };
  });

// ---------- Search history (own) ----------
export const getMySearchHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SearchRecord[]> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("search_history")
      .select("id, search_query, search_category, search_results_count, ip_address, searched_at")
      .eq("user_id", userId)
      .order("searched_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      searchQuery: r.search_query,
      searchCategory: r.search_category,
      searchResultsCount: r.search_results_count,
      ipAddress: r.ip_address,
      searchedAt: r.searched_at,
    }));
  });

const AddSearch = z.object({
  searchQuery: z.string().trim().min(1).max(500),
  searchCategory: z.string().trim().max(80).optional(),
  searchResultsCount: z.number().int().min(0).max(1_000_000).optional(),
});

export const addSearchHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AddSearch.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    let ip: string | null = null;
    try {
      ip = getRequestIP({ xForwardedFor: true }) ?? null;
    } catch {
      ip = null;
    }
    const { error } = await supabase.from("search_history").insert({
      user_id: userId,
      search_query: data.searchQuery,
      search_category: data.searchCategory ?? null,
      search_results_count: data.searchResultsCount ?? 0,
      ip_address: ip,
    });
    if (error) throw new Error("Could not save search.");
    return { ok: true };
  });

export const deleteSearchHistory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // RLS scopes deletion to the owner; the explicit filter is defense in depth.
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", data.id)
      .eq("user_id", userId);
    if (error) throw new Error("Could not delete record.");
    return { ok: true };
  });

// ---------- User dashboard ----------
export type UserDashboard = {
  profile: MyProfile | null;
  searchCount: number;
  recentSearches: SearchRecord[];
};

export const getUserDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UserDashboard> => {
    const { supabase, userId } = context;
    const [profileRes, countRes, recentRes] = await Promise.all([
      supabase.from("profiles").select("id, user_id, display_name, email, phone, bio, profile_picture, status").eq("user_id", userId).maybeSingle(),
      supabase.from("search_history").select("id", { count: "exact", head: true }).eq("user_id", userId),
      supabase.from("search_history").select("id, search_query, search_category, search_results_count, ip_address, searched_at").eq("user_id", userId).order("searched_at", { ascending: false }).limit(5),
    ]);
    const p = profileRes.data;
    return {
      profile: p
        ? {
            id: p.id,
            userId: p.user_id,
            displayName: p.display_name,
            email: p.email,
            phone: p.phone,
            bio: p.bio,
            profilePicture: p.profile_picture,
            status: p.status,
          }
        : null,
      searchCount: countRes.count ?? 0,
      recentSearches: (recentRes.data ?? []).map((r: any) => ({
        id: r.id,
        searchQuery: r.search_query,
        searchCategory: r.search_category,
        searchResultsCount: r.search_results_count,
        ipAddress: r.ip_address,
        searchedAt: r.searched_at,
      })),
    };
  });

// ---------- Admin dashboard ----------
export type AdminDashboard = {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  totalSearches: number;
  totalAdmins: number;
  recentActions: { id: string; action: string; createdAt: string; targetUserId: string | null }[];
};

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminDashboard> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [totalRes, activeRes, suspendedRes, searchRes, adminRes, actionsRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("status", "suspended"),
      supabase.from("search_history").select("id", { count: "exact", head: true }),
      supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin"),
      supabase.from("admin_actions").select("id, action, created_at, target_user_id").order("created_at", { ascending: false }).limit(10),
    ]);

    return {
      totalUsers: totalRes.count ?? 0,
      activeUsers: activeRes.count ?? 0,
      suspendedUsers: suspendedRes.count ?? 0,
      totalSearches: searchRes.count ?? 0,
      totalAdmins: adminRes.count ?? 0,
      recentActions: (actionsRes.data ?? []).map((a: any) => ({
        id: a.id,
        action: a.action,
        createdAt: a.created_at,
        targetUserId: a.target_user_id,
      })),
    };
  });

export const listAllUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminUserRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, email, status, created_at").order("created_at", { ascending: false }).limit(500),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const roleMap = new Map<string, Role[]>();
    for (const r of rolesRes.data ?? []) {
      const arr = roleMap.get(r.user_id) ?? [];
      arr.push(r.role as Role);
      roleMap.set(r.user_id, arr);
    }

    return (profilesRes.data ?? []).map((p: any) => ({
      userId: p.user_id,
      displayName: p.display_name,
      email: p.email,
      status: p.status,
      roles: roleMap.get(p.user_id) ?? [],
      createdAt: p.created_at,
    }));
  });

export const setUserStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ targetUserId: z.string().uuid(), status: z.enum(["active", "suspended"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("user_id", data.targetUserId);
    if (error) throw new Error("Could not update user status.");

    await logAdminAction(userId, `set_status:${data.status}`, data.targetUserId, { status: data.status });
    return { ok: true };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ targetUserId: z.string().uuid(), role: z.enum(["admin", "user"]), grant: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    // Prevent an admin from removing their own admin role (lockout protection).
    if (data.role === "admin" && !data.grant && data.targetUserId === userId) {
      throw new Error("You cannot remove your own administrator role.");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.grant) {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: data.targetUserId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error("Could not grant role.");
    } else {
      const { error } = await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", data.targetUserId)
        .eq("role", data.role);
      if (error) throw new Error("Could not revoke role.");
    }

    await logAdminAction(userId, `${data.grant ? "grant" : "revoke"}_role:${data.role}`, data.targetUserId, { role: data.role });
    return { ok: true };
  });

export type AdminSearchRow = SearchRecord & { userId: string };

export const listAllSearches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AdminSearchRow[]> => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);
    const { data } = await supabase
      .from("search_history")
      .select("id, user_id, search_query, search_category, search_results_count, ip_address, searched_at")
      .order("searched_at", { ascending: false })
      .limit(200);
    return (data ?? []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      searchQuery: r.search_query,
      searchCategory: r.search_category,
      searchResultsCount: r.search_results_count,
      ipAddress: r.ip_address,
      searchedAt: r.searched_at,
    }));
  });
