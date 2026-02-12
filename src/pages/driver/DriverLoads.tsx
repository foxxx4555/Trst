import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Phone, MessageCircle, Info, X, ChevronLeft, Truck, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [otherLoads, setOtherLoads] = useState<any[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [pendingContact, setPendingContact] = useState(false);

  const fetchLoads = async () => {
    const data = await api.getAvailableLoads();
    setLoads(data as any[] || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('loads-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchLoads()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // مراقبة عودة المستخدم للتطبيق لإظهار تقرير الاتصال
  useEffect(() => {
    const handleFocus = () => {
      if (pendingContact) {
        setPendingContact(false);
        setTimeout(() => setShowFeedback(true), 500); // إظهار التقرير بعد نص ثانية من الرجوع
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [pendingContact]);

  const openDetails = async (load: any) => {
    setSelectedLoad(load);
    try {
      const others = await api.getOtherLoadsByOwner(load.owner_id, load.id);
      setOtherLoads(others || []);
    } catch (e) {
      setOtherLoads([]);
    }
  };

  const handleContact = (type: 'tel' | 'wa') => {
    setPendingContact(true);
    const phone = selectedLoad?.profiles?.phone || '';
    if (type === 'tel') {
      window.location.href = `tel:${phone}`;
    } else {
      window.open(`https://wa.me/${phone.replace(/^0/, '966')}`, '_blank');
    }
  };

  return (
    <AppLayout>
      <div className="space-y-4 pb-20">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-800">الشحنات المتاحة</h2>
            <Badge className="bg-green-50 text-green-600 border-0 animate-pulse">تحديث مباشر</Badge>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40} /></div>
        ) : loads.length === 0 ? (
          <div className="py-20 text-center border-2 border-dashed rounded-3xl text-muted-foreground">لا توجد شحنات متاحة حالياً</div>
        ) : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl border-none shadow-sm active:scale-[0.98] transition-all cursor-pointer bg-white" onClick={() => openDetails(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 font-black text-slate-700 text-lg">
                      <MapPin size={18} className="text-primary" />
                      {load.origin} <ChevronLeft size={16} className="text-slate-300" /> {load.destination}
                    </div>
                    <div className="flex gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-0 text-[10px]">{load.package_type || 'بضاعة عامة'}</Badge>
                        <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-0 text-[10px]">{load.weight} طن</Badge>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="text-xl font-black text-primary">{load.price} <span className="text-[10px]">ر.س</span></p>
                    <p className="text-[10px] text-slate-400 font-bold">عرض التفاصيل</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* --- نافذة تفاصيل الشحنة (Bottom Sheet) --- */}
        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[92vh] rounded-t-[3.5rem] p-0 overflow-hidden border-none shadow-2xl">
            <div className="h-full flex flex-col bg-white">
              {/* بار السحب العلوي */}
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-2"></div>
              
              <div className="p-6 pb-2 flex justify-between items-center">
                <h3 className="text-2xl font-black text-slate-800">تفاصيل الحمولة</h3>
                <Button variant="ghost" size="icon" onClick={() => setSelectedLoad(null)} className="rounded-full bg-slate-100"><X size={20}/></Button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 space-y-6 pb-40">
                {/* مسار الرحلة */}
                <div className="bg-slate-50 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <div className="flex justify-between items-center relative z-10">
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-primary/30"><MapPin size={24} /></div>
                            <p className="font-black text-slate-800">{selectedLoad?.origin}</p>
                        </div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                            <span className="text-xs font-bold text-slate-400 mb-1">{selectedLoad?.distance || '---'} كم</span>
                            <div className="w-full border-t-2 border-dashed border-slate-300"></div>
                            <Truck className="text-primary mt-1" size={20} />
                        </div>
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800 text-white flex items-center justify-center mx-auto mb-2 shadow-lg shadow-slate-800/30"><MapPin size={24} /></div>
                            <p className="font-black text-slate-800">{selectedLoad?.destination}</p>
                        </div>
                    </div>
                </div>

                {/* الوصف */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-slate-800 font-black"><Info size={20} className="text-primary"/> وصف الحمولة</div>
                    <div className="bg-slate-50 p-5 rounded-[2rem] text-sm leading-relaxed text-slate-600 font-medium">
                        {selectedLoad?.description || 'لا توجد تفاصيل إضافية مكتوبة لهذه الشحنة.'}
                    </div>
                </div>

                {/* بضائع أخرى */}
                {otherLoads.length > 0 && (
                    <div className="space-y-3">
                        <p className="font-black text-slate-800">بضائع أخرى لهذا العميل</p>
                        <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {otherLoads.map(other => (
                                <div key={other.id} className="min-w-[180px] p-4 rounded-[2rem] bg-white border-2 border-slate-50 shadow-sm space-y-2">
                                    <p className="font-bold text-xs text-slate-700 truncate">{other.origin} ← {other.destination}</p>
                                    <p className="text-primary font-black text-lg">{other.price} <span className="text-[10px]">ر.س</span></p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* تحذير */}
                <div className="p-5 rounded-[2rem] bg-amber-50 border border-amber-100 flex gap-4">
                    <AlertTriangle className="text-amber-500 shrink-0" size={24} />
                    <p className="text-xs text-amber-900 font-medium leading-relaxed">
                        نحن نوصلك بصاحب البضاعة مباشرة. الاتفاق المالي والعمولة مسؤوليتك الشخصية تماماً.
                    </p>
                </div>
              </div>

              {/* أزرار الاتصال الثابتة */}
              <div className="absolute bottom-0 left-0 w-full p-6 bg-white/80 backdrop-blur-md border-t border-slate-100 flex gap-4">
                <Button className="flex-1 h-16 rounded-[1.5rem] bg-[#25D366] hover:bg-[#128C7E] text-white text-xl font-black gap-3 shadow-xl shadow-green-200" onClick={() => handleContact('wa')}>
                  <MessageCircle size={24} strokeWidth={3} /> واتساب
                </Button>
                <Button className="flex-1 h-16 rounded-[1.5rem] bg-[#F59E0B] hover:bg-[#D97706] text-white text-xl font-black gap-3 shadow-xl shadow-orange-200" onClick={() => handleContact('tel')}>
                  <Phone size={24} strokeWidth={3} /> اتصال
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* --- واجهة تقرير الاتصال (المنبثقة عند العودة) --- */}
        <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
            <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-10 text-center text-white">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                        <Truck size={40} />
                    </div>
                    <h2 className="text-2xl font-black">تقرير الاتصال</h2>
                    <p className="opacity-80 text-sm mt-1">نسعى دائماً لتطوير تجربتك</p>
                </div>
                <div className="p-8 space-y-6">
                    <p className="text-center font-black text-slate-700 text-lg">هل اتفقت مع صاحب الحمولة؟</p>
                    <div className="grid gap-3">
                        <Button className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg gap-3" onClick={() => {setShowFeedback(false); toast.success("رائع! رحلة سعيدة وموفقة");}}>
                           <CheckCircle2 size={24} /> نعم، تم الاتفاق
                        </Button>
                        
                        <div className="grid grid-cols-1 gap-2 mt-2">
                           {[
                               "لا، الحمولة حُملت بالفعل",
                               "لا، لم يتم الرد على الاتصال",
                               "لا، السعر لم يناسبني"
                           ].map((reason, i) => (
                               <Button key={i} variant="ghost" className="h-14 rounded-2xl bg-slate-50 text-slate-600 hover:bg-slate-100 font-bold text-sm" onClick={() => setShowFeedback(false)}>
                                   {reason}
                               </Button>
                           ))}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
