import { useQuery } from "@tanstack/react-query";
import { fetchAdminUsers, fetchSystemMetrics, fetchAdminDailyUsage } from "@/services/adminMockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, Zap, AlertTriangle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminOverview() {
  const { data: users, isLoading: loadingUsers } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const { data: metrics, isLoading: loadingMetrics } = useQuery({ queryKey: ["system-metrics"], queryFn: fetchSystemMetrics });
  const { data: usage, isLoading: loadingUsage } = useQuery({ queryKey: ["admin-daily-usage"], queryFn: fetchAdminDailyUsage });

  const activeUsers = users?.filter(u => u.status === "active").length ?? 0;
  const totalTokens = users?.reduce((sum, u) => sum + u.tokensUsed, 0) ?? 0;

  const summaryCards = [
    { label: "Total Users", value: users?.length ?? 0, icon: Users, color: "text-primary" },
    { label: "Active Users", value: activeUsers, icon: Activity, color: "text-emerald-500" },
    { label: "Total Tokens Used", value: `${(totalTokens / 1000).toFixed(0)}K`, icon: Zap, color: "text-accent" },
    { label: "Warnings", value: metrics?.filter(m => m.status !== "healthy").length ?? 0, icon: AlertTriangle, color: "text-yellow-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Admin Overview</h1>
        <p className="text-sm text-muted-foreground">System-wide metrics and monitoring.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-transparent card-elevated">
            <CardContent className="p-5">
              {loadingUsers || loadingMetrics ? (
                <Skeleton className="h-16 w-full" />
              ) : (
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{card.value}</p>
                    <p className="text-xs text-muted-foreground">{card.label}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-transparent card-elevated">
        <CardHeader>
          <CardTitle className="text-base font-display">Platform Token Usage (7 days)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingUsage ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={usage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip formatter={(value: number) => [`${value.toLocaleString()} tokens`, "Tokens"]} />
                <Area type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
