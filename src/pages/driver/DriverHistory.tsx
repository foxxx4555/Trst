import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, MapPin, Loader2, Truck, ArrowLeftRight, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DriverHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    const data = await api.getUserLoads(userProfile.id);
    setLoads(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [userProfile]);

  const handleFinish = async (load: any) => {
    try {
      await api.completeLoad(load.id, load.owner_id, userProfile?.full_name || 'الناقل');
      toast.success("تم إتمام الرحلة وإبلاغ التاجر ✅");
      fetchData();
    } catch (e) { toast.error("خطأ في التحديث"); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-black italic uppercase italic">Shipment Logs</h1>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-5">
            {loads.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed">
                <p className="text-slate-400 font-bold">لا توجد شحنات في سجلك</p>
              </div>
            ) : loads.map(load => (
              <Card key={load.id} className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex justify-between items-center mb-6">
                    <Badge className={cn("rounded-full px-4 py-1", load.status === 'completed' ? 'bg-green-500' : 'bg-blue-600')}>
                      {load.status === 'completed' ? 'مكتملة' : 'قيد النقل'}
                    </Badge>
                    <span className="text-xs text-slate-400 font-bold">{new Date(load.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Truck size={30} /></div>
                    <div>
                        <div className="flex items-center gap-3 font-black text-slate-800 text-xl">
                            {load.origin} <ArrowLeftRight size={16} className="text-slate-300" /> {load.destination}
                        </div>
                        <p className="text-xs font-bold text-slate-400 mt-1 uppercase">الأجرة: {load.price} ر.س | وزن: {load.weight} طن</p>
                    </div>
                  </div>

                  {load.status === 'in_progress' && (
                    <Button 
                      className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black gap-2 shadow-xl"
                      onClick={() => handleFinish(load)}
                    >
                      <CheckCircle2 size={20} /> تم توصيل البضاعة (إنهاء الرحلة)
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
