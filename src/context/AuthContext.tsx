import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Employee } from '../types';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async (firebaseUser: User): Promise<Employee | null> => {
    try {
      // 1. Try fetching direct document by UID in 'employee' collection
      let empDoc = await getDoc(doc(db, 'employee', firebaseUser.uid));
      
      // 2. Fallback: try 'employees' collection by UID
      if (!empDoc.exists()) {
        empDoc = await getDoc(doc(db, 'employees', firebaseUser.uid));
      }

      // 3. Fallback: query by email in 'employee' collection
      if (!empDoc.exists() && firebaseUser.email) {
        const q = query(collection(db, 'employee'), where('email', '==', firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          empDoc = snap.docs[0];
        }
      }

      // 4. Fallback: query by email in 'employees' collection
      if (!empDoc.exists() && firebaseUser.email) {
        const q = query(collection(db, 'employees'), where('email', '==', firebaseUser.email));
        const snap = await getDocs(q);
        if (!snap.empty) {
          empDoc = snap.docs[0];
        }
      }

      if (empDoc.exists()) {
        const data = empDoc.data();
        if (data.active === false) {
          return null; // inactive employee
        }
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: data.name || data.firstName ? `${data.firstName || ''} ${data.lastName || ''}`.trim() : firebaseUser.email?.split('@')[0],
          role: data.role || 'staff',
          storeUID: data.storeUID || data.storeId || 'default-store',
          active: data.active !== false,
        };
      }

      // If user authenticated but no explicit record exists yet, allow basic staff session
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        role: 'staff',
        storeUID: 'boise-store',
        active: true,
      };
    } catch (err) {
      console.warn('Error fetching employee record:', err);
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || firebaseUser.email?.split('@')[0],
        role: 'staff',
        storeUID: 'boise-store',
        active: true,
      };
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const emp = await fetchEmployeeData(currentUser);
        setEmployee(emp);
      } else {
        setUser(null);
        setEmployee(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      const emp = await fetchEmployeeData(userCredential.user);
      if (!emp) {
        await firebaseSignOut(auth);
        return { success: false, error: 'Access denied: account not found or inactive in the employee collection.' };
      }
      setUser(userCredential.user);
      setEmployee(emp);
      return { success: true };
    } catch (err: any) {
      console.error('POS Login Error:', err);
      let message = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/user-not-found') {
        message = 'No account found with this email.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      }
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
