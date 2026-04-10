import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Users, 
  Factory, 
  PackageSearch, 
  Map, 
  Truck, 
  BarChart3, 
  Citrus, 
  Boxes,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen
} from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/orders", label: "Pedidos", icon: ShoppingCart },
  { href: "/customers", label: "Clientes", icon: Users },
  { href: "/products", label: "Produtos", icon: Boxes },
  { href: "/raw-materials", label: "Matéria-Prima", icon: Citrus },
  { href: "/production", label: "Produção", icon: Factory },
  { href: "/inventory", label: "Estoque", icon: PackageSearch },
  { href: "/traceability", label: "Rastreabilidade", icon: Map },
  { href: "/deliveries", label: "Entregas", icon: Truck },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const [location] = useLocation();

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col bg-white border-r border-border/60 shrink-0 fixed inset-y-0 z-20 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-border/60 shrink-0",
        collapsed ? "justify-center px-0" : "justify-between px-5"
      )}>
        {!collapsed && (
          <div className="flex flex-col leading-tight overflow-hidden">
            <span className="text-primary font-bold text-lg tracking-tight flex items-center gap-1.5">
              <Citrus className="w-5 h-5 text-primary fill-primary/20 shrink-0" />
              FS Frutas
            </span>
            <span className="text-[10px] text-muted-foreground font-medium tracking-tight truncate pl-[26px]">
              FS Laranja e Frutas Verde
            </span>
          </div>
        )}
        {collapsed && (
          <Citrus className="w-6 h-6 text-primary fill-primary/20" />
        )}
        {!collapsed && (
          <button
            onClick={onToggle}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors shrink-0"
            title="Minimizar menu"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-0.5 custom-scrollbar">
        {!collapsed && (
          <div className="px-3 mb-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
            Menu Principal
          </div>
        )}
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));

          return (
            <Link key={item.href} href={item.href}>
              <div
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer group",
                  collapsed && "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.label}</span>}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Footer */}
      <div className={cn("p-2 border-t border-border/60 space-y-0.5", collapsed && "px-1")}>
        <div
          title={collapsed ? "Configurações" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer group",
            collapsed && "justify-center px-0"
          )}
        >
          <Settings className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {!collapsed && <span>Configurações</span>}
        </div>
        <div
          title={collapsed ? "Sair" : undefined}
          className={cn(
            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all cursor-pointer group",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
          {!collapsed && <span>Sair</span>}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <button
            onClick={onToggle}
            className="w-full flex justify-center items-center py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            title="Expandir menu"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
