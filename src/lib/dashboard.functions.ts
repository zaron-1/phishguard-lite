import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

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
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<DashboardData> => {
    const { supabase, userId } = context;

    const [analysesRes, chatsRes, recentRes] = await Promise.all([
      supabase
        .from("phishing_analyses")
        .select("verdict", { count: "exact" })
        .eq("user_id", userId),
      supabase
        .from("ai_chats")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("phishing_analyses")
        .select("id, url, verdict, risk_score, created_at")
        .eq("user_id", userId)
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
