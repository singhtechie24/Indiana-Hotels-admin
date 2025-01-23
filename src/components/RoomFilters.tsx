import React from 'react';
import { RoomType } from '../types/shared';

interface RoomFiltersProps {
  selectedType: RoomType | null;
  onTypeChange: (type: RoomType | null) => void;
  minPrice: number;
  maxPrice: number;
  capacity: number;
  onPriceChange: (min: number, max: number) => void;
  onCapacityChange: (capacity: number) => void;
}

export const RoomFilters: React.FC<RoomFiltersProps> = ({
  selectedType,
  onTypeChange,
  minPrice,
  maxPrice,
  capacity,
  onPriceChange,
  onCapacityChange
}) => {
  const roomTypes: RoomType[] = ['standard', 'deluxe', 'suite'];

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium mb-2">Room Type</h3>
          <div className="flex gap-2">
            {roomTypes.map((type) => (
              <button
                key={type}
                onClick={() => onTypeChange(selectedType === type ? null : type)}
                className={`px-4 py-2 rounded-md ${
                  selectedType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Price Range</h3>
          <div className="flex gap-4">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => onPriceChange(Number(e.target.value), maxPrice)}
              placeholder="Min Price"
              className="w-full px-3 py-2 border rounded-md"
            />
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => onPriceChange(minPrice, Number(e.target.value))}
              placeholder="Max Price"
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium mb-2">Capacity</h3>
          <input
            type="number"
            value={capacity}
            onChange={(e) => onCapacityChange(Number(e.target.value))}
            min={1}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  );
}; 