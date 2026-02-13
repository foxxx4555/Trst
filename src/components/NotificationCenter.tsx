import { useState, useEffect } from 'react';
import { Bell, Zap, Loader2, CheckCircle2, Package } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from '@/lib/utils';

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    if (!userProfile?.id) return;
    api.getNotifications(userProfile.id).then(setNotifications).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifs(); }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-11 w-11 rounded-2xl bg-white shadow-sm border border-slate-100">
          <Bell size={20} className="text-slate-500" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 rounded-[2.5rem] overflow-hidden border-none shadow-2xl bg-white animate-in zoom-in-95 duration-300" align="end">
        <div className="bg-slate-900 p-5 text-white flex justify-between items-center font-black italic">
            <span className="flex items-center gap-2"><Zap size={16} className="text-blue-400" /> System Alerts</span>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded-lg">{unreadCount} New</span>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
                <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" /></div>
            ) : notifications.length === 0 ? (
                <div className="p-10 text-center text-slate-300 font-bold text-xs">لا توجد تنبيهات حالياً</div>
            ) : (
                notifications.map(n => (
                    <div key={n.id} className={cn("p-5 border-b border-slate-50 transition-colors hover:bg-slate-50", !n.is_read && "bg-blue-50/30")}>
                        <div className="flex gap-3">
                            <div className="mt-1">{n.title.includes('✅') ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Package size={16} className="text-blue-500" />}</div>
                            <div>
                                <p className="font-black text-xs text-slate-800">{n.title}</p>
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-bold">{n.message}</p>
                                <p className="text-[9px] text-slate-300 mt-2 tabular-nums">{new Date(n.created_at).toLocaleTimeString('ar-SA')}</p>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
