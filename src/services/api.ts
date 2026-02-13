import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole, Truck, SubDriver } from '@/types';

export const api = {
  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    return { session: data.session, user: data.user, profile: profile as UserProfile, role: (roleData?.role || 'shipper') as UserRole };
  },

  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', data.user.id).maybeSingle();
    if (!roleData || roleData.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error("عذراً، هذا الحساب لا يملك صلاحيات المسؤول.");
    }
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
    return { profile: profile as UserProfile, role: 'admin' as UserRole };
  },

  async registerUser(email: string, password: string, metadata: any) {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: metadata.full_name, phone: metadata.phone } }
    });
    if (error) throw error;
    if (data.user) {
      await supabase.from('user_roles').insert([{ user_id: data.user.id, role: metadata.role }]);
      await supabase.from('profiles').insert([{ id: data.user.id, full_name: metadata.full_name, phone: metadata.phone, email }]);
    }
    return data;
  },

  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single();
    if (error) throw error;
    return data;
  },

  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0, price: parseFloat(loadData.price) || 0,
      body_type: loadData.body_type || 'flatbed', pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address, status: 'available'
    }]);
    if (error) throw error;
  },

  async getAvailableLoads() {
    const { data, error } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').eq('status', 'available').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async completeLoad(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'completed' }).eq('id', loadId);
    if (error) throw error;
  },

  async cancelLoadAssignment(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
    if (error) throw error;
  },

  async getNotifications(userId: string) {
    const { data, error } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    if (error) return [];
    return data || [];
  },

  async getDashboardStats() {
    return { active: 0, completed: 0, safety_rate: "100%" };
  },

  async getAllDrivers() {
    const { data, error } = await supabase.from('driver_details').select('*, profiles(full_name, phone, avatar_url)');
    if (error) throw error;
    return (data || []).map(d => ({ ...d, rating: d.rating || 5.0 })); // تقييم افتراضي 5
  },

  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 5.0 };
  },

  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');
    return { totalUsers: users || 0, totalDrivers: 0, totalShippers: 0, activeLoads: active || 0, completedTrips: completed || 0 };
  },

  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads').select('*, profiles:owner_id(full_name, phone)').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async uploadFile(path: string, file: File) {
    const { data, error } = await supabase.storage.from('documents').upload(path, file, { upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(data.path);
    return publicUrl;
  }
};
