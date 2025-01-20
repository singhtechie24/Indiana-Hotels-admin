import React from 'react';
import { predefinedAmenities, amenityCategories } from '../utils/amenities';

interface AmenitiesSelectorProps {
  selectedAmenityIds: string[];
  onChange: (amenityIds: string[]) => void;
}

export const AmenitiesSelector: React.FC<AmenitiesSelectorProps> = ({
  selectedAmenityIds,
  onChange,
}) => {
  const handleToggleAmenity = (amenityId: string) => {
    const newSelectedIds = selectedAmenityIds.includes(amenityId)
      ? selectedAmenityIds.filter(id => id !== amenityId)
      : [...selectedAmenityIds, amenityId];
    onChange(newSelectedIds);
  };

  const categories = Object.entries(amenityCategories);

  return (
    <div className="space-y-4">
      {categories.map(([category, categoryName]) => (
        <div key={category} className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">{categoryName}</h4>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {predefinedAmenities
              .filter(amenity => amenity.category === category)
              .map(amenity => {
                const Icon = amenity.icon;
                const isSelected = selectedAmenityIds.includes(amenity.id);

                return (
                  <button
                    key={amenity.id}
                    type="button"
                    onClick={() => handleToggleAmenity(amenity.id)}
                    className={`
                      flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium w-full
                      ${
                        isSelected
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-white text-gray-900 border-gray-200 hover:bg-gray-50'
                      }
                      border transition-colors duration-200
                    `}
                  >
                    <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                    <span className="text-left">{amenity.name}</span>
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}; 