import { useState, useEffect } from 'react';
import { Booking, bookingService } from '../services/bookingService';
import { Room, roomService } from '../services/roomService';
import { Modal } from '../components/Modal';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export const BookingsPage = () => {
  const [bookings, setBookings] = useState<(Booking & { roomNumber?: string })[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const initialFormData = {
    roomId: '',
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    checkIn: '',
    checkOut: '',
    status: 'pending' as Booking['status'],
    paymentStatus: 'pending' as Booking['paymentStatus'],
    totalPrice: 0,
    specialRequests: '',
  };
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    console.log('Setting up real-time listeners...');
    setLoading(true);

    // Subscribe to bookings updates
    const unsubscribeBookings = bookingService.subscribeToBookings(
      async (updatedBookings) => {
        console.log('Received real-time booking update:', updatedBookings);
        // Fetch room details for each booking
        const bookingsWithRoomNumbers = await Promise.all(
          updatedBookings.map(async (booking) => {
            const room = await roomService.getRoomById(booking.roomId);
            return {
              ...booking,
              roomNumber: room?.number,
            };
          })
        );
        setBookings(bookingsWithRoomNumbers);
        setLoading(false);
      },
      (error) => {
        console.error('Error in booking subscription:', error);
        setLoading(false);
      }
    );

    // Fetch rooms for the dropdown
    const fetchRooms = async () => {
      try {
        const data = await roomService.getAllRooms();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();

    // Cleanup function to unsubscribe when component unmounts
    return () => {
      console.log('Cleaning up booking subscriptions...');
      unsubscribeBookings();
    };
  }, []); // Empty dependency array means this runs once on mount

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const bookingData = {
        ...formData,
        checkIn: new Date(formData.checkIn),
        checkOut: new Date(formData.checkOut),
      };

      if (selectedBooking) {
        await bookingService.updateBookingWithRoom(selectedBooking.id, bookingData);
      } else {
        await bookingService.createBooking(bookingData);
      }

      setIsModalOpen(false);
      setSelectedBooking(null);
      resetForm();
    } catch (error) {
      console.error('Error saving booking:', error);
    }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setFormData({
      roomId: booking.roomId,
      guestName: booking.guestName,
      guestEmail: booking.guestEmail,
      guestPhone: booking.guestPhone,
      checkIn: format(booking.checkIn, 'yyyy-MM-dd'),
      checkOut: format(booking.checkOut, 'yyyy-MM-dd'),
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      totalPrice: booking.totalPrice,
      specialRequests: booking.specialRequests || '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        await bookingService.deleteBooking(id);
      } catch (error) {
        console.error('Error deleting booking:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
  };

  const handleAddNew = () => {
    setSelectedBooking(null);
    resetForm();
    setIsModalOpen(true);
  };

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPaymentStatusColor = (status: Booking['paymentStatus']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div>
      <div className="pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between">
        <h3 className="text-2xl leading-6 font-medium text-gray-900">
          Bookings Management
        </h3>
        <div className="mt-3 sm:mt-0 sm:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            onClick={handleAddNew}
          >
            Add New Booking
          </button>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Guest Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Room
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check In
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Check Out
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Price
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Payment Status
                        </th>
                        <th scope="col" className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {bookings.map((booking) => (
                        <tr key={booking.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {booking.guestName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {booking.roomNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(booking.checkIn, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(booking.checkOut, 'MMM dd, yyyy')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            ${booking.totalPrice}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                              {booking.paymentStatus}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEdit(booking)}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(booking.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(null);
          resetForm();
        }}
        title={selectedBooking ? 'Edit Booking' : 'Add New Booking'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
              Room
            </label>
            <select
              id="roomId"
              value={formData.roomId}
              onChange={(e) => setFormData({ ...formData, roomId: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.number} - {room.type} (${room.price}/night)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="guestName" className="block text-sm font-medium text-gray-700">
              Guest Name
            </label>
            <input
              type="text"
              id="guestName"
              value={formData.guestName}
              onChange={(e) => setFormData({ ...formData, guestName: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="guestEmail" className="block text-sm font-medium text-gray-700">
              Guest Email
            </label>
            <input
              type="email"
              id="guestEmail"
              value={formData.guestEmail}
              onChange={(e) => setFormData({ ...formData, guestEmail: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>

          <div>
            <label htmlFor="guestPhone" className="block text-sm font-medium text-gray-700">
              Guest Phone
            </label>
            <input
              type="tel"
              id="guestPhone"
              value={formData.guestPhone}
              onChange={(e) => setFormData({ ...formData, guestPhone: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
                Check In Date
              </label>
              <input
                type="date"
                id="checkIn"
                value={formData.checkIn}
                onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">
                Check Out Date
              </label>
              <input
                type="date"
                id="checkOut"
                value={formData.checkOut}
                onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as Booking['status'] })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div>
            <label htmlFor="totalPrice" className="block text-sm font-medium text-gray-700">
              Total Price
            </label>
            <input
              type="number"
              id="totalPrice"
              value={formData.totalPrice}
              onChange={(e) => setFormData({ ...formData, totalPrice: Number(e.target.value) })}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              required
              min="0"
            />
          </div>

          <div>
            <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700">
              Special Requests
            </label>
            <textarea
              id="specialRequests"
              value={formData.specialRequests}
              onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
              rows={3}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          <div className="mt-5 sm:mt-6">
            <button
              type="submit"
              className="inline-flex justify-center w-full rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:text-sm"
            >
              {selectedBooking ? 'Update Booking' : 'Create Booking'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}; 