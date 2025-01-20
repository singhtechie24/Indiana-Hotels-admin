// Room service handles all room-related operations in the admin panel
// Including room management, status updates, and image handling

import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { app } from '../firebase';

// Room data model with all possible room states and properties
export interface Room {
  id: string;
  number: string;
  type: 'standard' | 'deluxe' | 'suite';
  price: number;
  status: 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'do-not-disturb';
  description: string;
  amenities: string[];
  images: string[];
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
  lastUpdated?: Date;
  updatedBy?: string;
}

// Type definitions for creating and updating rooms
// Omits auto-generated fields like id and timestamps
export type CreateRoomData = Omit<Room, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateRoomData = Partial<Omit<Room, 'id' | 'createdAt' | 'updatedAt'>>;

// Collection reference in Firestore
const ROOMS_COLLECTION = 'rooms';

// Initialize Firebase Storage for room images
const storage = getStorage(app);

export const uploadRoomImage = async (file: File, roomId: string): Promise<string> => {
  try {
    // Create a canvas to handle image conversion and compression
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Create an image object
    const img: HTMLImageElement = new Image();
    img.src = URL.createObjectURL(file);
    
    // Wait for image to load
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // Set canvas dimensions to match image (max 1920px width/height while maintaining aspect ratio)
    let width = img.width;
    let height = img.height;
    const maxDimension = 1920;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
    }

    canvas.width = width;
    canvas.height = height;

    // Draw image to canvas with white background (to handle transparent PNGs)
    if (ctx) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    }

    // Convert to JPEG blob with 0.8 quality
    const jpegBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, 'image/jpeg', 0.8);
    });

    // Create a new filename with .jpg extension
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    const filename = `${timestamp}_${randomId}.jpg`;
    const imagePath = `rooms/${roomId}/${filename}`;
    
    // Upload the converted image
    const storageRef = ref(storage, imagePath);
    await uploadBytes(storageRef, jpegBlob, {
      contentType: 'image/jpeg',
    });
    
    // Get the download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

export const uploadMultipleRoomImages = async (files: File[], roomId: string): Promise<string[]> => {
  try {
    const uploadPromises = files.map(file => uploadRoomImage(file, roomId));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
};

export const deleteRoomImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract the path from the URL
    const imageRef = ref(storage, decodeURIComponent(imageUrl.split('?')[0].split('/o/')[1]));
    await deleteObject(imageRef);
    console.log('Image deleted successfully:', imageUrl);
  } catch (error) {
    console.error('Error deleting image:', error);
    throw error;
  }
};

export const deleteMultipleRoomImages = async (imageUrls: string[]): Promise<void> => {
  try {
    const deletePromises = imageUrls.map(url => deleteRoomImage(url));
    await Promise.all(deletePromises);
    console.log('All images deleted successfully');
  } catch (error) {
    console.error('Error deleting multiple images:', error);
    throw error;
  }
};

const deleteMultipleImages = async (imageUrls: string[]) => {
  try {
    const deletePromises = imageUrls.map(url => deleteRoomImage(url));
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error('Error deleting multiple room images:', error);
    throw error;
  }
};

export const roomService = {
  // Subscribe to real-time room updates
  subscribeToRooms(onUpdate: (rooms: Room[]) => void, onError?: (error: Error) => void) {
    const roomsRef = collection(db, ROOMS_COLLECTION);
    
    return onSnapshot(roomsRef, 
      (snapshot) => {
        const rooms = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastUpdated: doc.data().lastUpdated?.toDate(),
        })) as Room[];
        onUpdate(rooms);
      },
      (error) => {
        console.error('Error listening to rooms:', error);
        onError?.(error);
      }
    );
  },

  // Subscribe to a single room's updates
  subscribeToRoom(roomId: string, onUpdate: (room: Room | null) => void, onError?: (error: Error) => void) {
    const roomRef = doc(db, ROOMS_COLLECTION, roomId);
    
    return onSnapshot(roomRef,
      (doc) => {
        if (!doc.exists()) {
          onUpdate(null);
          return;
        }
        const room = {
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          updatedAt: doc.data().updatedAt?.toDate(),
          lastUpdated: doc.data().lastUpdated?.toDate(),
        } as Room;
        onUpdate(room);
      },
      (error) => {
        console.error('Error listening to room:', error);
        onError?.(error);
      }
    );
  },

  async createRoom(data: CreateRoomData): Promise<string> {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const now = Timestamp.now();
      const docRef = await addDoc(roomsRef, {
        ...data,
        createdAt: now,
        updatedAt: now,
        lastUpdated: now,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating room:', error);
      throw error;
    }
  },

  async updateRoom(id: string, data: UpdateRoomData): Promise<void> {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, id);
      await updateDoc(roomRef, {
        ...data,
        updatedAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating room:', error);
      throw error;
    }
  },

  async deleteRoom(id: string): Promise<void> {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, id);
      await deleteDoc(roomRef);
    } catch (error) {
      console.error('Error deleting room:', error);
      throw error;
    }
  },

  // Keep these methods for one-time fetches when needed
  async getAllRooms(): Promise<Room[]> {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const snapshot = await getDocs(roomsRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as Room[];
    } catch (error) {
      console.error('Error getting rooms:', error);
      throw error;
    }
  },

  async getRoomById(id: string): Promise<Room | null> {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, id);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        return null;
      }

      return {
        id: roomDoc.id,
        ...roomDoc.data(),
        createdAt: roomDoc.data().createdAt?.toDate(),
        updatedAt: roomDoc.data().updatedAt?.toDate(),
        lastUpdated: roomDoc.data().lastUpdated?.toDate(),
      } as Room;
    } catch (error) {
      console.error('Error getting room:', error);
      throw error;
    }
  },

  async getRoomsByStatus(status: Room['status']): Promise<Room[]> {
    try {
      const roomsRef = collection(db, ROOMS_COLLECTION);
      const q = query(roomsRef, where('status', '==', status));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastUpdated: doc.data().lastUpdated?.toDate(),
      })) as Room[];
    } catch (error) {
      console.error('Error getting rooms by status:', error);
      throw error;
    }
  },

  async updateRoomImages(id: string, newImages: string[]): Promise<void> {
    try {
      const roomRef = doc(db, ROOMS_COLLECTION, id);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        throw new Error('Room not found');
      }

      const currentImages = roomDoc.data().images || [];
      const imagesToDelete = currentImages.filter(img => !newImages.includes(img));

      // Delete removed images from storage
      if (imagesToDelete.length > 0) {
        await deleteMultipleRoomImages(imagesToDelete);
      }

      // Update room document with new image list
      await updateDoc(roomRef, {
        images: newImages,
        updatedAt: Timestamp.now(),
        lastUpdated: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating room images:', error);
      throw error;
    }
  },

  async deleteRoomImage(imageUrl: string): Promise<void> {
    try {
      await deleteRoomImage(imageUrl);
    } catch (error) {
      console.error('Error deleting room image:', error);
      throw error;
    }
  },

  async uploadMultipleRoomImages(files: File[], roomId: string): Promise<string[]> {
    try {
      const uploadPromises = files.map(file => uploadRoomImage(file, roomId));
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images:', error);
      throw error;
    }
  },

  deleteMultipleImages
}; 