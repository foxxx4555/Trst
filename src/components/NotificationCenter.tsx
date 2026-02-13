import { useState, useEffect } from 'react';
import { Bell, Check, Zap, Info, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationCenter() {
  const { userProfile } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userProfile?.id) return;
    
    const fetchNotifs = async () => {
      try {
        const data = await api.getNotifications(userProfile.id);
        setNotifications(data || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    
    fetchNotifs();

    const channel = supabase.channel('notif-live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile.id}` }, 
      (payload) => setNotifications(prev => [payload.new, ...prev]))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const unreadCount = (notifications || []).filter(n => !n.is_read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-12 w-12 rounded-2xl bg-white shadow-sm border">
          <Bell size={22} className="text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white border-2 border-white">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[350px] p-0 rounded-[2rem] overflow-hidden border-none shadow-2xl bg-white" align="end">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
            <h3 className="font-black text-lg">التنبيهات</h3>
            <Zap size={18} className="text-blue-400" />
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
             <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-slate-300" /></div>
          ) : notifications.length > 0 ? (
            notifications.map((n) => (
              <div key={n.id} className="p-4 border-b last:border-0 hover:bg-slate-50 transition-colors flex gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  {n.title?.includes("نجاح") ? <Check size={18} /> : <Info size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-800">{n.title || 'إشعار جديد'}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-10 text-center text-slate-400 text-sm font-bold">لا توجد تنبيهات</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
