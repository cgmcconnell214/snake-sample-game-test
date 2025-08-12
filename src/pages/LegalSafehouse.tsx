import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Lock, FileText, Shield, Scale, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFileUpload } from "@/hooks/use-file-upload";

export default function LegalSafehouse(): JSX.Element {
  const { toast } = useToast();
  const navigate = useNavigate();

  interface StoredDocument {
    name: string;
    path: string;
    url: string;
    status: string;
  }

  const bucketName = "legal-documents";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const { uploadFiles, uploading, progress } = useFileUpload();

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase.storage.from(bucketName).list();
      if (error) throw error;

      const docs =
        data?.map((item) => {
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(item.name);
          return {
            name: item.name,

            url: urlData.publicUrl,
            status: "Stored",
          };
        }) ?? [];
      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (!files.length) return;
    try {
      const results = await uploadFiles(files, bucketName);
      const newDocs = results.map((res) => {
        const path = res.url.split("/").pop() || res.name;
        return { name: res.name, path, url: res.url, status: "Uploaded" };
      });
      setDocuments((prev) => [...prev, ...newDocs]);
      toast({
        title: "Upload complete",
        description: `${results.length} document${
          results.length > 1 ? "s" : ""
        } uploaded`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: "Could not upload documents",
        variant: "destructive",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDownload = async (doc: StoredDocument) => {
    try {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(doc.path);
      if (error || !data) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Could not download document",
        variant: "destructive",
      });
    }
  };

  const handleCreateDocument = () => {
    navigate("/app/divine-trust");
  };

  const handleCreateAffidavit = () => {
    navigate("/app/kingdom-entry");
  };

  const handleMakeDeclaration = () => {
    navigate("/app/sacred-law");
  };

  const handleFileExemption = () => {
    navigate("/app/compliance");
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleCreateAffidavit}
            >
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleMakeDeclaration}
            >
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
            <Button
              variant="outline"
              className="w-full"
              onClick={handleFileExemption}
            >
              File Exemption
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Stored Documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleUpload}
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
            {uploading && <Progress value={progress} className="w-full" />}
            <ul className="space-y-2">
              {documents.map((doc) => (
                <li
                  key={doc.path}
                  className="flex items-center justify-between border rounded-md p-2"
                >
                  <span className="truncate mr-2">{doc.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge>{doc.status}</Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(doc)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </li>
              ))}
              {documents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet.
                </p>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
