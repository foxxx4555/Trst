import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Truck, ChevronLeft, MessageCircle, Phone } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function DriverLoads() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoad, setSelectedLoad] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    api.getAvailableLoads().then(setLoads).finally(() => setLoading(false));
  }, []);

  const handleAccept = async () => {
    if (!selectedLoad || !userProfile) return;
    if (!userProfile.full_name || !userProfile.phone) {
        toast.error("يرجى إكمال بيانات اسمك وجوالك في الحساب الشخصي أولاً");
        return;
    }
    setIsAccepting(true);
    try {
      await api.acceptLoad(selectedLoad.id, userProfile.id, selectedLoad.owner_id, userProfile.full_name, userProfile.phone);
      toast.success("تم القبول! أرسلنا بياناتك للتاجر ✅");
      navigate('/driver/history');
    } catch (e) { toast.error("حدث خطأ"); }
    finally { setIsAccepting(false); }
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        <h1 className="text-2xl font-black italic">Marketplace</h1>
        {loading ? <Loader2 className="animate-spin mx-auto text-blue-600" /> : (
          <div className="grid gap-3">
            {loads.map(load => (
              <Card key={load.id} className="rounded-3xl cursor-pointer bg-white" onClick={() => setSelectedLoad(load)}>
                <CardContent className="p-5 flex justify-between items-center">
                  <div className="text-right">
                    <p className="font-black text-slate-800">{load.origin} ← {load.destination}</p>
                    <p className="text-xs text-slate-400">{load.weight} طن - {load.price} ريال</p>
                  </div>
                  <ChevronLeft className="text-slate-200" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        <Sheet open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <SheetContent side="bottom" className="h-[60vh] rounded-t-[3rem] p-10 bg-white">
             <div className="text-center space-y-6">
                <Truck size={48} className="mx-auto text-blue-600" />
                <h3 className="text-2xl font-black">{selectedLoad?.origin} إلى {selectedLoad?.destination}</h3>
                <Button className="w-full h-16 rounded-2xl bg-blue-600 text-white font-black text-xl" onClick={handleAccept} disabled={isAccepting}>
                    {isAccepting ? <Loader2 className="animate-spin" /> : "قبول الشحنة وتأكيد النقل"}
                </Button>
             </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
}
