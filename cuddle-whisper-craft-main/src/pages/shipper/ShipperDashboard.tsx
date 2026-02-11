import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Package, CheckCircle, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function ShipperDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeLoads: 0, completedTrips: 0 });

  useEffect(() => {
    if (userProfile?.id) {
      api.getShipperStats(userProfile.id).then(setStats).catch(console.error);
    }
  }, [userProfile]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t('welcome')}، {userProfile?.full_name}</h1>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<Package size={24} />} color="primary" />
          <StatCard title={t('completed_trips')} value={stats.completedTrips} icon={<CheckCircle size={24} />} color="accent" />
        </div>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/shipper/post')}>
          <CardContent className="flex items-center gap-4 p-6">
            <div className="p-3 rounded-xl bg-primary/10"><Plus size={28} className="text-primary" /></div>
            <div>
              <p className="font-semibold">{t('post_load')}</p>
              <p className="text-sm text-muted-foreground">أنشئ شحنة جديدة وابحث عن ناقل</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
