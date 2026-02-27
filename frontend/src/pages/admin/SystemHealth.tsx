import { useQuery } from "@tanstack/react-query";
import { fetchSystemMetrics } from "@/services/adminMockApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";

export default function SystemHealth() {
  const { data: metrics, isLoading } = useQuery({ queryKey: ["system-metrics"], queryFn: fetchSystemMetrics });

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
