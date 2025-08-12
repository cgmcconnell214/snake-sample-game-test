import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CrawlResponse {
  success?: boolean;
  data?: any;
  error?: string;
  details?: any;
}

export default function ScrapeBot() {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    setLoading(true);
    setProgress(10);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke<CrawlResponse>("scrape-website", {
        body: { url, limit: 100, formats: ["markdown", "html"] },
      });

      setProgress(80);

      if (error) {
        console.error("Scrape error", error);
        toast({ title: "Scrape failed", description: error.message, variant: "destructive" });
        return;
      }

      if (!data?.success) {
        console.error("Scrape failed", data);
        toast({ title: "Scrape failed", description: data?.error || "Unknown error", variant: "destructive" });
        return;
      }

      setResult(data.data);
      toast({ title: "Scrape complete", description: "Website crawled successfully" });
    } catch (err) {
      console.error(err);
      toast({ title: "Unexpected error", description: String((err as any)?.message || err), variant: "destructive" });
    } finally {
      setProgress(100);
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="pt-6 space-y-4">
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-2">
            <label htmlFor="scrape-url" className="text-sm font-medium text-foreground">Website URL</label>
            <Input
              id="scrape-url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          {loading && <Progress value={progress} />}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Scraping..." : "Start Scrape"}
          </Button>
        </form>

        {result && (
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Results</h3>
            <pre className="max-h-64 overflow-auto rounded-md border border-border p-3 text-xs bg-card">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
