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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

const MAX_IMAGES = 5;

const verificationSchema = z.object({
  listingReason: z.enum(['moving_out', 'finding_flatmate'], {
    required_error: 'You must select a reason for listing.',
  }),
  utilityBill: z.instanceof(File).refine(file => file, 'A recent utility bill is required.'),
  identityCard: z.instanceof(File).refine(file => file, "Your NIN slip or Voter's Card is required."),
});

const listingSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  location: z.string().min(3, 'Location is required'),
  address: z.string().min(10, 'A detailed address is required'),
  type: z.enum(['Apartment', 'House', 'Villa']),
  price: z.coerce.number().positive('Price must be a positive number'),
  images: z.array(z.instanceof(File))
    .min(1, 'At least one image is required.')
    .max(MAX_IMAGES, `You can upload a maximum of ${MAX_IMAGES} images.`),
  facilities: z.string().min(3, 'List at least one facility, separated by commas.'),
});

const sharedApartmentSchema = listingSchema.extend({
  type: z.literal('Shared', {
    errorMap: () => ({ message: 'This must be a Shared apartment.' }),
  }),
});


type VerificationFormValues = z.infer<typeof verificationSchema>;
type ListingFormValues = z.infer<typeof listingSchema>;


export function ListingForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationData, setVerificationData] = useState<VerificationFormValues | null>(null);

  const verificationForm = useForm<VerificationFormValues>({
    resolver: zodResolver(verificationSchema),
  });

  const listingForm = useForm<ListingFormValues>({
    resolver: zodResolver(verificationData?.listingReason === 'finding_flatmate' ? sharedApartmentSchema : listingSchema),
    defaultValues: {
      title: '',
      description: '',
      location: '',
      address: '',
      type: verificationData?.listingReason === 'finding_flatmate' ? 'Shared' : 'Apartment',
      price: 0,
      images: [],
      facilities: '',
    },
  });

  const onVerificationSubmit: SubmitHandler<VerificationFormValues> = (data) => {
    setVerificationData(data);
    listingForm.reset({
      ...listingForm.formState.defaultValues,
      type: data.listingReason === 'finding_flatmate' ? 'Shared' : 'Apartment',
    });
  };

  const onListingSubmit: SubmitHandler<ListingFormValues> = async (data) => {
    if (!user || !verificationData) {
      toast({ title: 'Error', description: 'Verification data is missing. Please start over.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const utilityBillRef = ref(storage, `verification/${user.uid}/utilityBill_${Date.now()}`);
      const identityCardRef = ref(storage, `verification/${user.uid}/identityCard_${Date.now()}`);
      
      const [utilityBillUrl, identityCardUrl] = await Promise.all([
        uploadBytes(utilityBillRef, verificationData.utilityBill).then(snapshot => getDownloadURL(snapshot.ref)),
        uploadBytes(identityCardRef, verificationData.identityCard).then(snapshot => getDownloadURL(snapshot.ref)),
      ]);
      
      const imageUrls = await Promise.all(
        data.images.map(async (image) => {
          const imageRef = ref(storage, `listings/${user.uid}/${Date.now()}_${image.name}`);
          const uploadTask = await uploadBytes(imageRef, image);
          return getDownloadURL(uploadTask.ref);
        })
      );
      
      const facilitiesArray = data.facilities.split(',').map(f => f.trim()).filter(f => f);

      const listingData = {
        ...data,
        type: verificationData.listingReason === 'finding_flatmate' ? 'Shared' : data.type,
        imageUrls,
        facilities: facilitiesArray,
        imageHint: `${data.type} ${data.location}`,
        ownerId: user.uid,
        status: 'pending',
        createdAt: serverTimestamp(),
        verification: {
          utilityBillUrl,
          identityCardUrl,
          listingReason: verificationData.listingReason,
        }
      };
      
      delete (listingData as any).images;

      await addDoc(collection(db, 'listings'), listingData).catch(error => {
        const permissionError = new FirestorePermissionError({
          path: 'listings',
          operation: 'create',
          requestResourceData: listingData,
        });
        errorEmitter.emit('permission-error', permissionError);
        throw error; // Re-throw to be caught by outer catch block
      });

      toast({
        title: 'Success!',
        description: 'Your listing is awaiting admin approval.',
        variant: 'default',
      });
      listingForm.reset();
      setVerificationData(null);
      router.push('/');

    } catch (error) {
      console.error('Error creating listing:', error);
      // Don't show a generic toast if it's a permission error, as it's handled globally
      if (!(error instanceof FirestorePermissionError)) {
          toast({
            title: 'Error',
            description: 'Failed to create listing. Please try again.',
            variant: 'destructive',
          });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!verificationData) {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Verification</CardTitle>
                <CardDescription>First, let's verify your identity to ensure eligibility for the 5% commission.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...verificationForm}>
                    <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-6">
                        <FormField
                            control={verificationForm.control}
                            name="listingReason"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                <FormLabel>Why are you creating this listing?</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-col space-y-1"
                                    >
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="moving_out" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        I'm moving out and want to list a new, empty property.
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-3 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="finding_flatmate" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                        I'm looking for a flatmate for a shared apartment.
                                        </FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={verificationForm.control}
                            name="utilityBill"
                            render={({ field: { onChange, ...rest } }) => (
                                <FormItem>
                                <FormLabel>Latest House Bill</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*,.pdf" onChange={e => onChange(e.target.files?.[0])} {...rest} />
                                </FormControl>
                                <FormDescription>e.g., electricity, water, or waste bill. Must show your name and address.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={verificationForm.control}
                            name="identityCard"
                            render={({ field: { onChange, ...rest } }) => (
                                <FormItem>
                                <FormLabel>NIN Slip or Voter's Card</FormLabel>
                                <FormControl>
                                    <Input type="file" accept="image/*,.pdf" onChange={e => onChange(e.target.files?.[0])} {...rest} />
                                </FormControl>
                                <FormDescription>Used to verify your identity.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">Proceed to Listing Details</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
  }

  return (
    <Form {...listingForm}>
      <form onSubmit={listingForm.handleSubmit(onListingSubmit)} className="space-y-6 mt-6">
        <Button variant="link" onClick={() => setVerificationData(null)} className="p-0 h-auto">&larr; Go Back to Verification</Button>
        <FormField
          control={listingForm.control}
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
          control={listingForm.control}
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
            control={listingForm.control}
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
            control={listingForm.control}
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
            control={listingForm.control}
            name="type"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Property Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={verificationData?.listingReason === 'finding_flatmate'}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a property type" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {verificationData?.listingReason === 'finding_flatmate' ? (
                            <SelectItem value="Shared">Shared Apartment</SelectItem>
                        ) : (
                            <>
                                <SelectItem value="Apartment">Apartment</SelectItem>
                                <SelectItem value="House">House</SelectItem>
                                <SelectItem value="Villa">Villa</SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
                control={listingForm.control}
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
            control={listingForm.control}
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
            control={listingForm.control}
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
