import type { AdminUser, UsageLog, AdminTool, SystemMetric, FeatureFlag, DailyUsage } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

const mockAdminUsers: AdminUser[] = [
  { id: "usr_1", name: "Alex Morgan", email: "alex@commandcenter.ai", plan: "pro", status: "active", tokensUsed: 84250, tokensLimit: 100000, joinedAt: "2025-11-12", lastActive: "2 min ago" },
  { id: "usr_2", name: "Sarah Chen", email: "sarah.chen@startup.io", plan: "enterprise", status: "active", tokensUsed: 245000, tokensLimit: 500000, joinedAt: "2025-09-04", lastActive: "1 hr ago" },
  { id: "usr_3", name: "James Wilson", email: "j.wilson@corp.com", plan: "pro", status: "active", tokensUsed: 67300, tokensLimit: 100000, joinedAt: "2025-12-01", lastActive: "30 min ago" },
  { id: "usr_4", name: "Priya Patel", email: "priya@devhouse.co", plan: "free", status: "active", tokensUsed: 820, tokensLimit: 1000, joinedAt: "2026-01-15", lastActive: "3 hrs ago" },
  { id: "usr_5", name: "Marcus Johnson", email: "marcus@freelance.me", plan: "pro", status: "suspended", tokensUsed: 99100, tokensLimit: 100000, joinedAt: "2025-10-20", lastActive: "2 days ago" },
  { id: "usr_6", name: "Emily Rodriguez", email: "emily.r@agency.co", plan: "enterprise", status: "active", tokensUsed: 178400, tokensLimit: 500000, joinedAt: "2025-08-15", lastActive: "5 min ago" },
  { id: "usr_7", name: "David Kim", email: "d.kim@techcorp.com", plan: "free", status: "pending", tokensUsed: 0, tokensLimit: 1000, joinedAt: "2026-02-26", lastActive: "Never" },
  { id: "usr_8", name: "Lisa Thompson", email: "lisa.t@design.io", plan: "pro", status: "active", tokensUsed: 45600, tokensLimit: 100000, joinedAt: "2026-01-03", lastActive: "15 min ago" },
];

const mockUsageLogs: UsageLog[] = [
  { id: "log_1", userId: "usr_1", userName: "Alex Morgan", action: "Chat completion", tool: "AI Chat", tokens: 1240, model: "gpt-4o", timestamp: "2026-02-27 10:32:00", status: "success", duration: 2.3 },
  { id: "log_2", userId: "usr_2", userName: "Sarah Chen", action: "Resume analyzed", tool: "Resume Analyzer", tokens: 3420, model: "gpt-4o", timestamp: "2026-02-27 10:15:00", status: "success", duration: 4.1 },
  { id: "log_3", userId: "usr_3", userName: "James Wilson", action: "PDF summarized", tool: "PDF Summarizer", tokens: 5100, model: "claude-3.5", timestamp: "2026-02-27 09:48:00", status: "success", duration: 6.2 },
  { id: "log_4", userId: "usr_1", userName: "Alex Morgan", action: "Code explained", tool: "Code Explainer", tokens: 2800, model: "gpt-4o", timestamp: "2026-02-27 09:30:00", status: "success", duration: 3.5 },
  { id: "log_5", userId: "usr_6", userName: "Emily Rodriguez", action: "Marketing copy", tool: "Marketing Generator", tokens: 1900, model: "gpt-4o", timestamp: "2026-02-27 09:12:00", status: "error", duration: 8.0 },
  { id: "log_6", userId: "usr_4", userName: "Priya Patel", action: "Chat completion", tool: "AI Chat", tokens: 420, model: "gpt-3.5", timestamp: "2026-02-27 08:55:00", status: "success", duration: 1.1 },
  { id: "log_7", userId: "usr_8", userName: "Lisa Thompson", action: "Business idea", tool: "Idea Generator", tokens: 4200, model: "claude-3.5", timestamp: "2026-02-27 08:40:00", status: "success", duration: 5.8 },
  { id: "log_8", userId: "usr_2", userName: "Sarah Chen", action: "Chat completion", tool: "AI Chat", tokens: 890, model: "gpt-4o", timestamp: "2026-02-27 08:22:00", status: "success", duration: 1.9 },
  { id: "log_9", userId: "usr_3", userName: "James Wilson", action: "Code explained", tool: "Code Explainer", tokens: 3100, model: "gpt-4o", timestamp: "2026-02-27 08:05:00", status: "success", duration: 4.3 },
  { id: "log_10", userId: "usr_6", userName: "Emily Rodriguez", action: "Resume analyzed", tool: "Resume Analyzer", tokens: 2650, model: "claude-3.5", timestamp: "2026-02-27 07:48:00", status: "success", duration: 3.7 },
];

