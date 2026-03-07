import { useMutation, useQuery } from "@tanstack/react-query";
import { executeToolFromBackend, fetchActiveToolsFromBackend, fetchToolHistoryFromBackend } from "@/services/backendApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, FileSearch, Lightbulb } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const iconMap: Record<string, React.ElementType> = {
  "resume-analyzer": FileText,
  "pdf-summarizer": FileSearch,
  "business-idea-generator": Lightbulb,
};

export default function AITools() {
  const { toast } = useToast();
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [toolInput, setToolInput] = useState("");
  const [toolOutput, setToolOutput] = useState("");

  const { data: tools, isLoading } = useQuery({ queryKey: ["aiTools"], queryFn: fetchActiveToolsFromBackend });
  const { data: history } = useQuery({ queryKey: ["toolHistory"], queryFn: fetchToolHistoryFromBackend });
  const executeMutation = useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: string }) => executeToolFromBackend(slug, input),
    onSuccess: (result) => {
      setToolOutput(result.output);
      toast({ title: `${result.tool.name} executed` });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Tool execution failed";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleExecute = () => {
    if (!selectedSlug || !toolInput.trim() || executeMutation.isPending) return;
    executeMutation.mutate({ slug: selectedSlug, input: toolInput.trim() });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">AI Tools</h1>
        <p className="text-sm text-muted-foreground">Purpose-built AI tools for your workflow.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-[180px] rounded-2xl" />)}
        </div>
      ) : tools ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tools.map((tool) => {
            const Icon = iconMap[tool.slug] || FileText;
            return (
              <div
                key={tool.id}
                className={`rounded-2xl bg-card p-6 card-elevated border transition-all group ${
                  selectedSlug === tool.slug ? "border-primary/40" : "border-transparent hover:border-primary/10"
                }`}
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-card-foreground">{tool.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-xs text-muted-foreground">
                    <div>v{tool.version}</div>
                    <div>{tool.model_name}</div>
                  </div>
                  <Button
                    size="sm"
                    variant={selectedSlug === tool.slug ? "default" : "outline"}
                    onClick={() => setSelectedSlug(tool.slug)}
                  >
                    {selectedSlug === tool.slug ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <div className="rounded-2xl bg-card p-5 border border-transparent card-elevated space-y-3">
        <h3 className="font-display font-semibold text-card-foreground">Run Selected Tool</h3>
        <p className="text-xs text-muted-foreground">
          {selectedSlug ? `Selected: ${selectedSlug}` : "Select a tool above to execute it."}
        </p>
        <Textarea
          placeholder="Enter input for the selected tool..."
          value={toolInput}
          onChange={(e) => setToolInput(e.target.value)}
          className="min-h-28"
        />
        <div className="flex items-center gap-2">
          <Button onClick={handleExecute} disabled={!selectedSlug || !toolInput.trim() || executeMutation.isPending}>
            {executeMutation.isPending ? "Running..." : "Run Tool"}
          </Button>
        </div>
        {toolOutput ? (
          <div className="rounded-xl border bg-background/60 p-4">
            <p className="text-sm whitespace-pre-wrap">{toolOutput}</p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl bg-card p-5 border border-transparent card-elevated space-y-3">
        <h3 className="font-display font-semibold text-card-foreground">Recent Tool Usage</h3>
        {!history?.length ? (
          <p className="text-sm text-muted-foreground">No tool usage yet.</p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-medium">{item.tool_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{item.tokens_used.toLocaleString()} tokens</p>
                  <p className="text-xs text-muted-foreground">${item.cost_estimate.toFixed(4)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
