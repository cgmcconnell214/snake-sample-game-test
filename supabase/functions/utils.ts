export function generateXrplCurrencyCode(symbol: string): string {
  if (symbol.length <= 3) {
    return symbol.toUpperCase().padEnd(3, "\0");
  }
  const bytes = new TextEncoder().encode(symbol.substring(0, 20));
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  return hex.padEnd(40, "0");
}
