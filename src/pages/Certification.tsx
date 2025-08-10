import { Button } from "@/components/ui/button";
import CertificationList, {
  CertificationItem,
} from "@/components/certification/CertificationList";
import { Award, CheckCircle, Clock, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Certification(): JSX.Element {
  const navigate = useNavigate();

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
        <Button onClick={handleViewBadges}>
          <Award className="h-4 w-4 mr-2" />
          View My Badges
        </Button>
      </div>
      <CertificationList certifications={certifications} />
    </div>
  );
}
