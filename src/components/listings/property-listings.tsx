
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Listing } from '@/lib/types';
import { PropertyCard } from './property-card';
import { PropertyFilters } from './property-filters';
import { Skeleton } from '../ui/skeleton';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';
import placeholderData from '@/lib/placeholder-images.json';

type Filters = {
    location: string;
    type: string;
    priceRange: [number, number];
};

const MAX_PRICE = 10000000;

// Convert placeholder images to Listing format
const placeholderListings: Listing[] = placeholderData.placeholderImages.map(p => ({
  id: p.id,
  title: p.description.split('.')[0],
  description: p.description,
  location: p.address.split(',').slice(-2).join(',').trim(),
  address: p.address,
  type: 'Apartment', // default type, can be randomized or improved
  price: p.price,
  imageUrls: p.imageUrls,
  imageHint: p.imageHint,
  facilities: p.facilities,
  ownerId: 'placeholder',
  status: 'approved',
  createdAt: Timestamp.now(),
}));


export function PropertyListings() {
  const [firestoreListings, setFirestoreListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<Filters>({
    location: '',
    type: 'all',
    priceRange: [150000, MAX_PRICE],
  });

  useEffect(() => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const q = query(
      collection(db, 'listings'),
      where('status', 'in', ['approved', 'sold']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listingsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Listing))
      .filter(listing => {
        if (listing.status === 'sold' && listing.soldAt) {
          const soldAtDate = (listing.soldAt as any).toDate ? (listing.soldAt as any).toDate() : new Date(listing.soldAt);
          return soldAtDate > twentyFourHoursAgo;
        }
        return true;
      });
      
      setFirestoreListings(listingsData);
      setLoading(false);
    },
    (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'listings',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const combinedListings = useMemo(() => {
    const firestoreIds = new Set(firestoreListings.map(l => l.id));
    const uniquePlaceholders = placeholderListings.filter(p => !firestoreIds.has(p.id));
    return [...firestoreListings, ...uniquePlaceholders];
  }, [firestoreListings]);

  const filteredListings = useMemo(() => {
    return combinedListings.filter((listing) => {
      const { location, type, priceRange } = filters;
      const priceInRange = listing.price >= priceRange[0] && (priceRange[1] === MAX_PRICE ? true : listing.price <= priceRange[1]);
      
      const locationMatch = location.trim() === '' || 
                            listing.location.toLowerCase().includes(location.toLowerCase()) ||
                            listing.title.toLowerCase().includes(location.toLowerCase());

      const typeMatch = type === 'all' || listing.type === type;

      return locationMatch && typeMatch && priceInRange;
    });
  }, [combinedListings, filters]);

  return (
    <div id="listings" className="container mx-auto px-4 py-12">
      <PropertyFilters onFilterChange={handleFilterChange} />
      {loading ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-64 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredListings.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredListings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground">
          <p>No properties match your criteria. Try adjusting your filters or check back later.</p>
        </div>
      )}
    </div>
  );
}
