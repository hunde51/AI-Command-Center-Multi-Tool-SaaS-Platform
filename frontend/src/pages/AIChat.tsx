import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteChatConversation,
  fetchChatConversationHistory,
  fetchChatConversations,
  renameChatConversation,
  sendChatMessage,
} from "@/services/backendApi";
import type { Conversation, Message } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, Plus, Bot, User, RefreshCw, Loader2, PanelLeft, MoreHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AIChat() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [isCreatingNewChat, setIsCreatingNewChat] = useState(false);
  const [mobileHistoryOpen, setMobileHistoryOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [conversationForAction, setConversationForAction] = useState<Conversation | null>(null);
  const [model, setModel] = useState("configured-model");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const [isStreamingAssistant, setIsStreamingAssistant] = useState(false);
  const [suspendHistorySync, setSuspendHistorySync] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchChatConversations,
  });

  const { data: history } = useQuery({
    queryKey: ["conversation", selectedConvId],
    queryFn: () => fetchChatConversationHistory(selectedConvId as string),
    enabled: Boolean(selectedConvId),
  });

  const selectedConv = conversations?.find((c) => c.id === selectedConvId);

  useEffect(() => {
    if (conversations?.length && !selectedConvId && !isCreatingNewChat) {
      setSelectedConvId(conversations[0].id);
    }
  }, [conversations, selectedConvId, isCreatingNewChat]);

  useEffect(() => {
    if (isCreatingNewChat) {
      setLocalMessages([]);
      return;
    }
    if (suspendHistorySync) {
      return;
    }
    setLocalMessages(history || []);
  }, [history, isCreatingNewChat, suspendHistorySync]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [localMessages]);

  const mutation = useMutation({
    mutationFn: ({ content, conversationId }: { content: string; conversationId: string | null }) =>
      sendChatMessage(conversationId, content),
    onSuccess: async (result) => {
      setIsCreatingNewChat(false);
      setSelectedConvId(result.conversation.id);
      const assistantText = result.assistant_message.content || "";

      setSuspendHistorySync(true);
      setIsStreamingAssistant(true);

      const streamId = `stream_${Date.now()}`;
      setLocalMessages((prev) => [
        ...prev,
        {
          id: streamId,
          role: "assistant",
          content: "",
          timestamp: new Date(result.assistant_message.created_at),
        },
      ]);

      let visibleLength = 0;
      const step = Math.max(1, Math.ceil(assistantText.length / 120));
      while (visibleLength < assistantText.length) {
        visibleLength = Math.min(assistantText.length, visibleLength + step);
        const partial = assistantText.slice(0, visibleLength);
        setLocalMessages((prev) =>
          prev.map((msg) => (msg.id === streamId ? { ...msg, content: partial } : msg)),
        );
        await new Promise((resolve) => setTimeout(resolve, 14));
      }

      setIsStreamingAssistant(false);
      setSuspendHistorySync(false);
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["conversation", result.conversation.id] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to send message";
      toast({ title: message, variant: "destructive" });
    },
  });

  const renameMutation = useMutation({
    mutationFn: ({ conversationId, title }: { conversationId: string; title: string }) =>
      renameChatConversation(conversationId, title),
    onSuccess: async (_, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({ queryKey: ["conversation", variables.conversationId] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to rename conversation";
      toast({ title: message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (conversationId: string) => deleteChatConversation(conversationId),
    onSuccess: async (_, conversationId) => {
      if (selectedConvId === conversationId) {
        handleNewChat();
      }
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to delete conversation";
      toast({ title: message, variant: "destructive" });
    },
  });

  const handleSend = () => {
    if (!inputValue.trim() || mutation.isPending || isStreamingAssistant) return;
    const content = inputValue.trim();
    const userMsg: Message = {
      id: `tmp_${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    setLocalMessages((prev) => [...prev, userMsg]);
    mutation.mutate({ content, conversationId: selectedConvId });
    setInputValue("");
  };

  const handleNewChat = () => {
    setIsCreatingNewChat(true);
    setSelectedConvId(null);
    setLocalMessages([]);
    setMobileHistoryOpen(false);
  };

  const handleRenameConversation = (conversation: Conversation) => {
    setConversationForAction(conversation);
    setRenameValue(conversation.title);
    setRenameOpen(true);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    setConversationForAction(conversation);
    setDeleteOpen(true);
  };

  const submitRename = () => {
    if (!conversationForAction) return;
    const title = renameValue.trim();
    if (!title || title === conversationForAction.title) {
      setRenameOpen(false);
      return;
    }
    renameMutation.mutate({ conversationId: conversationForAction.id, title });
    setRenameOpen(false);
  };

  const confirmDelete = () => {
    if (!conversationForAction) return;
    deleteMutation.mutate(conversationForAction.id);
    setDeleteOpen(false);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] -m-6 bg-gradient-to-br from-stone-50 via-amber-50/60 to-slate-50">
      <div className="w-72 border-r border-stone-200/80 bg-stone-50/80 backdrop-blur-sm flex flex-col shrink-0 hidden md:flex">
        <div className="p-4 border-b border-stone-200/70">
          <Button variant="outline" className="w-full gap-2 justify-start border-stone-300 bg-stone-100/80 hover:bg-stone-100 text-stone-900" onClick={handleNewChat}>
            <Plus className="h-4 w-4" /> New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {isLoading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
              : conversations?.map((c: Conversation) => (
                  <div
                    key={c.id}
                    className={`w-full rounded-lg px-2 py-1 text-sm transition-colors ${
                      selectedConvId === c.id ? "bg-stone-200/70" : "hover:bg-stone-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setIsCreatingNewChat(false);
                          setSelectedConvId(c.id);
                        }}
                        className="flex-1 text-left px-1 py-1.5 min-w-0"
                      >
                        <p className="truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{c.model}</p>
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRenameConversation(c)}>Edit name</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteConversation(c)} className="text-destructive">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="md:hidden border-b border-stone-200/70 px-3 py-2 flex items-center justify-between gap-2 bg-stone-50/80">
          <Sheet open={mobileHistoryOpen} onOpenChange={setMobileHistoryOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open conversations">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
              <SheetContent side="left" className="w-[85vw] max-w-sm p-0 bg-stone-50">
              <SheetHeader className="px-4 py-3 border-b border-stone-200/70">
                <SheetTitle>Conversations</SheetTitle>
              </SheetHeader>
              <div className="p-4 border-b border-stone-200/70">
                <Button variant="outline" className="w-full gap-2 justify-start border-stone-300 bg-stone-100/80 hover:bg-stone-100 text-stone-900" onClick={handleNewChat}>
                  <Plus className="h-4 w-4" /> New Chat
                </Button>
              </div>
              <ScrollArea className="h-[calc(100vh-9rem)]">
                <div className="p-2 space-y-1">
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-lg" />)
                    : conversations?.map((c: Conversation) => (
                        <div
                          key={c.id}
                          className={`w-full rounded-lg px-2 py-1 text-sm transition-colors ${
                            selectedConvId === c.id ? "bg-stone-200/70" : "hover:bg-stone-200/50"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setIsCreatingNewChat(false);
                                setSelectedConvId(c.id);
                                setMobileHistoryOpen(false);
                              }}
                              className="flex-1 text-left px-1 py-1.5 min-w-0"
                            >
                              <p className="truncate">{c.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{c.model}</p>
                            </button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleRenameConversation(c)}>Edit name</DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteConversation(c)} className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
          <h2 className="text-sm font-semibold text-foreground truncate flex-1 text-center">
            {selectedConv?.title || "New conversation"}
          </h2>
          <Button variant="outline" size="sm" className="gap-2" onClick={handleNewChat}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>

        <div className="h-12 border-b border-stone-200/70 hidden md:flex items-center justify-between px-4 shrink-0 bg-stone-50/80">
          <h2 className="text-sm font-semibold text-foreground truncate">{selectedConv?.title || "New conversation"}</h2>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger className="w-44 h-8 text-xs border-stone-300 bg-stone-100/80 text-stone-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="configured-model">Configured Model</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="max-w-3xl mx-auto py-6 space-y-6">
            {localMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="h-12 w-12 rounded-2xl bg-stone-200/80 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-stone-700" />
                </div>
                <h3 className="font-display font-semibold text-foreground">Start a conversation</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">Ask anything and AI will respond with context from this chat.</p>
              </div>
            ) : (
              localMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="h-8 w-8 rounded-lg bg-stone-200/80 border border-stone-300/70 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="h-4 w-4 text-stone-700" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 max-w-[80%] text-sm leading-relaxed border ${
                    msg.role === "user"
                      ? "bg-amber-100/70 text-stone-900 border-amber-200"
                      : "bg-white/85 text-stone-900 border-stone-200 shadow-sm"
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === "user" && (
                    <div className="h-8 w-8 rounded-lg bg-stone-200/80 border border-stone-300/70 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="h-4 w-4 text-stone-700" />
                    </div>
                  )}
                </div>
              ))
            )}
            {mutation.isPending && !isStreamingAssistant && (
              <div className="flex gap-3">
                <div className="h-8 w-8 rounded-lg bg-stone-200/80 border border-stone-300/70 flex items-center justify-center shrink-0">
                  <Bot className="h-4 w-4 text-stone-700" />
                </div>
                <div className="rounded-2xl bg-white/85 border border-stone-200 shadow-sm px-4 py-3 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                  <span className="text-sm text-stone-500">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        <div className="border-t border-stone-200/70 p-4 bg-stone-50/80">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Button variant="ghost" size="icon" className="shrink-0 text-stone-600 hover:bg-stone-200/60 hover:text-stone-800" disabled={mutation.isPending} onClick={() => selectedConvId && queryClient.invalidateQueries({ queryKey: ["conversation", selectedConvId] })}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={mutation.isPending || isStreamingAssistant}
              className="flex-1 border-stone-300 bg-white/90 text-stone-900 placeholder:text-stone-400"
            />
            <Button size="icon" className="bg-stone-800 text-stone-100 hover:bg-stone-700" onClick={handleSend} disabled={mutation.isPending || isStreamingAssistant || !inputValue.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit conversation name</DialogTitle>
          </DialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            placeholder="Conversation name"
            maxLength={120}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameOpen(false)}>Cancel</Button>
            <Button onClick={submitRename} disabled={renameMutation.isPending}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {conversationForAction ? `"${conversationForAction.title}"` : "conversation"}?
            </AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
