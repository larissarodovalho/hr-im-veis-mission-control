import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "wa_conv_last_seen";

type SeenMap = Record<string, string>;

function loadSeen(): SeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SeenMap) : {};
  } catch {
    return {};
  }
}

function saveSeen(map: SeenMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

export function useWhatsAppPerConvUnread() {
  const [unreadByConv, setUnreadByConv] = useState<Record<string, number>>({});
  const seenRef = useRef<SeenMap>(loadSeen());
  const aiEnabledRef = useRef<Record<string, boolean>>({});

  const recompute = useCallback(async () => {
    const { data: convs } = await supabase
      .from("whatsapp_conversations")
      .select("id, ai_enabled");
    if (!convs) return;

    const aiMap: Record<string, boolean> = {};
    convs.forEach((c: any) => { aiMap[c.id] = !!c.ai_enabled; });
    aiEnabledRef.current = aiMap;

    const humanIds = convs.filter((c: any) => !c.ai_enabled).map((c: any) => c.id as string);
    if (humanIds.length === 0) {
      setUnreadByConv({});
      return;
    }

    const { data: msgs } = await supabase
      .from("whatsapp_messages")
      .select("conversation_id, created_at, direction")
      .in("conversation_id", humanIds)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(1000);

    const counts: Record<string, number> = {};
    (msgs || []).forEach((m: any) => {
      const since = seenRef.current[m.conversation_id] || new Date(0).toISOString();
      if (m.created_at > since) {
        counts[m.conversation_id] = (counts[m.conversation_id] || 0) + 1;
      }
    });
    setUnreadByConv(counts);
  }, []);

  const markConvSeen = useCallback((convId: string) => {
    seenRef.current = { ...seenRef.current, [convId]: new Date().toISOString() };
    saveSeen(seenRef.current);
    setUnreadByConv((prev) => {
      if (!prev[convId]) return prev;
      const next = { ...prev };
      delete next[convId];
      return next;
    });
  }, []);

  useEffect(() => {
    recompute();

    const msgChannel = supabase
      .channel("wa-per-conv-unread-msgs")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_messages" },
        (payload) => {
          const m = payload.new as { conversation_id: string; direction: string; created_at: string };
          if (m.direction !== "inbound") return;
          if (aiEnabledRef.current[m.conversation_id]) return;
          const since = seenRef.current[m.conversation_id] || new Date(0).toISOString();
          if (m.created_at <= since) return;
          setUnreadByConv((prev) => ({
            ...prev,
            [m.conversation_id]: (prev[m.conversation_id] || 0) + 1,
          }));
        }
      )
      .subscribe();

    const convChannel = supabase
      .channel("wa-per-conv-unread-convs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "whatsapp_conversations" },
        () => recompute()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(convChannel);
    };
  }, [recompute]);

  const totalUnread = Object.values(unreadByConv).reduce((a, b) => a + b, 0);

  return { unreadByConv, markConvSeen, totalUnread };
}
