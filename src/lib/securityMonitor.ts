/**
 * Security monitoring and event logging utilities
 */

export interface SecurityEvent {
  type: 'auth_failure' | 'suspicious_activity' | 'data_access' | 'privilege_escalation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  details: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

/**
 * Log security events to Supabase for monitoring
 */
export const logSecurityEvent = async (
  supabaseClient: any,
  event: Omit<SecurityEvent, 'timestamp'>
): Promise<void> => {
  try {
    const riskScore = getRiskScore(event.severity);
    
    await supabaseClient.from('security_events').insert({
      event_type: event.type,
      event_data: {
        ...event.details,
        severity: event.severity,
        timestamp: new Date().toISOString()
      },
      risk_score: riskScore,
      user_id: event.userId || null
    });
  } catch (error) {
    // Silent logging - don't break application flow
  }
};

/**
 * Convert severity to risk score
 */
const getRiskScore = (severity: SecurityEvent['severity']): number => {
  switch (severity) {
    case 'low': return 2;
    case 'medium': return 5;
    case 'high': return 8;
    case 'critical': return 10;
    default: return 1;
  }
};

/**
 * Monitor for suspicious authentication patterns
 */
export const detectSuspiciousAuth = (
  attempts: number,
  timeWindow: number
): boolean => {
  // More than 5 attempts in 15 minutes is suspicious
  return attempts > 5 && timeWindow < 15 * 60 * 1000;
};

/**
 * Validate session integrity
 */
export const validateSessionIntegrity = (sessionData: any): boolean => {
  if (!sessionData || !sessionData.user) {
    return false;
  }
  
  // Check session expiration
  if (sessionData.expires_at) {
    const expiry = new Date(sessionData.expires_at).getTime();
    const now = Date.now();
    return now < expiry;
  }
  
  return true;
};