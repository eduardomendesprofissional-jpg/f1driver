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
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 px-4 z-40">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => navigate(item.path)}
          className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-colors ${
            active === item.id ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <item.icon size={20} />
          <span className="text-[10px] font-semibold">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
