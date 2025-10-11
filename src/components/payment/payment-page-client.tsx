'use client';

import { useState } from 'react';
import type { Listing } from '@/lib/types';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Banknote, Building, Calendar, Loader2, Upload } from 'lucide-react';
import { PaymentBreakdownChart } from './payment-breakdown-chart';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { addDoc, collection, serverTimestamp, doc, runTransaction, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { AuthModal } from '../auth/auth-modal';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

interface PaymentPageClientProps {
    listing: Listing;
}

export function PaymentPageClient({ listing }: PaymentPageClientProps) {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const serviceFee = listing.price * 0.10;
    const totalPrice = listing.price + serviceFee;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleSubmit = async () => {
        if (!user) {
            toast({ title: 'Authentication required', description: 'Please log in to confirm payment.', variant: 'destructive' });
            return;
        }
        if (!receiptFile) {
            toast({ title: 'Receipt required', description: 'Please upload a payment receipt.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const listingRef = doc(db, 'listings', listing.id);

            // Run a transaction to prevent double-booking
            await runTransaction(db, async (transaction) => {
                const listingDoc = await transaction.get(listingRef);
                if (!listingDoc.exists()) {
                    throw new Error("Listing does not exist!");
                }
                const currentListingData = listingDoc.data();
                if (currentListingData.status === 'sold') {
                    throw new Error('This property has already been rented.');
                }
                
                // 1. Upload receipt (do this outside transaction if it's slow, but for now it's ok)
                const receiptRef = ref(storage, `receipts/${user.uid}/${Date.now()}_${receiptFile.name}`);
                await uploadBytes(receiptRef, receiptFile);
                const receiptUrl = await getDownloadURL(receiptRef);

                const paymentData = {
                    listingId: listing.id,
                    userId: user.uid,
                    amount: totalPrice,
                    receiptUrl,
                    createdAt: serverTimestamp(),
                };

                // 2. Create payment record
                const paymentRef = doc(collection(db, 'payments'));
                transaction.set(paymentRef, paymentData);

                // 3. Update listing status to 'sold'
                 const listingUpdateData = {
                    status: 'sold',
                    soldAt: serverTimestamp(),
                };
                transaction.update(listingRef, listingUpdateData);
            });


            toast({ title: 'Payment Confirmed!', description: 'Your payment is being processed. Thank you!' });
            router.push('/');

        } catch (error: any) {
            console.error('Payment submission error:', error);
            if (error.message.includes('already been rented')) {
                 toast({ title: 'Property Unavailable', description: 'Sorry, this property was just rented by someone else.', variant: 'destructive' });
            } else {
                toast({ title: 'Submission Failed', description: 'Could not confirm payment. Please try again.', variant: 'destructive' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const AuthButton = () => {
        if (loading) return <Button className="w-full" disabled><Loader2 className="mr-2 h-4 w-4 animate-spin" />Loading...</Button>;
        if (!user) return <AuthModal><Button className="w-full">Login to Pay</Button></AuthModal>;
        return (
            <Button className="w-full" onClick={handleSubmit} disabled={isSubmitting || listing.status === 'sold'}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {listing.status === 'sold' ? 'Already Rented' : 'Confirm Payment'}
            </Button>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline text-2xl">Confirm Your Rental</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-6 aspect-video w-full overflow-hidden rounded-lg">
                        <Image src={listing.imageUrls[0]} alt={listing.title} fill className="object-cover" />
                    </div>
                    <h3 className="font-headline text-xl">{listing.title}</h3>
                    <p className="text-muted-foreground">{listing.location}</p>
                    <Separator className="my-4" />
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span>Property Type:</span><span className="font-medium">{listing.type}</span></div>
                        <div className="flex justify-between"><span>Base Rent:</span><span className="font-medium">₦{listing.price.toLocaleString()}/month</span></div>
                        <div className="flex justify-between"><span>Service Fee (10%):</span><span className="font-medium">₦{serviceFee.toLocaleString()}</span></div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold"><span>Total Due:</span><span className="text-primary">₦{totalPrice.toLocaleString()}</span></div>
                    </div>
                </CardContent>
                 <CardFooter className="flex-col gap-4">
                    <div className="w-full space-y-2">
                        <Label htmlFor="receipt">Upload Payment Receipt</Label>
                        <Input id="receipt" type="file" onChange={handleFileChange} disabled={isSubmitting || listing.status === 'sold'}/>
                    </div>
                    <AuthButton />
                </CardFooter>
            </Card>

            <div className="space-y-8">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="font-headline text-2xl">Payment Breakdown</CardTitle>
                        <CardDescription>How the total payment is distributed.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PaymentBreakdownChart totalPrice={listing.price} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
