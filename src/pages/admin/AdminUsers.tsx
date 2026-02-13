import { useEffect, useState, useCallback } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = useCallback(async () => {
    try {
      const data = await api.getAllUsers();
      if (data) setUsers(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchUsers();
    const ch = supabase.channel('admin-realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchUsers]);

  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">User Directory</h2>
            <div className="relative w-full md:w-80"><Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><Input placeholder="بحث بالاسم أو الإيميل..." className="pr-10 rounded-2xl h-12 shadow-sm" value={search} onChange={e => setSearch(e.target.value)} /></div>
        </div>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="hover:bg-transparent border-none">
                <TableHead className="w-[35%] text-right font-black text-slate-400 py-6 pr-8">المستخدم</TableHead>
                <TableHead className="w-[20%] text-right font-black text-slate-400">الصلاحية</TableHead>
                <TableHead className="w-[30%] text-right font-black text-slate-400">التواصل</TableHead>
                <TableHead className="w-[15%] text-right font-black text-slate-400">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={4} className="h-64 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={40} /></TableCell></TableRow>
              ) : filtered.map((u) => (
                <TableRow key={u.id} className="border-slate-50 hover:bg-slate-50 transition-all h-24">
                  <TableCell className="pr-8">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-blue-600 border border-slate-200 uppercase">{u.full_name?.[0] || 'U'}</div>
                        <div><p className="font-black text-slate-800 text-sm leading-none mb-1">{u.full_name || 'مستخدم جديد'}</p><p className="text-[10px] text-slate-400 font-bold uppercase">ID: {u.id.slice(0,8)}</p></div>
                    </div>
                  </TableCell>
                  <TableCell><Badge className={cn("rounded-lg font-black text-[9px] uppercase px-3 py-1", u.user_roles?.[0]?.role === 'admin' ? 'bg-rose-500' : u.user_roles?.[0]?.role === 'driver' ? 'bg-blue-600' : 'bg-emerald-500')}>{u.user_roles?.[0]?.role || 'shipper'}</Badge></TableCell>
                  <TableCell><div className="space-y-1"><p className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Mail size={12} className="text-slate-300"/> {u.email}</p><p className="flex items-center gap-2 text-[11px] font-bold text-slate-600"><Phone size={12} className="text-slate-300"/> {u.phone || '---'}</p></div></TableCell>
                  <TableCell className="text-[11px] font-black text-slate-400 tabular-nums">{new Date(u.created_at).toLocaleDateString('ar-SA')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}

function cn(...inputs: any) { return inputs.filter(Boolean).join(' '); }
