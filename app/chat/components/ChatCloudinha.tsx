'use client';

import React, { useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import ChatInput from './ChatInput';
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
  opportunity_ids?: string[];
  course_ids?: string[];
  thinking_groups?: ThinkingGroup[];
}

import { supabase } from '@/lib/supabaseClient';

// --- MAPPING LOGIC ---
const ITEM_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Decidindo fluxo...',
    'getStudentProfileTool': 'Lendo Perfil do Estudante',
    'getStudentProfile': 'Lendo Perfil do Estudante',
    'updateStudentProfileTool': 'Editando Perfil do Estudante',
    'updateStudentProfile': 'Editando Perfil do Estudante',
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
    'sisu_agent': 'Pensando',
    'prouni_agent': 'Pensando',
    'match_workflow': 'Pensando',
    'onboarding_workflow': 'Pensando',
    'onboarding_name': 'Passo 1 - Nome',
    'onboarding_age': 'Passo 2 - Idade',
    'onboarding_city': 'Passo 3 - Localização',
    'onboarding_education': 'Passo 4 - Escolaridade',
    'logModerationTool': 'Registrando Log de Moderação',
    'logModeration': 'Registrando Log de Moderação'
};

const GROUP_LABEL_MAP: Record<string, string> = {
    'RouterAgent': 'Analisando Contexto',
    'sisu_agent': 'Perguntando pro Especialista Sisu',
    'prouni_agent': 'Perguntando pro Especialista Prouni',
    'match_workflow': 'Consultando Agente de Match',
    'onboarding_workflow': 'Iniciando Onboarding'
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
    return 'Decidindo melhor especialista...';
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
  onOpportunitiesFound 
}: { 
  initialMessage?: string;
  onInitialMessageSent?: () => void;
  onOpportunitiesFound?: (ids: string[]) => void;
}) {
  const { user, isAuthenticated, session } = useAuth();
  
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = React.useState(true);
  const [isTyping, setIsTyping] = React.useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasSentInitialMessage = useRef(false);

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
          setMessages(history);
        } else {
          setMessages([]);
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
    // Only proceed if we have a message, haven't sent it yet, AND history is done loading
    if (initialMessage && !hasSentInitialMessage.current && !isLoadingHistory) {
      hasSentInitialMessage.current = true;
      // Small delay to ensure state is ready
      setTimeout(() => {
        handleSendMessage(initialMessage);
        if (onInitialMessageSent) {
          onInitialMessageSent();
        }
      }, 500);
    }
    // Note: We intentionally do NOT include handleSendMessage in deps to avoid loops, 
    // effectively treating it as a stable callback for this purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage, isLoadingHistory, onInitialMessageSent]);

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

      while (!done) {
        const { value, done: DONE } = await reader.read();
        done = DONE;
        if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(line => line.trim() !== '');

            for (const line of lines) {
                try {
                    const event = JSON.parse(line);

                    if (event.type === 'text') {
                        setMessages((prev) => prev.map(msg =>
                            msg.id === botMsgId
                            ? { ...msg, text: msg.text + event.content }
                            : msg
                        ));
                    }
                    else if (event.type === 'tool_start') {
                        setMessages((prev) => prev.map(msg => {
                            if (msg.id !== botMsgId) return msg;

                            const groups = msg.thinking_groups || [];
                            const lastGroup = groups[groups.length - 1];
                            const isGroupStarter = event.tool in GROUP_LABEL_MAP;

                            if (isGroupStarter) {
                                // Start new Group AND add the item (e.g. "Pensando")
                                const newGroup: ThinkingGroup = {
                                    id: event.tool,
                                    label: getGroupLabel(event.tool, event.args),
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
                                
                                updatedGroups[updatedGroups.length - 1] = {
                                    ...lastGroup,
                                    status: isGroupStarter ? 'done' : lastGroup.status,
                                    items
                                };
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
                                text: msg.text + errorText,
                                thinking_groups: updatedGroups
                            };
                        }));
                    }
                } catch (e) {
                    console.error("Error parsing chunk:", e);
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
          <div className="w-12 h-12 rounded-full relative overflow-hidden shadow-sm border border-white/20">
             <div className="w-full h-full bg-gradient-to-tr from-[#024F86] to-[#38B1E4] flex items-center justify-center">
                <span className="text-2xl drop-shadow-md">☁️</span>
             </div>
          </div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-bold text-[#024F86] leading-[24px]">Cloudinha</h2>
            <p className="text-[14px] text-[#636E7C] leading-[20px]">
              Assistente Virtual
            </p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-[#024F86]/20 scrollbar-track-transparent">
        {messages.map((msg) => (
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
             <MessageBubble message={msg} userAvatar={user?.avatar} />

             {msg.course_ids && msg.course_ids.length > 0 && (
                 <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="w-full"
                 >
                    <div className="p-4 bg-white/40 rounded-xl border border-[#024F86]/10 text-sm text-[#024F86] flex items-center gap-3 shadow-sm backdrop-blur-sm">
                        <span className="text-xl">👉</span>
                        <span className="font-medium">Encontrei {msg.course_ids.length} oportunidades! Veja os detalhes no painel ao lado.</span>
                    </div>
                 </motion.div>
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
        <ChatInput onSendMessage={handleSendMessage} isLoading={isTyping} />
      </div>
    </div>
  );
}
