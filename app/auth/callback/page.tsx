"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Handle the auth callback
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          router.push('/auth?error=callback_failed');
          return;
        }

        if (data.session) {
          // User is authenticated, redirect to home
          console.log('Auth callback successful, user authenticated');
          router.push('/');
        } else {
          // No session, redirect to auth page
          console.log('No session found, redirecting to auth');
          router.push('/auth');
        }
      } catch (error) {
        console.error('Unexpected auth callback error:', error);
        router.push('/auth?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center">
      <div className="text-center bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/50 shadow-xl">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.5,1.5C10.73,1.5 9.17,2.67 8.42,4.35C8.16,4.13 7.84,4 7.5,4A2.5,2.5 0 0,0 5,6.5C5,7.38 5.37,8.16 6,8.66V20A2,2 0 0,0 8,22H17A2,2 0 0,0 19,20V8.66C19.63,8.16 20,7.38 20,6.5A2.5,2.5 0 0,0 17.5,4C17.16,4 16.84,4.13 16.58,4.35C15.83,2.67 14.27,1.5 12.5,1.5M12.5,3.5C13.88,3.5 15,4.62 15,6A1,1 0 0,0 16,7A1,1 0 0,0 17,6A0.5,0.5 0 0,1 17.5,5.5A0.5,0.5 0 0,1 18,6A0.5,0.5 0 0,1 17.5,6.5C16.67,6.5 16,7.17 16,8V20H8V8C8,7.17 7.33,6.5 6.5,6.5A0.5,0.5 0 0,1 6,6A0.5,0.5 0 0,1 6.5,5.5A0.5,0.5 0 0,1 7,6A1,1 0 0,0 8,7A1,1 0 0,0 9,6C9,4.62 10.12,3.5 11.5,3.5H12.5Z"/>
          </svg>
        </div>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Verifying your email...</h2>
        <p className="text-slate-600 max-w-sm">Please wait while we complete your sign-up and redirect you to CookMate</p>
      </div>
    </div>
  );
}
