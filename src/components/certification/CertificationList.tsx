import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, Star } from "lucide-react";
import { ComponentType } from "react";

export interface CertificationItem {
  id: string;
  name: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  level?: number;
  levelVariant?: "default" | "secondary" | "destructive" | "outline";
  progress?: number;
  requirements?: string[];
  rewards?: string[];
  estimatedTime?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: "default" | "outline";
  isCompleted?: boolean;
}

interface CertificationListProps {
  certifications: CertificationItem[];
  gridClassName?: string;
}

export default function CertificationList({
  certifications,
  gridClassName,
}: CertificationListProps): JSX.Element {
  return (
    <div
      className={`grid gap-6 ${
        gridClassName || "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
      }`}
    >
      {certifications.map((cert) => {
        const completedRequirements = cert.requirements
          ? Math.round((cert.requirements.length * (cert.progress || 0)) / 100)
          : 0;

        return (
          <Card key={cert.id} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {cert.icon && <cert.icon className="h-5 w-5" />}
                    {cert.name}
                    {cert.level && (
                      <Badge variant={cert.levelVariant || "outline"}>
                        Level {cert.level}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {cert.description}
                  </p>
                </div>
                {typeof cert.progress === "number" && (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{cert.progress}%</div>
                    <div className="text-xs text-muted-foreground">Complete</div>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {typeof cert.progress === "number" && (
                <Progress value={cert.progress} className="h-2" />
              )}

              {(cert.requirements?.length || 0) > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Requirements</h4>
                  <ul className="space-y-1">
                    {cert.requirements!.map((req, index) => (
                      <li
                        key={index}
                        className="text-sm flex items-center gap-2"
                      >
                        <CheckCircle
                          className={`h-3 w-3 ${
                            index < completedRequirements
                              ? "text-green-500"
                              : "text-muted-foreground"
                          }`}
                        />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(cert.rewards?.length || 0) > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Rewards</h4>
                  <ul className="space-y-1">
                    {cert.rewards!.map((reward, index) => (
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
              )}

              {cert.estimatedTime && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Estimated time: {cert.estimatedTime}
                </div>
              )}

              {cert.isCompleted ? (
                <Badge variant="default">Completed</Badge>
              ) : (
                cert.actionLabel && (
                  <Button
                    variant={cert.actionVariant || "outline"}
                    className="w-full"
                    onClick={cert.onAction}
                  >
                    {cert.actionLabel}
                  </Button>
                )
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

