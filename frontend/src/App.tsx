import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Outlet, Routes, Route } from "react-router-dom";
import PublicLayout from "@/components/layouts/PublicLayout";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import AdminLayout from "@/components/layouts/AdminLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Pricing from "@/pages/Pricing";
import Features from "@/pages/Features";
import Docs from "@/pages/Docs";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Dashboard from "@/pages/Dashboard";
import AIChat from "@/pages/AIChat";
import AITools from "@/pages/AITools";
import Analytics from "@/pages/Analytics";
import DashboardSettings from "@/pages/DashboardSettings";
import AdminOverview from "@/pages/admin/AdminOverview";
import UserManagement from "@/pages/admin/UserManagement";
import UsageLogs from "@/pages/admin/UsageLogs";
import ToolManagement from "@/pages/admin/ToolManagement";
import ProviderKeys from "@/pages/admin/ProviderKeys";
import SystemHealth from "@/pages/admin/SystemHealth";
import FeatureFlags from "@/pages/admin/FeatureFlags";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import NotFound from "@/pages/NotFound";
import { getUserRole, hasAccessToken } from "@/services/backendApi";

const queryClient = new QueryClient();

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
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
