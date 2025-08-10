import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CertificationList, {
  CertificationItem,
} from "@/components/certification/CertificationList";
import { Award, CheckCircle, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function Certification(): JSX.Element {
  const navigate = useNavigate();
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);

  const handleEnroll = async (certificationId: string) => {
    try {
      setEnrolling(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to enroll",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("user_certifications")
        .insert({
          user_id: user.id,
          certification_id: certificationId,
        });

      if (error) throw error;

      setIsEnrolled(true);
      toast({
        title: "Enrollment Successful",
        description: "You are now enrolled in the certification path",
      });
    } catch (error: any) {
      console.error("Error enrolling in certification:", error);
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in certification",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  const handleViewBadges = () => {
    navigate("/app/badges");
  };

  const handleViewChecklist = () => {
    navigate("/app/onboarding");
  };

  const handleViewProgress = () => {
    navigate("/app/badges");
  };

  const handleCheckAccess = () => {
    navigate("/app/certification");
  };

  const certifications: CertificationItem[] = [
    {
      id: "checklist",
      name: "Onboarding Checklist",
      description: "Complete essential steps to get started",
      icon: CheckCircle,
      actionLabel: "View Checklist",
      onAction: handleViewChecklist,
    },
    {
      id: "badges",
      name: "Badge Progression",
      description: "Track your progress through skill levels",
      icon: Star,
      actionLabel: "View Progress",
      onAction: handleViewProgress,
    },
    {
      id: "access",
      name: "Access Gating by Level",
      description: "Unlock features based on certification level",
      icon: Clock,
      actionLabel: "Check Access",
      onAction: handleCheckAccess,
    },
  ];
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certification Paths</h1>
          <p className="text-muted-foreground">
            Validate your knowledge and unlock new access levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={enrolling || isEnrolled}
            onClick={() => handleEnroll("1")}
          >
            {isEnrolled ? "Enrolled" : enrolling ? "Enrolling..." : "Enroll"}
          </Button>
          <Button onClick={handleViewBadges}>
            <Award className="h-4 w-4 mr-2" />
            View My Badges
          </Button>
        </div>
      </div>
      <CertificationList certifications={certifications} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <CardTitle>Onboarding Checklist</CardTitle>
            </div>
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
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              <CardTitle>Badge Progression</CardTitle>
            </div>
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
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              <CardTitle>Access Gating by Level</CardTitle>
            </div>
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
