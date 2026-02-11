import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
      toast.success(t('check_email'));
    } catch (err: any) {
      toast.error(err.message || t('error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">{t('reset_password')}</h1>
          <p className="text-muted-foreground mt-2">{t('reset_password_desc')}</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardContent className="p-6">
            {sent ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-accent">{t('check_email')}</p>
                <Link to="/login" className="text-primary hover:underline mt-4 block">{t('login')}</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>{t('email')}</Label>
                  <Input type="email" value={email} onChange={e => setEmail(e.target.value)} required dir="ltr" className="mt-1" />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : t('send_reset_link')}
                </Button>
                <Link to="/login" className="text-sm text-primary hover:underline flex items-center gap-1 justify-center">
                  <ArrowRight size={14} /> {t('login')}
                </Link>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
