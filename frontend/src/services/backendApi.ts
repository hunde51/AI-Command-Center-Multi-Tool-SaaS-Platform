import type { Activity, Conversation, DailyUsage, Message, UsageStats } from "@/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_EMAIL_KEY = "user_email";
const USER_NAME_KEY = "user_name";

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function getToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

function setUserEmail(email: string): void {
  localStorage.setItem(USER_EMAIL_KEY, email);
}

function setUserName(name: string): void {
  localStorage.setItem(USER_NAME_KEY, name);
}

export function getUserEmail(): string | null {
  return localStorage.getItem(USER_EMAIL_KEY);
}

export function getUserName(): string | null {
  return localStorage.getItem(USER_NAME_KEY);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_NAME_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  if (!headers.has("Content-Type") && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError(
      `Cannot reach backend at ${API_BASE_URL}. Start backend and verify VITE_API_BASE_URL.`,
      0,
    );
  }

  const body = await response.json().catch(() => ({}));
  if (!response.ok || body?.success === false) {
    throw new ApiError(body?.message || "Request failed", response.status);
  }

  return body as T;
}

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

type RegisterResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
};

type DashboardResponse = {
  user_id: string;
  role: string;
};

type ChatSendPayload = {
  conversation: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
  user_message: {
    id: string;
    role: "user";
    content: string;
    created_at: string;
  };
  assistant_message: {
    id: string;
    role: "assistant";
    content: string;
    created_at: string;
  };
};

type ToolRead = {
  id: string;
  name: string;
  slug: string;
  description: string;
  system_prompt_template: string;
  input_schema: Record<string, unknown>;
  is_active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
};

type ToolExecutionPayload = {
  tool: ToolRead;
  output: string;
  tokens_used: number;
  cost_estimate: number;
  model_used: string;
};

type ToolHistoryItem = {
  id: string;
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  tokens_used: number;
  cost_estimate: number;
  created_at: string;
};

type ChatConversationsPayload = {
  conversations: Array<{
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  }>;
};

type ChatHistoryPayload = {
  conversation: {
    id: string;
    title: string;
    created_at: string;
    updated_at: string;
  };
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    created_at: string;
  }>;
};

type UsageStatsPayload = {
  total_tokens: number;
  total_requests: number;
  active_tools: number;
  uptime: number;
};

type DailyUsagePayload = {
  daily_usage: Array<{
    date: string;
    tokens: number;
    requests: number;
  }>;
};

type ActivitiesPayload = {
  activities: Array<{
    id: string;
    action: string;
    tool: string;
    timestamp: string;
    tokens: number;
    status: "success" | "error" | "pending";
  }>;
};

type ToolsPayload = {
  tools: ToolRead[];
};

type ToolHistoryPayload = {
  history: ToolHistoryItem[];
};

function toMessage(item: { id: string; role: "user" | "assistant"; content: string; created_at: string }): Message {
  return {
    id: item.id,
    role: item.role,
    content: item.content,
    timestamp: new Date(item.created_at),
  };
}

