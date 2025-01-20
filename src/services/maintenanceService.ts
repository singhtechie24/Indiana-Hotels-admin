import { collection, getDocs, doc, getDoc, addDoc, updateDoc, deleteDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { MaintenanceData } from '../components/MaintenanceModal';

export interface Maintenance extends MaintenanceData {
  id: string;
  roomId: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMaintenanceData = Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateMaintenanceData = Partial<Omit<Maintenance, 'id' | 'createdAt' | 'updatedAt'>>;

const MAINTENANCE_COLLECTION = 'maintenance';

const convertToDate = (timestamp: Timestamp): Date => {
  return timestamp.toDate();
};

export const maintenanceService = {
  async getAllMaintenance(): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, MAINTENANCE_COLLECTION);
      const snapshot = await getDocs(maintenanceRef);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        startDate: convertToDate(doc.data().startDate),
        endDate: convertToDate(doc.data().endDate),
        createdAt: convertToDate(doc.data().createdAt),
        updatedAt: convertToDate(doc.data().updatedAt),
      })) as Maintenance[];
    } catch (error) {
      console.error('Error getting maintenance records:', error);
      throw error;
    }
  },

  async getMaintenanceById(id: string): Promise<Maintenance | null> {
    try {
      const maintenanceRef = doc(db, MAINTENANCE_COLLECTION, id);
      const maintenanceDoc = await getDoc(maintenanceRef);
      
      if (!maintenanceDoc.exists()) {
        return null;
      }

      const data = maintenanceDoc.data();
      return {
        id: maintenanceDoc.id,
        ...data,
        startDate: convertToDate(data.startDate),
        endDate: convertToDate(data.endDate),
        createdAt: convertToDate(data.createdAt),
        updatedAt: convertToDate(data.updatedAt),
      } as Maintenance;
    } catch (error) {
      console.error('Error getting maintenance record:', error);
      throw error;
    }
  },

  async createMaintenance(data: CreateMaintenanceData): Promise<Maintenance> {
    try {
      const maintenanceRef = collection(db, MAINTENANCE_COLLECTION);
      const now = new Date();
      
      const docRef = await addDoc(maintenanceRef, {
        ...data,
        startDate: Timestamp.fromDate(data.startDate),
        endDate: Timestamp.fromDate(data.endDate),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
      });

      return {
        id: docRef.id,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  },

  async updateMaintenance(id: string, data: UpdateMaintenanceData): Promise<void> {
    try {
      const maintenanceRef = doc(db, MAINTENANCE_COLLECTION, id);
      const updateData = {
        ...data,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      if (data.startDate) {
        updateData.startDate = Timestamp.fromDate(data.startDate);
      }
      if (data.endDate) {
        updateData.endDate = Timestamp.fromDate(data.endDate);
      }

      await updateDoc(maintenanceRef, updateData);
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },

  async deleteMaintenance(id: string): Promise<void> {
    try {
      const maintenanceRef = doc(db, MAINTENANCE_COLLECTION, id);
      await deleteDoc(maintenanceRef);
    } catch (error) {
      console.error('Error deleting maintenance record:', error);
      throw error;
    }
  },

  async getMaintenanceByRoom(roomId: string): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, MAINTENANCE_COLLECTION);
      const q = query(maintenanceRef, where('roomId', '==', roomId));
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: convertToDate(data.startDate),
          endDate: convertToDate(data.endDate),
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
        } as Maintenance;
      });
    } catch (error) {
      console.error('Error getting maintenance records by room:', error);
      throw error;
    }
  },

  async getMaintenanceByDateRange(start: Date, end: Date): Promise<Maintenance[]> {
    try {
      const maintenanceRef = collection(db, MAINTENANCE_COLLECTION);
      const q = query(
        maintenanceRef,
        where('startDate', '<=', Timestamp.fromDate(end)),
        where('endDate', '>=', Timestamp.fromDate(start))
      );
      const snapshot = await getDocs(q);
      
      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: convertToDate(data.startDate),
          endDate: convertToDate(data.endDate),
          createdAt: convertToDate(data.createdAt),
          updatedAt: convertToDate(data.updatedAt),
        } as Maintenance;
      });
    } catch (error) {
      console.error('Error getting maintenance records by date range:', error);
      throw error;
    }
  },
}; 