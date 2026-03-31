import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  clearTokens,
  deleteCurrentUserAccount,
  fetchCurrentUserProfile,
  updateCurrentUserProfile,
} from "@/services/backendApi";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const SETTINGS_PREFS_KEY = "dashboard_settings_prefs";

export default function DashboardSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [usageAlerts, setUsageAlerts] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["currentUserProfile"],
    queryFn: fetchCurrentUserProfile,
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setEmail(profile.email);
  }, [profile]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_PREFS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { emailNotifs?: boolean; usageAlerts?: boolean };
      if (typeof parsed.emailNotifs === "boolean") setEmailNotifs(parsed.emailNotifs);
      if (typeof parsed.usageAlerts === "boolean") setUsageAlerts(parsed.usageAlerts);
    } catch {
      // Ignore corrupted local preferences.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      SETTINGS_PREFS_KEY,
      JSON.stringify({ emailNotifs, usageAlerts }),
    );
  }, [emailNotifs, usageAlerts]);

  const profileDirty = useMemo(() => {
    if (!profile) return false;
    return name.trim() !== profile.name || email.trim() !== profile.email;
  }, [profile, name, email]);

  const saveProfileMutation = useMutation({
    mutationFn: () => updateCurrentUserProfile({ name: name.trim(), email: email.trim() }),
    onSuccess: () => {
      toast({ title: "Profile updated" });
    },
    onError: (error) => {
      toast({
        title: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: () => deleteCurrentUserAccount(),
    onSuccess: () => {
      clearTokens();
      toast({ title: "Account deleted" });
      navigate("/login", { replace: true });
    },
    onError: (error) => {
      toast({
        title: error instanceof Error ? error.message : "Failed to delete account",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
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
            <Input value={name} onChange={(e) => setName(e.target.value)} disabled={profileLoading} />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={email} readOnly disabled={profileLoading} />
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => saveProfileMutation.mutate()}
          disabled={profileLoading || saveProfileMutation.isPending || !profileDirty || !name.trim() || !email.trim()}
        >
          {saveProfileMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      {/* Plan */}
      <div className="rounded-2xl bg-card p-6 card-elevated border border-transparent space-y-3">
        <h2 className="font-display font-semibold text-card-foreground">Current Plan</h2>
        <div className="flex items-center gap-3">
          <Badge>Pro</Badge>
          <span className="text-sm text-muted-foreground">100,000 tokens/month</span>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate("/pricing")}>Upgrade Plan</Button>
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
        <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>Delete Account</Button>
      </div>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAccountMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteAccountMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
