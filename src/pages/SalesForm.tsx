import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { type Sale, type InventoryItem, fetchSettings } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["Vinted", "eBay", "Depop"];
const PAYOUT_STATUSES = ["Pending", "Processing", "Paid", "On Hold"];

export default function SalesForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    order_id: `ORD-${Date.now().toString(36).toUpperCase()}`,
    inventory_id: null as string | null,
    platform: "Vinted",
    item_name: "",
    sale_price: 0,
    platform_fees: 0,
    payment_processing_fees: 0,
    shipping_cost: 0,
    buyer_paid_shipping: true,
    date_sold: new Date().toISOString().split("T")[0],
    tracking_number: "",
    payout_status: "Pending",
    buyer_name: "",
    buyer_address: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const [settingsData, inventoryRes] = await Promise.all([
      fetchSettings(),
      supabase.from("inventory").select("*").in("listing_status", ["Listed", "Sold"]).order("item_name"),
    ]);
    
    setSettings(settingsData);
    setInventoryItems((inventoryRes.data as InventoryItem[]) || []);

    if (isEditing) {
      const { data, error } = await supabase.from("sales").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast({ title: "Error", description: "Sale not found", variant: "destructive" });
        navigate("/sales");
        return;
      }
      const sale = data as Sale;
      setFormData({
        order_id: sale.order_id,
        inventory_id: sale.inventory_id,
        platform: sale.platform,
        item_name: sale.item_name,
        sale_price: Number(sale.sale_price),
        platform_fees: Number(sale.platform_fees),
        payment_processing_fees: Number(sale.payment_processing_fees),
        shipping_cost: Number(sale.shipping_cost),
        buyer_paid_shipping: sale.buyer_paid_shipping,
        date_sold: sale.date_sold,
        tracking_number: sale.tracking_number || "",
        payout_status: sale.payout_status,
        buyer_name: sale.buyer_name || "",
        buyer_address: sale.buyer_address || "",
        notes: sale.notes || "",
      });
    }
  }

  // Calculate fees based on platform
  function calculateFees(platform: string, salePrice: number) {
    const feeKey = `${platform.toLowerCase()}_fee_percent`;
    const feePercent = parseFloat(settings[feeKey] || "0");
    const paypalPercent = parseFloat(settings.paypal_fee_percent || "3.4");
    
    return {
      platform_fees: (salePrice * feePercent) / 100,
      payment_processing_fees: (salePrice * paypalPercent) / 100,
    };
  }

  // Update fees when platform or price changes
  useEffect(() => {
    if (formData.sale_price > 0) {
      const fees = calculateFees(formData.platform, formData.sale_price);
      setFormData((prev) => ({ ...prev, ...fees }));
    }
  }, [formData.platform, formData.sale_price, settings]);

  // Calculate net profit
  const netProfit = formData.sale_price - formData.platform_fees - formData.payment_processing_fees - 
    (formData.buyer_paid_shipping ? 0 : formData.shipping_cost);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      net_profit: netProfit,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEditing) {
      const result = await supabase.from("sales").update(payload).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("sales").insert([payload]);
      error = result.error;

      // Update inventory status to Sold if linked
      if (!error && formData.inventory_id) {
        await supabase.from("inventory").update({ 
          listing_status: "Sold", 
          date_sold: formData.date_sold,
          sale_price: formData.sale_price,
          profit: netProfit,
        }).eq("id", formData.inventory_id);
      }
    }

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: isEditing ? "Sale updated" : "Sale recorded" });
      navigate("/sales");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this sale?")) return;
    setLoading(true);
    const { error } = await supabase.from("sales").delete().eq("id", id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Sale removed" });
      navigate("/sales");
    }
  }

  // Handle inventory selection
  function handleInventorySelect(inventoryId: string) {
    const item = inventoryItems.find((i) => i.id === inventoryId);
    if (item) {
      setFormData((prev) => ({
        ...prev,
        inventory_id: inventoryId,
        item_name: item.item_name,
      }));
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/sales")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Sale" : "Record Sale"}</h1>
          <p className="text-muted-foreground">Order: {formData.order_id}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Item Info */}
          <Card>
            <CardHeader>
              <CardTitle>Item Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inventory_id">Link to Inventory (optional)</Label>
                <Select value={formData.inventory_id || ""} onValueChange={handleInventorySelect}>
                  <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                  <SelectContent>
                    {inventoryItems.map((item) => (
                      <SelectItem key={item.id} value={item.id}>{item.item_name} ({item.sku})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="item_name">Item Name *</Label>
                <Input
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="platform">Platform *</Label>
                  <Select value={formData.platform} onValueChange={(v) => setFormData({ ...formData, platform: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date_sold">Date Sold *</Label>
                  <Input
                    id="date_sold"
                    type="date"
                    value={formData.date_sold}
                    onChange={(e) => setFormData({ ...formData, date_sold: e.target.value })}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Fees</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="sale_price">Sale Price (£) *</Label>
                <Input
                  id="sale_price"
                  type="number"
                  step="0.01"
                  value={formData.sale_price}
                  onChange={(e) => setFormData({ ...formData, sale_price: parseFloat(e.target.value) || 0 })}
                  required
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="platform_fees">Platform Fees (£)</Label>
                  <Input
                    id="platform_fees"
                    type="number"
                    step="0.01"
                    value={formData.platform_fees.toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, platform_fees: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="payment_processing_fees">Payment Fees (£)</Label>
                  <Input
                    id="payment_processing_fees"
                    type="number"
                    step="0.01"
                    value={formData.payment_processing_fees.toFixed(2)}
                    onChange={(e) => setFormData({ ...formData, payment_processing_fees: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shipping_cost">Shipping Cost (£)</Label>
                  <Input
                    id="shipping_cost"
                    type="number"
                    step="0.01"
                    value={formData.shipping_cost}
                    onChange={(e) => setFormData({ ...formData, shipping_cost: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={formData.buyer_paid_shipping}
                      onCheckedChange={(checked) => setFormData({ ...formData, buyer_paid_shipping: checked as boolean })}
                    />
                    <span className="text-sm">Buyer paid shipping</span>
                  </label>
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Net Profit:</span>
                  <span className={`text-xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                    £{netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping & Payout */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Shipping & Payout</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="tracking_number">Tracking Number</Label>
                  <Input
                    id="tracking_number"
                    value={formData.tracking_number}
                    onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="payout_status">Payout Status</Label>
                  <Select value={formData.payout_status} onValueChange={(v) => setFormData({ ...formData, payout_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAYOUT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="buyer_name">Buyer Name</Label>
                  <Input
                    id="buyer_name"
                    value={formData.buyer_name}
                    onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => navigate("/sales")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-header border-0">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update" : "Save"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
