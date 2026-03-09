import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, KeyRound, Workflow, ShieldCheck } from "lucide-react";

const sections = [
  {
    icon: BookOpen,
    title: "Getting Started",
    description: "Project setup, first login, and dashboard walkthrough.",
    items: ["Create account", "Connect provider keys", "Run first AI chat"],
  },
  {
    icon: Workflow,
    title: "Core Workflows",
    description: "How to use chat, tools, files, and custom agents together.",
    items: ["Tool execution flow", "Conversation history", "Agent configuration"],
  },
  {
    icon: KeyRound,
    title: "Admin Operations",
    description: "Manage users, tools, provider keys, logs, and feature flags.",
    items: ["User moderation", "Tool lifecycle", "Provider key rotation"],
  },
  {
    icon: ShieldCheck,
    title: "Security & Limits",
    description: "Authentication, access roles, quotas, and usage tracking.",
    items: ["JWT auth", "Role-based access", "Token quota enforcement"],
  },
];

export default function Docs() {
  return (
    <div className="pt-24 pb-16">
      <div className="container mx-auto px-4 space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground">Documentation</h1>
          <p className="mt-3 text-muted-foreground">
            Technical guides for using and operating AI Command Center.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((section) => (
            <Card key={section.title} className="border-transparent card-elevated">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <section.icon className="h-5 w-5 text-primary" />
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{section.description}</p>
                <ul className="space-y-1 text-sm text-foreground">
                  {section.items.map((item) => (
                    <li key={item}>- {item}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link to="/login">Open Platform</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
