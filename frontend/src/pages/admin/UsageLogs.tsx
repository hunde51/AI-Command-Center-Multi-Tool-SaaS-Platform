import { useQuery } from "@tanstack/react-query";
import { fetchUsageLogs } from "@/services/adminMockApi";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function UsageLogs() {
  const { data: logs, isLoading } = useQuery({ queryKey: ["usage-logs"], queryFn: fetchUsageLogs });

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
                  <TableHead>Tool</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Tokens</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-medium">{log.userName}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell className="text-muted-foreground">{log.tool}</TableCell>
                    <TableCell><Badge variant="secondary">{log.model}</Badge></TableCell>
                    <TableCell>{log.tokens.toLocaleString()}</TableCell>
                    <TableCell>{log.duration}s</TableCell>
                    <TableCell>
                      <Badge variant={log.status === "success" ? "default" : "destructive"}>{log.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">{log.timestamp}</TableCell>
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
