import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertTriangle,
  Shield,
  UserCheck,
  Phone,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function SiteEntry(): JSX.Element {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedLiability, setAcceptedLiability] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [deviceFingerprint, setDeviceFingerprint] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [step, setStep] = useState(1); // 1: Terms, 2: Phone, 3: Verification
  const { toast } = useToast();

  useEffect(() => {
    // Generate device fingerprint
    const generateFingerprint = (): string => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      ctx?.fillText("fingerprint", 2, 2);

      const fingerprint = [
        navigator.userAgent,
        navigator.language,
        screen.width + "x" + screen.height,
        new Date().getTimezoneOffset(),
        canvas.toDataURL(),
        navigator.hardwareConcurrency,
        (navigator as any).deviceMemory || "unknown",
      ].join("|");

      return btoa(fingerprint).substring(0, 32);
    };

    setDeviceFingerprint(generateFingerprint());
  }, []);

  const handleTermsAcceptance = () => {
    if (!acceptedTerms || !acceptedLiability) {
      toast({
        title: "Agreement Required",
        description:
          "You must accept both terms and liability waiver to continue.",
        variant: "destructive",
      });
      return;
    }
    setStep(2);
  };

  const handlePhoneVerification = async () => {
    if (!phoneNumber) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number for verification.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);

    // Check for existing phone number
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("jurisdiction", phoneNumber) // Using jurisdiction field temporarily for phone
      .single();

    if (existingUser) {
      toast({
        title: "Phone Number Already Registered",
        description: "This phone number is already associated with an account.",
        variant: "destructive",
      });
      setIsVerifying(false);
      return;
    }

    // Simulate sending verification code
    setTimeout(() => {
      setIsVerifying(false);
      setStep(3);
      toast({
        title: "Verification Code Sent",
        description: "Please check your phone for the verification code.",
      });
    }, 2000);
  };

  const handleCodeVerification = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }

    // Simulate code verification
    if (verificationCode === "123456") {
      // Store device fingerprint and phone in profile
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await supabase
          .from("profiles")
          .update({
            device_fingerprint: deviceFingerprint,
            jurisdiction: phoneNumber, // Temporarily using this field
          })
          .eq("user_id", user.id);
      }

      toast({
        title: "Verification Complete",
        description: "Welcome to the platform! You may now proceed.",
      });

      // Redirect to main app
      window.location.href = "/";
    } else {
      toast({
        title: "Invalid Code",
        description: "The verification code is incorrect.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 mx-auto text-primary" />
          <h1 className="text-3xl font-bold">Platform Entry Verification</h1>
          <p className="text-muted-foreground">
            Secure onboarding for compliant asset tokenization
          </p>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Terms & Liability Agreement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) =>
                      setAcceptedTerms(checked === true)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm font-medium">
                      Terms & Conditions
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I agree to the platform's Terms of Service, Privacy
                      Policy, and understand that this platform deals with
                      tokenized assets and blockchain technology. I acknowledge
                      all associated risks.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-2">
                  <Checkbox
                    id="liability"
                    checked={acceptedLiability}
                    onCheckedChange={(checked) =>
                      setAcceptedLiability(checked === true)
                    }
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="liability" className="text-sm font-medium">
                      Liability Waiver
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      I acknowledge that trading tokenized assets involves
                      significant risk and I may lose my entire investment. I
                      waive all claims against the platform and agree to
                      indemnify the platform against losses.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning mt-0.5 flex-shrink-0" />
                  <div className="text-xs">
                    <div className="font-medium text-warning mb-1">
                      Important Notice
                    </div>
                    <div className="text-muted-foreground">
                      This platform operates under strict compliance with
                      financial regulations. All activities are monitored and
                      logged for regulatory compliance.
                    </div>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleTermsAcceptance}
                className="w-full"
                disabled={!acceptedTerms || !acceptedLiability}
              >
                Accept and Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Phone Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Required for AML compliance and single account enforcement
                </p>
              </div>

              <Button
                onClick={handlePhoneVerification}
                className="w-full"
                disabled={isVerifying || !phoneNumber}
              >
                {isVerifying ? "Sending Code..." : "Send Verification Code"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Enter Verification Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="code">6-Digit Verification Code</Label>
                <Input
                  id="code"
                  type="text"
                  placeholder="123456"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(e.target.value.replace(/\D/g, ""))
                  }
                  className="text-center text-lg tracking-widest font-mono"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Code sent to {phoneNumber}
                </p>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  <strong>Device ID:</strong> {deviceFingerprint}
                </p>
                <p>
                  This device will be linked to your account for security
                  purposes.
                </p>
              </div>

              <Button
                onClick={handleCodeVerification}
                className="w-full"
                disabled={!verificationCode || verificationCode.length !== 6}
              >
                Verify and Enter Platform
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
