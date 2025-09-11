"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { apiFetch } from '@/lib/api';
import { getUserLanguage, translateBatch, type LanguageCode } from '@/lib/translation';

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
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [currentLanguage, setCurrentLanguage] = useState<LanguageCode>('en');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const language = getUserLanguage();
    console.log('Initial language detected:', language);
    setCurrentLanguage(language);
    loadUserData();
    loadPublic(language);
    
    // Translate UI if not English
    if (language !== 'en') {
      console.log('Triggering translation for:', language);
      translateUI(language);
    }

    // Listen for language changes from localStorage (across tabs)
    const handleLanguageChange = (e: StorageEvent) => {
      if (e.key === 'preferredLanguage' && e.newValue) {
        const newLanguage = e.newValue as LanguageCode;
        console.log('Language changed to:', newLanguage);
        setCurrentLanguage(newLanguage);
        if (newLanguage !== 'en') {
          translateUI(newLanguage);
        } else {
          setTranslations({});
        }
        // Reload public data with translations
        loadPublic(newLanguage);
      }
    };

    window.addEventListener('storage', handleLanguageChange);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        loadUserData();
      } else {
        setMe(null);
      }
    });

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('storage', handleLanguageChange);
    };
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
  
  // UI Translation function
  const translateUI = async (targetLanguage: LanguageCode) => {
    console.log('translateUI called with language:', targetLanguage);
    
    if (targetLanguage === 'en') {
      setTranslations({});
      return;
    }

    setIsTranslating(true);
    console.log('Starting translation to:', targetLanguage);
    
    // Define all UI text that needs translation (excluding technical terms like phone numbers, names, blocks)
    const uiTexts = [
      // Welcome section
      'Welcome to',
      'Find skilled cooks and reliable house cleaners in your neighborhood. Quality service providers ready to help with your daily needs.',
      'Choose Your Role',
      "I'm a Resident",
      'Looking for services',
      "I'm a Service Provider",
      'Cook/Maid/Cleaner',
      
      // Profile completion
      'Complete Your Profile:',
      'Add your service details, experience, and charges to start getting bookings.',
      'Add your basic details to connect with service providers.',
      'Go to Profile',
      
      // Services section
      'Available Services',
      'service available',
      'services available',
      'Post a New Service',
      'Service Title',
      'e.g., Home Cooking Services',
      'Cuisine Type',
      'North Indian',
      'South Indian',
      'Both Cuisines',
      'All Cuisines',
      'Price per Service',
      'e.g., 500',
      'Service Area',
      'e.g., Block A, B, C or Sector 1-5',
      'Available Timing',
      'e.g., 7:00 AM - 10:00 AM, 5:00 PM - 8:00 PM',
      'Service Description (Optional)',
      'Describe your services, experience, specialties, etc.',
      'Post Service',
      'Tip: Ensure you\'ve completed your worker profile and verification for better visibility.',
      'Sign in as Service Provider to post your services.',
      'years exp.',
      'reviews',
      'Service Area:',
      'Available:',
      'By:',
      'No services available yet',
      'Be the first to post a service in your area!',
      'My Services',
      'Active',
      'Inactive',
      'Delete',
      'Delete this service',
      'You haven\'t posted any services yet.',
      'Create your first service above to get started!',
      
      // Requirements section
      'Requirements',
      'requirement posted',
      'requirements posted',
      'Post a New Requirement',
      'Service Needed',
      'Cook Only',
      'Maid Only',
      'Both Cook & Maid',
      'Preferred Timing',
      'e.g., 7:00 AM - 9:00 AM, 6:00 PM - 8:00 PM',
      'Budget',
      'e.g., 5000 per month',
      'Block/Tower',
      'e.g., Block A, Tower 2, Sector 5',
      'Flat/Unit Number',
      'e.g., 501, A-102, Unit 25',
      'Urgency Level',
      'Low Priority (Can wait 1-2 weeks)',
      'Medium Priority (Need within a week)',
      'High Priority (Need immediately)',
      'Additional Details (Optional)',
      'Any specific requirements, dietary preferences, cleaning needs, etc.',
      'Post Requirement',
      'Sign in as Resident to post your requirements.',
      'Priority',
      'Preferred Time:',
      'Budget:',
      'Location:',
      'No requirements posted yet',
      'Be the first to post your service requirements!',
      
      // General & Error messages
      'Failed to post requirement',
      'Failed to post service',
      'Service deleted successfully',
      'Failed to delete service',
      'Requirement deleted successfully',
      'Failed to delete requirement',
      'Are you sure you want to delete',
      'Are you sure you want to delete this requirement',
      'This action cannot be undone.',
      'Delete',
      'Delete requirement',
      'Unknown',
      'No details provided'
    ];

    try {
      console.log('Sending texts for translation:', uiTexts.length, 'texts');
      const translatedTexts = await translateBatch({
        texts: uiTexts,
        fromLanguage: 'en',
        toLanguage: targetLanguage,
        context: 'general'
      });

      console.log('Received translated texts:', translatedTexts.length, 'texts');
      console.log('Sample translations:', {
        original: uiTexts.slice(0, 3),
        translated: translatedTexts.slice(0, 3)
      });

      // Create translation map
      const translationMap: Record<string, string> = {};
      uiTexts.forEach((text, index) => {
        translationMap[text] = translatedTexts[index] || text;
      });

      console.log('Translation map created with', Object.keys(translationMap).length, 'entries');
      setTranslations(translationMap);
    } catch (error) {
      console.error('Failed to translate UI:', error);
    } finally {
      setIsTranslating(false);
    }
  };
  
  // Helper function to get translated text
  const t = (text: string): string => {
    return translations[text] || text;
  };

  // Function to translate dynamic content (services, requirements)
  const translateDynamicContent = async (items: any[], field: string, targetLanguage: LanguageCode) => {
    if (targetLanguage === 'en') return items;
    
    const textsToTranslate = items.map(item => item[field] || '').filter(Boolean);
    if (textsToTranslate.length === 0) return items;
    
    try {
      const translatedTexts = await translateBatch({
        texts: textsToTranslate,
        fromLanguage: 'en',
        toLanguage: targetLanguage,
        context: field === 'description' ? 'service' : 'requirement'
      });
      
      let translationIndex = 0;
      return items.map(item => {
        if (item[field]) {
          return {
            ...item,
            [`${field}_translated`]: translatedTexts[translationIndex++] || item[field]
          };
        }
        return item;
      });
    } catch (error) {
      console.error('Failed to translate dynamic content:', error);
      return items;
    }
  };
  
  const loadPublic = async (targetLanguage?: LanguageCode) => {
    const languageToUse = targetLanguage || currentLanguage;
    
    const [svc, req] = await Promise.all([
      apiFetch('/services'),
      apiFetch('/requirements'),
    ]);
    
    let services = [];
    let requirements = [];
    
    if (svc.ok) services = (await svc.json()).services || [];
    if (req.ok) requirements = (await req.json()).requirements || [];
    
    // Translate dynamic content if not English
    if (languageToUse !== 'en') {
      services = await translateDynamicContent(services, 'description', languageToUse);
      services = await translateDynamicContent(services, 'title', languageToUse);
      requirements = await translateDynamicContent(requirements, 'details', languageToUse);
    }
    
    setServices(services);
    setRequirements(requirements);
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
      setMsg(j?.error || t('Failed to post requirement'));
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
      setMsg(j?.error || t('Failed to post service'));
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
    if (!confirm(`${t('Are you sure you want to delete')} "${title}"? ${t('This action cannot be undone.')}`)) {
      return;
    }
    
    const res = await apiFetch(`/services/${id}`, await withAuth({ method: 'DELETE' }));
    if (res.ok) {
      await loadMine();
      setMsg(t('Service deleted successfully'));
      setTimeout(() => setMsg(null), 3000);
    } else {
      const error = await res.json().catch(() => ({ error: t('Failed to delete service') }));
      setMsg(error.error || t('Failed to delete service'));
    }
  };

  const deleteRequirement = async (id: string) => {
    if (!confirm(`${t('Are you sure you want to delete this requirement')}? ${t('This action cannot be undone.')}`)) {
      return;
    }
    
    const res = await apiFetch(`/requirements/${id}`, await withAuth({ method: 'DELETE' }));
    if (res.ok) {
      await loadPublic();
      setMsg(t('Requirement deleted successfully'));
      setTimeout(() => setMsg(null), 3000);
    } else {
      const error = await res.json().catch(() => ({ error: t('Failed to delete requirement') }));
      setMsg(error.error || t('Failed to delete requirement'));
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Hero Section with Slogan */}
        <div className="text-center mb-12 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-3">
            {t('Welcome to')} <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">CookMate</span>
          </h1>
          <p className="text-xl text-slate-600 mb-4 font-medium">
            Your trusted partner for home cooking and cleaning services
          </p>
          <p className="text-lg text-slate-700 max-w-4xl mx-auto font-normal leading-relaxed">
            {t('Find skilled cooks and reliable house cleaners in your neighborhood. Quality service providers ready to help with your daily needs.')}
          </p>
        </div>

        {isTranslating && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-6 flex items-center shadow-md">
            <svg className="animate-spin w-5 h-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Translating...
          </div>
        )}
        
        {msg && (
          <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center justify-between shadow-md">
            <span className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {msg}
            </span>
            <button 
              onClick={() => setMsg(null)} 
              className="text-red-500 hover:text-red-700 transition-colors ml-4"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {needsRoleSelection && (
          <div className="mb-8 bg-gradient-to-br from-white to-blue-50 rounded-xl shadow-lg border border-blue-100 p-8">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">{t('Choose Your Role')}</h2>
                <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-2xl mx-auto">
                  <button 
                    onClick={() => selectRole('RESIDENT')}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2zm0 0V5a2 2 0 012-2h6l2 2h6a2 2 0 012 2v2M7 13h10M7 17h4" />
                    </svg>
                    <div className="text-left">
                      <div>{t("I'm a Resident")}</div>
                      <div className="text-sm font-normal mt-1">{t('Looking for services')}</div>
                    </div>
                  </button>
                  <button 
                    onClick={() => selectRole('WORKER')}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold py-4 px-8 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <div className="text-left">
                      <div>{t("I'm a Service Provider")}</div>
                      <div className="text-sm font-normal mt-1">{t('Cook/Maid/Cleaner')}</div>
                    </div>
                  </button>
                </div>
              </div>
          </div>
        )}

        {needsProfileCompletion && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg flex items-center justify-between shadow-sm">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">{t('Complete Your Profile:')}</span>
              <span className="ml-2">
                {me?.role === 'WORKER' 
                  ? t('Add your service details, experience, and charges to start getting bookings.') 
                  : t('Add your basic details to connect with service providers.')
                }
              </span>
            </div>
            <Link 
              href="/profile" 
              className="text-yellow-700 hover:text-yellow-900 font-medium underline transition-colors"
            >
              {t('Go to Profile')} →
            </Link>
          </div>
        )}

        {/* Available Services Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900">{t('Available Services')}</h2>
            <div className="text-sm text-slate-500">
              {services.length} {services.length === 1 ? t('service available') : t('services available')}
            </div>
          </div>
          
          {me?.role === 'WORKER' ? (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m4-4H8m6-6.75c1.25 0 2.25.896 2.25 2s-1 2-2.25 2h-1.5c-1.25 0-2.25-.896-2.25-2s1-2 2.25-2m0 0V3.5c0-.828.672-1.5 1.5-1.5s1.5.672 1.5 1.5v.25" />
                </svg>
                {t('Post a New Service')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Service Title')} *</label>
                  <input 
                    placeholder={t('e.g., Home Cooking Services')}
                    value={svcForm.title} 
                    onChange={(e) => setSvcForm({ ...svcForm, title: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Cuisine Type')}</label>
                  <select 
                    value={svcForm.cuisine} 
                    onChange={(e) => setSvcForm({ ...svcForm, cuisine: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900"
                  >
                    <option value="NORTH">{t('North Indian')}</option>
                    <option value="SOUTH">{t('South Indian')}</option>
                    <option value="BOTH">{t('Both Cuisines')}</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Price per Service')} (₹) *</label>
                  <input 
                    type="number" 
                    placeholder={t('e.g., 500')}
                    value={svcForm.price} 
                    onChange={(e) => setSvcForm({ ...svcForm, price: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Service Area')}</label>
                  <input 
                    placeholder={t('e.g., Block A, B, C or Sector 1-5')}
                    value={svcForm.serviceArea} 
                    onChange={(e) => setSvcForm({ ...svcForm, serviceArea: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Available Timing')}</label>
                  <input 
                    placeholder={t('e.g., 7:00 AM - 10:00 AM, 5:00 PM - 8:00 PM')}
                    value={svcForm.availableTiming} 
                    onChange={(e) => setSvcForm({ ...svcForm, availableTiming: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Service Description (Optional)')}</label>
                <textarea 
                  placeholder={t('Describe your services, experience, specialties, etc.')}
                  value={svcForm.description} 
                  onChange={(e) => setSvcForm({ ...svcForm, description: e.target.value })} 
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical text-slate-900 placeholder-slate-500"
                />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <button 
                  onClick={createService} 
                  disabled={!svcForm.title || Number.isNaN(svcForm.price)} 
                  className="bg-green-600 hover:bg-green-700 disabled:bg-slate-400 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('Post Service')}
                </button>
                <p className="text-sm text-slate-500 mt-2 sm:mt-3">
                  💡 {t('Tip: Ensure you\'ve completed your worker profile and verification for better visibility.')}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-6 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>{t('Sign in as Service Provider to post your services.')} </span>
              <Link href="/profile" className="font-medium underline ml-1">{t('Go to Profile')}</Link>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {services.map((s) => (
              <div key={s.id} className="bg-gradient-to-br from-white to-slate-50 rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-slate-900">{s.title_translated || s.title}</h3>
                  <span className="bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 text-sm font-medium px-3 py-1 rounded-full border border-emerald-200">
                    {s.cuisine === 'NORTH' ? t('North Indian') : 
                     s.cuisine === 'SOUTH' ? t('South Indian') : 
                     s.cuisine === 'BOTH' ? t('Both Cuisines') : 
                     t('All Cuisines')}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">₹{s.price}</span>
                  {s.rating > 0 && (
                    <div className="flex items-center text-yellow-500">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="text-sm font-medium text-slate-600">
                        {s.rating.toFixed(1)} ({s.rating_count} {t('reviews')})
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  {s.service_area && (
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{t('Service Area:')}{s.service_area}</span>
                    </div>
                  )}
                  {s.available_timing && (
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t('Available:')} {s.available_timing}</span>
                    </div>
                  )}
                </div>
                
                {(s.description_translated || s.description) && (
                  <p className="text-slate-600 text-sm mb-4 line-clamp-3">{s.description_translated || s.description}</p>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-500">
                    <div className="font-medium">{t('By:')} {s.name || t('Unknown')}</div>
                    <div>{s.phone || 'N/A'} • {s.experience_yrs}+ {t('years exp.')}</div>
                  </div>
                </div>
              </div>
            ))}
            
            {services.length === 0 && (
              <div className="col-span-full bg-slate-50 rounded-xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t('No services available yet')}</h3>
                <p className="text-slate-500">{t('Be the first to post a service in your area!')}</p>
              </div>
            )}
          </div>
          
          {me?.role === 'WORKER' && (
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {t('My Services')}
              </h3>
              
              <div className="space-y-4">
                {myServices.map((m) => (
                  <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900">{m.title}</h4>
                      <div className="text-sm text-slate-600 mt-1">
                        ₹{m.price} • {m.cuisine === 'NORTH' ? t('North Indian') : 
                                      m.cuisine === 'SOUTH' ? t('South Indian') : 
                                      m.cuisine === 'BOTH' ? t('Both Cuisines') : 
                                      t('All Cuisines')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input 
                          type="checkbox" 
                          checked={!!m.is_active} 
                          onChange={(e) => toggleActive(m.id, e.target.checked)}
                          className="w-4 h-4 text-green-600 border-slate-300 rounded focus:ring-green-500"
                        />
                        <span className={m.is_active ? "text-green-600 font-medium" : "text-slate-500"}>
                          {m.is_active ? t('Active') : t('Inactive')}
                        </span>
                      </label>
                      
                      <button
                        onClick={() => deleteService(m.id, m.title)}
                        className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-1"
                        title={t('Delete this service')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1V4m6 0V4a1 1 0 00-1-1h-4a1 1 0 00-1-1v1m6 0h1" />
                        </svg>
                        {t('Delete')}
                      </button>
                    </div>
                  </div>
                ))}
                
                {myServices.length === 0 && (
                  <div className="text-center py-8 text-slate-500">
                    <svg className="w-12 h-12 mx-auto text-slate-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    <p>{t('You haven\'t posted any services yet.')}</p>
                    <p className="text-sm mt-1">{t('Create your first service above to get started!')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Requirements Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-slate-900">{t('Requirements')}</h2>
            <div className="text-sm text-slate-500">
              {requirements.length} {requirements.length === 1 ? t('requirement posted') : t('requirements posted')}
            </div>
          </div>
          
          {me?.role === 'RESIDENT' ? (
            <div className="mb-8 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-xl font-semibold text-slate-900 mb-6 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {t('Post a New Requirement')}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Service Needed')} *</label>
                  <select 
                    value={reqForm.needType} 
                    onChange={(e) => setReqForm({ ...reqForm, needType: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer hover:border-slate-400 text-slate-900"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="COOK" className="py-2">{t('Cook Only')}</option>
                    <option value="MAID" className="py-2">{t('Maid Only')}</option>
                    <option value="BOTH" className="py-2">{t('Both Cook & Maid')}</option>
                  </select>
                  <div className="mt-1 text-xs text-slate-500">
                    Choose the type of service you need
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Preferred Timing')}</label>
                  <input 
                    placeholder={t('e.g., 7:00 AM - 9:00 AM, 6:00 PM - 8:00 PM')}
                    value={reqForm.preferredTiming} 
                    onChange={(e) => setReqForm({ ...reqForm, preferredTiming: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Budget')} (₹)</label>
                  <input 
                    type="number" 
                    placeholder={t('e.g., 5000 per month')}
                    value={reqForm.preferredPrice} 
                    onChange={(e) => setReqForm({ ...reqForm, preferredPrice: Number(e.target.value) })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Block/Tower')}</label>
                  <input 
                    placeholder={t('e.g., Block A, Tower 2, Sector 5')}
                    value={reqForm.block} 
                    onChange={(e) => setReqForm({ ...reqForm, block: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Flat/Unit Number')}</label>
                  <input 
                    placeholder={t('e.g., 501, A-102, Unit 25')}
                    value={reqForm.flatNo} 
                    onChange={(e) => setReqForm({ ...reqForm, flatNo: e.target.value })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-slate-900 placeholder-slate-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Urgency Level')} *</label>
                  <select 
                    value={reqForm.urgency} 
                    onChange={(e) => setReqForm({ ...reqForm, urgency: e.target.value as any })}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none bg-white cursor-pointer hover:border-slate-400 text-slate-900"
                    style={{ 
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.5rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em'
                    }}
                  >
                    <option value="LOW" className="py-2 text-green-700">{t('Low Priority (Can wait 1-2 weeks)')}</option>
                    <option value="MEDIUM" className="py-2 text-amber-700">{t('Medium Priority (Need within a week)')}</option>
                    <option value="HIGH" className="py-2 text-red-700">{t('High Priority (Need immediately)')}</option>
                  </select>
                  <div className="mt-1 text-xs text-slate-500">
                    How urgent is your service requirement?
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('Additional Details (Optional)')}</label>
                <textarea 
                  placeholder={t('Any specific requirements, dietary preferences, cleaning needs, etc.')}
                  value={reqForm.details} 
                  onChange={(e) => setReqForm({ ...reqForm, details: e.target.value })} 
                  rows={4}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-vertical text-slate-900 placeholder-slate-500"
                />
              </div>
              
              <button 
                onClick={createRequirement} 
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-colors duration-200 flex items-center shadow-lg hover:shadow-xl"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                {t('Post Requirement')}
              </button>
            </div>
          ) : (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span>{t('Sign in as Resident to post your requirements.')} </span>
              <Link href="/profile" className="font-medium underline ml-1">{t('Go to Profile')}</Link>
            </div>
          )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {requirements.map((r) => (
              <div key={r.id} className="bg-gradient-to-br from-white to-indigo-50 rounded-xl shadow-md border border-slate-200 p-6 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className="bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full border border-blue-200">
                      {r.need_type === 'COOK' ? t('Cook Only') : 
                       r.need_type === 'MAID' ? t('Maid Only') : 
                       t('Both Cook & Maid')}
                    </span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      r.urgency === 'HIGH' ? 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200' : 
                      r.urgency === 'MEDIUM' ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border border-amber-200' : 
                      'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {r.urgency} {t('Priority')}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  {r.preferred_timing && (
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t('Preferred Time:')} {r.preferred_timing}</span>
                    </div>
                  )}
                  
                  {r.preferred_price && (
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <span>{t('Budget:')} ₹{r.preferred_price}</span>
                    </div>
                  )}
                  
                  {(r.block || r.flat_no) && (
                    <div className="flex items-center text-sm text-slate-600">
                      <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{t('Location:')} {r.block && `Block ${r.block}`} {r.flat_no && `Flat ${r.flat_no}`}</span>
                    </div>
                  )}
                </div>
                
                {(r.details_translated || r.details) && (
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="text-slate-700 text-sm">{r.details_translated || r.details}</p>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <div className="text-sm text-slate-500">
                    <div className="font-medium">{t('By:')} {r.name || t('Unknown')}</div>
                    <div>{r.phone || 'N/A'}</div>
                  </div>
                  
                  {/* Delete button - show if requirement belongs to current user */}
                  {me && me.name === r.name && (
                    <button
                      onClick={() => deleteRequirement(r.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all duration-200 flex items-center text-sm"
                      title={t('Delete requirement')}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1-1H8a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      {t('Delete')}
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            {requirements.length === 0 && (
              <div className="col-span-full bg-slate-50 rounded-xl p-12 text-center">
                <svg className="w-16 h-16 mx-auto text-slate-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t('No requirements posted yet')}</h3>
                <p className="text-slate-500">{t('Be the first to post your service requirements!')}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
