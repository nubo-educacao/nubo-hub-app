'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/context/AuthContext';

export interface ThinkingItem {
    tool: string;
    status: 'loading' | 'done' | 'error';
    label: string;
    output?: string;
}

export interface ThinkingGroup {
    id: string;
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
    is_onboarding_success?: boolean;
}

// --- MAPPING LOGIC ---
const ITEM_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Decidindo fluxo...',
    'getStudentProfileTool': 'Lendo seu Perfil',
    'getStudentProfile': 'Lendo seu Perfil',
    'updateStudentProfileTool': 'Atualizando seu Perfil',
    'updateStudentProfile': 'Atualizando seu Perfil',
    'updateStudentPreferencesTool': 'Salvando suas Preferências',
    'updateStudentPreferences': 'Salvando suas Preferências',
    'searchOpportunitiesTool': 'Procurando Oportunidades',
    'searchOpportunities': 'Procurando Oportunidades',
    'search_opportunities': 'Procurando Oportunidades',
    'getImportantDatesTool': 'Verificando Prazos',
    'getImportantDates': 'Verificando Prazos',
    'get_important_dates': 'Verificando Prazos',
    'knowledgeSearchTool': 'Consultando Base de Dados',
    'knowledgeSearch': 'Consultando Base de Dados',
    'search_knowledge': 'Consultando Base de Dados',
    'searchKnowledgeTool': 'Consultando Base de Dados',
    'rag_search': 'Consultando Base de Dados',
    'duckDuckGoSearchTool': 'Pesquisando na Internet',
    'duckDuckGoSearch': 'Pesquisando na Internet',
    'smartResearchTool': 'Consultando Conhecimento',
    'smartResearch': 'Consultando Conhecimento',
    'readRulesTool': 'Lendo Regras',
    'processDependentChoiceTool': 'Registrando sua escolha',
    'processDependentChoice': 'Registrando sua escolha',
    'startStudentApplicationTool': 'Iniciando sua candidatura',
    'startStudentApplication': 'Iniciando sua candidatura',
    'getPartnerFormsTool': 'Analisando o edital',
    'getPartnerForms': 'Analisando o edital',
    'getStudentApplicationTool': 'Verificando sua inscrição',
    'getStudentApplication': 'Verificando sua inscrição',
    'getEligibilityResultsTool': 'Calculando seus matches',
    'getEligibilityResults': 'Calculando seus matches',
    'rewindWorkflowStatusTool': 'Voltando uma etapa',
    'reasoning_agent': 'Processando contexto...',
    'response_agent': 'Formulando Resposta',
    'onboarding_reasoning_agent': 'Organizando seus dados',
    'ask_dependent_reasoning_agent': 'Analisando o destinatário',
    'dependent_onboarding_reasoning_agent': 'Organizando dados do dependente',
    'program_match_reasoning_agent': 'Buscando melhores opções',
    'evaluate_reasoning_agent': 'Analisando o edital',
    'concluded_agent': 'Preparando próximos passos',
    'sisu_agent': 'Processando',
    'prouni_agent': 'Processando',
    'match_workflow': 'Processando',
    'match_agent': 'Processando',
    'match_iterative': 'Processando',
    'onboarding_workflow': 'Processando',
    'onboarding_agent': 'Processando',
    'onboarding_name': 'Passo 1 - Nome',
    'onboarding_age': 'Passo 2 - Idade',
    'onboarding_city': 'Passo 3 - Localização',
    'onboarding_education': 'Passo 4 - Escolaridade',
    'logModerationTool': 'Verificando Moderação',
    'logModeration': 'Registrando Log de Moderação',
    'guardrails_check': 'Validando mensagem',
    'preload_student_profile': 'Buscando perfil',
    'suggestRefinementTool': 'Refinando sugestões'
};

