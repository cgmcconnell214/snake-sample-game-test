import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Link as LinkIcon, Copy } from "lucide-react";

interface Course { id: string; title: string; slug: string | null; price_per_student: number; category: string; created_at: string; }
interface LinkRow { id: string; code: string; max_uses: number; used_count: number; expires_at: string | null; is_active: boolean; course_id: string; }

export default function CourseCreator(): JSX.Element {
  const { toast } = useToast();
  const [myCourses, setMyCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [maxUses, setMaxUses] = useState<number>(10);
  const [expiresAt, setExpiresAt] = useState<string>("");

  // Restore any autosaved draft on mount
  useEffect(() => {
    const restoreDraft = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await (supabase as any)
        .from('course_creator_drafts')
        .select('selected_course_id,max_uses,expires_at')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return;
      if (data) {
        setSelectedCourseId(data.selected_course_id);
        setMaxUses(data.max_uses ?? 10);
        setExpiresAt(
          data.expires_at
            ? new Date(data.expires_at).toISOString().slice(0, 16)
            : ''
        );
      }
    };
    restoreDraft();
  }, []);

  // Debounced save of draft progress to Supabase
  const saveDraft = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await (supabase as any).from('course_creator_drafts').upsert({
      user_id: user.id,
      selected_course_id: selectedCourseId,
      max_uses: maxUses,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
  }, [selectedCourseId, maxUses, expiresAt]);

  useEffect(() => {
    const handler = setTimeout(() => {
      saveDraft();
    }, 3000);
    return () => clearTimeout(handler);
  }, [selectedCourseId, maxUses, expiresAt, saveDraft]);

  useEffect(() => {
    document.title = "Course Creator Portal";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", "Manage your courses and enrollment links.");
  }, []);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('educational_courses')
        .select('id,title,slug,price_per_student,category,created_at')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setMyCourses(data || []);
    };
    load();
  }, [toast]);

  useEffect(() => {
    const loadLinks = async () => {
      if (!selectedCourseId) return;
      const { data, error } = await supabase
        .from('course_enrollment_links')
        .select('*')
        .eq('course_id', selectedCourseId)
        .order('created_at', { ascending: false });
      if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
      setLinks(data || []);
    };
    loadLinks();
  }, [selectedCourseId, toast]);

  const generateCode = () => Math.random().toString(36).slice(2,10);

  const createLink = async () => {
    if (!selectedCourseId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const code = generateCode();
    const { error } = await supabase.from('course_enrollment_links').insert({
      course_id: selectedCourseId,
      creator_id: user.id,
      code,
      max_uses: maxUses,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
    });
    if (error) return toast({ title: 'Error', description: error.message, variant: 'destructive' });
    toast({ title: 'Link Created', description: 'Share the link code with selected users.' });
    setMaxUses(10); setExpiresAt('');
    setSelectedCourseId(selectedCourseId); // trigger reload
  };

  const copyLink = (code: string) => {
    const url = `${window.location.origin}/redeem/${code}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Copied', description: 'Redeem link copied to clipboard.' });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Creator Portal</h1>
          <p className="text-muted-foreground">Manage courses, edit details, and generate enrollment links.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {myCourses.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{c.title}</CardTitle>
                    <p className="text-sm text-muted-foreground">{c.category}</p>
                  </div>
                  <Badge>{c.price_per_student === 0 ? 'Free' : `$${c.price_per_student}`}</Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild>
                  <a href={`/app/learning/creator/${c.id}`}>Edit</a>
                </Button>
                <Button variant="secondary" asChild>
                  <a href={`/app/learning/courses/${c.slug ?? c.id}`}>View Page</a>
                </Button>
                <Button variant={selectedCourseId === c.id ? 'default' : 'outline'} onClick={() => setSelectedCourseId(c.id)}>
                  <LinkIcon className="h-4 w-4 mr-2"/> Manage Links
                </Button>
              </CardContent>
            </Card>
          ))}
          {myCourses.length === 0 && (
            <div className="text-muted-foreground">You haven’t created any courses yet. Go to Courses to create one.</div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Generate Enrollment Link</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Label>Select Course</Label>
              <select
                className="w-full h-10 rounded-md border bg-background"
                value={selectedCourseId ?? ''}
                onChange={(e) => setSelectedCourseId(e.target.value || null)}
              >
                <option value="">-- Choose --</option>
                {myCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>

              <div>
                <Label>Max Uses</Label>
                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(parseInt(e.target.value || '1'))} />
              </div>

              <div>
                <Label>Expires At (optional)</Label>
                <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
              </div>

              <Button onClick={createLink} disabled={!selectedCourseId}>
                <Plus className="h-4 w-4 mr-2"/> Create Link
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {links.map(l => (
                <div key={l.id} className="flex items-center justify-between border rounded-md px-3 py-2">
                  <div className="space-y-1">
                    <div className="font-medium">Code: {l.code}</div>
                    <div className="text-sm text-muted-foreground">Uses: {l.used_count}/{l.max_uses} {l.expires_at ? `• Expires: ${new Date(l.expires_at).toLocaleString()}` : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => copyLink(l.code)}><Copy className="h-4 w-4 mr-1"/> Copy</Button>
                  </div>
                </div>
              ))}
              {links.length === 0 && <div className="text-sm text-muted-foreground">No links yet.</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
