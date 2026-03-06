import { Card, CardContent } from "@/components/ui/card";

export default function FeatureFlags() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">Feature flags backend is not implemented in current phases.</p>
      </div>
      <Card className="border-transparent card-elevated">
        <CardContent className="p-5 text-sm text-muted-foreground">
          No `/admin/feature-flags` API exists yet. This page is intentionally read-only placeholder until that backend module is added.
        </CardContent>
      </Card>
    </div>
  );
}
