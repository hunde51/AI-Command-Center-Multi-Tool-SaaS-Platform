import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MessageSquare, Wand2, Users, BarChart3, Shield, Zap, ArrowRight, Bot, FileText, Code } from "lucide-react";

const mainFeatures = [
  {
    icon: MessageSquare,
    title: "Multi-Model AI Chat",
    description: "Switch between GPT-4o, Claude 3.5, and Gemini Pro in one interface. Full markdown rendering, conversation history, and context management.",
    highlights: ["Multiple AI models", "Markdown rendering", "Conversation memory"],
  },
  {
    icon: Wand2,
    title: "AI-Powered Tools",
    description: "Purpose-built tools for common workflows. Analyze resumes, summarize PDFs, explain code, and generate marketing content in seconds.",
    highlights: ["Resume Analyzer", "PDF Summarizer", "Code Explainer"],
  },
  {
    icon: Bot,
    title: "Custom AI Agents",
    description: "Build agents with custom system prompts, upload knowledge bases, and deploy specialized AI assistants for your unique use cases.",
    highlights: ["System prompts", "Knowledge upload", "Agent marketplace"],
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track token usage, monitor request patterns, and optimize your AI spending with comprehensive dashboards and reports.",
    highlights: ["Usage tracking", "Cost optimization", "Performance metrics"],
  },
];

const additionalFeatures = [
  { icon: Shield, title: "Enterprise Security", desc: "SOC2 compliant, E2E encryption, SSO/SAML" },
  { icon: Zap, title: "99.9% Uptime", desc: "Globally distributed infrastructure with failover" },
  { icon: FileText, title: "API Access", desc: "RESTful API with comprehensive documentation" },
  { icon: Code, title: "Integrations", desc: "Connect with Slack, Notion, GitHub, and more" },
  { icon: Users, title: "Team Management", desc: "Role-based access, shared workspaces, audit logs" },
  { icon: Bot, title: "Fine-Tuning", desc: "Custom model training on your data (Enterprise)" },
];

export default function Features() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground max-w-3xl mx-auto">
            Every tool you need to harness AI
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            A complete platform for AI-powered workflows, from simple chat to complex automation.
          </p>
        </div>

        {/* Main Features */}
        <div className="space-y-20 mb-24">
          {mainFeatures.map((f, i) => (
            <div key={f.title} className={`flex flex-col md:flex-row items-center gap-12 ${i % 2 === 1 ? "md:flex-row-reverse" : ""}`}>
              <div className="flex-1">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">{f.title}</h2>
                <p className="mt-3 text-muted-foreground leading-relaxed">{f.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {f.highlights.map((h) => (
                    <span key={h} className="text-xs font-medium text-primary bg-primary/10 rounded-full px-3 py-1">{h}</span>
                  ))}
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="rounded-2xl bg-card card-elevated border border-primary/5 aspect-video flex items-center justify-center">
                  <f.icon className="h-16 w-16 text-primary/20" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features Grid */}
        <div className="mb-20">
          <h2 className="font-display text-2xl font-bold text-foreground text-center mb-10">And much more</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((f) => (
              <div key={f.title} className="rounded-2xl bg-card p-6 card-elevated border border-transparent hover:border-primary/10 transition-all">
                <f.icon className="h-5 w-5 text-primary mb-3" />
                <h3 className="font-display font-semibold text-card-foreground">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-foreground">Ready to get started?</h2>
          <p className="text-muted-foreground mt-2">Start your free trial today. No credit card required.</p>
          <Button className="mt-6 gap-2" size="lg" asChild>
            <Link to="/login">Start Free Trial <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
