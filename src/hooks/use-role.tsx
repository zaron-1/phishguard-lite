import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

/**
 * Reads the signed-in user's roles from the database (RLS-scoped to own rows).
 * This is for UI gating only — all real authorization is enforced server-side.
 */
export function useRole() {
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) {
        if (active) {
          setRoles([]);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", auth.user.id);
      if (active) {
        setRoles((data ?? []).map((r) => r.role as AppRole));
        setLoading(false);
      }
    }

    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isUser: roles.includes("user"),
    loading,
  };
}
