'use client';

import React, { useState, useEffect, useTransition, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ChatCloudinha from './components/ChatCloudinha';
import OpportunityCarousel from './components/OpportunityCarousel';
import MatchPlaceholder from './components/MatchPlaceholder';
import MatchWizard from './components/MatchWizard';
import ChatHeader from './components/ChatHeader';
import PassportWorkflowHeader from './components/PassportWorkflowHeader';
import AuthModal from '@/components/AuthModal';
import { Layout, Loader2 } from 'lucide-react';
import CloudBackground from '@/components/CloudBackground';
import UserDataSection from '@/components/profile/UserDataSection';
import DependentDataSection from '@/components/profile/DependentDataSection';
import PartnerForm from '@/components/profile/PartnerForm';
import ProgramMatchSection from '@/components/profile/ProgramMatchSection';
import UserPreferencesSection from '@/components/profile/UserPreferencesSection';
import MobileTabSwitch from './components/MobileTabSwitch';
import SuccessTransitionView from './components/SuccessTransitionView';
import ApplicationsDrawer from './components/ApplicationsDrawer';
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

    // Applications drawer & selected application
    const [showApplicationsDrawer, setShowApplicationsDrawer] = useState(false);
    const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

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
            const customMessage = (pendingAction.payload as any).message || ' ';
            supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                    supabase.from('user_profiles')
                        .update({ active_workflow: workflow })
                        .eq('id', user.id)
                        .then((res) => {
                            if (res.error) console.error("Error setting workflow:", res.error);
                            setInitialMessage(customMessage);
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

            // F. Subscribe to Realtime Updates on Profile
            const profileSubscription = supabase
                .channel('public:user_profiles:page')
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'user_profiles',
                        filter: `id=eq.${user.id}`,
                    },
                    (payload) => {
                        console.log('[ChatPage] Realtime profile update received:', payload.new);
                        setProfile(payload.new as any);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(profileSubscription);
            };
        }
    }, [user]);

    const prevPhaseRef = React.useRef<string | null>(null);

    // Phase-based functionality sync & Auto Tab Switch on mobile
    useEffect(() => {
        if (profile?.passport_phase) {
            const phase = profile.passport_phase;
            const uiActivePhases = ['ONBOARDING', 'DEPENDENT_ONBOARDING', 'EVALUATE', 'PROGRAM_MATCH'];
            const needsOnboardingView = [...uiActivePhases, 'INTRO', 'ASK_DEPENDENT', 'CONCLUDED'].includes(phase);

            // 1. Sync functionality view
            if (needsOnboardingView && selectedFunctionality !== 'ONBOARDING') {
                console.log(`[ChatPage] passport_phase is '${phase}', forcing ONBOARDING view`);
                setSelectedFunctionality('ONBOARDING');
            }

            // 2. Auto-switch tab on mobile when entering a UI-heavy phase
            const phaseChanged = prevPhaseRef.current !== phase;
            if (phaseChanged && uiActivePhases.includes(phase)) {
                if (typeof window !== 'undefined' && window.innerWidth < 768) {
                    console.log(`[ChatPage] Auto-switching to CONTENT tab for phase: ${phase}`);
                    setActiveTab('CONTENT');
                }
            }

            prevPhaseRef.current = phase;
        }
    }, [profile?.passport_phase, selectedFunctionality]);

    // Phase INTRO transition is handled by the agent after the first message
    // or manually by the user clicking a button in the UI.

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
            // A transição no banco foi feita pelo componente (UserDataSection ou DependentDataSection)
            // Aqui fazemos apenas o refresh do estado e disparamos o gatilho da Cloudinha
            if (profile?.passport_phase === 'ONBOARDING') {
                console.log('[ChatPage] UI Onboarding complete. Triggering Cloudinha message.');
                setPostWizardTrigger("Pronto, preenchi os dados.");
            } else {
                console.log('[ChatPage] UI profile edit complete. Refreshing profile, staying on Passaporte.');
            }

            getUserProfileService().then(({ data }) => {
                if (data) setProfile(data);
            });
        }
    };

    const handlePhaseBack = async (previousPhase: any) => {
        if (!user) return;
        console.log(`[ChatPage] User requested to go back to phase: ${previousPhase}`);

        const { data, error } = await updateUserProfileService({
            passport_phase: previousPhase
        });

        if (data) {
            setProfile(data);
            // On mobile, ensure we stay on the CONTENT tab if we moved to a UI phase
            const uiActivePhases = ['ONBOARDING', 'DEPENDENT_ONBOARDING', 'EVALUATE', 'PROGRAM_MATCH'];
            if (uiActivePhases.includes(previousPhase) && typeof window !== 'undefined' && window.innerWidth < 768) {
                setActiveTab('CONTENT');
            }
        } else if (error) {
            console.error('[ChatPage] Error updating phase via service:', error);
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

                {/* Mobile Top Navigation Tabs */}
                <div className="md:hidden flex-none w-full z-40">
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
                                            setActiveCourseIds(wf.last_course_ids);
                                            setDesktopMatchView('OPPORTUNITIES');
                                        }
                                        if (wf.last_opportunity_map) {
                                            setMatchedOppsMap(wf.last_opportunity_map);
                                        } else {
                                            console.log("[ChatPage] No course IDs in workflow_data.");
                                        }
                                    }
                                } catch (e) {
                                    console.error("[ChatPage] Error in onProfileUpdated logic:", e);
                                }
                            }
                        }}
                        onClearOpportunities={() => setActiveCourseIds([])}

                        activeTab={activeTab}
                        onTabSwitch={handleTabSwitch}
                        isPending={isPending}
                        pendingTarget={pendingTarget}

                        inputDisabled={showMatchWizard && selectedFunctionality === 'MATCH'}
                        onWizardRequest={() => {
                            setWizardChecked(true);
                            setShowMatchWizard(true);
                            setSelectedFunctionality('MATCH');
                        }}

                        triggerMessage={postWizardTrigger}
                        onTriggerMessageSent={() => setPostWizardTrigger(null)}
                        uiFormState={uiFormState}
                        passportPhase={profile?.passport_phase}
                        selectedFunctionality={selectedFunctionality}
                    />
                </div>

                {/* Right Side - Content Panel */}
                <div className={`
                    ${activeTab === 'CONTENT' ? 'flex' : 'hidden'}
                    md:flex col-span-3 flex-col relative overflow-hidden h-full
                `}>
                    <div className="flex flex-col h-full p-0 md:p-6 md:pb-6 gap-0 md:gap-4 relative">
                        {/* Header Wrapper */}
                        <div className="relative z-20 bg-transparent flex flex-col">
                            <ChatHeader
                                selectedFunctionality={selectedFunctionality}
                                onSelectFunctionality={setSelectedFunctionality}
                                desktopMatchView={desktopMatchView}
                                onDesktopMatchViewChange={setDesktopMatchView}
                            />
                        </div>

                        {/* Content Box */}
                        <div className="flex-1 bg-white/40 backdrop-blur-md md:rounded-[32px] md:border border-white/40 md:shadow-xl overflow-hidden flex flex-col relative">
                            {profile?.passport_phase && selectedFunctionality === 'ONBOARDING' && (
                                <PassportWorkflowHeader
                                    currentPhase={profile.passport_phase as any}
                                    furthestPhase={profile.furthest_passport_phase}
                                    onBack={handlePhaseBack}
                                    showViewFormsButton={['PROGRAM_MATCH', 'EVALUATE', 'CONCLUDED'].includes(profile.passport_phase)}
                                    onViewForms={() => setShowApplicationsDrawer(true)}
                                    activeApplicationTargetId={profile.active_application_target_id}
                                    profileId={profile.id}
                                />
                            )}

                            <div className="flex-1 relative z-10 p-4 md:p-8 flex flex-col overflow-y-auto">
                                {/* MATCH Workflow */}
                                {selectedFunctionality === 'MATCH' && (
                                    <div className="w-full h-full flex flex-col">
                                        {showMatchWizard && wizardChecked ? (
                                            <MatchWizard onComplete={() => {
                                                setShowMatchWizard(false);
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
                                                    <div className="min-h-full flex flex-col justify-center p-0 md:p-8">
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
                                    <div className={`w-full h-full overflow-y-auto flex flex-col ${profile?.passport_phase === 'PROGRAM_MATCH' ? 'pt-4' : 'items-center md:justify-center p-0 md:p-4'}`}>
                                        <div className={`w-full h-full ${profile?.passport_phase === 'PROGRAM_MATCH' ? '' : 'max-w-3xl'}`}>
                                            {!profile || !profile.passport_phase || isLoading || (!isAuthenticated && !isLoading) ? (
                                                <SuccessTransitionView
                                                    title="Preparando o seu Passaporte..."
                                                    subtitle="A Cloudinha está separando as melhores perguntas"
                                                    description="Estamos carregando seu perfil para configurar sua jornada personalizada."
                                                    images={['/assets/cloudinha/Intro.png']}
                                                />
                                            ) : profile.passport_phase === 'DEPENDENT_ONBOARDING' ? (
                                                <DependentDataSection
                                                    key={`dependent-form-${profile.passport_phase}`}
                                                    onDependentOnboardingComplete={handleUIOnboardingComplete}
                                                    onFormDirty={setUiFormState}
                                                    onTriggerChatMessage={(msg) => {
                                                        setPostWizardTrigger(msg);
                                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                            setActiveTab('CHAT');
                                                        }
                                                    }}
                                                />
                                            ) : profile.passport_phase === 'EVALUATE' ? (
                                                <PartnerForm
                                                    key={`partner-form-${selectedApplicationId || 'latest'}`}
                                                    applicationId={selectedApplicationId || undefined}
                                                    onComplete={() => {
                                                        console.log('[ChatPage] PartnerForm completed. Refreshing profile.');
                                                        setSelectedApplicationId(null);
                                                        getUserProfileService().then(({ data }) => {
                                                            if (data) setProfile(data);
                                                        });
                                                    }}
                                                    onFormDirty={setUiFormState}
                                                    onTriggerChatMessage={(msg) => {
                                                        setPostWizardTrigger(msg);
                                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                            setActiveTab('CHAT');
                                                        }
                                                    }}
                                                />
                                            ) : profile.passport_phase === 'PROGRAM_MATCH' ? (
                                                <ProgramMatchSection
                                                    key={`program-match-${profile.passport_phase}`}
                                                    onTriggerChatMessage={(msg) => {
                                                        setPostWizardTrigger(msg);
                                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                            setActiveTab('CHAT');
                                                        }
                                                    }}
                                                />
                                            ) : profile.passport_phase === 'INTRO' ? (
                                                <SuccessTransitionView
                                                    title="Preparando o seu Passaporte..."
                                                    subtitle="A Cloudinha está separando as melhores perguntas"
                                                    description="Estamos configurando sua jornada personalizada para encontrar as melhores oportunidades para você. Só um momentinho!"
                                                    images={['/assets/cloudinha/Intro.png']}
                                                />
                                            ) : ['ASK_DEPENDENT', 'CONCLUDED'].includes(profile.passport_phase) ? (
                                                <SuccessTransitionView
                                                    title={profile.passport_phase === 'ASK_DEPENDENT' ? "Tudo Pronto?" : "Dados Confirmados!"}
                                                    subtitle={profile.passport_phase === 'ASK_DEPENDENT' ? "Vamos começar a jornada" : "Seu perfil foi atualizado com sucesso"}
                                                    description={profile.passport_phase === 'ASK_DEPENDENT' ? "A Cloudinha quer te conhecer melhor para encontrar as melhores vagas." : "A Cloudinha liberou os próximos passos no Chat ao lado. Dê uma olhadinha lá para continuar!"}
                                                    buttonText="Ir para o Chat"
                                                    images={profile.passport_phase === 'ASK_DEPENDENT' 
                                                        ? ['/assets/cloudinha/Ask 1.png', '/assets/cloudinha/Ask 2.png'] 
                                                        : ['/assets/cloudinha/Sucesso 1.png', '/assets/cloudinha/Sucesso 2.png']
                                                    }
                                                    onButtonClick={() => {
                                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                            setActiveTab('CHAT');
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <UserDataSection
                                                    key={`user-form-${profile.passport_phase}`}
                                                    profile={profile}
                                                    onProfileUpdate={setProfile}
                                                    onOnboardingComplete={handleUIOnboardingComplete}
                                                    onFormDirty={setUiFormState}
                                                    onTriggerChatMessage={(msg) => {
                                                        setPostWizardTrigger(msg);
                                                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                                                            setActiveTab('CHAT');
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <AuthModal />

                {/* Applications Drawer */}
                <ApplicationsDrawer
                    isOpen={showApplicationsDrawer}
                    onClose={() => setShowApplicationsDrawer(false)}
                    onSelectApplication={async (appId) => {
                        setShowApplicationsDrawer(false);
                        setSelectedApplicationId(appId);
                        // Ensure we're in EVALUATE phase to show the PartnerForm
                        if (profile?.passport_phase !== 'EVALUATE') {
                            const { data } = await updateUserProfileService({ passport_phase: 'EVALUATE' });
                            if (data) setProfile(data);
                        }
                    }}
                />
            </div>
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
