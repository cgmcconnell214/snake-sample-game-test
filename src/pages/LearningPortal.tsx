import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Book, Play, Award } from "lucide-react";
import { useState } from "react";
import { injectContractTemplate } from "@/lib/contractTemplates";
import { useToast } from "@/hooks/use-toast";

export default function LearningPortal() {
  const [activeCourse, setActiveCourse] = useState<string | null>(null);
  const { toast } = useToast();

  const handleLearn = async () => {
    await injectContractTemplate('learn');
  };

  const handleContinueLearning = () => {
    toast({
      title: "Continue Learning",
      description: "Resuming your learning journey",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Portal</h1>
          <p className="text-muted-foreground">
            Master tokenization and sacred commerce
          </p>
        </div>
        <Button onClick={handleContinueLearning}>
          <Play className="h-4 w-4 mr-2" />
          Continue Learning
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Tokenization 101
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Fundamental concepts of asset tokenization
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveCourse('Tokenization 101')}
            >
              Start Course
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Compliance Academy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Regulatory compliance and legal frameworks
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveCourse('Compliance Academy')}
            >
              Learn More
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Ecclesiastical Trust Law
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sacred law and divine jurisdiction principles
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setActiveCourse('Ecclesiastical Trust Law')}
            >
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>

      {activeCourse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>{activeCourse}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Course launch placeholder. Full curriculum coming soon.
              </p>
              <Button onClick={() => setActiveCourse(null)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}