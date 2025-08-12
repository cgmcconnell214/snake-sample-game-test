import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icons } from "@/components/ui/icons";
import { supabase } from "@/integrations/supabase/client";
import zxcvbn from "zxcvbn";
import { Progress } from "@/components/ui/progress";
import ReCAPTCHA from "react-google-recaptcha";

const Auth = (): JSX.Element => {
  const { user, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const location = useLocation();
  const [acceptedSignin, setAcceptedSignin] = useState(false);
  const [acceptedSignup, setAcceptedSignup] = useState(false);
  const [passwordScore, setPasswordScore] = useState(0);
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "text-red-500",
    "text-red-500",
    "text-yellow-500",
    "text-green-500",
    "text-green-600",
  ];
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const signInCaptchaRef = useRef<ReCAPTCHA>(null);
  const signUpCaptchaRef = useRef<ReCAPTCHA>(null);
  const recaptchaSiteKey = (import.meta as any).env?.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const initialTab = new URLSearchParams(location.search).get("mode") === "signup" ? "signup" : "signin";
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === "password") {
      const { score } = zxcvbn(value);
      setPasswordScore(score);
    }
    setError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedSignin) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (recaptchaSiteKey && !captchaToken) {
      setError("Please complete the captcha.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");
    } finally {
      setLoading(false);
      signInCaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedSignup) {
      setError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }
    if (recaptchaSiteKey && !captchaToken) {
      setError("Please complete the captcha.");
      return;
    }
    setLoading(true);
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setLoading(false);
      return;
    }

    if (passwordScore < 2) {
      setError("Password is too weak");
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");
    } finally {
      setLoading(false);
      signUpCaptchaRef.current?.reset();
      setCaptchaToken(null);
    }
  };

  const handleDiscordAuth = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "discord",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred with Discord authentication");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background/80 to-accent/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center bg-gradient-primary bg-clip-text text-transparent">
            God's Realm
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access the divine ecosystem
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            defaultValue={initialTab}
            className="w-full"
            onValueChange={() => {
              setCaptchaToken(null);
              signInCaptchaRef.current?.reset();
              signUpCaptchaRef.current?.reset();
            }}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <Progress value={(passwordScore / 4) * 100} className="h-2" />
                      <p className={`text-xs ${strengthColors[passwordScore]}`}>
                        Strength: {strengthLabels[passwordScore]}
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="signin-terms"
                    checked={acceptedSignin}
                    onCheckedChange={(v) => { setAcceptedSignin(Boolean(v)); setError(null); }}
                  />
                  <label htmlFor="signin-terms" className="text-sm text-muted-foreground">
                    I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
                  </label>
                </div>
                {recaptchaSiteKey && (
                  <ReCAPTCHA
                    ref={signInCaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setCaptchaToken(token)}
                  />
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      disabled={loading}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                  {formData.password && (
                    <div className="space-y-1">
                      <Progress value={(passwordScore / 4) * 100} className="h-2" />
                      <p className={`text-xs ${strengthColors[passwordScore]}`}>
                        Strength: {strengthLabels[passwordScore]}
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    required
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="signup-terms"
                    checked={acceptedSignup}
                    onCheckedChange={(v) => { setAcceptedSignup(Boolean(v)); setError(null); }}
                  />
                  <label htmlFor="signup-terms" className="text-sm text-muted-foreground">
                    I agree to the <a href="/terms" className="underline">Terms</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
                  </label>
                </div>
                {recaptchaSiteKey && (
                  <ReCAPTCHA
                    ref={signUpCaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setCaptchaToken(token)}
                  />
                )}
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Creating account..." : "Create Account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={handleDiscordAuth}
              disabled={loading}
            >
              <Icons.discord className="mr-2 h-4 w-4" />
              Discord
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
