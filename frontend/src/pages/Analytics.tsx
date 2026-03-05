import { useQuery } from "@tanstack/react-query";
import { fetchDailyUsage } from "@/services/runtimeData";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function Analytics() {
  const { data: dailyUsage, isLoading } = useQuery({ queryKey: ["dailyUsage"], queryFn: fetchDailyUsage });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground">Detailed insights into your AI usage.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl bg-card p-5 card-elevated border border-transparent">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Daily Token Usage</h3>
          {isLoading ? (
            <Skeleton className="h-[280px]" />
          ) : dailyUsage ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "12px", fontSize: "12px" }} />
                <Bar dataKey="tokens" fill="hsl(221, 83%, 53%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : null}
        </div>

        <div className="rounded-2xl bg-card p-5 card-elevated border border-transparent">
          <h3 className="font-display font-semibold text-card-foreground mb-4">Request Count</h3>
          {isLoading ? (
            <Skeleton className="h-[280px]" />
          ) : dailyUsage ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyUsage}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 13%, 91%)" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(220, 9%, 46%)" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 100%)", border: "1px solid hsl(220, 13%, 91%)", borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="requests" stroke="hsl(199, 89%, 48%)" strokeWidth={2} dot={{ fill: "hsl(199, 89%, 48%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
