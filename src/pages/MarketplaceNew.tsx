import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Search, Filter, Star, TrendingUp, Package } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

interface MarketplaceAsset {
  id: string
  asset_name: string
  asset_symbol: string
  description: string
  creator_id: string
  total_supply: number
  circulating_supply: number
  current_price: number
  price_change_24h: number
  volume_24h: number
  is_active: boolean
  asset_type: string
  metadata: any
}

export default function Marketplace() {
  const [assets, setAssets] = useState<MarketplaceAsset[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("volume")
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    fetchMarketplaceAssets()
  }, [])

  const fetchMarketplaceAssets = async () => {
    const { data, error } = await supabase
      .from('tokenized_assets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch marketplace assets",
        variant: "destructive"
      })
      return
    }

    // Simulate market data for display
    const assetsWithMarketData = (data || []).map(asset => ({
      ...asset,
      current_price: Math.random() * 1000 + 50,
      price_change_24h: (Math.random() - 0.5) * 20,
      volume_24h: Math.random() * 100000,
      asset_type: 'tokenized_asset'
    }))

    setAssets(assetsWithMarketData)
  }

  const handleListAsset = () => {
    toast({
      title: "List New Asset",
      description: "Redirecting to asset tokenization page...",
    })
    navigate('/app/tokenize')
  }

  const handleBrowseOffers = () => {
    toast({
      title: "Browse Offers",
      description: "Showing all available trading offers",
    })
    navigate('/app/marketplace')
  }

  const handleViewContracts = () => {
    toast({
      title: "Contract Queue",
      description: "Viewing active and pending smart contracts",
    })
    navigate('/app/marketplace')
  }

  const handleBuyAsset = async (assetId: string) => {
    const asset = assets.find(a => a.id === assetId)
    if (!asset) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to purchase assets",
        variant: "destructive"
      })
      return
    }

    toast({
      title: "Purchase Initiated",
      description: `Preparing to buy ${asset.asset_name} at $${asset.current_price.toFixed(2)}`,
    })

    // Redirect to trading page with pre-filled buy order
    navigate(`/app/trading?asset=${assetId}&action=buy`)
  }

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.asset_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.asset_symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  const sortedAssets = [...filteredAssets].sort((a, b) => {
    switch (sortBy) {
      case "volume":
        return b.volume_24h - a.volume_24h
      case "price":
        return b.current_price - a.current_price
      case "change":
        return b.price_change_24h - a.price_change_24h
      default:
        return 0
    }
  })

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="page-header">
        <div>
          <h1 className="text-3xl font-bold">P2P Marketplace</h1>
          <p className="text-muted-foreground">Trade tokenized assets peer-to-peer</p>
        </div>
        <Button onClick={handleListAsset}>
          <Package className="h-4 w-4 mr-2" />
          List Asset
        </Button>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleListAsset}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              List New Asset
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Tokenize and list your assets for peer-to-peer trading
            </p>
            <Button variant="outline" className="w-full" onClick={handleListAsset}>
              List Asset
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleBrowseOffers}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Browse Offers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Explore available assets and trading opportunities
            </p>
            <Button variant="outline" className="w-full" onClick={handleBrowseOffers}>
              Browse Offers
            </Button>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={handleViewContracts}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Contract Queue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              View active trades and pending smart contracts
            </p>
            <Button variant="outline" className="w-full" onClick={handleViewContracts}>
              View Queue
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <select 
          className="px-3 py-2 border rounded-md bg-background"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="volume">Sort by Volume</option>
          <option value="price">Sort by Price</option>
          <option value="change">Sort by Change</option>
        </select>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{asset.asset_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.asset_symbol}</p>
                </div>
                <Badge variant={asset.price_change_24h >= 0 ? 'default' : 'destructive'}>
                  {asset.price_change_24h >= 0 ? '+' : ''}{asset.price_change_24h.toFixed(2)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {asset.description}
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span className="font-bold text-lg">${asset.current_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">24h Volume:</span>
                  <span className="font-medium">${asset.volume_24h.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supply:</span>
                  <span className="font-medium">
                    {asset.circulating_supply.toLocaleString()} / {asset.total_supply.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  className="flex-1" 
                  onClick={() => handleBuyAsset(asset.id)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
                <Button variant="outline">
                  <Star className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedAssets.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {searchTerm ? "No assets found matching your search." : "No assets available. Be the first to list one!"}
          </p>
        </div>
      )}
    </div>
  )
}