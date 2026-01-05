import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Package, FileEdit, PoundSterling, Truck, RotateCcw, CheckSquare, Plus, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { KPICard } from "@/components/dashboard/KPICard";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { fetchDashboardStats, formatCurrency, formatDate, type DashboardStats, type Sale, type Task, type InventoryItem } from "@/lib/supabase-helpers";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [pendingTasks, setPendingTasks] = useState<Task[]>([]);
  const [recentInventory, setRecentInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, salesRes, tasksRes, inventoryRes] = await Promise.all([
          fetchDashboardStats(),
          supabase.from("sales").select("*").order("date_sold", { ascending: false }).limit(5),
          supabase.from("tasks").select("*").in("status", ["Todo", "In Progress"]).order("due_date", { ascending: true }).limit(5),
          supabase.from("inventory").select("*").order("created_at", { ascending: false }).limit(6),
        ]);

        setStats(statsData);
        setRecentSales((salesRes.data as Sale[]) || []);
        setPendingTasks((tasksRes.data as Task[]) || []);
        setRecentInventory((inventoryRes.data as InventoryItem[]) || []);
      } catch (error) {
        console.error("Error loading dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your reselling overview.</p>
        </div>
        <Button asChild className="gradient-header border-0">
          <Link to="/inventory/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="Active Listings"
          value={stats?.inventory.listed || 0}
          subtitle="Currently listed for sale"
          icon={Package}
          variant="primary"
        />
        <KPICard
          title="Drafts"
          value={stats?.inventory.draft || 0}
          subtitle="Items ready to list"
          icon={FileEdit}
          variant="warning"
        />
        <KPICard
          title="Profit (30d)"
          value={formatCurrency(stats?.sales_30d.total_profit)}
          subtitle={`${stats?.sales_30d.total_sales || 0} sales`}
          icon={PoundSterling}
          variant="success"
        />
        <KPICard
          title="To Ship"
          value={stats?.pending_shipments || 0}
          subtitle="Orders awaiting dispatch"
          icon={Truck}
          variant="info"
        />
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Total Inventory"
          value={stats?.inventory.total || 0}
          icon={Package}
          variant="primary"
        />
        <StatCard
          title="Open Returns"
          value={stats?.open_returns || 0}
          icon={RotateCcw}
          variant="destructive"
        />
        <StatCard
          title="Pending Tasks"
          value={stats?.pending_tasks || 0}
          icon={CheckSquare}
          variant="default"
        />
      </div>

      {/* Recent Sales & Pending Tasks */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PoundSterling className="h-4 w-4 text-success" />
              Recent Sales
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/sales" className="text-primary">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{sale.item_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={sale.platform} />
                        <span className="text-xs text-muted-foreground">{formatDate(sale.date_sold)}</span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">{formatCurrency(sale.sale_price)}</p>
                      <p className="text-sm text-success font-medium">{formatCurrency(sale.net_profit)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No sales yet</p>
                <Button asChild size="sm">
                  <Link to="/sales/new">Record First Sale</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <CheckSquare className="h-4 w-4 text-primary" />
              Pending Tasks
            </CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/tasks" className="text-primary">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {pendingTasks.length > 0 ? (
              <div className="space-y-3">
                {pendingTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/50">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-muted-foreground mt-1">Due: {formatDate(task.due_date)}</p>
                      )}
                    </div>
                    <StatusBadge status={task.priority} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-muted-foreground mb-4">No pending tasks</p>
                <Button asChild size="sm">
                  <Link to="/tasks">Create Task</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Inventory */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Package className="h-4 w-4 text-primary" />
            Recent Inventory
          </CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/inventory" className="text-primary">
              View All <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentInventory.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {recentInventory.map((item) => (
                <Link 
                  key={item.id} 
                  to={`/inventory/${item.id}`}
                  className="group rounded-lg border p-4 transition-all hover:border-primary/50 hover:shadow-md"
                >
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                    {item.item_name}
                  </h3>
                  <div className="mt-2 space-y-1">
                    <StatusBadge status={item.listing_status} />
                    <p className="font-semibold">{formatCurrency(item.purchase_price)}</p>
                    <p className="text-xs text-muted-foreground">{item.brand || "No brand"}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-muted-foreground mb-4">No inventory items yet</p>
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
