import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Truck, Package, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { StatCard } from "@/components/dashboard/StatCard";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency, formatDate, type Shipment, type Sale } from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

interface ShipmentWithSale extends Shipment {
  sales?: Sale | null;
}

const STATUSES = ["Pending Label", "Label Created", "Shipped", "In Transit", "Delivered", "Problem"];
const CARRIERS = ["Royal Mail", "Evri", "DPD", "Yodel", "UPS", "FedEx", "Other"];

export default function Shipping() {
  const [shipments, setShipments] = useState<ShipmentWithSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { toast } = useToast();

  useEffect(() => {
    loadShipments();
  }, [statusFilter]);

  async function loadShipments() {
    setLoading(true);
    let query = supabase.from("shipments").select("*, sales(*)").order("dispatch_deadline", { ascending: true });
    
    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error loading shipments:", error);
    } else {
      setShipments((data as ShipmentWithSale[]) || []);
    }
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === "Shipped") updates.shipped_date = new Date().toISOString().split("T")[0];
    if (status === "Delivered") updates.delivered_date = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("shipments").update(updates).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated", description: "Shipment status updated" });
      loadShipments();
    }
  }

  const filteredShipments = shipments.filter((s) =>
    s.tracking_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(search.toLowerCase()) ||
    (s.sales?.item_name?.toLowerCase() || "").includes(search.toLowerCase())
  );

  const pendingCount = shipments.filter((s) => s.status === "Pending Label" || s.status === "Label Created").length;
  const shippedCount = shipments.filter((s) => s.status === "Shipped" || s.status === "In Transit").length;
  const deliveredCount = shipments.filter((s) => s.status === "Delivered").length;
  const problemCount = shipments.filter((s) => s.status === "Problem").length;

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
          <h1 className="text-2xl font-bold tracking-tight">Shipping</h1>
          <p className="text-muted-foreground">{shipments.length} shipments</p>
        </div>
        <Button asChild className="gradient-header border-0">
          <Link to="/shipping/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Shipment
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard title="Pending" value={pendingCount} icon={Clock} variant="warning" />
        <StatCard title="Shipped" value={shippedCount} icon={Truck} variant="info" />
        <StatCard title="Delivered" value={deliveredCount} icon={Package} variant="success" />
        <StatCard title="Problems" value={problemCount} icon={AlertTriangle} variant="destructive" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by tracking, carrier, or item..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
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
          {filteredShipments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Carrier</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Deadline</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Label Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">
                      {shipment.sales?.item_name || "Unknown Item"}
                    </TableCell>
                    <TableCell>{shipment.carrier || "-"}</TableCell>
                    <TableCell className="font-mono text-sm">{shipment.tracking_number || "-"}</TableCell>
                    <TableCell>
                      {shipment.dispatch_deadline && (
                        <span className={new Date(shipment.dispatch_deadline) < new Date() && shipment.status !== "Delivered" ? "text-destructive font-medium" : ""}>
                          {formatDate(shipment.dispatch_deadline)}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={shipment.status} />
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(shipment.label_cost)}</TableCell>
                    <TableCell>
                      <Select value={shipment.status} onValueChange={(v) => updateStatus(shipment.id, v)}>
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
              <p className="text-muted-foreground mb-4">No shipments found</p>
              <Button asChild>
                <Link to="/shipping/new">Add Shipment</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
