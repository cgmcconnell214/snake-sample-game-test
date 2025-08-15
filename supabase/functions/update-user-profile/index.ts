import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { z } from "https://esm.sh/zod@3.22.4";
import { rateLimit } from "../_shared/rateLimit.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { encryptSecret } from "../_shared/encryption.ts";
import { getErrorResponse } from "../_shared/error.ts";

const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "*";
const corsHeaders = getCorsHeaders([allowedOrigin]);

// HTML sanitization function to prevent XSS
function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  
  // Remove script tags, event handlers, and other dangerous content
  return input
    .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
    .replace(/<iframe[^>]*>.*?<\/iframe>/gis, '') // Remove iframe tags
    .replace(/<object[^>]*>.*?<\/object>/gis, '') // Remove object tags
    .replace(/<embed[^>]*>/gi, '') // Remove embed tags
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '') // Remove event handlers
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/data:text\/html/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, '') // Remove vbscript: protocol
    .replace(/<link[^>]*>/gi, '') // Remove link tags
    .replace(/<meta[^>]*>/gi, '') // Remove meta tags
    .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
    .trim();
}

// Zod schemas for validation
const ProfileUpdateSchema = z.object({
  first_name: z.string().min(1).max(50).optional(),
  last_name: z.string().min(1).max(50).optional(),
  display_name: z.string().min(1).max(100).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().max(200).optional().or(z.literal('')),
  avatar_url: z.string().url().max(500).optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  company: z.string().max(100).optional(),
  job_title: z.string().max(100).optional(),
  social_links: z.record(z.string().url().max(200)).optional(),
  preferences: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
}).strict(); // strict() prevents extra keys

const MfaDataSchema = z.object({
  enabled: z.boolean(),
  totp_secret: z.string().optional(),
  backup_codes: z.array(z.string()).optional(),
}).strict();

const RequestBodySchema = z.object({
  profile: ProfileUpdateSchema.optional(),
  mfaData: MfaDataSchema.optional(),
  mfaCode: z.string().optional(),
  password: z.string().optional(),
}).strict();

// Validate and sanitize profile data
function validateAndSanitizeProfile(profileData: any) {
  // First validate the structure
  const validationResult = ProfileUpdateSchema.safeParse(profileData);
  
  if (!validationResult.success) {
    throw new Error(`Invalid profile data: ${validationResult.error.message}`);
  }
  
  const sanitized = { ...validationResult.data };
  
  // Sanitize string fields that could contain HTML
  if (sanitized.first_name) sanitized.first_name = sanitizeHtml(sanitized.first_name);
  if (sanitized.last_name) sanitized.last_name = sanitizeHtml(sanitized.last_name);
  if (sanitized.display_name) sanitized.display_name = sanitizeHtml(sanitized.display_name);
  if (sanitized.bio) sanitized.bio = sanitizeHtml(sanitized.bio);
  if (sanitized.location) sanitized.location = sanitizeHtml(sanitized.location);
  if (sanitized.company) sanitized.company = sanitizeHtml(sanitized.company);
  if (sanitized.job_title) sanitized.job_title = sanitizeHtml(sanitized.job_title);
  
  // Validate URLs are not malicious
  if (sanitized.website && sanitized.website !== '') {
    const websiteUrl = new URL(sanitized.website);
    if (!['http:', 'https:'].includes(websiteUrl.protocol)) {
      throw new Error('Website URL must use HTTP or HTTPS protocol');
    }
  }
  
  if (sanitized.avatar_url && sanitized.avatar_url !== '') {
    const avatarUrl = new URL(sanitized.avatar_url);
    if (!['http:', 'https:'].includes(avatarUrl.protocol)) {
      throw new Error('Avatar URL must use HTTP or HTTPS protocol');
    }
  }
  
  // Sanitize social links
  if (sanitized.social_links) {
    for (const [platform, url] of Object.entries(sanitized.social_links)) {
      if (typeof url === 'string') {
        const socialUrl = new URL(url);
        if (!['http:', 'https:'].includes(socialUrl.protocol)) {
          throw new Error(`Social link for ${platform} must use HTTP or HTTPS protocol`);
        }
      }
    }
  }
  
  return sanitized;
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Decode(str: string): Uint8Array {
  const cleaned = str.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const val = ALPHABET.indexOf(char);
    if (val < 0) throw new Error("Invalid base32");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) bytes.push(parseInt(byte, 2));
  }
  return new Uint8Array(bytes);
}

async function generateToken(
  secret: string,
  counter: number,
  digits = 6,
): Promise<string> {
  const keyBytes = base32Decode(secret);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const buffer = new ArrayBuffer(8);
  const view = new DataView(buffer);
  view.setUint32(4, counter);
  const hmac = new Uint8Array(
    await crypto.subtle.sign("HMAC", cryptoKey, buffer),
  );
  const offset = hmac[hmac.length - 1] & 0xf;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  const otp = binary % 10 ** digits;
  return otp.toString().padStart(digits, "0");
}

