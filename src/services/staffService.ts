// Staff service manages hotel employee accounts and permissions
// Handles staff member creation, role assignment, and access control

import { collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../firebase';

// Staff member data model with role-based permissions and department assignment
export interface StaffMember {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'staff';
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  phoneNumber: string;
  notes: string;
  shift: 'day' | 'night';
  department: 'housekeeping' | 'maintenance' | 'frontdesk';
  permissions: {
    canViewUsers: boolean;
    canManageRooms: boolean;
    canManageBookings: boolean;
    canAccessSettings: boolean;
    canManageStaff: boolean;
  };
}

// Type definitions for creating and updating staff members
// Omits auto-generated fields like id and timestamps
export type CreateStaffData = Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateStaffData = Partial<Omit<StaffMember, 'id' | 'createdAt' | 'updatedAt'>>;

// Collection reference in Firestore - uses shared userProfiles collection
const STAFF_COLLECTION = 'userProfiles';

export const staffService = {
  // Retrieves all staff members and admins with their current roles and permissions
  async getAllStaff(): Promise<StaffMember[]> {
    try {
      const staffRef = collection(db, STAFF_COLLECTION);
      const q = query(staffRef, where('role', 'in', ['admin', 'staff']));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as StaffMember[];
    } catch (error) {
      console.error('Error getting staff:', error);
      throw error;
    }
  },

  async getStaffById(id: string): Promise<StaffMember | null> {
    try {
      const staffRef = doc(db, STAFF_COLLECTION, id);
      const staffDoc = await getDoc(staffRef);
      
      if (!staffDoc.exists()) {
        return null;
      }

      const data = staffDoc.data();
      if (data.role !== 'admin' && data.role !== 'staff') {
        return null;
      }

      return {
        id: staffDoc.id,
        ...staffDoc.data(),
        createdAt: staffDoc.data().createdAt?.toDate(),
        updatedAt: staffDoc.data().updatedAt?.toDate(),
        lastLogin: staffDoc.data().lastLogin?.toDate(),
      } as StaffMember;
    } catch (error) {
      console.error('Error getting staff member:', error);
      throw error;
    }
  },

  async createStaff(data: CreateStaffData & { password: string }): Promise<StaffMember> {
    try {
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const uid = userCredential.user.uid;

      // Create staff document
      const now = Timestamp.now();
      const staffData = {
        ...data,
        id: uid,
        createdAt: now,
        updatedAt: now,
        status: 'active',
      };

      await setDoc(doc(db, STAFF_COLLECTION, uid), staffData);

      return {
        ...staffData,
        id: uid,
        createdAt: now.toDate(),
        updatedAt: now.toDate(),
      };
    } catch (error) {
      console.error('Error creating staff:', error);
      throw error;
    }
  },

  async updateStaff(id: string, data: UpdateStaffData): Promise<void> {
    try {
      const staffRef = doc(db, STAFF_COLLECTION, id);
      await updateDoc(staffRef, {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating staff:', error);
      throw error;
    }
  },

  async deleteStaff(id: string): Promise<void> {
    try {
      const staffRef = doc(db, STAFF_COLLECTION, id);
      const staffDoc = await getDoc(staffRef);
      
      if (staffDoc.exists() && staffDoc.data().role === 'admin') {
        throw new Error('Cannot delete admin accounts');
      }
      
      await deleteDoc(staffRef);
    } catch (error) {
      console.error('Error deleting staff:', error);
      throw error;
    }
  },

  async getStaffByRole(role: StaffMember['role']): Promise<StaffMember[]> {
    try {
      const staffRef = collection(db, STAFF_COLLECTION);
      const q = query(staffRef, where('role', '==', role));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLogin: doc.data().lastLogin?.toDate(),
      })) as StaffMember[];
    } catch (error) {
      console.error('Error getting staff by role:', error);
      throw error;
    }
  }
}; 