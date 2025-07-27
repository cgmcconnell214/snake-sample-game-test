import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldCheck, 
  ShieldX, 
  Smartphone, 
  Key, 
  AlertTriangle,
  CheckCircle,
  Copy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { generateSecret, generateOtpAuthURL, verifyToken } from '@/lib/totp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const TwoFactorManager: React.FC = () => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (profile) {
      setIsEnabled(profile.two_factor_enabled || false);
    }
  }, [profile]);

  const generateBackupCodes = () => {
    const codes = [];
    for (let i = 0; i < 8; i++) {
      codes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
    }
    return codes;
  };

  const [secret, setSecret] = useState<string>('');

  const enable2FA = async () => {
    setLoading(true);
    try {
      const newSecret = generateSecret();
      const codes = generateBackupCodes();

      setSecret(newSecret);
      setQrCodeUrl(generateOtpAuthURL(newSecret, user?.email || 'user', "God's Realm"));
      setBackupCodes(codes);
      setShowSetup(true);
      
    } catch (error) {
      console.error('Error enabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to enable two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const isValid = await verifyToken(secret, verificationCode);
      if (!isValid) {
        toast({
          title: "Invalid Code",
          description: "The verification code you entered is incorrect.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsEnabled(true);
      setShowSetup(false);
      
      toast({
        title: "2FA Enabled",
        description: "Two-factor authentication has been successfully enabled.",
      });
      
    } catch (error) {
      console.error('Error verifying 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to verify two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ two_factor_enabled: false })
        .eq('user_id', user?.id);

      if (error) throw error;

      setIsEnabled(false);
      setBackupCodes([]);
      setQrCodeUrl('');
      
      toast({
        title: "2FA Disabled",
        description: "Two-factor authentication has been disabled.",
      });
      
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast({
        title: "Error",
        description: "Failed to disable two-factor authentication.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyBackupCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Backup code copied to clipboard.",
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isEnabled ? (
                <ShieldCheck className="h-6 w-6 text-success" />
              ) : (
                <ShieldX className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <div className="font-medium">
                  Two-Factor Authentication
                </div>
                <div className="text-sm text-muted-foreground">
                  {isEnabled ? 'Enabled and protecting your account' : 'Not currently enabled'}
                </div>
              </div>
            </div>
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>

          <div className="flex gap-2">
            {!isEnabled ? (
              <Button onClick={enable2FA} disabled={loading}>
                <Shield className="h-4 w-4 mr-2" />
                Enable 2FA
              </Button>
            ) : (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Key className="h-4 w-4 mr-2" />
                      View Backup Codes
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Backup Codes</DialogTitle>
                      <DialogDescription>
                        Use these codes if you lose access to your authenticator app
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2">
                      {backupCodes.map((code, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                          <code className="font-mono">{code}</code>
                          <Button size="sm" variant="ghost" onClick={() => copyBackupCode(code)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
                <Button variant="destructive" onClick={disable2FA} disabled={loading}>
                  <ShieldX className="h-4 w-4 mr-2" />
                  Disable 2FA
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Dialog */}
      <Dialog open={showSetup} onOpenChange={setShowSetup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Set Up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-48 h-48 bg-muted rounded-lg flex items-center justify-center mx-auto">
                <div className="text-center">
                  <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">QR Code</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Use Google Authenticator<br />or similar app
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Verification Code</label>
              <Input
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSetup(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={verify2FA} disabled={loading || !verificationCode} className="flex-1">
                <CheckCircle className="h-4 w-4 mr-2" />
                Verify & Enable
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" />
                Save your backup codes
              </div>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {backupCodes.slice(0, 4).map((code, index) => (
                  <code key={index} className="bg-muted p-1 rounded">{code}</code>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TwoFactorManager;