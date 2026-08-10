import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [
      { title: "Signing you in — PhishGuard Lite" },
      { name: "description", content: "Completing your secure Google sign-in to PhishGuard Lite." },
      { property: "og:title", content: "Signing you in — PhishGuard Lite" },
      { property: "og:description", content: "Completing your secure Google sign-in to PhishGuard Lite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  ssr: false,
  component: CallbackPage,
});

function CallbackPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      window.location.replace("/dashboard");
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) finish();
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finish();
    });

    const timeout = setTimeout(() => {
      if (!done) setFailed(true);
    }, 8000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background px-4 text-center">
      {failed ? (
        <>
          <p className="text-sm text-muted-foreground">We couldn't complete sign-in.</p>
          <a href="/auth" className="text-sm font-medium text-primary underline">
            Try again
          </a>
        </>
      ) : (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      )}
    </div>
  );
}
