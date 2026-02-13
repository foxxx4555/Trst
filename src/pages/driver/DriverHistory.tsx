                   
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
                 
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('region')}</Label>
                  <Input
                    placeholder={t('search_by_region')}
                    value={filterOptions.region}
                    onChange={(e) => setFilterOptions({...filterOptions, region: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-6">
                <Button onClick={applyFilters}>{t('apply_filters')}</Button>
                <Button variant="ghost" onClick={resetFilters}>{t('reset_filters')}</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* قسم البيانات المالية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('total_earnings')}</p>
                  <p className="text-2xl font-bold">
                    {filteredLoads.reduce((sum, load) => sum + parseFloat(load.price), 0)} ر.س
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-blue-500" />
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span>{t('paid')}: {filteredLoads.filter(l => l.payment_status === 'paid').length} {t('loads')}</span>
                <span>{t('pending')}: {filteredLoads.filter(l => l.payment_status === 'pending').length} {t('loads')}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('total_loads')}</p>
                  <p className="text-2xl font-bold">{filteredLoads.length}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-green-500" />
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span>{t('completed')}: {filteredLoads.filter(l => l.status === 'completed').length}</span>
                <span>{t('in_progress')}: {filteredLoads.filter(l => l.status === 'in_progress').length}</span>
                <span>{t('cancelled')}: {filteredLoads.filter(l => l.status === 'cancelled').length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{t('average_income')}</p>
                  <p className="text-2xl font-bold">
                    {filteredLoads.length > 0 
                      ? (filteredLoads.reduce((sum, load) => sum + parseFloat(load.price), 0) / filteredLoads.length).toFixed(2)
                      : '0'
                    } ر.س
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
              <Separator className="my-4" />
              <div className="flex justify-between text-sm">
                <span>{t('highest_earning')}: {Math.max(...filteredLoads.map(l => parseFloat(l.price)), 0)} ر.س</span>
                <span>{t('lowest_earning')}: {Math.min(...filteredLoads.map(l => parseFloat(l.price)), 0)} ر.س</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* الرسم البياني */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold mb-4">{t('loads_chart')}</h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#22c55e" />
                  <Bar dataKey="in_progress" fill="#3b82f6" />
                  <Bar dataKey="cancelled" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* تفاصيل الشحنات */}
        <div className="mb-8">
          <h3 className="text-xl font-bold mb-4">{t('my_loads')}</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <span>{t('loading')}</span>
            </div>
          ) : filteredLoads.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
              <h3 className="text-lg font-medium">{t('no_loads_found')}</h3>
              <p className="text-muted-foreground">{t('no_loads_desc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLoads.map((load) => (
                <div key={load.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                  <div className="bg-gray-50 p-3 border-b">
                    <div className="flex justify-between items-center">
                      <Badge variant={
                        load.status === 'completed' ? 'default' :
                        load.status === 'in_progress' ? 'secondary' : 'destructive'
                      }>
                        {t(load.status)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(load.created_at).toLocaleDateString('ar-EG')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-bold text-lg mb-2">{load.origin} → {load.destination}</h4>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('weight')}:</span> {load.weight} طن
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('type')}:</span> {t(load.load_type || 'general')}
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('price')}:</span> {load.price} ر.س
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('payment_status')}:</span> {t(load.payment_status || 'pending')}
                      </div>
                    </div>

                    {load.documents && load.documents.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">{t('documents')}:</p>
                        <div className="flex flex-wrap gap-2">
                          {load.documents.map(doc => (
                            <button
                              key={doc.id}
                              onClick={() => downloadDocument(doc.url, doc.name)}
                              className="flex items-center text-sm bg-blue-50 text-blue-600 px-2 py-1 rounded"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              {doc.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between mt-4">
                      <Button variant="ghost" onClick={() => markLoadAsCompleted(load.id)}>
                        {t('mark_as_completed')}
                      </Button>
                      <Button onClick={() => setSelectedLoad(load)}>
                        {t('view_details')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* نافذة تفاصيل الحمولة */}
        <Dialog open={!!selectedLoad} onOpenChange={() => setSelectedLoad(null)}>
          <DialogContent className="max-w-2xl">
            {selectedLoad && (
              <>
                <DialogHeader>
                  <DialogTitle>{selectedLoad.origin} → {selectedLoad.destination}</DialogTitle>
                  <DialogDescription>
                    {t('load_created_on')} {new Date(selectedLoad.created_at).toLocaleDateString('ar-EG')}
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('load_details')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('weight')}:</span>
                        <span>{selectedLoad.weight} طن</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('type')}:</span>
                        <span>{t(selectedLoad.load_type || 'general')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('price')}:</span>
                        <span className="font-bold">{selectedLoad.price} ر.س</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('payment_status')}:</span>
                        <span>{t(selectedLoad.payment_status || 'pending')}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">{t('customer_info')}</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('name')}:</span>
                        <span>{selectedLoad.customer_info?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('phone')}:</span>
                        <span>{selectedLoad.customer_info?.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('email')}:</span>
                        <span>{selectedLoad.customer_info?.email}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedLoad.origin_coords && selectedLoad.destination_coords && (
                  <div className="h-[250px] rounded-lg overflow-hidden border mt-4">
                    <MapContainer center={[(selectedLoad.origin_coords.lat + selectedLoad.destination_coords.lat)/2, (selectedLoad.origin_coords.lng + selectedLoad.destination_coords.lng)/2]} zoom={8}>
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                      <Marker position={[selectedLoad.origin_coords.lat, selectedLoad.origin_coords.lng]}>
                        <Popup>{t('origin')}</Popup>
                      </Marker>
                      <Marker position={[selectedLoad.destination_coords.lat, selectedLoad.destination_coords.lng]}>
                        <Popup>{t('destination')}</Popup>
                      </Marker>
                      <Polyline positions={[
                        [selectedLoad.origin_coords.lat, selectedLoad.origin_coords.lng],
                        [selectedLoad.destination_coords.lat, selectedLoad.destination_coords.lng]
                      ]} color="blue" />
                    </MapContainer>
                  </div>
                )}

                {selectedLoad.documents && selectedLoad.documents.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-medium mb-2">{t('attachments')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedLoad.documents.map(doc => (
                        <button
                          key={doc.id}
                          onClick={() => downloadDocument(doc.url, doc.name)}
                          className="flex items-center bg-gray-50 px-3 py-1 rounded-md text-sm"
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          {doc.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="ghost" onClick={() => setSelectedLoad(null)}>
                    {t('close')}
                  </Button>
                  {selectedLoad.status === 'in_progress' && (
                    <Button onClick={() => markLoadAsCompleted(selectedLoad.id)}>
                      {t('mark_as_completed')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
