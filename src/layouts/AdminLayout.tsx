import { Outlet } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { Menu, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import logoF1 from "@/assets/logo-f1driver.jpeg";

const AdminLayout = () => {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
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
        <header className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-foreground">
                <Menu size={22} />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
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
        <header className="h-14 border-b border-border flex items-center justify-end px-6">
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
