'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/lib/firebase/error-emitter';
import { FirestorePermissionError } from '@/lib/firebase/errors';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.error("Caught a Firestore permission error:", error.message);
      
      // We are now throwing the full contextual error in development environments.
      // In production, you might want to log this to a service like Sentry.
      if (process.env.NODE_ENV === 'development') {
        throw error;
      } else {
        // For production, show a generic toast.
        toast({
          variant: 'destructive',
          title: 'Permissions Error',
          description: 'You do not have permission to perform this action.',
        });
      }
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.off('permission-error', handleError);
    }
  }, [toast]);

  return null;
}
