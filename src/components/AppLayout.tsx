// src/services/api.ts
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- تسجيل الدخول ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    const { data: profile } = await supabase.from('profiles')
      .select('*, user_roles(role)')
      .eq('id', data.user.id)
      .maybeSingle();
      
    return { 
      session: data.session, 
      user: data.user, 
      profile: profile as UserProfile, 
      role: profile?.user_roles?.[0]?.role as UserRole 
    };
  },

  // --- نشر شحنة (مطابق لـ 16 عمود في DB) ---
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId,
      origin: loadData.origin,
      destination: loadData.destination,
      origin_lat: loadData.origin_lat || null,
      origin_lng: loadData.origin_lng || null,
      dest_lat: loadData.dest_lat || null,
      dest_lng: loadData.dest_lng || null,
      distance: loadData.distance || 0,
      weight: parseFloat(loadData.weight) || 0,
      price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size || null,
      body_type: loadData.body_type || 'flatbed',
      type: loadData.type || 'general',
      package_type: loadData.package_type || null,
      description: loadData.description || '',
      pickup_date: loadData.pickup_date || null,
      receiver_name: loadData.receiver_name || null,
      receiver_phone: loadData.receiver_phone || null,
      receiver_address: loadData.receiver_address || null,
      status: 'available'
    }]);
    if (error) throw error;
  },

  // --- جلب كل المستخدمين للأدمن (مع الروابط) ---
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*, user_roles(role)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- جلب كل الشحنات للأدمن ---
  async getAllLoads() {
    const { data, error } = await supabase
      .from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- جلب شحنات مستخدم معين (سائق أو تاجر) ---
  async getUserLoads(userId: string) {
    const { data, error } = await supabase
      .from('loads')
      .select('*, profiles:owner_id(full_name, phone)')
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // --- الإحصائيات الحقيقية للأدمن ---
  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: drivers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
    const { count: shippers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper');
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    
    return {
      totalUsers: users || 0,
      totalDrivers: drivers || 0,
      totalShippers: shippers || 0,
      activeLoads: active || 0,
      completedTrips: completed || 0
    };
  },

  // --- الإشعارات ---
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async markNotificationsAsRead(userId: string) {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId);
  }
};
