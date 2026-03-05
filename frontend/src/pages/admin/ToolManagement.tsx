import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createAdminTool,
  deleteAdminTool,
  fetchAdminToolsFromBackend,
  setAdminToolActive,
  updateAdminTool,
} from "@/services/backendApi";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

type BackendTool = {
  id: string;
  name: string;
  slug: string;
  description: string;
  system_prompt_template: string;
  is_active: boolean;
  version: number;
};

export default function ToolManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<BackendTool | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    system_prompt_template: "",
    version: 1,
  });
  const { data: tools, isLoading } = useQuery({ queryKey: ["admin-tools"], queryFn: fetchAdminToolsFromBackend });

  const mutation = useMutation({
    mutationFn: ({ toolId, isActive }: { toolId: string; isActive: boolean }) =>
      setAdminToolActive(toolId, isActive),
    onSuccess: (updatedTool) => {
      queryClient.setQueryData<BackendTool[]>(["admin-tools"], (old) =>
        old?.map(t => t.id === updatedTool.id ? { ...t, is_active: updatedTool.is_active } : t)
      );
      toast({ title: `${updatedTool.name} ${updatedTool.is_active ? "enabled" : "disabled"}` });
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      createAdminTool({
        ...form,
        input_schema: {},
        is_active: true,
      }),
    onSuccess: async () => {
      setCreateOpen(false);
      setForm({ name: "", slug: "", description: "", system_prompt_template: "", version: 1 });
      await queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast({ title: "Tool created" });
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : "Failed to create tool", variant: "destructive" });
    },
  });

  const editMutation = useMutation({
    mutationFn: () =>
      selectedTool
        ? updateAdminTool(selectedTool.id, {
            ...form,
            input_schema: {},
            is_active: selectedTool.is_active,
          })
        : Promise.reject(new Error("No tool selected")),
    onSuccess: async () => {
      setEditOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast({ title: "Tool updated" });
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : "Failed to update tool", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => (selectedTool ? deleteAdminTool(selectedTool.id) : Promise.reject(new Error("No tool selected"))),
    onSuccess: async () => {
      setDeleteOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["admin-tools"] });
      toast({ title: "Tool deleted" });
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : "Failed to delete tool", variant: "destructive" });
    },
  });

  const openEdit = (tool: BackendTool) => {
    setSelectedTool(tool);
    setForm({
      name: tool.name,
      slug: tool.slug,
      description: tool.description,
      system_prompt_template: tool.system_prompt_template,
      version: tool.version,
    });
    setEditOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Tool Management</h1>
        <p className="text-sm text-muted-foreground">Enable, disable, and monitor AI tools.</p>
        <Button className="mt-3" onClick={() => setCreateOpen(true)}>Create Tool</Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : (
        <div className="grid gap-4">
          {tools?.map((tool) => (
            <Card key={tool.id} className="border-transparent card-elevated">
              <CardContent className="p-5 flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-foreground">{tool.name}</h3>
                    <Badge variant="secondary">slug: {tool.slug}</Badge>
                    {!tool.is_active && <Badge variant="destructive">Disabled</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{tool.description}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>Version {tool.version}</span>
                  </div>
                </div>
                <Switch
                  checked={tool.is_active}
                  onCheckedChange={(value) => mutation.mutate({ toolId: tool.id, isActive: value })}
                  disabled={mutation.isPending}
                />
                <div className="ml-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(tool)}>Edit</Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setSelectedTool(tool);
                      setDeleteOpen(true);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Tool</DialogTitle></DialogHeader>
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Textarea placeholder="System prompt template (use {{input}})" value={form.system_prompt_template} onChange={(e) => setForm((f) => ({ ...f, system_prompt_template: e.target.value }))} />
          <Input type="number" min={1} value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: Number(e.target.value) || 1 }))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Tool</DialogTitle></DialogHeader>
          <Input placeholder="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
          <Input placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <Textarea placeholder="System prompt template" value={form.system_prompt_template} onChange={(e) => setForm((f) => ({ ...f, system_prompt_template: e.target.value }))} />
          <Input type="number" min={1} value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: Number(e.target.value) || 1 }))} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => editMutation.mutate()} disabled={editMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedTool?.name || "tool"}?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteMutation.mutate()}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
