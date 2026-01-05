import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { type Shipment, type Sale } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["Pending Label", "Label Created", "Shipped", "In Transit", "Delivered", "Problem"];
const CARRIERS = ["Royal Mail", "Evri", "DPD", "Yodel", "UPS", "FedEx", "Other"];

export default function ShippingForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [formData, setFormData] = useState({
    sale_id: null as string | null,
    carrier: "",
    tracking_number: "",
    label_cost: 0,
    dispatch_deadline: "",
    status: "Pending Label",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: salesData } = await supabase.from("sales").select("*").order("date_sold", { ascending: false });
    setSales((salesData as Sale[]) || []);

    if (isEditing) {
      const { data, error } = await supabase.from("shipments").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast({ title: "Error", description: "Shipment not found", variant: "destructive" });
        navigate("/shipping");
        return;
      }
      const shipment = data as Shipment;
      setFormData({
        sale_id: shipment.sale_id,
        carrier: shipment.carrier || "",
        tracking_number: shipment.tracking_number || "",
        label_cost: Number(shipment.label_cost) || 0,
        dispatch_deadline: shipment.dispatch_deadline || "",
        status: shipment.status,
        notes: shipment.notes || "",
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...formData,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (isEditing) {
      const result = await supabase.from("shipments").update(payload).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("shipments").insert([payload]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: isEditing ? "Shipment updated" : "Shipment created" });
      navigate("/shipping");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this shipment?")) return;
    setLoading(true);
    const { error } = await supabase.from("shipments").delete().eq("id", id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Shipment removed" });
      navigate("/shipping");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/shipping")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Shipment" : "Add Shipment"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Shipment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="sale_id">Linked Sale</Label>
              <Select value={formData.sale_id || ""} onValueChange={(v) => setFormData({ ...formData, sale_id: v })}>
                <SelectTrigger><SelectValue placeholder="Select a sale" /></SelectTrigger>
                <SelectContent>
                  {sales.map((sale) => (
                    <SelectItem key={sale.id} value={sale.id}>{sale.item_name} ({sale.order_id})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="carrier">Carrier</Label>
                <Select value={formData.carrier} onValueChange={(v) => setFormData({ ...formData, carrier: v })}>
                  <SelectTrigger><SelectValue placeholder="Select carrier" /></SelectTrigger>
                  <SelectContent>
                    {CARRIERS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tracking_number">Tracking Number</Label>
                <Input
                  id="tracking_number"
                  value={formData.tracking_number}
                  onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="label_cost">Label Cost (£)</Label>
                <Input
                  id="label_cost"
                  type="number"
                  step="0.01"
                  value={formData.label_cost}
                  onChange={(e) => setFormData({ ...formData, label_cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label htmlFor="dispatch_deadline">Dispatch Deadline</Label>
                <Input
                  id="dispatch_deadline"
                  type="date"
                  value={formData.dispatch_deadline}
                  onChange={(e) => setFormData({ ...formData, dispatch_deadline: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
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

        {/* Actions */}
        <div className="flex justify-between">
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => navigate("/shipping")}>
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
