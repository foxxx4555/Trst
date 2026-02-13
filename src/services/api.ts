import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- نظام الإشعارات ---
  async sendNotification(userId: string, title: string, message: string) {
    try {
      await supabase.from('notifications').insert([{
        user_id: userId,
        title,
        message,
        is_read: false
      }]);
    } catch (e) { console.error("Notification Error:", e); }
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);
    return data || [];
  },

  // --- المصادقة والبروفايل ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.user) throw new Error("فشل في استرداد بيانات المستخدم");

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    
    return { 
      profile: (profile || { id: data.user.id, full_name: 'مستخدم جديد' }) as UserProfile, 
      role: (roleData?.role || 'shipper') as UserRole 
    };
  },

  async registerUser(email: string, password: string, metadata: { full_name: string, phone: string, role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: metadata.full_name, phone: metadata.phone } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_roles').insert([{ user_id: data.user.id, role: metadata.role }]);
      await supabase.from('profiles').insert([{ 
        id: data.user.id, full_name: metadata.full_name, phone: metadata.phone, email: email 
      }]);
    }
    return data;
  },

  // --- إدارة الحمولات (سائق) ---
  async acceptLoad(loadId: string, driverId: string, shipperId: string, driverName: string, driverPhone: string) {
    const { error } = await supabase.from('loads').update({ 
      status: 'in_progress', 
      driver_id: driverId 
    }).eq('id', loadId);
    if (error) throw error;
    await this.sendNotification(shipperId, "تم قبول شحنتك 🚚", `الناقل ${driverName} قبل طلبك. للتواصل: ${driverPhone}`);
  },

  async completeLoad(loadId: string, shipperId: string, driverName: string) {
    const timeNow = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
    await this.sendNotification(shipperId, "وصلت الشحنة ✅", `قام الناقل ${driverName} بالتسليم الساعة ${timeNow}. يرجى تقييم الخدمة.`);
  },

  async cancelLoadAssignment(loadId: string) {
    await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
  },

  // --- نظام التقييم والدعم ---
  async submitRating(driverId: string, loadId: string, rating: number, comment: string) {
    await supabase.from('ratings').insert([{ rated_user: driverId, load_id: loadId, rating, comment }]);
  },

  async createTicket(userId: string, subject: string, message: string) {
    await supabase.from('support_tickets').insert([{ user_id: userId, subject, message, status: 'open' }]);
  },

  // --- جلب البيانات ---
  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone, id)').eq('status', 'available').is('driver_id', null);
    return data || [];
  },

  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data || [];
  },

  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight), price: parseFloat(loadData.price),
      pickup_date: loadData.pickup_date, receiver_name: loadData.receiver_name,
      receiver_phone: loadData.receiver_phone, receiver_address: loadData.receiver_address,
      status: 'available'
    }]);
    if (error) throw error;
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
  }
};
