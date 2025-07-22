import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Store, Plus, Search, Clock } from "lucide-react"

export default function Marketplace() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">P2P Marketplace</h1>
          <p className="text-muted-foreground">Peer-to-peer asset trading and contracts</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          List Asset
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              List New Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Create new asset listings for trading
            </p>
            <Button variant="outline" className="w-full">Create Listing</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Browse Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Explore available assets and opportunities
            </p>
            <Button variant="outline" className="w-full">Browse Market</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Contract Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View pending and active trading contracts
            </p>
            <Button variant="outline" className="w-full">View Queue</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}