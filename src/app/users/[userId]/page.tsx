import { notFound } from 'next/navigation';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { UserProfileClient } from '@/components/users/user-profile-client';
import type { Listing, UserProfile } from '@/lib/types';

async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) {
    return null;
  }
  return userDoc.data() as UserProfile;
}

async function getUserListings(userId: string): Promise<Listing[]> {
  const q = query(
    collection(db, 'listings'),
    where('ownerId', '==', userId),
    where('status', '==', 'approved')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Listing));
}

export default async function UserProfilePage({ params }: { params: { userId: string } }) {
  const [userProfile, userListings] = await Promise.all([
    getUserProfile(params.userId),
    getUserListings(params.userId),
  ]);

  if (!userProfile) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/40">
        <UserProfileClient user={userProfile} listings={userListings} />
      </main>
      <Footer />
    </div>
  );
}
