import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Download,
  Eye,
  X,
  Image as ImageIcon,
  File,
  Video,
  Music,
} from "lucide-react";

interface Attachment {
  name: string;
  url?: string;
  type?: string;
  size?: number;
}

interface AttachmentViewerProps {
  attachments: Attachment[];
}

const AttachmentViewer: React.FC<AttachmentViewerProps> = ({ attachments }) => {
  const [selectedAttachment, setSelectedAttachment] =
    useState<Attachment | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const getFileIcon = (fileName: string, type?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const fileType = type?.toLowerCase();

    if (
      fileType?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension || "")
    ) {
      return <ImageIcon className="h-4 w-4 text-blue-500" />;
    }
    if (
      fileType?.startsWith("video/") ||
      ["mp4", "avi", "mov", "mkv"].includes(extension || "")
    ) {
      return <Video className="h-4 w-4 text-purple-500" />;
    }
    if (
      fileType?.startsWith("audio/") ||
      ["mp3", "wav", "ogg", "flac"].includes(extension || "")
    ) {
      return <Music className="h-4 w-4 text-green-500" />;
    }
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const isPreviewable = (fileName: string, type?: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    const fileType = type?.toLowerCase();

    return (
      fileType?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "") ||
      fileType === "application/pdf" ||
      fileType?.startsWith("text/")
    );
  };

  const openPreview = (attachment: Attachment) => {
    setSelectedAttachment(attachment);
    setPreviewOpen(true);
  };

  const downloadAttachment = (attachment: Attachment) => {
    if (attachment.url) {
      try {
        // For files that need to be fetched first (like from Supabase Storage)
        fetch(attachment.url)
          .then((response) => response.blob())
          .then((blob) => {
            const blobUrl = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = blobUrl;
            a.download = attachment.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl); // Clean up
          })
          .catch((error) => {
            console.error("Download error:", error);
          });
      } catch (error) {
        console.error("Error downloading attachment:", error);
      }
    }
  };

  if (!attachments || attachments.length === 0) {
    return null;
  }

  return (
    <>
      <div>
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <File className="h-4 w-4" />
          Attachments ({attachments.length})
        </h4>
        <div className="space-y-2">
          {attachments.map((attachment, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border hover:bg-muted/70 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(attachment.name, attachment.type)}
                <div className="flex-1 min-w-0">
                  <div
                    className="font-medium text-sm truncate"
                    title={attachment.name}
                  >
                    {attachment.name}
                  </div>
                  {attachment.size && (
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(attachment.size)}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-1">
                {isPreviewable(attachment.name, attachment.type) &&
                  attachment.url && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openPreview(attachment)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => downloadAttachment(attachment)}
                  disabled={!attachment.url}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="truncate">{selectedAttachment?.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 max-h-[70vh] overflow-auto">
            {selectedAttachment && (
              <div className="flex items-center justify-center">
                {selectedAttachment.type?.startsWith("image/") ? (
                  <img
                    src={selectedAttachment.url}
                    alt={selectedAttachment.name}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain rounded"
                  />
                ) : selectedAttachment.type === "application/pdf" ? (
                  <embed
                    src={selectedAttachment.url}
                    type="application/pdf"
                    width="100%"
                    height="600px"
                    className="rounded"
                  />
                ) : selectedAttachment.type?.startsWith("text/") ? (
                  <iframe
                    src={selectedAttachment.url}
                    width="100%"
                    height="600px"
                    className="rounded border"
                    title={selectedAttachment.name}
                  />
                ) : (
                  <div className="text-center py-8">
                    <File className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      Preview not available for this file type
                    </p>
                    <Button
                      onClick={() => downloadAttachment(selectedAttachment)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download File
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AttachmentViewer;
