import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare, Wand2, Shield, BarChart3, Users, ArrowRight, Star, Check } from "lucide-react";
import { mockPricingPlans } from "@/services/mockApi";

const features = [
  { icon: MessageSquare, title: "AI Chat", description: "Multi-model chat interface with GPT-4o, Claude 3.5, and more. Full markdown rendering and conversation history." },
  { icon: Wand2, title: "Smart Tools", description: "Resume analyzer, PDF summarizer, code explainer, and marketing generator — all powered by state-of-the-art AI." },
  { icon: Users, title: "Custom Agents", description: "Build and deploy custom AI agents with system prompts, knowledge bases, and specialized behaviors." },
  { icon: BarChart3, title: "Analytics", description: "Track token usage, request patterns, and tool performance with detailed charts and insights." },
  { icon: Shield, title: "Enterprise Security", description: "SOC2 compliant, end-to-end encryption, SSO/SAML support, and comprehensive audit logging." },
  { icon: Zap, title: "Lightning Fast", description: "Optimized inference pipeline with sub-second response times and 99.9% uptime guarantee." },
];

const steps = [
  { num: "01", title: "Connect Your Workflow", description: "Sign up and integrate AI Command Center with your existing tools and processes." },
  { num: "02", title: "Choose Your AI Models", description: "Select from top AI models and configure custom agents for your specific needs." },
  { num: "03", title: "Scale with Confidence", description: "Monitor usage, optimize costs, and scale your AI operations effortlessly." },
];

const testimonials = [
  { name: "Sarah Chen", role: "VP of Engineering, Nexus Corp", quote: "AI Command Center reduced our content creation time by 60%. The custom agents are game-changing.", rating: 5 },
  { name: "Marcus Johnson", role: "Founder, DataFlow", quote: "The best AI platform we've used. Clean interface, powerful tools, and excellent enterprise features.", rating: 5 },
  { name: "Elena Kowalski", role: "Head of Product, TechBridge", quote: "Finally, an AI platform that our entire team can use. The analytics give us full visibility into usage.", rating: 5 },
];

export default function Landing() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-gradient hero-grid relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-[500px] w-[500px] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow" />
        </div>
        <div className="container relative z-10 mx-auto px-4 text-center py-32">
          <div className="inline-flex items-center gap-2 rounded-full border-glow bg-primary/10 px-4 py-1.5 mb-8 opacity-0 animate-fade-in">
            <Zap className="h-3.5 w-3.5 text-accent" />
            <span className="text-xs font-medium text-primary-foreground/80">Now with GPT-4o & Claude 3.5 Sonnet</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-bold text-gradient leading-tight max-w-4xl mx-auto opacity-0 animate-fade-in-delay-1">
            The AI Command Center for Modern Teams
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-primary-foreground/60 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-delay-2">
            Harness the power of AI across your entire workflow. From intelligent chat to automated tools, everything your team needs in one unified platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10 opacity-0 animate-fade-in-delay-3">
            <Button variant="hero" size="lg" asChild>
              <Link to="/login" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/features">Explore Features</Link>
            </Button>
          </div>
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-primary-foreground/40 text-sm opacity-0 animate-fade-in-delay-3">
            <span>✓ Free tier available</span>
            <span>✓ No credit card required</span>
            <span>✓ SOC2 compliant</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Features</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Everything you need to command AI</h2>
            <p className="mt-4 text-muted-foreground max-w-xl mx-auto">A complete suite of AI tools designed for productivity, built for scale.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group rounded-2xl bg-card p-6 card-elevated hover:card-elevated-hover transition-all duration-300 border border-transparent hover:border-primary/10">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-lg text-card-foreground">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">How It Works</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Up and running in minutes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s) => (
              <div key={s.num} className="text-center">
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary text-primary-foreground font-display font-bold text-lg mb-4">
                  {s.num}
                </div>
                <h3 className="font-display font-semibold text-foreground">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Pricing</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Simple, transparent pricing</h2>
            <p className="mt-4 text-muted-foreground">Start free, scale as you grow.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {mockPricingPlans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl p-6 border transition-all duration-300 ${
                  plan.highlighted
                    ? "bg-card card-elevated border-primary/30 ring-1 ring-primary/20 scale-[1.02]"
                    : "bg-card card-elevated border-transparent hover:border-primary/10"
                }`}
              >
                {plan.highlighted && (
                  <span className="inline-block text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1 mb-4">Most Popular</span>
                )}
                <h3 className="font-display font-bold text-xl text-card-foreground">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-card-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-card-foreground">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button className="w-full mt-6" variant={plan.highlighted ? "default" : "outline"} asChild>
                  <Link to="/login">{plan.cta}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">Testimonials</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground">Loved by teams worldwide</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-card p-6 card-elevated">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-sm text-card-foreground leading-relaxed italic">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t">
                  <p className="font-semibold text-sm text-card-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="hero-gradient py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-gradient">Ready to command your AI workflow?</h2>
          <p className="mt-4 text-primary-foreground/60 max-w-lg mx-auto">Join thousands of teams using AI Command Center to work smarter, faster, and more efficiently.</p>
          <Button variant="hero" size="lg" className="mt-8" asChild>
            <Link to="/login" className="gap-2">
              Get Started Free <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="font-display font-bold text-sm text-background">AI Command Center</span>
              </div>
              <p className="text-xs text-background/40">Enterprise AI platform for modern teams.</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-background mb-3">Product</h4>
              <ul className="space-y-2 text-xs text-background/50">
                <li><Link to="/features" className="hover:text-background/80">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-background/80">Pricing</Link></li>
                <li><a href="#" className="hover:text-background/80">Changelog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-background mb-3">Company</h4>
              <ul className="space-y-2 text-xs text-background/50">
                <li><a href="#" className="hover:text-background/80">About</a></li>
                <li><a href="#" className="hover:text-background/80">Blog</a></li>
                <li><a href="#" className="hover:text-background/80">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm text-background mb-3">Legal</h4>
              <ul className="space-y-2 text-xs text-background/50">
                <li><a href="#" className="hover:text-background/80">Privacy</a></li>
                <li><a href="#" className="hover:text-background/80">Terms</a></li>
                <li><a href="#" className="hover:text-background/80">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-background/10 pt-8 text-center">
            <p className="text-xs text-background/30">© 2026 AI Command Center. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
