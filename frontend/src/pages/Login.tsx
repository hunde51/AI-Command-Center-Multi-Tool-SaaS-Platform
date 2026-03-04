import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loginWithBackend, registerWithBackend } from "@/services/backendApi";

export default function Login() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (mode === "signup" && (!name || !username))) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      if (mode === "signup") {
        await registerWithBackend({ name, username, email, password });
      }
      await loginWithBackend(email, password);
      toast({
        title: mode === "signup" ? "Account created" : "Welcome back!",
        description: "Redirecting to dashboard...",
      });
      navigate("/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      toast({ title: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8 pt-24">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">AI Command Center</span>
          </Link>

          <h1 className="font-display text-2xl font-bold text-foreground">
            {mode === "signin" ? "Welcome back" : "Create account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "signin" ? "Sign in to your account to continue" : "Create your account to get started"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {mode === "signup" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
              </>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {mode === "signin" ? <a href="#" className="text-xs text-primary hover:underline">Forgot password?</a> : null}
              </div>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (mode === "signin" ? "Signing in..." : "Creating account...") : (mode === "signin" ? "Sign In" : "Sign Up")}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center mt-6">
            {mode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 hero-gradient hero-grid items-center justify-center relative overflow-hidden">
        <div className="absolute h-[400px] w-[400px] rounded-full bg-primary/10 blur-[100px] animate-pulse-glow" />
        <div className="relative z-10 text-center p-12 max-w-md">
          <h2 className="font-display text-3xl font-bold text-gradient">Command your AI workflow</h2>
          <p className="mt-4 text-primary-foreground/50 text-sm leading-relaxed">Access powerful AI tools, custom agents, and intelligent analytics — all from one platform.</p>
        </div>
      </div>
    </div>
  );
}
