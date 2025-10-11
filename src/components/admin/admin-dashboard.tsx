'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import type { Listing, Payment } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Check, X, Loader2, FileText, User, Banknote } from 'lucide-react';
import Image from 'next/image';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from "@/components/ui/alert-dialog";
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

export function AdminDashboard() {
  const [pendingListings, setPendingListings] = useState<Listing[]>([]);
  const [payments, setPayments] = useState<Record<string, Payment>>({});
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const listingsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Listing)
      );
      setPendingListings(listingsData);
      
      // Fetch related payments for these pending listings
      if (listingsData.length > 0) {
        const listingIds = listingsData.map(l => l.id);
        const paymentsQuery = query(collection(db, 'payments'), where('listingId', 'in', listingIds), where('status', '==', 'pending_confirmation'));
        const paymentsSnapshot = await getDocs(paymentsQuery);
        const paymentsData: Record<string, Payment> = {};
        paymentsSnapshot.forEach(doc => {
            const payment = {id: doc.id, ...doc.data()} as Payment;
            paymentsData[payment.listingId] = payment;
        });
        setPayments(paymentsData);
      }
      
      setLoading(false);
    }, (error) => {
        const permissionError = new FirestorePermissionError({
            path: 'listings',
            operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleApprove = async (id: string, isPaymentApproval: boolean) => {
    setUpdatingId(id);
    try {
      const listingRef = doc(db, 'listings', id);
      const newStatus = isPaymentApproval ? 'sold' : 'approved';
      const updateData = { status: newStatus };
      
      const batch = writeBatch(db);
      batch.update(listingRef, updateData);

      // If it's a payment approval, also update the payment status
      if(isPaymentApproval && payments[id]) {
        const paymentRef = doc(db, 'payments', payments[id].id);
        batch.update(paymentRef, { status: 'confirmed' });
      }

      await batch.commit()
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: `listings/${id}`,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw error;
        });

      toast({ title: 'Success', description: `Listing ${newStatus}.` });
    } catch (error) {
      toast({ title: 'Error', description: `Failed to approve listing.`, variant: 'destructive' });
      console.error(error);
    } finally {
        setUpdatingId(null);
    }
  };
  
  const handleReject = async (listing: Listing, isPaymentRejection: boolean) => {
    setUpdatingId(listing.id);
    try {
        if(isPaymentRejection) {
            // Revert listing to 'approved' so others can rent it
            const listingRef = doc(db, 'listings', listing.id);
            await updateDoc(listingRef, { status: 'approved' });

             // Optionally, delete the payment record
            if (payments[listing.id]) {
                const paymentRef = doc(db, 'payments', payments[listing.id].id);
                await deleteDoc(paymentRef);
                const receiptRef = ref(storage, payments[listing.id].receiptUrl);
                await deleteObject(receiptRef);
            }
            toast({ title: 'Success', description: 'Payment rejected. Listing is available again.' });

        } else {
             // This is a rejection of a new listing, so delete everything
            await handleDelete(listing);
        }
    } catch(error) {
         toast({ title: 'Error', description: 'Failed to reject.', variant: 'destructive' });
         console.error(error);
    } finally {
        setUpdatingId(null);
    }
  }


  const handleDelete = async (listing: Listing) => {
      // Delete Firestore document
      await deleteDoc(doc(db, 'listings', listing.id))
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: `listings/${listing.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
            throw error;
        });
      
      // Delete images from Storage
      if (listing.imageUrls && listing.imageUrls.length > 0) {
        await Promise.all(listing.imageUrls.map(url => {
          const imageRef = ref(storage, url);
          return deleteObject(imageRef).catch(err => console.log(err));
        }));
      }
      // Delete verification docs from Storage
      if(listing.verification) {
        const billRef = ref(storage, listing.verification.utilityBillUrl);
        const idRef = ref(storage, listing.verification.identityCardUrl);
        await Promise.all([deleteObject(billRef).catch(err => console.log(err)), deleteObject(idRef).catch(err => console.log(err))]);
      }

      toast({ title: 'Success', description: 'Listing deleted.' });
  };
  
  const getActionType = (listing: Listing) => {
    if (payments[listing.id]) {
        return 'payment'; // This is a pending payment
    }
    return 'listing'; // This is a new listing submission
  }


  if (loading) {
    return <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Image</TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Review Type</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingListings.length > 0 ? (
            pendingListings.map((listing) => {
              const actionType = getActionType(listing);
              const isPaymentReview = actionType === 'payment';

              return (
              <TableRow key={listing.id}>
                <TableCell>
                    <Image src={listing.imageUrls[0]} alt={listing.title} width={80} height={60} className="rounded-md object-cover"/>
                </TableCell>
                <TableCell className="font-medium">{listing.title}<br/><span className="text-sm text-muted-foreground">{listing.location} | ₦{listing.price.toLocaleString()}</span></TableCell>
                <TableCell>
                   {isPaymentReview ? <Badge>Payment</Badge> : <Badge variant="secondary">New Listing</Badge>}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {listing.verification && (
                        <>
                        <a href={listing.verification.utilityBillUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Bill</Button>
                        </a>
                        <a href={listing.verification.identityCardUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm"><User className="mr-2 h-4 w-4" /> ID</Button>
                        </a>
                        </>
                    )}
                    {isPaymentReview && payments[listing.id] && (
                         <a href={payments[listing.id].receiptUrl} target="_blank" rel="noopener noreferrer">
                            <Button variant="outline" size="sm" className="text-primary border-primary"><Banknote className="mr-2 h-4 w-4" /> Receipt</Button>
                        </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {updatingId === listing.id ? (
                     <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleApprove(listing.id, isPaymentReview)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-600">
                                <X className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                {isPaymentReview 
                                ? "This will reject the payment and make the listing available again."
                                : "This will permanently delete the new listing submission."
                                }
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleReject(listing, isPaymentReview)}>
                                {isPaymentReview ? 'Reject Payment' : 'Delete Listing'}
                            </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            )})
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No pending items for review.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

    