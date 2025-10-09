'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Listing } from '@/lib/types';
import { MapPin, Banknote, Zap, Droplets, Landmark, Milestone, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"
import React from 'react';


type PropertyCardProps = {
  listing: Listing;
};

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

export function PropertyCard({ listing }: PropertyCardProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const renderFacilityIcon = (facility: string) => {
    const Icon = facilityIcons[facility] || Landmark;
    return <Icon className="h-4 w-4" />;
  };

  const ReservationButton = () => {
    if (listing.status === 'sold') {
      return <Button disabled variant="secondary" className="w-full">Rented</Button>;
    }
    
    return (
        <Button asChild className="w-full">
          <a href="mailto:jvtech.empire@gmail.com?subject=Reservation Inquiry for: ${listing.title}">Request Reservation</a>
        </Button>
    );
  };

  return (
    <Card className="flex h-full flex-col overflow-hidden rounded-xl shadow-md transition-all duration-300 hover:shadow-2xl">
        <Carousel className="relative w-full">
            <CarouselContent>
                {listing.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                        <div className="aspect-h-3 aspect-w-4 relative">
                            <Image
                                src={url}
                                alt={`${listing.title} image ${index + 1}`}
                                fill
                                className="object-cover"
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
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
            <Badge className="absolute top-2 right-2">{listing.type}</Badge>
        </Carousel>

      <CardContent className="flex flex-col flex-grow p-4">
        <h3 className="mb-2 font-headline text-xl leading-tight">
          {listing.title}
        </h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span>{listing.location}</span>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2">
            {listing.facilities.slice(0, 4).map(facility => (
                <Badge key={facility} variant="secondary" className="flex items-center gap-1">
                    {renderFacilityIcon(facility)}
                    <span className="text-xs">{facility}</span>
                </Badge>
            ))}
        </div>

        <div className="flex-grow"></div>

        <div className="mt-4 flex w-full items-center justify-between">
            <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Banknote className="h-5 w-5" />
                <span>₦{listing.price.toLocaleString()}</span>
                <span className="text-sm font-normal text-muted-foreground">/month</span>
            </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full mt-4">
            <CollapsibleContent className="space-y-4 pb-4">
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
            </CollapsibleContent>
            <div className="grid grid-cols-2 gap-2">
                <CollapsibleTrigger asChild>
                    <Button variant="outline">
                        <Info className="mr-2 h-4 w-4" />
                        {isOpen ? 'Hide Details' : 'View Details'}
                    </Button>
                </CollapsibleTrigger>
                <ReservationButton />
            </div>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
