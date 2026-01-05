import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Download, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, type Sale } from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { PoundSterling, ShoppingBag, Percent } from "lucide-react";

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  useEffect(() => {
    loadSales();
  }, [platformFilter]);

  async function loadSales() {
    setLoading(true);
    let query = supabase.from("sales").select("*").order("date_sold", { ascending: false });
    
    if (platformFilter !== "all") {
      query = query.eq("platform", platformFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading sales:", error);
    } else {
      setSales((data as Sale[]) || []);
    }
    setLoading(false);
  }

  const filteredSales = sales.filter((sale) =>
    sale.item_name.toLowerCase().includes(search.toLowerCase()) ||
    sale.order_id.toLowerCase().includes(search.toLowerCase())
  );

  const totalRevenue = filteredSales.reduce((sum, s) => sum + Number(s.sale_price), 0);
  const totalProfit = filteredSales.reduce((sum, s) => sum + (Number(s.net_profit) || 0), 0);
  const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  const exportToCSV = () => {
    const headers = ["Order ID", "Item", "Platform", "Sale Price", "Profit", "Date Sold", "Payout Status"];
    const csvData = filteredSales.map((sale) => [
      sale.order_id,
      sale.item_name,
      sale.platform,
      sale.sale_price,
      sale.net_profit || "",
      sale.date_sold,
      sale.payout_status,
    ]);
    
    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
          <h1 className="text-2xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">{sales.length} total sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild className="gradient-header border-0">
            <Link to="/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              Record Sale
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={PoundSterling} variant="primary" />
        <StatCard title="Total Profit" value={formatCurrency(totalProfit)} icon={TrendingUp} variant="success" />
        <StatCard title="Avg. Margin" value={`${avgMargin.toFixed(1)}%`} icon={Percent} variant="info" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by item or order ID..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                <SelectItem value="Vinted">Vinted</SelectItem>
                <SelectItem value="eBay">eBay</SelectItem>
                <SelectItem value="Depop">Depop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Sale Price</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead>Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((sale) => (
                  <TableRow key={sale.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-mono text-sm">{sale.order_id}</TableCell>
                    <TableCell>
                      <Link to={`/sales/${sale.id}`} className="font-medium hover:text-primary">
                        {sale.item_name}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.platform} />
                    </TableCell>
                    <TableCell>{formatDate(sale.date_sold)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(sale.sale_price)}</TableCell>
                    <TableCell className={`text-right font-medium ${sale.net_profit && sale.net_profit > 0 ? "text-success" : "text-destructive"}`}>
                      {formatCurrency(sale.net_profit)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={sale.payout_status} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No sales recorded yet</p>
              <Button asChild>
                <Link to="/sales/new">Record First Sale</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
