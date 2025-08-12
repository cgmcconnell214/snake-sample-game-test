import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SanitizationResult {
  success: boolean;
  originalFileName: string;
  sanitizedPath?: string;
  error?: string;
  metadata: {
    fileType: string;
    fileSize: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    isVideo: boolean;
    isImage: boolean;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const userId = formData.get("userId") as string;

    if (!file || !userId) {
      return new Response(
        JSON.stringify({ error: "File and userId are required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // File validation
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/mov",
      "video/avi",
      "application/pdf",
      "text/plain",
      "application/zip",
    ];

    if (!allowedTypes.includes(file.type)) {
      return new Response(JSON.stringify({ error: "File type not allowed" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Size validation (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 50MB" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate safe filename
    const fileExtension = file.name.split(".").pop();
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const sanitizedFileName = `${timestamp}-${randomId}.${fileExtension}`;
    const filePath = `${userId}/${sanitizedFileName}`;

    // Read file content for additional validation
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Basic magic number validation
    const isValidFile = await validateFileContent(fileBytes, file.type);
    if (!isValidFile) {
      return new Response(
        JSON.stringify({ error: "File content does not match file type" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from("post-media")
      .upload(filePath, fileBytes, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return new Response(JSON.stringify({ error: "Failed to upload file" }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Prepare metadata
    const metadata = {
      fileType: file.type,
      fileSize: file.size,
      isVideo: file.type.startsWith("video/"),
      isImage: file.type.startsWith("image/"),
    };

    // Add dimensions for images/videos (basic implementation)
    if (file.type.startsWith("image/")) {
      // In a real implementation, you'd use image processing library
      metadata.dimensions = { width: 0, height: 0 };
    }

    const result: SanitizationResult = {
      success: true,
      originalFileName: file.name,
      sanitizedPath: data.path,
      metadata,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Sanitization error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

async function validateFileContent(
  fileBytes: Uint8Array,
  mimeType: string,
): Promise<boolean> {
  const firstBytes = fileBytes.slice(0, 10);

  // Basic magic number validation
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return firstBytes[0] === 0xff && firstBytes[1] === 0xd8;
  }

  if (mimeType === "image/png") {
    return (
      firstBytes[0] === 0x89 &&
      firstBytes[1] === 0x50 &&
      firstBytes[2] === 0x4e &&
      firstBytes[3] === 0x47
    );
  }

  if (mimeType === "image/gif") {
    return (
      firstBytes[0] === 0x47 && firstBytes[1] === 0x49 && firstBytes[2] === 0x46
    );
  }

  if (mimeType === "application/pdf") {
    return (
      firstBytes[0] === 0x25 &&
      firstBytes[1] === 0x50 &&
      firstBytes[2] === 0x44 &&
      firstBytes[3] === 0x46
    );
  }

  // For video files and others, basic validation
  return true;
}
