
import type { Timestamp } from 'firebase/firestore';

export type UserProfile = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber?: string;
  isAdmin?: boolean;
};

export type ListingVerification = {
    utilityBillUrl: string;
    identityCardUrl: string;
    listingReason: 'moving_out' | 'finding_flatmate';
}

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
  status: 'pending' | 'approved' | 'sold' | 'rejected';
  createdAt: Timestamp | Date;
  soldAt?: Timestamp | Date;
  verification?: ListingVerification;
};

export type Payment = {
  id: string;
  listingId: string;
  userId: string;
  amount: number;
  receiptUrl: string;
  createdAt: Timestamp;
  status: 'pending_confirmation' | 'confirmed' | 'rejected';
};

export type SignupData = {
    name: string;
    email: string;
    password: string;
    phoneNumber: string;
};
  
export type LoginData = {
    email: string;
    password: string;
};
