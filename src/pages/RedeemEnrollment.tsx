import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function RedeemEnrollment(): JSX.Element {
  const { code } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>("loading");
  const [message, setMessage] = useState<string>("Validating link...");

  useEffect(() => {
    document.title = "Redeem Enrollment Link";
    const run = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatus('error');
        setMessage('Please sign in to redeem an enrollment link.');
        return;
      }
      const { data, error } = await supabase.functions.invoke('redeem-enrollment', { body: { code } });
      if (error) {
        setStatus('error');
        setMessage(error.message || 'Failed to redeem link');
        return;
      }
      setStatus('success');
      setMessage('Enrollment successful! Redirecting to course...');
      setTimeout(() => navigate(`/app/learning`), 1200);
    };
    if (code) run();
  }, [code, navigate]);

  return (
    <div className="container mx-auto p-6">
      <div className={`rounded-md border p-4 ${status === 'error' ? 'text-destructive' : ''}`}>
        {message}
      </div>
    </div>
  );
}
