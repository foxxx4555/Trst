import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  MapPin, 
  Package, 
  ChevronLeft, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  ArrowRightLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShipperLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // دالة جلب الشحنات الخاصة بهذا التاجر فقط
  const fetchMyLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (error) {
      console.error("Error fetching loads:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoads();

    // تحديث البيانات تلقائياً عند حدوث أي تغيير في الجدول
    const channel = supabase
      .channel('shipper-loads-sync')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'loads',
        filter: `owner_id=eq.${userProfile?.id}` 
      }, () => fetchMyLoads())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userProfile?.id]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available': return <Badge className="bg-blue-100 text-blue-600 border-none">في السوق</Badge>;
      case 'in_progress': return <Badge className="bg-orange-100 text-orange-600 border-none">قيد التوصيل</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-600 border-none">مكتملة</Badge>;
      case 'cancelled': return <Badge className="bg-rose-100 text-rose-600 border-none">ملغاة</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-20">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Shipment Archive</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">إدارة ومتابعة كافة شحناتك</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-blue-600" size={40} />
          </div>
        ) : loads.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-white/50 border-slate-200">
            <Package size={64} className="mx-auto mb-4 text-slate-200" />
            <p className="text-slate-500 font-black text-xl">لا توجد شحنات مسجلة</p>
            <p className="text-slate-400 text-sm font-medium mt-1">ابدأ بنشر أول شحنة لك من لوحة التحكم</p>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {loads.map((load, idx) => (
                <motion.div
                  key={load.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group">
                    <CardContent className="p-0">
                      <div className="flex flex-col md:flex-row items-center">
                        {/* حالة الشحنة جانبي */}
                        <div className="w-full md:w-2 bg-slate-50 group-hover:bg-blue-600 transition-colors" />
                        
                        <div className="flex-1 p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                              <Package size={24} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 font-black text-slate-800 text-lg">
                                {load.origin} 
                                <ArrowRightLeft size={16} className="text-slate-300" /> 
                                {load.destination}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                  <Clock size={12} /> {new Date(load.created_at).toLocaleDateString('ar-SA')}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase">
                                  {load.weight} طن
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-6 w-full md:w-auto justify-between border-t md:border-none pt-4 md:pt-0">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">الميزانية</p>
                              <p className="font-black text-slate-900">{load.price} ر.س</p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-2">
                              {getStatusBadge(load.status)}
                              {load.driver_id && (
                                <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter">
                                  تم التعيين لناقل
                                </span>
                              )}
                            </div>
                            
                            <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-50 text-slate-300">
                              <ChevronLeft size={20} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
