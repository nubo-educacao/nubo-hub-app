'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import ChatInput from './ChatInput';
import MobileTabSwitch from './MobileTabSwitch';
import MatchWizard from './MatchWizard';

import MessageBubble from './MessageBubble';
// import OpportunityCarousel from './OpportunityCarousel'; // Moved to Page level
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CheckCircle2, 
    Loader2, 
    Sparkles, 
    BrainCircuit,
    ChevronDown,
    ChevronRight,
    Search,
    Calendar,
    User,
    Shield
} from 'lucide-react';

export interface ThinkingItem {
    tool: string;
    status: 'loading' | 'done' | 'error';
    label: string;
    output?: string;
}

export interface ThinkingGroup {
    id: string; // tool name that started the group usually
    label: string;
    status: 'loading' | 'done';
    items: ThinkingItem[];
}

export interface Message {
  id: string;
  sender: 'user' | 'cloudinha';
  text: string;
  timestamp: Date;
  course_ids?: string[];
  opportunity_ids?: string[];
  thinking_groups?: ThinkingGroup[];
  is_onboarding_success?: boolean; // New Flag
}


import { supabase } from '@/lib/supabaseClient';

// --- MAPPING LOGIC ---
const ITEM_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Decidindo fluxo...',
    'getStudentProfileTool': 'Lendo Perfil do Estudante',
    'getStudentProfile': 'Lendo Perfil do Estudante',
    'updateStudentProfileTool': 'Editando Perfil do Estudante',
    'updateStudentProfile': 'Editando Perfil do Estudante',
    'updateStudentPreferencesTool': 'Editando Preferências do Estudante',
    'updateStudentPreferences': 'Editando Preferências do Estudante',
    'searchOpportunitiesTool': 'Buscando Oportunidades',
    'searchOpportunities': 'Buscando Oportunidades',
    'search_opportunities': 'Buscando Oportunidades',
    'getImportantDatesTool': 'Consultando Datas Importantes',
    'getImportantDates': 'Consultando Datas Importantes',
    'get_important_dates': 'Consultando Datas Importantes',
    'knowledgeSearchTool': 'Buscando Conhecimento',
    'knowledgeSearch': 'Buscando Conhecimento',
    'search_knowledge': 'Buscando Conhecimento',
    'searchKnowledgeTool': 'Buscando Conhecimento',
    'rag_search': 'Consultando Base de Conhecimento',
    'duckDuckGoSearchTool': 'Buscando na Net',
    'duckDuckGoSearch': 'Buscando na Net',
    'smartResearchTool': 'Buscando Conhecimento',
    'smartResearch': 'Buscando Conhecimento',
    'readRulesTool': 'Buscando Conhecimento',
    'sisu_agent': 'Pensando',
    'prouni_agent': 'Pensando',
    'match_workflow': 'Pensando',
    'match_agent': 'Pensando',
    'match_iterative': 'Pensando',
    'onboarding_workflow': 'Pensando',
    'onboarding_agent': 'Pensando',
    'onboarding_name': 'Passo 1 - Nome',
    'onboarding_age': 'Passo 2 - Idade',
    'onboarding_city': 'Passo 3 - Localização',
    'onboarding_education': 'Passo 4 - Escolaridade',
    'logModerationTool': 'Registrando Log de Moderação',
    'logModeration': 'Registrando Log de Moderação',
    'guardrails_check': 'Analisando mensagem',
    'preload_student_profile': 'Buscando perfil',
    'suggestRefinementTool': 'Refinando sugestões'
};

const GROUP_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Analisando Contexto',
    'sisu_agent': 'Perguntando pro Especialista Sisu',
    'prouni_agent': 'Perguntando pro Especialista Prouni',
    'match_workflow': 'Consultando Agente de Match',
    'match_agent': 'Consultando Agente de Match',
    'match_iterative': 'Consultando Agente de Match',
    'onboarding_workflow': 'Iniciando Onboarding',
    'onboarding_agent': 'Agente de Onboarding',
    'guardrails_check': 'Analisando Contexto'
};

const getRouterLabel = (args?: any, output?: string) => {
    // Try to detect target from args or output
    const target = args?.target || (output && output.includes('prouni') ? 'prouni_workflow' : 
                                    output && output.includes('sisu') ? 'sisu_workflow' : 
                                    output && output.includes('match') ? 'match_workflow' : 
                                    output && output.includes('onboarding') ? 'onboarding_workflow' : null);

    if (target === 'prouni_workflow') return 'Transferindo para Especialista Prouni';
    if (target === 'sisu_workflow') return 'Transferindo para Especialista Sisu';
    if (target === 'match_workflow') return 'Transferindo para Agente de Match';
    if (target === 'onboarding_workflow') return 'Iniciando Onboarding';
    return 'Transferindo para Agente Principal';
}

