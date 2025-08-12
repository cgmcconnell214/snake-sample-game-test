import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import CertificationList, {
  CertificationItem,
} from "@/components/certification/CertificationList";
import { Award, CheckCircle, Star, Trophy, Book, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CertificationPath {
  id: string;
  name: string;
  description: string;
  level: number;
  requirements: string[];
  rewards: string[];
  estimated_time: string;
  is_completed: boolean;
  progress: number;
  badges_earned: string[];
}

interface UserBadge {
  id: string;
  badge_name: string;
  badge_type: string;
  earned_at: string;
  description: string;
}

export default function Certification(): JSX.Element {
  const [certifications, setCertifications] = useState<CertificationPath[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchCertificationData();
  }, [user]);

  const fetchCertificationData = async () => {
    try {
      // Mock certification paths data
      const mockCertifications: CertificationPath[] = [
        {
          id: "1",
          name: "Sacred Commerce Initiate",
          description:
            "Learn the fundamentals of divine commerce and tokenization",
          level: 1,
          requirements: [
            "Complete KYC verification",
            "Read Sacred Law principles",
            "Tokenize first asset",
            "Complete 3 trading transactions",
          ],
          rewards: [
            "Initiate Badge",
            "Access to Level 2 content",
            "5% trading fee discount",
          ],
          estimated_time: "1-2 weeks",
          is_completed: false,
          progress: 75,
          badges_earned: ["KYC Verified", "First Asset"],
        },
        {
          id: "2",
          name: "Divine Trust Keeper",
          description: "Master trust management and covenant creation",
          level: 2,
          requirements: [
            "Complete Initiate certification",
            "Create 5 trust documents",
            "Manage escrow for 30 days",
            "Verify 10 user profiles",
          ],
          rewards: [
            "Keeper Badge",
            "Trust creation privileges",
            "Escrow fee reduction",
          ],
          estimated_time: "3-4 weeks",
          is_completed: false,
          progress: 25,
          badges_earned: [],
        },
        {
          id: "3",
          name: "Tokenomics Architect",
          description: "Design and implement complex tokenization strategies",
          level: 3,
          requirements: [
            "Complete Trust Keeper certification",
            "Design 3 token economies",
            "Deploy smart contracts",
            "Manage liquidity pools",
          ],
          rewards: [
            "Architect Badge",
            "Smart contract deployment",
            "Revenue sharing",
          ],
          estimated_time: "6-8 weeks",
          is_completed: false,
          progress: 0,
          badges_earned: [],
        },
      ];

      // Mock user badges
      const mockBadges: UserBadge[] = [
        {
          id: "1",
          badge_name: "KYC Verified",
          badge_type: "verification",
          earned_at: new Date(
            Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          description: "Successfully completed KYC verification process",
        },
        {
          id: "2",
          badge_name: "First Asset",
          badge_type: "milestone",
          earned_at: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          description: "Tokenized your first asset on the platform",
        },
        {
          id: "3",
          badge_name: "Early Adopter",
          badge_type: "special",
          earned_at: new Date(
            Date.now() - 10 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          description: "One of the first 100 users on the platform",
        },
      ];

      setCertifications(mockCertifications);
      setUserBadges(mockBadges);
    } catch (error) {
      console.error("Error fetching certification data:", error);
      toast({
        title: "Error",
        description: "Failed to load certification data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartCertification = async (certificationId: string) => {
    const certification = certifications.find((c) => c.id === certificationId);
    if (!certification) return;

    toast({
      title: "Certification Started",
      description: `You've begun the ${certification.name} certification path`,
    });
  };

  const handleClaimBadge = async (badgeName: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to claim badges",
        variant: "destructive",
      });
      return;
    }

    const newBadge: UserBadge = {
      id: Date.now().toString(),
      badge_name: badgeName,
      badge_type: "earned",
      earned_at: new Date().toISOString(),
      description: `Earned ${badgeName} badge through certification progress`,
    };

    setUserBadges([newBadge, ...userBadges]);

    toast({
      title: "Badge Earned!",
      description: `You've earned the ${badgeName} badge`,
    });
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case "verification":
        return <CheckCircle className="h-4 w-4" />;
      case "milestone":
        return <Trophy className="h-4 w-4" />;
      case "special":
        return <Star className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "default";
      case 2:
        return "secondary";
      case 3:
        return "destructive";
      default:
        return "outline";
    }
  };

  const overallProgress =
    certifications.reduce((acc, cert) => acc + cert.progress, 0) /
    certifications.length;

  const certificationItems: CertificationItem[] = certifications.map(
    (cert) => ({
      id: cert.id,
      name: cert.name,
      description: cert.description,
      level: cert.level,
      levelVariant: getLevelColor(
        cert.level,
      ) as CertificationItem["levelVariant"],
      progress: cert.progress,
      requirements: cert.requirements,
      rewards: cert.rewards,
      estimatedTime: cert.estimated_time,
      icon: Trophy,
      isCompleted: cert.is_completed,
      actionLabel:
        cert.progress === 0
          ? "Start Certification"
          : cert.is_completed
            ? undefined
            : "Continue",
      actionVariant: cert.progress === 0 ? "default" : "outline",
      onAction:
        cert.progress === 0 || !cert.is_completed
          ? () => handleStartCertification(cert.id)
          : undefined,
    }),
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certification Paths</h1>
          <p className="text-muted-foreground">
            Master sacred commerce and unlock advanced platform features
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{userBadges.length}</div>
            <div className="text-sm text-muted-foreground">Badges Earned</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">
              {Math.round(overallProgress)}%
            </div>
            <div className="text-sm text-muted-foreground">
              Overall Progress
            </div>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            <CardTitle>Your Learning Journey</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Overall Certification Progress</span>
              <span>{Math.round(overallProgress)}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-xl font-bold text-primary">
                  {certifications.filter((c) => c.is_completed).length}
                </div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-secondary">
                  {
                    certifications.filter(
                      (c) => c.progress > 0 && !c.is_completed,
                    ).length
                  }
                </div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-muted-foreground">
                  {certifications.filter((c) => c.progress === 0).length}
                </div>
                <div className="text-sm text-muted-foreground">Not Started</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Certification Paths */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-semibold">Certification Paths</h2>
          <CertificationList
            certifications={certificationItems}
            gridClassName="grid-cols-1"
          />
          {certifications.map((cert) => (
            <Card key={cert.id} className="relative overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-5 w-5" />
                      <CardTitle>{cert.name}</CardTitle>
                      <Badge variant={getLevelColor(cert.level)}>
                        Level {cert.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cert.description}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{cert.progress}%</div>
                    <div className="text-xs text-muted-foreground">
                      Complete
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={cert.progress} className="h-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {cert.requirements.map((req, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-center gap-2"
                        >
                          <CheckCircle
                            className={`h-3 w-3 ${index < cert.requirements.length * (cert.progress / 100) ? "text-green-500" : "text-muted-foreground"}`}
                          />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Rewards</h4>
                    <ul className="space-y-1">
                      {cert.rewards.map((reward, index) => (
                        <li
                          key={index}
                          className="text-sm flex items-center gap-2"
                        >
                          <Star className="h-3 w-3 text-yellow-500" />
                          {reward}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Estimated time: {cert.estimated_time}
                  </div>

                  {cert.progress === 0 ? (
                    <Button onClick={() => handleStartCertification(cert.id)}>
                      Start Certification
                    </Button>
                  ) : cert.is_completed ? (
                    <Badge variant="default">Completed</Badge>
                  ) : (
                    <Button variant="outline">Continue</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* User Badges */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Your Badges</h2>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                <CardTitle>Earned Badges</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {userBadges.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No badges earned yet. Complete certification requirements to
                  earn your first badge!
                </div>
              ) : (
                userBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className="p-2 bg-primary/10 rounded-full">
                      {getBadgeIcon(badge.badge_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{badge.badge_name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {badge.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Earned {new Date(badge.earned_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}

              {/* Available Badges to Claim */}
              {certifications.some((c) => c.badges_earned.length > 0) && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Available to Claim</h4>
                  {certifications.map((cert) =>
                    cert.badges_earned.map((badge) => (
                      <div
                        key={`${cert.id}-${badge}`}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm">{badge}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleClaimBadge(badge)}
                        >
                          Claim
                        </Button>
                      </div>
                    )),
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
