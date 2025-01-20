import React, { useState } from 'react';

const RoomForm = ({ initialData, onSubmit, isLoading }: RoomFormProps) => {
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.images || []);
  
  const handleImageDelete = (imageToDelete: string) => {
    setExistingImages(prev => prev.filter(img => img !== imageToDelete));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ... existing validation ...

    const formData = {
      ...values,
      images: [...existingImages, ...uploadedImageUrls],
      // ... rest of the form data
    };

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ... existing form fields ... */}
      
      {/* Existing Images */}
      {existingImages.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Images
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Room image ${index + 1}`}
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => handleImageDelete(image)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Image Upload */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Add New Images
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary-dark"
        />
      </div>

      {/* ... rest of the form ... */}
    </form>
  );
};

export default RoomForm; 