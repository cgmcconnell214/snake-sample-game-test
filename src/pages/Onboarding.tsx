import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Onboarding(): JSX.Element {
  const { toast } = useToast();
  const [steps, setSteps] = useState([
    { key: 'kyc', label: 'Complete KYC Verification', done: false, link: '/app/kyc' },
    { key: 'profile', label: 'Complete Profile Details', done: false, link: '/app/profile' },
    { key: 'first-course', label: 'Enroll in Your First Course', done: false, link: '/app/learning/courses' },
    { key: 'join-class', label: 'Join a Live Class', done: false, link: '/app/live-classes/new' },
  ]);

  useEffect(() => {
    document.title = 'Onboarding Checklist';
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', 'Complete your onboarding steps.');

    const loadProgress = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('onboarding_progress')
        .select('step_key, completed')
        .eq('user_id', user.id);

      if (error) {
        toast({ variant: 'destructive', description: 'Failed to load progress.' });
        return;
      }

      if (data) {
        setSteps((prev) =>
          prev.map((step) => {
            const match = data.find((p) => p.step_key === step.key);
            return match ? { ...step, done: match.completed } : step;
          }),
        );
      }
    };

    void loadProgress();
  }, [toast]);

  const toggleStep = async (idx: number) => {
    const newStatus = !steps[idx].done;

    setSteps((prev) => {
      const copy = [...prev];
      copy[idx].done = newStatus;
      return copy;
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('user_behavior_log').insert({
      user_id: user.id,
      action: `onboarding_${steps[idx].key}_${newStatus ? 'done' : 'undone'}`,
    });

    const { error } = await supabase.from('onboarding_progress').upsert({
      user_id: user.id,
      step_key: steps[idx].key,
      completed: newStatus,
    });

    if (error) {
      toast({ variant: 'destructive', description: 'Failed to save progress.' });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Onboarding Checklist</h1>
          <p className="text-muted-foreground">Track and complete your getting-started steps</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((s, idx) => (
          <Card key={s.key}>
            <CardHeader>
              <CardTitle className="text-lg">{s.label}</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox checked={s.done} onCheckedChange={() => toggleStep(idx)} />
                <span className="text-sm text-muted-foreground">Mark complete</span>
              </div>
              <Button asChild variant="outline"><a href={s.link}>Go</a></Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
