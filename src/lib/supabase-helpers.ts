import { supabase } from "@/integrations/supabase/client";

// Types based on the database schema
export interface InventoryItem {
  id: string;
  sku: string;
  item_name: string;
  category: string | null;
  size: string | null;
  condition: string | null;
  brand: string | null;
  platforms: string[] | null;
  listing_status: string;
  purchase_price: number;
  fees_estimate: number;
  shipping_paid_by: string;
  shipping_cost: number;
  sale_price: number | null;
  profit: number | null;
  roi_percent: number | null;
  date_purchased: string | null;
  date_listed: string | null;
  date_sold: string | null;
  storage_location: string | null;
  notes: string | null;
  photos: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  order_id: string;
  inventory_id: string | null;
  platform: string;
  item_name: string;
  sale_price: number;
  platform_fees: number;
  payment_processing_fees: number;
  shipping_cost: number;
  buyer_paid_shipping: boolean;
  net_profit: number | null;
  date_sold: string;
  date_shipped: string | null;
  tracking_number: string | null;
  payout_status: string;
  payout_date: string | null;
  buyer_name: string | null;
  buyer_address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Shipment {
  id: string;
  sale_id: string | null;
  carrier: string | null;
  tracking_number: string | null;
  label_cost: number;
  dispatch_deadline: string | null;
  status: string;
  shipped_date: string | null;
  delivered_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Return {
  id: string;
  sale_id: string | null;
  order_id: string | null;
  reason: string | null;
  status: string;
  date_opened: string;
  date_closed: string | null;
  expected_loss: number | null;
  actual_loss: number | null;
  resolution: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  completed_date: string | null;
  related_inventory_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
}

// Dashboard stats
export interface DashboardStats {
  inventory: {
    total: number;
    draft: number;
    listed: number;
    sold: number;
  };
  sales_30d: {
    total_sales: number;
    total_revenue: number;
    total_profit: number;
  };
  pending_shipments: number;
  open_returns: number;
  pending_tasks: number;
}

// Fetch dashboard stats
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [inventoryRes, salesRes, shipmentsRes, returnsRes, tasksRes] = await Promise.all([
    supabase.from("inventory").select("listing_status"),
    supabase.from("sales").select("sale_price, net_profit").gte("date_sold", thirtyDaysAgo.toISOString().split("T")[0]),
    supabase.from("shipments").select("id").in("status", ["Pending Label", "Label Created"]),
    supabase.from("returns").select("id").in("status", ["Opened", "In Progress"]),
    supabase.from("tasks").select("id").in("status", ["Todo", "In Progress"]),
  ]);

  const inventory = inventoryRes.data || [];
  const sales = salesRes.data || [];

  return {
    inventory: {
      total: inventory.length,
      draft: inventory.filter((i) => i.listing_status === "Draft").length,
      listed: inventory.filter((i) => i.listing_status === "Listed").length,
      sold: inventory.filter((i) => i.listing_status === "Sold").length,
    },
    sales_30d: {
      total_sales: sales.length,
      total_revenue: sales.reduce((sum, s) => sum + (Number(s.sale_price) || 0), 0),
      total_profit: sales.reduce((sum, s) => sum + (Number(s.net_profit) || 0), 0),
    },
    pending_shipments: shipmentsRes.data?.length || 0,
    open_returns: returnsRes.data?.length || 0,
    pending_tasks: tasksRes.data?.length || 0,
  };
}

// Fetch settings
export async function fetchSettings(): Promise<Record<string, string>> {
  const { data } = await supabase.from("settings").select("*");
  if (!data) return {};
  return data.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string>);
}

// Update setting
export async function updateSetting(key: string, value: string) {
  return supabase.from("settings").upsert({ key, value, updated_at: new Date().toISOString() });
}

// Generate SKU
export function generateSKU(prefix = "AWB"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Format currency
export function formatCurrency(amount: number | null | undefined, currency = "GBP"): string {
  if (amount === null || amount === undefined) return "£0.00";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

// Format date
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
