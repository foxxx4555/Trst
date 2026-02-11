import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api'; // تأكد أن دالة resendOtp موجودة هنا
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Truck, Package, MailCheck, RefreshCcw, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { UserRole } from '@/types';
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // States
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<UserRole>('shipper');
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [timer, setTimer] = useState(0); // عداد لإعادة الإرسال
  
  const [form, setForm] = useState({ 
    full_name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '' 
  });

  // التحكم في عداد الوقت
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  // دالة التسجيل الأولي
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast.error('كلمة المرور غير متطابقة');
      return;
    }
    setLoading(true);
    try {
      await api.registerUser(form.email, form.password, {
        full_name: form.full_name,
        phone: form.phone,
        role,
      });
      toast.success('تم إرسال رمز التحقق إلى بريدك الإلكتروني');
      setShowOtp(true);
      setTimer(60); // بدء العد التنازلي لمدة 60 ثانية
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  // دالة التحقق من الرمز
  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length < 6) {
      toast.error('الرجاء إدخال الرمز كاملاً');
      return;
    }
    setLoading(true);
    try {
      await api.verifyEmailOtp(form.email, otpCode);
      toast.success('تم تفعيل الحساب بنجاح!');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'رمز التحقق غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  // دالة إعادة إرسال الرمز
  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setLoading(true);
    try {
      // ملاحظة: تأكد من إضافة دالة resendOtp في ملف api services الخاص بك
      // Supabase Code: await supabase.auth.resend({ type: 'signup', email: form.email });
      await api.resendOtp(form.email); 
      setTimer(60);
      toast.success('تم إعادة إرسال الرمز بنجاح');
    } catch (err: any) {
      toast.error(err.message || 'فشل في إعادة الإرسال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="SAS Transport" className="w-16 h-16 mx-auto rounded-xl mb-4" />
          <h1 className="text-2xl font-bold">{showOtp ? 'تأكيد البريد الإلكتروني' : t('register')}</h1>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            {!showOtp ? (
              /* --- نموذج التسجيل --- */
              <>
                <div className="mb-6">
                  <Label className="mb-3 block">{t('register_as')}</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRole('driver')} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", role === 'driver' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                      <Truck size={28} className={role === 'driver' ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-sm font-medium">{t('driver')}</span>
                    </button>
                    <button type="button" onClick={() => setRole('shipper')} className={cn("flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all", role === 'shipper' ? "border-primary bg-primary/5" : "border-border hover:border-primary/50")}>
                      <Package size={28} className={role === 'shipper' ? 'text-primary' : 'text-muted-foreground'} />
                      <span className="text-sm font-medium">{t('shipper')}</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleRegister} className="space-y-4">
                  <div><Label>{t('full_name')}</Label><Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} required className="mt-1" /></div>
                  <div><Label>{t('email')}</Label><Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required dir="ltr" className="mt-1" /></div>
                  <div><Label>{t('phone')}</Label><Input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} dir="ltr" className="mt-1" /></div>
                  <div><Label>{t('password')}</Label><Input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required dir="ltr" className="mt-1" /></div>
                  <div><Label>{t('confirm_password')}</Label><Input type="password" value={form.confirmPassword} onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required dir="ltr" className="mt-1" /></div>
                  <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>{loading ? <Loader2 className="animate-spin" /> : t('register')}</Button>
                  <p className="text-sm text-center text-muted-foreground">{t('have_account')} <Link to="/login" className="text-primary font-medium hover:underline">{t('login')}</Link></p>
                </form>
              </>
            ) : (
              /* --- نموذج الرمز OTP --- */
              <form onSubmit={handleVerify} className="space-y-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary animate-pulse">
                    <MailCheck size={32} />
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>أرسلنا رمز تحقق مكون من 6 أرقام إلى:</p>
                  <p className="font-semibold text-foreground dir-ltr text-base">{form.email}</p>
                  <p className="text-xs text-yellow-600 pt-2">يرجى التحقق من مجلد الرسائل غير المرغوب فيها (Spam)</p>
                </div>

                <div className="flex justify-center py-2" dir="ltr">
                  <InputOTP maxLength={6} value={otpCode} onChange={(value) => setOtpCode(value)}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="h-12 w-10 sm:w-12 text-lg" />
                      <InputOTPSlot index={1} className="h-12 w-10 sm:w-12 text-lg" />
                      <InputOTPSlot index={2} className="h-12 w-10 sm:w-12 text-lg" />
                      <InputOTPSlot index={3} className="h-12 w-10 sm:w-12 text-lg" />
                      <InputOTPSlot index={4} className="h-12 w-10 sm:w-12 text-lg" />
                      <InputOTPSlot index={5} className="h-12 w-10 sm:w-12 text-lg" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold" disabled={loading || otpCode.length < 6}>
                  {loading ? <Loader2 className="animate-spin mr-2" /> : "تحقق وتفعيل الحساب"}
                </Button>

                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="text-sm gap-2" 
                    onClick={handleResendOtp}
                    disabled={loading || timer > 0}
                  >
                    {timer > 0 ? (
                      <span className="text-muted-foreground">إعادة الإرسال بعد {timer} ثانية</span>
                    ) : (
                      <>
                        <RefreshCcw size={16} />
                        <span>لم يصلك الرمز؟ إعادة الإرسال</span>
                      </>
                    )}
                  </Button>
                  
                  <Button type="button" variant="link" className="text-sm text-muted-foreground hover:text-primary" onClick={() => setShowOtp(false)}>
                    <ArrowRight size={14} className="ml-1" />
                    تغيير البريد الإلكتروني أو العودة
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
