import { useQuery } from "@tanstack/react-query";
import { fetchUsageStats, fetchDailyUsage, fetchActivities } from "@/services/mockApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, BarChart3, Zap, Clock } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-2xl bg-card p-5 card-elevated border border-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold font-display text-card-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
      <p className="text-xs text-primary mt-1">{sub}</p>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["usageStats"], queryFn: fetchUsageStats });
  const { data: dailyUsage, isLoading: chartLoading } = useQuery({ queryKey: ["dailyUsage"], queryFn: fetchDailyUsage });
  const { data: activities, isLoading: activitiesLoading } = useQuery({ queryKey: ["activities"], queryFn: fetchActivities });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your AI usage and activity.</p>
      </div>

      {/* Stats Cards */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[140px] rounded-2xl" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Zap} label="Tokens Used" value={stats.totalTokens.toLocaleString()} sub="+12% from last week" />
          <StatCard icon={BarChart3} label="Total Requests" value={stats.totalRequests.toLocaleString()} sub="+8% from last week" />
          <StatCard icon={Activity} label="Active Tools" value={String(stats.activeTools)} sub="All systems operational" />
          <StatCard icon={Clock} label="Uptime" value={`${stats.uptime}%`} sub="Last 30 days" />
        </div>
      ) : null}

      {/* Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Token Usage Chart */}
        <div className="lg:col-span-3 rounded-2xl bg-card p-5 card-elevated border border-transparent">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Token Usage</h3>
          {chartLoading ? (
            <Skeleton className="h-[250px]" />
          ) : dailyUsage ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyUsage}>
                <defs>
                  <linearGradient id="tokenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(221, 83%, 53%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(0, 0%, 100%)",
                    border: "1px solid hsl(220, 13%, 91%)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="tokens" stroke="hsl(221, 83%, 53%)" strokeWidth={2} fill="url(#tokenGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-2xl bg-card p-5 card-elevated border border-transparent">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Recent Activity</h3>
          {activitiesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : activities ? (
            <div className="space-y-3">
              {activities.map((a) => (
                <div key={a.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.tool} · {a.timestamp}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">{a.tokens.toLocaleString()} tok</span>
                    <Badge variant={a.status === "success" ? "default" : "destructive"} className="text-[10px] px-1.5 py-0">
                      {a.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
