import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { mockUser } from "@/services/mockApi";
import { Badge } from "@/components/ui/badge";

export default function DashboardSettings() {
  const { toast } = useToast();
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your account preferences.</p>
      </div>

      {/* Profile */}
      <div className="rounded-2xl bg-card p-6 card-elevated border border-transparent space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input defaultValue={mockUser.name} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input defaultValue={mockUser.email} />
          </div>
        </div>
        <Button size="sm" onClick={() => toast({ title: "Profile updated" })}>Save Changes</Button>
      </div>

      {/* Plan */}
      <div className="rounded-2xl bg-card p-6 card-elevated border border-transparent space-y-3">
        <h2 className="font-display font-semibold text-card-foreground">Current Plan</h2>
        <div className="flex items-center gap-3">
          <Badge>Pro</Badge>
          <span className="text-sm text-muted-foreground">100,000 tokens/month</span>
        </div>
        <Button variant="outline" size="sm">Upgrade Plan</Button>
      </div>

      {/* Notifications */}
      <div className="rounded-2xl bg-card p-6 card-elevated border border-transparent space-y-4">
        <h2 className="font-display font-semibold text-card-foreground">Notifications</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-card-foreground">Email notifications</p>
            <p className="text-xs text-muted-foreground">Receive updates via email</p>
          </div>
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-card-foreground">Usage alerts</p>
            <p className="text-xs text-muted-foreground">Get notified when approaching limits</p>
          </div>
          <Switch checked={usageAlerts} onCheckedChange={setUsageAlerts} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-2xl bg-card p-6 card-elevated border border-destructive/20 space-y-3">
        <h2 className="font-display font-semibold text-destructive">Danger Zone</h2>
        <p className="text-sm text-muted-foreground">Once deleted, your account cannot be recovered.</p>
        <Button variant="destructive" size="sm">Delete Account</Button>
      </div>
    </div>
  );
}
