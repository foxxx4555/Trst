import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Truck, Package, CheckCircle, Star, Bell, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

// تعريف أنواع البيانات
interface DriverStats {
  activeLoads: number;
  completedTrips: number;
  rating: number;
}

interface NewLoad {
  id: string;
  title: string;
  weight: string;
  from: string;
  to: string;
  price: string;
  urgent?: boolean;
}

export default function DriverDashboard() {
  const { t } = useTranslation();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DriverStats>({ activeLoads: 0, completedTrips: 0, rating: 0 });
  const [loading, setLoading] = useState(true);
  const [newLoads, setNewLoads] = useState<NewLoad[]>([]);
  const [showAlert, setShowAlert] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  // جلب الإحصائيات
  const fetchStats = async () => {
    if (!userProfile?.id) return;
    try {
      const data = await api.getDriverStats(userProfile.id);
      setStats(data);
    } catch (e) {
      console.error("Failed to fetch stats:", e);
    } finally {
      setLoading(false);
    }
  };

  // تهيئة الاتصال بالـ WebSocket للحمولات الجديدة
  const initSocket = () => {
    const ws = new WebSocket('wss://your-server.com/ws/loads');
    
    ws.onopen = () => {
      console.log("Connected to loads socket");
      // إرسال معرف الناقل للخادم لتصفية الحمولات المناسبة
      if (userProfile?.id) {
        ws.send(JSON.stringify({ driverId: userProfile.id }));
      }
    };

    ws.onmessage = (event) => {
      const newLoad = JSON.parse(event.data);
      setNewLoads(prev => [newLoad, ...prev]);
      setShowAlert(true);
      setTimeout(() => setShowAlert(false), 5000);
    };

    ws.onclose = () => {
      console.log("Socket closed, reconnecting...");
      setTimeout(initSocket, 3000); // إعادة الاتصال بعد 3 ثوانٍ
    };

    setSocket(ws);
  };

  // تهيئة البيانات والاتصال بالـ WebSocket
  useEffect(() => {
    fetchStats();
    initSocket();
    
    return () => {
      if (socket) socket.close();
    };
  }, [userProfile]);

  // حالة عدم وجود مستخدم
  if (!userProfile) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto p-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-4" />
          <h3 className="text-xl font-bold mb-2">{t('profile_not_found')}</h3>
          <Button onClick={() => navigate('/auth/login')}>{t('login')}</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* إشعار حمولة جديدة فوري */}
        {showAlert && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50"
          >
            <p className="font-bold flex items-center gap-2">
              <Package /> {t('new_load_available')}
            </p>
          </motion.div>
        )}

        {/* قسم الترحيب */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">{t('welcome_back')}, {userProfile.full_name.split(' ')[0]}!</h1>
          <p className="text-gray-600">{t('dashboard_subtitle')}</p>
        </motion.div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 rounded-xl shadow"
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('active_loads')}</h3>
            <p className="text-3xl font-bold">{stats.activeLoads}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow"
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('completed_trips')}</h3>
            <p className="text-3xl font-bold">{stats.completedTrips}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow"
          >
            <h3 className="text-lg font-semibold text-gray-700 mb-2">{t('rating')}</h3>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(i < Math.floor(stats.rating) ? "text-amber-500 fill-amber-500" : "text-gray-300")}
                  size={24}
                />
              ))}
              <span className="ml-2 text-lg font-bold">{stats.rating.toFixed(1)}</span>
            </div>
          </motion.div>
        </div>

        {/* حمولات جديدة */}
        <Card className="mb-8">
          <div className="bg-gray-900 text-white p-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Package /> {t('new_loads')}
            </h2>
          </div>
          <CardContent className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
              </div>
            ) : (
              <>
                {newLoads.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4">
                    {newLoads.map((load) => (
                      <motion.div
                        key={load.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-bold">{load.title}</h4>
                          {load.urgent && <Badge variant="destructive">{t('urgent')}</Badge>}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1"><MapPin size={16} /> {load.from}</span>
                          <span className="text-gray-400">→</span>
                          <span className="flex items-center gap-1"><MapPin size={16} /> {load.to}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg">{load.price}</span>
                          <Button onClick={() => navigate(`/load/${load.id}`)}>{t('view_details')}</Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">{t('no_new_loads')}</p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* زر تصفح الحمولات */}
        <Button
          className="w-full py-6 bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg rounded-xl"
          onClick={() => navigate('/driver/loads')}
        >
          <Truck className="mr-2" /> {t('browse_all_loads')}
        </Button>
      </div>
    </AppLayout>
  );
}
