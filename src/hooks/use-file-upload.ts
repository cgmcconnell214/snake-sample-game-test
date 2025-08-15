import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface FileUploadResult {
  name: string;
  url: string;
  size: number;
  type: string;
}

export interface UseFileUploadResult {
  uploadFiles: (
    files: File[],
    bucketName?: string,
    folderPath?: string,
  ) => Promise<FileUploadResult[]>;
  uploading: boolean;
  progress: number;
  error: string | null;
}

// File validation constants
const ALLOWED_MIME_TYPES = {
  'image/jpeg': 10 * 1024 * 1024, // 10MB
  'image/png': 10 * 1024 * 1024,  // 10MB
  'image/gif': 5 * 1024 * 1024,   // 5MB
  'image/webp': 10 * 1024 * 1024, // 10MB
  'application/pdf': 25 * 1024 * 1024, // 25MB
  'text/plain': 5 * 1024 * 1024,  // 5MB
  'application/msword': 25 * 1024 * 1024, // 25MB
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024, // 25MB
};

const validateFile = (file: File): string | null => {
  if (!ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES]) {
    return `File type ${file.type} is not allowed`;
  }
  
  const maxSize = ALLOWED_MIME_TYPES[file.type as keyof typeof ALLOWED_MIME_TYPES];
  if (file.size > maxSize) {
    return `File ${file.name} exceeds maximum size of ${Math.round(maxSize / 1024 / 1024)}MB`;
  }
  
  return null;
};

export function useFileUpload(): UseFileUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (
    files: File[],
    bucketName: string = "message-attachments",
    folderPath: string = "",
  ): Promise<FileUploadResult[]> => {
    if (!files.length) return [];

    // Validate all files first
    for (const file of files) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        throw new Error(validationError);
      }
    }

    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Create the storage bucket if it doesn't exist
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(
          (bucket) => bucket.name === bucketName,
        );

        if (!bucketExists) {
          // Create bucket silently fails if it already exists
          await supabase.storage.createBucket(bucketName, {
            public: false, // Files are not publicly accessible
          });
        }
      } catch (err) {
        console.warn("Error checking/creating bucket:", err);
        // Continue anyway as the bucket might already exist
      }

      const results: FileUploadResult[] = [];
      let completedUploads = 0;

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

        const { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          throw new Error(
            `Failed to upload ${file.name}: ${uploadError.message}`,
          );
        }

        // Check if bucket is public to determine URL method
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucket = buckets?.find(b => b.name === bucketName);
        const isPublic = bucket?.public === true;

        let fileUrl: string;
        if (isPublic) {
          // Use public URL for public buckets
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(data?.path || filePath);
          fileUrl = urlData.publicUrl;
        } else {
          // Use signed URL for private buckets (expires in 1 hour)
          const { data: urlData, error: urlError } = await supabase.storage
            .from(bucketName)
            .createSignedUrl(data?.path || filePath, 3600);
          
          if (urlError) {
            throw new Error(`Failed to generate signed URL: ${urlError.message}`);
          }
          fileUrl = urlData?.signedUrl || '';
        }

        completedUploads++;
        setProgress(Math.floor((completedUploads / files.length) * 100));

        return {
          name: file.name,
          url: fileUrl,
          size: file.size,
          type: file.type,
        };
      });

      // Process all uploads concurrently
      const uploadResults = await Promise.all(uploadPromises);
      results.push(...uploadResults);

      return results;
    } catch (err: unknown) {
      console.error("Upload error:", err);
      const error = err as Error;
      setError(error.message || "Failed to upload files");
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadFiles,
    uploading,
    progress,
    error,
  };
}
