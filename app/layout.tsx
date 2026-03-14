import type {Metadata} from 'next';
import { Jost } from 'next/font/google';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css'; // Global styles

const jost = Jost({
  subsets: ['latin'],
  variable: '--font-jost',
});

export const metadata: Metadata = {
  title: 'HERITAGE MEDICAL DRUG SHOP MALABA',
  description: 'Drug Shop Management System',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={`${jost.variable} font-sans`}>
      <body suppressHydrationWarning className="bg-slate-50 text-slate-900 min-h-screen">
        <AuthProvider>
          {children}
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
