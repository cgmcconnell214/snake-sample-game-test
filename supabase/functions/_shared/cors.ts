export function getCorsHeaders(allowedOrigins: string[] = ['*']): Record<string, string> {
  // If wildcard is in allowedOrigins, use it
  if (allowedOrigins.includes('*')) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
  }

  // For specific origins, join them with comma
  return {
    'Access-Control-Allow-Origin': allowedOrigins.join(', '),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}