'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import {
  addDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MAX_IMAGES = 5;

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(3, 'Location is required'),
  address: z.string().min(10, 'A detailed address is required'),
  type: z.enum(['Apartment', 'Shared', 'House', 'Villa']),
  price: z.coerce.number().positive('Price must be a positive number'),
  images: z.array(z.instanceof(File))
    .min(1, 'At least one image is required.')
    .max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
  facilities: z.string().min(3, 'List at least one facility, separated by commas.'),
});

type ListingFormValues = z.infer<typeof listingSchema>;

export function ListingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      address: '',
      type: 'Apartment',
      price: 0,
      images: [],
      facilities: '',
    },
  });

  const onSubmit: SubmitHandler<ListingFormValues> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to list a property.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Upload images to Firebase Storage
      const imageUrls = await Promise.all(
        data.images.map(async (image) => {
          const imageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${image.name}`);
          const uploadTask = await uploadBytes(imageRef, image);
          return getDownloadURL(uploadTask.ref);
        })
      );
      
      const facilitiesArray = data.facilities.split(',').map(f => f.trim()).filter(f => f);

      const listingData = {
        title: data.title,
        description: data.description,
        location: data.location,
        address: data.address,
        type: data.type,
        price: data.price,
        imageUrls,
        facilities: facilitiesArray,
        imageHint: `${data.type} ${data.location}`,
        ownerId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      // 2. Create listing document in Firestore
      addDoc(collection(db, 'listings'), listingData).catch(error => {
        const permissionError = new FirestorePermissionError({
          path: 'listings',
          operation: 'create',
          requestResourceData: listingData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw error;
      });

      toast({
        title: 'Success!',
        description: 'Your listing is awaiting admin approval.',
        variant: 'default',
      });
      form.reset();
      router.push('/');
    } catch (error) {
      console.error('Error creating listing:', error);
      toast({
        title: 'Error',
        description: 'Failed to create listing. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Cozy 2-Bedroom Apartment" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Describe your property..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
                <FormItem>
                <FormLabel>City/Area</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Lekki, Lagos" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="address"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Full Address</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 123 Fola Osibo Street" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="Apartment">Apartment</SelectItem>
                        <SelectItem value="Shared">Shared Room</SelectItem>
                        <SelectItem value="House">House</SelectItem>
                        <SelectItem value="Villa">Villa</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (₦ per month)</FormLabel>
                    <FormControl>
                        <Input type="number" placeholder="e.g., 250000" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="facilities"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Facilities & Nearby Landmarks</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., 24/7 Light, Good Roads, Shoprite Mall" {...field} />
                </FormControl>
                 <p className="text-xs text-muted-foreground">Separate items with a comma.</p>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="images"
            render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
                <FormLabel>Property Images (up to {MAX_IMAGES})</FormLabel>
                <FormControl>
                    <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        onChange(files.slice(0, MAX_IMAGES));
                    }}
                    {...rest}
                    />
                </FormControl>
                <FormMessage />
            </FormItem>
            )}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </form>
    </Form>
  );
}
