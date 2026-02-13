import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Package, Truck, Settings, LogOut, 
  Plus, Globe, MapPin, User, Users, BarChart3, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentRole, logout, userProfile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(() => {
    if (!currentRole) return [];
    const roles = {
      admin: [
        { label: 'الإحصائيات', path: '/admin/dashboard', icon: <BarChart3 size={22}/> },
        { label: 'المستخدمين', path: '/admin/users', icon: <Users size={22}/> },
        { label: 'الشحنات', path: '/admin/loads', icon: <Package size={22}/> },
        { label: 'الإعدادات', path: '/admin/settings', icon: <Settings size={22}/> },
      ],
      shipper: [
        { label: 'الرئيسية', path: '/shipper/dashboard', icon: <LayoutDashboard size={22}/> },
        { label: 'نشر طلب', path: '/shipper/post', icon: <Plus size={22} className="bg-blue-600 text-white rounded-lg p-0.5" /> },
        { label: 'تتبع', path: '/shipper/track', icon: <MapPin size={22}/> },
        { label: 'حمولاتي', path: '/shipper/loads', icon: <Package size={22}/> },
        { label: 'حسابي', path: '/shipper/account', icon: <User size={22}/> },
      ],
      driver: [
        { label: 'الرئيسية', path: '/driver/dashboard', icon: <LayoutDashboard size={22}/> },
        { label: 'السوق', path: '/driver/loads', icon: <Package size={22}/> },
        { label: 'شاحناتي', path: '/driver/trucks', icon: <Truck size={22}/> },
        { label: 'حسابي', path: '/driver/account', icon: <User size={22}/> },
      ]
    };
    return roles[currentRole as keyof typeof roles] || roles.driver;
  }, [currentRole]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
      <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-72 bg-[#0f172a] text-white flex-col h-screen sticky top-0">
        <div className="p-8 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg"><Truck size={20}/></div>
          <h1 className="font-black text-xl italic uppercase">SAS Global</h1>
        </div>
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={cn(
              "flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all",
              location.pathname === item.path ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}>
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <Button variant="ghost" className="w-full justify-start gap-3 text-rose-400 font-bold hover:bg-rose-500/10 rounded-xl" onClick={logout}>
            <LogOut size={18} /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
        <header className="h-16 flex items-center justify-between px-6 bg-white/80 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <div className="lg:hidden w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white"><Truck size={16}/></div>
            <h2 className="font-black text-slate-800">{navItems.find(i => i.path === location.pathname)?.label || 'الرئيسية'}</h2>
          </div>
          <div className="flex items-center gap-4"><NotificationCenter /><User size={20} className="text-slate-400" /></div>
        </header>

        <div className="p-4 md:p-8 w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t px-2 h-16 flex justify-around items-center">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path} className={cn(
            "flex flex-col items-center gap-1 transition-all",
            location.pathname === item.path ? "text-blue-600 scale-110" : "text-slate-400"
          )}>
            {item.icon}
            <span className="text-[9px] font-bold">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
