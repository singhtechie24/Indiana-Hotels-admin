export type RoomType = 'standard' | 'deluxe' | 'suite';

export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'do-not-disturb';

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  price: number;
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