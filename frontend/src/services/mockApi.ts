import type { User, Conversation, Message, UsageStats, Activity, DailyUsage, PricingPlan, AITool } from "@/types";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockUser: User = {
  id: "usr_1",
  name: "Alex Morgan",
  email: "alex@commandcenter.ai",
  plan: "pro",
  tokensUsed: 84250,
  tokensLimit: 100000,
  avatar: undefined,
};

const mockConversations: Conversation[] = [
  {
    id: "conv_1",
    title: "Marketing Strategy Q1",
    model: "gpt-4o",
    updatedAt: new Date("2026-02-27T10:30:00"),
    messages: [
      { id: "m1", role: "user", content: "Help me create a marketing strategy for our Q1 product launch.", timestamp: new Date("2026-02-27T10:28:00") },
      { id: "m2", role: "assistant", content: "I'd be happy to help you craft a comprehensive Q1 marketing strategy. Here's a structured approach:\n\n## 1. Define Clear Objectives\n- **Revenue Target:** Set specific revenue goals for Q1\n- **Brand Awareness:** Increase social media following by 25%\n- **Lead Generation:** Aim for 500+ qualified leads\n\n## 2. Channel Strategy\n- **Content Marketing:** Blog posts, whitepapers, case studies\n- **Paid Advertising:** Google Ads + LinkedIn campaigns\n- **Email Marketing:** Nurture sequences for different segments\n\n## 3. Timeline\n- **January:** Pre-launch teasers and audience building\n- **February:** Soft launch with early access program\n- **March:** Full launch with PR push\n\nWould you like me to dive deeper into any of these areas?", timestamp: new Date("2026-02-27T10:30:00") },
    ],
  },
  {
    id: "conv_2",
    title: "Python API Design",
    model: "gpt-4o",
    updatedAt: new Date("2026-02-26T15:00:00"),
    messages: [
      { id: "m3", role: "user", content: "What are best practices for designing a REST API in Python?", timestamp: new Date("2026-02-26T14:55:00") },
      { id: "m4", role: "assistant", content: "Here are the key best practices for REST API design in Python:\n\n1. **Use FastAPI or Flask** — FastAPI is recommended for modern async APIs\n2. **Follow RESTful conventions** — Use proper HTTP methods and status codes\n3. **Version your API** — Use `/api/v1/` prefix\n4. **Validate inputs** — Use Pydantic models for request/response schemas\n5. **Handle errors consistently** — Return structured error responses\n6. **Add authentication** — JWT or OAuth2 for security\n\nWant me to show a code example?", timestamp: new Date("2026-02-26T15:00:00") },
    ],
  },
  {
    id: "conv_3",
    title: "Resume Review",
    model: "claude-3.5",
    updatedAt: new Date("2026-02-25T09:00:00"),
    messages: [
      { id: "m5", role: "user", content: "Can you review my resume for a senior engineering position?", timestamp: new Date("2026-02-25T08:50:00") },
      { id: "m6", role: "assistant", content: "I'd love to help review your resume! Please share it and I'll provide detailed feedback on:\n\n- **Structure & formatting**\n- **Impact-driven bullet points**\n- **Technical skills presentation**\n- **ATS optimization**\n\nPaste your resume content and I'll get started.", timestamp: new Date("2026-02-25T09:00:00") },
    ],
  },
];

const mockActivities: Activity[] = [
  { id: "a1", action: "Chat completion", tool: "AI Chat", timestamp: "2 min ago", tokens: 1240, status: "success" },
  { id: "a2", action: "Resume analyzed", tool: "Resume Analyzer", timestamp: "15 min ago", tokens: 3420, status: "success" },
  { id: "a3", action: "PDF summarized", tool: "PDF Summarizer", timestamp: "1 hr ago", tokens: 5100, status: "success" },
  { id: "a4", action: "Code explained", tool: "Code Explainer", timestamp: "2 hrs ago", tokens: 2800, status: "success" },
  { id: "a5", action: "Marketing copy generated", tool: "Marketing Generator", timestamp: "3 hrs ago", tokens: 1900, status: "error" },
  { id: "a6", action: "Business idea evaluated", tool: "Idea Generator", timestamp: "5 hrs ago", tokens: 4200, status: "success" },
];

