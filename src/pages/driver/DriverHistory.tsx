import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, Trash2, AlertTriangle, Clock, Receipt, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function DriverHistory() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchMyLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLoads();

    const channel = supabase
      .channel('history-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => {
        fetchMyLoads();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  const handleCancelAssignment = async (loadId: string) => {
    setCancellingId(loadId);
    try {
      await api.cancelLoadAssignment(loadId);
      toast.success("تم إلغاء قبول الشحنة بنجاح");
      fetchMyLoads();
    } catch (err: any) {
      toast.error("فشل الإلغاء: " + err.message);
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Shipment Logs</h1>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">سجل الشحنات والرحلات الخاصة بك</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div>
        ) : loads.length === 0 ? (
          <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-white border-slate-200">
              <Receipt size={64} className="mx-auto mb-4 text-slate-200" />
              <p className="text-slate-500 font-black text-xl">السجل فارغ حالياً</p>
              <p className="text-slate-400 text-sm font-medium mt-1">ستظهر هنا جميع الرحلات التي قمت بتنفيذها أو التي تعمل عليها حالياً</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {loads.map((load) => (
              <Card key={load.id} className="rounded-[2rem] border-none shadow-sm hover:shadow-md transition-all overflow-hidden bg-white group">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-6">
                    <Badge className={cn(
                        "rounded-full px-4 py-1 font-black text-[9px] uppercase",
                        load.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 
                        load.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
                    )}>
                      {load.status === 'in_progress' ? 'قيد التنفيذ' : load.status === 'completed' ? 'مكتملة' : load.status}
                    </Badge>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">
                        {new Date(load.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-6">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 font-black text-slate-800 text-lg">
                            <MapPin size={20} className="text-blue-600" />
                            {load.origin} <ChevronLeft size={16} className="text-slate-300" /> {load.destination}
                        </div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 mr-7">رقم التتبع: #{load.id.slice(0,8)}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-50 pt-5">
                    <div className="flex gap-6">
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">الحمولة</p>
                            <p className="font-black text-slate-700 text-sm">{load.weight} طن</p>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">صافي الأرباح</p>
                            <p className="font-black text-emerald-600 text-sm">{load.price} ر.س</p>
                        </div>
                    </div>

                    {load.status === 'in_progress' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-full h-11 w-11 transition-colors">
                            {cancellingId === load.id ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={22} />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-8">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black text-slate-900">
                                <AlertTriangle className="text-rose-500" size={32} />
                                تراجع عن القبول؟
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-slate-500 font-bold text-md leading-relaxed mt-4">
                              هل أنت متأكد من إلغاء قبول هذه الشحنة؟ سيتم إعادتها فوراً إلى سوق الحمولات المتاحة ليراها السائقون الآخرون.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3 mt-8">
                            <AlertDialogCancel className="h-14 rounded-2xl border-slate-100 font-black flex-1">إلغاء</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={() => handleCancelAssignment(load.id)}
                                className="h-14 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black flex-1 shadow-xl shadow-rose-100"
                            >
                              نعم، إلغاء الشحنة
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// دالة مساعدة لدمج كلاسات CSS
function cn(...inputs: any) {
  return inputs.filter(Boolean).join(' ');
}
