import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function RedeemEnrollment(): JSX.Element {
  const { code } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState<string>("Validating link...");

  useEffect(() => {
    document.title = "Redeem Enrollment Link";
    const run = async () => {
      if (!code) return;

      const { data: link, error: linkError } = await supabase
        .from("course_enrollment_links")
        .select("expires_at, is_active, max_uses, used_count")
        .eq("code", code)
        .maybeSingle();

      if (linkError || !link) {
        setStatus("error");
        setMessage("Invalid enrollment code.");
        return;
      }
      if (
        !link.is_active ||
        (link.expires_at && new Date(link.expires_at) < new Date()) ||
        link.used_count >= link.max_uses
      ) {
        setStatus("error");
        setMessage("This enrollment link has expired or is no longer valid.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setStatus("error");
        setMessage("Please sign in to redeem an enrollment link.");
        return;
      }

      const { error } = await supabase.functions.invoke("redeem-enrollment", {
        body: { code },
      });
      if (error) {
        setStatus("error");
        setMessage(error.message || "Failed to redeem link");
        return;
      }

      setStatus("success");
      setMessage("Enrollment successful! Redirecting to course...");
      setTimeout(() => navigate(`/app/learning`), 1200);
    };
    run();
  }, [code, navigate]);

  return (
    <div className="container mx-auto p-6">
      <div
        className={`rounded-md border p-4 ${status === "error" ? "text-destructive" : ""}`}
      >
        {message}
      </div>
    </div>
  );
}