const mockDailyUsage: DailyUsage[] = [
  { date: "Feb 21", tokens: 12400, requests: 45 },
  { date: "Feb 22", tokens: 18200, requests: 62 },
  { date: "Feb 23", tokens: 9800, requests: 31 },
  { date: "Feb 24", tokens: 22100, requests: 78 },
  { date: "Feb 25", tokens: 15600, requests: 52 },
  { date: "Feb 26", tokens: 19800, requests: 67 },
  { date: "Feb 27", tokens: 8400, requests: 28 },
];

export const mockPricingPlans: PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for exploring AI capabilities",
    features: ["1,000 tokens/month", "Basic AI chat", "1 AI tool", "Community support", "Basic analytics"],
    cta: "Get Started",
  },
  {
    id: "pro",
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For professionals who need more power",
    features: ["100,000 tokens/month", "All AI models", "All AI tools", "Custom agents", "Priority support", "Advanced analytics", "API access"],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For teams that need enterprise-grade AI",
    features: ["Unlimited tokens", "Custom model fine-tuning", "SSO & SAML", "Dedicated support", "SLA guarantee", "On-premise option", "Custom integrations", "Audit logs"],
    cta: "Contact Sales",
  },
];

export const mockAITools: AITool[] = [
  { id: "t1", name: "Resume Analyzer", description: "AI-powered resume analysis and improvement suggestions", icon: "FileText", category: "Documents", usageCount: 1240 },
  { id: "t2", name: "PDF Summarizer", description: "Extract key insights from any PDF document", icon: "FileSearch", category: "Documents", usageCount: 890 },
  { id: "t3", name: "Code Explainer", description: "Understand complex code with detailed explanations", icon: "Code", category: "Development", usageCount: 2100 },
  { id: "t4", name: "Marketing Generator", description: "Generate compelling marketing copy and campaigns", icon: "Megaphone", category: "Marketing", usageCount: 760 },
  { id: "t5", name: "Business Idea Generator", description: "Validate and expand on business concepts", icon: "Lightbulb", category: "Business", usageCount: 540 },
];

// Mock API functions
export async function fetchUser(): Promise<User> {
  await delay(300);
  return mockUser;
}

export async function fetchConversations(): Promise<Conversation[]> {
  await delay(400);
  return mockConversations;
}

export async function fetchConversation(id: string): Promise<Conversation | undefined> {
  await delay(200);
  return mockConversations.find((c) => c.id === id);
}

export async function fetchUsageStats(): Promise<UsageStats> {
  await delay(300);
  return { totalTokens: 84250, totalRequests: 1847, activeTools: 5, uptime: 99.9 };
}

export async function fetchActivities(): Promise<Activity[]> {
  await delay(350);
  return mockActivities;
}

export async function fetchDailyUsage(): Promise<DailyUsage[]> {
  await delay(400);
  return mockDailyUsage;
}

export async function fetchPricingPlans(): Promise<PricingPlan[]> {
  await delay(200);
  return mockPricingPlans;
}

export async function fetchAITools(): Promise<AITool[]> {
  await delay(300);
  return mockAITools;
}

export async function sendMessage(conversationId: string, content: string): Promise<Message> {
  await delay(1500);
  return {
    id: `m_${Date.now()}`,
    role: "assistant",
    content: `Thank you for your message. Here's my analysis:\n\n${content.length > 50 ? "That's a detailed question. " : ""}I've processed your request and here are my thoughts:\n\n1. **Key Insight:** Your query touches on an important area that requires careful consideration.\n2. **Recommendation:** Based on current best practices, I'd suggest a structured approach.\n3. **Next Steps:** Let me know if you'd like me to elaborate on any specific aspect.\n\n*This is a simulated response for demonstration purposes.*`,
    timestamp: new Date(),
  };
}
