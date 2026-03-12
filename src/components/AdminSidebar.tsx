import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Zap, Truck, MessageCircle, Wallet, Car, Users, UserCheck,
  Bell, Bug, MapPin, DollarSign, PlusCircle, LayoutGrid, Image,
  Tag, Store, FileText, BarChart3, CreditCard, Map, Shield, Settings,
  ChevronDown, ChevronRight
} from "lucide-react";
import { useState } from "react";
import logoF1 from "@/assets/logo-f1driver.jpeg";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: { label: string; path: string }[];
}

const navItems: NavItem[] = [
  { label: "Principal", icon: Home, path: "/admin" },
  { label: "Despacho Rápido", icon: Zap, path: "/admin/despacho" },
  {
    label: "Chamadas Whats", icon: MessageCircle,
    children: [
      { label: "Enviar Mensagem", path: "/admin/whats/enviar" },
      { label: "Histórico", path: "/admin/whats/historico" },
    ],
  },
  {
    label: "Meu Caixa", icon: Wallet,
    children: [
      { label: "Resumo", path: "/admin/caixa/resumo" },
      { label: "Extrato", path: "/admin/caixa/extrato" },
    ],
  },
  {
    label: "Viagens", icon: Car,
    children: [
      { label: "Em andamento", path: "/admin/viagens/andamento" },
      { label: "Finalizadas", path: "/admin/viagens/finalizadas" },
    ],
  },
  { label: "Motoristas", icon: Users, path: "/admin/motoristas" },
  { label: "Passageiros", icon: UserCheck, path: "/admin/passageiros" },
  { label: "Disparar Notificação", icon: Bell, path: "/admin/notificacao" },
  { label: "Relatório de Erros", icon: Bug, path: "/admin/erros" },
  { label: "Mapa de Calor", icon: MapPin, path: "/admin/mapa-calor" },
  { label: "Precificação", icon: DollarSign, path: "/admin/precificacao" },
  { label: "Nova Cidade", icon: PlusCircle, path: "/admin/nova-cidade" },
  { label: "Categorias de Veículos", icon: LayoutGrid, path: "/admin/categorias" },
  { label: "Anúncios/Banners", icon: Image, path: "/admin/anuncios" },
  {
    label: "Cupons", icon: Tag,
    children: [
      { label: "Criar Cupom", path: "/admin/cupons/criar" },
      { label: "Listar Cupons", path: "/admin/cupons/listar" },
    ],
  },
  {
    label: "Estabelecimentos", icon: Store,
    children: [
      { label: "Listar", path: "/admin/estabelecimentos/listar" },
      { label: "Cadastrar", path: "/admin/estabelecimentos/cadastrar" },
    ],
  },
  { label: "Relatório Estabelecimentos", icon: FileText, path: "/admin/relatorio-estabelecimentos" },
  { label: "Relatório de Viagens", icon: BarChart3, path: "/admin/relatorio-viagens" },
  { label: "Mensalidades", icon: CreditCard, path: "/admin/mensalidades" },
  { label: "Mapa de Motoristas", icon: Map, path: "/admin/mapa-motoristas" },
  { label: "Suporte Emergencial", icon: Shield, path: "/admin/suporte" },
  { label: "Configurar Aplicativo", icon: Settings, path: "/admin/configurar" },
];

const SidebarItem = ({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  if (item.children) {
    const isChildActive = item.children.some((c) => location.pathname === c.path);
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors hover:bg-sidebar-accent ${
            isChildActive ? "text-primary" : "text-sidebar-foreground/70"
          }`}
        >
          <item.icon size={18} />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
        {open && (
          <div className="ml-9 space-y-0.5 mt-0.5">
             {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent"
                  }`
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.path!}
      end={item.path === "/admin"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
        }`
      }
    >
      <item.icon size={18} />
      <span>{item.label}</span>
    </NavLink>
  );
};

const AdminSidebar = () => {
  return (
    <aside className="w-56 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shrink-0">
      <div className="p-4 flex items-center gap-2">
        <img src={logoF1} alt="Logo" className="w-8 h-8 rounded-lg" />
        <span className="text-sm font-bold text-sidebar-foreground tracking-wide uppercase">
          F1 Driver
        </span>
      </div>

      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} />
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
