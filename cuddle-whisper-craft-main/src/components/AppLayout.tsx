import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, Package, Truck, Users, Settings, LogOut, 
  FileText, MessageSquare, History, UserPlus, Plus, Menu, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
}

function getNavItems(role: string, t: (key: string) => string): NavItem[] {
  if (role === 'driver') {
    return [
      { label: t('dashboard'), path: '/driver/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: t('available_loads'), path: '/driver/loads', icon: <Package size={20} /> },
      { label: t('my_trucks'), path: '/driver/trucks', icon: <Truck size={20} /> },
      { label: t('my_drivers'), path: '/driver/sub-drivers', icon: <Users size={20} /> },
      { label: t('load_history'), path: '/driver/history', icon: <History size={20} /> },
      { label: t('my_account'), path: '/driver/account', icon: <Settings size={20} /> },
    ];
  }
  if (role === 'shipper') {
    return [
      { label: t('dashboard'), path: '/shipper/dashboard', icon: <LayoutDashboard size={20} /> },
      { label: t('post_load'), path: '/shipper/post', icon: <Plus size={20} /> },
      { label: t('my_shipments'), path: '/shipper/loads', icon: <Package size={20} /> },
      { label: t('track_shipment'), path: '/shipper/track', icon: <FileText size={20} /> },
      { label: t('my_account'), path: '/shipper/account', icon: <Settings size={20} /> },
    ];
  }
  // admin
  return [
    { label: t('dashboard'), path: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: t('user_management'), path: '/admin/users', icon: <Users size={20} /> },
    { label: t('shipment_management'), path: '/admin/loads', icon: <Package size={20} /> },
    { label: t('support_tickets'), path: '/admin/tickets', icon: <MessageSquare size={20} /> },
    { label: t('system_settings'), path: '/admin/settings', icon: <Settings size={20} /> },
  ];
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { userProfile, currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navItems = getNavItems(currentRole || 'driver', t);

  return (
    <div className="min-h-screen flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 bg-sidebar-background text-sidebar-foreground flex flex-col transition-transform duration-300",
        sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border">
          <img src="/logo.png" alt="SAS Transport" className="w-10 h-10 rounded-lg" />
          <div>
            <h1 className="font-bold text-lg text-sidebar-primary-foreground">SAS Transport</h1>
            <p className="text-xs text-sidebar-foreground/60">{t(`${currentRole || 'driver'}`)}</p>
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden ms-auto text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </Button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                location.pathname === item.path
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-white">
              {userProfile?.full_name?.charAt(0) || '؟'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userProfile?.full_name}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{userProfile?.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={logout}
          >
            <LogOut size={18} />
            {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-30 glass border-b px-4 py-3 flex items-center gap-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </Button>
          <h2 className="font-semibold text-lg">
            {navItems.find(i => i.path === location.pathname)?.label || t('dashboard')}
          </h2>
        </header>

        {/* Content */}
        <div className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
