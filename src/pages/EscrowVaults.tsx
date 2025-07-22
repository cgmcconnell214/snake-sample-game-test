import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building, Lock, Clock, AlertTriangle } from "lucide-react"

export default function EscrowVaults() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Escrow Vaults</h1>
          <p className="text-muted-foreground">Secure multi-party contract management</p>
        </div>
        <Button>
          <Lock className="h-4 w-4 mr-2" />
          Create Escrow
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              My Open Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View your active escrow agreements
            </p>
            <Button variant="outline" className="w-full">View Contracts</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Pending Releases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Escrow funds awaiting milestone completion
            </p>
            <Button variant="outline" className="w-full">Check Status</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Dispute Resolution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Resolve conflicts with neutral arbitration
            </p>
            <Button variant="outline" className="w-full">View Disputes</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}