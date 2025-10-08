'use client';

import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';
import { MapPin, Home, Banknote } from 'lucide-react';
import { Button } from '../ui/button';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '../auth/auth-modal';
import Link from 'next/link';

type PropertyCardProps = {
  listing: Listing;
};

export function PropertyCard({ listing }: PropertyCardProps) {
  const { user } = useAuth();

  const PayButton = () => {
    if (listing.status === 'sold') {
      return <Button disabled variant="secondary" className="w-full">Rented</Button>;
    }
    
    if (user) {
      return (
        <Button asChild className="w-full">
          <Link href={`/payment/${listing.id}`}>Pay Now</Link>
        </Button>
      );
    }
    
    return (
        <AuthModal>
            <Button className="w-full">Pay Now</Button>
        </AuthModal>
    );
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <CardHeader className="relative p-0">
        <div className="aspect-h-3 aspect-w-4 relative">
            <Image
                src={listing.imageUrl}
                alt={listing.title}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                data-ai-hint={listing.imageHint}
            />
            {listing.status === 'sold' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Badge variant="destructive" className="text-lg">RENTED</Badge>
                </div>
            )}
        </div>
        <Badge className="absolute top-2 right-2">{listing.type}</Badge>
      </CardHeader>
      <CardContent className="flex-grow p-4">
        <CardTitle className="mb-2 font-headline text-xl leading-tight">
          {listing.title}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{listing.location}</span>
        </div>
      </CardContent>
      <CardFooter className="flex-col items-start gap-4 p-4 pt-0">
        <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Banknote className="h-5 w-5" />
                <span>${listing.price.toLocaleString()}</span>
                <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
        </div>
        <PayButton />
      </CardFooter>
    </Card>
  );
}
