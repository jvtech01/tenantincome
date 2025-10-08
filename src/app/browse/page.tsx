import { redirect } from 'next/navigation';

export default function BrowsePage() {
  redirect('/#listings');
  return null;
}
