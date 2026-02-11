import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { Users, Package, Truck, CheckCircle } from 'lucide-react';
import { AdminStats } from '@/types';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState<AdminStats>({ totalUsers: 0, totalDrivers: 0, totalShippers: 0, activeLoads: 0, completedTrips: 0 });

  useEffect(() => {
    api.getAdminStats().then(setStats).catch(console.error);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{t('dashboard')}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title={t('total_users')} value={stats.totalUsers} icon={<Users size={24} />} color="primary" />
          <StatCard title={t('total_drivers')} value={stats.totalDrivers} icon={<Truck size={24} />} color="accent" />
          <StatCard title={t('total_shippers')} value={stats.totalShippers} icon={<Package size={24} />} color="secondary" />
          <StatCard title={t('active_loads')} value={stats.activeLoads} icon={<CheckCircle size={24} />} color="destructive" />
        </div>
      </div>
    </AppLayout>
  );
}
