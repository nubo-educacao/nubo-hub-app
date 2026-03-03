'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import MatchPlaceholder from './components/MatchPlaceholder';
import MatchWizard from './components/MatchWizard';
import ChatHeader from './components/ChatHeader';
import AuthModal from '@/components/AuthModal';
import { Layout } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import UserDataSection from '@/components/profile/UserDataSection';
import DependentDataSection from '@/components/profile/DependentDataSection';
import PartnerForm from '@/components/profile/PartnerForm';
import UserPreferencesSection from '@/components/profile/UserPreferencesSection';
import MobileTabSwitch from './components/MobileTabSwitch';
import { getUserProfileService, updateUserProfileService, UserProfile } from '@/services/supabase/profile';
import { supabase } from '@/lib/supabaseClient';

function ChatPageContent() {
    const { isAuthModalOpen, closeAuthModal, pendingAction, clearPendingAction, isAuthenticated, isLoading, user } = useAuth();
    const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);
    const [activeCourseIds, setActiveCourseIds] = useState<string[]>([]);
    const [matchedOppsMap, setMatchedOppsMap] = useState<Record<string, string[]> | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [preferences, setPreferences] = useState<any>(null);
    const [savedMatchStatus, setSavedMatchStatus] = useState<'reviewing' | 'finished' | null>(null);
    const [showMatchWizard, setShowMatchWizard] = useState(false);
    const [wizardChecked, setWizardChecked] = useState(false);

    const [selectedFunctionality, setSelectedFunctionality] = useState<'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING'>('ONBOARDING');
    const [activeTab, setActiveTab] = useState<'CHAT' | 'CONTENT'>('CHAT');

    const [desktopMatchView, setDesktopMatchView] = useState<'OPPORTUNITIES' | 'PREFERENCES'>('OPPORTUNITIES');

    const [isPending, startTransition] = useTransition();
    const [pendingTarget, setPendingTarget] = useState<'CHAT' | 'CONTENT' | null>(null);

    // Auto-Trigger State for Post-Wizard Search
    const [postWizardTrigger, setPostWizardTrigger] = useState<string | null>(null);

    // Global form state for Context-Awareness
    const [uiFormState, setUiFormState] = useState<any>(null);

    const handleTabSwitch = (tab: 'CHAT' | 'CONTENT') => {
        if (activeTab === tab) return;
        setPendingTarget(tab);
        startTransition(() => {
            setActiveTab(tab);
        });
    };

    const [isReady, setIsReady] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Auth & Readiness
    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/');
            return;
        }

        // Ensure modal is closed
        if (closeAuthModal) closeAuthModal();

        // Check for pending chat action
        if (pendingAction?.type === 'chat') {
            setInitialMessage(pendingAction.payload.message);
            clearPendingAction();
        } else if (pendingAction?.type === 'start_workflow') {
            const workflow = pendingAction.payload.workflow;
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase.from('user_profiles')
                        .update({ active_workflow: workflow })
                        .eq('id', user.id)
                        .then((res) => {
                            if (res.error) console.error("Error setting workflow:", res.error);
                            setInitialMessage(' '); // Space character to trigger agent without visible text in UI if possible, or just a generic trigger
                            clearPendingAction();
                        });
                }
            });
        } else {
            // Check for URL message param
            const msgParam = searchParams.get('message');
            if (msgParam) {
                setInitialMessage(msgParam);
                const params = new URLSearchParams(searchParams.toString());
                params.delete('message');
                router.replace(`/chat?${params.toString()}`, { scroll: false });
            }
        }
        setIsReady(true);
    }, [isLoading, isAuthenticated, closeAuthModal, pendingAction, clearPendingAction, searchParams, router]);

    // 2. Data Loading (Profile -> Prefs -> Wizard Check)
    useEffect(() => {
        if (user) {
            const init = async () => {
                // A. Fetch Profile
                const { data: profileData } = await getUserProfileService();
                console.log("[ChatPage] Profile fetched:", profileData?.onboarding_completed);
                if (profileData) setProfile(profileData);

                // B. Gating: Must complete Onboarding first
                if (!profileData?.onboarding_completed) {
                    console.log("[ChatPage] Onboarding incomplete. Skipping Wizard check.");
                    setSelectedFunctionality('ONBOARDING');
                    return;
                }

                // C. Fetch Preferences & Match State
                const { data: prefData } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();

                let hasQuotas = false;
                let hasIncome = false;

                if (prefData) {
                    setPreferences(prefData);
                    hasQuotas = prefData.quota_types !== null;
                    hasIncome = prefData.family_income_per_capita !== null;

                    if (prefData.workflow_data) {
                        const wf = prefData.workflow_data as any;
                        if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                            setActiveCourseIds(wf.last_course_ids);
                        }
                        if (wf.last_opportunity_map) {
                            setMatchedOppsMap(wf.last_opportunity_map);
                        }
                        if (wf.match_status) {
                            setSavedMatchStatus(wf.match_status);
                        }
                    }
                }

                // D. Fetch ENEM Scores Presence (Legacy Check - Optional now if we trust registration_step)
                // We can skip this if we rely on registration_step.
                // But for robustness, let's just rely on preferences state.

                // E. Show Wizard if Missing Data (Based on Step)
                const regStep = (prefData as any)?.registration_step;
                const isWizardComplete = regStep === 'completed';

                if (!isWizardComplete) {
                    setShowMatchWizard(true);
                }
                setWizardChecked(true);
            };

            init();
        }
    }, [user]);

    // Phase-based functionality sync
    useEffect(() => {
        if (profile?.passport_phase) {
            const forceOnboarding = ['DEPENDENT_ONBOARDING', 'EVALUATE', 'INTRO', 'ASK_DEPENDENT', 'PROGRAM_MATCH', 'CONCLUDED'].includes(profile.passport_phase);
            if (forceOnboarding && selectedFunctionality !== 'ONBOARDING') {
                console.log(`[ChatPage] passport_phase is '${profile.passport_phase}', forcing ONBOARDING view`);
                setSelectedFunctionality('ONBOARDING');
                // Ensure mobile moves to the content tab so the user sees the form
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    setActiveTab('CONTENT');
                }
            }
        }
    }, [profile?.passport_phase, selectedFunctionality]);

    // Phase INTRO Auto-Transition
    useEffect(() => {
        if (profile?.passport_phase === 'INTRO' && user) {
            console.log(`[ChatPage] INTRO phase detected for user ${user.id}. Starting 5s timer for auto-transition to ONBOARDING...`);
            const timer = setTimeout(async () => {
                console.log(`[ChatPage] 5s timer fired. Transitioning INTRO → ONBOARDING for user ${user.id}...`);
                const { error, data } = await supabase
                    .from('user_profiles')
                    .update({ passport_phase: 'ONBOARDING' })
                    .eq('id', user.id)
                    .select();

                if (!error) {
                    console.log('[ChatPage] ✅ INTRO → ONBOARDING transition SUCCESS. DB response:', data);
                    setProfile(prev => prev ? { ...prev, passport_phase: 'ONBOARDING' } : prev);
                } else {
                    console.error('[ChatPage] ❌ Failed to transition from INTRO to ONBOARDING:', error);
                }
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [profile?.passport_phase, user]);

    // Auto-Trigger logic when Onboarding finishes (via Chat or UI)
    // SKIP during Passei Workflow — the agent handles the transition via passport_phase
    useEffect(() => {
        if (!profile) return;

        // If the user is in the passport workflow, skip this legacy auto-trigger
        if (profile.passport_phase) {
            console.log('[ChatPage] Passport workflow active, skipping legacy onboarding trigger.');
            return;
        }

        if (profile.onboarding_completed) {
            if (localStorage.getItem('nubo_onboarding_trigger')) {
                const triggerMsg = localStorage.getItem('nubo_onboarding_trigger')!;
                console.log('[ChatPage] Onboarding complete (no passport). Triggering intent:', triggerMsg);
                setTimeout(() => setInitialMessage(triggerMsg), 500);
                localStorage.removeItem('nubo_onboarding_trigger');
            }
        }
    }, [profile]);

    // Re-write handleUIOnboardingComplete to refresh profile and advance phase
    const handleUIOnboardingComplete = () => {
        if (user) {
            if (profile?.passport_phase === 'ONBOARDING') {
                console.log('[ChatPage] UI Onboarding complete. Advancing phase to ASK_DEPENDENT.');
                updateUserProfileService({ passport_phase: 'ASK_DEPENDENT' }).then(() => {
                    getUserProfileService().then(({ data }) => {
                        if (data) setProfile(data);
                    });
                });
                setPostWizardTrigger("Pronto, preenchi os dados.");
            } else {
                console.log('[ChatPage] UI profile edit complete. Refreshing profile, staying on Passaporte.');
                getUserProfileService().then(({ data }) => {
                    if (data) setProfile(data);
                });
            }
        }
    };

    const handleInitialMessageSent = () => {
        setInitialMessage(undefined);
    };

    const handleOpportunitiesFound = (ids: string[]) => {
        console.log('[handleOpportunitiesFound] Called with', ids.length, 'IDs');
        // Deduplicate IDs to prevent layout glitches (Search returns 1 row per opportunity, not per course)
        const uniqueIds = Array.from(new Set(ids));
        console.log('[handleOpportunitiesFound] Unique IDs:', uniqueIds.length);
        setActiveCourseIds(uniqueIds);
        setDesktopMatchView('OPPORTUNITIES');
        console.log('[handleOpportunitiesFound] Switched view to OPPORTUNITIES');

        if (typeof window !== 'undefined' && window.innerWidth < 768) {
            setActiveTab('CONTENT');
        }
    };

    if (!isReady) return null;

    return (
        <div className="relative h-[100dvh] w-full overflow-hidden bg-[#F0F4FA]">

            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <CloudBackground />
            </div>

            {/* Main Content Grid - z-10 */}
            <div className="relative z-10 flex flex-col md:grid md:grid-cols-4 h-full w-full">

                {/* Mobile Tab Navigation */}
                <div className={`md:hidden fixed top-28 left-1/2 -translate-x-1/2 z-50 w-max transition-all duration-300 ${activeTab === 'CHAT' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                    <MobileTabSwitch
                        activeTab={activeTab}
                        onTabSwitch={handleTabSwitch}
                        isPending={isPending}
                        pendingTarget={pendingTarget}
                    />
                </div>

                {/* Left Side - Chat */}
                <div className={`
            ${activeTab === 'CHAT' ? 'flex' : 'hidden'} 
            md:flex col-span-1 flex-col h-full overflow-hidden
            bg-white/30 backdrop-blur-lg border-r border-white/40 shadow-xl z-20
          `}>
                    <ChatCloudinha
                        initialMessage={initialMessage}
                        onInitialMessageSent={handleInitialMessageSent}
                        onOpportunitiesFound={handleOpportunitiesFound}
                        onFunctionalitySwitch={setSelectedFunctionality}
                        initialMatchStatus={savedMatchStatus}
                        onProfileUpdated={async () => {
                            if (user) {
                                console.log("[ChatPage] onProfileUpdated triggered. Fetching profile & prefs...");
                                getUserProfileService().then(({ data }) => data && setProfile(data));

                                try {
                                    // Use select() instead of maybeSingle() to avoid 406 issues
                                    const { data, error } = await supabase.from('user_preferences').select('*').eq('user_id', user.id);

                                    if (error) {
                                        console.error("[ChatPage] Error fetching preferences:", error);
                                        return;
                                    }

                                    const prefs = data && data.length > 0 ? data[0] : null;
                                    console.log("[ChatPage] Preferences fetched:", prefs ? "Found" : "Null", "WF Data:", prefs?.workflow_data);

                                    setPreferences(prefs);
                                    if (prefs?.workflow_data) {
                                        const wf = prefs.workflow_data as any;
                                        if (Array.isArray(wf.last_course_ids) && wf.last_course_ids.length > 0) {
                                            console.log("[ChatPage] Found saved course IDs:", wf.last_course_ids.length);
                                            handleOpportunitiesFound(wf.last_course_ids);
                                        }
                                        if (wf.last_opportunity_map) {
                                            setMatchedOppsMap(wf.last_opportunity_map);
                                        } else {
                                            console.log("[ChatPage] No course IDs in workflow_data.");
                                        }
                                    }
                                } catch (err) {
                                    console.error("[ChatPage] Unexpected error in onProfileUpdated:", err);
                                }
                            }
                        }}
                        onClearOpportunities={() => setActiveCourseIds([])}

                        activeTab={activeTab}
                        onTabSwitch={handleTabSwitch}
                        isPending={isPending}
                        pendingTarget={pendingTarget}

                        inputDisabled={showMatchWizard}
                        onWizardRequest={() => {
                            setWizardChecked(true);
                            setShowMatchWizard(true);
                            setSelectedFunctionality('MATCH');
                        }}

                        triggerMessage={postWizardTrigger}
                        onTriggerMessageSent={() => setPostWizardTrigger(null)}
                        uiFormState={uiFormState}
                        passportPhase={profile?.passport_phase}
                    />
                </div>

                {/* Right Side - Content Panel */}
                <div className={`
            ${activeTab === 'CONTENT' ? 'flex' : 'hidden'}
            md:flex col-span-3 flex-col relative overflow-hidden h-full
          `}>
                    <div className="flex flex-col h-full p-4 md:p-6 pb-4 md:pb-6 gap-4">
                        <div className="flex-1 bg-white/40 backdrop-blur-md rounded-[32px] border border-white/40 shadow-xl overflow-hidden flex flex-col relative">

                            <div className="relative z-20 bg-white/30 backdrop-blur-xl border-b border-white/20 flex flex-col">
                                <ChatHeader
                                    selectedFunctionality={selectedFunctionality}
                                    onSelectFunctionality={setSelectedFunctionality}
                                    desktopMatchView={desktopMatchView}
                                    onDesktopMatchViewChange={setDesktopMatchView}
                                />
                            </div>

                            <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col overflow-hidden">

                                {/* MATCH Workflow */}
                                {selectedFunctionality === 'MATCH' && (
                                    <div className="w-full h-full flex flex-col">
                                        {showMatchWizard && wizardChecked ? (
                                            <MatchWizard onComplete={() => {
                                                setShowMatchWizard(false);
                                                // TRIGGER: Send hidden message to agent
                                                setPostWizardTrigger("Acabei de preencher meus dados (Nota e Renda). Por favor verifique oportunidades com base nisso e me dê um resumo.");

                                                if (user) {
                                                    supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle()
                                                        .then(({ data }) => setPreferences(data));
                                                }
                                            }} />
                                        ) : (
                                            desktopMatchView === 'OPPORTUNITIES' ? (
                                                activeCourseIds.length > 0 ? (
                                                    <OpportunityCarousel
                                                        courseIds={activeCourseIds}
                                                        matchedOppsMap={matchedOppsMap}
                                                    />
                                                ) : (
                                                    <MatchPlaceholder />
                                                )
                                            ) : (
                                                <div className="w-full h-full overflow-y-auto">
                                                    <div className="min-h-full flex flex-col justify-center p-4 md:p-8">
                                                        <UserPreferencesSection
                                                            preferences={preferences}
                                                            onUpdate={(updated) => setPreferences(updated)}
                                                            onMatchFound={(ids) => handleOpportunitiesFound(ids)}
                                                        />
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                )}

                                {selectedFunctionality === 'PROUNI' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#024F86]/60 gap-4">
                                        <div className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center">
                                            <Layout size={32} />
                                        </div>
                                        <span className="text-xl font-medium">Painel Prouni (Em breve)</span>
                                    </div>
                                )}

                                {selectedFunctionality === 'SISU' && (
                                    <div className="w-full h-full flex flex-col items-center justify-center text-[#024F86]/60 gap-4">
                                        <div className="w-16 h-16 bg-[#024F86]/10 rounded-full flex items-center justify-center">
                                            <Layout size={32} />
                                        </div>
                                        <span className="text-xl font-medium">Painel Sisu (Em breve)</span>
                                    </div>
                                )}

                                {selectedFunctionality === 'ONBOARDING' && (
                                    <div className="w-full h-full overflow-y-auto flex items-center justify-center p-4">
                                        <div className="w-full max-w-3xl">
                                            {!profile || !profile.passport_phase ? (
                                                <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-white">
                                                    <div className="w-32 h-32 bg-[#024F86]/10 rounded-full flex flex-col items-center justify-center mb-4 text-[#024F86]/60 font-medium text-center p-2">
                                                        [Imagem da Cloudinha]
                                                    </div>
                                                    <p className="text-sm text-[#024F86]/50">Carregando perfil...</p>
                                                </div>
                                            ) : profile.passport_phase === 'DEPENDENT_ONBOARDING' ? (
                                                <DependentDataSection
                                                    onDependentOnboardingComplete={handleUIOnboardingComplete}
                                                    onFormDirty={setUiFormState}
                                                />
                                            ) : profile.passport_phase === 'EVALUATE' ? (
                                                <PartnerForm
                                                    onComplete={() => console.log('PartnerForm Concluído simulado')}
                                                    onFormDirty={setUiFormState}
                                                />
                                            ) : ['INTRO', 'ASK_DEPENDENT', 'PROGRAM_MATCH', 'CONCLUDED'].includes(profile.passport_phase) ? (
                                                <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-sm rounded-3xl border border-white">
                                                    <div className="w-32 h-32 bg-[#024F86]/10 rounded-full flex flex-col items-center justify-center mb-4 text-[#024F86]/60 font-medium text-center p-2">
                                                        [Imagem da Cloudinha]
                                                    </div>
                                                </div>
                                            ) : (
                                                <UserDataSection
                                                    profile={profile}
                                                    onProfileUpdate={setProfile}
                                                    onOnboardingComplete={handleUIOnboardingComplete}
                                                    onFormDirty={setUiFormState}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <AuthModal />
        </div>
    );
}

export default function ChatPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-[100dvh] bg-[#F0F4FA]">
                <div className="w-12 h-12 border-4 border-[#024F86] border-t-transparent rounded-full animate-spin"></div>
            </div>
        }>
            <ChatPageContent />
        </Suspense>
    );
}
