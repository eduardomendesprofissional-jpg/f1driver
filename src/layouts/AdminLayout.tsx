import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import AdminPWAInstallPrompt from "@/components/AdminPWAInstallPrompt";
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

  useEffect(() => {
    if (isLight) {
      document.documentElement.classList.add("light");
      localStorage.setItem("theme", "light");
    } else {
      document.documentElement.classList.remove("light");
      localStorage.setItem("theme", "dark");
    }
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
            <span className="text-sm font-bold tracking-wide uppercase">F1 Driver</span>
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
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center justify-end px-6 sticky top-0 z-30 bg-background/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {themeToggle}
            <span className="text-sm text-muted-foreground">Central F1 Driver</span>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/20 text-primary text-xs">AD</AvatarFallback>
            </Avatar>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
