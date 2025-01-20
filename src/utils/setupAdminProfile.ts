import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const setupAdminProfile = async () => {
  try {
    const auth = getAuth();
    const adminEmail = 'admin@indianahotels.com';
    const adminPassword = 'admin123';

    let userCredential;
    try {
      // Try to create new admin user
      console.log('Creating new admin user...');
      userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      console.log('Admin user created successfully');
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        // If user exists, try to sign in
        console.log('Admin user exists, signing in...');
        userCredential = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
        console.log('Signed in as admin');
      } else {
        console.error('Error in authentication:', error);
        throw error;
      }
    }

    const userId = userCredential.user.uid;
    console.log('Admin user ID:', userId);

    // Create or update admin profile in Firestore
    const profileRef = doc(db, 'userProfiles', userId);
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

    await setDoc(profileRef, adminData, { merge: true });
    console.log('Admin profile created/updated in Firestore');

    return { success: true, data: adminData };
  } catch (error) {
    console.error('Error setting up admin profile:', error);
    throw error;
  }
}; 