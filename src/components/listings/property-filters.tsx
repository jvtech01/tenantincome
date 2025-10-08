'use client';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import React from 'react';

type Filters = {
  location: string;
  type: string;
  priceRange: [number, number];
};

type PropertyFiltersProps = {
  onFilterChange: (filters: Filters) => void;
};

export function PropertyFilters({ onFilterChange }: PropertyFiltersProps) {
  const [location, setLocation] = React.useState('');
  const [type, setType] = React.useState('all');
  const [priceRange, setPriceRange] = React.useState<[number, number]>([0, 5000]);

  React.useEffect(() => {
    onFilterChange({ location, type, priceRange });
  }, [location, type, priceRange, onFilterChange]);
  
  const handlePriceChange = (value: number[]) => {
    setPriceRange(value as [number, number]);
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
            <div className="md:col-span-2">
                <Label htmlFor="location-search" className="mb-2 block text-sm font-medium">Location</Label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        id="location-search"
                        placeholder="Search by city, neighborhood..."
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>
            <div>
                <Label htmlFor="type-select" className="mb-2 block text-sm font-medium">Property Type</Label>
                <Select value={type} onValueChange={setType}>
                    <SelectTrigger id="type-select">
                        <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="Shared">Shared Room</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Villa">Villa</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div>
                <Label className="mb-2 block text-sm font-medium">Price Range</Label>
                <div className="flex flex-col gap-2">
                    <Slider
                        min={0}
                        max={10000}
                        step={100}
                        value={priceRange}
                        onValueChange={handlePriceChange}
                    />
                    <div className="text-sm text-muted-foreground">
                        ${priceRange[0]} - ${priceRange[1] === 10000 ? '10000+' : priceRange[1]}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
}
