import { useState, useEffect } from 'react';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from 'sonner';
import { Loader2, Check, ChevronsUpDown, MapPin, Calculator } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

// 1. قائمة مدن السعودية مع الإحداثيات (للحساب التقريبي للمسافة)
const SAUDI_CITIES = [
  { value: "riyadh", label: "الرياض", lat: 24.7136, lng: 46.6753 },
  { value: "jeddah", label: "جدة", lat: 21.5433, lng: 39.1728 },
  { value: "mecca", label: "مكة المكرمة", lat: 21.3891, lng: 39.8579 },
  { value: "medina", label: "المدينة المنورة", lat: 24.5247, lng: 39.5692 },
  { value: "dammam", label: "الدمام", lat: 26.4207, lng: 50.0888 },
  { value: "khobar", label: "الخبر", lat: 26.2172, lng: 50.1971 },
  { value: "tabuk", label: "تبوك", lat: 28.3835, lng: 36.5662 },
  { value: "hail", label: "حائل", lat: 27.5114, lng: 41.7208 },
  { value: "abha", label: "أبها", lat: 18.2164, lng: 42.5053 },
  { value: "jizan", label: "جازان", lat: 16.8894, lng: 42.5706 },
  { value: "najran", label: "نجران", lat: 17.4917, lng: 44.1322 },
  { value: "buraidah", label: "بريدة", lat: 26.3260, lng: 43.9750 },
  { value: "taif", label: "الطائف", lat: 21.4418, lng: 40.5078 },
  { value: "jubail", label: "الجبيل", lat: 27.0000, lng: 49.6111 },
  { value: "yanbu", label: "ينبع", lat: 24.0232, lng: 38.1900 },
  { value: "arar", label: "عرعر", lat: 30.9833, lng: 41.0167 },
  { value: "sakaka", label: "سكاكا", lat: 29.9697, lng: 40.2064 },
  { value: "al_bahah", label: "الباحة", lat: 20.0129, lng: 41.4677 },
];

// دالة حساب المسافة (Haversine Formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // نصف قطر الأرض بالكيلومتر
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d); // إرجاع المسافة مقربة
}

