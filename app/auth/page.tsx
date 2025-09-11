"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase, getRedirectURL } from '@/lib/supabaseClient';

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.push('/');
        return;
      }
      setLoading(false);
    };

    checkAuth();

    // Listen for successful authentication
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/');
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12.5,1.5C10.73,1.5 9.17,2.67 8.42,4.35C8.16,4.13 7.84,4 7.5,4A2.5,2.5 0 0,0 5,6.5C5,7.38 5.37,8.16 6,8.66V20A2,2 0 0,0 8,22H17A2,2 0 0,0 19,20V8.66C19.63,8.16 20,7.38 20,6.5A2.5,2.5 0 0,0 17.5,4C17.16,4 16.84,4.13 16.58,4.35C15.83,2.67 14.27,1.5 12.5,1.5M12.5,3.5C13.88,3.5 15,4.62 15,6A1,1 0 0,0 16,7A1,1 0 0,0 17,6A0.5,0.5 0 0,1 17.5,5.5A0.5,0.5 0 0,1 18,6A0.5,0.5 0 0,1 17.5,6.5C16.67,6.5 16,7.17 16,8V20H8V8C8,7.17 7.33,6.5 6.5,6.5A0.5,0.5 0 0,1 6,6A0.5,0.5 0 0,1 6.5,5.5A0.5,0.5 0 0,1 7,6A1,1 0 0,0 8,7A1,1 0 0,0 9,6C9,4.62 10.12,3.5 11.5,3.5H12.5Z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                CookMate
              </h1>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">
            Welcome Back
          </h2>
          <p className="text-slate-600 max-w-sm mx-auto">
            Connect with trusted local cooking services and household help in your area
          </p>
        </div>
      </div>

      {/* Auth Form */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-8">
          <Auth 
            supabaseClient={supabase} 
            appearance={{ 
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    brandButtonText: 'white',
                    defaultButtonBackground: '#f8fafc',
                    defaultButtonBackgroundHover: '#f1f5f9',
                    defaultButtonBorder: '#e2e8f0',
                    defaultButtonText: '#334155',
                    dividerBackground: '#e2e8f0',
                    inputBackground: 'white',
                    inputBorder: '#e2e8f0',
                    inputBorderHover: '#cbd5e1',
                    inputBorderFocus: '#3b82f6',
                    inputText: '#1e293b',
                    inputLabelText: '#475569',
                    inputPlaceholder: '#94a3b8',
                    messageText: '#dc2626',
                    messageTextDanger: '#dc2626',
                    anchorTextColor: '#3b82f6',
                    anchorTextHoverColor: '#2563eb',
                  },
                  space: {
                    spaceSmall: '4px',
                    spaceMedium: '8px',
                    spaceLarge: '16px',
                    labelBottomMargin: '8px',
                    anchorBottomMargin: '4px',
                    emailInputSpacing: '4px',
                    socialAuthSpacing: '4px',
                    buttonPadding: '10px 15px',
                    inputPadding: '12px 15px',
                  },
                  fontSizes: {
                    baseBodySize: '14px',
                    baseInputSize: '16px',
                    baseLabelSize: '14px',
                    baseButtonSize: '14px',
                  },
                  fonts: {
                    bodyFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    buttonFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    inputFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                    labelFontFamily: `'Inter', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif`,
                  },
                  borderWidths: {
                    buttonBorderWidth: '1px',
                    inputBorderWidth: '1px',
                  },
                  radii: {
                    borderRadiusButton: '8px',
                    buttonBorderRadius: '8px',
                    inputBorderRadius: '8px',
                  },
                }
              },
              className: {
                anchor: 'font-medium transition-colors duration-200',
                button: 'font-medium transition-all duration-200 shadow-sm hover:shadow-md',
                container: 'space-y-6',
                divider: 'my-6',
                input: 'transition-all duration-200 font-medium',
                label: 'font-medium text-slate-700',
                message: 'text-sm font-medium',
              }
            }} 
            providers={[]}
            redirectTo={getRedirectURL()}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email address',
                  password_label: 'Password',
                  button_label: 'Sign in to your account',
                  loading_button_label: 'Signing in...',
                  social_provider_text: 'Sign in with {{provider}}',
                  link_text: 'Already have an account? Sign in'
                },
                sign_up: {
                  email_label: 'Email address',
                  password_label: 'Create a password',
                  button_label: 'Create your account',
                  loading_button_label: 'Creating account...',
                  social_provider_text: 'Sign up with {{provider}}',
                  link_text: "Don't have an account? Sign up"
                },
                magic_link: {
                  email_input_label: 'Email address',
                  email_input_placeholder: 'Enter your email',
                  button_label: 'Send magic link',
                  loading_button_label: 'Sending magic link...',
                  link_text: 'Send a magic link email'
                },
                forgotten_password: {
                  email_label: 'Email address',
                  button_label: 'Send reset instructions',
                  loading_button_label: 'Sending reset instructions...',
                  link_text: 'Forgot your password?'
                }
              }
            }}
          />
        </div>
        
        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-slate-500">
            By signing up, you agree to our{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="mt-12 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Verified Providers</h3>
            <p className="text-xs text-slate-600">All service providers are background checked and verified</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Flexible Timing</h3>
            <p className="text-xs text-slate-600">Book services that fit your schedule and preferences</p>
          </div>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-xl p-6 border border-white/50">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">Local Community</h3>
            <p className="text-xs text-slate-600">Connect with trusted providers in your neighborhood</p>
          </div>
        </div>
      </div>
    </div>
  );
}
