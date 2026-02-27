// User through AITool interfaces
export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  plan: "free" | "pro" | "enterprise";
  tokensUsed: number;
  tokensLimit: number;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  model: string;
  updatedAt: Date;
}

export interface UsageStats {
  totalTokens: number;
  totalRequests: number;
  activeTools: number;
  uptime: number;
}

export interface Activity {
  id: string;
  action: string;
  tool: string;
  timestamp: string;
  tokens: number;
  status: "success" | "error" | "pending";
}

export interface DailyUsage {
  date: string;
  tokens: number;
  requests: number;
}

export interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
}

export interface Feature {
  icon: string;
  title: string;
  description: string;
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  usageCount: number;
}

// Admin types
export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: "free" | "pro" | "enterprise";
  status: "active" | "suspended" | "pending";
  tokensUsed: number;
  tokensLimit: number;
  joinedAt: string;
  lastActive: string;
}

export interface UsageLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  tool: string;
  tokens: number;
  model: string;
  timestamp: string;
  status: "success" | "error";
  duration: number;
}

export interface AdminTool {
  id: string;
  name: string;
  description: string;
  category: string;
  enabled: boolean;
  usageCount: number;
  avgResponseTime: number;
  errorRate: number;
}

export interface SystemMetric {
  label: string;
  value: number;
  unit: string;
  status: "healthy" | "warning" | "critical";
  trend: "up" | "down" | "stable";
}

export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "global" | "pro" | "enterprise";
  lastModified: string;
}
