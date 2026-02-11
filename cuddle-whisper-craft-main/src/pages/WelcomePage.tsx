import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WelcomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-primary p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center text-white max-w-md"
      >
        <div className="mb-8">
          <img src="/logo.png" alt="SAS Transport" className="w-24 h-24 mx-auto rounded-2xl shadow-2xl mb-6" />
          <h1 className="text-4xl font-black mb-2">{t('welcome_title')}</h1>
          <p className="text-xl font-medium opacity-90">{t('welcome_subtitle')}</p>
          <p className="text-sm opacity-70 mt-3">{t('welcome_desc')}</p>
        </div>

        <div className="space-y-3 w-full">
          <Button
            onClick={() => navigate('/login')}
            className="w-full h-14 text-lg font-bold bg-white text-primary hover:bg-white/90 rounded-2xl"
          >
            {t('login')}
          </Button>
          <Button
            onClick={() => navigate('/register')}
            variant="outline"
            className="w-full h-14 text-lg font-bold border-2 border-white/30 text-white bg-white/10 hover:bg-white/20 rounded-2xl"
          >
            {t('register')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
