import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { History, Eye, Search, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ProvenanceCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  action: string;
}

export default function AssetProvenance(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cards, setCards] = useState<ProvenanceCard[]>([]);

  const handleTrackAsset = () => {
    navigate('/app/tokenize');
  };

  useEffect(() => {
    const fetchCards = async () => {
      try {
        const response = await fetch('/api/asset-provenance');
        if (!response.ok) throw new Error('Failed to fetch asset provenance');
        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error('Error loading asset provenance:', error);
        toast({
          title: 'Error',
          description: 'Failed to load asset provenance cards',
          variant: 'destructive',
        });
      }
    };

    fetchCards();
  }, [toast]);

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    history: History,
    eye: Eye,
    clock: Clock,
  };

  const handleAction = (path: string) => {
    navigate(path);
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
        {cards.map((card) => {
          const Icon = iconMap[card.icon] || History;
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
                  onClick={() => handleAction(card.action)}
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
