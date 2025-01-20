import {
  WifiIcon,
  TvIcon,
  HomeIcon,
  SparklesIcon,
  BeakerIcon,
  CakeIcon,
  KeyIcon,
  ShieldCheckIcon,
  PhoneIcon,
  ComputerDesktopIcon,
  BoltIcon,
  FireIcon,
} from '@heroicons/react/24/outline';

export interface Amenity {
  id: string;
  name: string;
  category: 'basic' | 'comfort' | 'luxury' | 'safety';
  icon: typeof WifiIcon;
}

export const amenityCategories = {
  basic: 'Basic Amenities',
  comfort: 'Comfort & Entertainment',
  luxury: 'Luxury Features',
  safety: 'Safety & Security'
};

export const predefinedAmenities: Amenity[] = [
  // Basic Amenities
  { id: 'wifi', name: 'Free Wi-Fi', category: 'basic', icon: WifiIcon },
  { id: 'tv', name: 'Smart TV', category: 'basic', icon: TvIcon },
  { id: 'ac', name: 'Air Conditioning', category: 'basic', icon: SparklesIcon },
  { id: 'heating', name: 'Heating', category: 'basic', icon: FireIcon },
  { id: 'workspace', name: 'Work Desk', category: 'basic', icon: ComputerDesktopIcon },

  // Comfort & Entertainment
  { id: 'minibar', name: 'Mini Bar', category: 'comfort', icon: BeakerIcon },
  { id: 'kitchen', name: 'Kitchenette', category: 'comfort', icon: CakeIcon },
  { id: 'living_room', name: 'Living Area', category: 'comfort', icon: HomeIcon },
  
  // Luxury Features
  { id: 'room_service', name: '24/7 Room Service', category: 'luxury', icon: PhoneIcon },
  { id: 'premium_view', name: 'Premium View', category: 'luxury', icon: SparklesIcon },
  
  // Safety & Security
  { id: 'safe', name: 'In-room Safe', category: 'safety', icon: ShieldCheckIcon },
  { id: 'keycard', name: 'Digital Key Card', category: 'safety', icon: KeyIcon },
  { id: 'backup_power', name: 'Backup Power', category: 'safety', icon: BoltIcon },
];

export const getAmenityById = (id: string): Amenity | undefined => {
  return predefinedAmenities.find(amenity => amenity.id === id);
};

export const getAmenitiesByCategory = (category: keyof typeof amenityCategories): Amenity[] => {
  return predefinedAmenities.filter(amenity => amenity.category === category);
}; 