import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { generateDeviceFingerprint, getLocationData, getIPInfo } from "@/lib/deviceFingerprint";
import LoadingSpinner from "@/components/LoadingSpinner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the session from the URL hash/fragment
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setStatus('error');
          setMessage('Authentication failed. Please try again.');
          toast({
            title: "Authentication Failed",
            description: error.message,
            variant: "destructive",
          });
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (data.session?.user) {
          const user = data.session.user;
          
          // Generate device fingerprint and security data
          const deviceInfo = generateDeviceFingerprint();
          const locationData = await getLocationData();
          const ipInfo = await getIPInfo();

          // Register device for this user
          try {
            await supabase.rpc('register_device', {
              p_device_fingerprint: deviceInfo.fingerprint,
              p_device_name: deviceInfo.deviceName,
              p_browser_info: deviceInfo.browserInfo,
              p_location_data: locationData,
            });
          } catch (deviceError) {
            console.warn('Failed to register device:', deviceError);
            // Continue even if device registration fails
          }

          // Link OAuth account
          const provider = user.app_metadata?.provider;
          if (provider && user.user_metadata) {
            try {
              await supabase.rpc('link_oauth_account', {
                p_provider: provider,
                p_provider_id: user.id,
                p_provider_email: user.email,
                p_provider_metadata: user.user_metadata,
                p_is_primary: !user.email_confirmed_at, // If email not confirmed, this might be primary
              });
            } catch (linkError) {
              console.warn('Failed to link OAuth account:', linkError);
              // Continue even if linking fails
            }
          }

          // Log security event
          try {
            await supabase.from('security_events').insert({
              event_type: 'oauth_login_success',
              device_fingerprint: deviceInfo.fingerprint,
              event_data: {
                provider: provider,
                ip_info: ipInfo,
                location_data: locationData,
                device_name: deviceInfo.deviceName,
              } as any,
              risk_score: 0, // Successful OAuth login is low risk
            });
          } catch (logError) {
            console.warn('Failed to log security event:', logError);
          }

          setStatus('success');
          setMessage('Authentication successful! Redirecting...');
          
          toast({
            title: "Welcome!",
            description: `Successfully signed in with ${provider || 'OAuth provider'}`,
          });

          // Redirect to main app
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        } else {
          setStatus('error');
          setMessage('No user session found. Redirecting to login...');
          setTimeout(() => navigate('/auth'), 3000);
        }
      } catch (error) {
        console.error('Callback handling error:', error);
        setStatus('error');
        setMessage('An unexpected error occurred. Please try again.');
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  const getStatusColor = () => {
    switch (status) {
      case 'loading':
        return 'text-muted-foreground';
      case 'success':
        return 'text-divine-gold';
      case 'error':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <LoadingSpinner />;
      case 'success':
        return <div className="w-8 h-8 rounded-full bg-divine-gold/20 flex items-center justify-center">✓</div>;
      case 'error':
        return <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">✗</div>;
      default:
        return <LoadingSpinner />;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-hero p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {getStatusIcon()}
          </div>
          <CardTitle className="text-xl font-bold text-divine-gold">
            Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className={`text-lg ${getStatusColor()}`}>
            {message}
          </p>
          {status === 'loading' && (
            <p className="text-sm text-muted-foreground mt-2">
              Please wait while we securely process your authentication...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;