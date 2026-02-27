import { Outlet, Link, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";
import { Users, FileText, Wrench, Activity, ToggleRight, BarChart3, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

const adminNavItems = [
  { title: "Overview", url: "/admin", icon: Activity },
  { title: "User Management", url: "/admin/users", icon: Users },
  { title: "Usage Logs", url: "/admin/logs", icon: FileText },
  { title: "Tool Management", url: "/admin/tools", icon: Wrench },
  { title: "System Health", url: "/admin/health", icon: Activity },
  { title: "Feature Flags", url: "/admin/flags", icon: ToggleRight },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-destructive flex items-center justify-center shrink-0">
          <Shield className="h-4 w-4 text-destructive-foreground" />
        </div>
        {!collapsed && <span className="font-display font-bold text-sm text-sidebar-foreground">Admin Panel</span>}
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      activeClassName="bg-sidebar-accent text-sidebar-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <div className="mt-auto p-4">
        {!collapsed && (
          <Button variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/60 hover:text-sidebar-foreground" asChild>
            <Link to="/dashboard">
              <LogOut className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        )}
      </div>
    </Sidebar>
  );
}

export default function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b flex items-center justify-between px-4 bg-background shrink-0">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <span className="text-sm font-medium text-destructive">Admin Panel</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link to="/dashboard">Exit Admin</Link>
            </Button>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
