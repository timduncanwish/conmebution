// Root page - redirect to default locale
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale
  redirect('/zh');
}
