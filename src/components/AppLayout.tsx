import { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Package, Truck, Settings, LogOut, Plus, Menu, Globe, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentRole, logout } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = getNavItems(currentRole || 'driver');

  return (
    <div className="min-h-screen flex bg-[#f1f5f9]">
      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 start-0 z-50 w-72 premium-gradient text-white flex flex-col transition-all duration-500 shadow-2xl",
        sidebarOpen ? "translate-x-0" : "-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0"
      )}>
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 group">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40 group-hover:rotate-12 transition-transform">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter">SAS<span className="text-blue-500">.</span></h1>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Logistics Intelligence</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300",
                location.pathname === item.path 
                ? "bg-blue-600 text-white shadow-xl shadow-blue-600/20" 
                : "text-white/40 hover:text-white hover:bg-white/5"
              )}>
              <span className={cn(location.pathname === item.path ? "text-white" : "text-white/20")}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl h-14 font-black" onClick={logout}>
            <LogOut size={20} /> {t('logout')}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 flex items-center justify-between px-8 bg-white/50 backdrop-blur-md border-b border-slate-200/50 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="lg:hidden rounded-xl bg-white shadow-sm" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </Button>
            <div className="hidden md:flex items-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-widest">
              <Globe size={14} /> Global Network Status: <span className="text-emerald-500">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <NotificationCenter />
            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 border-2 border-white shadow-sm"></div>
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
          {children}
        </div>
      </main>
    </div>
  );
}

function getNavItems(role: string) {
  const common = [
    { label: 'لوحة التحكم', path: role === 'driver' ? '/driver/dashboard' : '/shipper/dashboard', icon: <LayoutDashboard size={20}/> },
  ];
  
  if (role === 'driver') return [
    ...common,
    { label: 'سوق الحمولات', path: '/driver/loads', icon: <Package size={20}/> },
    { label: 'أسطول الشاحنات', path: '/driver/trucks', icon: <Truck size={20}/> },
    { label: 'إعدادات الحساب', path: '/driver/account', icon: <Settings size={20}/> },
  ];

  return [
    ...common,
    { label: 'طلب شحن جديد', path: '/shipper/post', icon: <Plus size={20}/> },
    { label: 'تتبع مباشر', path: '/shipper/track', icon: <Globe size={20}/> },
    { label: 'سجل الطلبات', path: '/shipper/loads', icon: <Package size={20}/> },
    { label: 'الملف الشخصي', path: '/shipper/account', icon: <Settings size={20}/> },
  ];
}
