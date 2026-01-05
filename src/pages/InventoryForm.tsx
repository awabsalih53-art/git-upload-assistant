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
import { generateSKU, type InventoryItem } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";

const CONDITIONS = ["New", "Like New", "Good", "Fair", "Poor"];
const STATUSES = ["Draft", "Listed", "Sold", "Returned", "Archived"];
const PLATFORMS = ["Vinted", "eBay", "Depop"];
const CATEGORIES = ["Footwear", "Outerwear", "Tops", "Bottoms", "Dresses", "Accessories", "Bags", "Other"];

export default function InventoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    sku: generateSKU(),
    item_name: "",
    category: "",
    size: "",
    condition: "Good",
    brand: "",
    platforms: [] as string[],
    listing_status: "Draft",
    purchase_price: 0,
    fees_estimate: 0,
    shipping_paid_by: "Buyer",
    shipping_cost: 0,
    sale_price: null as number | null,
    date_purchased: "",
    date_listed: "",
    storage_location: "",
    notes: "",
  });

  useEffect(() => {
    if (isEditing) {
      loadItem();
    }
  }, [id]);

  async function loadItem() {
    const { data, error } = await supabase.from("inventory").select("*").eq("id", id).maybeSingle();
    if (error || !data) {
      toast({ title: "Error", description: "Item not found", variant: "destructive" });
      navigate("/inventory");
      return;
    }
    const item = data as InventoryItem;
    setFormData({
      sku: item.sku,
      item_name: item.item_name,
      category: item.category || "",
      size: item.size || "",
      condition: item.condition || "Good",
      brand: item.brand || "",
      platforms: item.platforms || [],
      listing_status: item.listing_status,
      purchase_price: Number(item.purchase_price) || 0,
      fees_estimate: Number(item.fees_estimate) || 0,
      shipping_paid_by: item.shipping_paid_by,
      shipping_cost: Number(item.shipping_cost) || 0,
      sale_price: item.sale_price ? Number(item.sale_price) : null,
      date_purchased: item.date_purchased || "",
      date_listed: item.date_listed || "",
      storage_location: item.storage_location || "",
      notes: item.notes || "",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      sale_price: formData.sale_price || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEditing) {
      const result = await supabase.from("inventory").update(payload).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("inventory").insert([payload]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: isEditing ? "Item updated" : "Item created" });
      navigate("/inventory");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    const { error } = await supabase.from("inventory").delete().eq("id", id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Item removed" });
      navigate("/inventory");
    }
  }

  const togglePlatform = (platform: string) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/inventory")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Item" : "Add Item"}</h1>
          <p className="text-muted-foreground">SKU: {formData.sku}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
                  <Label htmlFor="category">Category</Label>
                  <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input id="size" value={formData.size} onChange={(e) => setFormData({ ...formData, size: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="condition">Condition</Label>
                  <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITIONS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Platforms</Label>
                <div className="flex gap-4 mt-2">
                  {PLATFORMS.map((platform) => (
                    <label key={platform} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.platforms.includes(platform)}
                        onCheckedChange={() => togglePlatform(platform)}
                      />
                      <span className="text-sm">{platform}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="listing_status">Status</Label>
                <Select value={formData.listing_status} onValueChange={(v) => setFormData({ ...formData, listing_status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="purchase_price">Purchase Price (£)</Label>
                  <Input
                    id="purchase_price"
                    type="number"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => setFormData({ ...formData, purchase_price: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="sale_price">Sale Price (£)</Label>
                  <Input
                    id="sale_price"
                    type="number"
                    step="0.01"
                    value={formData.sale_price || ""}
                    onChange={(e) => setFormData({ ...formData, sale_price: e.target.value ? parseFloat(e.target.value) : null })}
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="fees_estimate">Fees Estimate (£)</Label>
                  <Input
                    id="fees_estimate"
                    type="number"
                    step="0.01"
                    value={formData.fees_estimate}
                    onChange={(e) => setFormData({ ...formData, fees_estimate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
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
              </div>
              <div>
                <Label htmlFor="shipping_paid_by">Shipping Paid By</Label>
                <Select value={formData.shipping_paid_by} onValueChange={(v) => setFormData({ ...formData, shipping_paid_by: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buyer">Buyer</SelectItem>
                    <SelectItem value="Seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Dates & Notes */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="date_purchased">Date Purchased</Label>
                  <Input
                    id="date_purchased"
                    type="date"
                    value={formData.date_purchased}
                    onChange={(e) => setFormData({ ...formData, date_purchased: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_listed">Date Listed</Label>
                  <Input
                    id="date_listed"
                    type="date"
                    value={formData.date_listed}
                    onChange={(e) => setFormData({ ...formData, date_listed: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="storage_location">Storage Location</Label>
                  <Input
                    id="storage_location"
                    value={formData.storage_location}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
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
            <Button type="button" variant="outline" onClick={() => navigate("/inventory")}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gradient-header border-0">
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update" : "Create"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
