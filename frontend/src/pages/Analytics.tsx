import { useQuery } from "@tanstack/react-query";
import { fetchDailyUsage } from "@/services/runtimeData";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { useTheme } from "next-themes";

export default function Analytics() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const lineColor = isDark ? "hsl(142, 71%, 45%)" : "hsl(199, 89%, 48%)";
  const barFill = isDark ? "transparent" : "hsl(221, 83%, 53%)";
  const barStroke = isDark ? "hsl(142, 72%, 62%)" : "hsl(221, 83%, 53%)";
  const gridColor = isDark ? "hsl(220, 30%, 18%)" : "hsl(220, 13%, 91%)";
  const tickColor = isDark ? "hsl(215, 20%, 65%)" : "hsl(220, 9%, 46%)";
  const tooltipBg = isDark ? "hsl(220, 40%, 8%)" : "hsl(0, 0%, 100%)";
  const tooltipBorder = isDark ? "hsl(220, 30%, 20%)" : "hsl(220, 13%, 91%)";

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
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", fontSize: "12px" }} />
                <Bar
                  dataKey="tokens"
                  fill={barFill}
                  stroke={barStroke}
                  strokeWidth={2}
                  radius={[6, 6, 0, 0]}
                  activeBar={isDark ? { fill: "transparent", stroke: "hsl(0, 0%, 0%)", strokeWidth: 2 } : undefined}
                />
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
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: tickColor }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, borderRadius: "12px", fontSize: "12px" }} />
                <Line type="monotone" dataKey="requests" stroke={lineColor} strokeWidth={2} dot={{ fill: lineColor, r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
    </div>
  );
}
