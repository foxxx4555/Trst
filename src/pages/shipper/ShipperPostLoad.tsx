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
import { Loader2, MapPin, Package, User, Phone, Info, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// تعريف أنواع البيانات للنموذج
interface PostLoadForm {
  origin: string;
  destination: string;
  weight: string;
  price: string;
  truck_size: string;
  body_type: 'flatbed' | 'curtain' | 'box' | 'refrigerated' | 'lowboy';
  type: 'general' | 'fragile' | 'hazardous' | 'perishable';
  package_type: 'pallets' | 'boxes' | 'loose' | 'bulk';
  pickup_date: string;
  description: string;
  receiver_name: string;
  receiver_phone: string;
  receiver_address: string;
}

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  // تهيئة النموذج مع جميع الحقول المستخدمة
  const [form, setForm] = useState<PostLoadForm>({
    origin: '',
    destination: '',
    weight: '',
    price: '',
    truck_size: '',
    body_type: 'flatbed',
    type: 'general',
    package_type: 'boxes',
    pickup_date: new Date().toISOString().split('T')[0],
    description: '',
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
  });

  // فحص صلاحيات المدخلات
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const today = new Date().toISOString().split('T')[0];

    if (!form.origin.trim()) {
      newErrors.origin = t('required_field', { field: t('loading_city') });
    }

    if (!form.destination.trim()) {
      newErrors.destination = t('required_field', { field: t('unloading_city') });
    }

    if (form.pickup_date < today) {
      newErrors.pickup_date = t('invalid_date_past');
    }

    if (!form.weight.trim()) {
      newErrors.weight = t('required_field', { field: t('estimated_weight') });
    } else if (Number(form.weight) <= 0) {
      newErrors.weight = t('must_be_positive', { field: t('weight') });
    }

    if (!form.price.trim()) {
      newErrors.price = t('required_field', { field: t('proposed_price') });
    } else if (Number(form.price) <= 0) {
      newErrors.price = t('must_be_positive', { field: t('price') });
    }

    if (!form.receiver_name.trim()) {
      newErrors.receiver_name = t('required_field', { field: t('receiver_name') });
    }

    if (!form.receiver_phone.trim()) {
      newErrors.receiver_phone = t('required_field', { field: t('receiver_phone') });
    } else if (!/^05\d{8}$/.test(form.receiver_phone)) {
      newErrors.receiver_phone = t('invalid_phone_format');
    }

    if (!form.receiver_address.trim()) {
      newErrors.receiver_address = t('required_field', { field: t('delivery_address') });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    // التحقق من صحة المدخلات
    if (!validateForm()) {
      toast.warning(t('check_form_errors'));
      return;
    }

    // إذا لم يكن التأكيد ظاهراً، أظهره
    if (!showConfirm) {
      setShowConfirm(true);
      return;
    }

    // إذا كان التأكيد ظاهراً، أرسل الطلب
    if (!userProfile?.id) {
      toast.error(t('must_login_to_post'));
      return;
    }

    setLoading(true);
    try {
      await api.postLoad(form, userProfile.id);
      toast.success(t('load_posted_successfully'));
      navigate('/shipper/dashboard');
    } catch (err: any) {
      console.error("Error posting load:", err);
      toast.error(err.message || t('post_failed'));
    } finally {
      setLoading(false);
      setShowConfirm(false);
    }
  };

  const updateField = (key: keyof PostLoadForm, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    // مسح الخطأ عند تعديل الحقل
    if (errors[key]) {
      setErrors(prev => ({ ...prev, [key]: '' }));
    }
  };

  // حالة عدم وجود مستخدم
  if (!userProfile) {
    return (
      <AppLayout>
        <Card className="max-w-4xl mx-auto my-8 rounded-[2.5rem]">
          <CardContent className="p-8 flex flex-col items-center gap-4 py-12">
            <AlertCircle size={32} className="text-amber-500" />
            <h3 className="text-xl font-bold text-slate-800">{t('profile_not_found')}</h3>
            <p className="text-slate-500 text-center">{t('must_login_to_post')}</p>
            <Button 
              onClick={() => navigate('/auth/login')}
              className="h-14 rounded-2xl bg-blue-600 text-white font-bold"
            >
              {t('go_to_login')}
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* شريط تحذير التأكيد */}
          {showConfirm && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
              <AlertCircle size={20} className="text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-bold text-amber-800">{t('confirm_post')}</p>
                <p className="text-sm text-amber-700">{t('confirm_post_note')}</p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => setShowConfirm(false)}
                  className="h-10 rounded-xl"
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="h-10 rounded-xl bg-blue-600"
                >
                  {t('confirm')}
                </Button>
              </div>
            </div>
          )}

          {/* 1. معلومات المسار */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="bg-slate-900 text-white p-8">
              <CardTitle className="flex items-center gap-3 font-black text-xl">
                <MapPin className="text-blue-400" /> {t('route_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">{t('loading_city')}</Label>
                  <span className="text-red-500">*</span>
                </div>
                <Input 
                  placeholder={t('example_loading_city')} 
                  value={form.origin} 
                  onChange={e => updateField('origin', e.target.value)} 
                  required 
                  className={cn(
                    "h-14 rounded-2xl bg-slate-50 border-none font-bold",
                    errors.origin && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.origin && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.origin}
                </p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">{t('unloading_city')}</Label>
                  <span className="text-red-500">*</span>
                </div>
                <Input 
                  placeholder={t('example_unloading_city')} 
                  value={form.destination} 
                  onChange={e => updateField('destination', e.target.value)} 
                  required 
                  className={cn(
                    "h-14 rounded-2xl bg-slate-50 border-none font-bold",
                    errors.destination && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.destination && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.destination}
                </p>}
              </div>
              <div className="space-y-2">
                <Label className="font-bold">{t('pickup_date')}</Label>
                <Input 
                  type="date" 
                  value={form.pickup_date} 
                  onChange={e => updateField('pickup_date', e.target.value)} 
                  className={cn(
                    "h-14 rounded-2xl bg-slate-50 border-none font-bold",
                    errors.pickup_date && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.pickup_date && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.pickup_date}
                </p>}
              </div>
            </CardContent>
          </Card>

          {/* 2. تفاصيل الحمولة والشاحنة */}
          <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <CardTitle className="flex items-center gap-3 font-black text-xl text-slate-800">
                <Package className="text-blue-600" /> {t('cargo_truck_info')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">{t('estimated_weight')} (طن)</Label>
                  <span className="text-red-500">*</span>
                </div>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={form.weight} 
                  onChange={e => updateField('weight', e.target.value)} 
                  className={cn(
                    "h-14 rounded-2xl bg-slate-50 border-none font-bold",
                    errors.weight && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.weight && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.weight}
                </p>}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="font-bold">{t('proposed_price')} (ريال)</Label>
                  <span className="text-red-500">*</span>
                </div>
                <Input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={form.price} 
                  onChange={e => updateField('price', e.target.value)} 
                  className={cn(
                    "h-14 rounded-2xl bg-slate-50 border-none font-bold text-emerald-600",
                    errors.price && "border-red-500 focus-visible:ring-red-500"
                  )}
                />
                {errors.price && <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle size={12} /> {errors.price}
                </p>}
              </div>
              <div className="space-y-2">
