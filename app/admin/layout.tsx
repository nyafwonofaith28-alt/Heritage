'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Sidebar } from '@/components/sidebar';
import { Menu } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/');
      } else if (profile?.role !== 'admin') {
        router.push('/staff');
      }
    }
  }, [user, profile, loading, router]);

  if (loading || !user || profile?.role !== 'admin') {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-50 relative overflow-hidden">
      {/* Animated Professional Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-gradient-to-br from-red-500/10 to-rose-500/5 rounded-full blur-3xl mix-blend-multiply opacity-60 animate-[pulse_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-gradient-to-tl from-orange-500/10 to-red-500/5 rounded-full blur-3xl mix-blend-multiply opacity-60 animate-[pulse_10s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute top-[30%] right-[20%] w-[40%] h-[40%] bg-gradient-to-tr from-rose-400/10 to-red-600/5 rounded-full blur-3xl mix-blend-multiply opacity-40 animate-[pulse_12s_ease-in-out_infinite]"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <Sidebar role="admin" isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen} />

      <div className="flex flex-col flex-1 overflow-hidden z-10 relative">
        {/* Header */}
        <header className="bg-red-900/90 backdrop-blur-md text-white py-4 px-4 md:px-6 shadow-sm z-20 flex items-center justify-between shrink-0 rounded-2xl mx-4 md:mx-8 mt-4 md:mt-6 mb-2 border border-red-800/50">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 bg-white/10 hover:bg-white/20 rounded-lg backdrop-blur-sm border border-white/20 transition-colors"
            >
              <Menu className="h-5 w-5 text-white" />
            </button>
            <div className="hidden md:block p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"><path d="m10.5 20.5 10-10a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7Z"/><path d="m8.5 8.5 7 7"/></svg>
            </div>
            <h1 className="text-lg md:text-2xl font-bold tracking-widest uppercase truncate">HERITAGE MEDICAL DRUG SHOP MALABA</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <div className="text-xs md:text-sm text-red-100 font-medium bg-red-950/50 px-2 md:px-3 py-1 md:py-1.5 rounded-full border border-red-800/50 whitespace-nowrap">
              Admin Portal
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-2 md:pt-4">
          {children}
        </main>

        {/* Footer */}
        <footer className="bg-black text-white py-3 px-6 text-center text-sm shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-20 relative">
          <p className="font-medium tracking-wide">
            System by <a href="https://wa.me/256765749940" target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-400 transition-colors font-bold underline decoration-red-500/30 underline-offset-4">Isleeve Daniel</a>
          </p>
        </footer>
      </div>
    </div>
  );
}
