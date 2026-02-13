import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Mail, Phone } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchUsers = async () => {
      try {
        const data = await api.getAllUsers();
        if (isMounted) {
          setUsers(data || []);
          setLoading(false);
        }
      } catch (err) {
        console.error("Fetch aborted or failed");
      }
    };

    fetchUsers();

    // السمع الحي (Real-time) بشكل آمن
    const channel = supabase.channel('admin-users-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-black text-slate-800">إدارة المستخدمين</h2>
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-right font-bold py-4">المستخدم</TableHead>
                <TableHead className="text-right font-bold">الصلاحية</TableHead>
                <TableHead className="text-right font-bold">التواصل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={3} className="h-40 text-center"><Loader2 className="animate-spin mx-auto text-blue-500" /></TableCell></TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="py-4">
                      <div className="font-bold text-slate-700">{user.full_name}</div>
                      <div className="text-[10px] text-slate-400">ID: {user.id.slice(0, 8)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className={user.user_roles?.[0]?.role === 'admin' ? 'bg-rose-500' : 'bg-blue-500'}>
                        {user.user_roles?.[0]?.role || 'shipper'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-xs font-medium"><Mail size={12} className="inline mr-1"/> {user.email}</div>
                      <div className="text-xs font-medium mt-1"><Phone size={12} className="inline mr-1"/> {user.phone || '---'}</div>
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
