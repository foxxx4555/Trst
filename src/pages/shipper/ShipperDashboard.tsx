import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus, Truck, Phone, Mail, UserCheck, ShieldCheck, UserPlus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShipperDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });
  const [allDrivers, setAllDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // دالة جلب البيانات وتوحيد شكلها
  const fetchData = async () => {
    if (!userProfile?.id) return;
    try {
      const statsData = await api.getShipperStats(userProfile.id);
      setStats(statsData);

      // جلب النوعين
      const [mainRes, subRes] = await Promise.all([
        api.getAllDrivers(),
        api.getAllSubDrivers()
      ]);

      // توحيد شكل البيانات للعرض
      const mainMapped = (mainRes || []).map((d: any) => ({
        id: d.id,
        name: d.profiles?.full_name || 'ناقل غير معروف',
        phone: d.profiles?.phone,
        email: d.profiles?.email,
        type: 'main',
        truck: d.truck_type || 'ناقل معتمد',
        available: d.is_available
      }));

      const subMapped = (subRes || []).map((d: any) => ({
        id: d.id,
        name: d.driver_name,
        phone: d.driver_phone,
        email: null,
        type: 'sub',
        truck: 'سائق فرعي',
        available: true // الفرعي غالباً متاح دائماً أو يتبع السائق الرئيسي
      }));

      setAllDrivers([...mainMapped, ...subMapped]);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('shipper-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_details' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sub_drivers' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('welcome')}، {userProfile?.full_name}</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
        </div>

        <Card className="cursor-pointer hover:shadow-lg transition-all border-dashed border-2 border-primary/40 bg-primary/5" onClick={() => navigate('/shipper/post')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-primary text-white"><Plus size={28} /></div>
            <div><p className="font-bold text-lg text-primary">{t('post_load')}</p><p className="text-sm text-muted-foreground">انشر طلبك وشاهد السائقين</p></div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">الناقلون النشطون</h2>
          
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin" /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {allDrivers.map((driver) => (
                  <motion.div key={driver.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <Card className={`relative overflow-hidden border-r-4 ${driver.type === 'main' ? 'border-r-green-500' : 'border-r-blue-500'}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold ${driver.type === 'main' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {driver.name.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                                <h3 className="font-bold text-sm">{driver.name}</h3>
                                {driver.type === 'main' ? <ShieldCheck size={14} className="text-green-600" /> : <UserPlus size={14} className="text-blue-600" />}
                            </div>
                            <Badge variant="secondary" className="text-[10px] h-5">
                                {driver.type === 'main' ? 'ناقل أساسي' : 'سائق فرعي'}
                            </Badge>
                          </div>
                        </div>

                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full mt-4 h-8 text-xs">عرض البيانات</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader><DialogTitle>بيانات التواصل</DialogTitle></DialogHeader>
                            <div className="flex flex-col items-center py-4 gap-4">
                                <div className="text-center">
                                    <h2 className="text-xl font-bold">{driver.name}</h2>
                                    <p className="text-muted-foreground">{driver.type === 'main' ? 'صاحب مؤسسة/شاحنة' : 'سائق تابع لمؤسسة'}</p>
                                </div>
                                <div className="w-full space-y-2">
                                    <Button className="w-full bg-green-600" onClick={() => window.open(`https://wa.me/${driver.phone?.replace(/^0/, '966')}`)}>واتساب</Button>
                                    <Button className="w-full" variant="outline" onClick={() => window.open(`tel:${driver.phone}`)}>اتصال هاتفي</Button>
                                </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
