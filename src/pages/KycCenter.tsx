import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  UserCheck,
  Upload,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const KycCenter = (): JSX.Element => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{
    idFront?: File;
    idBack?: File;
    proofAddress?: File;
  }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    idFront?: number;
    idBack?: number;
    proofAddress?: number;
  }>({});

  const validateFile = (file: File): boolean => {
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      toast({
        title: "Unsupported file type",
        description: "Please upload a JPG, PNG, or PDF file",
        variant: "destructive",
      });
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "Please upload files smaller than 5MB",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleFileUpload = (
    fileType: "idFront" | "idBack" | "proofAddress",
    file: File,
  ) => {
    if (!validateFile(file)) return;
    setUploadedFiles((prev) => ({
      ...prev,
      [fileType]: file,
    }));
    toast({
      title: "File Selected",
      description: `${file.name} selected for upload`,
    });
  };

  const removeFile = (fileType: "idFront" | "idBack" | "proofAddress") => {
    setUploadedFiles((prev) => {
      const newFiles = { ...prev };
      delete newFiles[fileType];
      return newFiles;
    });
  };

  const handleDocumentUpload = async () => {
    const { idFront, idBack, proofAddress } = uploadedFiles;

    if (!idFront || !idBack || !proofAddress) {
      toast({
        title: "Missing Documents",
        description: "Please upload all required documents before submitting",
        variant: "destructive",
      });
      return;
    }

    const files = [idFront, idBack, proofAddress];
    for (const file of files) {
      if (!validateFile(file)) {
        return;
      }
    }

    setIsSubmitting(true);
    setUploadProgress({ idFront: 0, idBack: 0, proofAddress: 0 });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const uploadFile = (path: string, file: File) =>
        supabase.storage.from("kyc-documents").upload(path, file);

      // Upload files to Supabase Storage
      const uploads = await Promise.all([
        uploadFile(
          `${user.id}/id-front-${Date.now()}.${idFront.name.split(".").pop()}`,
          idFront,
        ),
        uploadFile(
          `${user.id}/id-back-${Date.now()}.${idBack.name.split(".").pop()}`,
          idBack,
        ),
        uploadFile(
          `${user.id}/proof-address-${Date.now()}.${proofAddress.name
            .split(".")
            .pop()}`,
          proofAddress,
        ),
      ]);

      const errors = uploads.filter((upload) => upload.error);
      if (errors.length > 0) {
        throw new Error("Failed to upload some documents");
      }

      // Update profile with submitted documents status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          kyc_status: "pending",
          kyc_submitted_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw updateError;
      }

      toast({
        title: "Documents Submitted Successfully",
        description:
          "Your KYC documents have been uploaded and are under review",
      });

      // Clear uploaded files
      setUploadedFiles({});
      setUploadProgress({});
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description:
          "There was an error uploading your documents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setUploadProgress({});
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <UserCheck className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "pending":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">KYC Verification Center</h1>
        <Badge
          variant={getStatusColor(profile?.kyc_status)}
          className="text-sm"
        >
          {getStatusIcon(profile?.kyc_status)}
          <span className="ml-2">{profile?.kyc_status?.toUpperCase()}</span>
        </Badge>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5" />
            <span>Verification Status</span>
          </CardTitle>
          <CardDescription>
            Complete your KYC verification to access all platform features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Identity Verification</h3>
                <p className="text-sm text-muted-foreground">
                  Government-issued ID verification
                </p>
              </div>
              <Badge variant={getStatusColor(profile?.kyc_status)}>
                {profile?.kyc_status?.toUpperCase()}
              </Badge>
            </div>

            {profile?.kyc_status === "pending" && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800">Under Review</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Your documents are being reviewed. This process typically
                  takes 1-3 business days.
                </p>
              </div>
            )}

            {profile?.kyc_status === "approved" && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <h4 className="font-medium text-emerald-800">
                  Verification Complete
                </h4>
                <p className="text-sm text-emerald-700 mt-1">
                  Your identity has been successfully verified. You now have
                  full access to all platform features.
                </p>
              </div>
            )}

            {profile?.kyc_status === "rejected" && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="font-medium text-red-800">Verification Failed</h4>
                <p className="text-sm text-red-700 mt-1">
                  Your verification was unsuccessful. Please resubmit your
                  documents with the required information.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Document Upload */}
      {profile?.kyc_status !== "approved" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5" />
              <span>Document Upload</span>
            </CardTitle>
            <CardDescription>
              Upload required documents for identity verification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Label htmlFor="id-front">Government ID (Front)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {uploadedFiles.idFront ? (
                    <div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">
                          {uploadedFiles.idFront.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("idFront")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {typeof uploadProgress.idFront === "number" && (
                        <Progress
                          value={uploadProgress.idFront}
                          className="mt-2"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <Input
                        id="id-front"
                        type="file"
                        accept="image/*,.pdf"
                        className="mt-2"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("idFront", file);
                        }}
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <Label htmlFor="id-back">Government ID (Back)</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                  {uploadedFiles.idBack ? (
                    <div>
                      <div className="flex items-center justify-between p-2 bg-muted rounded">
                        <span className="text-sm">
                          {uploadedFiles.idBack.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile("idBack")}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {typeof uploadProgress.idBack === "number" && (
                        <Progress
                          value={uploadProgress.idBack}
                          className="mt-2"
                        />
                      )}
                    </div>
                  ) : (
                    <>
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Click to upload or drag and drop
                      </p>
                      <Input
                        id="id-back"
                        type="file"
                        accept="image/*,.pdf"
                        className="mt-2"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload("idBack", file);
                        }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <Label htmlFor="proof-address">Proof of Address</Label>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                {uploadedFiles.proofAddress ? (
                  <div>
                    <div className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm">
                        {uploadedFiles.proofAddress.name}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile("proofAddress")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    {typeof uploadProgress.proofAddress === "number" && (
                      <Progress
                        value={uploadProgress.proofAddress}
                        className="mt-2"
                      />
                    )}
                  </div>
                ) : (
                  <>
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      Utility bill, bank statement, or lease agreement (less
                      than 3 months old)
                    </p>
                    <Input
                      id="proof-address"
                      type="file"
                      accept="image/*,.pdf"
                      className="mt-2"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileUpload("proofAddress", file);
                      }}
                    />
                  </>
                )}
              </div>
            </div>

            <Button
              onClick={handleDocumentUpload}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? "Submitting..." : "Submit Documents"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Requirements</CardTitle>
          <CardDescription>
            Ensure your documents meet these requirements for faster processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Document Quality</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• High resolution (minimum 300 DPI)</li>
                <li>• Clear and readable text</li>
                <li>• No glare or shadows</li>
                <li>• All corners visible</li>
                <li>• Color documents preferred</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3">Accepted Documents</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Driver's License</li>
                <li>• Passport</li>
                <li>• National ID Card</li>
                <li>• State ID</li>
                <li>• Resident Permit</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycCenter;
