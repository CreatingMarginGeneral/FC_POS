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
import { verifyEmployeeCode } from '../services/employeeCodes';

const PIN_STORAGE_KEY = 'fc_pos_employee_session';

interface AuthContextType {
  user: User | null;
  employee: Employee | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  loginWithCode: (code: string) => Promise<{ success: boolean; error?: string }>;
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
    // Restore local code session if present
    const savedSession = localStorage.getItem(PIN_STORAGE_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.uid && parsed.name) {
          setEmployee(parsed);
        }
      } catch (err) {
        console.warn('Could not restore employee code session:', err);
      }
    }

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const emp = await fetchEmployeeData(currentUser);
        if (emp) {
          setEmployee(emp);
        }
      } else {
        setUser(null);
        // Only clear employee if there is no local PIN session
        if (!localStorage.getItem(PIN_STORAGE_KEY)) {
          setEmployee(null);
        }
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

  const loginWithCode = async (code: string): Promise<{ success: boolean; error?: string }> => {
    const matchedEmployee = verifyEmployeeCode(code);
    if (!matchedEmployee) {
      return { success: false, error: 'Invalid employee code. Please check your PIN and try again.' };
    }

    setEmployee(matchedEmployee);
    try {
      localStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(matchedEmployee));
    } catch (err) {
      console.warn('Failed to store employee code session in localStorage:', err);
    }
    return { success: true };
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn('Firebase signout note:', err);
    }
    localStorage.removeItem(PIN_STORAGE_KEY);
    setUser(null);
    setEmployee(null);
  };

  return (
    <AuthContext.Provider value={{ user, employee, loading, login, loginWithCode, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
