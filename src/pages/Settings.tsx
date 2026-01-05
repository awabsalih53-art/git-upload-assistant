import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { fetchSettings, updateSetting } from "@/lib/supabase-helpers";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function Settings() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const data = await fetchSettings();
    setSettings(data);
    setLoading(false);
  }

  function handleChange(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await Promise.all(
        Object.entries(settings).map(([key, value]) => updateSetting(key, value))
      );
      toast({ title: "Settings saved", description: "Your settings have been updated." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage your reselling dashboard preferences</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gradient-header border-0">
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic application settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="app_name">App Name</Label>
              <Input
                id="app_name"
                value={settings.app_name || "Awab Reselling Dashboard"}
                onChange={(e) => handleChange("app_name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={settings.currency || "GBP"} onValueChange={(v) => handleChange("currency", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GBP">GBP (£)</SelectItem>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="EUR">EUR (€)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default_shipping_buyer">Default Shipping</Label>
              <Select 
                value={settings.default_shipping_buyer || "true"} 
                onValueChange={(v) => handleChange("default_shipping_buyer", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Buyer Pays</SelectItem>
                  <SelectItem value="false">Seller Pays</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Platform Fees */}
        <Card>
          <CardHeader>
            <CardTitle>Platform Fees</CardTitle>
            <CardDescription>Default fee percentages for each platform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="vinted_fee_percent">Vinted Fee (%)</Label>
              <Input
                id="vinted_fee_percent"
                type="number"
                step="0.1"
                value={settings.vinted_fee_percent || "5.0"}
                onChange={(e) => handleChange("vinted_fee_percent", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="ebay_fee_percent">eBay Fee (%)</Label>
              <Input
                id="ebay_fee_percent"
                type="number"
                step="0.1"
                value={settings.ebay_fee_percent || "12.8"}
                onChange={(e) => handleChange("ebay_fee_percent", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="depop_fee_percent">Depop Fee (%)</Label>
              <Input
                id="depop_fee_percent"
                type="number"
                step="0.1"
                value={settings.depop_fee_percent || "10.0"}
                onChange={(e) => handleChange("depop_fee_percent", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="paypal_fee_percent">PayPal/Payment Fee (%)</Label>
              <Input
                id="paypal_fee_percent"
                type="number"
                step="0.1"
                value={settings.paypal_fee_percent || "3.4"}
                onChange={(e) => handleChange("paypal_fee_percent", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>About</CardTitle>
            <CardDescription>Application information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Version</p>
                <p className="text-2xl font-bold text-gradient">{settings.app_version || "2.0.0"}</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Platform</p>
                <p className="text-2xl font-bold">Lovable Cloud</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Framework</p>
                <p className="text-2xl font-bold">React + Vite</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
