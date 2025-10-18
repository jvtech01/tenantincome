'use client';

import type { Listing, UserProfile } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PropertyCard } from '@/components/listings/property-card';
import { User } from 'lucide-react';

interface UserProfileClientProps {
  user: UserProfile;
  listings: Listing[];
}

export function UserProfileClient({ user, listings }: UserProfileClientProps) {
  const getInitials = (name: string | null) => {
    if (!name) return <User />;
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-12 flex flex-col items-center gap-6 text-center md:flex-row md:text-left">
        <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
          <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User profile'} />
          <AvatarFallback className="text-3xl">
            {getInitials(user.displayName)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-headline text-4xl font-bold">{user.displayName}</h1>
          <p className="text-muted-foreground">{user.email}</p>
        </div>
      </div>
      
      <h2 className="mb-8 font-headline text-3xl font-bold">
        Listings by {user.displayName?.split(' ')[0]}
      </h2>

      {listings.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed bg-card p-8 text-center">
          <h3 className="text-xl font-semibold">No Active Listings</h3>
          <p className="mt-2 text-muted-foreground">
            {user.displayName} doesn’t have any approved listings at the moment.
          </p>
        </div>
      )}
    </div>
  );
}
