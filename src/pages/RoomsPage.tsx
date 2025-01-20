import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { PencilIcon, TrashIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { roomService } from '../services/roomService';
import { bookingService, Booking } from '../services/bookingService';
import { maintenanceService, Maintenance } from '../services/maintenanceService';
import { Room } from '../types/room';
import { RoomCalendar } from '../components/RoomCalendar';
import { BookingModal } from '../components/BookingModal';
import { MaintenanceModal, MaintenanceData } from '../components/MaintenanceModal';
import { AmenitiesSelector } from '../components/AmenitiesSelector';
import { getAmenityById } from '../utils/amenities';
import { cleanupData } from '../utils/cleanupData';

interface RoomFormData extends Omit<Room, 'id' | 'createdAt' | 'updatedAt'> {
  images: string[];
}

export const RoomsPage = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [formData, setFormData] = useState<RoomFormData>({
    number: '',
    type: 'standard',
    status: 'available',
    price: 0,
    capacity: 1,
    description: '',
    amenities: [],
    images: []
  });
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [selectedRoomForCalendar, setSelectedRoomForCalendar] = useState<Room | null>(null);
  const [roomBookings, setRoomBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);
  const [maintenanceList, setMaintenanceList] = useState<Maintenance[]>([]);
  const [selectedDates, setSelectedDates] = useState<{ start: Date; end: Date } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  useEffect(() => {
    console.log('Setting up real-time listeners...');
    setLoading(true);

    // Subscribe to rooms updates
    const unsubscribeRooms = roomService.subscribeToRooms(
      (updatedRooms) => {
        console.log('Received real-time room update:', updatedRooms);
        setRooms(updatedRooms);
        setLoading(false);
      },
      (error) => {
        console.error('Error in room subscription:', error);
        setLoading(false);
      }
    );

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('Cleaning up room subscriptions...');
      unsubscribeRooms();
    };
  }, []); // Empty dependency array means this runs once on mount

  console.log('Current rooms state:', rooms);
  console.log('Current loading state:', loading);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(prev => [...prev, ...files]);
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrls(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setImagePreviewUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeleteImage = async (imageUrl: string) => {
    try {
      // Delete from Firebase Storage
      await roomService.deleteRoomImage(imageUrl);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        images: prev.images.filter(img => img !== imageUrl)
      }));

      // Show success message
      toast.success('Image deleted successfully');
    } catch (error) {
      console.error('Error deleting image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // First, upload any new images
      let uploadedImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        if (selectedRoom) {
          uploadedImageUrls = await roomService.uploadMultipleRoomImages(selectedFiles, selectedRoom.id);
        } else {
          // Create a temporary ID for new room images
          const tempId = Math.random().toString(36).substring(7);
          uploadedImageUrls = await roomService.uploadMultipleRoomImages(selectedFiles, tempId);
        }
      }

      // Combine existing and new image URLs
      const allImages = [...(formData.images || []), ...uploadedImageUrls];

      const updatedFormData = {
        ...formData,
        images: allImages,
      };

      if (selectedRoom) {
        await roomService.updateRoom(selectedRoom.id, updatedFormData);
        // Update room images separately to handle deletions
        await roomService.updateRoomImages(selectedRoom.id, allImages);
        toast.success('Room updated successfully');
      } else {
        const newRoomId = await roomService.createRoom(updatedFormData);
        // If this was a new room, move images from temp location if needed
        if (uploadedImageUrls.length > 0) {
          await roomService.updateRoomImages(newRoomId, allImages);
        }
        toast.success('Room created successfully');
      }

      // Reset the form
      handleCloseModal();
    } catch (error) {
      console.error('Error saving room:', error);
      toast.error('Failed to save room');
    }
  };

  const handleEdit = (room: Room) => {
    setSelectedRoom(room);
    setFormData({
      number: room.number,
      type: room.type,
      price: room.price,
      status: room.status,
      description: room.description || '',
      amenities: room.amenities || [],
      images: room.images || [],
      capacity: room.capacity || 2,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        const room = await roomService.getRoomById(id);
        if (room?.images?.length) {
          await roomService.deleteMultipleImages(room.images);
        }
        await roomService.deleteRoom(id);
      } catch (error) {
        console.error('Error deleting room:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      number: '',
      type: 'standard',
      price: 0,
      status: 'available',
      description: '',
      amenities: [],
      images: [],
      capacity: 1,
    });
    setImagePreviewUrls([]);
  };

  const handleAddNew = () => {
    setSelectedRoom(null);
    resetForm();
    setIsModalOpen(true);
  };

  const fetchRoomBookings = async (roomId: string) => {
    try {
      const bookings = await bookingService.getBookingsByRoom(roomId);
      setRoomBookings(bookings);
    } catch (error) {
      console.error('Error fetching room bookings:', error);
    }
  };

  const handleBookingClick = (booking: Booking) => {
    setSelectedBooking(booking);
    setBookingModalOpen(true);
  };

  const handleDateSelect = (start: Date, end: Date) => {
    setSelectedDates({ start, end });
    setBookingModalOpen(true);
  };

  const handleSaveBooking = async (bookingData: Partial<Booking>) => {
    try {
      if (selectedBooking) {
        await bookingService.updateBooking(selectedBooking.id, bookingData);
      } else {
        await bookingService.createBooking(bookingData as Omit<Booking, 'id'>);
      }
      await fetchRoomBookings(selectedRoomForCalendar?.id || '');
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const fetchRoomMaintenance = async (roomId: string) => {
    try {
      const maintenance = await maintenanceService.getMaintenanceByRoom(roomId);
      setMaintenanceList(maintenance);
    } catch (error) {
      console.error('Error fetching room maintenance:', error);
    }
  };

  const handleViewCalendar = (room: Room) => {
    setSelectedRoomForCalendar(room);
    setViewMode('calendar');
    fetchRoomBookings(room.id);
    fetchRoomMaintenance(room.id);
  };

  const handleScheduleMaintenance = async (data: MaintenanceData) => {
    if (!selectedRoomForCalendar) return;

    try {
      await maintenanceService.createMaintenance({
        ...data,
        roomId: selectedRoomForCalendar.id,
        status: 'scheduled',
      });

      // Update room status to maintenance
      await roomService.updateRoom(selectedRoomForCalendar.id, {
        status: 'maintenance',
      });

      // Refresh data using subscription
      await maintenanceService.getMaintenanceByRoom(selectedRoomForCalendar.id)
        .then(setMaintenanceList)
        .catch(console.error);
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Failed to schedule maintenance');
    }
  };

  const handleCleanup = async () => {
    if (window.confirm('Are you sure you want to delete all rooms and data? This action cannot be undone.')) {
      try {
        await cleanupData();
        alert('All data has been cleaned up successfully!');
      } catch (error) {
        console.error('Error during cleanup:', error);
        alert('Error during cleanup. Check console for details.');
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
    resetForm();
    setSelectedFiles([]);
    setImagePreviewUrls([]);
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-2xl font-semibold leading-6 text-gray-900">
          {viewMode === 'list' ? 'Rooms Management' : `Calendar: ${selectedRoomForCalendar?.number}`}
        </h3>
        <div className="mt-3 sm:mt-0 sm:ml-4 space-x-4">
          {viewMode === 'list' ? (
            <>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleAddNew}
              >
                Add New Room
              </button>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleCleanup}
              >
                Clean All Data
              </button>
            </>
          ) : (
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={() => setViewMode('list')}
            >
              Back to List
            </button>
          )}
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <p className="text-gray-500">Loading rooms...</p>
          </div>
        ) : viewMode === 'list' ? (
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room Number
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Capacity
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amenities
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Calendar</span>
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {rooms.map((room) => {
                        console.log('Rendering room:', room);
                        return (
                          <tr key={room.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {room.number || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                              {room.type || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                room.status === 'available' ? 'bg-green-100 text-green-800' :
                                room.status === 'occupied' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {room.status || 'N/A'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              £{room.price || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {room.capacity || 1} persons
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <div className="flex flex-wrap gap-1">
                                {room.amenities.slice(0, 3).map(amenityId => {
                                  const amenity = getAmenityById(amenityId);
                                  return amenity ? (
                                    <span
                                      key={amenityId}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                                    >
                                      {amenity.name}
                                    </span>
                                  ) : null;
                                })}
                                {room.amenities.length > 3 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                    +{room.amenities.length - 3} more
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleViewCalendar(room)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                View Calendar
                              </button>
                              <button
                                onClick={() => handleEdit(room)}
                                className="text-blue-600 hover:text-blue-900 mr-4"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(room.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          selectedRoomForCalendar && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setMaintenanceModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  Schedule Maintenance
                </button>
              </div>
              <RoomCalendar
                room={selectedRoomForCalendar}
                bookings={roomBookings}
                maintenanceList={maintenanceList}
                onBookingClick={handleBookingClick}
                onDateSelect={handleDateSelect}
              />
            </div>
          )
        )}
      </div>

      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="fixed inset-0 z-10 overflow-y-auto"
          onClose={handleCloseModal}
        >
          <div className="min-h-screen px-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-black bg-opacity-30" />
            </Transition.Child>

            {/* This element is to trick the browser into centering the modal contents. */}
            <span
              className="inline-block h-screen align-middle"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900"
                >
                  {selectedRoom ? 'Edit Room' : 'Add New Room'}
                </Dialog.Title>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="number" className="block text-sm font-medium text-gray-700">
                      Room Number
                    </label>
                    <input
                      type="text"
                      id="number"
                      value={formData.number}
                      onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as Room['type'] })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="standard">Standard</option>
                      <option value="deluxe">Deluxe</option>
                      <option value="suite">Suite</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                      Price per Night (£)
                    </label>
                    <input
                      type="number"
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as Room['status'] })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                      Capacity (persons)
                    </label>
                    <input
                      type="number"
                      id="capacity"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      required
                      min="1"
                    />
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amenities
                    </label>
                    <AmenitiesSelector
                      selectedAmenityIds={formData.amenities}
                      onChange={(amenityIds) => setFormData({ ...formData, amenities: amenityIds })}
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Room Images
                    </label>
                    <div className="mt-2 flex flex-wrap gap-4">
                      {formData.images?.map((url, index) => (
                        <div key={url} className="relative w-24 h-24 group">
                          <img
                            src={url}
                            alt={`Room ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => handleDeleteImage(url)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {imagePreviewUrls.map((url, index) => (
                        <div key={url} className="relative w-24 h-24 group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 z-10 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      <label className="w-24 h-24 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <PhotoIcon className="w-8 h-8 text-gray-400" />
                      </label>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      {selectedRoom ? 'Update Room' : 'Create Room'}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>

      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setSelectedBooking(null);
          setSelectedDates(null);
        }}
        onSave={handleSaveBooking}
        booking={selectedBooking || undefined}
        startDate={selectedDates?.start}
        endDate={selectedDates?.end}
        roomId={selectedRoomForCalendar?.id || ''}
      />

      <MaintenanceModal
        isOpen={maintenanceModalOpen}
        onClose={() => setMaintenanceModalOpen(false)}
        onSchedule={handleScheduleMaintenance}
        roomNumber={selectedRoomForCalendar?.number || ''}
      />
    </div>
  );
}

export default RoomsPage; 