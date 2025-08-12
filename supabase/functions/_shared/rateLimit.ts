const WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30;

// Simple in-memory store. For production, replace with persistent storage.
const requests = new Map<string, { count: number; expires: number }>();

export function rateLimit(req: Request, identifier?: string): Response | null {
  const ip =
    identifier ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const now = Date.now();
  const entry = requests.get(ip);
  if (!entry || now > entry.expires) {
    requests.set(ip, { count: 1, expires: now + WINDOW_MS });
    return null;
  }
  if (entry.count >= MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.expires - now) / 1000);
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": retryAfter.toString(),
      },
    });
  }
  entry.count++;
  requests.set(ip, entry);
  return null;
}
