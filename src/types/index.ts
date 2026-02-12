// src/types/index.ts

export type UserRole = 'driver' | 'shipper' | 'admin';
export type LoadStatus = 'available' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TruckType = 'trella' | 'lorry' | 'dyna' | 'pickup' | 'refrigerated' | 'tanker' | 'flatbed' | 'container';
export type BodyType = 'flatbed' | 'curtain' | 'box' | 'refrigerated' | 'lowboy' | 'tank';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  country_code?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // إضافة هذا السطر للوحة تحكم الأدمن
  user_roles?: { role: UserRole }[]; 
}

export interface Load {
  id: string;
  owner_id: string;
  driver_id?: string;
  type: string;
  package_type?: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  pickup_date?: string;
  weight: number;
  price: number;
  distance: number;
  estimated_time?: string;
  description?: string;
  truck_type_required?: TruckType;
  truck_size?: string;
  body_type?: BodyType;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  status: LoadStatus;
  created_at: string;
  updated_at: string;
  // هذا هو التعديل الأهم: إضافة بيانات صاحب الشحنة
  profiles?: { 
    full_name: string; 
    phone: string; 
    avatar_url?: string;
  }; 
}

// ... باقي الأنواع كما هي (Truck, SubDriver, etc)
export interface Truck {
  id: string;
  owner_id: string;
  plate_number: string;
  brand?: string;
  model_year?: string;
  truck_type?: TruckType;
  capacity?: string;
  created_at: string;
}

export interface SubDriver {
  id: string;
  carrier_id: string;
  driver_name: string;
  driver_phone?: string;
  id_number?: string;
  license_number?: string;
  assigned_truck_id?: string;
  created_at: string;
}

export interface LoadBid {
  id: string;
  load_id: string;
  driver_id: string;
  price: number;
  message?: string;
  status: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: string;
  priority: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  // إضافة بيانات المستخدم للتذكرة
  profiles?: { full_name: string; email: string }; 
}

export interface Product {
  id: string;
  owner_id: string;
  name: string;
  description?: string;
  type?: string;
  unit?: string;
  created_at: string;
}

export interface Receiver {
  id: string;
  owner_id: string;
  name: string;
  phone?: string;
  address?: string;
  created_at: string;
}

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  activeLoads: number;
  completedTrips: number;
}
