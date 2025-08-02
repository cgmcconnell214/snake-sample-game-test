import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Award, Star, Trophy, CheckCircle, Clock, Target, 
  Download, Share, Eye, Lock, Users, BarChart 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Certification {
  id: string;
  name: string;
  description: string;
  skill_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  points_required: number;
  badge_image_url?: string;
  requirements: any[];
  is_active: boolean;
}

interface UserCertification {
  id: string;
  certification_id: string;
  earned_at: string;
  expires_at?: string;
  verification_code: string;
  certificate_url?: string;
  certifications: Certification;
}

interface UserSkill {
  id: string;
  skill_id: string;
  current_level: number;
  experience_points: number;
  skills: {
    name: string;
    category: string;
    description: string;
  };
}

export default function CertificationDashboard() {
  const [userCertifications, setUserCertifications] = useState<UserCertification[]>([]);
  const [availableCertifications, setAvailableCertifications] = useState<Certification[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [activeTab, setActiveTab] = useState("earned");
  const { toast } = useToast();

  useEffect(() => {
    fetchUserCertifications();
    fetchAvailableCertifications();
    fetchUserSkills();
  }, []);

  const fetchUserCertifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_certifications")
      .select(`
        *,
        certifications (*)
      `)
      .eq("user_id", user.id)
      .order("earned_at", { ascending: false });

    if (data) {
      setUserCertifications(data as UserCertification[]);
    }
  };

  const fetchAvailableCertifications = async () => {
    const { data, error } = await supabase
      .from("certifications")
      .select("*")
      .eq("is_active", true)
      .order("skill_level", { ascending: true });

    if (data) {
      setAvailableCertifications(data as Certification[]);
    }
  };

  const fetchUserSkills = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("user_skills")
      .select(`
        *,
        skills (*)
      `)
      .eq("user_id", user.id)
      .order("experience_points", { ascending: false });

    if (data) {
      setUserSkills(data);
      const total = data.reduce((sum, skill) => sum + skill.experience_points, 0);
      setTotalPoints(total);
    }
  };

  const getSkillLevelName = (level: string) => {
    const levels = {
      'beginner': 'Novice',
      'intermediate': 'Practitioner',
      'advanced': 'Expert',
      'expert': 'Master'
    };
    return levels[level] || level;
  };

  const getSkillLevelColor = (level: string) => {
    const colors = {
      'beginner': 'bg-green-500',
      'intermediate': 'bg-blue-500',
      'advanced': 'bg-purple-500',
      'expert': 'bg-gold-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  const canEarnCertification = (cert: Certification) => {
    return totalPoints >= cert.points_required;
  };

  const earnCertification = async (certificationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if user already has this certification
    const existing = userCertifications.find(uc => uc.certification_id === certificationId);
    if (existing) {
      toast({
        title: "Already Earned",
        description: "You already have this certification",
        variant: "destructive",
      });
      return;
    }

    const verification_code = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data, error } = await supabase
      .from("user_certifications")
      .insert({
        user_id: user.id,
        certification_id: certificationId,
        verification_code,
      })
      .select(`
        *,
        certifications (*)
      `)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to earn certification",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Congratulations!",
      description: "You've earned a new certification!",
    });

    setUserCertifications([data as UserCertification, ...userCertifications]);
  };

  const generateCertificate = async (certificationId: string) => {
    toast({
      title: "Generating Certificate",
      description: "Your certificate is being generated...",
    });
    // Here you would implement certificate generation
  };

  const shareCertification = async (certification: UserCertification) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `I earned the ${certification.certifications.name} certification!`,
          text: `Check out my new certification in ${certification.certifications.name}`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        navigator.clipboard.writeText(`I earned the ${certification.certifications.name} certification! Verification code: ${certification.verification_code}`);
        toast({
          title: "Copied to clipboard",
          description: "Certification details copied to clipboard",
        });
      }
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certification Dashboard</h1>
          <p className="text-muted-foreground">
            Track your learning progress and earn certifications
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">{totalPoints}</p>
          <p className="text-sm text-muted-foreground">Total Points</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="text-center p-4">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-2xl font-bold">{userCertifications.length}</p>
            <p className="text-sm text-muted-foreground">Certifications Earned</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4">
            <Star className="h-8 w-8 mx-auto mb-2 text-blue-500" />
            <p className="text-2xl font-bold">{userSkills.length}</p>
            <p className="text-sm text-muted-foreground">Skills Developed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4">
            <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold">{totalPoints}</p>
            <p className="text-sm text-muted-foreground">Experience Points</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="text-center p-4">
            <BarChart className="h-8 w-8 mx-auto mb-2 text-purple-500" />
            <p className="text-2xl font-bold">
              {userSkills.filter(s => s.current_level >= 5).length}
            </p>
            <p className="text-sm text-muted-foreground">Advanced Skills</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="earned">Earned Certifications</TabsTrigger>
          <TabsTrigger value="available">Available Certifications</TabsTrigger>
          <TabsTrigger value="skills">Skills Progress</TabsTrigger>
          <TabsTrigger value="badges">Badge Collection</TabsTrigger>
        </TabsList>

        <TabsContent value="earned">
          <div className="space-y-4">
            {userCertifications.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    You haven't earned any certifications yet. Start learning to earn your first one!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userCertifications.map((cert) => (
                  <Card key={cert.id} className="relative">
                    <div className="absolute top-4 right-4">
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    </div>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSkillLevelColor(cert.certifications.skill_level)}`}>
                          <Award className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cert.certifications.name}</CardTitle>
                          <Badge variant="outline">
                            {getSkillLevelName(cert.certifications.skill_level)}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        {cert.certifications.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Earned:</span>
                          <span>{new Date(cert.earned_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Verification:</span>
                          <span className="font-mono text-xs">{cert.verification_code}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => generateCertificate(cert.certification_id)}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => shareCertification(cert)}
                        >
                          <Share className="h-4 w-4 mr-1" />
                          Share
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCertifications.map((cert) => {
              const isEarned = userCertifications.some(uc => uc.certification_id === cert.id);
              const canEarn = canEarnCertification(cert);
              
              return (
                <Card key={cert.id} className={`relative ${isEarned ? 'opacity-50' : ''}`}>
                  {isEarned && (
                    <div className="absolute top-4 right-4">
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getSkillLevelColor(cert.skill_level)}`}>
                        {isEarned ? (
                          <Award className="h-6 w-6 text-white" />
                        ) : canEarn ? (
                          <Target className="h-6 w-6 text-white" />
                        ) : (
                          <Lock className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{cert.name}</CardTitle>
                        <Badge variant="outline">
                          {getSkillLevelName(cert.skill_level)}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {cert.description}
                    </p>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Points Required:</span>
                        <span className="font-semibold">{cert.points_required}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Your Points:</span>
                        <span className={totalPoints >= cert.points_required ? "text-green-600 font-semibold" : "text-muted-foreground"}>
                          {totalPoints}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min((totalPoints / cert.points_required) * 100, 100)} 
                        className="h-2"
                      />
                    </div>
                    {!isEarned && (
                      <Button 
                        onClick={() => earnCertification(cert.id)}
                        disabled={!canEarn}
                        className="w-full"
                      >
                        {canEarn ? (
                          <>
                            <Award className="h-4 w-4 mr-2" />
                            Earn Certification
                          </>
                        ) : (
                          <>
                            <Lock className="h-4 w-4 mr-2" />
                            Points Required: {cert.points_required - totalPoints}
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="skills">
          <div className="space-y-4">
            {userSkills.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Start taking courses to develop your skills!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {userSkills.map((skill) => (
                  <Card key={skill.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{skill.skills.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{skill.skills.category}</p>
                        </div>
                        <Badge variant="outline">
                          Level {skill.current_level}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {skill.skills.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Experience Points:</span>
                          <span className="font-semibold">{skill.experience_points}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Next Level:</span>
                          <span className="text-muted-foreground">
                            {Math.max(0, (skill.current_level + 1) * 100 - skill.experience_points)} XP needed
                          </span>
                        </div>
                        <Progress 
                          value={(skill.experience_points % 100)} 
                          className="h-2"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle>Badge Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Digital badge display coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}