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
import { type Return, type Sale } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";

const STATUSES = ["Opened", "In Progress", "Resolved", "Rejected"];

export default function ReturnsForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [formData, setFormData] = useState({
    sale_id: null as string | null,
    order_id: "",
    reason: "",
    status: "Opened",
    date_opened: new Date().toISOString().split("T")[0],
    expected_loss: null as number | null,
    actual_loss: null as number | null,
    resolution: "",
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    const { data: salesData } = await supabase.from("sales").select("*").order("date_sold", { ascending: false });
    setSales((salesData as Sale[]) || []);

    if (isEditing) {
      const { data, error } = await supabase.from("returns").select("*").eq("id", id).maybeSingle();
      if (error || !data) {
        toast({ title: "Error", description: "Return not found", variant: "destructive" });
        navigate("/returns");
        return;
      }
      const ret = data as Return;
      setFormData({
        sale_id: ret.sale_id,
        order_id: ret.order_id || "",
        reason: ret.reason || "",
        status: ret.status,
        date_opened: ret.date_opened,
        expected_loss: ret.expected_loss ? Number(ret.expected_loss) : null,
        actual_loss: ret.actual_loss ? Number(ret.actual_loss) : null,
        resolution: ret.resolution || "",
        notes: ret.notes || "",
      });
    }
  }

  function handleSaleSelect(saleId: string) {
    const sale = sales.find((s) => s.id === saleId);
    if (sale) {
      setFormData((prev) => ({
        ...prev,
        sale_id: saleId,
        order_id: sale.order_id,
      }));
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
      const result = await supabase.from("returns").update(payload).eq("id", id);
      error = result.error;
    } else {
      const result = await supabase.from("returns").insert([payload]);
      error = result.error;
    }

    setLoading(false);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Success", description: isEditing ? "Return updated" : "Return created" });
      navigate("/returns");
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this return?")) return;
    setLoading(true);
    const { error } = await supabase.from("returns").delete().eq("id", id);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: "Return removed" });
      navigate("/returns");
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/returns")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Return" : "Add Return"}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Return Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="sale_id">Linked Sale</Label>
                <Select value={formData.sale_id || ""} onValueChange={handleSaleSelect}>
                  <SelectTrigger><SelectValue placeholder="Select a sale" /></SelectTrigger>
                  <SelectContent>
                    {sales.map((sale) => (
                      <SelectItem key={sale.id} value={sale.id}>{sale.item_name} ({sale.order_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order_id">Order ID</Label>
                <Input
                  id="order_id"
                  value={formData.order_id}
                  onChange={(e) => setFormData({ ...formData, order_id: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="reason">Reason</Label>
              <Textarea
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="date_opened">Date Opened *</Label>
                <Input
                  id="date_opened"
                  type="date"
                  value={formData.date_opened}
                  onChange={(e) => setFormData({ ...formData, date_opened: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="expected_loss">Expected Loss (£)</Label>
                <Input
                  id="expected_loss"
                  type="number"
                  step="0.01"
                  value={formData.expected_loss || ""}
                  onChange={(e) => setFormData({ ...formData, expected_loss: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
              <div>
                <Label htmlFor="actual_loss">Actual Loss (£)</Label>
                <Input
                  id="actual_loss"
                  type="number"
                  step="0.01"
                  value={formData.actual_loss || ""}
                  onChange={(e) => setFormData({ ...formData, actual_loss: e.target.value ? parseFloat(e.target.value) : null })}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="resolution">Resolution</Label>
                <Input
                  id="resolution"
                  value={formData.resolution}
                  onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
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

        {/* Actions */}
        <div className="flex justify-between">
          {isEditing && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button type="button" variant="outline" onClick={() => navigate("/returns")}>
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
