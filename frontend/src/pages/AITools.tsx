import { useQuery } from "@tanstack/react-query";
import { fetchAITools } from "@/services/mockApi";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { FileText, FileSearch, Code, Megaphone, Lightbulb } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  FileText, FileSearch, Code, Megaphone, Lightbulb,
};

export default function AITools() {
  const { data: tools, isLoading } = useQuery({ queryKey: ["aiTools"], queryFn: fetchAITools });

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
            const Icon = iconMap[tool.icon] || FileText;
            return (
              <div key={tool.id} className="rounded-2xl bg-card p-6 card-elevated border border-transparent hover:border-primary/10 transition-all group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-card-foreground">{tool.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">{tool.description}</p>
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <span className="text-xs text-muted-foreground">{tool.usageCount.toLocaleString()} uses</span>
                  <Button size="sm" variant="outline">Launch</Button>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
