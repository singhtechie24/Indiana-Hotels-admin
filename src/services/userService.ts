// User service manages guest accounts and profiles
// Handles user registration, profile updates, and booking history

import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  getFirestore,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../firebase';

// Data models for user creation and updates
interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: 'admin' | 'user';
}

interface UpdateUserData {
  name?: string;
  role?: 'admin' | 'user';
}

// User role types for access control
export type UserRole = 'admin' | 'staff' | 'user';

// User profile data model with booking history
export interface User {
  id: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  status: 'active' | 'disabled';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  bookings: string[]; // Array of booking IDs
}

// Type definition for updating user profiles
// Omits auto-generated fields like id and timestamps
export type UpdateUserData = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

// Firebase Authentication instance
const auth = getAuth();

// Collection reference in Firestore
const USERS_COLLECTION = 'userProfiles';

export const userService = {
  // Retrieves all guest users (excludes staff and admin accounts)
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, USERS_COLLECTION);
      const q = query(usersRef, where('role', '==', 'user'));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users:', error);
      throw error;
    }
  },

  // Creates a new user account with Firebase Auth and Firestore profile
  async createUser({ email, password, name }: { email: string; password: string; name: string }) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update display name
      await updateProfile(user, { displayName: name });

      // Create user document in Firestore
      const userData = {
        email,
        displayName: name,
        role: 'user',
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        bookings: [],
      };

      await setDoc(doc(db, USERS_COLLECTION, user.uid), userData);

      return user.uid;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  async updateUser(id: string, data: UpdateUserData): Promise<void> {
    try {
      const userRef = doc(db, USERS_COLLECTION, id);
      await updateDoc(userRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  },

  async deleteUser(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, USERS_COLLECTION, id));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  },

  async getUserById(id: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, id));
      if (!userDoc.exists()) return null;

      const data = userDoc.data();
      if (data.role !== 'user') return null;

      return {
        id: userDoc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLogin: data.lastLogin?.toDate(),
      } as User;
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  },

  async getUsersByStatus(status: User['status']): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('status', '==', status));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as User[];
    } catch (error) {
      console.error('Error getting users by status:', error);
      throw error;
    }
  },

  async updateUserRole(userId: string, newRole: UserRole): Promise<void> {
    try {
      await this.updateUser(userId, { role: newRole });
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  },

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateUser(userId, { status: isActive ? 'active' : 'disabled' });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  },
}; 