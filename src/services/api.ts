import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // --- الإشعارات ---
  async sendNotification(userId: string, title: string, message: string) {
    try {
      await supabase.from('notifications').insert([{
        user_id: userId, title, message, is_read: false
      }]);
    } catch (e) { console.error(e); }
  },

  async getNotifications(userId: string) {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    return data || [];
  },

  // --- المصادقة ---
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    if (!data?.user) throw new Error("فشل الدخول");
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    return { profile: (profile || { id: data.user.id, full_name: 'مستخدم جديد' }) as UserProfile, role: (roleData?.role || 'shipper') as UserRole };
  },

  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    if (roleData?.role !== 'admin') { await supabase.auth.signOut(); throw new Error("صلاحيات غير كافية"); }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return { profile: (profile || { full_name: 'مدير' }) as UserProfile, role: 'admin' as UserRole };
  },

  async registerUser(email: string, password: string, metadata: { full_name: string, phone: string, role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: metadata.full_name, phone: metadata.phone } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_roles').insert([{ user_id: data.user.id, role: metadata.role }]);
      await supabase.from('profiles').insert([{ id: data.user.id, full_name: metadata.full_name, phone: metadata.phone, email }]);
    }
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    await supabase.from('profiles').update(updates).eq('id', userId);
  },

  // --- الحمولات والمهام ---
  async acceptLoad(loadId: string, driverId: string, shipperId: string, driverName: string, driverPhone: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
    await this.sendNotification(shipperId, "تم قبول طلبك 🚚", `الناقل ${driverName} بدأ الآن. للتواصل: ${driverPhone}`);
  },

  async completeLoad(loadId: string, shipperId: string, driverName: string) {
    const timeNow = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
    await this.sendNotification(shipperId, "وصلت الشحنة ✅", `قام ${driverName} بتسليم الشحنة الساعة ${timeNow}. يرجى التقييم.`);
  },

  async cancelLoadAssignment(loadId: string) {
    await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
  },

  async getUserLoads(userId: string) {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    return data || [];
  },

  async getAvailableLoads() {
    const { data } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone, id)').eq('status', 'available').is('driver_id', null).order('created_at', { ascending: false });
    return data || [];
  },

  // --- الإحصائيات (Stat Functions) ---
  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 5.0 };
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: u } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: l } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    return { totalUsers: u || 0, totalDrivers: 0, totalShippers: 0, activeLoads: l || 0, completedTrips: 0 };
  },

  async submitRating(driverId: string, loadId: string, rating: number, comment: string) {
    await supabase.from('ratings').insert([{ rated_user: driverId, load_id: loadId, rating, comment }]);
  },

  async getTickets() {
    const { data } = await supabase.from('support_tickets').select('*, profiles(full_name)').order('created_at', { ascending: false });
    return data || [];
  },

  async uploadFile(path: string, file: File) {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    return supabase.storage.from('documents').getPublicUrl(data.path).data.publicUrl;
  }
};
