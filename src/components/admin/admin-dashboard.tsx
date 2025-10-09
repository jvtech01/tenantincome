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
  orderBy
} from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import type { Listing } from '@/lib/types';
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
import { Check, X, Loader2, FileText, User } from 'lucide-react';
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
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'listings'), where('status', '==', 'pending'), orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const listingsData = querySnapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Listing)
      );
      setPendingListings(listingsData);
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

  const handleApprove = async (id: string) => {
    setUpdatingId(id);
    try {
      const listingRef = doc(db, 'listings', id);
      const updateData = { status: 'approved' };
      await updateDoc(listingRef, updateData)
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: `listings/${id}`,
                operation: 'update',
                requestResourceData: updateData,
            });
            errorEmitter.emit('permission-error', permissionError);
            throw error;
        });
      toast({ title: 'Success', description: 'Listing approved.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to approve listing.', variant: 'destructive' });
      console.error(error);
    } finally {
        setUpdatingId(null);
    }
  };

  const handleDelete = async (listing: Listing) => {
    setUpdatingId(listing.id);
    try {
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
          return deleteObject(imageRef);
        }));
      }
      // Delete verification docs from Storage
      if(listing.verification) {
        const billRef = ref(storage, listing.verification.utilityBillUrl);
        const idRef = ref(storage, listing.verification.identityCardUrl);
        await Promise.all([deleteObject(billRef), deleteObject(idRef)]);
      }

      toast({ title: 'Success', description: 'Listing deleted.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete listing.', variant: 'destructive' });
      console.error(error);
    } finally {
        setUpdatingId(null);
    }
  };

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
            <TableHead>Location</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingListings.length > 0 ? (
            pendingListings.map((listing) => (
              <TableRow key={listing.id}>
                <TableCell>
                    <Image src={listing.imageUrls[0]} alt={listing.title} width={80} height={60} className="rounded-md object-cover"/>
                </TableCell>
                <TableCell className="font-medium">{listing.title}</TableCell>
                <TableCell>{listing.location}</TableCell>
                <TableCell>₦{listing.price.toLocaleString()}</TableCell>
                <TableCell>
                  {listing.verification ? (
                    <div className="flex items-center gap-2">
                      <a href={listing.verification.utilityBillUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><FileText className="mr-2 h-4 w-4" /> Bill</Button>
                      </a>
                       <a href={listing.verification.identityCardUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm"><User className="mr-2 h-4 w-4" /> ID</Button>
                      </a>
                    </div>
                  ) : <Badge variant="secondary">No Docs</Badge>}
                </TableCell>
                <TableCell className="text-right">
                  {updatingId === listing.id ? (
                     <Loader2 className="h-5 w-5 animate-spin ml-auto" />
                  ) : (
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600" onClick={() => handleApprove(listing.id)}>
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
                                This action cannot be undone. This will permanently delete the listing.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(listing)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No pending listings.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
