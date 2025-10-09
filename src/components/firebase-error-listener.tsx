'use client';

import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/lib/firebase/error-emitter';

export function FirebaseErrorListener() {
  const { toast } = useToast();

  useEffect(() => {
    const handleError = (error: Error) => {
      console.error(error); // Also log to console for dev visibility

      // In a real app, you might use a reporting service like Sentry here.
      // For this example, we'll show a toast.
      toast({
        variant: 'destructive',
        title: 'Permissions Error',
        description: 'You do not have permission to perform this action.',
      });
    };

    errorEmitter.on('permission-error', handleError);

    // No cleanup function is returned, so the listener persists
  }, [toast]);

  return null; // This component doesn't render anything
}
