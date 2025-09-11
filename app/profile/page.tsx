"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch } from '@/lib/api';

export default function ProfilePage() {
  const [me, setMe] = useState<any>(null);
  const [profile, setProfile] = useState({ name: '', phone: '', block: '', flatNo: '', age: 25 });
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null); // null = checking, true/false = determined
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const profileValid = profile.name.trim().length > 0 && profile.phone.trim().length >= 8;

  const withAuth = async (init: RequestInit = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    };
  };

  const loadMe = async () => {
    try {
      const res = await apiFetch('/me', await withAuth());
      if (res.ok) {
        const user = await res.json();
        setMe(user);
        if (user?.name) {
          setProfile({
            name: user.name || '',
            phone: user.phone || '',
            block: user.block || '',
            flatNo: user.flat_no || '',
            age: user.age || 25
          });
        }
      }
    } catch (err) {
      console.error('Failed to load user:', err);
    }
  };

  const saveProfile = async () => {
    if (!profileValid || saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/profile', await withAuth({
        method: 'POST',
        body: JSON.stringify(profile)
      }));
      
      if (res.ok) {
        await loadMe(); // Refresh user data
        alert('Profile saved successfully!');
      } else {
        const error = await res.json();
        alert(`Failed to save profile: ${error.error}`);
      }
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        setIsAuthed(!!data.session);
        if (data.session) {
          await loadMe();
        }
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthed(!!session);
      if (session) {
        loadMe();
      } else {
        setMe(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl space-y-6">
      {(isLoading || isAuthed === null) && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading profile...</p>
          </div>
        </div>
      )}
      
      {!isLoading && isAuthed === false && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-6 py-4 rounded-xl shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Please <Link href="/auth" className="font-medium underline hover:text-red-900 transition-colors">sign in</Link> to access your profile.
          </div>
        </div>
      )}

      {!isLoading && isAuthed === true && !me?.role && (
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-xl shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Please go back to the <Link href="/" className="font-medium underline hover:text-amber-900 transition-colors">home page</Link> and select your role first.
          </div>
        </div>
      )}

      {!isLoading && isAuthed === true && me?.role && !me?.name && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Complete your profile to start using the platform. Your role: <strong className="font-semibold">{me.role}</strong>
          </div>
        </div>
      )}

      {!isLoading && isAuthed === true && me?.name && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-800 px-6 py-4 rounded-xl shadow-md">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <strong className="font-semibold">Profile Status:</strong> {me.verified ? 'Verified ✅' : 'Pending verification ⏳'} • Role: {me.role}
          </div>
        </div>
      )}

      {!isLoading && isAuthed === true && me?.role && (
        <section className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-8">
            {me?.name ? 'Edit Profile' : 'Create Profile'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
              <input 
                placeholder="Enter your full name" 
                value={profile.name} 
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input 
                placeholder="Enter your phone number" 
                value={profile.phone} 
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Block/Building</label>
              <input 
                placeholder="Enter your block or building" 
                value={profile.block} 
                onChange={(e) => setProfile({ ...profile, block: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Flat Number</label>
              <input 
                placeholder="Enter your flat number" 
                value={profile.flatNo} 
                onChange={(e) => setProfile({ ...profile, flatNo: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
              <input 
                type="number" 
                placeholder="Enter your age" 
                value={profile.age} 
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-slate-900 placeholder-slate-500"
              />
            </div>
            <div className="md:col-span-2 mt-4">
              <button 
                onClick={saveProfile} 
                disabled={!profileValid || saving}
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {saving ? 'Saving...' : (me?.name ? 'Update Profile' : 'Save Profile')}
              </button>
            </div>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}
