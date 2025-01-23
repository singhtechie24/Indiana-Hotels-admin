export type RoomType = 'standard' | 'deluxe' | 'suite';
export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance' | 'do-not-disturb';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded'
}

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  pricePerNight: number;
  status: RoomStatus;
  description: string;
  amenities: string[];
  images: string[];
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated?: Date;
  updatedBy?: string;
}

export interface Booking {
  id: string;
  userId: string;
  roomId: string;
  checkIn: Date;
  checkOut: Date;
  totalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  guests: number;
  guestName: string;
  email: string;
  phone: string;
  specialRequests?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'staff' | 'admin';
  status: 'active' | 'disabled';
  permissions?: {
    canViewUsers: boolean;
    canManageRooms: boolean;
    canManageBookings: boolean;
    canAccessSettings: boolean;
    canManageStaff: boolean;
  };
  createdAt?: Date;
  updatedAt?: Date;
  lastLogin?: Date;
}

export interface ServiceRequest {
  id: string;
  roomId: string;
  userId: string;
  type: 'housekeeping' | 'maintenance' | 'roomService';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignedTo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'booking_status_update' | 'service_request_update' | 'new_service_request';
  message: string;
  read: boolean;
  createdAt: Date;
  bookingId?: string;
  requestId?: string;
  status?: string;
} 