const getToolLabel = (toolName: string, args?: any, output?: string): string => {
    if (toolName === 'RouterAgent') {
        return getRouterLabel(args, output);
    }
    return ITEM_LABEL_MAP[toolName] || `Executando ${toolName}...`;
};

const getGroupLabel = (toolName: string, args?: any): string => {
    return GROUP_LABEL_MAP[toolName] || 'Processando...';
}

// Helper for Icons
const getToolIcon = (label: string) => {
    if (label.includes('Perfil')) return <User className="w-3 h-3" />;
    if (label.includes('Datas')) return <Calendar className="w-3 h-3" />;
    if (label.includes('Moderação')) return <Shield className="w-3 h-3" />;
    if (label.includes('Buscando') || label.includes('Consultando')) return <Search className="w-3 h-3" />;
    return <Sparkles className="w-3 h-3" />;
}

export default function ChatCloudinha({ 
  initialMessage, 
  onInitialMessageSent,
  onOpportunitiesFound,
  onFunctionalitySwitch,
  onProfileUpdated,
  onClearOpportunities,
  initialMatchStatus,
  activeTab,
  onTabSwitch,
  isPending,
  pendingTarget,
  onWizardRequest,
  inputDisabled,
  triggerMessage,
  onTriggerMessageSent
}: { 
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  onOpportunitiesFound?: (ids: string[]) => void;
  onFunctionalitySwitch?: (func: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => void;
  onProfileUpdated?: () => void;
  onClearOpportunities?: () => void;
  initialMatchStatus?: 'reviewing' | 'finished' | null;
  // Mobile Nav Props
  activeTab?: 'CHAT' | 'CONTENT';
  onTabSwitch?: (tab: 'CHAT' | 'CONTENT') => void;
  isPending?: boolean;
  pendingTarget?: 'CHAT' | 'CONTENT' | null;
  // Wizard Integration
  onWizardRequest?: () => void;
  inputDisabled?: boolean;
  // Trigger Logic
  triggerMessage?: string | null;
  onTriggerMessageSent?: () => void;
}) {
  const { user, isAuthenticated, session } = useAuth();
  
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [isTyping, setIsTyping] = React.useState(false);
  // Removed local isInputBlocked in favor of props from parent
  
  // Initialize with prop if available
  // Ref to track if we already sent the trigger (avoid loops if prop not cleared fast enough)
  const triggerSentRef = React.useRef<string | null>(null);

  React.useEffect(() => {
     if (triggerMessage && triggerMessage !== triggerSentRef.current && !isTyping) {
         console.log("[ChatCloudinha] Auto-triggering message:", triggerMessage);
         triggerSentRef.current = triggerMessage;
         handleSendMessage(triggerMessage);
         if (onTriggerMessageSent) onTriggerMessageSent();
     }
     // partial reset ref if cleared?
     if (!triggerMessage) {
         triggerSentRef.current = null;
     }
  }, [triggerMessage, isTyping]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastProcessedMessage = useRef<string | undefined>(undefined);

  // State for Streaming
  // Removed separate thinkingSteps state in favor of persisting it inside Message
  const [currentStreamId, setCurrentStreamId] = React.useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isLoadingHistory]);

  // Fetch History & Handle Initial Message
  // 1. Fetch History
  useEffect(() => {
    if (user) {
      const fetchHistory = async () => {
        setIsLoadingHistory(true);
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (data) {
          const history = data.map((msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            text: msg.content,
            timestamp: new Date(msg.created_at),
          }));
          
          setMessages(prev => {
              // Merge: Keep local messages (temp IDs are usually timestamps, so numeric strings)
              // We assume server IDs are UUIDs.
              const localMessages = prev.filter(m => !isNaN(Number(m.id)));
              
              // De-duplicate if needed (though local vs server shouldn't collide on ID types)
              // Just append local messages to the end of history
              return [...history, ...localMessages];
          });
        } else {
           setMessages(prev => {
              const localMessages = prev.filter(m => !isNaN(Number(m.id)));
              return [...localMessages]; // Keep locals even if history empty
           });
        }
        setIsLoadingHistory(false);
      };
      fetchHistory();
    } else {
      // Not logged in
      setMessages([]);
      setIsLoadingHistory(false);
    }
  }, [user]);

  // 2. Handle Initial Message (Auto-send)
  useEffect(() => {
    // Check if we have a valid initialMessage that hasn't been processed yet
    if (initialMessage && initialMessage !== lastProcessedMessage.current && !isLoadingHistory) {
      console.log("[ChatCloudinha] Detected new initialMessage:", initialMessage);
      lastProcessedMessage.current = initialMessage;
      
      // Reduce delay to 100ms to avoid race conditions but allow render
      setTimeout(() => {
        console.log("[ChatCloudinha] Auto-sending initialMessage:", initialMessage);
        handleSendMessage(initialMessage);
        if (onInitialMessageSent) {
          onInitialMessageSent();
        }
      }, 100);
    }
    
    // If initialMessage is cleared (undefined), we reset our tracker so the same message can be sent again if needed
    if (!initialMessage && lastProcessedMessage.current) {
        console.log("[ChatCloudinha] Resetting initialMessage tracker");
        lastProcessedMessage.current = undefined;
    }
  }, [initialMessage, isLoadingHistory, onInitialMessageSent]);

  const handleSendMessage = async (text: string) => {
    // Check if this is the first user message to track Contact event
    // We check existing messages for any from 'user'
    const hasUserMessages = messages.some(m => m.sender === 'user');
    
    if (!hasUserMessages) {
        if (typeof window !== 'undefined' && (window as any).fbq) {
            console.log('[ChatCloudinha] Tracking FB Pixel Contact event');
            (window as any).fbq('track', 'Contact');
        }
    }

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      sender: 'user',
      text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);

    // Create placeholder for bot message
    const botMsgId = (Date.now() + 1).toString();
    setCurrentStreamId(botMsgId);

    // We add the bot message immediately
    setMessages((prev) => [...prev, {
        id: botMsgId,
        sender: 'cloudinha',
        text: '',
        timestamp: new Date(),
        thinking_groups: []
    }]);

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers,
        body: JSON.stringify({ message: text }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      if (!response.body) throw new Error('No readable stream');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';

      while (!done) {
        const { value, done: DONE } = await reader.read();
        done = DONE;
        if (value) {
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            // Keep the last part (potential incomplete line) in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (line.trim() === '') continue;
                try {
                    const event = JSON.parse(line);

                    if (event.type === 'text') {
                        setMessages((prev) => prev.map(msg =>
                            msg.id === botMsgId
                            ? { ...msg, text: msg.text + event.content }
                            : msg
                        ));
                    }
                     else if (event.type === 'control') {
                          console.log("[ChatCloudinha] Received CONTROL event:", event);
                          if (event.action === 'block_input') {
                              // Trigger parent to show wizard (which will disable input via props)
                              if (onWizardRequest) onWizardRequest();
                              
                              // Mobile: also switch tab so they see it
                              if (onFunctionalitySwitch) onFunctionalitySwitch('MATCH');
                              if (onTabSwitch && typeof window !== 'undefined' && window.innerWidth < 768) {
                                  onTabSwitch('CONTENT');
                              }
                          }
                     }
                    else if (event.type === 'tool_start') {
                        // CHECK FOR CONTEXT SWITCH (Via Router OR Workflow Enforcement)
                        if (onFunctionalitySwitch) {
                              const target = event.args?.target || event.args?.workflow; // 'target' from RouterAgent, 'workflow' from Workflow Objects

                              if (target === 'sisu_workflow') onFunctionalitySwitch('SISU');
                              else if (target === 'prouni_workflow') onFunctionalitySwitch('PROUNI');
                              else if (target === 'match_workflow') onFunctionalitySwitch('MATCH');
                              else if (target === 'onboarding_workflow') {
                                  // Save the current user message to trigger restart later if needed
                                  // We use 'text' directly because 'messages' state might be stale in this closure
                                  if (text && !localStorage.getItem('nubo_onboarding_trigger')) {
                                      localStorage.setItem('nubo_onboarding_trigger', text);
                                  }
                                  onFunctionalitySwitch('ONBOARDING');
                              }
                        }

                        setMessages((prev) => prev.map(msg => {
                            if (msg.id !== botMsgId) return msg;

                            const groups = msg.thinking_groups || [];
                            const lastGroup = groups[groups.length - 1];
                            const isGroupStarter = event.tool in GROUP_LABEL_MAP;

                            if (isGroupStarter) {
                                // Check if we already have a group with this label (merge instead of creating new)
                                const targetLabel = getGroupLabel(event.tool, event.args);
                                const existingGroupIdx = groups.findIndex(g => g.label === targetLabel && g.status === 'loading');
                                
                                if (existingGroupIdx !== -1) {
                                    // Add to existing group instead of creating new one
                                    const updatedGroups = [...groups];
                                    const existingGroup = updatedGroups[existingGroupIdx];
                                    updatedGroups[existingGroupIdx] = {
                                        ...existingGroup,
                                        items: [...existingGroup.items, {
                                            tool: event.tool,
                                            status: 'loading',
                                            label: getToolLabel(event.tool, event.args)
                                        }]
                                    };
                                    return {
                                        ...msg,
                                        thinking_groups: updatedGroups
                                    };
                                } else {
                                    // Start new Group AND add the item (e.g. "Pensando")
                                    const newGroup: ThinkingGroup = {
                                        id: event.tool,
                                        label: targetLabel,
                                        status: 'loading',
                                        items: [{
                                            tool: event.tool,
                                            status: 'loading',
                                            label: getToolLabel(event.tool, event.args)
                                        }]
                                    };
                                    return {
                                        ...msg,
                                        thinking_groups: [...groups, newGroup]
                                    };
                                }
                            } else {
                                // Add item to last group
                                if (lastGroup && lastGroup.status === 'loading') {
                                    const newItem: ThinkingItem = {
                                        tool: event.tool,
                                        status: 'loading',
                                        label: getToolLabel(event.tool, event.args)
                                    };

                                    const updatedGroups = [...groups];
                                    updatedGroups[updatedGroups.length - 1] = {
                                        ...lastGroup,
                                        items: [...lastGroup.items, newItem]
                                    };
                                    return { ...msg, thinking_groups: updatedGroups };
                                } else {
                                    // Fallback: Create Generic Group
                                    return {
                                        ...msg,
                                        thinking_groups: [...groups, {
                                            id: 'Generic',
                                            label: 'Processando...',
                                            status: 'loading',
                                            items: [{
                                                tool: event.tool,
                                                status: 'loading',
                                                label: getToolLabel(event.tool, event.args)
                                            }]
                                        }]
                                    };
                                }
                            }
                        }));
                    } 
                    else if (event.type === 'tool_end') {
                        setMessages((prev) => prev.map(msg => {
                            if (msg.id !== botMsgId) return msg;

                            const groups = msg.thinking_groups || [];
                             // We need to find where this tool is running.
                             
                            const updatedGroups = [...groups];
                            const lastGroup = updatedGroups[updatedGroups.length - 1];

                            if (!lastGroup) return msg;

                            if (event.tool === 'RouterAgent') {
                                // Router finishing:
                                // 1. Update the Item Label to show the decision (Transferindo...)
                                // 2. Mark Group as Done (Checkmark)
                                
                                const items = lastGroup.items.map(item => 
                                    item.tool === 'RouterAgent' 
                                    ? { ...item, status: 'done' as const, output: event.output, label: getRouterLabel(null, event.output) }
                                    : item
                                );

                                updatedGroups[updatedGroups.length - 1] = {
                                    ...lastGroup,
                                    status: 'done',
                                    items
                                };
                            } else {
                                // For other tools
                                const items = lastGroup.items.map(item => 
                                    item.tool === event.tool && item.status === 'loading'
                                    ? { ...item, status: 'done' as const, output: event.output }
                                    : item
                                );
                                
                                // Check if this tool WAS the Group Starter (e.g. sisu_agent finishing)
                                // If so, mark the Group as done too.
                                const isGroupStarter = event.tool === lastGroup.id;
                                
                                let groupStatus = isGroupStarter ? 'done' : lastGroup.status;

                                // [HACK] Special combining logic for "Analisando Contexto"
                                // Keep group open through all initial steps
                                if (event.tool === 'guardrails_check' || event.tool === 'preload_student_profile') {
                                    groupStatus = 'loading'; // Keep open until RouterAgent finishes
                                }
                                if (event.tool === 'RouterAgent') {
                                    groupStatus = 'done'; // Close after Router finishes
                                }


                                updatedGroups[updatedGroups.length - 1] = {
                                    ...lastGroup,
                                    status: groupStatus as 'done' | 'loading',
                                    items
                                };

                                // --- SPECIAL HANDLING: Search Opportunities ---
                                if (['searchOpportunitiesTool', 'searchOpportunities', 'search_opportunities'].includes(event.tool)) {
                                    console.log("[ChatCloudinha] Processing search tool output:", event.tool);
                                    
                                    // 1. Try Strict JSON Parse first (Best Case)
                                    let data;
                                    try {
                                        data = JSON.parse(event.output);
                                        console.log("[ChatCloudinha] Strict JSON parse success", data ? "Has Data" : "Empty");
                                    } catch (e) {
                                        console.warn("[ChatCloudinha] Strict JSON parse failed, trying sanitize...", e);
                                        // 2. Fallback: Sanitize Python String to JSON
                                        try {
                                            const sanitized = event.output
                                                .replace(/'/g, '"')
                                                .replace(/None/g, 'null')
                                                .replace(/True/g, 'true')
                                                .replace(/False/g, 'false');
                                            data = JSON.parse(sanitized);
                                            console.log("[ChatCloudinha] Sanitized JSON parse success");
                                        } catch (e2) {
                                            console.error("[ChatCloudinha] Failed to parse opportunities output (Strict & Sanitize)", e2);
                                            console.log("[ChatCloudinha] Raw output causing error:", event.output);
                                        }
                                    }

                                    if (data) {
                                        // Handle payload wrapper { result: ... } or direct data
                                        const payload = data.result || data;
                                        console.log("[ChatCloudinha] Payload type:", typeof payload);
                                        
                                        let ids: string[] = [];

                                        // New Format (v2): { summary: "", results: [...] }
                                        if (payload.results && Array.isArray(payload.results)) {
                                             ids = payload.results.map((r: any) => r.course_id).filter(Boolean);
                                             console.log("[ChatCloudinha] Found 'results' in payload:", ids.length);
                                        }
                                        // New Format (v1): { course_ids: [...] }
                                        else if (payload.course_ids && Array.isArray(payload.course_ids)) {
                                             ids = payload.course_ids;
                                             console.log("[ChatCloudinha] Found 'course_ids' in payload:", ids.length);
                                        } 
                                        // Old Format: [{ id: ... }, ...]
                                        else if (Array.isArray(payload) && payload.length > 0) {
                                            ids = payload.map((r: any) => r.id || r.course_id).filter(Boolean);
                                            console.log("[ChatCloudinha] Extracted IDs from array:", ids.length);
                                        } else {
                                            console.log("[ChatCloudinha] No course IDs found in payload");
                                        }
                                        
                                        // 2. Update Message State with IDs
                                        if (ids.length > 0) {
                                            console.log("[ChatCloudinha] Opportunities found (Direct Search). Showing actions.");

                                            // Block Input & Show Actions


                                            if (onOpportunitiesFound) {
                                                setTimeout(() => onOpportunitiesFound(ids), 0);
                                            }
                                            return { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                        }
                                    }

                                    // 3. Fallback/Sync: Always trigger profile update to check DB for saved workflow_data
                                    if (onProfileUpdated) {
                                         console.log("[ChatCloudinha] Search finished. Triggering DB refresh to check workflow_data.");
                                         setTimeout(() => onProfileUpdated(), 500);
                                    }
                                }

                                
                                // --- SPECIAL HANDLING: Update Student Profile (Onboarding Check & Auto-Search via "Deterministic Flow") ---
                                if (['updateStudentProfileTool', 'updateStudentProfile'].includes(event.tool)) {
                                     try {
                                        // 1. Parse Output
                                        let data;
                                        try {
                                            data = JSON.parse(event.output);
                                        } catch (e) {
                                            // Strategy 2: Unwrap {'result': 'JSON_STRING'} safely WITHOUT regex
                                            // Ensure we handle potential spacing variations if needed, but strict is safer for now.
                                            const marker = "'result': '"; 
                                            const startIdx = event.output.indexOf(marker);
                                            
                                            if (startIdx !== -1) {
                                                try {
                                                    // Start after marker
                                                    const contentStart = startIdx + marker.length;
                                                    // Find the LAST single quote (before the closing brace)
                                                    const contentEnd = event.output.lastIndexOf("'");
                                                    
                                                    if (contentEnd > contentStart) {
                                                        let inner = event.output.substring(contentStart, contentEnd);
                                                        // Unescape python string
                                                        inner = inner.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                                                        data = JSON.parse(inner);
                                                        console.log("[ChatCloudinha] Unwrapped Python-style output successfully");
                                                    } else {
                                                        console.warn("[ChatCloudinha] Unwrap failed: contentEnd <= contentStart", { contentStart, contentEnd });
                                                    }
                                                } catch (e2) {
                                                    console.warn("[ChatCloudinha] Failed unwrapping strategy 2:", e2);
                                                }
                                            }

                                            if (!data) {
                                                // Strategy 3: The old "Cleaner" (fallback)
                                                console.log("[ChatCloudinha] Attempting fallback strategy 3");
                                                const cleanOutput = event.output
                                                    .replace(/'/g, '"')
                                                    .replace(/True/g, 'true')
                                                    .replace(/False/g, 'false')
                                                    .replace(/None/g, 'null');
                                                try {
                                                    data = JSON.parse(cleanOutput);
                                                } catch (e3) {
                                                    console.error("[ChatCloudinha] All parsing strategies failed.");
                                                    console.log("[ChatCloudinha] Raw FAILING output:", event.output);
                                                }
                                            }
                                        }
                                        
                                        if (!data) {
                                            console.warn("[ChatCloudinha] Parsing failed completely, skipping profile update logic.");
                                            return msg;
                                        }

                                        const profile = data.result || data;

                                        // A) Onboarding Check
                                        if (profile && profile.onboarding_completed === true) {
                                            // Trigger UI Refresh
                                            if (onProfileUpdated) {
                                                console.log("[ChatCloudinha] Triggering onProfileUpdated (Profile Updated)");
                                                onProfileUpdated();
                                            }
                                            
                                            // Mark message as success (Frontend Component Trigger)
                                            // We relying on page.tsx to handle the auto-trigger via onProfileUpdated -> Effect
                                            return { ...msg, is_onboarding_success: true, thinking_groups: updatedGroups };
                                        }
                                        
                                        // B) Auto-Search Results Check (Deterministic Flow)
                                        // If the tool ran search internally, it returns 'auto_search_results' (JSON string of courses OR object if unmarshalled)
                                        if (profile && profile.auto_search_results) {
                                            console.log("[ChatCloudinha] Found auto_search_results in update tool!");
                                            
                                            // auto_search_results is likely a JSON string itself (from searchOpportunitiesTool)
                                            let searchData = profile.auto_search_results;
                                            if (typeof searchData === 'string') {
                                                try {
                                                    searchData = JSON.parse(searchData);
                                                } catch (e) {
                                                    console.error("Failed to parse inner auto_search_results", e);
                                                }
                                            }
                                            
                                            const payload = searchData.result || searchData;
                                             
                                            let ids: string[] = [];
                                            
                                            // New Format (v2): { summary: "", results: [...] }
                                            if (payload.results && Array.isArray(payload.results)) {
                                                ids = payload.results.map((r: any) => r.course_id).filter(Boolean);
                                                console.log("[ChatCloudinha] Found 'results' in auto-search:", ids.length);
                                            }
                                            // New Format (v1): { course_ids: [...] }
                                            else if (payload.course_ids && Array.isArray(payload.course_ids)) {
                                                ids = payload.course_ids;
                                                console.log("[ChatCloudinha] Found 'course_ids' in auto-search:", ids.length);
                                            }
                                            // Old Format: [{ id: ... }, ...]
                                            else if (Array.isArray(payload) && payload.length > 0) {
                                                ids = payload.map((r: any) => r.id || r.course_id).filter(Boolean);
                                                console.log("[ChatCloudinha] Extracted IDs from auto-search array:", ids.length);
                                            }

                                            if (ids.length > 0) {
                                                console.log("[ChatCloudinha] Opportunities found (Auto-Search). Showing actions.");

                                                // Block Input & Show Actions


                                                if (onOpportunitiesFound) {
                                                    setTimeout(() => onOpportunitiesFound(ids), 0);
                                                }
                                                // Return updated message state
                                                return { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                            }
                                        }

                                     } catch (e) {
                                         console.error("Error processing updateStudentProfile output:", e);
                                     }

                                     // Trigger UI Refresh
                                     if (onProfileUpdated) {
                                         console.log("[ChatCloudinha] Triggering onProfileUpdated (Profile Updated)");
                                         onProfileUpdated();
                                     }
                                }
                                }
                                
                                // --- SPECIAL HANDLING: Update Student Preferences (Match Flow) ---
                                if (['updateStudentPreferencesTool', 'updateStudentPreferences'].includes(event.tool)) {
                                     try {
                                        // 1. Parse Output
                                        let data;
                                        try {
                                            data = JSON.parse(event.output);
                                        } catch (e) {
                                            // Fallback unwrappers
                                            const marker = "'result': '"; 
                                            const startIdx = event.output.indexOf(marker);
                                            if (startIdx !== -1) {
                                                try {
                                                    const contentStart = startIdx + marker.length;
                                                    const contentEnd = event.output.lastIndexOf("'");
                                                    if (contentEnd > contentStart) {
                                                        let inner = event.output.substring(contentStart, contentEnd);
                                                        inner = inner.replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                                                        data = JSON.parse(inner);
                                                    }
                                                } catch (e2) {}
                                            }
                                        }

                                        if (data) {
                                            const payload = data.result || data;
                                            
                                            // Check for direct search results in payload
                                            if (payload.auto_search_results) {
                                                console.log("[ChatCloudinha] Found auto_search_results in preferences update");
                                                
                                                // Try to parse inner string if needed
                                                let searchData = payload.auto_search_results;
                                                if (typeof searchData === 'string') {
                                                    try { searchData = JSON.parse(searchData); } catch(e){}
                                                }
                                                
                                                const searchPayload = searchData.result || searchData;
                                                
                                                // Check for "results" or "course_ids"
                                                let ids: string[] = [];
                                                if (searchPayload.results && Array.isArray(searchPayload.results)) {
                                                    ids = searchPayload.results.map((r: any) => r.course_id).filter(Boolean);
                                                } else if (searchPayload.course_ids && Array.isArray(searchPayload.course_ids)) {
                                                    ids = searchPayload.course_ids;
                                                }
                                                
                                                if (ids.length > 0) {
                                                     console.log("[ChatCloudinha] Extracted IDs from preferences update:", ids.length);

                                                     if (onOpportunitiesFound) setTimeout(() => onOpportunitiesFound(ids), 0);
                                                     // Update local message state
                                                     const updatedMsg = { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                                     // If we found IDs directly, we return early
                                                     // But we STILL want to trigger onProfileUpdated to sync DB state
                                                     if (onProfileUpdated) onProfileUpdated();
                                                     return updatedMsg;
                                                }
                                            }
                                            
                                            // Always trigger Profile Update if preferences changed
                                            if (payload.preferences_updated || payload.search_performed) {
                                                console.log("[ChatCloudinha] Preferences updated, triggering refresh");
                                                if (onProfileUpdated) onProfileUpdated();
                                            }
                                        }
                                     } catch (e) {
                                         console.error("Error processing updateStudentPreferences output:", e);
                                     }
                                }

                            return { ...msg, thinking_groups: updatedGroups };
                        }));
                    }

                    else if (event.type === 'error') {
                        console.error("Stream Error:", event.content);
                        setMessages((prev) => prev.map(msg => {
                            if (msg.id !== botMsgId) return msg;

                            // 1. Mark loading groups as error/done
                            const updatedGroups = (msg.thinking_groups || []).map(group => {
                                if (group.status === 'loading') {
                                    return {
                                        ...group,
                                        status: 'done' as const, 
                                        label: `${group.label} (Erro)`, // Mark group as errored
                                        items: group.items.map(item => 
                                            item.status === 'loading' 
                                            ? { ...item, status: 'error' as const, label: `${item.label} (Falhou)` }
                                            : item
                                        )
                                    };
                                }
                                return group;
                            });

                            // 2. Append Error Text to the message
                            // We add a newline if there is already text
                            const errorText = `\n\n⚠️ **Erro**: ${event.content}`;

                            return {
                                ...msg,
                                ...{ text: msg.text + errorText },
                                thinking_groups: updatedGroups
                            };
                        }));
                    }
                } catch (e) {
                    // Buffer incomplete line? No, buffer is handled outside. 
                    // This catch is for malformed JSON in a COMPLETE line.
                    console.error("Error parsing processed line:", line, e);
                }
            }
        }
      }

      // Final pass: Mark all groups as done when stream ends?
      setMessages((prev) => prev.map(msg => 
        msg.id === botMsgId 
        ? { 
            ...msg, 
            thinking_groups: (msg.thinking_groups || []).map(g => ({ ...g, status: 'done' })) 
          } 
        : msg
      ));

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => prev.map(msg => 
          msg.id === botMsgId 
          ? { ...msg, text: msg.text + '\n(Erro de conexão. Tente novamente.)' }
          : msg
      ));
    } finally {
      setIsTyping(false);
      setCurrentStreamId(null);
    }
  };



  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="h-[97px] flex items-center px-6 border-b border-white/20 flex-shrink-0 bg-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full relative overflow-hidden shadow-sm border border-white/20 bg-white">
             <Image 
               src="/assets/cloudinha.png" 
               alt="Cloudinha" 
               width={48} 
               height={48} 
               className="object-cover"
               quality={100}
             />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-bold text-[#024F86] leading-[24px]">Cloudinha</h2>
            <p className="text-[14px] text-[#636E7C] leading-[20px]">
              Em desenvolvimento
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Switch - Integrated into Flow (Only shows if props provided) */}
      {activeTab && onTabSwitch && (
          <div className="md:hidden flex-none p-4 pb-0 flex justify-center w-full z-30">
             <MobileTabSwitch 
                activeTab={activeTab} 
                onTabSwitch={onTabSwitch}
                isPending={isPending || false}
                pendingTarget={pendingTarget || null}
             />
          </div>
      )}


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#024F86]/20 scrollbar-track-transparent">
        {isLoadingHistory ? (
          <div className="flex flex-col items-center justify-center h-full w-full gap-2 min-h-[200px]">
            <Loader2 className="w-8 h-8 text-[#024F86] animate-spin" />
            <p className="text-sm font-medium text-[#024F86]">Carregando mensagens...</p>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className="flex flex-col gap-6">
             {/* Render Thinking Groups (Hierarchical) - ALWAYS FIRST */}
             {msg.thinking_groups && msg.thinking_groups.length > 0 && (
                 <div className="ml-[60px] flex flex-col gap-2">
                     {msg.thinking_groups.map((group, grpIdx) => (
                         <div key={grpIdx} className="bg-white/40 rounded-xl overflow-hidden border border-[#024F86]/10 shadow-sm backdrop-blur-sm">
                             {/* Group Header */}
                             <div className="flex items-center gap-3 p-3 bg-white/40 border-b border-[#024F86]/5">
                                 <div className="flex-shrink-0">
                                     {group.status === 'loading' ? (
                                         <Loader2 className="w-4 h-4 text-[#024F86] animate-spin" />
                                     ) : (
                                         <CheckCircle2 className="w-4 h-4 text-green-500" />
                                     )}
                                 </div>
                                 <span className="text-sm text-[#024F86] font-semibold">
                                     {group.label}
                                 </span>
                             </div>

                             {/* Group Items */}
                             {group.items.length > 0 && (
                                 <div className="flex flex-col gap-1 p-2 pl-4">
                                     {group.items.map((item, itmIdx) => (
                                         <motion.div 
                                             key={itmIdx}
                                             initial={{ opacity: 0, x: -10 }}
                                             animate={{ opacity: 1, x: 0 }}
                                             className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#024F86]/5 transition-colors"
                                         >
                                             <div className="flex-shrink-0 w-4 flex justify-center">
                                                {/* Sub-item status icon */}
                                                 {item.status === 'loading' ? (
                                                     <div className="w-1.5 h-1.5 bg-[#024F86]/40 rounded-full animate-pulse" />
                                                 ) : (
                                                     <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                                                 )}
                                             </div>
                                             
                                             <div className="flex items-center gap-2 text-xs text-[#636E7C] font-medium">
                                                 {getToolIcon(item.label)}
                                                 <span>{item.label}</span>
                                             </div>
                                         </motion.div>
                                     ))}
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             )}

              {/* Message Bubble - ALWAYS LAST (Shows dots if thinking, text if done) */}
             {/* Message Bubble OR Success Component */}
             {msg.is_onboarding_success ? (
                 <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full flex justify-start"
                 >
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3 shadow-sm backdrop-blur-sm max-w-[80%]">
                        <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex flex-col">
                             <span className="text-sm font-semibold text-green-700">Perfil Atualizado! 🚀</span>
                             <span className="text-xs text-green-600/80">Tudo pronto para buscar suas oportunidades.</span>
                        </div>
                    </div>
                 </motion.div>
             ) : (
                 (msg.text || msg.sender === 'user') && (
                     <MessageBubble 
                        message={msg} 
                        userAvatar={user?.avatar} 
                        onFeedback={(score: number, type: string) => {
                            if (!user) return;
                            // Generate/Use Session ID
                            // We need to persist a session ID. For now we can use a ref or generate one if empty
                            let currentSessionId = sessionStorage.getItem('nubo_chat_session_id');
                            if (!currentSessionId) {
                                 currentSessionId = crypto.randomUUID();
                                 sessionStorage.setItem('nubo_chat_session_id', currentSessionId);
                            }
        
                            supabase.from('agent_feedback').insert({
                                user_id: user.id,
                                session_id: currentSessionId,
                                feedback_type: type,
                                score: score,
                                content: score === 1 ? 'Thumbs Up' : 'Thumbs Down',
                                metadata: { message_id: msg.id }
                            }).then(({ error }) => {
                                if (error) console.error("Feedback error:", error);
                                else console.log("Feedback sent:", score);
                            });
                        }}
                     />
                 )
             )}
          </div>
        ))}
        
        {/* Only show typing bubbles if typing AND no streaming started yet? */}
        {isTyping && !currentStreamId && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-[#024F86]/60 text-sm p-3 bg-white/50 border border-[#024F86]/10 rounded-2xl w-fit shadow-sm"
          >
            <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-[#024F86] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 px-6 pb-6 pt-4">

        <div className="w-full max-w-4xl mx-auto px-4 pb-4">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isLoading={isTyping}
            disabled={isTyping || inputDisabled}
          />
        </div>
    </div>



    </div>
  );
}
