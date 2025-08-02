import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, Plus, Video, FileText, HelpCircle, CheckSquare, 
  Trash2, Edit, Play, DollarSign, Users, Star, Clock,
  Upload, Save, Eye, Settings, BarChart
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
  requirements: any;
  created_at: string;
  updated_at: string;
}

interface Lesson {
  id?: string;
  lesson_number: number;
  title: string;
  content: string;
  video_url?: string;
  duration_minutes: number;
  lesson_type: 'video' | 'text' | 'quiz' | 'assignment';
  is_preview: boolean;
}

interface Assignment {
  id?: string;
  title: string;
  description: string;
  assignment_type: 'quiz' | 'essay' | 'project' | 'practical';
  questions: any[];
  max_score: number;
  passing_score: number;
  time_limit_minutes?: number;
  attempts_allowed: number;
  is_required: boolean;
  due_date?: string;
}

export default function CourseBuilder() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [skills, setSkills] = useState<any[]>([]);
  const { toast } = useToast();

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "blockchain",
    price_per_student: 0,
    requirements: [],
  });

  const [newLesson, setNewLesson] = useState<Lesson>({
    lesson_number: 1,
    title: "",
    content: "",
    video_url: "",
    duration_minutes: 0,
    lesson_type: "video",
    is_preview: false,
  });

  const [newAssignment, setNewAssignment] = useState<Assignment>({
    title: "",
    description: "",
    assignment_type: "quiz",
    questions: [],
    max_score: 100,
    passing_score: 70,
    attempts_allowed: 1,
    is_required: false,
  });

  useEffect(() => {
    fetchUserCourses();
    fetchSkills();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchCourseLessons(selectedCourse.id);
      fetchCourseAssignments(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchUserCourses = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("educational_courses")
      .select("*")
      .eq("creator_id", user.id)
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

  const fetchSkills = async () => {
    const { data, error } = await supabase
      .from("skills")
      .select("*")
      .order("category", { ascending: true });

    if (data) setSkills(data);
  };

  const fetchCourseLessons = async (courseId: string) => {
    const { data, error } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("course_id", courseId)
      .order("lesson_number", { ascending: true });

    if (data) setLessons(data as Lesson[]);
  };

  const fetchCourseAssignments = async (courseId: string) => {
    const { data, error } = await supabase
      .from("course_assignments")
      .select("*")
      .eq("course_id", courseId)
      .order("created_at", { ascending: false });

    if (data) setAssignments(data as Assignment[]);
  };

  const handleCreateCourse = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a course",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("educational_courses")
      .insert({
        ...newCourse,
        creator_id: user.id,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create course",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Course created successfully",
    });

    setCourses([data, ...courses]);
    setSelectedCourse(data);
    setIsCreateModalOpen(false);
    setNewCourse({
      title: "",
      description: "",
      category: "blockchain",
      price_per_student: 0,
      requirements: [],
    });
  };

  const handleAddLesson = async () => {
    if (!selectedCourse) return;

    const { data, error } = await supabase
      .from("course_lessons")
      .insert({
        ...newLesson,
        course_id: selectedCourse.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add lesson",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Lesson added successfully",
    });

    setLessons([...lessons, data as Lesson]);
    setNewLesson({
      lesson_number: lessons.length + 2,
      title: "",
      content: "",
      video_url: "",
      duration_minutes: 0,
      lesson_type: "video",
      is_preview: false,
    });
  };

  const handleAddAssignment = async () => {
    if (!selectedCourse) return;

    const { data, error } = await supabase
      .from("course_assignments")
      .insert({
        ...newAssignment,
        course_id: selectedCourse.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add assignment",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Assignment added successfully",
    });

    setAssignments([...assignments, data as Assignment]);
    setNewAssignment({
      title: "",
      description: "",
      assignment_type: "quiz",
      questions: [],
      max_score: 100,
      passing_score: 70,
      attempts_allowed: 1,
      is_required: false,
    });
  };

  const handlePublishCourse = async () => {
    if (!selectedCourse) return;

    const { error } = await supabase
      .from("educational_courses")
      .update({ is_published: true })
      .eq("id", selectedCourse.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to publish course",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Course published successfully",
    });

    setSelectedCourse({ ...selectedCourse, is_published: true });
    fetchUserCourses();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    const { error } = await supabase
      .from("course_lessons")
      .delete()
      .eq("id", lessonId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete lesson",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Lesson deleted successfully",
    });

    setLessons(lessons.filter(l => l.id !== lessonId));
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Course Builder</h1>
          <p className="text-muted-foreground">
            Create and manage your educational content
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Course</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title</Label>
                <Input
                  id="title"
                  value={newCourse.title}
                  onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                  placeholder="e.g., Advanced Blockchain Development"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newCourse.description}
                  onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                  placeholder="Describe what students will learn..."
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newCourse.category}
                  onValueChange={(value) => setNewCourse({ ...newCourse, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blockchain">Blockchain</SelectItem>
                    <SelectItem value="trading">Trading</SelectItem>
                    <SelectItem value="compliance">Compliance</SelectItem>
                    <SelectItem value="tokenization">Tokenization</SelectItem>
                    <SelectItem value="defi">DeFi</SelectItem>
                    <SelectItem value="sacred-law">Sacred Law</SelectItem>
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
                  onChange={(e) => setNewCourse({
                    ...newCourse,
                    price_per_student: parseFloat(e.target.value) || 0,
                  })}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateCourse} className="flex-1">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Create Course
                </Button>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Course List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Your Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {courses.map((course) => (
                <Card
                  key={course.id}
                  className={`cursor-pointer transition-colors ${
                    selectedCourse?.id === course.id ? "border-primary" : ""
                  }`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{course.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {course.total_students} students
                        </p>
                      </div>
                      <Badge variant={course.is_published ? "default" : "secondary"}>
                        {course.is_published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course Content */}
        <div className="lg:col-span-3">
          {selectedCourse ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="lessons">Lessons</TabsTrigger>
                <TabsTrigger value="assignments">Assignments</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="overview">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{selectedCourse.title}</CardTitle>
                      <div className="flex gap-2">
                        {!selectedCourse.is_published && (
                          <Button onClick={handlePublishCourse}>
                            <Eye className="h-4 w-4 mr-2" />
                            Publish Course
                          </Button>
                        )}
                        <Button variant="outline">
                          <Settings className="h-4 w-4 mr-2" />
                          Settings
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h3 className="font-semibold mb-2">Description</h3>
                      <p className="text-muted-foreground">{selectedCourse.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded">
                        <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <p className="text-2xl font-bold">{selectedCourse.total_students}</p>
                        <p className="text-sm text-muted-foreground">Students</p>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <p className="text-2xl font-bold">{lessons.length}</p>
                        <p className="text-sm text-muted-foreground">Lessons</p>
                      </div>
                      <div className="text-center p-4 border rounded">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                        <p className="text-2xl font-bold">${selectedCourse.price_per_student}</p>
                        <p className="text-sm text-muted-foreground">Price</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lessons">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Lessons</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lessons.map((lesson, index) => (
                        <Card key={lesson.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {lesson.lesson_type === "video" && <Video className="h-5 w-5" />}
                              {lesson.lesson_type === "text" && <FileText className="h-5 w-5" />}
                              {lesson.lesson_type === "quiz" && <HelpCircle className="h-5 w-5" />}
                              {lesson.lesson_type === "assignment" && <CheckSquare className="h-5 w-5" />}
                              <div>
                                <p className="font-medium">{lesson.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {lesson.duration_minutes} minutes • {lesson.lesson_type}
                                  {lesson.is_preview && " • Preview"}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleDeleteLesson(lesson.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Add New Lesson Form */}
                      <Card className="border-dashed border-2">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-semibold">Add New Lesson</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Lesson title"
                              value={newLesson.title}
                              onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                            />
                            <Select
                              value={newLesson.lesson_type}
                              onValueChange={(value: any) => setNewLesson({ ...newLesson, lesson_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="video">Video</SelectItem>
                                <SelectItem value="text">Text</SelectItem>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="assignment">Assignment</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Duration (minutes)"
                              type="number"
                              value={newLesson.duration_minutes}
                              onChange={(e) => setNewLesson({ 
                                ...newLesson, 
                                duration_minutes: parseInt(e.target.value) || 0 
                              })}
                            />
                            <Input
                              placeholder="Video URL (optional)"
                              value={newLesson.video_url}
                              onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                            />
                          </div>
                          <Textarea
                            placeholder="Lesson content"
                            value={newLesson.content}
                            onChange={(e) => setNewLesson({ ...newLesson, content: e.target.value })}
                          />
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newLesson.is_preview}
                                onChange={(e) => setNewLesson({ ...newLesson, is_preview: e.target.checked })}
                              />
                              <span className="text-sm">Make this a preview lesson</span>
                            </label>
                          </div>
                          <Button onClick={handleAddLesson}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assignments">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignments & Assessments</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {assignments.map((assignment) => (
                        <Card key={assignment.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{assignment.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {assignment.assignment_type} • {assignment.max_score} points
                                {assignment.is_required && " • Required"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button variant="outline" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}

                      {/* Add New Assignment Form */}
                      <Card className="border-dashed border-2">
                        <CardContent className="p-4 space-y-3">
                          <h3 className="font-semibold">Add New Assignment</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input
                              placeholder="Assignment title"
                              value={newAssignment.title}
                              onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })}
                            />
                            <Select
                              value={newAssignment.assignment_type}
                              onValueChange={(value: any) => setNewAssignment({ ...newAssignment, assignment_type: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="quiz">Quiz</SelectItem>
                                <SelectItem value="essay">Essay</SelectItem>
                                <SelectItem value="project">Project</SelectItem>
                                <SelectItem value="practical">Practical</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Textarea
                            placeholder="Assignment description"
                            value={newAssignment.description}
                            onChange={(e) => setNewAssignment({ ...newAssignment, description: e.target.value })}
                          />
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              placeholder="Max score"
                              type="number"
                              value={newAssignment.max_score}
                              onChange={(e) => setNewAssignment({ 
                                ...newAssignment, 
                                max_score: parseInt(e.target.value) || 100 
                              })}
                            />
                            <Input
                              placeholder="Passing score"
                              type="number"
                              value={newAssignment.passing_score}
                              onChange={(e) => setNewAssignment({ 
                                ...newAssignment, 
                                passing_score: parseInt(e.target.value) || 70 
                              })}
                            />
                            <Input
                              placeholder="Attempts allowed"
                              type="number"
                              value={newAssignment.attempts_allowed}
                              onChange={(e) => setNewAssignment({ 
                                ...newAssignment, 
                                attempts_allowed: parseInt(e.target.value) || 1 
                              })}
                            />
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={newAssignment.is_required}
                                onChange={(e) => setNewAssignment({ ...newAssignment, is_required: e.target.checked })}
                              />
                              <span className="text-sm">Required assignment</span>
                            </label>
                          </div>
                          <Button onClick={handleAddAssignment}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Assignment
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card>
                  <CardHeader>
                    <CardTitle>Enrolled Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Student management features coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Analytics dashboard coming soon...
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a course to start editing or create a new one
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}