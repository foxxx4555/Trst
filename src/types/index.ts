export type UserRole = 'driver' | 'shipper' | 'admin';
export type LoadStatus = 'available' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
export type TruckType = 'trella' | 'lorry' | 'dyna' | 'pickup' | 'refrigerated' | 'tanker' | 'flatbed' | 'container';
export type BodyType = 'flatbed' | 'curtain' | 'box' | 'refrigerated' | 'lowboy' | 'tank';

export interface UserProfile {
  id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  user_roles?: { role: UserRole }[];
}

export interface Load {
  id: string;
  owner_id: string;
  driver_id?: string;
  origin: string;
  destination: string;
  origin_lat?: number;
  origin_lng?: number;
  dest_lat?: number;
  dest_lng?: number;
  driver_lat?: number;
  driver_lng?: number;
  weight: number;
  price: number;
  distance: number;
  status: LoadStatus;
  truck_size?: string;
  body_type?: BodyType;
  type?: string;
  package_type?: string;
  pickup_date?: string;
  receiver_name?: string;
  receiver_phone?: string;
  receiver_address?: string;
  description?: string;
  created_at: string;
  profiles?: UserProfile;
}

export interface AdminStats {
  totalUsers: number;
  totalDrivers: number;
  totalShippers: number;
  activeLoads: number;
  completedTrips: number;
}
