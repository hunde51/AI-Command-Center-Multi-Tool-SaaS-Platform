import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchFeatureFlags, toggleFeatureFlag } from "@/services/adminMockApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { FeatureFlag } from "@/types";

export default function FeatureFlags() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: flags, isLoading } = useQuery({ queryKey: ["feature-flags"], queryFn: fetchFeatureFlags });

  const mutation = useMutation({
    mutationFn: toggleFeatureFlag,
    onSuccess: (updated) => {
      queryClient.setQueryData<FeatureFlag[]>(["feature-flags"], (old) =>
        old?.map(f => f.id === updated.id ? updated : f)
      );
      toast({ title: `${updated.name} ${updated.enabled ? "enabled" : "disabled"}` });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Feature Flags</h1>
        <p className="text-sm text-muted-foreground">Toggle features across the platform.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : (
        <div className="grid gap-3">
          {flags?.map((flag) => (
            <Card key={flag.id} className="border-transparent card-elevated">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{flag.name}</h3>
                    <Badge variant="secondary" className="capitalize">{flag.scope}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{flag.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Last modified: {flag.lastModified}</p>
                </div>
                <Switch
                  checked={flag.enabled}
                  onCheckedChange={() => mutation.mutate(flag.id)}
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
