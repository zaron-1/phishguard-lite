import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Session persistence + silent refresh helpers.
 *
 * The Supabase client persists the session (access + refresh token) in
 * localStorage, which survives tab close, app backgrounding and refresh.
 * On top of that we keep a non-sensitive "a session should exist" marker
 * cookie so the app can render the authenticated shell immediately on a
 * cold refresh without flashing the sign-in screen.
 */

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days
const MARKER_COOKIE = "pg_session";
/** Refresh when the access token expires within this window. */
const REFRESH_SKEW_SECONDS = 120;

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

export function setSessionMarker(active: boolean) {
  if (!isBrowser()) return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = active
    ? `${MARKER_COOKIE}=1; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}; SameSite=Lax${secure}`
    : `${MARKER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function hasSessionMarker() {
  if (!isBrowser()) return false;
  return document.cookie.split("; ").some((c) => c.startsWith(`${MARKER_COOKIE}=1`));
}

function isExpiring(session: Session | null) {
  if (!session?.expires_at) return false;
  return session.expires_at * 1000 - Date.now() < REFRESH_SKEW_SECONDS * 1000;
}

let inFlight: Promise<Session | null> | null = null;

/**
 * Reads the persisted session without a network round-trip, and silently
 * refreshes it when the access token is expired or about to expire.
 * Returns null only when there is genuinely no usable session.
 */
export async function ensureSession(): Promise<Session | null> {
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      let session = data.session;

      if (session && isExpiring(session)) {
        const { data: refreshed, error } = await supabase.auth.refreshSession();
        // Keep the existing session if the refresh call simply failed
        // (offline / transient) and the token is not hard-expired yet.
        if (!error && refreshed.session) session = refreshed.session;
      }

      const stillValid = !!session && (session.expires_at ?? 0) * 1000 > Date.now();
      setSessionMarker(stillValid);
      return stillValid ? session : null;
    } catch {
      return null;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/**
 * Re-verifies the session when the app returns to the foreground
 * (tab focus, app switch, PWA resume) or regains network.
 */
export function startSessionKeeper(onChange?: (session: Session | null) => void) {
  if (!isBrowser()) return () => {};

  let last = 0;
  const revalidate = async () => {
    const now = Date.now();
    if (now - last < 5000) return; // debounce focus storms
    last = now;
    const session = await ensureSession();
    onChange?.(session);
  };

  const onVisibility = () => {
    if (document.visibilityState === "visible") void revalidate();
  };
  const onFocus = () => void revalidate();

  window.addEventListener("focus", onFocus);
  window.addEventListener("online", onFocus);
  document.addEventListener("visibilitychange", onVisibility);

  // Proactive silent refresh while the app stays open.
  const interval = window.setInterval(() => void ensureSession(), 10 * 60 * 1000);

  return () => {
    window.removeEventListener("focus", onFocus);
    window.removeEventListener("online", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
    window.clearInterval(interval);
  };
}
