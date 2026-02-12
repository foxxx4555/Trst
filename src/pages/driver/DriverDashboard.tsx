import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Star, Truck, MapPin, Trash2, CheckCircle2, Navigation, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function DriverDashboard() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0, rating: 4.8 });
  const [activeLoads, setActiveLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!userProfile?.id) return;
    api.getDriverStats(userProfile.id).then(setStats);
    const data = await api.getUserLoads(userProfile.id);
    setActiveLoads(data?.filter((l: any) => l.status === 'in_progress') || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const sub = supabase.channel('driver-dash').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => loadData()).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userProfile]);

  const handleComplete = async (load: any) => {
    try {
      await api.completeLoad(load.id);
      await api.sendNotification(load.owner_id, "وصلت بضاعتك!", `الناقل ${userProfile?.full_name} أتم توصيل شحنة ${load.origin}`);
      toast.success("تم إنهاء الرحلة بنجاح!");
    } catch (e) { toast.error("خطأ في تحديث الحالة"); }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-black">مرحباً، {userProfile?.full_name}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="شحنات حالية" value={stats.activeLoads} icon={<Package size={20}/>} color="primary" />
          <StatCard title="رحلات مكتملة" value={stats.completedTrips} icon={<CheckCircle size={20}/>} color="accent" />
          <StatCard title="التقييم" value={stats.rating} icon={<Star size={20}/>} color="secondary" />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><Truck className="text-primary"/> شحناتي الحالية</h2>
          {activeLoads.map(load => (
            <Card key={load.id} className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Navigation size={24}/></div>
                        <div>
                            <p className="font-black text-lg">{load.origin} ← {load.destination}</p>
                            <p className="text-xs text-muted-foreground font-bold">{load.weight} طن • {load.price} ر.س</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <Button className="rounded-2xl h-12 bg-emerald-600 hover:bg-emerald-700 font-bold" onClick={() => handleComplete(load)}>
                        <CheckCircle2 className="ml-2" size={18}/> تم التوصيل
                    </Button>
                    <Button variant="outline" className="rounded-2xl h-12 font-bold" onClick={() => navigate('/shipper/track')}>
                        <MapPin className="ml-2" size={18}/> تتبع
                    </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {activeLoads.length === 0 && <p className="text-center py-10 text-muted-foreground">لا توجد رحلات قيد التنفيذ</p>}
        </div>
      </div>
    </AppLayout>
  );
}
