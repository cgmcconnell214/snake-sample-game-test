const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function toBits(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(2).padStart(8, "0"))
    .join("");
}

function base32Encode(bytes: Uint8Array): string {
  const bits = toBits(bytes);
  let result = "";
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.slice(i, i + 5);
    result += ALPHABET[parseInt(chunk.padEnd(5, "0"), 2)];
  }
  return result;
}

function base32Decode(str: string): Uint8Array {
  const cleaned = str.replace(/=+$/, "").toUpperCase();
  let bits = "";
  for (const char of cleaned) {
    const val = ALPHABET.indexOf(char);
    if (val < 0) throw new Error("Invalid base32");
    bits += val.toString(2).padStart(5, "0");
  }
  const bytes = [] as number[];
  for (let i = 0; i < bits.length; i += 8) {
    const byte = bits.slice(i, i + 8);
    if (byte.length === 8) bytes.push(parseInt(byte, 2));
  }
  return new Uint8Array(bytes);
}

export function generateSecret(length = 20): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return base32Encode(bytes);
}

async function generateToken(
  secret: string,
  counter: number,
  digits = 6,
): Promise<string> {
  const keyBytes = base32Decode(secret);
  const keyBuffer = new ArrayBuffer(keyBytes.length);
  new Uint8Array(keyBuffer).set(keyBytes);
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBuffer,
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

export async function verifyToken(
  secret: string,
  token: string,
  window = 2,
  step = 30,
  digits = 6,
): Promise<boolean> {
  try {
    // Clean the token input - remove spaces and ensure it's exactly 6 digits
    const cleanToken = token.replace(/\s/g, '').trim();
    if (cleanToken.length !== digits || !/^\d+$/.test(cleanToken)) {
      return false;
    }

    const counter = Math.floor(Date.now() / 1000 / step);
    
    // Check a wider window for time drift (±2 steps = ±60 seconds)
    for (let errorWin = -window; errorWin <= window; errorWin++) {
      const testCounter = counter + errorWin;
      const validToken = await generateToken(secret, testCounter, digits);
      
      if (cleanToken === validToken) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

export function generateOtpAuthURL(
  secret: string,
  email: string,
  issuer: string,
) {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const encIssuer = encodeURIComponent(issuer);
  return `otpauth://totp/${label}?secret=${secret}&issuer=${encIssuer}`;
}
