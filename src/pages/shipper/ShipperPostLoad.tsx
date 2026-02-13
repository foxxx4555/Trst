import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, MapPin, Package, User, Phone, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    weight: '',
    price: '',
    truck_size: 'large',
    body_type: 'flatbed',
    type: 'general',
    package_type: 'boxes',
    pickup_date: new Date().toISOString().split('T')[0],
    description: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
  });

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!form.origin) newErrors.origin = "موقع التحميل مطلوب";
    if (!form.destination) newErrors.destination = "موقع التفريغ مطلوب";
    if (!form.weight) newErrors.weight = "الوزن مطلوب";
    if (!form.price) newErrors.price = "السعر مطلوب";
    if (!form.receiver_phone) newErrors.receiver_phone = "رقم الجوال مطلوب";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("يرجى إكمال البيانات المطلوبة");
      return;
    }
    if (!userProfile?.id) return;

    setLoading(true);
    try {
      await api.postLoad(form, userProfile.id);
      toast.success("تم نشر الشحنة بنجاح");
      navigate('/shipper/dashboard');
    } catch (err: any) {
      toast.error(err.message || "فشل النشر");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Create New Shipments</h1>
          <p className="text-slate-500 font-bold text-sm">أدخل تفاصيل الحمولة للبحث عن ناقل مناسب</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* معلومات المسار */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3 font-black text-xl">
                <MapPin className="text-blue-400" /> تفاصيل المسار
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">مدينة التحميل</Label>
                <Input 
                  placeholder="الرياض، جدة..."
                  value={form.origin} 
                  onChange={e => updateField('origin', e.target.value)} 
                  className={cn("h-14 rounded-2xl bg-slate-50", errors.origin && "border-red-500")}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">مدينة التفريغ</Label>
                <Input 
                  placeholder="الدمام، مكة..."
                  value={form.destination} 
                  onChange={e => updateField('destination', e.target.value)} 
                  className={cn("h-14 rounded-2xl bg-slate-50", errors.destination && "border-red-500")}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="font-bold">تاريخ التحميل المتوقع</Label>
                <Input 
                  type="date" 
                  value={form.pickup_date} 
                  onChange={e => updateField('pickup_date', e.target.value)} 
                  className="h-14 rounded-2xl bg-slate-50" 
                />
              </div>
            </CardContent>
          </Card>

          {/* معلومات الشحنة */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="flex items-center gap-3 font-black text-xl text-slate-800 italic">
                <Package className="text-blue-600" /> Cargo Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold">الوزن التقديري (طن)</Label>
                  <Input type="number" value={form.weight} onChange={e => updateField('weight', e.target.value)} className="h-14 rounded-2xl bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">السعر المعروض (ريال)</Label>
                  <Input type="number" value={form.price} onChange={e => updateField('price', e.target.value)} className="h-14 rounded-2xl bg-slate-50 font-bold text-emerald-600" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">نوع الهيكل المطلوب</Label>
                <Select value={form.body_type} onValueChange={v => updateField('body_type', v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flatbed">سطحة</SelectItem>
                    <SelectItem value="curtain">ستارة</SelectItem>
                    <SelectItem value="refrigerated">مبرد</SelectItem>
                    <SelectItem value="box">صندوق مغلق</SelectItem>
                    <SelectItem value="tanker">صهريج</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">وصف إضافي</Label>
                <Textarea value={form.description} onChange={e => updateField('description', e.target.value)} className="rounded-2xl bg-slate-50 min-h-[100px]" placeholder="مثال: البضاعة تحتاج عناية، الموقع يتطلب تصريح..." />
              </div>
            </CardContent>
          </Card>

          {/* معلومات المستلم */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="flex items-center gap-3 font-black text-xl text-slate-800 italic">
                <User className="text-blue-600" /> Receiver Info
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">اسم المستلم</Label>
                <Input value={form.receiver_name} onChange={e => updateField('receiver_name', e.target.value)} className="h-14 rounded-2xl bg-slate-50" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">جوال المستلم</Label>
                <Input value={form.receiver_phone} onChange={e => updateField('receiver_phone', e.target.value)} className="h-14 rounded-2xl bg-slate-50" dir="ltr" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-bold">عنوان التسليم بالتفصيل</Label>
                <Input value={form.receiver_address} onChange={e => updateField('receiver_address', e.target.value)} className="h-14 rounded-2xl bg-slate-50" />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xl shadow-2xl transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin" size={28} /> : "تأكيد ونشر الطلب الآن"}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}