export default function ShipperPostLoad() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // حالات فتح القوائم
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openDest, setOpenDest] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);

  // التاريخ الحالي بصيغة YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    origin: '',
    destination: '',
    // كائنات لتخزين إحداثيات المدن المختارة
    origin_obj: null as any,
    dest_obj: null as any,
    weight: '',
    price: '',
    description: '',
    type: 'general',
    package_type: '',
    pickup_date: today, // 4. التاريخ الافتراضي هو اليوم
    truck_size: '',
    body_type: 'flatbed', // 1. تعيين قيمة افتراضية لحل مشكلة الخطأ
    receiver_name: '',
    receiver_phone: '',
    receiver_address: '',
  });

  // حساب المسافة تلقائياً عند تغيير المدن
  useEffect(() => {
    if (form.origin_obj && form.dest_obj) {
      const dist = calculateDistance(
        form.origin_obj.lat,
        form.origin_obj.lng,
        form.dest_obj.lat,
        form.dest_obj.lng
      );
      setDistance(dist);
    } else {
      setDistance(null);
    }
  }, [form.origin_obj, form.dest_obj]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.id) return;

    if (!form.origin || !form.destination) {
      toast.error('الرجاء اختيار موقع التحميل والتسليم');
      return;
    }

    setLoading(true);
    try {
      // إعداد البيانات للإرسال
      const loadData = {
        ...form,
        distance: distance || 0,
        // إرسال الإحداثيات إذا كانت موجودة (اختياري حسب قاعدة البيانات)
        origin_lat: form.origin_obj?.lat || null,
        origin_lng: form.origin_obj?.lng || null,
        dest_lat: form.dest_obj?.lat || null,
        dest_lng: form.dest_obj?.lng || null,
      };

      await api.postLoad(loadData, userProfile.id);
      toast.success(t('success'));
      navigate('/shipper/loads');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'حدث خطأ أثناء نشر الشحنة');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [key]: e.target.value }));

  // قائمة أنواع الهيكل (مطابقة لقاعدة البيانات)
  const bodyTypes = [
    { value: 'flatbed', label: t('flatbed') }, // مسطحة
    { value: 'curtain', label: 'ستارة (Curtain)' },
    { value: 'box', label: 'صندوق مغلق (Box)' },
    { value: 'refrigerated', label: t('refrigerated') }, // مبردة
    { value: 'lowboy', label: 'لوبد (Lowboy)' },
    { value: 'tank', label: t('tanker') }, // صهريج
  ];

  return (
    <AppLayout>
      <Card className="max-w-3xl mx-auto shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <MapPin className="text-primary" />
            {t('post_load')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* قسم اختيار المدن والمسافة */}
            <div className="bg-muted/30 p-5 rounded-xl border border-border/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* موقع التحميل - بحث ذكي */}
                <div className="flex flex-col gap-2">
                  <Label className="text-base font-semibold">موقع التحميل (المدينة)</Label>
                  <Popover open={openOrigin} onOpenChange={setOpenOrigin}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openOrigin} className="justify-between w-full h-12 text-right">
                        {form.origin ? form.origin : "اختر مدينة..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="بحث عن مدينة..." />
                        <CommandList>
                          <CommandEmpty>لا توجد مدينة بهذا الاسم.</CommandEmpty>
                          <CommandGroup>
                            {SAUDI_CITIES.map((city) => (
                              <CommandItem
                                key={city.value}
                                value={city.label}
                                onSelect={() => {
                                  setForm(p => ({ ...p, origin: city.label, origin_obj: city }));
                                  setOpenOrigin(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", form.origin === city.label ? "opacity-100" : "opacity-0")} />
                                {city.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* موقع التسليم - بحث ذكي */}
                <div className="flex flex-col gap-2">
                  <Label className="text-base font-semibold">موقع التسليم (المدينة)</Label>
                  <Popover open={openDest} onOpenChange={setOpenDest}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={openDest} className="justify-between w-full h-12 text-right">
                        {form.destination ? form.destination : "اختر مدينة..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                      <Command>
                        <CommandInput placeholder="بحث عن مدينة..." />
                        <CommandList>
                          <CommandEmpty>لا توجد مدينة بهذا الاسم.</CommandEmpty>
                          <CommandGroup>
                            {SAUDI_CITIES.map((city) => (
                              <CommandItem
                                key={city.value}
                                value={city.label}
                                onSelect={() => {
                                  setForm(p => ({ ...p, destination: city.label, dest_obj: city }));
                                  setOpenDest(false);
                                }}
                              >
                                <Check className={cn("mr-2 h-4 w-4", form.destination === city.label ? "opacity-100" : "opacity-0")} />
                                {city.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* عرض المسافة المحسوبة */}
              {distance && (
                <div className="flex items-center justify-center gap-2 bg-primary/10 text-primary p-3 rounded-lg border border-primary/20 animate-in fade-in zoom-in duration-300">
                  <Calculator size={20} />
                  <span className="font-medium">المسافة التقديرية:</span>
                  <span className="font-bold text-xl">{distance}</span>
                  <span className="text-sm">كم</span>
                </div>
              )}
            </div>

            {/* تفاصيل الشحنة */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>{t('weight')} (طن)</Label>
                <Input type="number" value={form.weight} onChange={set('weight')} className="mt-1 h-12" dir="ltr" placeholder="مثال: 25" required />
              </div>
              <div>
                <Label>{t('price')} (ر.س)</Label>
                <Input type="number" value={form.price} onChange={set('price')} className="mt-1 h-12" dir="ltr" placeholder="السعر المقترح" required />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>نوع الهيكل (Body Type)</Label>
                {/* تم حل المشكلة هنا بتحديد قيمة من القائمة بدلاً من نص حر */}
                <Select value={form.body_type} onValueChange={(val) => setForm(p => ({ ...p, body_type: val }))}>
                  <SelectTrigger className="mt-1 h-12">
                    <SelectValue placeholder="اختر نوع الهيكل" />
                  </SelectTrigger>
                  <SelectContent>
                    {bodyTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>{t('pickup_date')}</Label>
                <Input 
                  type="date" 
                  value={form.pickup_date} 
                  onChange={set('pickup_date')} 
                  className="mt-1 h-12" 
                  dir="ltr"
                  min={today} // منع اختيار تاريخ في الماضي
                  required
                />
              </div>
            </div>

            <div>
              <Label>{t('package_type')}</Label>
              <Input value={form.package_type} onChange={set('package_type')} className="mt-1 h-12" placeholder="مثال: مواد بناء، أثاث، خضروات..." />
            </div>

            <div>
              <Label>{t('description')}</Label>
              <Textarea 
                value={form.description} 
                onChange={set('description')} 
                className="mt-1 min-h-[100px]" 
                placeholder="أضف تفاصيل إضافية عن الشحنة هنا..." 
              />
            </div>

            {/* بيانات المستلم */}
            <div className="border-t pt-6 mt-6">
              <h3 className="font-bold text-lg mb-4 text-primary">بيانات المستلم</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('receiver_name')}</Label>
                  <Input value={form.receiver_name} onChange={set('receiver_name')} className="mt-1 h-12" required />
                </div>
                <div>
                  <Label>{t('receiver_phone')}</Label>
                  <Input value={form.receiver_phone} onChange={set('receiver_phone')} className="mt-1 h-12" dir="ltr" placeholder="05xxxxxxxx" required />
                </div>
              </div>
              <div className="mt-4">
                <Label>{t('receiver_address')}</Label>
                <Input value={form.receiver_address} onChange={set('receiver_address')} className="mt-1 h-12" placeholder="العنوان بالتفصيل" />
              </div>
            </div>

            <Button type="submit" className="w-full h-14 text-lg font-bold rounded-xl mt-4" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : t('post_load')}
            </Button>
          </form>
        </CardContent>
      </Card>
    </AppLayout>
  );
}
