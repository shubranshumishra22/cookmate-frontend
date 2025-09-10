"use client";
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isAuthenticated = !!session;
        
        setAuthenticated(isAuthenticated);
        
        // If not authenticated and not on auth page, redirect to auth
        if (!isAuthenticated && pathname !== '/auth') {
          router.push('/auth');
          return;
        }
        
        // If authenticated and on auth page, redirect to home
        if (isAuthenticated && pathname === '/auth') {
          router.push('/');
          return;
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        if (pathname !== '/auth') {
          router.push('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const isAuthenticated = !!session;
      setAuthenticated(isAuthenticated);
      
      if (event === 'SIGNED_OUT' || !isAuthenticated) {
        router.push('/auth');
      } else if (event === 'SIGNED_IN' && pathname === '/auth') {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router, pathname]);

  // Show loading spinner during auth check
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading CookMate...</p>
        </div>
      </div>
    );
  }

  // Show auth page regardless of auth state (it handles its own redirects)
  if (pathname === '/auth') {
    return <>{children}</>;
  }

  // For all other pages, only show if authenticated
  if (authenticated) {
    return <>{children}</>;
  }

  // If not authenticated and not on auth page, show loading while redirect happens
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-slate-600 text-lg">Redirecting...</p>
      </div>
    </div>
  );
}
