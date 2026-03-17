import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Home, Clock, User, Package, Menu, CreditCard, HelpCircle, Settings, LogOut, Gift, Shield, Bell, ChevronRight, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface BottomNavProps {
  active: "home" | "history" | "profile" | "envios";
  role: "passenger" | "driver";
}

const BottomNav = ({ active, role }: BottomNavProps) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();

  const menuItems = [
    { icon: User, label: "Meu Perfil", path: "/profile", color: "text-primary" },
    { icon: CreditCard, label: "Pagamento", path: "/profile", color: "text-emerald-500" },
    { icon: Clock, label: "Minhas Viagens", path: "/history", color: "text-blue-500" },
    { icon: Package, label: "Meus Envios", path: "/envios", color: "text-orange-500" },
    { icon: Gift, label: "Indicar Amigos", path: "/passenger/referral", color: "text-pink-500" },
    { icon: Bell, label: "Notificações", path: "/passenger/inbox", color: "text-violet-500" },
    { icon: Shield, label: "Segurança", path: "/profile", color: "text-cyan-500" },
    { icon: HelpCircle, label: "Ajuda", path: "/profile", color: "text-amber-500" },
    { icon: Settings, label: "Configurações", path: "/profile", color: "text-muted-foreground" },
  ];

  const passengerItems = [
    { id: "home" as const, icon: Home, label: "Início", path: "/passenger", action: () => navigate("/passenger") },
    { id: "envios" as const, icon: Package, label: "Envios", path: "/envios", action: () => navigate("/envios") },
    { id: "history" as const, icon: Clock, label: "Histórico", path: "/history", action: () => navigate("/history") },
    { id: "profile" as const, icon: Menu, label: "Menu", path: "", action: () => setMenuOpen(true) },
  ];

  const driverItems = [
    { id: "home" as const, icon: Home, label: "Início", path: "/driver", action: () => navigate("/driver") },
    { id: "history" as const, icon: Clock, label: "Histórico", path: "/history", action: () => navigate("/history") },
    { id: "profile" as const, icon: User, label: "Perfil", path: "/driver/profile", action: () => navigate("/driver/profile") },
  ];

  const items = role === "passenger" ? passengerItems : driverItems;

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    navigate("/login");
  };

  const userName = profile?.nome || user?.email?.split("@")[0] || "Usuário";
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-40 px-3 safe-bottom">
        <div className="glass-heavy border border-border/30 rounded-2xl flex justify-around py-1 px-1 shadow-[0_-2px_24px_rgba(0,0,0,0.2)] mb-1">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={item.action}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 px-5 rounded-xl transition-all duration-200 press-sm ${
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {isActive && item.id !== "profile" && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-primary" />
                )}
                <item.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[10px] ${isActive ? "font-bold" : "font-medium"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Side Menu Sheet */}
      {role === "passenger" && (
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" className="w-[85%] max-w-[340px] p-0 bg-background border-r-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>

            {/* User Header */}
            <div className="relative px-6 pt-14 pb-6 bg-gradient-to-br from-primary to-primary/80">
              <button
                onClick={() => setMenuOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"
              >
                <X size={16} className="text-primary-foreground" />
              </button>
              <div className="flex items-center gap-4">
                <Avatar className="w-16 h-16 border-2 border-primary-foreground/30 shadow-lg">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-xl font-bold">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-primary-foreground truncate">{userName}</h3>
                  <p className="text-xs text-primary-foreground/70 truncate">{user?.email}</p>
                  <button
                    onClick={() => { setMenuOpen(false); navigate("/profile"); }}
                    className="mt-1 text-[11px] font-semibold text-primary-foreground/90 underline underline-offset-2"
                  >
                    Ver perfil
                  </button>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
              <div className="space-y-0.5">
                {menuItems.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => { setMenuOpen(false); navigate(item.path); }}
                    className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-secondary/60 press-sm text-left transition-colors"
                  >
                    <div className="w-10 h-10 rounded-xl bg-secondary/80 flex items-center justify-center shrink-0">
                      <item.icon size={20} className={item.color} />
                    </div>
                    <span className="flex-1 text-sm font-medium text-foreground">{item.label}</span>
                    <ChevronRight size={16} className="text-muted-foreground/50" />
                  </button>
                ))}
              </div>

              {/* Divider */}
              <div className="my-3 mx-4 h-px bg-border/40" />

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-destructive/10 press-sm text-left transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <LogOut size={20} className="text-destructive" />
                </div>
                <span className="flex-1 text-sm font-medium text-destructive">Sair da conta</span>
              </button>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border/30">
              <p className="text-[10px] text-muted-foreground text-center">F1Driver v1.0 • Todos os direitos reservados</p>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};

export default BottomNav;
