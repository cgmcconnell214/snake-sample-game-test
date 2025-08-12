import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PageViewTracker = (): null => {
  const location = useLocation();

  useEffect(() => {
    let isCancelled = false;
    const log = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return; // Respect RLS: only log for authenticated users

        const meta = {
          path: location.pathname + location.search,
          title: document.title,
          referrer: document.referrer || null,
          ts: new Date().toISOString(),
        };

        if (isCancelled) return;
        await supabase.from("user_behavior_log").insert({
          user_id: user.id,
          action: "page_view",
          user_agent: navigator.userAgent,
          location_data: meta as any,
        });
      } catch (e) {
        // Silently ignore logging errors
        console.warn("PageViewTracker: log failed", e);
      }
    };

    log();
    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search]);

  return null;
};

export default PageViewTracker;
