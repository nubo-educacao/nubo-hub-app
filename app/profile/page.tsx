'use client';

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import UserDataSection from '@/components/profile/UserDataSection';
import FavoritesSection from '@/components/profile/FavoritesSection';
import UserPreferencesSection from '@/components/profile/UserPreferencesSection';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getUserProfileService, UserProfile } from '@/services/supabase/profile';
import { getUserFavoritesDetailsService, FavoriteDetails } from '@/services/supabase/favorites';
import { getUserPreferencesService, UserPreferences } from '@/services/supabase/preferences';
import { Montserrat } from 'next/font/google';
import { Loader2 } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import BackButton from '@/components/BackButton';

const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

export default function ProfilePage() {
  const { isAuthenticated, user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteDetails>({ courses: [], partners: [] });
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
      return;
    }

    async function fetchData() {
        if (!user) return;
        
        try {
            console.log('ProfilePage: Fetching data for user', user.id);
            const [profileRes, favoritesRes, preferencesRes] = await Promise.all([
                getUserProfileService(),
                getUserFavoritesDetailsService(),
                getUserPreferencesService()
            ]);

            console.log('ProfilePage: Profile result:', profileRes);
            console.log('ProfilePage: Favorites result:', favoritesRes);
            console.log('ProfilePage: Preferences result:', preferencesRes);

            if (profileRes.data) {
                setProfile(profileRes.data);
            } else {
                console.warn('ProfilePage: No profile data returned');
            }
            
            if (favoritesRes.data) setFavorites(favoritesRes.data);
            if (preferencesRes.data) setPreferences(preferencesRes.data);
            
        } catch (err) {
            console.error('ProfilePage: Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    }

    if (isAuthenticated) {
        fetchData();
    }
  }, [isAuthenticated, authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#F0F8FF] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#38B1E4]" size={48} />
      </div>
    );
  }

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center overflow-x-hidden bg-[#F0F8FF] ${montserrat.className}`}>
      {/* Background Layer */}
      <CloudBackground />

      {/* Header */}
      <Header />

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[1200px] px-4 py-8 md:py-12 flex flex-col gap-6 mt-16 md:mt-20">
        
        {/* Glass Container */}
        <div className="w-full bg-white/30 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(31,38,135,0.07)] rounded-3xl p-6 md:p-10 flex flex-col gap-8">
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 border-b border-[#024F86]/10 pb-6">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-4xl font-bold text-[#024F86] leading-tight flex items-center gap-3">
                        Meu Perfil
                    </h1>
                     <p className="text-[#3A424E] text-lg">Gerencie suas informações e acesse seus favoritos.</p>
                </div>
                
                {/* Back Button */}
                <BackButton />
            </div>

            {/* Content Sections */}
            <div className="space-y-8">
                {/* User Data */}
                <UserDataSection 
                    profile={profile} 
                    onProfileUpdate={(updated) => setProfile(updated)} 
                />

                {/* Preferences */}
                <div className="relative z-20">
                    <UserPreferencesSection 
                        preferences={preferences} 
                        onUpdate={(updated) => setPreferences(updated)} 
                    />
                </div>

                {/* Favorites */}
                <FavoritesSection favorites={favorites} />
            </div>

        </div>
      </div>
    </div>
  );
}
