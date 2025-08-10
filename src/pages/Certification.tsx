import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, CheckCircle, Clock, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export default function Certification(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleViewBadges = () => {
    navigate('/app/badges');
  };

  const handleViewChecklist = () => {
    navigate('/app/onboarding');
  };

  const handleViewProgress = () => {
    navigate('/app/badges');
  };

  const handleCheckAccess = () => {
    navigate('/app/certification');
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certification Paths</h1>
          <p className="text-muted-foreground">
            Validate your knowledge and unlock new access levels
          </p>
        </div>
        <Button onClick={handleViewBadges}>
          <Award className="h-4 w-4 mr-2" />
          View My Badges
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Onboarding Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Complete essential steps to get started
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewChecklist}>
              View Checklist
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Badge Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track your progress through skill levels
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewProgress}>
              View Progress
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Access Gating by Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Unlock features based on certification level
            </p>
            <Button variant="outline" className="w-full" onClick={handleCheckAccess}>
              Check Access
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
