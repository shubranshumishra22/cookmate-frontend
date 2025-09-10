"use client";
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import LanguageSelector from './LanguageSelector';
import DarkModeToggle from './DarkModeToggle';

export default function Nav() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setEmail(session?.user?.email ?? null));
    return () => { sub.subscription.unsubscribe(); };
  }, []);
  
  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/auth');
  };
  
  return (
    <nav className="bg-gradient-to-r from-white via-blue-50 to-white dark:from-neutral-900 dark:via-neutral-800 dark:to-neutral-900 border-b border-blue-100 dark:border-neutral-700 sticky top-0 z-40 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and primary navigation */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5,1.5C10.73,1.5 9.17,2.67 8.42,4.35C8.16,4.13 7.84,4 7.5,4A2.5,2.5 0 0,0 5,6.5C5,7.38 5.37,8.16 6,8.66V20A2,2 0 0,0 8,22H17A2,2 0 0,0 19,20V8.66C19.63,8.16 20,7.38 20,6.5A2.5,2.5 0 0,0 17.5,4C17.16,4 16.84,4.13 16.58,4.35C15.83,2.67 14.27,1.5 12.5,1.5M12.5,3.5C13.88,3.5 15,4.62 15,6A1,1 0 0,0 16,7A1,1 0 0,0 17,6A0.5,0.5 0 0,1 17.5,5.5A0.5,0.5 0 0,1 18,6A0.5,0.5 0 0,1 17.5,6.5C16.67,6.5 16,7.17 16,8V20H8V8C8,7.17 7.33,6.5 6.5,6.5A0.5,0.5 0 0,1 6,6A0.5,0.5 0 0,1 6.5,5.5A0.5,0.5 0 0,1 7,6A1,1 0 0,0 8,7A1,1 0 0,0 9,6C9,4.62 10.12,3.5 11.5,3.5H12.5Z"/>
              </svg>
              <span>CookMate</span>
            </Link>
            
            {/* Desktop navigation */}
            <div className="hidden lg:ml-8 lg:flex lg:space-x-8">
              <Link 
                href="/" 
                className="text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
              >
                Home
              </Link>
              {email && (
                <Link 
                  href="/profile" 
                  className="text-slate-700 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                >
                  Profile
                </Link>
              )}
            </div>
          </div>

          {/* Right side navigation */}
          <div className="flex items-center space-x-3">
            {/* Dark mode toggle */}
            <div className="hidden sm:block">
              <DarkModeToggle />
            </div>
            
            {/* Language selector */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            
            {/* User info and auth buttons - Desktop */}
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              {email ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Link href="/profile" className="block">
                      <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors cursor-pointer">
                        <span className="text-primary-600 dark:text-primary-300 text-sm font-medium">
                          {email.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </Link>
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 max-w-32 truncate">
                      {email}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="inline-flex items-center px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/auth"
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-800"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {!isMenuOpen ? (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/"
              className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            {email && (
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Profile
              </Link>
            )}
            {/* Mobile controls */}
            <div className="pt-2 border-t border-neutral-200 dark:border-neutral-700">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Theme & Language</span>
                <div className="flex items-center space-x-3">
                  <DarkModeToggle />
                  <LanguageSelector />
                </div>
              </div>
            </div>
          </div>
          <div className="pt-4 pb-3 border-t border-neutral-200 dark:border-neutral-700">
            <div className="px-4 flex items-center">
              {email ? (
                <div className="flex-shrink-0">
                  <Link href="/profile" onClick={() => setIsMenuOpen(false)}>
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors cursor-pointer">
                      <span className="text-primary-600 dark:text-primary-300 font-medium">
                        {email.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  </Link>
                </div>
              ) : null}
              <div className="ml-3">
                <div className="text-base font-medium text-neutral-800 dark:text-neutral-200">
                  {email || 'Guest User'}
                </div>
                <div className="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                  {email || 'Not signed in'}
                </div>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              {email ? (
                <button
                  onClick={logout}
                  className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
