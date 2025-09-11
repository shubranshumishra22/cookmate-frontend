import './globals.css';
import { ReactNode } from 'react';
import Nav from '@/components/Nav';
import AuthGuard from '@/components/AuthGuard';
import ConditionalLayout from '@/components/ConditionalLayout';

export const metadata = {
  title: {
    default: 'CookMate - Connect with Local Cooking Services',
    template: '%s | CookMate'
  },
  description: 'Find trusted local cooking services and household help. Connect with verified cooks and service providers in your area.',
  keywords: ['cooking services', 'maid services', 'household help', 'local cooks', 'home services'],
  authors: [{ name: 'CookMate Team' }],
  creator: 'CookMate',
  publisher: 'CookMate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://cookmate.com',
    siteName: 'CookMate',
    title: 'CookMate - Connect with Local Cooking Services',
    description: 'Find trusted local cooking services and household help. Connect with verified cooks and service providers in your area.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'CookMate - Local Cooking Services',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CookMate - Connect with Local Cooking Services',
    description: 'Find trusted local cooking services and household help.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="h-full bg-neutral-50 text-neutral-900 antialiased">
        {/* Skip to content link for accessibility */}
        <a 
          href="#main-content" 
          className="skip-to-content sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-primary-600 text-white px-4 py-2 rounded-md z-50"
        >
          Skip to main content
        </a>
        
        <AuthGuard>
          <ConditionalLayout>
            {children}
          </ConditionalLayout>
        </AuthGuard>
      </body>
    </html>
  );
}
