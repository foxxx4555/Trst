import { ReactNode, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, Package, Truck, Settings, LogOut, 
  Plus, Globe, MapPin, User, Users, BarChart3, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // التأكد من استيراد البادج
import { cn } from '@/lib/utils';
import NotificationCenter from './NotificationCenter';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { currentRole, logout, userProfile, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // 1. تحديد القائمة بناءً على الدور (Admin, Shipper, Driver)
  const navItems = useMemo(() => {
    if (!currentRole) return [];
    
    switch (currentRole) {
      case 'admin':
        return [
          { label: 'الإحصائيات', path: '/admin/dashboard', icon: <BarChart3 size={22}/> },
          { label: 'المستخدمين', path: '/admin/users', icon: <Users size={22}/> },
          { label: 'الشحنات', path: '/admin/loads', icon: <Package size={22}/> },
          { label: 'الإعدادات', path: '/admin/settings', icon: <Settings size={22}/> },
        ];
      case 'shipper':
        return [
          { label: 'الرئيسية', path: '/shipper/dashboard', icon: <LayoutDashboard size={22}/> },
          { label: 'نشر طلب', path: '/shipper/post', icon: <Plus size={22} className="bg-blue-600 text-white rounded-lg p-0.5" /> },
          { label: 'تتبع', path: '/shipper/track', icon: <MapPin size={22}/> },
          { label: 'حمولاتي', path: '/shipper/loads', icon: <Package size={22}/> },
          { label: 'حسابي', path: '/shipper/account', icon: <User size={22}/> },
        ];
      case 'driver':
      default:
        return [
          { label: 'الرئيسية', path: '/driver/dashboard', icon: <LayoutDashboard size={22}/> },
          { label: 'السوق', path: '/driver/loads', icon: <Package size={22}/> },
          { label: 'شاحناتي', path: '/driver/trucks', icon: <Truck size={22}/> },
          { label: 'سجلاتي', path: '/driver/history', icon: <Globe size={22}/> },
          { label: 'حسابي', path: '/driver/account', icon: <User size={22}/> },
        ];
    }
  }, [currentRole]);

  // حماية من الشاشة البيضاء: لو الداتا لسه بتحمل اعرض لودر فخم
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0f172a]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
          <p className="text-white/50 font-bold tracking-widest text-xs uppercase">SAS Global Logistics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc]">
      
      {/* --- Sidebar Desktop --- */}
      <aside className="hidden lg:flex fixed lg:static inset-y-0 start-0 z-50 w-72 bg-[#0f172a] text-white flex-col shadow-2xl">
        <div className="p-8 mb-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/40">
              <Truck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="font-black text-2xl tracking-tighter italic text-white">SAS<span className="text-blue-400">.</span></h1>
              <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.3em]">Logistics Global</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-6 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={cn("flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-sm font-bold transition-all duration-300",
                  isActive ? "bg-blue-600 text-white shadow-xl" : "text-white/40 hover:text-white hover:bg-white/5"
                )}>
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 space-y-4">
          <Button variant="ghost" className="w-full justify-start gap-4 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-2xl h-14 font-black" onClick={logout}>
            <LogOut size={20} /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-0">
        <header className="h-20 flex items-center justify-between px-6 bg-white/70 backdrop-blur-md border-b sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <div className="lg:hidden w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                <Truck size={20} className="text-white" />
             </div>
             <h2 className="font-black text-slate-800 text-lg lg:text-xl truncate">
                {navItems.find(i => i.path === location.pathname)?.label || 'الرئيسية'}
             </h2>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />
            <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <User size={20} className="text-slate-400" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-8 max-w-[1600px] mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* --- Bottom Navigation (Mobile) --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-2xl border-t px-2 pb-safe shadow-2xl">
        <div className="flex justify-around items-center h-20">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-full h-full transition-all relative",
                  isActive ? "text-blue-600" : "text-slate-400"
                )}
              >
                <div className={cn("p-1.5 rounded-xl transition-all", isActive ? "bg-blue-50" : "")}>
                    {item.icon}
                </div>
                <span className="text-[9px] font-black">{item.label}</span>
              </Link>
            );
          })}
          {/* زر الخروج في الموبايل لسهولة الوصول */}
          <button onClick={logout} className="flex flex-col items-center justify-center gap-1 w-full h-full text-rose-400">
             <LogOut size={20} />
             <span className="text-[9px] font-black">خروج</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
