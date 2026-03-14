'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pill, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function LoginPage() {
  const { user, profile, loading, signInWithEmail } = useAuth();
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user && profile) {
      if (profile.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/staff');
      }
    }
  }, [user, profile, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await signInWithEmail(email, password);
      toast.success('Signed in successfully');
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen overflow-hidden bg-slate-900">
      {/* Abstract Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-red-500/30 rounded-full blur-3xl mix-blend-screen opacity-50 animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-rose-500/30 rounded-full blur-3xl mix-blend-screen opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[20%] right-[20%] w-64 h-64 bg-orange-500/20 rounded-full blur-3xl mix-blend-screen opacity-40 animate-pulse" style={{ animationDelay: '4s' }}></div>

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md p-10 backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex flex-col items-center mb-8">
          <div className="p-4 bg-red-500/20 rounded-2xl mb-6 backdrop-blur-md border border-red-500/30 shadow-inner">
            <Pill className="h-10 w-10 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight text-center">HERITAGE MEDICAL DRUG SHOP MALABA</h1>
          <p className="text-red-100/70 mt-3 text-center text-sm font-medium">
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 sm:text-sm transition-all"
              placeholder="Email Address"
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-white/50" />
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-white/20 rounded-xl leading-5 bg-white/5 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 sm:text-sm transition-all"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-red-600 hover:bg-red-500 border border-red-500/50 rounded-xl transition-all duration-300 font-semibold text-white overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed mt-6"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
            {isSubmitting ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-white/40">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
