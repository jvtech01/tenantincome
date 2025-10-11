'use client';

import React from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { Listing } from '@/lib/types';
import { MapPin, Banknote, Zap, Droplets, Landmark, Milestone } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { AuthModal } from '../auth/auth-modal';
import { useRouter } from 'next/navigation';

interface ListingDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  listing: Listing;
}

const facilityIcons: { [key: string]: React.ElementType } = {
    '24/7 Light': Zap,
    'Constant Water': Droplets,
    'Good Roads': Milestone,
    'Borehole Water': Droplets,
    'Generator': Zap,
    'Solar Power': Zap,
    'Inverter Power': Zap,
    'Well Water': Droplets,
    'Public Water': Droplets,
    'Treated Water': Droplets,
    'Paved Roads': Milestone,
    'Okay Roads': Milestone,
    'Sandy Roads': Milestone,
};

const renderFacilityIcon = (facility: string) => {
    const Icon = facilityIcons[facility] || Landmark;
    return <Icon className="h-4 w-4" />;
};


const RentButton = ({ listing }: { listing: Listing }) => {
    const { user } = useAuth();
    const router = useRouter();

    const handleRentNow = () => {
        router.push(`/payment/${listing.id}`);
    }

    if (listing.status === 'sold') {
      return <Button disabled variant="secondary" className="w-full mt-4">Rented</Button>;
    }
    
    if (user) {
        return (
            <Button onClick={handleRentNow} className="w-full mt-4">
              Rent Now
            </Button>
        );
    }

    return (
        <AuthModal>
            <Button className="w-full mt-4">Rent Now</Button>
        </AuthModal>
    );
};

export function ListingDetailsModal({ isOpen, onOpenChange, listing }: ListingDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0">
        <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="relative">
                 <Carousel className="w-full">
                    <CarouselContent>
                        {listing.imageUrls.map((url, index) => (
                            <CarouselItem key={index}>
                                <div className="aspect-h-4 aspect-w-3 relative">
                                    <Image
                                        src={url}
                                        alt={`${listing.title} image ${index + 1}`}
                                        fill
                                        className="object-cover rounded-t-lg md:rounded-l-lg md:rounded-t-none"
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        data-ai-hint={listing.imageHint}
                                    />
                                     {index === 0 && listing.status === 'sold' && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <Badge variant="destructive" className="text-lg rotate-[-15deg] scale-110">RENTED</Badge>
                                        </div>
                                    )}
                                </div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious className="absolute left-2 top-1/2 -translate-y-1/2" />
                    <CarouselNext className="absolute right-2 top-1/2 -translate-y-1/2" />
                </Carousel>
            </div>

            <div className="p-6 flex flex-col">
                <DialogHeader className="mb-4">
                    <div className="flex justify-between items-start">
                        <DialogTitle className="font-headline text-2xl">{listing.title}</DialogTitle>
                        <Badge>{listing.type}</Badge>
                    </div>
                     <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{listing.location}</span>
                    </div>
                </DialogHeader>
                
                <div className="flex-grow overflow-y-auto pr-2 space-y-4">
                    <p className="text-sm text-muted-foreground">{listing.description}</p>
                    
                    <div>
                        <h4 className="font-semibold mb-1">Address:</h4>
                        <p className="text-sm text-muted-foreground">{listing.address}</p>
                    </div>

                    <div>
                        <h4 className="font-semibold mb-2">Facilities & Landmarks:</h4>
                        <ul className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                            {listing.facilities.map(facility => (
                                <li key={facility} className="flex items-center gap-2">
                                    {renderFacilityIcon(facility)}
                                    <span>{facility}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <Separator className="my-4" />

                <div className="flex w-full items-center justify-between">
                    <div className="flex items-center gap-2 text-xl font-semibold text-primary">
                        <Banknote className="h-6 w-6" />
                        <span>₦{listing.price.toLocaleString()}</span>
                        <span className="text-sm font-normal text-muted-foreground">/month</span>
                    </div>
                </div>

                <RentButton listing={listing} />
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
