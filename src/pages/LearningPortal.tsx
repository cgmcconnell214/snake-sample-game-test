import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, Book, Play, Award } from "lucide-react";

export default function LearningPortal(): JSX.Element {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Learning Portal</h1>
          <p className="text-muted-foreground">
            Master tokenization and sacred commerce
          </p>
        </div>
        <Button>
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
            <Button variant="outline" className="w-full">
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
            <Button variant="outline" className="w-full">
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
            <Button variant="outline" className="w-full">
              Explore
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
