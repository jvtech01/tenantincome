import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAdmin?: boolean;
};

export type Listing = {
  id: string;
  title: string;
  description: string;
  location: string;
  address: string;
  type: 'Apartment' | 'Shared' | 'House' | 'Villa';
  price: number;
  imageUrls: string[];
  imageHint: string;
  facilities: string[];
  ownerId: string;
  status: 'pending' | 'approved' | 'sold';
  createdAt: Timestamp | Date;
  soldAt?: Timestamp | Date;
};

export type Payment = {
  id: string;
  listingId: string;
  userId: string;
  amount: number;
  receiptUrl: string;
  createdAt: Timestamp;
};
