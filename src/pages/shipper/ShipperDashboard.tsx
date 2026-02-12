import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Bell, Clock, ChevronLeft, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { motion, AnimatePresence } from 'framer-motion';

export default function ShipperDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [myLoads, setMyLoads] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userProfile?.id) return;
    const [s, loads, notifs] = await Promise.all([
      api.getShipperStats(userProfile.id),
      api.getUserLoads(userProfile.id),
      api.getNotifications(userProfile.id)
    ]);
    setStats(s);
    setMyLoads(loads || []);
    setNotifications(notifs || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const channel = supabase.channel('shipper-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => loadData())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userProfile?.id}` }, (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          // صوت تنبيه بسيط (اختياري)
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-black text-slate-800">لوحة التحكم</h1>
            
            {/* جرس الإشعارات */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative bg-white shadow-sm rounded-2xl h-12 w-12">
                        <Bell size={24} className="text-slate-600" />
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                {unreadCount}
                            </span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0 rounded-3xl overflow-hidden border-none shadow-2xl" align="end">
                    <div className="bg-primary p-4 text-white font-bold flex justify-between items-center">
                        <span>الإشعارات</span>
                        <Button variant="ghost" size="sm" className="text-white/80 hover:text-white text-xs" onClick={() => api.markNotificationsAsRead(userProfile!.id)}>تحديد الكل كمقروء</Button>
                    </div>
                    <div className="max-h-96 overflow-y-auto bg-white">
                        {notifications.map(n => (
                            <div key={n.id} className={`p-4 border-b last:border-0 ${!n.is_read ? 'bg-blue-50/50' : ''}`}>
                                <p className="font-bold text-sm text-slate-800">{n.title}</p>
                                <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                                <p className="text-[9px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleTimeString('ar-SA')}</p>
                            </div>
                        ))}
                        {notifications.length === 0 && <p className="p-10 text-center text-slate-400 text-sm">لا توجد إشعارات</p>}
                    </div>
                </PopoverContent>
            </Popover>
        </div>

        {/* ... بقية الكود (الستاتس وزر النشر) يظل كما هو ... */}
      </div>
    </AppLayout>
  );
}
