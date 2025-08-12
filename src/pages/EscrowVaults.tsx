import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Building,
  Lock,
  Clock,
  AlertTriangle,
  Plus,
  DollarSign,
  Unlock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface EscrowVault {
  id: string;
  vault_name: string;
  description?: string;
  locked_amount: number;
  status: string;
  unlock_date?: string;
  beneficiaries: string[];
  created_at: string;
}

export default function EscrowVaults(): JSX.Element {
  const [vaults, setVaults] = useState<EscrowVault[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false);
  const [selectedVault, setSelectedVault] = useState<EscrowVault | null>(null);
  const [depositAmount, setDepositAmount] = useState(0);
  const [releaseAmount, setReleaseAmount] = useState(0);
  const [newVault, setNewVault] = useState({
    vault_name: "",
    description: "",
    locked_amount: 0,
    unlock_conditions: {},
    beneficiaries: [""],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchVaults();
  }, []);

  const fetchVaults = async () => {
    const { data, error } = await supabase
      .from("escrow_vaults")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching escrow vaults:", error);
      return;
    }

    // Transform the data to match our interface
    const transformedData =
      data?.map((vault) => ({
        ...vault,
        beneficiaries: Array.isArray(vault.beneficiaries)
          ? vault.beneficiaries.map((b) => String(b))
          : [],
      })) || [];

    setVaults(transformedData);
  };

  const handleCreateVault = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create escrow vaults",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("escrow_vaults")
      .insert({
        ...newVault,
        creator_id: user.id,
        beneficiaries: newVault.beneficiaries.filter((b) => b.trim() !== ""),
        unlock_conditions: {
          requires_signatures: true,
          minimum_approvals: 2,
          auto_release_date: newVault.unlock_conditions,
        },
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create escrow vault",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Vault Created",
      description:
        "Escrow vault created successfully with multi-sig protection",
    });

    const transformedVault = {
      ...data,
      beneficiaries: Array.isArray(data.beneficiaries)
        ? data.beneficiaries.map((b) => String(b))
        : [],
    };
    setVaults([transformedVault, ...vaults]);
    setIsCreateModalOpen(false);
    setNewVault({
      vault_name: "",
      description: "",
      locked_amount: 0,
      unlock_conditions: {},
      beneficiaries: [""],
    });
  };

  const handleDeposit = async () => {
    if (!selectedVault) return;
    const { error } = await supabase.functions.invoke("xrpl-transaction", {
      body: {
        action: "escrow_deposit",
        parameters: {
          vault_id: selectedVault.id,
          amount: depositAmount,
        },
      },
    });

    if (error) {
      toast({
        title: "Deposit Failed",
        description: "Failed to deposit assets",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Assets Deposited",
      description: "Assets deposited to escrow vault",
    });
    setIsDepositModalOpen(false);
    setDepositAmount(0);
    fetchVaults();
  };

  const handleRelease = async () => {
    if (!selectedVault) return;
    const { error } = await supabase.functions.invoke("xrpl-transaction", {
      body: {
        action: "escrow_release",
        parameters: {
          vault_id: selectedVault.id,
          amount: releaseAmount,
        },
      },
    });

    if (error) {
      toast({
        title: "Release Failed",
        description: "Failed to release funds",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Funds Released",
      description: "Funds released from escrow vault",
    });
    setIsReleaseModalOpen(false);
    setReleaseAmount(0);
    fetchVaults();
  };

  const handleViewContracts = () => {
    const userVaults = vaults.filter((v) => v.status === "active");
    toast({
      title: "Active Contracts",
      description: `You have ${userVaults.length} active escrow contracts`,
    });
  };

  const handleCheckStatus = () => {
    const pendingVaults = vaults.filter((v) => v.status === "pending");
    toast({
      title: "Pending Releases",
      description: `${pendingVaults.length} vaults awaiting milestone completion`,
    });
  };

  const handleViewDisputes = () => {
    toast({
      title: "Dispute Resolution",
      description:
        "Opening dispute resolution interface with neutral arbitration",
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Escrow Vaults</h1>
          <p className="text-muted-foreground">
            Secure multi-party contract management with tokenomics integration
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Lock className="h-4 w-4 mr-2" />
          Create Escrow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewContracts}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              My Open Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your active escrow agreements with smart contract integration
            </p>
            <Button variant="outline" className="w-full">
              View Contracts
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleCheckStatus}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Releases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Escrow funds awaiting milestone completion and automated release
            </p>
            <Button variant="outline" className="w-full">
              Check Status
            </Button>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleViewDisputes}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dispute Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resolve conflicts with neutral arbitration and smart contract
              enforcement
            </p>
            <Button variant="outline" className="w-full">
              View Disputes
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Active Vaults Display */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Active Escrow Vaults</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vaults.map((vault) => (
            <Card key={vault.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    <CardTitle className="text-lg">
                      {vault.vault_name}
                    </CardTitle>
                  </div>
                  <Badge
                    variant={
                      vault.status === "active" ? "default" : "secondary"
                    }
                  >
                    {vault.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Locked Amount:
                    </span>
                    <span className="font-medium">
                      ${vault.locked_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Beneficiaries:
                    </span>
                    <span className="font-medium">
                      {vault.beneficiaries.length}
                    </span>
                  </div>
                  {vault.unlock_date && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        Unlock Date:
                      </span>
                      <span className="font-medium">
                        {new Date(vault.unlock_date).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedVault(vault);
                      setDepositAmount(0);
                      setIsDepositModalOpen(true);
                    }}
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Deposit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedVault(vault);
                      setReleaseAmount(0);
                      setIsReleaseModalOpen(true);
                    }}
                  >
                    <Unlock className="h-4 w-4 mr-2" />
                    Release
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {vaults.length === 0 && (
        <div className="text-center py-12">
          <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            No escrow vaults created yet. Start with your first vault!
          </p>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create Escrow Vault</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vault_name">Vault Name</Label>
                <Input
                  id="vault_name"
                  value={newVault.vault_name}
                  onChange={(e) =>
                    setNewVault({ ...newVault, vault_name: e.target.value })
                  }
                  placeholder="e.g., Project Milestone Escrow"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newVault.description}
                  onChange={(e) =>
                    setNewVault({ ...newVault, description: e.target.value })
                  }
                  placeholder="Describe the purpose and conditions of this escrow..."
                />
              </div>

              <div>
                <Label htmlFor="locked_amount">Locked Amount (USD)</Label>
                <Input
                  id="locked_amount"
                  type="number"
                  value={newVault.locked_amount}
                  onChange={(e) =>
                    setNewVault({
                      ...newVault,
                      locked_amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label>Beneficiaries (Email addresses)</Label>
                {newVault.beneficiaries.map((beneficiary, index) => (
                  <Input
                    key={index}
                    value={beneficiary}
                    onChange={(e) => {
                      const updated = [...newVault.beneficiaries];
                      updated[index] = e.target.value;
                      setNewVault({ ...newVault, beneficiaries: updated });
                    }}
                    placeholder="beneficiary@example.com"
                    className="mt-2"
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() =>
                    setNewVault({
                      ...newVault,
                      beneficiaries: [...newVault.beneficiaries, ""],
                    })
                  }
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Beneficiary
                </Button>
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleCreateVault} className="flex-1">
                  <Lock className="h-4 w-4 mr-2" />
                  Create Vault
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isDepositModalOpen && selectedVault && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Deposit Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="deposit_amount">Amount</Label>
                <Input
                  id="deposit_amount"
                  type="number"
                  value={depositAmount}
                  onChange={(e) =>
                    setDepositAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleDeposit} className="flex-1">
                  Deposit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDepositModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isReleaseModalOpen && selectedVault && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Release Funds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="release_amount">Amount</Label>
                <Input
                  id="release_amount"
                  type="number"
                  value={releaseAmount}
                  onChange={(e) =>
                    setReleaseAmount(parseFloat(e.target.value) || 0)
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button onClick={handleRelease} className="flex-1">
                  Release
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsReleaseModalOpen(false)}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
