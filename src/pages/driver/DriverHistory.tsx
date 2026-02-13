                   
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, MapPin, Trash2, AlertTriangle, CheckCircle, 
  Download, FileText, CreditCard, ClipboardList, Users, CalendarDays
} from 'lucide-react';
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
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RangeCalendar } from "@/components/ui/range-calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as XLSX from 'xlsx';

// إصلاح أيقونة الخريطة
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// تعريف أنواع البيانات بشكل كامل
interface Load {
  id: string;
  origin: string;
  destination: string;
  weight: string;
  price: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  load_type?: string;
  origin_coords?: { lat: number; lng: number };
  destination_coords?: { lat: number; lng: number };
  documents?: { id: string; name: string; url: string }[];
  customer_info?: { name: string; phone: string; email: string };
  payment_status?: 'paid' | 'pending' | 'partial';
  commission?: string;
}

interface FilterOptions {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minWeight?: string;
  maxWeight?: string;
  minPrice?: string;
  maxPrice?: string;
  loadType?: string;
  region?: string;
}

interface Notification {
  id: string;
  text: string;
  date: string;
  read: boolean;
}

export default function DriverHistory() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [filteredLoads, setFilteredLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportType, setExportType] = useState<'pdf' | 'excel' | 'print'>('pdf');
  const [selectedLoad, setSelectedLoad] = useState<Load | null>(null);
  const [showLoadDetails, setShowLoadDetails] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // جلب بيانات الشحنات
  const fetchLoads = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getUserLoads(userProfile.id);
      setLoads(data);
      setFilteredLoads(data);
    } catch (error) {
      console.error("خطأ في جلب الشحنات:", error);
      toast.error(t('load_fetch_error'));
    } finally {
      setLoading(false);
    }
  };

  // جلب الإشعارات المحفوظة
  const fetchNotifications = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getDriverNotifications(userProfile.id);
      setNotifications(data);
    } catch (error) {
      console.error("خطأ في جلب الإشعارات:", error);
    }
  };

  // تطبيق الفلترة
  const applyFilters = () => {
    let result = [...loads];
    
    if (filterOptions.status) {
      result = result.filter(load => load.status === filterOptions.status);
    }
    
    if (filterOptions.startDate && filterOptions.endDate) {
      result = result.filter(load => {
        const loadDate = new Date(load.created_at);
        return loadDate >= filterOptions.startDate! && loadDate <= filterOptions.endDate!;
      });
    }
    
    if (filterOptions.minWeight && filterOptions.maxWeight) {
      result = result.filter(load => {
        const weight = parseFloat(load.weight);
        const min = parseFloat(filterOptions.minWeight!);
        const max = parseFloat(filterOptions.maxWeight!);
        return weight >= min && weight <= max;
      });
    }
    
    if (filterOptions.minPrice && filterOptions.maxPrice) {
      result = result.filter(load => {
        const price = parseFloat(load.price);
        const min = parseFloat(filterOptions.minPrice!);
        const max = parseFloat(filterOptions.maxPrice!);
        return price >= min && price <= max;
      });
    }
    
    if (filterOptions.loadType) {
      result = result.filter(load => load.load_type === filterOptions.loadType);
    }
    
    if (filterOptions.region) {
      result = result.filter(load => 
        load.origin.includes(filterOptions.region!) || 
        load.destination.includes(filterOptions.region!)
      );
    }
    
    setFilteredLoads(result);
  };

  // إعادة تعيين الفلترة
  const resetFilters = () => {
    setFilterOptions({});
    setFilteredLoads([...loads]);
  };

  // تصدير البيانات
  const exportData = () => {
    if (exportType === 'pdf') {
      // تنفيذ تصدير PDF
      const doc = new jsPDF();
      doc.text(t('my_loads_history'), 10, 10);
      // إضافة الجدول
      doc.autoTable({
        head: [[t('id'), t('origin'), t('destination'), t('weight'), t('price'), t('status')]],
        body: filteredLoads.map(load => [
          load.id.slice(0, 8),
          load.origin,
          load.destination,
          load.weight,
          load.price,
          t(load.status)
        ])
      });
      doc.save(`شحناتي_${new Date().toISOString().slice(0, 10)}.pdf`);
    } else if (exportType === 'excel') {
      // تصدير حقيقي لـ Excel
      const headers = [
        t('id'),
        t('origin'),
        t('destination'),
        t('weight'),
        t('price'),
        t('status'),
        t('date')
      ];
      
      const rows = filteredLoads.map(load => [
        load.id,
        load.origin,
        load.destination,
        load.weight,
        load.price,
        t(load.status),
        new Date(load.created_at).toLocaleDateString('ar-EG')
      ]);
      
      const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, t('my_loads'));
      XLSX.writeFile(workbook, `شحناتي_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } else if (exportType === 'print') {
      window.print();
    }
    setShowExportDialog(false);
  };

  // تحديث بيانات الشحنات والاشعارات
  useEffect(() => {
    fetchLoads();
    fetchNotifications();
    
    // تحديث كل 5 دقائق
    const interval = setInterval(() => {
      fetchLoads();
      fetchNotifications();
    }, 300000);
    
    return () => clearInterval(interval);
  }, [userProfile]);

  // تنبيه لتحديث بيانات المتصفح
  useEffect(() => {
    const updateCheck = async () => {
      const response = await fetch('https://github.com/browserslist/update-db#readme');
      if (response.ok) {
        const data = await response.text();
        if (data.includes('update')) {
          toast.info(t('update_browserslist_data'));
        }
      }
    };
    
    updateCheck();
    const checkInterval = setInterval(updateCheck, 86400000); // كل يوم
    return () => clearInterval(checkInterval);
  }, []);

  if (!userProfile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('profile_not_found')}</h3>
          <p className="text-muted-foreground mb-4">{t('please_login_to_view')}</p>
        </div>
      </AppLayout>
    );
  }

  // بيانات الرسم البياني
  const chartData = filteredLoads.map(load => ({
    name: new Date(load.created_at).toLocaleDateString('ar-EG', { month: 'short' }),
    count: filteredLoads.filter(l => 
      new Date(l.created_at).getMonth() === new Date(load.created_at).getMonth()
    ).length
  }));

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* عنوان الصفحة والإشعارات */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{t('my_loads_history')}</h1>
          
          {/* قائمة الإشعارات */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative">
                <ClipboardList className="h-5 w-5 mr-2" />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">{t('no_notifications')}</p>
              ) : (
                notifications.map(notification => (
                  <DropdownMenuItem key={notification.id} className="justify-between">
                    <div>
                      <p className="font-medium">{notification.text}</p>
                      <p className="text-xs text-muted-foreground">{notification.date}</p>
                    </div>
                    {!notification.read && <Badge variant="outline" className="ml-2">{t('unread')}</Badge>}
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* زر الفلترة */}
        <Button variant="ghost" onClick={() => setShowFilters(!showFilters)} className="mb-4">
          <Filter className="h-4 w-4 mr-2" />
          {t('filters')}
        </Button>

        {/* قسم الفلترة */}
        {showFilters && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">{t('filter_options')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>{t('status')}</Label>
                  <Select
                    value={filterOptions.status}
                    onValueChange={(value) => setFilterOptions({...filterOptions, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_statuses')}</SelectItem>
                      <SelectItem value="in_progress">{t('in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('completed')}</SelectItem>
                      <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('date_range')}</Label>
                  <RangeCalendar
                    mode="range"
                    onValueChange={(value) => setFilterOptions({
                      ...filterOptions,
                      startDate: value?.[0],
                      endDate: value?.[1]
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('weight_range')} (طن)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('min')}
                      value={filterOptions.minWeight}
                      onChange={(e) => setFilterOptions({...filterOptions, minWeight: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder={t('max')}
                      value={filterOptions.maxWeight}
                      onChange={(e) => setFilterOptions({...filterOptions, maxWeight: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('price_range')} (ر.س)</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('min')}
                      value={filterOptions.minPrice}
                      onChange={(e) => setFilterOptions({...filterOptions, minPrice: e.target.value})}
                    />
                    <Input
                      type="number"
                      placeholder={t('max')}
                      value={filterOptions.maxPrice}
                      onChange={(e) => setFilterOptions({...filterOptions, maxPrice: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('load_type')}</Label>
                  <Select
                    value={filterOptions.loadType}
                    onValueChange={(value) => setFilterOptions({...filterOptions, loadType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('all_types')}</SelectItem>
                      <SelectItem value="general">{t('general_cargo')}</SelectItem>
                      <SelectItem value="refrigerated">{t('refrigerated')}</SelectItem>
                      <SelectItem value="heavy">{t('heavy')}</SelectItem>
                      <SelectItem value="dangerous">{t('dangerous')}</SelectItem>
                    </SelectContent>
                 
