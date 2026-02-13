import { supabase } from '@/integrations/supabase/client';
import { UserProfile, AdminStats, UserRole } from '@/types';

export const api = {
  // دخول المستخدمين والأدمن
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*, user_roles(role)').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: profile?.user_roles?.[0]?.role as UserRole };
  },

  // جلب كل المستخدمين (أدمن فقط)
  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // جلب كل الشحنات (أدمن فقط)
  async getAllLoads() {
    const { data, error } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // نشر شحنة بكامل حقول قاعدة البيانات الـ 15
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId,
      origin: loadData.origin, destination: loadData.destination,
      origin_lat: loadData.origin_lat, origin_lng: loadData.origin_lng,
      dest_lat: loadData.dest_lat, dest_lng: loadData.dest_lng,
      weight: parseFloat(loadData.weight) || 0,
      price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size, body_type: loadData.body_type,
      type: loadData.type, package_type: loadData.package_type,
      description: loadData.description, pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address,
      status: 'available', distance: loadData.distance || 0
    }]);
    if (error) throw error;
  },

  // إحصائيات الأدمن الحقيقية
  async getAdminStats(): Promise<AdminStats> {
    const [{ count: u }, { count: d }, { count: s }, { count: al }, { count: ct }] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver'),
      supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper'),
      supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']),
      supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed')
    ]);
    return { totalUsers: u||0, totalDrivers: d||0, totalShippers: s||0, activeLoads: al||0, completedTrips: ct||0 };
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },

  async markNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  }
};
