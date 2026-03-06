import { useQuery } from "@tanstack/react-query";
import { fetchAdminTokenUsageFromBackend, fetchAdminToolUsageFromBackend, fetchAdminTopUsersFromBackend } from "@/services/backendApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ["hsl(221, 83%, 53%)", "hsl(199, 89%, 48%)", "hsl(142, 71%, 45%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export default function AdminAnalytics() {
  const { data: tokenUsage, isLoading: loadingUsage } = useQuery({ queryKey: ["admin-token-usage-30"], queryFn: () => fetchAdminTokenUsageFromBackend(30) });
  const { data: toolUsage, isLoading: loadingTools } = useQuery({ queryKey: ["admin-tool-usage"], queryFn: fetchAdminToolUsageFromBackend });
  const { data: topUsers, isLoading: loadingUsers } = useQuery({ queryKey: ["admin-top-users"], queryFn: () => fetchAdminTopUsersFromBackend(10) });

  const usage = tokenUsage?.map((item, index, arr) => ({
    date: item.date,
    tokens: item.tokens,
    requests: index > 0 ? Math.max(1, Math.round(item.tokens / 120)) : Math.max(1, Math.round((arr[0]?.tokens ?? 0) / 120)),
  })) ?? [];

  const pieData = (toolUsage ?? []).map((item) => ({ name: item.tool_name, value: item.executions }));
  const planData = (topUsers ?? []).map((item) => ({ name: item.username, value: item.tokens_used }));

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
            {loadingTools ? <Skeleton className="h-64 w-full" /> : (
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
            <CardTitle className="text-base font-display">Top Users by Tokens</CardTitle>
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
