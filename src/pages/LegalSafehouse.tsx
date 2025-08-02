import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, FileText, Shield, Scale } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LegalSafehouse(): JSX.Element {
  const { toast } = useToast();

  const handleCreateDocument = () => {
    toast({
      title: "Create Document",
      description: "Opening legal document creation wizard",
    });
  };

  const handleCreateAffidavit = () => {
    toast({
      title: "Create Affidavit",
      description: "Starting sworn statement creation process",
    });
  };

  const handleMakeDeclaration = () => {
    toast({
      title: "Make Declaration",
      description: "Initiating formal rights declaration",
    });
  };

  const handleFileExemption = () => {
    toast({
      title: "File Exemption",
      description: "Creating sacred exemption notice",
    });
  };
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Legal Safehouse</h1>
          <p className="text-muted-foreground">
            Secure legal documents and exemption notices
          </p>
        </div>
        <Button onClick={handleCreateDocument}>
          <FileText className="h-4 w-4 mr-2" />
          Create Document
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              User Affidavits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create and manage sworn statements and affidavits
            </p>
            <Button variant="outline" className="w-full" onClick={handleCreateAffidavit}>
              Create Affidavit
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scale className="h-5 w-5" />
              Declarations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Formal declarations of rights and status
            </p>
            <Button variant="outline" className="w-full" onClick={handleMakeDeclaration}>
              Make Declaration
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Sacred Exemption Notices
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Religious and ecclesiastical exemption documents
            </p>
            <Button variant="outline" className="w-full" onClick={handleFileExemption}>
              File Exemption
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
