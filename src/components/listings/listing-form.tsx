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

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(3, 'Location is required'),
  type: z.enum(['Apartment', 'Shared', 'House', 'Villa']),
  price: z.coerce.number().positive('Price must be a positive number'),
  image: z.instanceof(File).refine((file) => file.size > 0, 'An image is required.'),
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
      type: 'Apartment',
      price: 0,
    },
  });

  const onSubmit: SubmitHandler<ListingFormValues> = async (data) => {
    if (!user) {
      toast({ title: 'Error', description: 'You must be logged in to list a property.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      // 1. Upload image to Firebase Storage
      const imageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${data.image.name}`);
      await uploadBytes(imageRef, data.image);
      const imageUrl = await getDownloadURL(imageRef);

      // 2. Create listing document in Firestore
      await addDoc(collection(db, 'listings'), {
        title: data.title,
        description: data.description,
        location: data.location,
        type: data.type,
        price: data.price,
        imageUrl,
        imageHint: `${data.type} ${data.location}`,
        ownerId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
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
                <FormLabel>Location</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., New York, NY" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
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
        </div>
        <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Price (per month)</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="e.g., 2500" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <FormField
            control={form.control}
            name="image"
            render={({ field: { onChange, value, ...rest } }) => (
            <FormItem>
                <FormLabel>Property Image</FormLabel>
                <FormControl>
                    <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)}
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
