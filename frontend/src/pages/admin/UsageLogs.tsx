import { useQuery } from "@tanstack/react-query";
import { fetchAdminLogsFromBackend } from "@/services/backendApi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsageLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["admin-logs"], queryFn: () => fetchAdminLogsFromBackend({ page: 1, limit: 50 }) });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">AI Usage Logs</h1>
        <p className="text-sm text-muted-foreground">Track all AI interactions across the platform.</p>
      </div>

      <Card className="border-transparent card-elevated">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target User</TableHead>
                  <TableHead>Metadata</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.admin_id.slice(0, 8)}...</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.target_user_id ? `${log.target_user_id.slice(0, 8)}...` : "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-xs max-w-[320px] truncate">{JSON.stringify(log.metadata)}</TableCell>
                    <TableCell>
                      <Badge variant="default">success</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{new Date(log.created_at).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
