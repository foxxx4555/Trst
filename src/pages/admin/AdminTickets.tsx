import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, User, Clock } from 'lucide-react';

export default function AdminTickets() {
  const [tickets, setTickets] = useState<any[]>([]);

  useEffect(() => {
    api.getTickets().then(setTickets);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-black italic uppercase italic tracking-widest"><MessageSquare className="inline ml-2 text-blue-600"/> Support Desk</h1>
        <div className="bg-white rounded-[2.5rem] border shadow-2xl overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow>
                <TableHead className="text-slate-400 font-bold">المستخدم</TableHead>
                <TableHead className="text-slate-400 font-bold">الموضوع</TableHead>
                <TableHead className="text-slate-400 font-bold">الحالة</TableHead>
                <TableHead className="text-slate-400 font-bold">التاريخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map(t => (
                <TableRow key={t.id} className="h-20 hover:bg-slate-50 transition-colors">
                  <TableCell className="font-bold flex items-center gap-2">
                    <User size={14} className="text-blue-500" /> {t.profiles?.full_name}
                  </TableCell>
                  <TableCell className="font-bold text-slate-700">{t.subject}</TableCell>
                  <TableCell><Badge className="bg-rose-500 rounded-full px-4 font-black">OPEN</Badge></TableCell>
                  <TableCell className="text-slate-400 text-xs tabular-nums">
                    {new Date(t.created_at).toLocaleDateString('ar-SA')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </AppLayout>
  );
}
