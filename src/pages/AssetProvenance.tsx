import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Eye, Clock, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ProvenanceCard {
  id: string;
  title: string;
  description: string;
  icon: "history" | "eye" | "clock";
  actionLabel: string;
  action: string;
}

export default function AssetProvenance(): JSX.Element {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cards, setCards] = useState<ProvenanceCard[]>([]);

  useEffect(() => {
    document.title = "Asset Provenance | Visual history and tracking";
  }, []);

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch("/api/asset-provenance");
        if (!response.ok) throw new Error("Failed to fetch asset provenance");
        const data = (await response.json()) as ProvenanceCard[];
        setCards(data);
      } catch (error) {
        console.error("Error loading asset provenance:", error);
        // Fallback defaults so the page still works
        setCards([
          {
            id: "visual-history",
            title: "Visual History",
            description: "Complete visual timeline of asset lifecycle",
            icon: "history",
            actionLabel: "View Timeline",
            action: "/app/audit-trail",
          },
          {
            id: "commodity-tracking",
            title: "Commodity Tracking",
            description: "Track physical commodities from origin to token",
            icon: "eye",
            actionLabel: "Track Commodity",
            action: "/app/tokenize",
          },
          {
            id: "ip-journey",
            title: "IP Asset Journey",
            description: "Follow intellectual property from creation to tokenization",
            icon: "clock",
            actionLabel: "View Journey",
            action: "/app/ip-tokenization",
          },
        ]);
        toast({
          title: "Unable to reach API",
          description: "Loaded default provenance actions.",
          variant: "default",
        });
      }
    };

    fetchCards();
  }, [toast]);

  const iconMap: Record<ProvenanceCard["icon"], React.ComponentType<{ className?: string }>> = {
    history: History,
    eye: Eye,
    clock: Clock,
  };

  const navigateTo = (path: string) => {
    try {
      navigate(path);
    } catch (error) {
      console.error("Navigation failed:", error);
      toast({
        title: "Navigation failed",
        description: "Unable to navigate to the requested page.",
        variant: "destructive",
      });
    }
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
        <Button onClick={() => navigateTo("/app/tokenize")}> 
          <Search className="h-4 w-4 mr-2" />
          Track Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => {
          const Icon = iconMap[card.icon];
          return (
            <Card key={card.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {card.description}
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigateTo(card.action)}
                >
                  {card.actionLabel}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
