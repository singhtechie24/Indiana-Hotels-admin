import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { UserRole } from '../services/userService';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  permissions?: {
    canViewUsers: boolean;
    canManageRooms: boolean;
    canManageBookings: boolean;
    canAccessSettings: boolean;
    canManageStaff: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

const USERS_COLLECTION = 'userProfiles';

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  const getUserData = async (firebaseUser: FirebaseUser) => {
    const userDoc = await getDoc(doc(db, USERS_COLLECTION, firebaseUser.uid));
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data();
    if (userData.role !== 'admin' && userData.role !== 'staff') {
      throw new Error('User is not authorized as staff or admin');
    }

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: userData.displayName || firebaseUser.displayName,
      role: userData.role as UserRole,
      permissions: userData.permissions || {
        canViewUsers: userData.role === 'admin',
        canManageRooms: userData.role === 'admin',
        canManageBookings: userData.role === 'admin',
        canAccessSettings: userData.role === 'admin',
        canManageStaff: userData.role === 'admin'
      }
    };
  };

  useEffect(() => {
    console.log('Setting up auth state listener');
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('Auth state changed:', firebaseUser?.email);
      setLoading(true);
      
      if (firebaseUser) {
        try {
          const userData = await getUserData(firebaseUser);
          console.log('Setting user:', userData);
          setUser(userData);
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Error fetching user data');
          setUser(null);
        }
      } else {
        console.log('No Firebase user');
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      console.log('Attempting login for:', email);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', email);
      
      const userProfileDoc = await getDoc(doc(db, USERS_COLLECTION, userCredential.user.uid));
      
      if (!userProfileDoc.exists()) {
        throw new Error('User profile not found');
      }
      
      const profileData = userProfileDoc.data();
      if (profileData.role !== 'admin' && profileData.role !== 'staff') {
        throw new Error('Insufficient permissions');
      }
      
      setUser({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: profileData.displayName,
        role: profileData.role,
        permissions: profileData.permissions
      });
    } catch (err: unknown) {
      console.log('Login error:', err);
      if (err instanceof FirebaseError || err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      setError('Failed to logout');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 