export function getCorsHeaders(allowedOrigins: string[] = []): Record<string, string> {
  // Default to secure localhost and Lovable domains for development
  const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:8080',
    'https://*.lovableproject.com',
    'https://*.supabase.co'
  ];
  
  const origins = allowedOrigins.length > 0 ? allowedOrigins : defaultOrigins;
  
  // Only allow wildcard for local development
  if (origins.includes('*') && !origins.some(origin => origin.includes('localhost'))) {
    console.warn('SECURITY WARNING: Wildcard CORS origin detected in production environment');
  }
  
  // If wildcard is explicitly requested, use it (with warning)
  if (origins.includes('*')) {
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
  }

  // For specific origins, join them with comma
  return {
    'Access-Control-Allow-Origin': origins.join(', '),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  };
}