import { useQuery } from "@tanstack/react-query";
import { fetchAdminOverviewFromBackend, fetchProviderHealthFromBackend } from "@/services/backendApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function SystemHealth() {
  const { data: overview, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: fetchAdminOverviewFromBackend });
  const {
    data: providerHealth,
    isLoading: providerLoading,
    isError: providerError,
  } = useQuery({ queryKey: ["provider-health"], queryFn: fetchProviderHealthFromBackend });
  const metrics = overview ? [
    { label: "Total Conversations", value: overview.total_conversations, unit: "", status: "healthy", trend: "up" as const },
    { label: "Total Messages", value: overview.total_messages, unit: "", status: "healthy", trend: "up" as const },
    { label: "AI Requests", value: overview.total_ai_requests, unit: "", status: "healthy", trend: "up" as const },
    { label: "Tool Executions", value: overview.total_tools_executed, unit: "", status: "healthy", trend: "up" as const },
    { label: "Tokens Used", value: overview.total_tokens_used, unit: "", status: "warning", trend: "up" as const },
    { label: "Active Users", value: overview.active_users, unit: "", status: "healthy", trend: "stable" as const },
    { label: "Suspended Users", value: overview.suspended_users, unit: "", status: "warning", trend: "stable" as const },
    { label: "Total Users", value: overview.total_users, unit: "", status: "healthy", trend: "stable" as const },
  ] : [];

  const statusColor = (s: string) => {
    if (s === "healthy") return "default";
    if (s === "warning") return "secondary";
    return "destructive";
  };

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <ArrowUp className="h-3 w-3 text-emerald-500" />;
    if (trend === "down") return <ArrowDown className="h-3 w-3 text-primary" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">System Health</h1>
        <p className="text-sm text-muted-foreground">Real-time infrastructure monitoring.</p>
      </div>
      <Card className="border-transparent card-elevated">
        <CardContent className="p-5">
          {providerLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">AI Provider Health</p>
                <p className="text-xs text-muted-foreground">
                  {providerError
                    ? "Provider health check failed. Verify backend/provider connectivity."
                    : providerHealth
                      ? `Provider: ${providerHealth.provider} | Model: ${providerHealth.model}`
                      : "Provider status is currently unavailable."}
                </p>
              </div>
              <Badge variant={providerError ? "destructive" : providerHealth ? "default" : "secondary"}>
                {providerError ? "unreachable" : providerHealth ? "reachable" : "unknown"}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics?.map((metric) => (
            <Card key={metric.label} className="border-transparent card-elevated">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground font-medium">{metric.label}</p>
                  <Badge variant={statusColor(metric.status)} className="capitalize text-xs">{metric.status}</Badge>
                </div>
                <div className="flex items-end gap-1.5">
                  <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                  <span className="text-sm text-muted-foreground mb-0.5">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <TrendIcon trend={metric.trend} />
                  <span className="text-xs text-muted-foreground capitalize">{metric.trend}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
