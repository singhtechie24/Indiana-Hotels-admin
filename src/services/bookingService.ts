// Booking service manages all reservation-related operations
// Handles creation, updates, and real-time tracking of bookings

import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { roomService } from './roomService';

// Booking data model with all booking states and guest information
export interface Booking {
  id: string;
  roomId: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: Date;
  checkOut: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  specialRequests?: string;
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
}

// Type definitions for creating and updating bookings
// Omits auto-generated fields like id and timestamps
export type CreateBookingData = Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBookingData = Partial<Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>>;

// Collection reference in Firestore
const BOOKINGS_COLLECTION = 'bookings';

// Helper function to convert Firestore timestamps to JavaScript Date objects
const convertToDate = (timestamp: any): Date => {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  return timestamp;
};

export const bookingService = {
  // Sets up real-time listener for booking changes
  // Updates UI immediately when bookings are modified
  subscribeToBookings(onUpdate: (bookings: Booking[]) => void, onError?: (error: Error) => void) {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    
    return onSnapshot(bookingsRef,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkIn: convertToDate(doc.data().checkIn),
          checkOut: convertToDate(doc.data().checkOut),
          createdAt: convertToDate(doc.data().createdAt),
          updatedAt: convertToDate(doc.data().updatedAt),
        })) as Booking[];
        onUpdate(bookings);
      },
      (error) => {
        console.error('Error listening to bookings:', error);
        onError?.(error);
      }
    );
  },

  // Subscribe to bookings for a specific room
  subscribeToRoomBookings(roomId: string, onUpdate: (bookings: Booking[]) => void, onError?: (error: Error) => void) {
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    const q = query(bookingsRef, where('roomId', '==', roomId));
    
    return onSnapshot(q,
      (snapshot) => {
        const bookings = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          checkIn: convertToDate(doc.data().checkIn),
          checkOut: convertToDate(doc.data().checkOut),
          createdAt: convertToDate(doc.data().createdAt),
          updatedAt: convertToDate(doc.data().updatedAt),
        })) as Booking[];
        onUpdate(bookings);
      },
      (error) => {
        console.error('Error listening to room bookings:', error);
        onError?.(error);
      }
    );
  },

  async createBooking(data: CreateBookingData): Promise<string> {
    try {
      const bookingsRef = collection(db, BOOKINGS_COLLECTION);
      const now = Timestamp.now();
      const docRef = await addDoc(bookingsRef, {
        ...data,
        createdAt: now,
        updatedAt: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  async updateBooking(id: string, data: UpdateBookingData): Promise<void> {
    try {
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      await updateDoc(bookingRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  async deleteBooking(id: string): Promise<void> {
    try {
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      await deleteDoc(bookingRef);
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  },

  // Keep these methods for one-time fetches when needed
  async getAllBookings(): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, BOOKINGS_COLLECTION);
      const snapshot = await getDocs(bookingsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: convertToDate(doc.data().checkIn),
        checkOut: convertToDate(doc.data().checkOut),
        createdAt: convertToDate(doc.data().createdAt),
        updatedAt: convertToDate(doc.data().updatedAt),
      })) as Booking[];
    } catch (error) {
      console.error('Error getting bookings:', error);
      throw error;
    }
  },

  async getBookingsByRoom(roomId: string): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, BOOKINGS_COLLECTION);
      const q = query(bookingsRef, where('roomId', '==', roomId));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        checkIn: convertToDate(doc.data().checkIn),
        checkOut: convertToDate(doc.data().checkOut),
        createdAt: convertToDate(doc.data().createdAt),
        updatedAt: convertToDate(doc.data().updatedAt),
      })) as Booking[];
    } catch (error) {
      console.error('Error getting room bookings:', error);
      throw error;
    }
  },

  async getBookingById(id: string): Promise<Booking | null> {
    try {
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        return null;
      }

      const data = bookingDoc.data();
      return {
        id: bookingDoc.id,
        ...data,
        checkIn: convertToDate(data.checkIn),
        checkOut: convertToDate(data.checkOut),
        createdAt: convertToDate(data.createdAt),
        updatedAt: convertToDate(data.updatedAt),
      } as Booking;
    } catch (error) {
      console.error('Error getting booking:', error);
      throw error;
    }
  },

  async getBookingsByDateRange(start: Date, end: Date): Promise<Booking[]> {
    try {
      const bookingsRef = collection(db, BOOKINGS_COLLECTION);
      const q = query(
        bookingsRef,
        where('checkIn', '<=', Timestamp.fromDate(end)),
        where('checkOut', '>=', Timestamp.fromDate(start))
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          checkIn: convertToDate(data.checkIn),
          checkOut: convertToDate(data.checkOut),
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
        } as Booking;
      });
    } catch (error) {
      console.error('Error getting bookings by date range:', error);
      throw error;
    }
  },

  async updateBookingWithRoom(id: string, data: UpdateBookingData): Promise<void> {
    try {
      const bookingRef = doc(db, BOOKINGS_COLLECTION, id);
      const bookingDoc = await getDoc(bookingRef);
      
      if (!bookingDoc.exists()) {
        throw new Error('Booking not found');
      }

      const currentBooking = bookingDoc.data() as Booking;
      
      // Update booking
      await updateDoc(bookingRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });

      // Update room status based on booking and payment status
      if (data.status || data.paymentStatus) {
        const newStatus = this.determineRoomStatus(
          data.status || currentBooking.status,
          data.paymentStatus || currentBooking.paymentStatus
        );
        
        await roomService.updateRoom(currentBooking.roomId, {
          status: newStatus,
        });
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  determineRoomStatus(bookingStatus: Booking['status'], paymentStatus: Booking['paymentStatus']): 'available' | 'occupied' {
    if (bookingStatus === 'confirmed' && paymentStatus === 'completed') {
      return 'occupied';
    }
    return 'available';
  },
}; 