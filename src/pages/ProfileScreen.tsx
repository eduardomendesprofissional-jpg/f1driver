import { motion } from "framer-motion";
import { User, CreditCard, Settings, ChevronRight, ArrowLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";

const ProfileScreen = () => {
  const navigate = useNavigate();

  const menuItems = [
    { icon: CreditCard, label: "Métodos de pagamento" },
    { icon: Settings, label: "Configurações" },
    { icon: LogOut, label: "Sair", danger: true },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="p-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg bg-secondary">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Perfil</h1>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-4"
      >
        {/* Avatar & Info */}
        <div className="flex flex-col items-center gap-3 py-6">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div className="text-center">
            <p className="text-lg font-bold">Carlos Silva</p>
            <p className="text-sm text-muted-foreground">carlos@email.com</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {menuItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => item.danger && navigate("/login")}
              className={`w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary transition-colors ${
                i < menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <item.icon size={20} className={item.danger ? "text-destructive" : "text-primary"} />
              <span className={`flex-1 text-left text-sm font-medium ${item.danger ? "text-destructive" : "text-foreground"}`}>
                {item.label}
              </span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </motion.div>

      <BottomNav active="profile" role="passenger" />
    </div>
  );
};

export default ProfileScreen;
