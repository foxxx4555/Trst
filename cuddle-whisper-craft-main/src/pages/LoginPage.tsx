import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setUserProfile, setCurrentRole } = useAppStore();
  const [loading, setLoading] = useState(false);
  
  // حالة بيانات المستخدم
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // حالة بيانات الأدمن
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  // دالة تسجيل دخول المستخدمين (سائق / شاحن)
  const handleUserLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // 1. استدعاء API تسجيل الدخول
      const { profile, role } = await api.loginByEmail(email, password);
      
      // 2. تحديث الحالة العامة للتطبيق
      if (profile) setUserProfile(profile);
      if (role) setCurrentRole(role);
      
      toast.success(t('success'));
      
      // 3. التوجيه الدقيق بناءً على الدور
      if (role === 'driver') {
        console.log("Redirecting to Driver Dashboard");
        navigate('/driver/dashboard');
      } else if (role === 'shipper') {
        console.log("Redirecting to Shipper Dashboard");
        navigate('/shipper/dashboard');
      } else if (role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // حالة استثنائية: المستخدم ليس لديه دور محدد
        console.warn("User has no role assigned:", role);
        toast.error("هذا الحساب ليس لديه صلاحيات محددة، يرجى التواصل مع الدعم.");
      }
      
    } catch (err: any) {
      console.error("Login Error:", err);
      // التعامل مع أخطاء Supabase الشائعة
      if (err.message.includes("Invalid login credentials")) {
        toast.error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (err.message.includes("Email not confirmed")) {
        toast.error("يرجى تفعيل البريد الإلكتروني أولاً");
      } else {
        toast.error(err.message || t('error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // دالة تسجيل دخول الأدمن
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.loginAdmin(adminEmail, adminPassword);
      setCurrentRole('admin');
      toast.success(t('success'));
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error("Admin Login Error:", err);
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SAS Transport" className="w-16 h-16 mx-auto rounded-xl mb-4" />
          <h1 className="text-2xl font-bold">{t('login')}</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            <Tabs defaultValue="user" dir="rtl">
              <TabsList className="w-full mb-6">
                <TabsTrigger value="user" className="flex-1">{t('login_as_user')}</TabsTrigger>
                <TabsTrigger value="admin" className="flex-1">{t('login_as_admin')}</TabsTrigger>
              </TabsList>

              <TabsContent value="user">
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div>
                    <Label>{t('email')}</Label>
                    <Input 
                      type="email" 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      required 
                      dir="ltr" 
                      className="mt-1" 
                      placeholder="name@example.com"
                    />
                  </div>
                  <div>
                    <Label>{t('password')}</Label>
                    <Input 
                      type="password" 
                      value={password} 
                      onChange={e => setPassword(e.target.value)} 
                      required 
                      dir="ltr" 
                      className="mt-1" 
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : t('login')}
                  </Button>
                  <div className="text-center space-y-2">
                    <Link to="/forgot-password" className="text-sm text-primary hover:underline block">{t('forgot_password')}</Link>
                    <p className="text-sm text-muted-foreground">
                      {t('no_account')} <Link to="/register" className="text-primary font-medium hover:underline">{t('register')}</Link>
                    </p>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="admin">
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label>{t('email')}</Label>
                    <Input 
                      type="email" 
                      value={adminEmail} 
                      onChange={e => setAdminEmail(e.target.value)} 
                      required 
                      dir="ltr" 
                      className="mt-1" 
                    />
                  </div>
                  <div>
                    <Label>{t('password')}</Label>
                    <Input 
                      type="password" 
                      value={adminPassword} 
                      onChange={e => setAdminPassword(e.target.value)} 
                      required 
                      dir="ltr" 
                      className="mt-1" 
                    />
                  </div>
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                    {loading ? <Loader2 className="animate-spin" /> : t('login')}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
