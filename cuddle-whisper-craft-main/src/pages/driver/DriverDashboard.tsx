import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Star, Truck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0, rating: 0 });

  useEffect(() => {
    if (userProfile?.id) {
      api.getDriverStats(userProfile.id).then(setStats).catch(console.error);
    }
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}، {userProfile?.full_name}</h1>
          <p className="text-muted-foreground">{t('dashboard')}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
          <StatCard title={t('rating')} value={stats.rating} icon={<Star size={24} />} color="secondary" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/driver/loads')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-primary/10"><Package size={28} className="text-primary" /></div>
              <div>
                <p className="font-semibold">{t('available_loads')}</p>
                <p className="text-sm text-muted-foreground">تصفح الشحنات المتاحة وقدم عروضك</p>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/driver/trucks')}>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="p-3 rounded-xl bg-accent/10"><Truck size={28} className="text-accent" /></div>
              <div>
                <p className="font-semibold">{t('my_trucks')}</p>
                <p className="text-sm text-muted-foreground">إدارة شاحناتك وسائقيك</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
