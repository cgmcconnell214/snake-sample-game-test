import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserCheck, Feather, Crown, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function KingdomEntry(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        setVerified(false);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || data?.role !== "premium") {
        setVerified(false);
      } else {
        setVerified(true);
      }
      setLoading(false);
    };

    verifyAccess();
  }, [user]);

  const handleRegisterSoul = () => {
    navigate("/app/kyc");
  };

  const handleViewRegistry = () => {
    navigate("/app/profile");
  };

  const handleViewOaths = () => {
    navigate("/app/sacred-law");
  };

  const handleManageWitnesses = () => {
    navigate("/app/divine-trust");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!verified) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">
            Access Denied
          </h2>
          <p className="text-muted-foreground">
            You do not have access to view this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kingdom Entry Logs</h1>
          <p className="text-muted-foreground">
            Sacred registry and witness management
          </p>
        </div>
        <Button onClick={handleRegisterSoul}>
          <Crown className="h-4 w-4 mr-2" />
          Register Soul
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Registered Souls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View all souls registered in the kingdom
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewRegistry}
            >
              View Registry
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Oaths Taken
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Sacred oaths and commitments made
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleViewOaths}
            >
              View Oaths
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Feather className="h-5 w-5" />
              Witness Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Cryptographic witness verification
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleManageWitnesses}
            >
              Manage Witnesses
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
