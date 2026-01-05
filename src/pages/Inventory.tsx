import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Filter, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, type InventoryItem } from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    loadItems();
  }, [statusFilter]);

  async function loadItems() {
    setLoading(true);
    let query = supabase.from("inventory").select("*").order("created_at", { ascending: false });
    
    if (statusFilter !== "all") {
      query = query.eq("listing_status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading inventory:", error);
    } else {
      setItems((data as InventoryItem[]) || []);
    }
    setLoading(false);
  }

  const filteredItems = items.filter((item) =>
    item.item_name.toLowerCase().includes(search.toLowerCase()) ||
    item.sku.toLowerCase().includes(search.toLowerCase()) ||
    (item.brand?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ["SKU", "Name", "Brand", "Status", "Purchase Price", "Sale Price", "Profit"];
    const csvData = filteredItems.map((item) => [
      item.sku,
      item.item_name,
      item.brand || "",
      item.listing_status,
      item.purchase_price,
      item.sale_price || "",
      item.profit || "",
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">{items.length} items total</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild className="gradient-header border-0">
            <Link to="/inventory/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, SKU, or brand..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Listed">Listed</SelectItem>
                <SelectItem value="Sold">Sold</SelectItem>
                <SelectItem value="Returned">Returned</SelectItem>
                <SelectItem value="Archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredItems.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                    <TableCell>
                      <Link to={`/inventory/${item.id}`} className="font-medium hover:text-primary">
                        {item.item_name}
                      </Link>
                      <p className="text-xs text-muted-foreground">{item.category}</p>
                    </TableCell>
                    <TableCell>{item.brand || "-"}</TableCell>
                    <TableCell>
                      <StatusBadge status={item.listing_status} />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.purchase_price)}</TableCell>
                    <TableCell className="text-right">{item.sale_price ? formatCurrency(item.sale_price) : "-"}</TableCell>
                    <TableCell className={`text-right font-medium ${item.profit && item.profit > 0 ? "text-success" : ""}`}>
                      {item.profit ? formatCurrency(item.profit) : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No inventory items found</p>
              <Button asChild>
                <Link to="/inventory/new">Add First Item</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
