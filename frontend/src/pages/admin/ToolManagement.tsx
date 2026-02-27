import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchAdminTools, toggleToolStatus } from "@/services/adminMockApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { AdminTool } from "@/types";

export default function ToolManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: tools, isLoading } = useQuery({ queryKey: ["admin-tools"], queryFn: fetchAdminTools });

  const mutation = useMutation({
    mutationFn: toggleToolStatus,
    onSuccess: (updatedTool) => {
      queryClient.setQueryData<AdminTool[]>(["admin-tools"], (old) =>
        old?.map(t => t.id === updatedTool.id ? updatedTool : t)
      );
      toast({ title: `${updatedTool.name} ${updatedTool.enabled ? "enabled" : "disabled"}` });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tool Management</h1>
        <p className="text-sm text-muted-foreground">Enable, disable, and monitor AI tools.</p>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <div className="grid gap-4">
          {tools?.map((tool) => (
            <Card key={tool.id} className="border-transparent card-elevated">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{tool.name}</h3>
                    <Badge variant="secondary">{tool.category}</Badge>
                    {!tool.enabled && <Badge variant="destructive">Disabled</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{tool.usageCount.toLocaleString()} uses</span>
                    <span>Avg {tool.avgResponseTime}s</span>
                    <span>Error rate: {tool.errorRate}%</span>
                  </div>
                </div>
                <Switch
                  checked={tool.enabled}
                  onCheckedChange={() => mutation.mutate(tool.id)}
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
