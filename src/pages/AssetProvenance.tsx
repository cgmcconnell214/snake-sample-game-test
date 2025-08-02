import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Eye, Search, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AssetProvenance(): JSX.Element {
  const { toast } = useToast();

  const handleTrackAsset = () => {
    toast({
      title: "Asset Tracking",
      description: "Asset tracking feature coming soon",
    });
  };

  const handleViewTimeline = () => {
    toast({
      title: "Visual Timeline",
      description: "Opening asset timeline visualization",
    });
  };

  const handleTrackCommodity = () => {
    toast({
      title: "Commodity Tracking",
      description: "Initiating commodity provenance tracking",
    });
  };

  const handleViewJourney = () => {
    toast({
      title: "IP Asset Journey",
      description: "Loading intellectual property journey",
    });
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Provenance</h1>
          <p className="text-muted-foreground">
            Visual history and tracking of tokenized assets
          </p>
        </div>
        <Button onClick={handleTrackAsset}>
          <Search className="h-4 w-4 mr-2" />
          Track Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Visual History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Complete visual timeline of asset lifecycle
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewTimeline}>
              View Timeline
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Commodity Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Track physical commodities from origin to token
            </p>
            <Button variant="outline" className="w-full" onClick={handleTrackCommodity}>
              Track Commodity
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              IP Asset Journey
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Follow intellectual property from creation to tokenization
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewJourney}>
              View Journey
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
