import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Truck, ArrowLeftRight, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function DriverHistory() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [procId, setProcId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!userProfile?.id) return;
    const data = await api.getUserLoads(userProfile.id);
    setLoads(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    const sub = supabase.channel('h-sync').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchData).subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [userProfile]);

  const handleFinish = async (load: any) => {
    setProcId(load.id);
    try {
      await api.completeLoad(load.id, load.owner_id, userProfile?.full_name || 'الناقل');
      toast.success("تم إبلاغ التاجر بالوصول ✅");
      fetchData();
    } catch (e) { toast.error("خطأ"); }
    finally { setProcId(null); }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-20">
        <h1 className="text-2xl font-black italic">SHIPMENT LOGS</h1>
        {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
          <div className="grid gap-4">
            {loads.map(load => (
              <Card key={load.id} className="rounded-[2rem] border-none shadow-sm bg-white overflow-hidden p-6 relative">
                <div className="flex justify-between items-start mb-4">
                  <Badge className={cn("rounded-full", load.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-600')}>
                    {load.status === 'completed' ? 'تم الوصول' : 'قيد النقل'}
                  </Badge>
                  {load.status === 'in_progress' && (
                    <button onClick={() => api.cancelLoadAssignment(load.id).then(fetchData)} className="text-slate-300 hover:text-rose-500">
                      <XCircle size={24} />
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white"><Truck size={24} /></div>
                  <div>
                    <p className="font-black text-slate-800 text-lg">{load.origin} ← {load.destination}</p>
                    <p className="text-xs text-slate-400 font-bold">الأجرة: {load.price} ريال | الوزن: {load.weight} طن</p>
                  </div>
                </div>
                {load.status === 'in_progress' && (
                  <Button className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold gap-2" onClick={() => handleFinish(load)} disabled={procId === load.id}>
                    <CheckCircle2 size={18} /> تم توصيل البضاعة (إنهاء الرحلة)
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
