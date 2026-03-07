import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAdminProviderKey, upsertAdminProviderKey } from "@/services/backendApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type ProviderName = "gemini" | "openai";

export default function ProviderKeys() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [provider, setProvider] = useState<ProviderName>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-provider-key", provider],
    queryFn: () => fetchAdminProviderKey(provider),
  });

  const mutation = useMutation({
    mutationFn: () => upsertAdminProviderKey({ provider, api_key: apiKey.trim(), reason: reason.trim() || undefined }),
    onSuccess: async () => {
      setApiKey("");
      setReason("");
      await queryClient.invalidateQueries({ queryKey: ["admin-provider-key", provider] });
      toast({ title: "Provider key updated" });
    },
    onError: (error) => {
      toast({ title: error instanceof Error ? error.message : "Failed to update key", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Provider Keys</h1>
        <p className="text-sm text-muted-foreground">Rotate API keys without redeploy.</p>
      </div>

      <Card className="border-transparent card-elevated">
        <CardHeader>
          <CardTitle className="text-sm">Active Provider Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={(v: ProviderName) => setProvider(v)}>
              <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Current Key (masked)</Label>
            <Input readOnly value={isLoading ? "Loading..." : (data?.masked_api_key ?? "No key set in database")} />
          </div>

          <div className="space-y-2">
            <Label>New API Key</Label>
            <Input
              type="password"
              placeholder="Paste new provider key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input placeholder="e.g. monthly key rotation" value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || !apiKey.trim()}
          >
            {mutation.isPending ? "Saving..." : "Save Key"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
