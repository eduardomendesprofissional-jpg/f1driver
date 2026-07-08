import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Zap, Truck, MessageCircle, Wallet, Car, Users, UserCheck,
  Bell, Bug, MapPin, DollarSign, PlusCircle, LayoutGrid, Image,
  Tag, Store, FileText, BarChart3, CreditCard, Map, Shield, Settings,
  ChevronDown, ChevronRight, UserPlus
} from "lucide-react";
import { useState, useEffect } from "react";
import logoF1 from "@/assets/logo-f1driver.jpeg";
import { ScrollArea } from "@/components/ui/scroll-area";

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
      { label: "Painel de Solicitações", path: "/admin/whats/painel" },
      { label: "Palavras Chave", path: "/admin/whats/palavras-chave" },
      { label: "Meus Clientes", path: "/admin/whats/clientes" },
    ],
  },
  {
    label: "Meu Caixa", icon: Wallet,
    children: [
      { label: "Pré Pago", path: "/admin/caixa/pre-pago" },
      { label: "Pós Pago", path: "/admin/caixa/pos-pago" },
      { label: "Cartão", path: "/admin/caixa/cartao" },
    ],
  },
  {
    label: "Viagens", icon: Car,
    children: [
      { label: "Tempo Real", path: "/admin/viagens/tempo-real" },
      { label: "Encerradas", path: "/admin/viagens/encerradas" },
      { label: "Em Andamento", path: "/admin/viagens/andamento" },
      { label: "Registro de Chamadas", path: "/admin/viagens/registro-chamadas" },
      { label: "Todas as Viagens", path: "/admin/viagens/todas" },
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
  
  { label: "Aprovações Créditos", icon: CreditCard, path: "/admin/aprovacoes-creditos" },
  { label: "Mapa de Motoristas", icon: Map, path: "/admin/mapa-motoristas" },
  { label: "Suporte Emergencial", icon: Shield, path: "/admin/suporte" },
  { label: "Administradores", icon: UserPlus, path: "/admin/administradores" },
  { label: "Configurar Aplicativo", icon: Settings, path: "/admin/configurar" },
];

const SidebarItem = ({ item, onNavigate }: { item: NavItem; onNavigate?: () => void }) => {
  const location = useLocation();
  const isChildActive = item.children?.some((c) => location.pathname === c.path) ?? false;
  const [open, setOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setOpen(true);
  }, [isChildActive]);

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-200 active:scale-[0.98] hover:bg-sidebar-accent ${
            isChildActive ? "text-primary" : "text-sidebar-foreground/70"
          }`}
        >
          <item.icon size={18} className="shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          <ChevronDown
            size={14}
            className={`shrink-0 transition-transform duration-200 ${open ? "rotate-0" : "-rotate-90"}`}
          />
        </button>
        <div
          className={`overflow-hidden transition-all duration-200 ${
            open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="ml-8 space-y-0.5 mt-0.5 border-l border-sidebar-border pl-2">
            {item.children.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                onClick={onNavigate}
                className={({ isActive }) =>
                  `block px-3 py-2 text-sm rounded-lg transition-all duration-150 active:scale-[0.98] ${
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
        </div>
      </div>
    );
  }

  return (
    <NavLink
      to={item.path!}
      end={item.path === "/admin"}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 active:scale-[0.98] ${
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent"
        }`
      }
    >
      <item.icon size={18} className="shrink-0" />
      <span className="truncate">{item.label}</span>
    </NavLink>
  );
};

const AdminSidebar = ({ onNavigate }: { onNavigate?: () => void }) => {
  return (
    <aside className="w-60 h-full min-h-0 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 max-h-screen">
      <div className="p-4 flex items-center gap-2.5 border-b border-sidebar-border">
        <img src={logoF1} alt="Logo" className="w-9 h-9 rounded-xl" />
        <span className="text-sm font-bold text-sidebar-foreground tracking-wide uppercase">
          ADE Drive
        </span>
      </div>

      <ScrollArea className="flex-1">
        <nav className="px-2 py-3 space-y-0.5">
          {navItems.map((item) => (
            <SidebarItem key={item.label} item={item} onNavigate={onNavigate} />
          ))}
        </nav>
      </ScrollArea>
    </aside>
  );
};

export default AdminSidebar;