export async function registerWithBackend(params: {
  name: string;
  email: string;
  username: string;
  password: string;
}): Promise<void> {
  const result = await request<ApiEnvelope<RegisterResponse>>("/auth/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
  setUserName(result.data.user.name);
  setUserEmail(result.data.user.email);
}

export async function loginWithBackend(email: string, password: string): Promise<void> {
  const form = new URLSearchParams();
  form.append("username", email);
  form.append("password", password);

  const result = await request<LoginResponse>("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });

  setTokens(result.access_token, result.refresh_token);
  setUserEmail(email);
}

export async function fetchDashboardStatus(): Promise<DashboardResponse> {
  const result = await request<ApiEnvelope<DashboardResponse>>("/dashboard");
  return result.data;
}

export async function fetchChatConversations(): Promise<Conversation[]> {
  const result = await request<ApiEnvelope<ChatConversationsPayload>>("/chat/conversations");
  return result.data.conversations.map((item) => ({
    id: item.id,
    title: item.title,
    model: "configured-model",
    updatedAt: new Date(item.updated_at),
    messages: [],
  }));
}

export async function fetchChatConversationHistory(conversationId: string): Promise<Message[]> {
  const result = await request<ApiEnvelope<ChatHistoryPayload>>(`/chat/${conversationId}`);
  return result.data.messages.map(toMessage);
}

export async function sendChatMessage(conversationId: string | null, content: string): Promise<ChatSendPayload> {
  const result = await request<ApiEnvelope<ChatSendPayload>>("/chat", {
    method: "POST",
    body: JSON.stringify({
      conversation_id: conversationId,
      message: content,
    }),
  });
  return result.data;
}

export async function renameChatConversation(conversationId: string, title: string): Promise<void> {
  await request<ApiEnvelope<{ conversation: { id: string; title: string } }>>(`/chat/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteChatConversation(conversationId: string): Promise<void> {
  await request<ApiEnvelope<Record<string, never>>>(`/chat/${conversationId}`, {
    method: "DELETE",
  });
}

export async function fetchUsageStatsFromBackend(): Promise<UsageStats> {
  const result = await request<ApiEnvelope<UsageStatsPayload>>("/analytics/usage-stats");
  return {
    totalTokens: result.data.total_tokens,
    totalRequests: result.data.total_requests,
    activeTools: result.data.active_tools,
    uptime: result.data.uptime,
  };
}

export async function fetchDailyUsageFromBackend(): Promise<DailyUsage[]> {
  const result = await request<ApiEnvelope<DailyUsagePayload>>("/analytics/daily-usage");
  return result.data.daily_usage.map((row) => ({
    date: row.date,
    tokens: row.tokens,
    requests: row.requests,
  }));
}

export async function fetchActivitiesFromBackend(): Promise<Activity[]> {
  const result = await request<ApiEnvelope<ActivitiesPayload>>("/analytics/activities");
  return result.data.activities;
}

export async function fetchActiveToolsFromBackend(): Promise<ToolRead[]> {
  const result = await request<ApiEnvelope<ToolsPayload>>("/tools");
  return result.data.tools;
}

export async function executeToolFromBackend(slug: string, input: string): Promise<ToolExecutionPayload> {
  const result = await request<ApiEnvelope<ToolExecutionPayload>>(`/tools/${slug}`, {
    method: "POST",
    body: JSON.stringify({ input }),
  });
  return result.data;
}

export async function fetchAdminToolsFromBackend(): Promise<ToolRead[]> {
  const result = await request<ApiEnvelope<ToolsPayload>>("/admin/tools");
  return result.data.tools;
}

export async function setAdminToolActive(toolId: string, isActive: boolean): Promise<ToolRead> {
  const result = await request<ApiEnvelope<{ tool: ToolRead }>>(`/admin/tools/${toolId}/activate`, {
    method: "PATCH",
    body: JSON.stringify({ is_active: isActive }),
  });
  return result.data.tool;
}

export async function fetchToolHistoryFromBackend(): Promise<ToolHistoryItem[]> {
  const result = await request<ApiEnvelope<ToolHistoryPayload>>("/tools/history");
  return result.data.history;
}

export async function createAdminTool(payload: {
  name: string;
  slug: string;
  description: string;
  system_prompt_template: string;
  input_schema: Record<string, unknown>;
  is_active: boolean;
  version: number;
}): Promise<ToolRead> {
  const result = await request<ApiEnvelope<{ tool: ToolRead }>>("/admin/tools", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return result.data.tool;
}

export async function updateAdminTool(
  toolId: string,
  payload: {
    name: string;
    slug: string;
    description: string;
    system_prompt_template: string;
    input_schema: Record<string, unknown>;
    is_active: boolean;
    version: number;
  },
): Promise<ToolRead> {
  const result = await request<ApiEnvelope<{ tool: ToolRead }>>(`/admin/tools/${toolId}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return result.data.tool;
}

export async function deleteAdminTool(toolId: string): Promise<void> {
  await request<ApiEnvelope<Record<string, never>>>(`/admin/tools/${toolId}`, {
    method: "DELETE",
  });
}
