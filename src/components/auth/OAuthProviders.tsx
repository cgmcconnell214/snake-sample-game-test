import React from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import { generateDeviceFingerprint, getLocationData, getIPInfo } from "@/lib/deviceFingerprint";

interface OAuthProvidersProps {
  loading: boolean;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

type Provider = 
  | 'discord'
  | 'google'
  | 'github'
  | 'linkedin_oidc'
  | 'apple'
  | 'spotify';

interface ProviderInfo {
  name: string;
  provider: Provider;
  icon: React.ComponentType<any>;
  description: string;
}

const OAuthProviders: React.FC<OAuthProvidersProps> = ({
  loading,
  setLoading,
  setError,
}) => {
  const handleOAuthSignIn = async (provider: Provider) => {
    setLoading(true);
    setError(null);

    try {
      // Generate device fingerprint and collect security data
      const deviceInfo = generateDeviceFingerprint();
      const locationData = await getLocationData();
      const ipInfo = await getIPInfo();

      // Combine security metadata
      const securityMetadata = {
        device_fingerprint: deviceInfo.fingerprint,
        device_name: deviceInfo.deviceName,
        browser_info: deviceInfo.browserInfo,
        location_data: locationData,
        ip_info: ipInfo,
        timestamp: new Date().toISOString(),
      };

      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            // Pass security metadata as query params (will be available in callback)
            device_fp: deviceInfo.fingerprint,
            device_name: encodeURIComponent(deviceInfo.deviceName),
          },
        },
      });

      if (error) {
        setError(`Failed to sign in with ${provider}: ${error.message}`);
      }
    } catch (err: any) {
      setError(err.message || `An error occurred with ${provider} authentication`);
    } finally {
      setLoading(false);
    }
  };

  const providers: ProviderInfo[] = [
    {
      name: 'Google',
      provider: 'google' as Provider,
      icon: Icons.google,
      description: 'Continue with Google',
    },
    {
      name: 'GitHub',
      provider: 'github' as Provider,
      icon: Icons.gitHub,
      description: 'Continue with GitHub',
    },
    {
      name: 'Discord',
      provider: 'discord' as Provider,
      icon: Icons.discord,
      description: 'Continue with Discord',
    },
    {
      name: 'LinkedIn',
      provider: 'linkedin_oidc' as Provider,
      icon: Icons.linkedin,
      description: 'Continue with LinkedIn',
    },
    {
      name: 'Apple',
      provider: 'apple' as Provider,
      icon: Icons.apple,
      description: 'Continue with Apple',
    },
    {
      name: 'Spotify',
      provider: 'spotify' as Provider,
      icon: Icons.spotify,
      description: 'Continue with Spotify',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-3">
      {providers.map((providerInfo) => (
        <Button
          key={providerInfo.provider}
          variant="outline"
          className="w-full justify-start h-12 border-divine-gold/20 hover:border-divine-gold/40 hover:bg-divine-gold/5 transition-all duration-300"
          onClick={() => handleOAuthSignIn(providerInfo.provider)}
          disabled={loading}
        >
          <providerInfo.icon className="mr-3 h-5 w-5" />
          <span className="flex-1 text-left">{providerInfo.description}</span>
        </Button>
      ))}
    </div>
  );
};

export default OAuthProviders;