import { supabase } from '@/integrations/supabase/client';
import { UserProfile, Load, AdminStats, UserRole } from '@/types';

export const api = {
  // ==========================================
  // Auth
  // ==========================================
  async registerUser(email: string, password: string, metadata: { full_name: string; phone: string; role: UserRole }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
        // emailRedirectTo ليس ضرورياً مع الـ OTP لكن لا يضر وجوده
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  },

  // --- دوال الرمز (OTP) الجديدة ---
  async verifyEmailOtp(email: string, token: string) {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    });
    if (error) throw error;
    return data;
  },

  async resendOtp(email: string) {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email
    });
    if (error) throw error;
  },
  // ---------------------------------

  async loginByEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .maybeSingle();

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    return { session: data.session, user: data.user, profile: profile as UserProfile, role: roleData?.role as UserRole };
  },

  async loginAdmin(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (roleData?.role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('ليس لديك صلاحيات الإدارة');
    }
    return { session: data.session, user: data.user, role: 'admin' as UserRole };
  },

  async forgotPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    if (error) throw error;
  },

  async logout() {
    await supabase.auth.signOut();
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) throw error;
    return data as UserProfile;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>) {
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
    if (error) throw error;
  },

  // ==========================================
  // Driver & Trucks
  // ==========================================
  async saveDriverDetails(userId: string, data: any) {
    const { error } = await supabase.from('driver_details').upsert({
      id: userId, truck_type: data.truck_type, body_type: data.body_type,
      dimensions: data.dimensions, plate_number: data.plate_number, is_available: true,
    });
    if (error) throw error;
  },

  async addTruck(truckData: any, userId: string) {
    const { error } = await supabase.from('trucks').insert([{
      owner_id: userId, plate_number: truckData.plate_number, brand: truckData.brand,
      model_year: truckData.model_year, truck_type: truckData.truck_type, capacity: truckData.capacity,
    }]);
    if (error) throw error;
  },

  async getTrucks(userId: string) {
    const { data, error } = await supabase.from('trucks').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteTruck(truckId: string) {
    const { error } = await supabase.from('trucks').delete().eq('id', truckId);
    if (error) throw error;
  },

  async addSubDriver(driverData: any, carrierId: string) {
    const { error } = await supabase.from('sub_drivers').insert([{
      carrier_id: carrierId, driver_name: driverData.driver_name,
      driver_phone: driverData.driver_phone, id_number: driverData.id_number,
      license_number: driverData.license_number,
    }]);
    if (error) throw error;
  },

  async getSubDrivers(carrierId: string) {
    const { data, error } = await supabase.from('sub_drivers').select('*').eq('carrier_id', carrierId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteSubDriver(id: string) {
    const { error } = await supabase.from('sub_drivers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // Loads
  // ==========================================
  async postLoad(loadData: any, userId: string) {
    const { error } = await supabase.from('loads').insert([{
      owner_id: userId, origin: loadData.origin, destination: loadData.destination,
      weight: parseFloat(loadData.weight) || 0, price: parseFloat(loadData.price) || 0,
      truck_size: loadData.truck_size, body_type: loadData.body_type,
      description: loadData.description || '', type: loadData.type || 'general',
      package_type: loadData.package_type, pickup_date: loadData.pickup_date,
      receiver_name: loadData.receiver_name, receiver_phone: loadData.receiver_phone,
      receiver_address: loadData.receiver_address, status: 'available',
    }]);
    if (error) throw error;
  },

  async getAvailableLoads() {
    const { data, error } = await supabase.from('loads').select('*')
      .eq('status', 'available').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getLoadById(id: string) {
    const { data, error } = await supabase.from('loads').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },

  async getUserLoads(userId: string) {
    const { data, error } = await supabase.from('loads').select('*')
      .or(`owner_id.eq.${userId},driver_id.eq.${userId}`).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async acceptLoad(loadId: string, driverId: string) {
    const { error } = await supabase.from('loads').update({ status: 'in_progress', driver_id: driverId }).eq('id', loadId);
    if (error) throw error;
  },

  async updateLoadStatus(loadId: string, status: 'available' | 'pending' | 'in_progress' | 'completed' | 'cancelled') {
    const { error } = await supabase.from('loads').update({ status }).eq('id', loadId);
    if (error) throw error;
  },

  async cancelLoad(loadId: string) {
    const { error } = await supabase.from('loads').update({ status: 'available', driver_id: null }).eq('id', loadId);
    if (error) throw error;
  },

  // ==========================================
  // Bids
  // ==========================================
  async submitBid(loadId: string, driverId: string, price: number, message?: string) {
    const { error } = await supabase.from('load_bids').insert([{ load_id: loadId, driver_id: driverId, price, message }]);
    if (error) throw error;
  },

  async getLoadBids(loadId: string) {
    const { data, error } = await supabase.from('load_bids').select('*').eq('load_id', loadId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ==========================================
  // Products & Receivers (Shipper)
  // ==========================================
  async addProduct(product: any, userId: string) {
    const { error } = await supabase.from('products').insert([{ ...product, owner_id: userId }]);
    if (error) throw error;
  },

  async getProducts(userId: string) {
    const { data, error } = await supabase.from('products').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async addReceiver(receiver: any, userId: string) {
    const { error } = await supabase.from('receivers').insert([{ ...receiver, owner_id: userId }]);
    if (error) throw error;
  },

  async getReceivers(userId: string) {
    const { data, error } = await supabase.from('receivers').select('*').eq('owner_id', userId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async deleteReceiver(id: string) {
    const { error } = await supabase.from('receivers').delete().eq('id', id);
    if (error) throw error;
  },

  // ==========================================
  // Admin
  // ==========================================
  async getAdminStats(): Promise<AdminStats> {
    const { count: users } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: drivers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'driver');
    const { count: shippers } = await supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'shipper');
    const { count: activeLoads } = await supabase.from('loads').select('*', { count: 'exact', head: true }).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true }).eq('status', 'completed');

    return {
      totalUsers: users || 0,
      totalDrivers: drivers || 0,
      totalShippers: shippers || 0,
      activeLoads: activeLoads || 0,
      completedTrips: completed || 0,
    };
  },

  async getAllUsers() {
    const { data, error } = await supabase.from('profiles').select('*, user_roles(role)').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getAllLoads() {
    const { data, error } = await supabase.from('loads').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getTickets() {
    const { data, error } = await supabase.from('support_tickets').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createTicket(userId: string, subject: string, message: string) {
    const { error } = await supabase.from('support_tickets').insert([{ user_id: userId, subject, message }]);
    if (error) throw error;
  },

  // ==========================================
  // Stats
  // ==========================================
  async getDriverStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true })
      .eq('driver_id', userId).eq('status', 'in_progress');
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true })
      .eq('driver_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0, rating: 4.8 };
  },

  async getShipperStats(userId: string) {
    const { count: active } = await supabase.from('loads').select('*', { count: 'exact', head: true })
      .eq('owner_id', userId).in('status', ['available', 'in_progress']);
    const { count: completed } = await supabase.from('loads').select('*', { count: 'exact', head: true })
      .eq('owner_id', userId).eq('status', 'completed');
    return { activeLoads: active || 0, completedTrips: completed || 0 };
  },
};