const GROUP_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Analisando Contexto',
    'sisu_agent': 'Especialista Sisu',
    'prouni_agent': 'Especialista Prouni',
    'match_workflow': 'Agente de Match',
    'match_agent': 'Agente de Match',
    'match_iterative': 'Agente de Match',
    'onboarding_workflow': 'Agente de Onboarding',
    'onboarding_agent': 'Agente de Onboarding',
    'guardrails_check': 'Segurança',
    'reasoning_agent': 'Agente de Raciocínio',
    'response_agent': 'Agente de Resposta',
    'onboarding_reasoning_agent': 'Agente de Onboarding',
    'ask_dependent_reasoning_agent': 'Agente de Triagem',
    'dependent_onboarding_reasoning_agent': 'Agente do Dependente',
    'program_match_reasoning_agent': 'Agente de Match',
    'evaluate_reasoning_agent': 'Agente de Avaliação',
    'concluded_agent': 'Agente de Finalização',
};

const getRouterLabel = (args?: any, output?: string) => {
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

export function useChatCloudinha(options?: {
    uiFormState?: any;
    onOpportunitiesFound?: (ids: string[]) => void;
    onFunctionalitySwitch?: (func: 'MATCH' | 'PROUNI' | 'SISU' | 'ONBOARDING') => void;
    onProfileUpdated?: () => void;
    onWizardRequest?: () => void;
    onTabSwitch?: (tab: 'CHAT' | 'CONTENT') => void;
    currentPath?: string;
}) {
    const { user, session } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(true);
    const [isTyping, setIsTyping] = useState(false);
    const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

    // Fetch History
    useEffect(() => {
        if (user) {
            const fetchHistory = async () => {
                setIsLoadingHistory(true);
                const { data } = await supabase
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
                        const localMessages = prev.filter(m => !isNaN(Number(m.id)));
                        const unsavedLocals = localMessages.filter(local =>
                            !history.some(h => h.text === local.text && h.sender === local.sender)
                        );
                        return [...history, ...unsavedLocals];
                    });
                }
                setIsLoadingHistory(false);
            };
            fetchHistory();
        } else {
            setMessages([]);
            setIsLoadingHistory(false);
        }
    }, [user]);

    const handleSendMessage = async (text: string) => {
        const tempId = Date.now().toString();
        const newMessage: Message = {
            id: tempId,
            sender: 'user',
            text,
            timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newMessage]);
        setIsTyping(true);

        const botMsgId = (Date.now() + 1).toString();
        setCurrentStreamId(botMsgId);

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

            const payload = {
                message: text,
                ui_form_state: options?.uiFormState,
                current_path: options?.currentPath,
            };

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers,
                body: JSON.stringify(payload),
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
                                if (event.action === 'block_input') {
                                    if (options?.onWizardRequest) options.onWizardRequest();
                                    if (options?.onFunctionalitySwitch) options.onFunctionalitySwitch('MATCH');
                                    if (options?.onTabSwitch && typeof window !== 'undefined' && window.innerWidth < 768) {
                                        options.onTabSwitch('CONTENT');
                                    }
                                }
                            }
                            else if (event.type === 'tool_start') {
                                if (options?.onFunctionalitySwitch) {
                                    const target = event.args?.target || event.args?.workflow;
                                    if (target === 'sisu_workflow') options.onFunctionalitySwitch('SISU');
                                    else if (target === 'prouni_workflow') options.onFunctionalitySwitch('PROUNI');
                                    else if (target === 'match_workflow') options.onFunctionalitySwitch('MATCH');
                                    else if (target === 'onboarding_workflow') {
                                        if (text && !localStorage.getItem('nubo_onboarding_trigger')) {
                                            localStorage.setItem('nubo_onboarding_trigger', text);
                                        }
                                        options.onFunctionalitySwitch('ONBOARDING');
                                    }
                                }

                                setMessages((prev) => prev.map(msg => {
                                    if (msg.id !== botMsgId) return msg;

                                    const groups = msg.thinking_groups || [];
                                    const lastGroup = groups[groups.length - 1];
                                    const isGroupStarter = event.tool in GROUP_LABEL_MAP;

                                    if (isGroupStarter) {
                                        const targetLabel = getGroupLabel(event.tool, event.args);
                                        const existingGroupIdx = groups.findIndex(g => g.label === targetLabel && g.status === 'loading');

                                        if (existingGroupIdx !== -1) {
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
                                            return { ...msg, thinking_groups: updatedGroups };
                                        } else {
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
                                            return { ...msg, thinking_groups: [...groups, newGroup] };
                                        }
                                    } else {
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
                                    const updatedGroups = [...groups];
                                    const lastGroup = updatedGroups[updatedGroups.length - 1];
                                    if (!lastGroup) return msg;

                                    if (event.tool === 'RouterAgent') {
                                        const items = lastGroup.items.map(item =>
                                            item.tool === 'RouterAgent'
                                                ? { ...item, status: 'done' as const, output: event.output, label: getRouterLabel(null, event.output) }
                                                : item
                                        );
                                        updatedGroups[updatedGroups.length - 1] = { ...lastGroup, status: 'done', items };
                                    } else {
                                        const items = lastGroup.items.map(item =>
                                            item.tool === event.tool && item.status === 'loading'
                                                ? { ...item, status: 'done' as const, output: event.output }
                                                : item
                                        );
                                        const isGroupStarter = event.tool === lastGroup.id;
                                        let groupStatus = isGroupStarter ? 'done' : lastGroup.status;
                                        if (event.tool === 'guardrails_check' || event.tool === 'preload_student_profile') groupStatus = 'loading';
                                        if (event.tool === 'RouterAgent') groupStatus = 'done';

                                        updatedGroups[updatedGroups.length - 1] = { ...lastGroup, status: groupStatus as 'done' | 'loading', items };

                                        // Opps Logic
                                        if (['searchOpportunitiesTool', 'searchOpportunities', 'search_opportunities'].includes(event.tool)) {
                                            let data;
                                            try {
                                                data = JSON.parse(event.output);
                                            } catch (e) {
                                                try {
                                                    const sanitized = event.output.replace(/'/g, '"').replace(/None/g, 'null').replace(/True/g, 'true').replace(/False/g, 'false');
                                                    data = JSON.parse(sanitized);
                                                } catch (e2) { }
                                            }
                                            if (data) {
                                                const payload = data.result || data;
                                                let ids: string[] = [];
                                                if (payload.results && Array.isArray(payload.results)) ids = payload.results.map((r: any) => r.course_id).filter(Boolean);
                                                else if (payload.course_ids && Array.isArray(payload.course_ids)) ids = payload.course_ids;
                                                else if (Array.isArray(payload)) ids = payload.map((r: any) => r.id || r.course_id).filter(Boolean);

                                                if (ids.length > 0) {
                                                    if (options?.onOpportunitiesFound) setTimeout(() => options.onOpportunitiesFound!(ids), 0);
                                                    return { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                                }
                                            }
                                            if (options?.onProfileUpdated) setTimeout(() => options.onProfileUpdated!(), 500);
                                        }

                                        // Profile Update Logic
                                        if (['updateStudentProfileTool', 'updateStudentProfile', 'processDependentChoiceTool'].includes(event.tool)) {
                                            try {
                                                let data;
                                                try { data = JSON.parse(event.output); } catch (e) {
                                                    const marker = "'result': '";
                                                    const startIdx = event.output.indexOf(marker);
                                                    if (startIdx !== -1) {
                                                        const contentStart = startIdx + marker.length;
                                                        const contentEnd = event.output.lastIndexOf("'");
                                                        if (contentEnd > contentStart) {
                                                            let inner = event.output.substring(contentStart, contentEnd).replace(/\\'/g, "'").replace(/\\\\/g, "\\");
                                                            data = JSON.parse(inner);
                                                        }
                                                    }
                                                }
                                                if (data) {
                                                    const profile = data.result || data;
                                                    if (profile && profile.onboarding_completed === true) {
                                                        if (options?.onProfileUpdated) options.onProfileUpdated();
                                                        return { ...msg, is_onboarding_success: true, thinking_groups: updatedGroups };
                                                    }
                                                    if (profile && profile.auto_search_results) {
                                                        let searchData = profile.auto_search_results;
                                                        if (typeof searchData === 'string') try { searchData = JSON.parse(searchData); } catch (e) { }
                                                        const sp = searchData.result || searchData;
                                                        let ids: string[] = [];
                                                        if (sp.results && Array.isArray(sp.results)) ids = sp.results.map((r: any) => r.course_id).filter(Boolean);
                                                        else if (sp.course_ids && Array.isArray(sp.course_ids)) ids = sp.course_ids;
                                                        else if (Array.isArray(sp)) ids = sp.map((r: any) => r.id || r.course_id).filter(Boolean);
                                                        if (ids.length > 0) {
                                                            if (options?.onOpportunitiesFound) setTimeout(() => options.onOpportunitiesFound!(ids), 0);
                                                            return { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                                        }
                                                    }
                                                }
                                            } catch (e) { }
                                            if (options?.onProfileUpdated) setTimeout(() => options.onProfileUpdated!(), 500);
                                        }

                                        // Prefs Update Logic
                                        if (['updateStudentPreferencesTool', 'updateStudentPreferences'].includes(event.tool)) {
                                            try {
                                                let data;
                                                try { data = JSON.parse(event.output); } catch (e) { }
                                                if (data) {
                                                    const payload = data.result || data;
                                                    if (payload.auto_search_results) {
                                                        let searchData = payload.auto_search_results;
                                                        if (typeof searchData === 'string') try { searchData = JSON.parse(searchData); } catch (e) { }
                                                        const sp = searchData.result || searchData;
                                                        let ids: string[] = [];
                                                        if (sp.results && Array.isArray(sp.results)) ids = sp.results.map((r: any) => r.course_id).filter(Boolean);
                                                        else if (sp.course_ids && Array.isArray(sp.course_ids)) ids = sp.course_ids;
                                                        if (ids.length > 0) {
                                                            if (options?.onOpportunitiesFound) setTimeout(() => options.onOpportunitiesFound!(ids), 0);
                                                            if (options?.onProfileUpdated) options.onProfileUpdated();
                                                            return { ...msg, course_ids: ids, thinking_groups: updatedGroups };
                                                        }
                                                    }
                                                    if (payload.preferences_updated || payload.search_performed) {
                                                        if (options?.onProfileUpdated) options.onProfileUpdated();
                                                    }
                                                }
                                            } catch (e) { }
                                        }
                                    }
                                    return { ...msg, thinking_groups: updatedGroups };
                                }));
                            }
                            else if (event.type === 'error') {
                                setMessages((prev) => prev.map(msg => {
                                    if (msg.id !== botMsgId) return msg;
                                    const updatedGroups = (msg.thinking_groups || []).map(group => {
                                        if (group.status === 'loading') {
                                            return {
                                                ...group,
                                                status: 'done' as const,
                                                label: `${group.label} (Erro)`,
                                                items: group.items.map(item =>
                                                    item.status === 'loading' ? { ...item, status: 'error' as const, label: `${item.label} (Falhou)` } : item
                                                )
                                            };
                                        }
                                        return group;
                                    });
                                    return { ...msg, text: msg.text + `\n\n⚠️ **Erro**: ${event.content}`, thinking_groups: updatedGroups };
                                }));
                            }
                        } catch (e) { }
                    }
                }
            }

            setMessages((prev) => prev.map(msg =>
                msg.id === botMsgId ? { ...msg, thinking_groups: (msg.thinking_groups || []).map(g => ({ ...g, status: 'done' })) } : msg
            ));

        } catch (error) {
            setMessages((prev) => prev.map(msg =>
                msg.id === botMsgId ? { ...msg, text: msg.text + '\n(Erro de conexão. Tente novamente.)' } : msg
            ));
        } finally {
            setIsTyping(false);
            setCurrentStreamId(null);
            if (options?.onProfileUpdated) options.onProfileUpdated();
        }
    };

    return {
        messages,
        setMessages,
        isTyping,
        isLoadingHistory,
        currentStreamId,
        handleSendMessage
    };
}
