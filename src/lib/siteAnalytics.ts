import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SID_KEY = "hr_sid";

function getSessionId(): string {
  try {
    let sid = localStorage.getItem(SID_KEY);
    if (!sid) {
      sid =
        (crypto as any)?.randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(SID_KEY, sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

/** Registra um pageview no banco. Fire-and-forget, falha silenciosamente. */
export function trackPageview(path: string) {
  try {
    const payload = {
      path,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      session_id: getSessionId(),
    };
    void supabase.from("site_visits" as any).insert(payload as any).then(() => {});
  } catch {
    // ignore
  }
}

/** Hook: registra pageview a cada mudança de rota dentro do site público. */
export function useTrackPageview() {
  const location = useLocation();
  useEffect(() => {
    trackPageview(location.pathname + location.search);
  }, [location.pathname, location.search]);
}
