import React, { useState, useEffect } from 'react';
import { Room, RoomType } from '../types/shared';
import { RoomFilters } from '../components/RoomFilters';
import { getRooms } from '../services/roomService';

export const SearchScreen: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<RoomType | null>(null);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [capacity, setCapacity] = useState(1);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        const fetchedRooms = await getRooms();
        setRooms(fetchedRooms);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const filteredRooms = rooms.filter((room) => {
    if (selectedType && room.type !== selectedType) return false;
    if (room.pricePerNight < minPrice || room.pricePerNight > maxPrice) return false;
    if (room.capacity < capacity) return false;
    return true;
  });

  const handleRoomPress = (roomId: string) => {
    // Handle room selection
    console.log('Selected room:', roomId);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Search Rooms</h1>
      
      <RoomFilters
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        minPrice={minPrice}
        maxPrice={maxPrice}
        capacity={capacity}
        onPriceChange={(min, max) => {
          setMinPrice(min);
          setMaxPrice(max);
        }}
        onCapacityChange={setCapacity}
      />

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 py-4">{error}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          {filteredRooms.map((room) => (
            <div
              key={room.id}
              onClick={() => handleRoomPress(room.id)}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
            >
              {room.images[0] && (
                <img
                  src={room.images[0]}
                  alt={room.name}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-4">
                <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                <p className="text-gray-600 mb-2">{room.type}</p>
                <p className="text-gray-800 font-medium">
                  ${room.pricePerNight} / night
                </p>
                <p className="text-gray-600">
                  Capacity: {room.capacity} {room.capacity === 1 ? 'person' : 'people'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 