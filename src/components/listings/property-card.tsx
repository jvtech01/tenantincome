'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';
import { MapPin, Banknote } from 'lucide-react';
import { Button } from '../ui/button';
import React from 'react';
import { ListingDetailsModal } from './listing-details-modal';


type PropertyCardProps = {
  listing: Listing;
};

export function PropertyCard({ listing }: PropertyCardProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
    <Card className="flex h-full flex-col overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl">
      <div className="relative w-full aspect-w-4 aspect-h-3">
        <Image
            src={listing.imageUrls[0]}
            alt={listing.title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            data-ai-hint={listing.imageHint}
        />
        {listing.status === 'sold' && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="destructive" className="text-lg rotate-[-15deg] scale-110">RENTED</Badge>
            </div>
        )}
        <Badge className="absolute top-2 right-2">{listing.type}</Badge>
      </div>

      <CardContent className="flex flex-col flex-grow p-4">
        <h3 className="mb-2 font-headline text-xl leading-tight">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{listing.location}</span>
        </div>

        <div className="flex-grow"></div>

        <div className="mt-4 flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Banknote className="h-5 w-5" />
                <span>₦{listing.price.toLocaleString()}</span>
                <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
        </div>

        <div className="mt-4 grid grid-cols-1">
             <Button onClick={() => setIsModalOpen(true)}>View Property</Button>
        </div>
      </CardContent>
    </Card>
    <ListingDetailsModal isOpen={isModalOpen} onOpenChange={setIsModalOpen} listing={listing} />
    </>
  );
}
