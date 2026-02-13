import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '@/services/api';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setUserProfile, setCurrentRole } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { profile, role } = await api.loginByEmail(email, password);
      setUserProfile(profile);
      setCurrentRole(role);
      toast.success("تم تسجيل الدخول بنجاح");
      navigate(role === 'driver' ? '/driver/dashboard' : '/shipper/dashboard');
    } catch (err: any) {
      toast.error(err?.message || "خطأ في بيانات الدخول");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 font-['Cairo']">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8 italic">
          <h1 className="text-4xl font-black italic tracking-tighter text-slate-900">SAS LOGIN</h1>
          <p className="text-slate-400 font-bold text-xs uppercase mt-2">Logistics Intelligence</p>
        </div>
        <Card className="rounded-[2.5rem] border-none shadow-2xl bg-white overflow-hidden">
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-5">
              <div className="space-y-2 text-right">
                <Label className="font-bold">البريد الإلكتروني</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none font-bold" dir="ltr" />
              </div>
              <div className="space-y-2 text-right">
                <Label className="font-bold">كلمة المرور</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 rounded-xl bg-slate-50 border-none font-bold" dir="ltr" />
              </div>
              <Button type="submit" className="w-full h-14 rounded-2xl bg-blue-600 font-black text-lg shadow-xl shadow-blue-100 transition-all active:scale-95" disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : "دخول النظام"}
              </Button>
              <p className="text-center text-sm font-bold text-slate-500 pt-2">
                ليس لديك حساب؟ <Link to="/register" className="text-blue-600 underline">سجل الآن</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
