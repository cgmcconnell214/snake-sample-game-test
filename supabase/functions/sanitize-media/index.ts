import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { authorizeUser, AuthorizationError, createAuthorizationErrorResponse } from "../_shared/authorization.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

interface SanitizationResult {
  success: boolean;
  originalFileName: string;
  sanitizedPath?: string;
  error?: string;
  securityChecks: {
    magicNumberValid: boolean;
    malwareScanPassed: boolean;
    mimeTypeMatches: boolean;
    suspiciousContent: boolean;
  };
  metadata: {
    fileType: string;
    fileSize: number;
    dimensions?: { width: number; height: number };
    duration?: number;
    isVideo: boolean;
    isImage: boolean;
    hash: string;
  };
}

// Comprehensive magic number signatures for security validation
const FILE_SIGNATURES = {
  // Images
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF], // JPEG/JFIF
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG with JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG with EXIF
  ],
  'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]], // PNG
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
  ],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP container)
  'image/bmp': [[0x42, 0x4D]], // BMP
  'image/tiff': [
    [0x49, 0x49, 0x2A, 0x00], // TIFF (little endian)
    [0x4D, 0x4D, 0x00, 0x2A], // TIFF (big endian)
  ],
  
  // Videos
  'video/mp4': [
    [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4 ftyp
    [0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70], // MP4 ftyp variant
  ],
  'video/webm': [[0x1A, 0x45, 0xDF, 0xA3]], // WebM (EBML)
  'video/avi': [[0x52, 0x49, 0x46, 0x46]], // AVI (RIFF)
  'video/mov': [
    [0x00, 0x00, 0x00, 0x14, 0x66, 0x74, 0x79, 0x70, 0x71, 0x74], // QuickTime
  ],
  'video/mkv': [[0x1A, 0x45, 0xDF, 0xA3]], // Matroska
  
  // Documents
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // PDF
  'text/plain': [], // Plain text has no magic number
  
  // Archives
  'application/zip': [
    [0x50, 0x4B, 0x03, 0x04], // ZIP
    [0x50, 0x4B, 0x05, 0x06], // ZIP (empty)
    [0x50, 0x4B, 0x07, 0x08], // ZIP (spanned)
  ],
  'application/x-rar-compressed': [[0x52, 0x61, 0x72, 0x21, 0x1A, 0x07]], // RAR
  'application/x-7z-compressed': [[0x37, 0x7A, 0xBC, 0xAF, 0x27, 0x1C]], // 7-Zip
  
  // Office documents
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4B, 0x03, 0x04], // DOCX (ZIP-based)
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4B, 0x03, 0x04], // XLSX (ZIP-based)
  ],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': [
    [0x50, 0x4B, 0x03, 0x04], // PPTX (ZIP-based)
  ],
  
  // Audio
  'audio/mpeg': [
    [0xFF, 0xFB], // MP3 frame sync
    [0xFF, 0xF3], // MP3 frame sync variant
    [0xFF, 0xF2], // MP3 frame sync variant
    [0x49, 0x44, 0x33], // MP3 with ID3 tag
  ],
  'audio/wav': [[0x52, 0x49, 0x46, 0x46]], // WAV (RIFF)
  'audio/ogg': [[0x4F, 0x67, 0x67, 0x53]], // OGG
  
  // Executables (should be blocked)
  'application/x-msdownload': [
    [0x4D, 0x5A], // PE executable
  ],
  'application/x-executable': [
    [0x7F, 0x45, 0x4C, 0x46], // ELF executable
  ],
  'application/x-mach-binary': [
    [0xFE, 0xED, 0xFA, 0xCE], // Mach-O binary (32-bit)
    [0xFE, 0xED, 0xFA, 0xCF], // Mach-O binary (64-bit)
  ],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Authorize user
    const authHeader = req.headers.get("Authorization");
    const { user, profile } = await authorizeUser(supabase, authHeader, {
      requiredTier: "standard" // Media sanitization requires standard subscription
    });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: "File is required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Expanded allowed types with strict validation
    const allowedTypes = [
      "image/jpeg",
      "image/png", 
      "image/gif",
      "image/webp",
      "image/bmp",
      "video/mp4",
      "video/webm",
      "video/mov", 
      "video/avi",
      "video/mkv",
      "application/pdf",
      "text/plain",
      "application/zip",
      "audio/mpeg",
      "audio/wav",
      "audio/ogg",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // DOCX
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // XLSX
      "application/vnd.openxmlformats-officedocument.presentationml.presentation", // PPTX
    ];

    // Blocked dangerous types (executables, scripts, etc.)
    const blockedTypes = [
      "application/x-msdownload",
      "application/x-executable", 
      "application/x-mach-binary",
      "application/x-dosexec",
      "application/x-shellscript",
      "text/x-shellscript",
      "application/javascript",
      "text/javascript",
      "application/x-javascript",
      "text/x-javascript",
      "application/vnd.microsoft.portable-executable",
    ];

    if (blockedTypes.includes(file.type)) {
      // Log security incident
      await logSecurityEvent(supabase, user.id, "blocked_dangerous_file", {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        reason: "dangerous_file_type"
      });
      
      return new Response(JSON.stringify({ 
        error: "File type blocked for security reasons",
        code: "DANGEROUS_FILE_TYPE"
      }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    if (!allowedTypes.includes(file.type)) {
      await logSecurityEvent(supabase, user.id, "unsupported_file_type", {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size
      });
      
      return new Response(JSON.stringify({ 
        error: "File type not allowed",
        code: "UNSUPPORTED_FILE_TYPE"
      }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Enhanced size validation with tier-based limits
    const tierLimits = {
      free: 10 * 1024 * 1024, // 10MB
      standard: 50 * 1024 * 1024, // 50MB  
      enterprise: 200 * 1024 * 1024, // 200MB
    };
    
    const maxSize = tierLimits[profile.subscription_tier as keyof typeof tierLimits] || tierLimits.free;
    
    if (file.size > maxSize) {
      await logSecurityEvent(supabase, user.id, "file_size_exceeded", {
        fileName: file.name,
        fileSize: file.size,
        maxAllowed: maxSize,
        userTier: profile.subscription_tier
      });
      
      return new Response(
        JSON.stringify({ 
          error: `File too large. Maximum size for ${profile.subscription_tier} tier is ${Math.round(maxSize / 1024 / 1024)}MB`,
          code: "FILE_TOO_LARGE"
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Generate safe filename with cryptographic randomness
    const fileExtension = file.name.split(".").pop()?.toLowerCase();
    const timestamp = Date.now();
    const randomId = crypto.randomUUID().slice(0, 8);
    const sanitizedFileName = `${timestamp}-${randomId}.${fileExtension}`;
    const filePath = `${user.id}/${sanitizedFileName}`;

    // Read file content for comprehensive security validation
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    
    // Calculate file hash for deduplication and integrity
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Comprehensive security checks
    const securityChecks = await performSecurityChecks(fileBytes, file.type, file.name, hash);
    
    if (!securityChecks.passed) {
      await logSecurityEvent(supabase, user.id, "security_check_failed", {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        hash,
        checks: securityChecks.details,
        reason: securityChecks.reason
      });
      
      return new Response(
        JSON.stringify({ 
          error: securityChecks.reason,
          code: "SECURITY_CHECK_FAILED",
          details: securityChecks.details
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Upload to Supabase Storage with enhanced metadata
    const { data, error } = await supabase.storage
      .from("post-media")
      .upload(filePath, fileBytes, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
        metadata: {
          originalName: file.name,
          uploadedBy: user.id,
          securityHash: hash,
          securityChecks: JSON.stringify(securityChecks.details),
          scanTimestamp: new Date().toISOString(),
        },
      });

    if (error) {
      console.error("Upload error:", error);
      await logSecurityEvent(supabase, user.id, "upload_failed", {
        fileName: file.name,
        error: error.message,
        filePath
      });
      
      return new Response(JSON.stringify({ 
        error: "Failed to upload file",
        code: "UPLOAD_FAILED"
      }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // Enhanced metadata extraction
    const metadata = {
      fileType: file.type,
      fileSize: file.size,
      isVideo: file.type.startsWith("video/"),
      isImage: file.type.startsWith("image/"),
      hash,
      uploadTimestamp: new Date().toISOString(),
      userAgent: req.headers.get("user-agent") || "unknown",
    };

    // Add dimensions for images/videos (enhanced implementation)
    if (file.type.startsWith("image/")) {
      metadata.dimensions = await extractImageDimensions(fileBytes, file.type);
    } else if (file.type.startsWith("video/")) {
      metadata.duration = await extractVideoDuration(fileBytes, file.type);
    }

    // Log successful upload for audit trail
    await logSecurityEvent(supabase, user.id, "file_upload_success", {
      fileName: file.name,
      sanitizedPath: data.path,
      fileSize: file.size,
      mimeType: file.type,
      hash
    });

    const result: SanitizationResult = {
      success: true,
      originalFileName: file.name,
      sanitizedPath: data.path,
      securityChecks: securityChecks.details,
      metadata,
    };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return createAuthorizationErrorResponse(error, corsHeaders);
    }
    
    console.error("Sanitization error:", error);
    return new Response(JSON.stringify({ 
      error: "Internal server error",
      code: "INTERNAL_ERROR"
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/**
 * Comprehensive security checks including malware scanning and magic number validation
 */
async function performSecurityChecks(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
  hash: string
): Promise<{
  passed: boolean;
  details: {
    magicNumberValid: boolean;
    malwareScanPassed: boolean;
    mimeTypeMatches: boolean;
    suspiciousContent: boolean;
  };
  reason?: string;
}> {
  const details = {
    magicNumberValid: false,
    malwareScanPassed: false,
    mimeTypeMatches: false,
    suspiciousContent: false,
  };

  try {
    // 1. Magic number validation for all supported formats
    details.magicNumberValid = validateMagicNumber(fileBytes, mimeType);
    details.mimeTypeMatches = details.magicNumberValid;

    // 2. Enhanced malware scanning
    details.malwareScanPassed = await performMalwareScan(fileBytes, fileName, hash);

    // 3. Content analysis for suspicious patterns
    details.suspiciousContent = await detectSuspiciousContent(fileBytes, mimeType, fileName);

    const passed = details.magicNumberValid && 
                  details.malwareScanPassed && 
                  !details.suspiciousContent;

    let reason = "";
    if (!details.magicNumberValid) {
      reason = "File content does not match declared MIME type";
    } else if (!details.malwareScanPassed) {
      reason = "File failed malware scan";  
    } else if (details.suspiciousContent) {
      reason = "File contains suspicious content patterns";
    }

    return { passed, details, reason: reason || undefined };
  } catch (error) {
    console.error("Security check error:", error);
    return {
      passed: false,
      details,
      reason: "Security validation failed"
    };
  }
}

/**
 * Enhanced magic number validation for comprehensive file type checking
 */
function validateMagicNumber(fileBytes: Uint8Array, mimeType: string): boolean {
  const signatures = FILE_SIGNATURES[mimeType as keyof typeof FILE_SIGNATURES];
  
  if (!signatures) {
    // For text files, allow if no signatures defined
    return mimeType === 'text/plain';
  }

  if (signatures.length === 0) {
    return true; // Text files have no magic number
  }

  // Check if file matches any of the valid signatures for this MIME type
  return signatures.some(signature => {
    if (fileBytes.length < signature.length) return false;
    
    return signature.every((byte, index) => fileBytes[index] === byte);
  });
}

/**
 * Advanced malware scanning using multiple detection methods
 */
async function performMalwareScan(
  fileBytes: Uint8Array,
  fileName: string,
  hash: string
): Promise<boolean> {
  try {
    // 1. Known malware hash blacklist check
    const knownMalwareHashes = [
      // Add known malware hashes here - these would typically come from threat intel feeds
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", // Example hash
    ];

    if (knownMalwareHashes.includes(hash)) {
      console.warn(`Blocked known malware hash: ${hash}`);
      return false;
    }

    // 2. Suspicious filename patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.scr$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.class$/i,
      /\.dmg$/i,
      /\.pkg$/i,
      /\.deb$/i,
      /\.rpm$/i,
      /\.(sh|bash|zsh|fish)$/i,
      /\.ps1$/i,
      /\.msi$/i,
      /\.dll$/i,
      /\.so$/i,
      /\.dylib$/i,
    ];

    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
      console.warn(`Blocked suspicious filename: ${fileName}`);
      return false;
    }

    // 3. Embedded executable detection (PE headers in non-executable files)
    if (containsEmbeddedExecutable(fileBytes)) {
      console.warn(`Detected embedded executable in file: ${fileName}`);
      return false;
    }

    // 4. Polyglot file detection (files that are valid in multiple formats)
    if (isPolyglotFile(fileBytes)) {
      console.warn(`Detected polyglot file: ${fileName}`);
      return false;
    }

    // 5. Archive bomb detection for compressed files
    if (fileName.match(/\.(zip|rar|7z|tar|gz)$/i)) {
      if (await isArchiveBomb(fileBytes)) {
        console.warn(`Detected archive bomb: ${fileName}`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error("Malware scan error:", error);
    return false; // Fail secure
  }
}

/**
 * Detect suspicious content patterns in file data
 */
async function detectSuspiciousContent(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string
): Promise<boolean> {
  try {
    // Convert to string for text analysis
    const textContent = new TextDecoder('utf-8', { fatal: false }).decode(fileBytes.slice(0, 8192));

    // Suspicious script patterns
    const suspiciousScriptPatterns = [
      /<script[^>]*>/i,
      /javascript:/i,
      /vbscript:/i,
      /on\w+\s*=/i, // onclick, onload, etc.
      /eval\s*\(/i,
      /document\.write/i,
      /innerHTML/i,
      /setTimeout\s*\(/i,
      /setInterval\s*\(/i,
      /XMLHttpRequest/i,
      /fetch\s*\(/i,
      /window\.location/i,
      /document\.location/i,
    ];

    // Check for script injection in non-script files
    if (!mimeType.includes('javascript') && !mimeType.includes('html')) {
      if (suspiciousScriptPatterns.some(pattern => pattern.test(textContent))) {
        return true;
      }
    }

    // SQL injection patterns
    const sqlPatterns = [
      /union\s+select/i,
      /drop\s+table/i,
      /delete\s+from/i,
      /insert\s+into/i,
      /update\s+set/i,
      /exec\s*\(/i,
      /sp_executesql/i,
    ];

    if (sqlPatterns.some(pattern => pattern.test(textContent))) {
      return true;
    }

    // Command injection patterns
    const commandPatterns = [
      /;\s*(rm|del|format|fdisk)/i,
      /\|\s*(nc|netcat|bash|sh|cmd)/i,
      /`[^`]*`/, // Backtick command substitution
      /\$\([^)]*\)/, // Command substitution
    ];

    if (commandPatterns.some(pattern => pattern.test(textContent))) {
      return true;
    }

    // Check for excessive entropy (possible encrypted/packed malware)
    if (calculateEntropy(fileBytes.slice(0, 4096)) > 7.5) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Suspicious content detection error:", error);
    return false;
  }
}

/**
 * Detect embedded executables in non-executable files
 */
function containsEmbeddedExecutable(fileBytes: Uint8Array): boolean {
  // Look for PE header signature "MZ" followed by PE signature
  for (let i = 0; i < fileBytes.length - 64; i++) {
    if (fileBytes[i] === 0x4D && fileBytes[i + 1] === 0x5A) {
      // Found MZ header, check for PE signature
      const peOffset = fileBytes[i + 60] | (fileBytes[i + 61] << 8) | 
                     (fileBytes[i + 62] << 16) | (fileBytes[i + 63] << 24);
      
      if (i + peOffset + 4 < fileBytes.length) {
        if (fileBytes[i + peOffset] === 0x50 && fileBytes[i + peOffset + 1] === 0x45 &&
            fileBytes[i + peOffset + 2] === 0x00 && fileBytes[i + peOffset + 3] === 0x00) {
          return true;
        }
      }
    }
  }
  
  // Look for ELF headers
  for (let i = 0; i < fileBytes.length - 4; i++) {
    if (fileBytes[i] === 0x7F && fileBytes[i + 1] === 0x45 && 
        fileBytes[i + 2] === 0x4C && fileBytes[i + 3] === 0x46) {
      return true;
    }
  }
  
  return false;
}

/**
 * Detect polyglot files (valid in multiple formats)
 */
function isPolyglotFile(fileBytes: Uint8Array): boolean {
  let validFormats = 0;
  
  // Check how many different file formats this file could be valid as
  for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
    if (signatures.length > 0) {
      if (signatures.some(signature => {
        if (fileBytes.length < signature.length) return false;
        return signature.every((byte, index) => fileBytes[index] === byte);
      })) {
        validFormats++;
      }
    }
  }
  
  // If valid as multiple binary formats, it's suspicious
  return validFormats > 1;
}

/**
 * Detect archive bombs (zip bombs, etc.)
 */
async function isArchiveBomb(fileBytes: Uint8Array): Promise<boolean> {
  // Basic heuristic: if file is very small but claims to be an archive,
  // it might be a zip bomb
  if (fileBytes.length < 1024 && fileBytes.length > 0) {
    // Check for ZIP signature with suspicious characteristics
    if (fileBytes[0] === 0x50 && fileBytes[1] === 0x4B) {
      // Very small ZIP file is suspicious
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate Shannon entropy to detect encrypted/packed content
 */
function calculateEntropy(data: Uint8Array): number {
  const frequency = new Array(256).fill(0);
  
  for (const byte of data) {
    frequency[byte]++;
  }
  
  let entropy = 0;
  const length = data.length;
  
  for (const freq of frequency) {
    if (freq > 0) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

/**
 * Extract image dimensions (placeholder - would use image processing library)
 */
async function extractImageDimensions(
  fileBytes: Uint8Array,
  mimeType: string
): Promise<{ width: number; height: number } | undefined> {
  // This is a placeholder implementation
  // In production, you'd use a proper image processing library
  try {
    if (mimeType === 'image/png' && fileBytes.length > 24) {
      // PNG width/height are at bytes 16-23
      const width = (fileBytes[16] << 24) | (fileBytes[17] << 16) | 
                   (fileBytes[18] << 8) | fileBytes[19];
      const height = (fileBytes[20] << 24) | (fileBytes[21] << 16) | 
                    (fileBytes[22] << 8) | fileBytes[23];
      return { width, height };
    }
    // Add other format parsers as needed
    return { width: 0, height: 0 };
  } catch {
    return undefined;
  }
}

/**
 * Extract video duration (placeholder)
 */
async function extractVideoDuration(
  fileBytes: Uint8Array,
  mimeType: string
): Promise<number | undefined> {
  // Placeholder implementation
  // In production, you'd use a video processing library
  return 0;
}

/**
 * Log security events for audit and monitoring
 */
async function logSecurityEvent(
  supabase: any,
  userId: string,
  eventType: string,
  eventData: any
): Promise<void> {
  try {
    await supabase.from("security_events").insert({
      user_id: userId,
      event_type: `file_sanitization_${eventType}`,
      event_data: eventData,
      risk_score: eventType.includes('failed') || eventType.includes('blocked') ? 7 : 2,
    });
  } catch (error) {
    console.error("Failed to log security event:", error);
  }
}
