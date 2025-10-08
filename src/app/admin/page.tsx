'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || !user.isAdmin) {
        router.push('/');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || !user.isAdmin) {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container py-12">
                <div className="space-y-4">
                    <Skeleton className="h-10 w-48" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </main>
            <Footer />
        </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 bg-muted/40 py-12">
        <div className="container mx-auto px-4">
            <h1 className="font-headline text-3xl font-bold mb-8">Admin Dashboard</h1>
            <AdminDashboard />
        </div>
      </main>
      <Footer />
    </div>
  );
}
