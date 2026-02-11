import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin } from 'lucide-react';
import { Load } from '@/types';

export default function ShipperLoads() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const [loads, setLoads] = useState<Load[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile?.id) {
      api.getUserLoads(userProfile.id).then(data => setLoads(data as Load[])).catch(console.error).finally(() => setLoading(false));
    }
  }, [userProfile]);

  const statusColors: Record<string, string> = {
    available: 'bg-accent/10 text-accent', pending: 'bg-secondary/10 text-secondary',
    in_progress: 'bg-primary/10 text-primary', completed: 'bg-accent/10 text-accent',
    cancelled: 'bg-destructive/10 text-destructive',
  };

  return (
    <AppLayout>
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" size={32} /></div>
        ) : loads.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">{t('no_data')}</div>
        ) : (
          loads.map(load => (
            <Card key={load.id}>
              <CardContent className="p-5">
                <div className="flex justify-between items-center mb-2">
                  <Badge className={statusColors[load.status]}>{t(load.status)}</Badge>
                  <span className="text-xs text-muted-foreground">{new Date(load.created_at).toLocaleDateString('ar')}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mb-2">
                  <MapPin size={14} className="text-primary" />
                  {load.origin} → {load.destination}
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>{load.weight} طن</span>
                  <span>{load.price} ر.س</span>
                  {load.receiver_name && <span>المستلم: {load.receiver_name}</span>}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppLayout>
  );
}
