import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Feather, Compass, Scale, Book, Plus, Edit, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface SacredPrinciple {
  id: string;
  title: string;
  content: string;
  category: string;
  principle_order: number;
  is_prerequisite: boolean;
  prerequisite_for: any;
  created_by: string;
  created_at: string;
}

export default function SacredLaw(): JSX.Element {
  const [principles, setPrinciples] = useState<SacredPrinciple[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPrinciple, setNewPrinciple] = useState({
    title: "",
    content: "",
    category: "divine_constants",
    principle_order: 1,
    is_prerequisite: false,
    prerequisite_for: [],
  });
  const { toast } = useToast();
  const [lawPdfs, setLawPdfs] = useState<{ name: string; url: string }[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<{
    name: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    fetchPrinciples();
    checkAdminStatus();
    fetchLawPdfs();
  }, []);

  const checkAdminStatus = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    setIsAdmin(profile?.role === "admin");
  };

  const fetchPrinciples = async () => {
    const { data, error } = await supabase
      .from("sacred_law_principles")
      .select("*")
      .order("principle_order", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch sacred principles",
        variant: "destructive",
      });
      return;
    }

    setPrinciples(data || []);
  };

  const fetchLawPdfs = async () => {
    const { data, error } = await supabase.storage
      .from("law-pdfs")
      .list("", { limit: 100, sortBy: { column: "name", order: "asc" } });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch law documents",
        variant: "destructive",
      });
      return;
    }

    const files =
      data?.map((file) => ({
        name: file.name,
        url: supabase.storage.from("law-pdfs").getPublicUrl(file.name).data
          .publicUrl,
      })) || [];
    setLawPdfs(files);
  };

  const handleCreatePrinciple = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isAdmin) {
      toast({
        title: "Access Denied",
        description: "Only admins can create sacred principles",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("sacred_law_principles")
      .insert({
        ...newPrinciple,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create sacred principle",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Sacred principle created successfully",
    });

    setPrinciples([...principles, data]);
    setIsCreateModalOpen(false);
    setNewPrinciple({
      title: "",
      content: "",
      category: "divine_constants",
      principle_order: 1,
      is_prerequisite: false,
      prerequisite_for: [],
    });
  };

  const [studyPrinciple, setStudyPrinciple] = useState<SacredPrinciple | null>(
    null,
  );
  const [editPrinciple, setEditPrinciple] = useState<SacredPrinciple | null>(
    null,
  );

  const handleLearnPrinciple = (principleId: string) => {
    const principle = principles.find((p) => p.id === principleId) || null;
    setStudyPrinciple(principle);
  };

  const handleViewPillars = () => {
    toast({
      title: "72 Pillars",
      description: "Opening the foundational pillars of sacred governance",
    });
  };

  const handleStudyFramework = () => {
    toast({
      title: "Mirror Law Framework",
      description: "Studying the law of correspondence: As above, so below",
    });
  };

  const handleStudyProtocol = () => {
    if (isAdmin) {
      setIsCreateModalOpen(true);
    } else {
      toast({
        title: "Study Protocol",
        description: "Beginning comprehensive study of sacred protocols",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sacred Law Protocols</h1>
          <p className="text-muted-foreground">
            Divine principles and universal constants
          </p>
        </div>
        <Button onClick={handleStudyProtocol}>
          <Book className="h-4 w-4 mr-2" />
          {isAdmin ? "Create Protocol" : "Study Protocol"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Compass className="h-5 w-5" />
              God's Constant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The unchanging divine principle guiding all commerce
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleLearnPrinciple("gods-constant")}
            >
              Learn Principle
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              72 Pillars
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              The foundational pillars of sacred governance
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewPillars}
            >
              View Pillars
            </Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Feather className="h-5 w-5" />
              Mirror Law Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As above, so below - the law of correspondence
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleStudyFramework}
            >
              Study Framework
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Law Reference Documents */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Law References</h2>
        <div className="space-y-2">
          {lawPdfs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No law references found.
            </p>
          )}
          {lawPdfs.map((pdf) => (
            <div
              key={pdf.name}
              className="flex items-center justify-between p-3 border rounded-lg"
            >
              <span className="text-sm font-medium truncate">{pdf.name}</span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedPdf(pdf)}>
                  Preview
                </Button>
                <Button asChild variant="outline">
                  <a href={pdf.url} target="_blank" rel="noopener noreferrer">
                    Download
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sacred Principles List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Sacred Principles</h2>
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Principle
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {principles.map((principle) => (
            <Card
              key={principle.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    <CardTitle className="text-lg">{principle.title}</CardTitle>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">{principle.category}</Badge>
                    {principle.is_prerequisite && (
                      <Badge variant="secondary">Prerequisite</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-xs bg-muted/50 p-2 rounded max-h-20 overflow-y-auto">
                  {principle.content.substring(0, 150)}...
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Order:</span>
                  <span className="font-medium">
                    {principle.principle_order}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleLearnPrinciple(principle.id)}
                  >
                    Study
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Edit principle"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditPrinciple(principle);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {studyPrinciple && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setStudyPrinciple(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>{studyPrinciple.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {studyPrinciple.content}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {isCreateModalOpen && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Sacred Principle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Principle Title</Label>
                <Input
                  id="title"
                  value={newPrinciple.title}
                  onChange={(e) =>
                    setNewPrinciple({ ...newPrinciple, title: e.target.value })
                  }
                  placeholder="e.g., The Law of Divine Commerce"
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={newPrinciple.category}
                  onValueChange={(value) =>
                    setNewPrinciple({ ...newPrinciple, category: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="divine_constants">
                      Divine Constants
                    </SelectItem>
                    <SelectItem value="pillars">72 Pillars</SelectItem>
                    <SelectItem value="mirror_laws">Mirror Laws</SelectItem>
                    <SelectItem value="commerce">Sacred Commerce</SelectItem>
                    <SelectItem value="governance">Governance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="principle_order">Order</Label>
                <Input
                  id="principle_order"
                  type="number"
                  value={newPrinciple.principle_order}
                  onChange={(e) =>
                    setNewPrinciple({
                      ...newPrinciple,
                      principle_order: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="content">Principle Content</Label>
                <Textarea
                  id="content"
                  value={newPrinciple.content}
                  onChange={(e) =>
                    setNewPrinciple({
                      ...newPrinciple,
                      content: e.target.value,
                    })
                  }
                  placeholder="Enter the sacred principle content..."
                  className="min-h-[200px]"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreatePrinciple} className="flex-1">
                  <Crown className="h-4 w-4 mr-2" />
                  Create Principle
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editPrinciple && isAdmin && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setEditPrinciple(null)}
        >
          <Card
            className="w-full max-w-2xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <CardTitle>Edit Sacred Principle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title_edit">Principle Title</Label>
                <Input
                  id="title_edit"
                  value={editPrinciple.title}
                  onChange={(e) =>
                    setEditPrinciple({
                      ...editPrinciple,
                      title: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="order_edit">Order</Label>
                <Input
                  id="order_edit"
                  type="number"
                  value={editPrinciple.principle_order}
                  onChange={(e) =>
                    setEditPrinciple({
                      ...editPrinciple,
                      principle_order: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="content_edit">Content</Label>
                <Textarea
                  id="content_edit"
                  value={editPrinciple.content}
                  onChange={(e) =>
                    setEditPrinciple({
                      ...editPrinciple,
                      content: e.target.value,
                    })
                  }
                  className="min-h-[200px]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={async () => {
                    const { error } = await supabase
                      .from("sacred_law_principles")
                      .update({
                        title: editPrinciple.title,
                        content: editPrinciple.content,
                        principle_order: editPrinciple.principle_order,
                      })
                      .eq("id", editPrinciple.id);
                    if (error) {
                      toast({
                        title: "Error",
                        description: error.message,
                        variant: "destructive",
                      });
                      return;
                    }
                    toast({
                      title: "Updated",
                      description: "Principle updated successfully",
                    });
                    setEditPrinciple(null);
                    fetchPrinciples();
                  }}
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditPrinciple(null)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog
        open={!!selectedPdf}
        onOpenChange={(open) => !open && setSelectedPdf(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedPdf?.name}</DialogTitle>
          </DialogHeader>
          {selectedPdf && (
            <embed
              src={selectedPdf.url}
              type="application/pdf"
              className="w-full h-[80vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
