import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchConversations, sendMessage } from "@/services/mockApi";
import type { Conversation, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Plus, Bot, User, RefreshCw, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AIChat() {
  const queryClient = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading } = useQuery({ queryKey: ["conversations"], queryFn: fetchConversations });

  const selectedConv = conversations?.find((c) => c.id === selectedConvId);

  useEffect(() => {
    if (conversations?.length && !selectedConvId) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId]);

  useEffect(() => {
    if (selectedConv) {
      setLocalMessages(selectedConv.messages);
    }
  }, [selectedConv]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const mutation = useMutation({
    mutationFn: (content: string) => sendMessage(selectedConvId || "", content),
    onSuccess: (newMsg) => {
      setLocalMessages((prev) => [...prev, newMsg]);
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || mutation.isPending) return;
    const userMsg: Message = {
      id: `m_${Date.now()}`,
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    mutation.mutate(inputValue.trim());
    setInputValue("");
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 bg-background">
      {/* Conversation Sidebar */}
      <div className="w-72 border-r bg-card flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b">
          <Button variant="outline" className="w-full gap-2 justify-start" onClick={() => {}}>
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : conversations?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedConvId(c.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      selectedConvId === c.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:bg-secondary/50"
                    }`}
                  >
                    <p className="truncate">{c.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{c.model} · {c.messages.length} messages</p>
                  </button>
                ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat Header */}
        <div className="h-12 border-b flex items-center justify-between px-4 shrink-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{selectedConv?.title || "Select a conversation"}</h2>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-36 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gpt-4o">GPT-4o</SelectItem>
              <SelectItem value="claude-3.5">Claude 3.5</SelectItem>
              <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {localMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Start a conversation</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Ask anything — get intelligent responses powered by the latest AI models.</p>
              </div>
            ) : (
              localMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              ))
            )}
            {mutation.isPending && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Button variant="ghost" size="icon" className="shrink-0" disabled={mutation.isPending}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={mutation.isPending}
              className="flex-1"
            />
            <Button size="icon" onClick={handleSend} disabled={mutation.isPending || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
