import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "wa_last_seen_at";

function getLastSeen(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || new Date(0).toISOString();
  } catch {
    return new Date(0).toISOString();
  }
}

export function markWhatsAppSeen() {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {}
  window.dispatchEvent(new Event("wa:seen"));
}

export function useWhatsAppUnread() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      const since = getLastSeen();
      const { count } = await supabase
        .from("whatsapp_messages")
        .select("id", { count: "exact", head: true })
        .eq("direction", "inbound")
        .gt("created_at", since);
      if (!cancelled) setUnread(count || 0);
    };

    refresh();

    const channel = supabase
      .channel("wa-unread-badge")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const m = payload.new as { direction?: string; created_at?: string };
          if (m?.direction !== "inbound") return;
          const since = getLastSeen();
          if (m.created_at && m.created_at > since) {
            setUnread((n) => n + 1);
          }
        }
      )
      .subscribe();

    const onSeen = () => setUnread(0);
    window.addEventListener("wa:seen", onSeen);

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
      window.removeEventListener("wa:seen", onSeen);
    };
  }, []);

  return { unread };
}
