import { collection, getDocs, deleteDoc, doc, query, where } from 'firebase/firestore';
import { db } from '../firebase';

export const cleanupData = async () => {
  try {
    // Delete all rooms
    const roomsRef = collection(db, 'rooms');
    const roomsSnapshot = await getDocs(roomsRef);
    console.log(`Found ${roomsSnapshot.size} rooms to delete`);
    
    for (const roomDoc of roomsSnapshot.docs) {
      await deleteDoc(doc(db, 'rooms', roomDoc.id));
      console.log(`Deleted room: ${roomDoc.id}`);
    }

    // Delete all bookings
    const bookingsRef = collection(db, 'bookings');
    const bookingsSnapshot = await getDocs(bookingsRef);
    console.log(`Found ${bookingsSnapshot.size} bookings to delete`);
    
    for (const bookingDoc of bookingsSnapshot.docs) {
      await deleteDoc(doc(db, 'bookings', bookingDoc.id));
      console.log(`Deleted booking: ${bookingDoc.id}`);
    }

    // Delete all users except admin
    const usersRef = collection(db, 'users');
    const usersQuery = query(usersRef, where('email', '!=', 'admin@indianahotels.com'));
    const usersSnapshot = await getDocs(usersQuery);
    console.log(`Found ${usersSnapshot.size} users to delete`);
    
    for (const userDoc of usersSnapshot.docs) {
      await deleteDoc(doc(db, 'users', userDoc.id));
      console.log(`Deleted user: ${userDoc.id}`);
    }

    // Delete all maintenance records
    const maintenanceRef = collection(db, 'maintenance');
    const maintenanceSnapshot = await getDocs(maintenanceRef);
    console.log(`Found ${maintenanceSnapshot.size} maintenance records to delete`);
    
    for (const maintenanceDoc of maintenanceSnapshot.docs) {
      await deleteDoc(doc(db, 'maintenance', maintenanceDoc.id));
      console.log(`Deleted maintenance record: ${maintenanceDoc.id}`);
    }

    console.log('Cleanup completed successfully');
    return true;
  } catch (error) {
    console.error('Error during cleanup:', error);
    throw error;
  }
}; 