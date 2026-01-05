import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, type Return, type Sale } from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ReturnWithSale extends Return {
  sales?: Sale | null;
}

const STATUSES = ["Opened", "In Progress", "Resolved", "Rejected"];

export default function Returns() {
  const [returns, setReturns] = useState<ReturnWithSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadReturns();
  }, [statusFilter]);

  async function loadReturns() {
    setLoading(true);
    let query = supabase.from("returns").select("*, sales(*)").order("date_opened", { ascending: false });
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading returns:", error);
    } else {
      setReturns((data as ReturnWithSale[]) || []);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "Resolved" || status === "Rejected") {
      updates.date_closed = new Date().toISOString().split("T")[0];
    }

    const { error } = await supabase.from("returns").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Return status updated" });
      loadReturns();
    }
  }

  const filteredReturns = returns.filter((r) =>
    r.order_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.reason?.toLowerCase().includes(search.toLowerCase()) ||
    (r.sales?.item_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const openedCount = returns.filter((r) => r.status === "Opened").length;
  const inProgressCount = returns.filter((r) => r.status === "In Progress").length;
  const resolvedCount = returns.filter((r) => r.status === "Resolved").length;
  const rejectedCount = returns.filter((r) => r.status === "Rejected").length;

  const totalLoss = returns
    .filter((r) => r.status === "Resolved")
    .reduce((sum, r) => sum + (Number(r.actual_loss) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
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
          <h1 className="text-2xl font-bold tracking-tight">Returns</h1>
          <p className="text-muted-foreground">{returns.length} return cases</p>
        </div>
        <Button asChild className="gradient-header border-0">
          <Link to="/returns/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Return
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Opened" value={openedCount} icon={AlertCircle} variant="warning" />
        <StatCard title="In Progress" value={inProgressCount} icon={Clock} variant="info" />
        <StatCard title="Resolved" value={resolvedCount} icon={CheckCircle} variant="success" />
        <StatCard title="Rejected" value={rejectedCount} icon={XCircle} variant="destructive" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by order ID or reason..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredReturns.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead className="text-right">Expected Loss</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReturns.map((ret) => (
                  <TableRow key={ret.id}>
                    <TableCell className="font-mono text-sm">{ret.order_id || "-"}</TableCell>
                    <TableCell className="font-medium">{ret.sales?.item_name || "Unknown"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{ret.reason || "-"}</TableCell>
                    <TableCell>{formatDate(ret.date_opened)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">
                      {ret.expected_loss ? formatCurrency(ret.expected_loss) : "-"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ret.status} />
                    </TableCell>
                    <TableCell>
                      <Select value={ret.status} onValueChange={(v) => updateStatus(ret.id, v)}>
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No return cases</p>
              <Button asChild>
                <Link to="/returns/new">Add Return</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
