import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Wallet,
  Plus,
  ArrowRightLeft,
  RefreshCw,
  Check,
  ChevronRight,
  X,
  Link as LinkIcon,
  DollarSign,
  CreditCard,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface WalletAddress {
  id: string;
  name: string;
  address: string;
  type: string;
  isDefault: boolean;
}

const WalletIntegration: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [connecting, setConnecting] = useState(false);
  const [newWallet, setNewWallet] = useState({
    name: "",
    address: "",
    type: "xrpl",
  });

  // Demo wallet addresses
  const [walletAddresses, setWalletAddresses] = useState<WalletAddress[]>([
    {
      id: "1",
      name: "My XRPL Wallet",
      address: "rHEpFXJr7yfT3T2krFP74XaaDDRUTCQtRV",
      type: "xrpl",
      isDefault: true,
    },
  ]);

  const handleConnectWallet = () => {
    setConnecting(true);

    // Simulate connecting to wallet
    setTimeout(() => {
      setConnecting(false);
      toast({
        title: "Wallet Connected",
        description: "Your wallet has been connected successfully!",
      });

      // Add new wallet to the list
      if (newWallet.name && newWallet.address) {
        setWalletAddresses((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            name: newWallet.name,
            address: newWallet.address,
            type: newWallet.type,
            isDefault: false,
          },
        ]);
        setNewWallet({ name: "", address: "", type: "xrpl" });
      }
    }, 1500);
  };

  const handleDisconnect = (id: string) => {
    setWalletAddresses((prev) => prev.filter((wallet) => wallet.id !== id));
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const setAsDefault = (id: string) => {
    setWalletAddresses((prev) =>
      prev.map((wallet) => ({
        ...wallet,
        isDefault: wallet.id === id,
      })),
    );
    toast({
      title: "Default Wallet Updated",
      description: "Your default wallet has been updated.",
    });
  };

  const handleMakePayment = () => {
    const defaultWallet = walletAddresses.find((w) => w.isDefault);

    if (!defaultWallet) {
      toast({
        title: "No Default Wallet",
        description: "Please set a default wallet before making a payment.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Payment Initiated",
      description: "Your payment is being processed.",
    });

    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
      });
    }, 2000);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>External Wallets</span>
        </CardTitle>
        <CardDescription>
          Connect and manage your cryptocurrency wallets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="connected" className="w-full">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="connected">Connected Wallets</TabsTrigger>
            <TabsTrigger value="connect">Connect New Wallet</TabsTrigger>
          </TabsList>

          <TabsContent value="connected" className="space-y-4">
            {walletAddresses.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-medium text-lg">No wallets connected</h3>
                <p className="text-muted-foreground text-sm mt-2">
                  Connect a wallet to start making transactions
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {walletAddresses.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`p-4 rounded-lg border flex items-center justify-between ${
                      wallet.isDefault ? "bg-primary/5 border-primary" : ""
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="bg-muted rounded-full p-2">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center">
                          {wallet.name}
                          {wallet.isDefault && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center mt-1">
                          <span className="truncate max-w-[150px] sm:max-w-[200px] md:max-w-[300px]">
                            {wallet.address}
                          </span>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {wallet.type.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!wallet.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setAsDefault(wallet.id)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDisconnect(wallet.id)}
                      >
                        <X className="h-3 w-3 mr-1" />
                        Disconnect
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-4 border-t mt-4">
              <Button
                className="w-full"
                onClick={handleMakePayment}
                disabled={walletAddresses.length === 0}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Make Payment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="connect" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="wallet-name">Wallet Name</Label>
                <Input
                  id="wallet-name"
                  placeholder="My XRPL Wallet"
                  value={newWallet.name}
                  onChange={(e) =>
                    setNewWallet((prev) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={connecting}
                />
              </div>

              <div>
                <Label htmlFor="wallet-address">Wallet Address</Label>
                <Input
                  id="wallet-address"
                  placeholder="Enter your wallet address"
                  value={newWallet.address}
                  onChange={(e) =>
                    setNewWallet((prev) => ({
                      ...prev,
                      address: e.target.value,
                    }))
                  }
                  disabled={connecting}
                />
              </div>

              <div>
                <Label htmlFor="wallet-type">Wallet Type</Label>
                <select
                  id="wallet-type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={newWallet.type}
                  onChange={(e) =>
                    setNewWallet((prev) => ({ ...prev, type: e.target.value }))
                  }
                  disabled={connecting}
                >
                  <option value="xrpl">XRPL</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="bitcoin">Bitcoin</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleConnectWallet}
              disabled={connecting || !newWallet.name || !newWallet.address}
              className="w-full"
            >
              {connecting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4 mr-2" />
                  Connect Wallet
                </>
              )}
            </Button>

            <div className="pt-2">
              <p className="text-sm text-muted-foreground">
                You can also use a third-party wallet provider:
              </p>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() =>
                    toast({
                      title: "Coming Soon",
                      description: "XRP Pay integration coming soon!",
                    })
                  }
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  XRP Pay
                </Button>
                <Button
                  variant="outline"
                  className="justify-start"
                  onClick={() =>
                    toast({
                      title: "Coming Soon",
                      description: "Xumm wallet integration coming soon!",
                    })
                  }
                >
                  <Wallet className="h-4 w-4 mr-2" />
                  Xumm
                </Button>
              </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open('https://xrpl.org/xrp-pay', '_blank')}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    XRP Pay
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => window.open('https://xumm.app', '_blank')}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Xumm
                  </Button>
                </div>
 main
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default WalletIntegration;
