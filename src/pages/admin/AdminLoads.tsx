import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MapPin, Box, DollarSign, Loader2, ArrowLeftRight } from 'lucide-react';

export default function AdminLoads() {
  const [loads, setLoads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLoads = async () => {
    const data = await api.getAllLoads();
    setLoads(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLoads();
    const channel = supabase.channel('admin-realtime-loads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loads' }, () => fetchLoads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">الرقابة اللوجستية الشاملة</h2>
        
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="text-right font-black text-slate-400 py-6">مسار الشحنة</TableHead>
                <TableHead className="text-right font-black text-slate-400">صاحب الطلب</TableHead>
                <TableHead className="text-right font-black text-slate-400 text-center">الحالة</TableHead>
                <TableHead className="text-right font-black text-slate-400">تكلفة النقل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-60 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></TableCell></TableRow>
              ) : (
                loads.map((load) => (
                  <TableRow key={load.id} className="border-slate-50 hover:bg-slate-50 transition-colors h-24">
                    <TableCell>
                      <div className="flex items-center gap-3">
                          <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><MapPin size={20}/></div>
                          <div>
                              <div className="flex items-center gap-2 font-black text-slate-800">
                                  {load.origin} <ArrowLeftRight size={14} className="text-slate-300"/> {load.destination}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{load.weight} طن - {load.package_type || 'بضاعة عامة'}</p>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="font-black text-slate-700">{load.profiles?.full_name || 'غير معروف'}</p>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={cn(
                          "rounded-full px-4 py-1 font-black text-[10px] uppercase",
                          load.status === 'available' ? 'bg-blue-100 text-blue-600' :
                          load.status === 'in_progress' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'
                      )}>
                        {load.status === 'available' ? 'متاحة بالسوق' : load.status === 'in_progress' ? 'قيد التوصيل' : 'مكتملة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col items-start">
                          <span className="text-lg font-black text-slate-900 tabular-nums">{load.price} <span className="text-[10px] text-slate-400 mr-1">ر.س</span></span>
                          <span className="text-[10px] font-bold text-emerald-500">عمولة المنصة محتسبة</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
