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
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-2 pt-1">
      <div className="bg-card/90 backdrop-blur-xl border border-border/50 rounded-2xl flex justify-around py-1.5 px-2 shadow-[0_-4px_30px_rgba(0,0,0,0.25)]">
        {items.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 py-2 px-5 rounded-xl transition-all ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
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
