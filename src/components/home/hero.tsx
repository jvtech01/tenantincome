import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative bg-card">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 py-16 lg:grid-cols-2 lg:py-24">
        <div className="text-center lg:text-left">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Tenant Powered Rentals.
            <br />
            <span className="text-primary">No Agents.</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground md:text-xl">
            Earn 5% for Listing Your Apartment. A revolutionary way to find and list rental properties, putting the power back in the hands of tenants.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
            <Button size="lg" asChild>
              <Link href="#listings">Browse Properties</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/list">List Your Apartment</Link>
            </Button>
          </div>
        </div>
        <div className="relative h-64 w-full lg:h-auto lg:aspect-[4/3]">
           <Image
              src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop"
              alt="Modern house"
              fill
              className="rounded-lg object-cover shadow-lg"
              data-ai-hint="modern house"
            />
        </div>
      </div>
    </section>
  );
}
