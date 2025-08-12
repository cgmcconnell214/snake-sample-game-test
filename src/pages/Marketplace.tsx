import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Store, Plus, Search, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Seo from "@/components/Seo";
export default function Marketplace() {
  const navigate = useNavigate();

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const canonicalUrl = origin + "/app/marketplace";

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: origin },
      { "@type": "ListItem", position: 2, name: "Marketplace", item: canonicalUrl },
    ],
  };

  return (
    <>
      <Seo
        title="P2P Marketplace | Asset Trading"
        description="Peer-to-peer asset trading and smart contract offers."
        canonical={canonicalUrl}
      />
      <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">P2P Marketplace</h1>
            <p className="text-muted-foreground">
              Peer-to-peer asset trading and contracts
            </p>
          </div>
          <Button onClick={() => navigate("/app/tokenize")}>
            <Plus className="h-4 w-4 mr-2" />
            List Asset
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card
            onClick={() => navigate("/app/tokenize")}
            className="cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                List New Asset
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Create new asset listings for trading
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/app/tokenize")}
              >
                Create Listing
              </Button>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/app/marketplace/browse")}
            className="cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Browse Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Explore available assets and opportunities
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/app/marketplace/browse")}
              >
                Browse Market
              </Button>
            </CardContent>
          </Card>

          <Card
            onClick={() => navigate("/app/smart-contracts")}
            className="cursor-pointer"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Contract Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View pending and active trading contracts
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/app/smart-contracts")}
              >
                View Queue
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}

