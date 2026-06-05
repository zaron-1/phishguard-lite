import { createServerFn } from "@tanstack/react-start";

const GUEST_USER_ID = "00000000-0000-0000-0000-000000000000";

export type RecentAnalysis = {
  id: string;
  url: string;
  verdict: string;
  riskScore: number;
  createdAt: string;
};

export type DashboardData = {
  analysesCount: number;
  dangerousCount: number;
  chatMessages: number;
  recent: RecentAnalysis[];
};

export const getDashboard = createServerFn({ method: "GET" })
  .handler(async (): Promise<DashboardData> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [analysesRes, chatsRes, recentRes] = await Promise.all([
      supabaseAdmin
        .from("phishing_analyses")
        .select("verdict", { count: "exact" })
        .eq("user_id", GUEST_USER_ID),
      supabaseAdmin
        .from("ai_chats")
        .select("id", { count: "exact", head: true })
        .eq("user_id", GUEST_USER_ID),
      supabaseAdmin
        .from("phishing_analyses")
        .select("id, url, verdict, risk_score, created_at")
        .eq("user_id", GUEST_USER_ID)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const dangerousCount =
      analysesRes.data?.filter((a) => a.verdict === "Dangerous").length ?? 0;

    const recent: RecentAnalysis[] = (recentRes.data ?? []).map((r) => ({
      id: r.id,
      url: r.url,
      verdict: r.verdict,
      riskScore: r.risk_score,
      createdAt: r.created_at,
    }));

    return {
      analysesCount: analysesRes.count ?? 0,
      dangerousCount,
      chatMessages: chatsRes.count ?? 0,
      recent,
    };
  });
