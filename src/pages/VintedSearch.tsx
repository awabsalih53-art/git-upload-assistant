import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  searchVintedItems, 
  checkVintedApiHealth, 
  VINTED_DOMAINS,
  type VintedItem,
  type VintedSearchParams 
} from "@/lib/vinted-api";
import { 
  Search, 
  ExternalLink, 
  Heart, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Package,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function VintedSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useState<VintedSearchParams>({
    domain: 'fr',
    query: '',
    per_page: 20,
    page: 1,
    order: 'newest_first',
  });
  const [searchTrigger, setSearchTrigger] = useState(0);

  // Health check query
  const healthQuery = useQuery({
    queryKey: ['vinted-health'],
    queryFn: checkVintedApiHealth,
    staleTime: 60000,
  });

  // Search query - only runs when searchTrigger changes
  const searchQuery = useQuery({
    queryKey: ['vinted-search', searchParams, searchTrigger],
    queryFn: () => searchVintedItems(searchParams),
    enabled: searchTrigger > 0 && !!searchParams.query,
    staleTime: 30000,
  });

  const handleSearch = () => {
    if (!searchParams.query) {
      toast.error("Please enter a search term");
      return;
    }
    setSearchTrigger(prev => prev + 1);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleAddToInventory = (item: VintedItem) => {
    // Navigate to inventory form with pre-filled data
    const params = new URLSearchParams({
      item_name: item.title,
      brand: item.brand_title || '',
      size: item.size_title || '',
      platform: 'Vinted',
      vinted_url: item.url,
      photo_url: item.photo?.url || '',
    });
    navigate(`/inventory/new?${params.toString()}`);
    toast.success("Opening inventory form with Vinted item data");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Vinted Search</h1>
          <p className="text-muted-foreground">
            Search items on Vinted and add them to your inventory
          </p>
        </div>
        <div className="flex items-center gap-2">
          {healthQuery.isLoading ? (
            <Badge variant="secondary">
              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              Checking...
            </Badge>
          ) : healthQuery.data?.status === 'ok' ? (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              API Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              API Error
            </Badge>
          )}
        </div>
      </div>

      {/* Search Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Vinted
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="md:col-span-2">
              <Input
                placeholder="Search items (e.g., Nike Air Max, Vintage Levi's)..."
                value={searchParams.query}
                onChange={(e) => setSearchParams(prev => ({ ...prev, query: e.target.value }))}
                onKeyPress={handleKeyPress}
              />
            </div>
            <Select
              value={searchParams.domain}
              onValueChange={(value) => setSearchParams(prev => ({ ...prev, domain: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Country" />
              </SelectTrigger>
              <SelectContent>
                {VINTED_DOMAINS.map(domain => (
                  <SelectItem key={domain.code} value={domain.code}>
                    {domain.name} ({domain.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={searchParams.order}
              onValueChange={(value: any) => setSearchParams(prev => ({ ...prev, order: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest_first">Newest First</SelectItem>
                <SelectItem value="price_low_to_high">Price: Low to High</SelectItem>
                <SelectItem value="price_high_to_low">Price: High to Low</SelectItem>
                <SelectItem value="relevance">Relevance</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSearch} disabled={searchQuery.isLoading}>
              {searchQuery.isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Price filters */}
          <div className="grid gap-4 md:grid-cols-4 mt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Price:</span>
              <Input
                type="number"
                placeholder="Min"
                value={searchParams.price_from || ''}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  price_from: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="number"
                placeholder="Max"
                value={searchParams.price_to || ''}
                onChange={(e) => setSearchParams(prev => ({ 
                  ...prev, 
                  price_to: e.target.value ? parseInt(e.target.value) : undefined 
                }))}
                className="w-24"
              />
            </div>
            <Select
              value={searchParams.per_page?.toString() || '20'}
              onValueChange={(value) => setSearchParams(prev => ({ ...prev, per_page: parseInt(value) }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Results per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 items</SelectItem>
                <SelectItem value="20">20 items</SelectItem>
                <SelectItem value="48">48 items</SelectItem>
                <SelectItem value="96">96 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {searchQuery.isLoading && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-48 w-full rounded-t-lg" />
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {searchQuery.error && (
        <Card className="border-destructive">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h3 className="text-lg font-semibold mb-2">Search Failed</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery.error instanceof Error ? searchQuery.error.message : 'Unknown error occurred'}
            </p>
            <Button variant="outline" onClick={() => setSearchTrigger(prev => prev + 1)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {searchQuery.data && (
        <>
          {/* Results info */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {searchQuery.data.pagination ? (
                <>
                  Showing {searchQuery.data.items?.length || 0} of {searchQuery.data.pagination.total_entries} items
                  (Page {searchQuery.data.pagination.current_page} of {searchQuery.data.pagination.total_pages})
                </>
              ) : (
                <>Found {searchQuery.data.items?.length || 0} items</>
              )}
            </p>
            {searchQuery.data.pagination && searchQuery.data.pagination.total_pages > 1 && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={searchParams.page === 1}
                  onClick={() => {
                    setSearchParams(prev => ({ ...prev, page: (prev.page || 1) - 1 }));
                    setSearchTrigger(prev => prev + 1);
                  }}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={searchParams.page === searchQuery.data.pagination.total_pages}
                  onClick={() => {
                    setSearchParams(prev => ({ ...prev, page: (prev.page || 1) + 1 }));
                    setSearchTrigger(prev => prev + 1);
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Items grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {searchQuery.data.items?.map((item: VintedItem) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  {item.photo?.url ? (
                    <img
                      src={item.photo.url}
                      alt={item.title}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-48 w-full bg-muted flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                      <Heart className="h-3 w-3 mr-1" />
                      {item.favourite_count}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium line-clamp-2 mb-1" title={item.title}>
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {item.brand_title && (
                      <Badge variant="outline" className="text-xs">
                        {item.brand_title}
                      </Badge>
                    )}
                    {item.size_title && (
                      <Badge variant="outline" className="text-xs">
                        {item.size_title}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">
                      {item.price} {item.currency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      @{item.user?.login}
                    </span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => handleAddToInventory(item)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No results */}
          {(!searchQuery.data.items || searchQuery.data.items.length === 0) && (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Initial state */}
      {searchTrigger === 0 && !searchQuery.isLoading && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Start Searching</h3>
            <p className="text-muted-foreground">
              Enter a search term and click Search to find items on Vinted
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
