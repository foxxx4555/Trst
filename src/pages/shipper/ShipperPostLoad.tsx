// src/pages/shipper/ShipperPostLoad.tsx
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
import { Loader2, MapPin, Package, User, Phone, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    weight: '',
    price: '',
    truck_size: '',
    body_type: 'flatbed',
    type: 'general',
    package_type: '',
    pickup_date: new Date().toISOString().split('T')[0],
    description: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;
    setLoading(true);
    try {
      await api.postLoad(form, userProfile.id);
      toast.success("تم نشر الشحنة بنجاح");
      navigate('/shipper/dashboard');
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ");
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
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* 1. معلومات المسار */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3 font-black text-xl">
                <MapPin className="text-blue-400" /> معلومات النقل والمسار
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">مدينة التحميل</Label>
                <Input placeholder="مثال: الرياض" value={form.origin} onChange={e => updateField('origin', e.target.value)} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">مدينة التفريغ</Label>
                <Input placeholder="مثال: جدة" value={form.destination} onChange={e => updateField('destination', e.target.value)} required className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">تاريخ التحميل</Label>
                <Input type="date" value={form.pickup_date} onChange={e => updateField('pickup_date', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
            </CardContent>
          </Card>

          {/* 2. تفاصيل الحمولة والشاحنة */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
                <CardTitle className="flex items-center gap-3 font-black text-xl text-slate-800">
                    <Package className="text-blue-600" /> تفاصيل البضاعة والشاحنة
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold">الوزن التقديري (طن)</Label>
                <Input type="number" placeholder="0.00" value={form.weight} onChange={e => updateField('weight', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">السعر المقترح (ريال)</Label>
                <Input type="number" placeholder="0.00" value={form.price} onChange={e => updateField('price', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-emerald-600" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">مقاس الشاحنة المطلوب</Label>
                <Input placeholder="مثال: 12.5 متر" value={form.truck_size} onChange={e => updateField('truck_size', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold">نوع الهيكل</Label>
                <Select value={form.body_type} onValueChange={v => updateField('body_type', v)}>
                  <SelectTrigger className="h-14 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl font-bold">
                    <SelectItem value="flatbed">سطحة (Flatbed)</SelectItem>
                    <SelectItem value="curtain">جوانب / ستارة</SelectItem>
                    <SelectItem value="box">صندوق مغلق</SelectItem>
                    <SelectItem value="refrigerated">مبردة</SelectItem>
                    <SelectItem value="lowboy">لوبد (Lowboy)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label className="font-bold">وصف إضافي للبضاعة</Label>
                <Textarea placeholder="اكتب أي ملاحظات أخرى للسائق..." value={form.description} onChange={e => updateField('description', e.target.value)} className="min-h-[120px] rounded-2xl bg-slate-50 border-none font-bold" />
              </div>
            </CardContent>
          </Card>

          {/* 3. معلومات المستلم (Columns 13, 14, 15) */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
             <CardHeader className="p-8 pb-0">
                <CardTitle className="flex items-center gap-3 font-black text-xl text-slate-800">
                    <User className="text-rose-500" /> معلومات التواصل عند التسليم
                </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="font-bold">اسم المستلم</Label>
                    <Input placeholder="الاسم بالكامل" value={form.receiver_name} onChange={e => updateField('receiver_name', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                </div>
                <div className="space-y-2">
                    <Label className="font-bold">رقم جوال المستلم</Label>
                    <Input placeholder="05xxxxxxxx" value={form.receiver_phone} onChange={e => updateField('receiver_phone', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" dir="ltr" />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <Label className="font-bold">عنوان التسليم بالتفصيل</Label>
                    <Input placeholder="الحي، الشارع، المعلم القريب" value={form.receiver_address} onChange={e => updateField('receiver_address', e.target.value)} className="h-14 rounded-2xl bg-slate-50 border-none font-bold" />
                </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={loading} className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-2xl shadow-blue-500/30 transition-all active:scale-95">
            {loading ? <Loader2 className="animate-spin h-8 w-8" /> : "نشر الطلب الآن"}
          </Button>

        </form>
      </div>
    </AppLayout>
  );
}
