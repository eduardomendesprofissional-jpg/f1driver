import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import AdminPWAInstallPrompt from "@/components/AdminPWAInstallPrompt";
import { ConfirmDialogProvider } from "@/components/ConfirmDialogProvider";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Sun, Moon, X } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import logoF1 from "@/assets/logo-f1driver.jpeg";

const AdminLayout = () => {
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLight, setIsLight] = useState(() => {
    return localStorage.getItem("theme") === "light";
  });

  // Admin uses the dark theme by default; toggle removes it for light.
  // The .dark class is scoped to admin and removed when leaving the admin area.
  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
    return () => {
      document.documentElement.classList.remove("dark");
    };
  }, [isLight]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isMobile, sidebarOpen]);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  const themeToggle = (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsLight(!isLight)}
      className="h-8 w-8 rounded-full"
      title={isLight ? "Modo Noite" : "Modo Dia"}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </Button>
  );

  if (isMobile) {
    return (
      <ConfirmDialogProvider>
      <div className="flex flex-col min-h-screen w-full bg-background">
        {/* Header */}
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 sticky top-0 z-40 bg-background/95 backdrop-blur-sm">
          <button
            className="p-2 -ml-2 text-foreground active:scale-95 transition-transform"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <div className="flex items-center gap-2">
            <img src={logoF1} alt="Logo" className="w-7 h-7 rounded-lg" />
            <span className="text-sm font-bold tracking-wide uppercase">ADE Drive</span>
          </div>
          <div className="flex items-center gap-2">
            {themeToggle}
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        <div
          className={`fixed inset-0 z-50 transition-all duration-300 ${
            sidebarOpen ? "visible" : "invisible"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeSidebar}
          />
          {/* Sidebar Panel */}
          <div
            className={`absolute inset-y-0 left-0 w-[280px] max-w-[85vw] transform transition-transform duration-300 ease-out ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="relative h-full">
              <AdminSidebar onNavigate={closeSidebar} />
              <button
                onClick={closeSidebar}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-4">
          <AdminPWAInstallPrompt />
          <Outlet />
        </main>
      </div>
      </ConfirmDialogProvider>
    );
  }

  return (
    <ConfirmDialogProvider>
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-end px-6 sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {themeToggle}
            <span className="text-sm text-muted-foreground">Central ADE Drive</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <AdminPWAInstallPrompt />
          <Outlet />
        </main>
      </div>
    </div>
    </ConfirmDialogProvider>
  );
};

export default AdminLayout;
