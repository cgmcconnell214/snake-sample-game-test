import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Play, Share2 } from "lucide-react";

export default function CourseDetail(): JSX.Element {
  const { slug } = useParams();
const [course, setCourse] = useState<any>(null);
  const [isCreator, setIsCreator] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    document.title = course?.title ? `${course.title} – Course` : "Course";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", course?.description || "Explore course details and enroll.");
  }, [course]);

  useEffect(() => {
    const fetchCourse = async () => {
      const { data, error } = await supabase
        .from("educational_courses")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      if (error) {
        toast({ title: "Error", description: "Failed to load course", variant: "destructive" });
        return;
      }
      setCourse(data);
    };
    if (slug) fetchCourse();
  }, [slug, toast]);

  useEffect(() => {
    const checkCreator = async () => {
      if (!course) return setIsCreator(false);
      const { data: { user } } = await supabase.auth.getUser();
      setIsCreator(!!user && user.id === course.creator_id);
    };
    checkCreator();
  }, [course]);

  const handleEnrollStripe = async () => {
    if (!course) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast({ title: "Sign in required", description: "Please log in to enroll", variant: "destructive" });
    if (user.id === course.creator_id) return toast({ title: "Creator Access", description: "You already own this course." });
    if (!course.price_per_student || course.price_per_student === 0) return handleEnrollFree();

    const amount_cents = Math.round((course.price_per_student || 0) * 100);
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount_cents,
        product_name: `Course Enrollment: ${course.title}`,
        metadata: { resource_type: 'course', course_id: course.id }
      }
    });
    if (error) return toast({ title: 'Payment Error', description: error.message || 'Failed to start payment', variant: 'destructive' });
    if (data?.url) window.open(data.url, '_blank');
  };

  const handleEnrollXRPL = async () => {
    toast({ title: 'XRPL Payment', description: 'XRPL wallet payment requires configuration.' });
  };

  const handleEnrollFree = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast({ title: "Sign in required", description: "Please log in to enroll", variant: "destructive" });
    if (user.id === course.creator_id) return toast({ title: "Creator Access", description: "You already own this course." });
    const { error } = await supabase.from("course_enrollments").insert({
      student_id: user.id,
      course_id: course.id,
      payment_amount: 0,
      payment_status: 'paid',
      payment_provider: 'free',
    });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    toast({ title: "Enrolled", description: `You are enrolled in ${course.title}` });
  };

  if (!course) return <div className="p-6">Loading...</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{course.title}</CardTitle>
              <p className="text-muted-foreground">{course.description}</p>
            </div>
            <Badge>{course.category}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Price</span>
            <span className="font-semibold">{course.price_per_student === 0 ? 'Free' : `$${course.price_per_student}`}</span>
          </div>

          <div className="flex gap-2 flex-wrap">
            {isCreator ? (
              <>
                <Button asChild>
                  <Link to={`/app/learning/creator/${course.id}`}>Edit in Creator</Link>
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/app/learning/creator">Manage Links</Link>
                </Button>
              </>
            ) : (
              <>
                {course.price_per_student === 0 ? (
                  <Button onClick={handleEnrollFree}>
                    <Play className="h-4 w-4 mr-2" /> Enroll Free
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleEnrollStripe}>Pay with Stripe</Button>
                    <Button variant="secondary" onClick={handleEnrollXRPL}>Pay with XRPL</Button>
                  </>
                )}
              </>
            )}
            <Button asChild variant="outline">
              <Link to="/app/learning">Back to Courses</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
