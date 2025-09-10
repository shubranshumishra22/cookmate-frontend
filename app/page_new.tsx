"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '../lib/supabaseClient';
import { apiFetch } from '../lib/api';
import TranslateButton from '../components/TranslateButton';

export default function Home() {
  const [me, setMe] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [requirements, setRequirements] = useState<any[]>([]);
  const [myServices, setMyServices] = useState<any[]>([]);
  const [svcForm, setSvcForm] = useState({ 
    title: '', 
    cuisine: 'BOTH', 
    price: 0, 
    serviceArea: '', 
    availableTiming: '', 
    description: '' 
  });
  const [reqForm, setReqForm] = useState({ 
    needType: 'BOTH', 
    details: '', 
    preferredTiming: '', 
    preferredPrice: 0, 
    block: '', 
    flatNo: '', 
    urgency: 'MEDIUM' 
  });
  const [msg, setMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'requirements'>('services');

  useEffect(() => {
    loadUserData();
    loadPublic();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        loadUserData();
      } else {
        setMe(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;
    
    const res = await apiFetch('/me', { 
      headers: { Authorization: `Bearer ${data.session.access_token}` } 
    });
    if (res.ok) {
      const userData = await res.json();
      setMe(userData);
      if (userData?.role === 'WORKER') {
        loadMine();
      }
    }
  };

  const selectRole = async (role: string) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await apiFetch('/select-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ role })
    });
    if (res.ok) {
      loadUserData();
    }
  };

  // Check user status
  const needsRoleSelection = me && (!me?.role);
  const needsProfileCompletion = me?.role && (!me?.name || (me?.role === 'WORKER' && (!me?.worker_type || !me?.cuisine || !me?.experience_yrs || !me?.charges)));
  const hasCompleteProfile = me?.role && me?.name && (me?.role !== 'WORKER' || (me?.worker_type && me?.cuisine && me?.experience_yrs && me?.charges));
  
  const loadPublic = async () => {
    const [svc, req] = await Promise.all([
      apiFetch('/services'),
      apiFetch('/requirements'),
    ]);
    if (svc.ok) setServices((await svc.json()).services || []);
    if (req.ok) setRequirements((await req.json()).requirements || []);
  };

  const withAuth = async (init: RequestInit = {}) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return {
      ...init,
      headers: { 'Content-Type': 'application/json', ...(init.headers || {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    } as RequestInit;
  };

  const loadMine = async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return;
    const res = await apiFetch('/my-services', await withAuth());
    if (res.ok) setMyServices((await res.json()).services || []);
  };

  const createRequirement = async () => {
    const res = await apiFetch('/requirements', await withAuth({ method: 'POST', body: JSON.stringify(reqForm) }));
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any));
      setMsg(j?.error || 'Failed to post requirement');
      return;
    }
    setReqForm({ 
      needType: 'BOTH', 
      details: '', 
      preferredTiming: '', 
      preferredPrice: 0, 
      block: '', 
      flatNo: '', 
      urgency: 'MEDIUM' 
    });
    await loadPublic();
  };

  const createService = async () => {
    const payload = { 
      title: svcForm.title, 
      cuisine: svcForm.cuisine as any, 
      price: Number(svcForm.price),
      serviceArea: svcForm.serviceArea,
      availableTiming: svcForm.availableTiming,
      description: svcForm.description
    };
    const res = await apiFetch('/services', await withAuth({ method: 'POST', body: JSON.stringify(payload) }));
    if (!res.ok) {
      const j = await res.json().catch(() => ({} as any));
      setMsg(j?.error || 'Failed to post service');
      return;
    }
    setSvcForm({ 
      title: '', 
      cuisine: 'BOTH', 
      price: 0, 
      serviceArea: '', 
      availableTiming: '', 
      description: '' 
    });
    await Promise.all([loadPublic(), loadMine()]);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const res = await apiFetch(`/services/${id}/toggle`, await withAuth({ method: 'PATCH' }));
    if (res.ok) await loadMine();
  };

  const deleteService = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }
    
    const res = await apiFetch(`/services/${id}`, await withAuth({ method: 'DELETE' }));
    if (res.ok) {
      await loadMine();
      setMsg('Service deleted successfully');
      setTimeout(() => setMsg(null), 3000);
    } else {
      const error = await res.json().catch(() => ({ error: 'Failed to delete service' }));
      setMsg(error.error || 'Failed to delete service');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section for First-time Users */}
      {(!me || needsRoleSelection) && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-indigo-600 opacity-10"></div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6">
                Connect with
                <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent"> Local </span>
                <br />Cooking Services
              </h1>
              <p className="text-xl text-neutral-600 mb-8 max-w-3xl mx-auto">
                Find trusted cooks and household help in your area. Join our community of verified service providers and residents.
              </p>
              
              {needsRoleSelection && (
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto">
                  <h3 className="text-2xl font-semibold text-neutral-900 mb-6">Choose Your Role</h3>
                  <div className="grid md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => selectRole('RESIDENT')}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="relative z-10">
                        <div className="text-4xl mb-3">🏠</div>
                        <h4 className="text-xl font-semibold mb-2">I'm a Resident</h4>
                        <p className="text-blue-100">Looking for cooking & household services</p>
                      </div>
                    </button>
                    <button 
                      onClick={() => selectRole('WORKER')}
                      className="group relative overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                      <div className="relative z-10">
                        <div className="text-4xl mb-3">👨‍🍳</div>
                        <h4 className="text-xl font-semibold mb-2">I'm a Service Provider</h4>
                        <p className="text-green-100">Offering cooking & household services</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Banners */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Completion Banner */}
        {needsProfileCompletion && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-4 flex-1">
                <h3 className="text-lg font-medium text-amber-800">Complete Your Profile</h3>
                <p className="text-amber-700">
                  {me?.role === 'WORKER' 
                    ? 'Add your service details, experience, and charges to start getting bookings.' 
                    : 'Add your basic details to connect with service providers.'
                  }
                </p>
              </div>
              <div className="ml-4">
                <Link
                  href="/profile"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-amber-800 bg-amber-100 hover:bg-amber-200 transition-colors"
                >
                  Complete Profile
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner for Complete Profiles */}
        {hasCompleteProfile && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl">👋</span>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-green-900">Welcome back, {me?.name}!</h3>
                  <div className="flex items-center space-x-4 text-sm text-green-700">
                    <span className="flex items-center">
                      <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                      {me?.role}
                    </span>
                    <span className="flex items-center">
                      {me?.verified ? (
                        <>
                          <svg className="w-4 h-4 text-green-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Verified
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4 text-amber-500 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          Pending Verification
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              <Link
                href="/profile"
                className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 transition-colors"
              >
                Edit Profile
              </Link>
            </div>
          </div>
        )}

        {/* Error Message */}
        {msg && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{msg}</p>
              </div>
              <button
                onClick={() => setMsg(null)}
                className="ml-auto pl-3"
              >
                <svg className="w-5 h-5 text-red-400 hover:text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-neutral-200">
            <nav className="-mb-px flex">
              <button
                onClick={() => setActiveTab('services')}
                className={`py-4 px-8 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'services'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
                  </svg>
                  Available Services
                  <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                    {services.length}
                  </span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requirements')}
                className={`py-4 px-8 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'requirements'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-700 hover:border-neutral-300'
                }`}
              >
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Service Requirements
                  <span className="ml-2 bg-secondary-100 text-secondary-800 text-xs px-2 py-1 rounded-full">
                    {requirements.length}
                  </span>
                </div>
              </button>
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'services' && (
              <div className="space-y-8">
                {/* Service Creation Form for Workers */}
                {me?.role === 'WORKER' && hasCompleteProfile && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Post a New Service
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Service Title *</label>
                        <input 
                          placeholder="e.g., Home Cooking Services" 
                          value={svcForm.title} 
                          onChange={(e) => setSvcForm({ ...svcForm, title: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Cuisine Type</label>
                        <select 
                          value={svcForm.cuisine} 
                          onChange={(e) => setSvcForm({ ...svcForm, cuisine: e.target.value as any })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        >
                          <option value="VEG">🥬 Vegetarian</option>
                          <option value="NONVEG">🍖 Non-Vegetarian</option>
                          <option value="BOTH">🍽️ Both Cuisines</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Price per Service (₹) *</label>
                        <input 
                          type="number" 
                          placeholder="e.g., 500" 
                          value={svcForm.price || ''} 
                          onChange={(e) => setSvcForm({ ...svcForm, price: Number(e.target.value) })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Service Area *</label>
                        <input 
                          placeholder="e.g., Block A, Sector 21" 
                          value={svcForm.serviceArea} 
                          onChange={(e) => setSvcForm({ ...svcForm, serviceArea: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Available Timing *</label>
                        <input 
                          placeholder="e.g., Mon-Fri 8AM-5PM" 
                          value={svcForm.availableTiming} 
                          onChange={(e) => setSvcForm({ ...svcForm, availableTiming: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                        <textarea 
                          placeholder="Additional details about your service..." 
                          value={svcForm.description} 
                          onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={createService}
                        disabled={!svcForm.title || !svcForm.price || !svcForm.serviceArea || !svcForm.availableTiming}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Post Service
                      </button>
                    </div>
                  </div>
                )}

                {/* My Services Section for Workers */}
                {me?.role === 'WORKER' && myServices.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      My Services ({myServices.length})
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {myServices.map((svc: any) => (
                        <div key={svc.id} className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold text-neutral-900 mb-2">{svc.title}</h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                svc.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {svc.isActive ? '🟢 Active' : '🔴 Inactive'}
                              </span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-primary-600">₹{svc.price}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-2 mb-6 text-sm text-neutral-600">
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              </svg>
                              {svc.serviceArea}
                            </div>
                            <div className="flex items-center">
                              <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {svc.availableTiming}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={() => toggleActive(svc.id, svc.isActive)}
                              className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                svc.isActive 
                                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                  : 'bg-green-100 text-green-700 hover:bg-green-200'
                              }`}
                            >
                              {svc.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteService(svc.id, svc.title)}
                              className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Services Grid */}
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2h8z" />
                    </svg>
                    Available Services ({services.length})
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((svc: any) => (
                      <div key={svc.id} className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-neutral-900 mb-2">
                              <TranslateButton text={svc.title} />
                            </h4>
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                svc.cuisine === 'VEG' ? 'bg-green-100 text-green-800' :
                                svc.cuisine === 'NONVEG' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {svc.cuisine === 'VEG' ? '🥬 Vegetarian' : 
                                 svc.cuisine === 'NONVEG' ? '🍖 Non-Vegetarian' : 
                                 '🍽️ Both'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary-600">₹{svc.price}</div>
                            <div className="text-sm text-neutral-500">per service</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="flex items-center text-sm text-neutral-600">
                            <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <TranslateButton text={svc.serviceArea} />
                          </div>
                          <div className="flex items-center text-sm text-neutral-600">
                            <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <TranslateButton text={svc.availableTiming} />
                          </div>
                          {svc.description && (
                            <div className="text-sm text-neutral-600">
                              <TranslateButton text={svc.description} />
                            </div>
                          )}
                        </div>

                        <div className="border-t border-neutral-100 pt-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {svc.users?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-neutral-900">
                                  <TranslateButton text={svc.users?.name || 'Service Provider'} />
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {svc.users?.experience_yrs && `${svc.users.experience_yrs} years exp`}
                                </div>
                              </div>
                            </div>
                            {svc.users?.verified && (
                              <div className="flex items-center text-green-600">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {services.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="text-lg font-medium text-neutral-900 mb-2">No Services Available</h4>
                      <p className="text-neutral-500">Be the first to offer your cooking services!</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'requirements' && (
              <div className="space-y-8">
                {/* Requirement Creation Form for Residents */}
                {me?.role === 'RESIDENT' && hasCompleteProfile && (
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 mb-8">
                    <h3 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                      <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Post a Service Requirement
                    </h3>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Service Type</label>
                        <select 
                          value={reqForm.needType} 
                          onChange={(e) => setReqForm({ ...reqForm, needType: e.target.value as any })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        >
                          <option value="VEG">🥬 Vegetarian Cook</option>
                          <option value="NONVEG">🍖 Non-Vegetarian Cook</option>
                          <option value="BOTH">🍽️ Any Cook/Maid</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Urgency Level</label>
                        <select 
                          value={reqForm.urgency} 
                          onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value as any })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        >
                          <option value="LOW">🟢 Flexible</option>
                          <option value="MEDIUM">🟡 Medium</option>
                          <option value="HIGH">🔴 Urgent</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Budget (₹)</label>
                        <input 
                          type="number" 
                          placeholder="e.g., 500" 
                          value={reqForm.preferredPrice || ''} 
                          onChange={(e) => setReqForm({ ...reqForm, preferredPrice: Number(e.target.value) })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Block/Area</label>
                        <input 
                          placeholder="e.g., Block A" 
                          value={reqForm.block} 
                          onChange={(e) => setReqForm({ ...reqForm, block: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Flat/House No</label>
                        <input 
                          placeholder="e.g., 101" 
                          value={reqForm.flatNo} 
                          onChange={(e) => setReqForm({ ...reqForm, flatNo: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Preferred Timing</label>
                        <input 
                          placeholder="e.g., Mon-Fri 7-9 AM" 
                          value={reqForm.preferredTiming} 
                          onChange={(e) => setReqForm({ ...reqForm, preferredTiming: e.target.value })}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors"
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Requirements Details *</label>
                        <textarea 
                          placeholder="Describe what you're looking for in detail..." 
                          value={reqForm.details} 
                          onChange={(e) => setReqForm({ ...reqForm, details: e.target.value })}
                          rows={3}
                          className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition-colors resize-none"
                        />
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={createRequirement}
                        disabled={!reqForm.details}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-secondary-600 to-secondary-700 hover:from-secondary-700 hover:to-secondary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Post Requirement
                      </button>
                    </div>
                  </div>
                )}

                {/* Service Requirements Grid */}
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Service Requirements ({requirements.length})
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requirements.map((req: any) => (
                      <div key={req.id} className="bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                req.needType === 'VEG' ? 'bg-green-100 text-green-800' :
                                req.needType === 'NONVEG' ? 'bg-red-100 text-red-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {req.needType === 'VEG' ? '🥬 Vegetarian Cook' : 
                                 req.needType === 'NONVEG' ? '🍖 Non-Veg Cook' : 
                                 '🍽️ Any Cook/Maid'}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                req.urgency === 'HIGH' ? 'bg-red-100 text-red-800' :
                                req.urgency === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {req.urgency === 'HIGH' ? '🔴 Urgent' :
                                 req.urgency === 'MEDIUM' ? '🟡 Medium' :
                                 '🟢 Flexible'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-secondary-600">₹{req.preferredPrice}</div>
                            <div className="text-sm text-neutral-500">budget</div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 mb-6">
                          <div className="text-sm text-neutral-800">
                            <TranslateButton text={req.details} />
                          </div>
                          {req.preferredTiming && (
                            <div className="flex items-center text-sm text-neutral-600">
                              <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <TranslateButton text={req.preferredTiming} />
                            </div>
                          )}
                          <div className="flex items-center text-sm text-neutral-600">
                            <svg className="w-4 h-4 mr-2 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            {req.block && req.flatNo ? `${req.block}, Flat ${req.flatNo}` : req.block || req.flatNo || 'Location not specified'}
                          </div>
                        </div>

                        <div className="border-t border-neutral-100 pt-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gradient-to-r from-secondary-500 to-primary-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-medium">
                                {req.users?.name?.charAt(0) || 'R'}
                              </span>
                            </div>
                            <div>
                              <div className="text-sm font-medium text-neutral-900">
                                <TranslateButton text={req.users?.name || 'Resident'} />
                              </div>
                              <div className="text-xs text-neutral-500">
                                Posted {new Date(req.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {requirements.length === 0 && (
                    <div className="text-center py-12">
                      <svg className="w-16 h-16 text-neutral-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m0 12h.01" />
                      </svg>
                      <h4 className="text-lg font-medium text-neutral-900 mb-2">No Requirements Posted</h4>
                      <p className="text-neutral-500">Check back later for new service requests!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
