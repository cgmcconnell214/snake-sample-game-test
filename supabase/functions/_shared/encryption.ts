// Simple encryption utilities for 2FA secrets
// Note: In production, use a proper key management system

// Derive key from environment secret
async function deriveKey(secret: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("totp-salt"), // In production, use random salt per user
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptSecret(plaintext: string): Promise<string> {
  const encryptionSecret = Deno.env.get("TOTP_ENCRYPTION_SECRET") || "default-secret-change-in-production";
  const key = await deriveKey(encryptionSecret);
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  // Combine IV and encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return base64 encoded
  return btoa(String.fromCharCode(...combined));
}

export async function decryptSecret(encrypted: string): Promise<string> {
  const encryptionSecret = Deno.env.get("TOTP_ENCRYPTION_SECRET") || "default-secret-change-in-production";
  const key = await deriveKey(encryptionSecret);
  
  // Decode from base64
  const combined = new Uint8Array(
    atob(encrypted)
      .split("")
      .map((char) => char.charCodeAt(0))
  );

  // Extract IV and encrypted data
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}