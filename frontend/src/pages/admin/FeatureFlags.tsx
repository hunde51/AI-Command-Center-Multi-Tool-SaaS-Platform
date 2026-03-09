import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminFeatureFlags, updateAdminFeatureFlag } from "@/services/backendApi";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function FeatureFlags() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: flags, isLoading } = useQuery({
    queryKey: ["admin-feature-flags"],
    queryFn: fetchAdminFeatureFlags,
  });
  const mutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => updateAdminFeatureFlag(key, enabled),
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-feature-flags"] });
      toast({ title: `${updated.name} ${updated.enabled ? "enabled" : "disabled"}` });
    },
    onError: (error) => {
      toast({
        title: error instanceof Error ? error.message : "Failed to update feature flag",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">Enable and disable experimental features safely.</p>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {flags?.map((flag) => (
            <Card key={flag.key} className="border-transparent card-elevated">
              <CardContent className="p-5 flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-foreground">{flag.name}</h3>
                    <Badge variant="secondary">{flag.category}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <p className="text-xs text-muted-foreground">Key: {flag.key}</p>
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={(value) => mutation.mutate({ key: flag.key, enabled: value })}
                  disabled={mutation.isPending}
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
