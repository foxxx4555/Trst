import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge'; // تم التأكد من وجود الاستيراد
import { Loader2, MapPin, Phone, MessageCircle, X, ChevronLeft, Truck, CheckCircle2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const fetchLoads = async () => {
    try {
      const data = await api.getAvailableLoads();
      setLoads(data.filter(l => l.owner_id !== userProfile?.id));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('market').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, fetchLoads).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [userProfile]);

  useEffect(() => {
    const handleFocus = () => {
      if (pendingContact) {
        setPendingContact(false);
        setTimeout(() => setShowFeedback(true), 800);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pendingContact]);

  const handleContact = (type: 'tel' | 'wa') => {
    setPendingContact(true);
    const phone = selectedLoad?.profiles?.phone || '';
    if (type === 'tel') window.location.href = `tel:${phone}`;
    else window.open(`https://wa.me/${phone.replace(/^0/, '966')}`, '_blank');
  };

  const handleConfirmAgreement = async () => {
    if (!selectedLoad || !userProfile?.id) return;
    setIsAccepting(true);
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id, selectedLoad.owner_id, userProfile.full_name, userProfile.phone || '');
      toast.success("تمت إضافة الشحنة لمهامك بنجاح");
      setShowFeedback(false);
      setSelectedLoad(null);
      navigate('/driver/history');
    } catch (err: any) {
      toast.error("حدث خطأ في القبول");
    } finally {
      setIsAccepting(false);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <h2 className="text-xl font-black text-slate-800 italic uppercase">Logistics Market</h2>
        {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={40} /></div> : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm bg-white cursor-pointer active:scale-95 transition-all" onClick={() => setSelectedLoad(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-2 text-right">
                    <div className="flex items-center gap-2 font-black text-slate-700 text-lg">
                      <MapPin size={18} className="text-blue-600" />
                      {load.origin} ← {load.destination}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px] font-black">{load.weight} طن</Badge>
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 text-[10px] font-black">{load.price} ر.س</Badge>
                    </div>
                  </div>
                  <ChevronLeft size={20} className="text-slate-300" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-[3rem] p-0 bg-slate-50 border-none shadow-2xl overflow-hidden">
            <div className="p-6 space-y-6">
                <div className="bg-white p-8 rounded-[2rem] shadow-sm text-center border border-slate-100">
                    <Truck size={40} className="mx-auto text-blue-600 mb-4" />
                    <h3 className="text-2xl font-black text-slate-800">{selectedLoad?.origin} إلى {selectedLoad?.destination}</h3>
                    <p className="text-slate-400 font-bold mt-2 italic">Cargo: {selectedLoad?.weight} Tons | Budget: {selectedLoad?.price} SAR</p>
                </div>
                <div className="flex gap-4">
                    <Button className="flex-1 h-16 rounded-2xl bg-[#25D366] hover:bg-[#128C7E] text-white font-black text-lg shadow-xl" onClick={() => handleContact('wa')}>واتساب</Button>
                    <Button className="flex-1 h-16 rounded-2xl bg-slate-900 text-white font-black text-lg shadow-xl" onClick={() => handleContact('tel')}>اتصال</Button>
                </div>
            </div>
          </SheetContent>
        </Sheet>

        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl sm:max-w-md">
                <DialogHeader className="sr-only">
                    <DialogTitle>حالة الاتفاق</DialogTitle>
                    <DialogDescription>تأكيد نتيجة التواصل مع صاحب الحمولة</DialogDescription>
                </DialogHeader>

                <div className="bg-slate-900 p-8 text-center text-white relative">
                    <CheckCircle2 size={60} className="mx-auto text-emerald-500 mb-2" />
                    <h2 className="text-xl font-black italic">Contact Feedback</h2>
                    <Button variant="ghost" onClick={() => setShowFeedback(false)} className="absolute top-4 right-4 text-white/30 hover:text-white rounded-full"><X size={20}/></Button>
                </div>

                <div className="p-8 space-y-6 bg-white text-center">
                    <h3 className="text-xl font-black text-slate-800">هل تم الاتفاق مع صاحب الحمولة؟</h3>
                    <div className="flex flex-col gap-3">
                        <Button className="h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg shadow-xl transition-all active:scale-95" onClick={handleConfirmAgreement} disabled={isAccepting}>
                            {isAccepting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={24} /> نعم، تمت الموافقة</>}
                        </Button>
                        <Button variant="ghost" className="h-14 rounded-2xl text-slate-400 font-bold hover:bg-slate-50" onClick={() => setShowFeedback(false)}>ليس الآن / لم نتفق</Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
