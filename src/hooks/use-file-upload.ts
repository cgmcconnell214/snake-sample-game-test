import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
    folderPath?: string
  ) => Promise<FileUploadResult[]>
  uploading: boolean
  progress: number
  error: string | null
}

export function useFileUpload(): UseFileUploadResult {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFiles = async (
    files: File[],
    bucketName: string = 'message-attachments',
    folderPath: string = ''
  ): Promise<FileUploadResult[]> => {
    if (!files.length) return [];
    
    setUploading(true);
    setProgress(0);
    setError(null);
    
    try {
      // Create the storage bucket if it doesn't exist
      try {
        // Check if bucket exists
        const { data: buckets } = await supabase.storage.listBuckets();
        const bucketExists = buckets?.some(bucket => bucket.name === bucketName);
        
        if (!bucketExists) {
          // Create bucket silently fails if it already exists
          await supabase.storage.createBucket(bucketName, {
            public: false, // Files are not publicly accessible
          });
        }
      } catch (err) {
        console.warn('Error checking/creating bucket:', err);
        // Continue anyway as the bucket might already exist
      }

      const results: FileUploadResult[] = [];
      let completedUploads = 0;

      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = folderPath ? `${folderPath}/${fileName}` : fileName;

        const { data, error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw new Error(`Failed to upload ${file.name}: ${uploadError.message}`);
        }

        // Get the URL for the uploaded file
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(data?.path || filePath);

        completedUploads++;
        setProgress(Math.floor((completedUploads / files.length) * 100));

        return {
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          type: file.type,
        };
      });

      // Process all uploads concurrently
      const uploadResults = await Promise.all(uploadPromises);
      results.push(...uploadResults);

      return results;
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload files');
      throw err;
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