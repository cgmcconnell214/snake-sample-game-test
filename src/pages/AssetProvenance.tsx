import { Button } from "@/components/ui/button";
import AssetProvenanceCard from "@/components/AssetProvenanceCard";
import { History, Eye, Search, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AssetProvenance(): JSX.Element {
  const navigate = useNavigate();

  const handleTrackAsset = () => {
    navigate('/app/tokenize');
  };

  const handleViewTimeline = () => {
    navigate('/app/audit-trail');
  };

  const handleTrackCommodity = () => {
    navigate('/app/tokenize');
  };

  const handleViewJourney = () => {
    navigate('/app/ip-tokenization');
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
        <AssetProvenanceCard
          icon={<History className="h-5 w-5" />}
          title="Visual History"
          description="Complete visual timeline of asset lifecycle"
          action={
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewTimeline}
            >
              View Timeline
            </Button>
          }
        />

        <AssetProvenanceCard
          icon={<Eye className="h-5 w-5" />}
          title="Commodity Tracking"
          description="Track physical commodities from origin to token"
          action={
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTrackCommodity}
            >
              Track Commodity
            </Button>
          }
        />

        <AssetProvenanceCard
          icon={<Clock className="h-5 w-5" />}
          title="IP Asset Journey"
          description="Follow intellectual property from creation to tokenization"
          action={
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewJourney}
            >
              View Journey
            </Button>
          }
        />
      </div>
    </div>
  );
}
