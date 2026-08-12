import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { useMediaQuery } from "../hooks/useCountUp";
import { ProtectedRoute } from "../components/ProtectedRoute";

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  return (
    <ProtectedRoute>
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed && isDesktop}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
    </ProtectedRoute>
  );
}
