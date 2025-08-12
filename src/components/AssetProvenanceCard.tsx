import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReactNode } from "react";

interface AssetProvenanceCardProps {
  icon: ReactNode;
  title: ReactNode;
  description?: string;
  action?: ReactNode;
  children?: ReactNode;
}

export default function AssetProvenanceCard({
  icon,
  title,
  description,
  action,
  children,
}: AssetProvenanceCardProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {description && (
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
        )}
        {children}
        {action && <div className="mt-4">{action}</div>}
      </CardContent>
    </Card>
  );
}
