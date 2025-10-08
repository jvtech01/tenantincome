import { Footer } from '@/components/layout/footer';
import { Header } from '@/components/layout/header';
import { PaymentPageClient } from '@/components/payment/payment-page-client';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import type { Listing } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getListing(id: string): Promise<Listing | null> {
    const docRef = doc(db, 'listings', id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Listing;
    }
    return null;
}

export default async function PaymentPage({ params }: { params: { listingId: string } }) {
  const listing = await getListing(params.listingId);

  if (!listing) {
    notFound();
  }
  
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 bg-muted/40 py-12">
        <div className="container mx-auto max-w-4xl px-4">
            <PaymentPageClient listing={listing} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
