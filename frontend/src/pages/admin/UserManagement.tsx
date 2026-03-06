import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteAdminUser, fetchAdminUsersFromBackend, setAdminUserStatus } from "@/services/backendApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AdminUserRow = {
  user_id: string;
  email: string;
  username: string;
  role: "USER" | "ADMIN";
  is_active: boolean;
  created_at: string;
  total_tokens_used: number;
  total_tools_used: number;
};

export default function UserManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [role, setRole] = useState<"ALL" | "USER" | "ADMIN">("ALL");
  const [status, setStatus] = useState<"ALL" | "active" | "suspended">("ALL");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);
  const { data: usersData, isLoading } = useQuery({
    queryKey: ["admin-users", page, limit, search, role, status],
    queryFn: () =>
      fetchAdminUsersFromBackend({
        page,
        limit,
        search: search || undefined,
        role: role === "ALL" ? undefined : role,
        status: status === "ALL" ? undefined : status,
      }),
  });

  const mutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) => setAdminUserStatus(userId, isActive),
    onSuccess: async (_, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: `User ${vars.isActive ? "activated" : "suspended"}` });
    },
  });
  const deleteMutation = useMutation({
    mutationFn: (userId: string) => deleteAdminUser(userId),
    onSuccess: async () => {
      setDeleteOpen(false);
      setTargetUserId(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User deleted" });
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : "Failed to delete user", variant: "destructive" });
    },
  });
  const users = usersData?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground">Manage platform users and access control.</p>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="w-[140px]">
          <Select
            value={role}
            onValueChange={(v: "ALL" | "USER" | "ADMIN") => {
              setRole(v);
              setPage(1);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              <SelectItem value="USER">USER</SelectItem>
              <SelectItem value="ADMIN">ADMIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[160px]">
          <Select
            value={status}
            onValueChange={(v: "ALL" | "active" | "suspended") => {
              setStatus(v);
              setPage(1);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-[120px]">
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              setLimit(Number(v));
              setPage(1);
            }}
          >
            <SelectTrigger><SelectValue placeholder="Limit" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border-transparent card-elevated">
        <CardHeader>
          <CardTitle className="text-sm text-muted-foreground">Total users: {usersData?.pagination.total ?? 0}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tokens Used</TableHead>
                  <TableHead>Tools Used</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: AdminUserRow) => (
                  <TableRow key={user.user_id}>
                    <TableCell className="font-medium">{user.username}</TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
                    <TableCell><Badge variant="secondary">{user.role}</Badge></TableCell>
                    <TableCell><Badge variant={user.is_active ? "default" : "destructive"} className="capitalize">{user.is_active ? "active" : "suspended"}</Badge></TableCell>
                    <TableCell>{user.total_tokens_used.toLocaleString()}</TableCell>
                    <TableCell className="text-muted-foreground">{user.total_tools_used.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant={user.is_active ? "destructive" : "default"}
                          size="sm"
                          disabled={mutation.isPending}
                          onClick={() => mutation.mutate({ userId: user.user_id, isActive: !user.is_active })}
                        >
                          {user.is_active ? "Suspend" : "Activate"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={deleteMutation.isPending || user.role === "ADMIN"}
                          onClick={() => {
                            setTargetUserId(user.user_id);
                            setDeleteOpen(true);
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Page {usersData?.pagination.page ?? 1} of {usersData?.pagination.total_pages ?? 1}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!usersData?.pagination.has_prev}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!usersData?.pagination.has_next}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => targetUserId && deleteMutation.mutate(targetUserId)}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
