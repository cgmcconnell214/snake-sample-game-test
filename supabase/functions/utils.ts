export function generateXrplCurrencyCode(symbol: string): string {
  if (symbol.length <= 3) {
    return symbol.toUpperCase().padEnd(3, '\0')
  }
  return Buffer.from(symbol.substring(0, 20)).toString('hex').toUpperCase().padEnd(40, '0')
}
