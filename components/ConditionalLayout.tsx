"use client";
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import Nav from '@/components/Nav';

interface ConditionalLayoutProps {
  children: ReactNode;
}

export default function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  
  // Pages where we don't want to show navbar and footer
  const authPages = ['/auth', '/auth/callback'];
  const isAuthPage = authPages.includes(pathname);

  if (isAuthPage) {
    // Return children without navbar/footer for auth pages
    return <>{children}</>;
  }

  // Return full layout with navbar and footer for other pages
  return (
    <div className="min-h-full flex flex-col">
      <Nav />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-neutral-900 text-neutral-100 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-2">
            <p className="text-sm">
              © 2025 CookMate. All rights reserved.
            </p>
            <p className="text-xs text-neutral-400">
              Created by <a 
                href="https://www.linkedin.com/in/shubranshu-shekhar-633192299/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-medium text-neutral-300 hover:text-blue-400 transition-colors duration-200 underline decoration-dotted hover:decoration-solid"
              >
                Shubranshu Shekhar
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
