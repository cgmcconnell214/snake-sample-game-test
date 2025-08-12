import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    const body = await req.json();
    const profileData = body.profile;
    const mfaCode: string | undefined = body.mfaCode;
    const password: string | undefined = body.password;

    if (profileData.user_id && profileData.user_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Cannot update other users" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

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
    } else {
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

    const { error: updateError } = await supabaseClient
      .from("user_profiles")
      .upsert({ ...profileData, user_id: user.id }, { onConflict: "user_id" });

    if (updateError) {
      throw updateError;
    }

    await supabaseClient.from("user_behavior_log").insert({
      user_id: user.id,
      action: "profile_update",
      location_data: { origin: req.headers.get("origin") },
      risk_indicators: { fields: Object.keys(profileData || {}) },
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
