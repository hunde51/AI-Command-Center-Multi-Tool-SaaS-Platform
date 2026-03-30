import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Routes, Route } from "react-router-dom";
import { getUserRole, hasAccessToken } from "@/services/backendApi";

const PublicLayout = lazy(() => import("@/components/layouts/PublicLayout"));
const DashboardLayout = lazy(() => import("@/components/layouts/DashboardLayout"));
const AdminLayout = lazy(() => import("@/components/layouts/AdminLayout"));
const Landing = lazy(() => import("@/pages/Landing"));
const Login = lazy(() => import("@/pages/Login"));
const Pricing = lazy(() => import("@/pages/Pricing"));
const Features = lazy(() => import("@/pages/Features"));
const Docs = lazy(() => import("@/pages/Docs"));
const Blog = lazy(() => import("@/pages/Blog"));
const BlogPost = lazy(() => import("@/pages/BlogPost"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AIChat = lazy(() => import("@/pages/AIChat"));
const AITools = lazy(() => import("@/pages/AITools"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const DashboardSettings = lazy(() => import("@/pages/DashboardSettings"));
const AdminOverview = lazy(() => import("@/pages/admin/AdminOverview"));
const UserManagement = lazy(() => import("@/pages/admin/UserManagement"));
const UsageLogs = lazy(() => import("@/pages/admin/UsageLogs"));
const ToolManagement = lazy(() => import("@/pages/admin/ToolManagement"));
const ProviderKeys = lazy(() => import("@/pages/admin/ProviderKeys"));
const SystemHealth = lazy(() => import("@/pages/admin/SystemHealth"));
const FeatureFlags = lazy(() => import("@/pages/admin/FeatureFlags"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

function AppFallback() {
  return <div className="min-h-screen bg-background" />;
}

function RequireAuth() {
  return hasAccessToken() ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireAdmin() {
  if (!hasAccessToken()) {
    return <Navigate to="/login" replace />;
  }
  return getUserRole() === "ADMIN" ? <Outlet /> : <Navigate to="/dashboard" replace />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<AppFallback />}>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/features" element={<Features />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
              </Route>
              <Route path="/login" element={<Login />} />

              {/* Dashboard routes */}
              <Route element={<RequireAuth />}>
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="chat" element={<AIChat />} />
                  <Route path="tools" element={<AITools />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<DashboardSettings />} />
                </Route>
              </Route>

              {/* Admin routes */}
              <Route element={<RequireAdmin />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminOverview />} />
                  <Route path="users" element={<UserManagement />} />
                  <Route path="logs" element={<UsageLogs />} />
                  <Route path="tools" element={<ToolManagement />} />
                  <Route path="provider-keys" element={<ProviderKeys />} />
                  <Route path="health" element={<SystemHealth />} />
                  <Route path="flags" element={<FeatureFlags />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
