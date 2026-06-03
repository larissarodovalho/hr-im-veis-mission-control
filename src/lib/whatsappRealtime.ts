import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Handlers = {
  onConvChange?: (payload: any) => void;
  onMsgNew?: (payload: any) => void;
};

/**
 * Subscribe to scoped WhatsApp realtime broadcast topics.
 * Each user only receives events for conversations they can read,
 * driven by Postgres triggers that call realtime.send() per-topic.
 */
export function subscribeWhatsAppRealtime(
  userId: string,
  isAdmin: boolean,
  handlers: Handlers
): () => void {
  const topics = [`wa:user:${userId}`, "wa:unassigned"];
  if (isAdmin) topics.push("wa:staff:admin");

  const channels: RealtimeChannel[] = topics.map((topic) => {
    const ch = supabase.channel(topic, { config: { private: true } });
    const fwd = (cb?: (p: any) => void) => (msg: any) => cb?.(msg.payload ?? msg);
    if (handlers.onConvChange) {
      ch.on("broadcast", { event: "conv:new" }, fwd(handlers.onConvChange))
        .on("broadcast", { event: "conv:updated" }, fwd(handlers.onConvChange))
        .on("broadcast", { event: "conv:deleted" }, fwd(handlers.onConvChange));
    }
    if (handlers.onMsgNew) {
      ch.on("broadcast", { event: "msg:new" }, fwd(handlers.onMsgNew));
    }
    ch.subscribe();
    return ch;
  });

  return () => {
    channels.forEach((ch) => {
      supabase.removeChannel(ch);
    });
  };
}
