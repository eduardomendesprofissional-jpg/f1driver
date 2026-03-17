import { useNavigate } from "react-router-dom";
import { Home, Clock, User, Package } from "lucide-react";

interface BottomNavProps {
  active: "home" | "history" | "profile" | "envios";
  role: "passenger" | "driver";
}

const BottomNav = ({ active, role }: BottomNavProps) => {
  const navigate = useNavigate();

  const passengerItems = [
    { id: "home" as const, icon: Home, label: "Início", path: "/passenger" },
    { id: "envios" as const, icon: Package, label: "Envios", path: "/envios" },
    { id: "history" as const, icon: Clock, label: "Histórico", path: "/history" },
    { id: "profile" as const, icon: User, label: "Perfil", path: "/profile" },
  ];

  const driverItems = [
    { id: "home" as const, icon: Home, label: "Início", path: "/driver" },
    { id: "history" as const, icon: Clock, label: "Histórico", path: "/history" },
    { id: "profile" as const, icon: User, label: "Perfil", path: "/driver/profile" },
  ];

  const items = role === "passenger" ? passengerItems : driverItems;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-3 safe-bottom">
      <div className="glass-heavy border border-border/30 rounded-2xl flex justify-around py-1 px-1 shadow-[0_-2px_24px_rgba(0,0,0,0.2)] mb-1">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 px-5 rounded-xl transition-all duration-200 press-sm ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
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
  );
};

export default BottomNav;
