import { 
  getAuth, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export interface StaffUser {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  permissions: {
    canViewUsers: boolean;
    canManageRooms: boolean;
    canManageBookings: boolean;
    canAccessSettings: boolean;
    canManageStaff: boolean;
  };
}

const USERS_COLLECTION = 'userProfiles';

export const authService = {
  async signIn(email: string, password: string): Promise<StaffUser> {
    try {
      const auth = getAuth();
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user exists in userProfiles collection and is admin/staff
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        throw new Error('User is not authorized as staff or admin');
      }

      return {
        id: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        permissions: userData.permissions || {
          canViewUsers: userData.role === 'admin',
          canManageRooms: userData.role === 'admin',
          canManageBookings: userData.role === 'admin',
          canAccessSettings: userData.role === 'admin',
          canManageStaff: userData.role === 'admin'
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  },

  async signOut(): Promise<void> {
    const auth = getAuth();
    return firebaseSignOut(auth);
  },

  async getCurrentUser(): Promise<StaffUser | null> {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      return null;
    }

    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, user.uid));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        return null;
      }

      return {
        id: user.uid,
        email: userData.email,
        displayName: userData.displayName,
        role: userData.role,
        permissions: userData.permissions || {
          canViewUsers: userData.role === 'admin',
          canManageRooms: userData.role === 'admin',
          canManageBookings: userData.role === 'admin',
          canAccessSettings: userData.role === 'admin',
          canManageStaff: userData.role === 'admin'
        }
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    const auth = getAuth();
    return onAuthStateChanged(auth, callback);
  },

  async checkPermission(userId: string, permission: keyof StaffUser['permissions']): Promise<boolean> {
    try {
      const userDoc = await getDoc(doc(db, USERS_COLLECTION, userId));
      if (!userDoc.exists()) {
        return false;
      }

      const userData = userDoc.data();
      if (userData.role !== 'admin' && userData.role !== 'staff') {
        return false;
      }

      return userData.permissions?.[permission] || userData.role === 'admin';
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }
}; 