const mockAdminTools: AdminTool[] = [
  { id: "t1", name: "Resume Analyzer", description: "AI-powered resume analysis and improvement suggestions", category: "Documents", enabled: true, usageCount: 12400, avgResponseTime: 3.8, errorRate: 0.8 },
  { id: "t2", name: "PDF Summarizer", description: "Extract key insights from any PDF document", category: "Documents", enabled: true, usageCount: 8900, avgResponseTime: 5.2, errorRate: 1.2 },
  { id: "t3", name: "Code Explainer", description: "Understand complex code with detailed explanations", category: "Development", enabled: true, usageCount: 21000, avgResponseTime: 3.1, errorRate: 0.5 },
  { id: "t4", name: "Marketing Generator", description: "Generate compelling marketing copy and campaigns", category: "Marketing", enabled: true, usageCount: 7600, avgResponseTime: 4.5, errorRate: 2.1 },
  { id: "t5", name: "Business Idea Generator", description: "Validate and expand on business concepts", category: "Business", enabled: false, usageCount: 5400, avgResponseTime: 6.1, errorRate: 1.8 },
];

const mockSystemMetrics: SystemMetric[] = [
  { label: "API Uptime", value: 99.97, unit: "%", status: "healthy", trend: "stable" },
  { label: "Avg Response Time", value: 342, unit: "ms", status: "healthy", trend: "down" },
  { label: "Error Rate", value: 0.8, unit: "%", status: "healthy", trend: "down" },
  { label: "Active Connections", value: 1247, unit: "", status: "healthy", trend: "up" },
  { label: "CPU Usage", value: 62, unit: "%", status: "warning", trend: "up" },
  { label: "Memory Usage", value: 71, unit: "%", status: "warning", trend: "up" },
  { label: "Storage Used", value: 45, unit: "GB", status: "healthy", trend: "up" },
  { label: "Queue Depth", value: 12, unit: "jobs", status: "healthy", trend: "stable" },
];

const mockFeatureFlags: FeatureFlag[] = [
  { id: "ff_1", name: "New Chat UI", description: "Enable the redesigned chat interface with markdown preview", enabled: true, scope: "global", lastModified: "2026-02-25" },
  { id: "ff_2", name: "Agent Builder Beta", description: "Allow users to create custom AI agents", enabled: false, scope: "enterprise", lastModified: "2026-02-20" },
  { id: "ff_3", name: "Advanced Analytics", description: "Show detailed token usage analytics with drill-down", enabled: true, scope: "pro", lastModified: "2026-02-18" },
  { id: "ff_4", name: "Multi-model Chat", description: "Enable model switching within conversations", enabled: true, scope: "pro", lastModified: "2026-02-15" },
  { id: "ff_5", name: "Batch Processing", description: "Allow bulk document processing in tools", enabled: false, scope: "enterprise", lastModified: "2026-02-10" },
  { id: "ff_6", name: "Dark Mode", description: "Enable dark mode toggle for all users", enabled: true, scope: "global", lastModified: "2026-02-08" },
  { id: "ff_7", name: "Export Reports", description: "Allow exporting analytics data as CSV/PDF", enabled: false, scope: "pro", lastModified: "2026-02-05" },
];

const mockAdminDailyUsage: DailyUsage[] = [
  { date: "Feb 21", tokens: 124000, requests: 4500 },
  { date: "Feb 22", tokens: 182000, requests: 6200 },
  { date: "Feb 23", tokens: 98000, requests: 3100 },
  { date: "Feb 24", tokens: 221000, requests: 7800 },
  { date: "Feb 25", tokens: 156000, requests: 5200 },
  { date: "Feb 26", tokens: 198000, requests: 6700 },
  { date: "Feb 27", tokens: 84000, requests: 2800 },
];

// Admin API functions
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  await delay(400);
  return mockAdminUsers;
}

export async function fetchUsageLogs(): Promise<UsageLog[]> {
  await delay(350);
  return mockUsageLogs;
}

export async function fetchAdminTools(): Promise<AdminTool[]> {
  await delay(300);
  return mockAdminTools;
}

export async function fetchSystemMetrics(): Promise<SystemMetric[]> {
  await delay(250);
  return mockSystemMetrics;
}

export async function fetchFeatureFlags(): Promise<FeatureFlag[]> {
  await delay(300);
  return mockFeatureFlags;
}

export async function fetchAdminDailyUsage(): Promise<DailyUsage[]> {
  await delay(400);
  return mockAdminDailyUsage;
}

export async function toggleUserStatus(userId: string): Promise<AdminUser> {
  await delay(500);
  const user = mockAdminUsers.find(u => u.id === userId);
  if (!user) throw new Error("User not found");
  const newStatus = user.status === "active" ? "suspended" : "active";
  return { ...user, status: newStatus };
}

export async function toggleFeatureFlag(flagId: string): Promise<FeatureFlag> {
  await delay(400);
  const flag = mockFeatureFlags.find(f => f.id === flagId);
  if (!flag) throw new Error("Flag not found");
  return { ...flag, enabled: !flag.enabled };
}

export async function toggleToolStatus(toolId: string): Promise<AdminTool> {
  await delay(400);
  const tool = mockAdminTools.find(t => t.id === toolId);
  if (!tool) throw new Error("Tool not found");
  return { ...tool, enabled: !tool.enabled };
}
