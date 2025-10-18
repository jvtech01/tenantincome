
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Listing, UserProfile } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { Loader2 } from 'lucide-react';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

interface MyListingsClientProps {
    user: UserProfile;
}

export function MyListingsClient({ user }: MyListingsClientProps) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'listings'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (querySnapshot) => {
        const userListings = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Listing)
        );
        setListings(userListings);
        setLoading(false);
      },
      (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'listings',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const getStatusBadgeVariant = (status: Listing['status']) => {
    switch(status) {
        case 'approved':
            return 'default';
        case 'pending':
            return 'secondary';
        case 'sold':
            return 'destructive';
        case 'rejected':
            return 'destructive';
        default:
            return 'outline';
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.length > 0 ? (
            listings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                  <Image 
                    src={listing.imageUrls[0]} 
                    alt={listing.title} 
                    width={80} 
                    height={60} 
                    className="rounded-md object-cover"
                  />
                </TableCell>
                <TableCell className="font-medium">{listing.title}</TableCell>
                <TableCell>₦{listing.price.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <Badge variant={getStatusBadgeVariant(listing.status)} className="capitalize">
                    {listing.status === 'pending' ? 'In Review' : listing.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                You haven't listed any properties yet.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
