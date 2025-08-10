import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Plus,
  Play,
  DollarSign,
  Users,
  Star,
  Clock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  price_per_student: number;
  total_students: number;
  creator_id: string;
  is_published: boolean;
  course_content: any;
  created_at: string;
}

export default function LearningPortal(): JSX.Element {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "blockchain",
    price_per_student: 0,
    course_content: [],
    requirements: [],
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { toast } = useToast();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const slugify = (str: string) =>
    str
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setCurrentUserId(user?.id ?? null));
    fetchCourses();
  }, []);


  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("educational_courses")
      .select("*")
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

  const handleCreateCourse = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a course",
        variant: "destructive",
      });
      return;
    }

    const slug = `${slugify(newCourse.title)}-${Math.random().toString(36).slice(2,7)}`;

    const { data, error } = await supabase
      .from("educational_courses")
      .insert({
        ...newCourse,
        creator_id: user.id,
        is_published: true,
        slug,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Course created successfully",
    });

    // Prompt to promote as a social post
    setTimeout(async () => {
      if (window.confirm("Promote this course with a post on your profile?")) {
        await supabase.from('user_posts').insert({
          user_id: user.id,
          content: `I just launched a new course: ${data.title}! Check it out: ${window.location.origin}/app/learning/courses/${data.slug}`,
          is_public: true,
        });
        toast({ title: 'Posted', description: 'A promotional post was published to your profile.' });
      }
    }, 0);

    setCourses([data, ...courses]);
    setIsCreateModalOpen(false);
    setNewCourse({
      title: "",
      description: "",
      category: "blockchain",
      price_per_student: 0,
      course_content: [],
      requirements: [],
    });
  };
  const handleEnrollCourse = async (courseId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to enroll in a course",
        variant: "destructive",
      });
      return;
    }

    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    if (user.id === course.creator_id) {
      toast({ title: 'Creator Access', description: 'You already own this course.' });
      return;
    }

    if (!course.price_per_student || course.price_per_student === 0) {
      const { error } = await supabase.from("course_enrollments").insert({
        student_id: user.id,
        course_id: courseId,
        payment_amount: 0,
        payment_status: 'paid',
        payment_provider: 'free',
      });

      if (error) {
        toast({
          title: "Error",
          description: error.message || "Failed to enroll in course",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Enrollment Successful",
        description: `Enrolled in ${course.title}`,
      });
      return;
    }

    toast({ title: 'Choose Payment', description: 'Select Stripe or XRPL to continue.' });
  };

  const handleEnrollStripe = async (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course) return;
    const amount_cents = Math.round((course.price_per_student || 0) * 100);
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
        amount_cents,
        product_name: `Course Enrollment: ${course.title}`,
        metadata: { resource_type: 'course', course_id: courseId }
      }
    });
    if (error) {
      toast({ title: 'Payment Error', description: error.message || 'Failed to start payment', variant: 'destructive' });
      return;
    }
    if (data?.url) {
      window.open(data.url, '_blank');
      toast({ title: 'Complete Payment', description: 'Stripe Checkout opened in a new tab.' });
    }
  };

  const handleEnrollXRPL = async (_courseId: string) => {
    toast({
      title: 'XRPL Payment',
      description: 'XRPL wallet payment requires platform wallet configuration. Please configure XRPL_WALLET_SEED.',
    });
  };

  const handleDeleteCourse = async (courseId: string) => {
    const { error } = await supabase
      .from('educational_courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete course',
        variant: 'destructive'
      })
      return
    }

    toast({
      title: 'Course Deleted',
      description: 'The course has been removed.'
    })
    setCourses(prev => prev.filter(c => c.id !== courseId))
  }

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Portal</h1>
          <p className="text-muted-foreground">
            Create and discover tokenized educational courses
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Course
        </Button>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="blockchain">Blockchain</SelectItem>
            <SelectItem value="trading">Trading</SelectItem>
            <SelectItem value="compliance">Compliance</SelectItem>
            <SelectItem value="tokenization">Tokenization</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  <CardTitle className="text-lg">{course.title}</CardTitle>
                </div>
                <Badge variant="default">{course.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-medium">
                    {course.price_per_student === 0
                      ? "Free"
                      : `$${course.price_per_student}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Students:</span>
                  <span className="font-medium">{course.total_students}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Lessons:</span>
                  <span className="font-medium">
                    {course.course_content?.length || 0}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {course.price_per_student === 0 ? (
                  <Button onClick={() => handleEnrollCourse(course.id)}>
                    <Play className="h-4 w-4 mr-2" /> Enroll Free
                  </Button>
                ) : (
                  <>
                    <Button onClick={() => handleEnrollStripe(course.id)}>Pay with Stripe</Button>
                    <Button variant="secondary" onClick={() => handleEnrollXRPL(course.id)}>Pay with XRPL</Button>
                  </>
                )}
                <Button variant="outline" asChild>
                  <a href={`/app/learning/courses/${(course as any).slug ?? course.id}`}>View</a>
                </Button>
                {currentUserId === course.creator_id && (
                  <>
                    <Button variant="secondary" asChild>
                      <a href={`/app/learning/creator/${course.id}`}>Edit</a>
                    </Button>
                    <Button variant="outline" asChild>
                      <a href={`/app/learning/creator`}>Creator Portal</a>
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteCourse(course.id)}>
                      Delete
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No courses found. Create the first one!
          </p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Educational Course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, title: e.target.value })
                  }
                  placeholder="e.g., Advanced Tokenization Strategies"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) =>
                    setNewCourse({ ...newCourse, description: e.target.value })
                  }
                  placeholder="Describe what students will learn..."
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newCourse.category}
                  onValueChange={(value) =>
                    setNewCourse({ ...newCourse, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="tokenization">Tokenization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="price">Price per Student ($)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={newCourse.price_per_student}
                  onChange={(e) =>
                    setNewCourse({
                      ...newCourse,
                      price_per_student: parseFloat(e.target.value) || 0,
                    })
                  }
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateCourse} className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
