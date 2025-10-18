'use client';

import { createContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, adminEmails } from '@/lib/firebase/config';
import type { UserProfile, SignupData, LoginData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  signUp: (data: SignupData) => Promise<void>;
  signIn: (data: LoginData) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // This ensures that the user's session is persisted across browser sessions.
    setPersistence(auth, browserLocalPersistence)
      .then(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: User | null) => {
          if (firebaseUser) {
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              setUser(userDoc.data() as UserProfile);
            } else {
              // This case might happen if a user was created via Google Sign-In before,
              // but their Firestore doc was deleted. We can recreate it.
              const profileData: UserProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "New User",
                photoURL: firebaseUser.photoURL,
                isAdmin: adminEmails.includes(firebaseUser.email || ''),
              };
              await setDoc(userDocRef, profileData, { merge: true });
              setUser(profileData);
            }
          } else {
            setUser(null);
          }
          setLoading(false);
        });
        return unsubscribe;
      })
      .catch((error) => {
        console.error("Error setting persistence:", error);
        setLoading(false);
      });
  }, []);

  const signUp = async (data: SignupData) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, { displayName: data.name });

      // Create user document in Firestore
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const profileData: UserProfile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: data.name,
        photoURL: null, // No photoURL with email signup by default
        isAdmin: adminEmails.includes(data.email),
      };
      await setDoc(userDocRef, profileData);

      setUser(profileData); // Set user in context immediately
      toast({ title: 'Account Created', description: 'Welcome to JVHOUZIN!' });
    } catch (error: any) {
      console.error('Error signing up:', error);
      toast({
        title: 'Sign Up Failed',
        description: error.message || 'Could not create account. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signIn = async (data: LoginData) => {
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({ title: 'Login Successful', description: 'Welcome back!' });
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out.',
      });
    } catch (error) {
      console.error('Error signing out:', error);
       toast({
        title: 'Sign Out Failed',
        description: 'Could not sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
