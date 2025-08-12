import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface OnlineUsersBadgeProps {
  room?: string;
}

const OnlineUsersBadge: React.FC<OnlineUsersBadgeProps> = ({ room = "presence-global" }) => {
  const [count, setCount] = useState(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    const channel = supabase.channel(room, { config: { presence: { key: Math.random().toString(36).slice(2) } } });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat();
        setCount(users.length);
      })
      .subscribe(async (status) => {
        if (status !== "SUBSCRIBED") return;
        try {
          await channel.track({ online_at: new Date().toISOString() });
        } catch {
          // ignore
        }
      });

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [room]);

  if (count <= 0) return null;

  return (
    <div className="flex items-center justify-end">
      <Badge variant="secondary">{count} online now</Badge>
    </div>
  );
};

export default OnlineUsersBadge;
