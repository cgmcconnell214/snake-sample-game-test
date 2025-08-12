import { useState, useEffect } from "react";
import AssetProvenanceCard from "@/components/AssetProvenanceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Eye,
  Search,
  Clock,
  MapPin,
  Users,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AssetProvenanceRecord {
  id: string;
  asset_id: string;
  asset_name: string;
  event_type: string;
  event_description: string;
  location?: string;
  user_id: string;
  timestamp: string;
  verification_status: "verified" | "pending" | "disputed";
  metadata?: any;
}

export default function AssetProvenance(): JSX.Element {
  const [records, setRecords] = useState<AssetProvenanceRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProvenanceRecords();
  }, []);

  const fetchProvenanceRecords = async () => {
    try {
      const { data: assets } = await supabase
        .from("tokenized_assets")
        .select("*")
        .eq("is_active", true);

      // Create mock provenance records
      const mockRecords: AssetProvenanceRecord[] = [];

      assets?.forEach((asset) => {
        mockRecords.push(
          {
            id: `${asset.id}-1`,
            asset_id: asset.id,
            asset_name: asset.asset_name,
            event_type: "creation",
            event_description: "Asset first registered and tokenized",
            location: "Digital Registry",
            user_id: asset.creator_id,
            timestamp: asset.created_at,
            verification_status: "verified",
            metadata: {
              initial_value: (asset.metadata as any)?.estimated_value || 0,
            },
          },
          {
            id: `${asset.id}-2`,
            asset_id: asset.id,
            asset_name: asset.asset_name,
            event_type: "verification",
            event_description: "KYC and compliance verification completed",
            location: "Compliance Center",
            user_id: asset.creator_id,
            timestamp: new Date(
              Date.now() - Math.random() * 86400000,
            ).toISOString(),
            verification_status: "verified",
            metadata: { compliance_score: 98 },
          },
          {
            id: `${asset.id}-3`,
            asset_id: asset.id,
            asset_name: asset.asset_name,
            event_type: "minting",
            event_description: `${asset.total_supply} tokens minted`,
            location: "Blockchain Network",
            user_id: asset.creator_id,
            timestamp: new Date(
              Date.now() - Math.random() * 43200000,
            ).toISOString(),
            verification_status: "verified",
            metadata: { tokens_minted: asset.total_supply },
          },
        );
      });

      setRecords(
        mockRecords.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error fetching provenance records:", error);
      toast({
        title: "Error",
        description: "Failed to load provenance records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(
    (record) =>
      record.asset_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.event_description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      record.event_type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayedRecords = selectedAsset
    ? filteredRecords.filter((record) => record.asset_id === selectedAsset)
    : filteredRecords;

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "creation":
        return <FileText className="h-4 w-4" />;
      case "verification":
        return <Eye className="h-4 w-4" />;
      case "minting":
        return <History className="h-4 w-4" />;
      case "transfer":
        return <Users className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "verified":
        return "default";
      case "pending":
        return "secondary";
      case "disputed":
        return "destructive";
      default:
        return "outline";
    }
  };

  const uniqueAssets = Array.from(new Set(records.map((r) => r.asset_id)))
    .map((assetId) => records.find((r) => r.asset_id === assetId)!)
    .filter(Boolean);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Asset Provenance</h1>
          <p className="text-muted-foreground">
            Complete audit trail and history tracking for all tokenized assets
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setSelectedAsset(null)}>
            <History className="h-4 w-4 mr-2" />
            All Assets
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by asset name, event type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Asset Selection Sidebar */}
        <div className="lg:col-span-1">
          <AssetProvenanceCard
            icon={<MapPin className="h-5 w-5" />}
            title="Tracked Assets"
          >
            <div className="space-y-2">
              <Button
                variant={selectedAsset === null ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setSelectedAsset(null)}
              >
                All Assets ({records.length})
              </Button>
              {uniqueAssets.map((record) => (
                <Button
                  key={record.asset_id}
                  variant={
                    selectedAsset === record.asset_id ? "default" : "outline"
                  }
                  className="w-full justify-start text-left"
                  onClick={() => setSelectedAsset(record.asset_id)}
                >
                  <div className="flex flex-col items-start">
                    <span className="truncate">{record.asset_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {
                        records.filter((r) => r.asset_id === record.asset_id)
                          .length
                      }{" "}
                      events
                    </span>
                  </div>
                </Button>
              ))}
            </div>
          </AssetProvenanceCard>
        </div>

        {/* Provenance Timeline */}
        <div className="lg:col-span-3">
          <AssetProvenanceCard
            icon={<Clock className="h-5 w-5" />}
            title={
              <>
                Provenance Timeline
                {selectedAsset && (
                  <Badge variant="secondary">
                    {displayedRecords[0]?.asset_name}
                  </Badge>
                )}
              </>
            }
          >
            {loading ? (
              <div className="text-center py-8">
                Loading provenance records...
              </div>
            ) : displayedRecords.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No provenance records found
              </div>
            ) : (
              <div className="space-y-4">
                {displayedRecords.map((record, index) => (
                  <div
                    key={record.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <div className="flex flex-col items-center">
                      <div className="p-2 bg-muted rounded-full">
                        {getEventIcon(record.event_type)}
                      </div>
                      {index < displayedRecords.length - 1 && (
                        <div className="w-px bg-border h-8 mt-2" />
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium capitalize">
                            {record.event_type.replace("_", " ")}
                          </h4>
                          <Badge
                            variant={getStatusColor(record.verification_status)}
                          >
                            {record.verification_status}
                          </Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(record.timestamp).toLocaleString()}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground">
                        {record.event_description}
                      </p>

                      {record.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {record.location}
                        </div>
                      )}

                      {record.metadata && (
                        <div className="text-xs bg-muted p-2 rounded">
                          <strong>Metadata:</strong>{" "}
                          {JSON.stringify(record.metadata, null, 2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AssetProvenanceCard>
        </div>
      </div>
    </div>
  );
}
