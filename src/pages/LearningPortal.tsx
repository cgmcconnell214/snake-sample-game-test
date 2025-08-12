import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  slug?: string;
}

export default function LearningPortal(): JSX.Element {
  const [courses, setCourses] = useState<Course[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Learning Portal";
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("educational_courses")
      .select("id,title,description,slug")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch courses",
        variant: "destructive",
      });
      return;
    }

    setCourses(data || []);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Portal</h1>
          <p className="text-muted-foreground">
            Create and discover tokenized educational courses
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                <CardTitle className="text-lg">{course.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>
              <Button asChild>
                <a href={`/app/learning/courses/${course.slug ?? course.id}`}>
                  <Play className="h-4 w-4 mr-2" /> View
                </a>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No courses available.</p>
        </div>
      )}
    </div>
  );
}
