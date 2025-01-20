import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const setupAdmin = async () => {
  try {
    const adminEmail = 'admin@indianahotels.com';
    const adminPassword = 'admin123';

    // First, ensure we're signed out
    const auth = getAuth();
    if (auth.currentUser) {
      console.log('Signing out current user...');
      await signOut(auth);
      await delay(1000);
    }

    let userCredential;
    try {
      console.log('Attempting to sign in as admin...');
      userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Successfully signed in as admin');
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.log('Admin user does not exist, creating...');
        userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Admin user created in Firebase Auth');
      } else {
        console.error('Error in authentication:', error);
        throw error;
      }
    }

    await delay(1000); // Wait for auth state to update

    const user = userCredential.user;
    if (!user) {
      throw new Error('No user after authentication');
    }

    try {
      // Check if admin document exists in staff collection
      console.log('Checking for admin document in Firestore...');
      const staffDocRef = doc(db, 'staff', user.uid);
      const staffDoc = await getDoc(staffDocRef);

      if (!staffDoc.exists()) {
        console.log('Creating admin document in Firestore...');
        const adminData = {
          email: adminEmail,
          displayName: 'Admin',
          role: 'admin',
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
          permissions: {
            canViewUsers: true,
            canManageRooms: true,
            canManageBookings: true,
            canAccessSettings: true,
            canManageStaff: true
          }
        };

        await setDoc(staffDocRef, adminData);
        console.log('Admin document created successfully');
        return { success: true, user, isNewUser: true, data: adminData };
      }

      console.log('Admin document exists in Firestore');
      return { success: true, user, isNewUser: false, data: staffDoc.data() };

    } catch (error) {
      console.error('Error accessing Firestore:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in setupAdmin:', error);
    throw error;
  }
};

export const checkAdminSetup = async () => {
  try {
    console.log('Starting admin setup check...');
    return await setupAdmin();
  } catch (error) {
    console.error('Error checking admin setup:', error);
    throw error;
  }
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).setupAdmin = setupAdmin;
  (window as any).checkAdminSetup = checkAdminSetup;
} 