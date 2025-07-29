import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await signIn(formData.email, formData.password);
      if (error) {
        setError(error.message);
      }
 khfq01-codex/replace-instances-of-any-with-correct-types
    } catch (err: unknown) {
      const message = (err as Error).message || 'An error occurred during sign in';
      setError(message);

 codex/apply-eslint-typescript-rules
    } catch (err: any) {
      setError(err.message || "An error occurred during sign in");

    } catch (err: unknown) {
 codex/replace-all-instances-of-any-in-codebase
      setError(err.message || 'An error occurred during sign in');

 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type
      const error = err as Error;
      setError(error.message || 'An error occurred during sign in');

 codex/replace-instances-of-any-with-correct-types
      const error = err as Error;
      setError(error.message || 'An error occurred during sign in');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || 'An error occurred during sign in');
 main
 main
 main
 main
 main
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
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

    try {
      const { error } = await signUp(formData.email, formData.password, {
        first_name: formData.firstName,
        last_name: formData.lastName,
      });

      if (error) {
        setError(error.message);
      }
 khfq01-codex/replace-instances-of-any-with-correct-types
    } catch (err: unknown) {
      const message = (err as Error).message || 'An error occurred during sign up';
      setError(message);

 codex/apply-eslint-typescript-rules
    } catch (err: any) {
      setError(err.message || "An error occurred during sign up");

    } catch (err: unknown) {
 codex/replace-all-instances-of-any-in-codebase
      setError(err.message || 'An error occurred during sign up');

 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type
      const error = err as Error;
      setError(error.message || 'An error occurred during sign up');

 codex/replace-instances-of-any-with-correct-types
      const error = err as Error;
      setError(error.message || 'An error occurred during sign up');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || 'An error occurred during sign up');
 main
 main
 main
 main
 main
    } finally {
      setLoading(false);
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
 khfq01-codex/replace-instances-of-any-with-correct-types
    } catch (err: unknown) {
      const message = (err as Error).message || 'An error occurred with Discord authentication';
      setError(message);

 codex/apply-eslint-typescript-rules
    } catch (err: any) {
      setError(err.message || "An error occurred with Discord authentication");

    } catch (err: unknown) {
 codex/replace-all-instances-of-any-in-codebase
      setError(err.message || 'An error occurred with Discord authentication');

 codex/replace-any-with-correct-typescript-types
      // TODO: Verify correct error type
      const error = err as Error;
      setError(error.message || 'An error occurred with Discord authentication');

 codex/replace-instances-of-any-with-correct-types
      const error = err as Error;
      setError(error.message || 'An error occurred with Discord authentication');

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setError((err as any).message || 'An error occurred with Discord authentication');
 main
 main
 main
 main
 main
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
          <Tabs defaultValue="signin" className="w-full">
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
                </div>
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
