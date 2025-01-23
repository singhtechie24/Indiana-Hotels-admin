import React, { FormEvent } from 'react';
import { BookingStatus, PaymentStatus, Room, Booking } from '../types/shared';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onSubmit: (bookingData: Partial<Booking>) => Promise<void>;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  room,
  onSubmit
}) => {
  const [checkIn, setCheckIn] = React.useState('');
  const [checkOut, setCheckOut] = React.useState('');
  const [guests, setGuests] = React.useState(1);
  const [guestName, setGuestName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!room) return;

    const bookingData: Partial<Booking> = {
      roomId: room.id,
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      guests,
      guestName,
      email,
      phone,
      status: BookingStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: room.pricePerNight * calculateNights(checkIn, checkOut)
    };

    await onSubmit(bookingData);
    onClose();
  };

  const calculateNights = (checkIn: string, checkOut: string): number => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Book {room.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Guest Name</label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-in Date</label>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Check-out Date</label>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Number of Guests</label>
            <input
              type="number"
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              min={1}
              max={room.capacity}
              className="mt-1 block w-full border rounded-md shadow-sm p-2"
              required
            />
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Book Now
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}; 