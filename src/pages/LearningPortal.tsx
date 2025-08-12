import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Filter, Play, Search, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";

interface Course {
  id: string;
  title: string;
  description: string | null;
  slug: string | null;
  category: string | null;
  price_per_student: number | null;
  created_at: string;
}

interface EnrollmentRow {
  course_id: string;
}

interface ProgressRow {
  course_id: string;
  progress_percentage: number | null;
  created_at: string;
}

export default function LearningPortal(): JSX.Element {
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(new Set());
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});

  // UI state
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [price, setPrice] = useState<string>("all"); // free | paid | all
  const [sort, setSort] = useState<string>("newest"); // newest | title

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1) Fetch published courses
        const { data: courseData, error: courseErr } = await supabase
          .from("educational_courses")
          .select(
            "id,title,description,slug,category,price_per_student,created_at",
          )
          .eq("is_published", true)
          .order("created_at", { ascending: false });

        if (courseErr) throw courseErr;
        setCourses(courseData || []);

        // 2) Fetch current user and their enrollments
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: enrollments, error: enrErr } = await supabase
            .from("course_enrollments")
            .select("course_id")
            .eq("student_id", user.id);
          if (!enrErr && enrollments) {
            setEnrolledIds(new Set(enrollments.map((e: EnrollmentRow) => e.course_id)));
          }

          // 3) Fetch progress and compute latest percentage per course
          const { data: progress, error: progErr } = await supabase
            .from("course_progress")
            .select("course_id,progress_percentage,created_at")
            .eq("student_id", user.id);
          if (!progErr && progress) {
            const latest: Record<string, number> = {};
            (progress as ProgressRow[]).forEach((p) => {
              const pct = Number(p.progress_percentage || 0);
              latest[p.course_id] = Math.max(latest[p.course_id] ?? 0, pct);
            });
            setProgressMap(latest);
          }
        } else {
          setEnrolledIds(new Set());
          setProgressMap({});
        }
      } catch (err: any) {
        console.error("LearningPortal load error:", err);
        toast({ title: "Error", description: "Failed to load courses", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [toast]);

  // Distinct categories from loaded courses
  const categories = useMemo(() => {
    const set = new Set<string>();
    courses.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return ["all", ...Array.from(set).sort()];
  }, [courses]);

  const filtered = useMemo(() => {
    let list = [...courses];

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || (c.description || "").toLowerCase().includes(q),
      );
    }

    if (category !== "all") {
      list = list.filter((c) => (c.category || "").toLowerCase() === category.toLowerCase());
    }

    if (price !== "all") {
      list = list.filter((c) => {
        const p = Number(c.price_per_student || 0);
        return price === "free" ? p === 0 : p > 0;
      });
    }

    if (sort === "title") {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return list;
  }, [courses, query, category, price, sort]);

  const ItemListJsonLd = () => {
    const items = filtered.slice(0, 12).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${window.location.origin}/app/learning/courses/${c.slug ?? c.id}`,
      name: c.title,
    }));
    return (
      <script type="application/ld+json">
        {JSON.stringify({ "@context": "https://schema.org", "@type": "ItemList", itemListElement: items })}
      </script>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Helmet>
        <title>Learning Portal | Discover tokenized courses</title>
        <meta name="description" content="Browse courses, track progress, and continue learning in the portal." />
        <link rel="canonical" href={`${window.location.origin}/app/learning`} />
      </Helmet>
      <ItemListJsonLd />

      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Portal</h1>
          <p className="text-muted-foreground">Create and discover tokenized educational courses</p>
        </div>
      </header>

      <section aria-label="Course controls" className="grid gap-4 md:grid-cols-12">
        <div className="md:col-span-5 flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
              aria-label="Search courses"
            />
          </div>
          <Button variant="outline" onClick={() => { setQuery(""); }}>Clear</Button>
        </div>
        <div className="md:col-span-7 grid grid-cols-2 md:grid-cols-4 gap-2">
          <select className="h-10 rounded-md border bg-background px-3" value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </select>
          <select className="h-10 rounded-md border bg-background px-3" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Filter by price">
            <option value="all">All prices</option>
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
          <select className="h-10 rounded-md border bg-background px-3" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort courses">
            <option value="newest">Newest</option>
            <option value="title">Title A–Z</option>
          </select>
          <Button variant="secondary" className="w-full">
            <Filter className="h-4 w-4 mr-2" /> Filters
          </Button>
        </div>
      </section>

      <main>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-2/3" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-9 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((course) => {
              const enrolled = enrolledIds.has(course.id);
              const pct = progressMap[course.id] ?? 0;
              const priceLabel = Number(course.price_per_student || 0) === 0 ? "Free" : `$${course.price_per_student}`;
              return (
                <Card key={course.id} as-child="article">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                      </div>
                      <Badge variant="secondary">{priceLabel}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {course.category && <Badge variant="outline">{course.category}</Badge>}
                      <span>Added {new Date(course.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      {enrolled ? (
                        <Button asChild>
                          <a href={`/app/learning/courses/${course.slug ?? course.id}`}>
                            <Play className="h-4 w-4 mr-2" /> Continue ({pct}%)
                          </a>
                        </Button>
                      ) : (
                        <Button variant="secondary" asChild>
                          <a href={`/app/learning/courses/${course.slug ?? course.id}`}>
                            <Sparkles className="h-4 w-4 mr-2" /> Enroll
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No courses match your filters.</p>
          </div>
        )}
      </main>
    </div>
  );
}
