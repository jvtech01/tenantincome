'use client';

import { ReactNode, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { Chrome } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export function AuthModal({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user, signInWithGoogle } = useAuth();

  useEffect(() => {
    if (user) {
      setOpen(false);
    }
  }, [user]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center font-headline text-2xl">
            Welcome to JVHOUZIN
          </DialogTitle>
          <DialogDescription className="text-center">
            Sign in to continue
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Button
            className="w-full"
            onClick={signInWithGoogle}
          >
            <Chrome className="mr-2 h-4 w-4" />
            Sign in with Google
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
