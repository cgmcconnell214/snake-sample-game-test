export function getCorsHeaders(allowedOrigins: string[] = []): Record<string, string> {
  // Environment-based CORS configuration for enhanced security
  const isDevelopment = Deno.env.get('DENO_DEPLOYMENT_ID') === undefined;
  
  // Secure development origins only
  const developmentOrigins = [
    'http://localhost:3000',
    'http://localhost:5173', 
    'http://localhost:8080'
  ];
  
  // Production-ready origins - no wildcards
  const productionOrigins = [
    'https://bkxbkaggxqcsiylwcopt.lovableproject.com',
    'https://bkxbkaggxqcsiylwcopt.supabase.co'
  ];
  
  // Use provided origins or environment-appropriate defaults
  const origins = allowedOrigins.length > 0 
    ? allowedOrigins 
    : isDevelopment ? developmentOrigins : productionOrigins;
  
  // SECURITY: Never allow wildcard in production
  if (origins.includes('*') && !isDevelopment) {
    console.error('SECURITY VIOLATION: Wildcard CORS blocked in production');
    throw new Error('Wildcard CORS not allowed in production environment');
  }
  
  // Allow wildcard only in development with explicit warning
  if (origins.includes('*') && isDevelopment) {
    console.warn('DEVELOPMENT MODE: Wildcard CORS enabled for local development only');
    return {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
  }

  // Production-safe CORS with specific origins
  return {
    'Access-Control-Allow-Origin': origins.join(', '),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
  };
}