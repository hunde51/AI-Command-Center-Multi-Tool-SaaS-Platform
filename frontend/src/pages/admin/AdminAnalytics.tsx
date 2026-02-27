import { useQuery } from "@tanstack/react-query";
import { fetchAdminDailyUsage, fetchAdminUsers, fetchUsageLogs } from "@/services/adminMockApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function AdminAnalytics() {
  const { data: usage, isLoading: loadingUsage } = useQuery({ queryKey: ["admin-daily-usage"], queryFn: fetchAdminDailyUsage });
  const { data: users, isLoading: loadingUsers } = useQuery({ queryKey: ["admin-users"], queryFn: fetchAdminUsers });
  const { data: logs } = useQuery({ queryKey: ["usage-logs"], queryFn: fetchUsageLogs });

  // Tool usage breakdown
  const toolBreakdown = logs?.reduce((acc, log) => {
    acc[log.tool] = (acc[log.tool] || 0) + log.tokens;
    return acc;
  }, {} as Record<string, number>);

  const pieData = toolBreakdown
    ? Object.entries(toolBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  // Plan distribution
  const planDist = users?.reduce((acc, u) => {
    acc[u.plan] = (acc[u.plan] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const planData = planDist
    ? Object.entries(planDist).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Analytics Overview</h1>
        <p className="text-sm text-muted-foreground">Platform-wide usage analytics and breakdowns.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-transparent card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-display">Daily Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="requests" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-display">Token Usage by Tool</CardTitle>
          </CardHeader>
          <CardContent>
            {!logs ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name }) => name}>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} tokens`]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-display">Daily Token Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsage ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={usage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                  <Tooltip formatter={(value: number) => [`${value.toLocaleString()} tokens`]} />
                  <Line type="monotone" dataKey="tokens" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent card-elevated">
          <CardHeader>
            <CardTitle className="text-base font-display">User Plan Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingUsers ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={planData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {planData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
