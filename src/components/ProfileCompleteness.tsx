import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const STORAGE_KEY = "profile-completeness-dismissed-at";

const fieldsToCheck: Array<{ key: keyof Profile; label: string }> = [
  { key: "display_name", label: "Display name" },
  { key: "username", label: "Username" },
  { key: "avatar_url", label: "Avatar" },
  { key: "bio", label: "Bio" },
];

interface Profile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

const ProfileCompleteness: React.FC = () => {
  const { user } = useAuth();
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const ts = Number(localStorage.getItem(STORAGE_KEY) || 0);
    if (ts && Date.now() - ts < 24 * 60 * 60 * 1000) {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from("user_profiles")
          .select("user_id, display_name, username, avatar_url, bio")
          .eq("user_id", user.id)
          .maybeSingle();
        if (error) throw error;
        const profile = (data || {}) as Profile;
        const m = fieldsToCheck
          .filter((f) => !profile?.[f.key])
          .map((f) => f.label);
        setMissing(m);
      } catch (e) {
        console.warn("ProfileCompleteness: failed to fetch profile", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading || dismissed || !user || missing.length === 0) return null;

  return (
    <Alert className="bg-secondary/40 border-secondary text-foreground">
      <AlertTitle className="flex items-center gap-2">
        Complete your profile
        <Badge variant="secondary">{missing.length} missing</Badge>
      </AlertTitle>
      <AlertDescription className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span>
          Improve discoverability and trust. Missing: {missing.join(", ")}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/profile">Edit Profile</Link>
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.setItem(STORAGE_KEY, String(Date.now()));
              setDismissed(true);
            }}
          >
            Dismiss
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ProfileCompleteness;
