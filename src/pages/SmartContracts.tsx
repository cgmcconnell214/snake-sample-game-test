import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileCheck, Plus, Code, Handshake } from "lucide-react"

export default function SmartContracts() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Smart Contract Templates</h1>
          <p className="text-muted-foreground">Pre-built and custom contract templates</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5" />
              Trade Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Templates for asset trading and exchange agreements
            </p>
            <Button variant="outline" className="w-full">View Templates</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Lending Agreements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Collateralized lending and borrowing contracts
            </p>
            <Button variant="outline" className="w-full">Explore Options</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Custom Builder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Build custom smart contracts with our visual editor
            </p>
            <Button variant="outline" className="w-full">Start Building</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}