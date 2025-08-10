import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserBadge {
  id: string;
  user_id: string;
  badge_name: string;
  description: string | null;
  course_id: string | null;
  assignment_id: string | null;
  created_at?: string;
  awarded_at?: string;
}

export default function BadgeProgression(): JSX.Element {
  const { toast } = useToast();
  const [badges, setBadges] = useState<UserBadge[]>([]);

  useEffect(() => {
    document.title = 'Badge Progression';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'View your earned badges and progress.');

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
        return;
      }
      setBadges((data as any) || []);
    };
    load();
  }, [toast]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Badge Progression</h1>
        <p className="text-muted-foreground">Your earned badges and milestones</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((b) => (
          <Card key={b.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{b.badge_name}</span>
                <Badge variant="secondary">{new Date(b.created_at || b.awarded_at || Date.now()).toLocaleDateString()}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{b.description || 'Achievement unlocked'}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {badges.length === 0 && (
        <div className="text-muted-foreground">No badges yet. Complete assignments to earn badges.</div>
      )}
    </div>
  );
}