async function verifyToken(
  secret: string,
  token: string,
  window = 1,
  step = 30,
  digits = 6,
): Promise<boolean> {
  const counter = Math.floor(Date.now() / 1000 / step);
  for (let errorWin = -window; errorWin <= window; errorWin++) {
    const valid = await generateToken(secret, counter + errorWin, digits);
    if (token === valid) return true;
  }
  return false;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const rateLimitResponse = await rateLimit(req);
  if (rateLimitResponse) return rateLimitResponse;

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const requestBody = await req.json();
    
    // Validate entire request body structure first
    const bodyValidation = RequestBodySchema.safeParse(requestBody);
    if (!bodyValidation.success) {
      console.error('Request validation failed:', bodyValidation.error);
      return getErrorResponse(
        'VALIDATION_ERROR',
        'update-user-profile',
        req,
        corsHeaders,
        { additionalContext: { validationErrors: bodyValidation.error.errors } }
      );
    }
    
    const { profile: profileData, mfaData, mfaCode, password } = bodyValidation.data;
    
    // Additional security check: reject requests with any unexpected properties
    const allowedKeys = ['profile', 'mfaData', 'mfaCode', 'password'];
    const extraKeys = Object.keys(requestBody).filter(key => !allowedKeys.includes(key));
    if (extraKeys.length > 0) {
      console.error('Request contains unexpected keys:', extraKeys);
      return getErrorResponse(
        'SECURITY_VIOLATION',
        'update-user-profile',
        req,
        corsHeaders,
        { additionalContext: { unauthorizedFields: extraKeys } }
      );
    }

    if (profileData?.user_id && profileData.user_id !== user.id) {
      return getErrorResponse(
        'INSUFFICIENT_PERMISSIONS',
        'update-user-profile',
        req,
        corsHeaders,
        { userId: user.id, additionalContext: { attemptedUserId: profileData.user_id } }
      );
    }

    // Handle MFA data if provided
    if (mfaData) {
      try {
        if (mfaData.enabled === false) {
          // Disable 2FA - remove MFA data
          const { error: deleteMfaError } = await supabaseClient
            .from("user_mfa")
            .delete()
            .eq("user_id", user.id);
          
          if (deleteMfaError) {
            console.error("Error deleting MFA data:", deleteMfaError);
            throw new Error("Failed to disable 2FA");
          }
        } else if (mfaData.totp_secret && mfaData.backup_codes && mfaData.enabled) {
          // Enable 2FA - encrypt and store data
          const encryptedSecret = await encryptSecret(mfaData.totp_secret);
          const encryptedBackupCodes = await Promise.all(
            mfaData.backup_codes.map((code: string) => encryptSecret(code))
          );

          const { error: upsertMfaError } = await supabaseClient
            .from("user_mfa")
            .upsert({
              user_id: user.id,
              totp_secret_encrypted: encryptedSecret,
              backup_codes_encrypted: encryptedBackupCodes,
              enabled: true,
            });

          if (upsertMfaError) {
            console.error("Error storing MFA data:", upsertMfaError);
            throw new Error("Failed to store encrypted MFA data");
          }
        }
      } catch (mfaError) {
        console.error("MFA processing error:", mfaError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to process MFA data",
            details: mfaError instanceof Error ? mfaError.message : "Unknown error"
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Update profile data if provided
    if (profileData && Object.keys(profileData).length > 0) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("two_factor_enabled, two_factor_secret, email")
        .eq("user_id", user.id)
        .single();

      if (profile?.two_factor_enabled) {
        if (!mfaCode) {
          return new Response(JSON.stringify({ error: "MFA required" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const valid = await verifyToken(profile.two_factor_secret, mfaCode);
        if (!valid) {
          return new Response(JSON.stringify({ error: "Invalid MFA token" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else if (!mfaData) {
        // Only require password if we're not setting up MFA
        if (!password) {
          return new Response(JSON.stringify({ error: "Password required" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const { error: reauthError } =
          await supabaseClient.auth.signInWithPassword({
            email: profile?.email || user.email || "",
            password,
          });
        if (reauthError) {
          return new Response(JSON.stringify({ error: "Invalid password" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Validate and sanitize profile data
      let sanitizedProfileData;
      try {
        sanitizedProfileData = validateAndSanitizeProfile(profileData);
      } catch (validationError) {
        console.error('Profile validation failed:', validationError);
        return getErrorResponse(
          validationError,
          'update-user-profile',
          req,
          corsHeaders,
          { additionalContext: { error: validationError instanceof Error ? validationError.message : 'Validation failed' } }
        );
      }

      // Prepare the data to update
      const updateData: any = {
        ...sanitizedProfileData,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      };

      // Remove undefined values
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      const { data: updatedProfile, error: updateError } = await supabaseClient
        .from("profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (updateError) {
        console.error("Update error:", updateError);
        return new Response(
          JSON.stringify({ 
            error: "Failed to update profile",
            details: updateError.message
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      // Log the profile update
      await supabaseClient.from("user_behavior_log").insert({
        user_id: user.id,
        action: "profile_update",
        location_data: { origin: req.headers.get("origin") },
        risk_indicators: { fields: Object.keys(profileData || {}) },
      });

      return new Response(JSON.stringify({ profile: updatedProfile }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If only MFA data was processed, return success
    return new Response(
      JSON.stringify({ success: true, message: "MFA data processed successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});