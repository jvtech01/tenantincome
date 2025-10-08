import Link from 'next/link';
import { Home } from 'lucide-react';

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <Home className="h-7 w-7 text-primary" />
      <span className="font-headline text-2xl font-bold text-foreground">
        JVHOUZIN
      </span>
    </Link>
  );
}
