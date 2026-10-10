'use client';
import React, { useState } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import SourcesPanel from './SourcesPanel';
import KnowledgeMap from './KnowledgeMap';
import { ClaimV2 as Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
  disagreements?: any[];
  suggested_follow_ups?: string[];
  primary_topic?: string | null;
  related_topics?: string[] | null;
  status?: 'answered' | 'not_covered' | 'out_of_scope';
  timestamp?: string;
  isError?: boolean;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isKnowledgeMapOpen, setIsKnowledgeMapOpen] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const [loadingStatus, setLoadingStatus] = useState<string | null>(null);

  const handleSelectClaim = (claim: Claim) => {
    setSelectedClaim(claim);
    setIsSourcesOpen(true);
  };

  const handleSend = async (text: string) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMessages: Message[] = [...messages, { role: 'user', content: text, timestamp: currentTime }];
    setMessages(newMessages);
    setIsLoading(true);
    setLoadingStatus('Initializing pipeline...');

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: text,
          conversationId: conversationId
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `API error: ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n\n');
          buffer = lines.pop() || '';
          
          for (const chunk of lines) {
            const typeMatch = chunk.match(/event: (.*)\n/);
            const dataMatch = chunk.match(/data: (.*)/);
            if (typeMatch && dataMatch) {
              const type = typeMatch[1];
              const data = JSON.parse(dataMatch[1]);
              
              if (type === 'status') {
                setLoadingStatus(data.message);
              } else if (type === 'result') {
                if (data.conversationId) setConversationId(data.conversationId);
                setMessages([
                  ...newMessages, 
                  { 
                    role: 'assistant', 
                    content: data.answer_text || data.error || 'No answer provided.', 
                    claims: data.claims || [],
                    disagreements: data.disagreements || [],
                    suggested_follow_ups: data.suggested_follow_ups || [],
                    primary_topic: data.primary_topic,
                    related_topics: data.related_topics || [],
                    status: data.status || 'answered',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  }
                ]);
              } else if (type === 'error') {
                throw new Error(data.message);
              }
            }
          }
        }
      }
    } catch (error: any) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: error.message || 'Something went wrong. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), isError: true }
      ]);
    } finally {
      setIsLoading(false);
      setLoadingStatus(null);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => { setMessages([]); setConversationId(null); setSelectedClaim(null); }}>
              <svg className="h-8 w-auto text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
                <path d="M12 4v-2c2 0 4 2 4 4" />
              </svg>
              <span className="font-headline-md text-headline-md text-primary tracking-tight">NutriAI</span>
            </div>
            <div className="hidden sm:flex items-center gap-space-xs bg-surface-container-low px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary">Ready to help</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Knowledge Map Toggle */}
            <button 
              onClick={() => setIsKnowledgeMapOpen(!isKnowledgeMapOpen)}
              className={`h-9 px-3 rounded-full transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold border ${
                isKnowledgeMapOpen 
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              aria-label="Toggle Knowledge Map"
              title="Toggle Knowledge Map"
            >
              <span className="material-symbols-outlined text-[18px] text-teal-700">account_tree</span>
              <span className="hidden md:inline">Knowledge Map</span>
            </button>

            {/* Sources Toggle */}
            <button 
              onClick={() => {
                setIsSourcesOpen(!isSourcesOpen);
                if (isSourcesOpen) setSelectedClaim(null);
              }}
              className={`h-9 px-3 rounded-full transition-all flex items-center gap-1.5 text-xs sm:text-sm font-semibold border ${
                isSourcesOpen 
                  ? 'bg-teal-50 text-teal-800 border-teal-300 shadow-2xs' 
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              aria-label="Toggle Sources Panel"
              title="Toggle Sources Panel"
            >
              <span className="material-symbols-outlined text-[18px] text-primary">
                {isSourcesOpen ? 'menu_open' : 'menu_book'}
              </span>
              <span className="hidden md:inline">Sources</span>
              {selectedClaim && (
                <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              )}
            </button>

            {/* User Avatar */}
            <div className="relative ml-1">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-container-lowest">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"></span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-20">
        <div className="flex flex-row w-full max-w-[1800px] mx-auto min-h-[calc(100vh-5rem)] relative">
          {/* Mobile backdrop for Knowledge Map */}
          {isKnowledgeMapOpen && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => setIsKnowledgeMapOpen(false)}
            />
          )}

          {/* LEFT SIDE: Session Knowledge Map */}
          {isKnowledgeMapOpen && (
            <KnowledgeMap 
              messages={messages} 
              onClose={() => setIsKnowledgeMapOpen(false)}
              onTopicClick={(topic) => handleSend(topic)}
            />
          )}

          {/* CENTER: Main Chat Conversation */}
          <div className="flex-1 flex flex-col justify-between px-3 sm:px-6 lg:px-8 py-6 min-w-0">
            <MessageList 
              messages={messages} 
              isLoading={isLoading} 
              loadingStatus={loadingStatus}
              onSelectClaim={handleSelectClaim} 
              selectedClaim={selectedClaim}
              onSend={handleSend}
            />
            <InputBox onSend={handleSend} disabled={isLoading} />
          </div>

          {/* Mobile backdrop for Sources Panel */}
          {isSourcesOpen && (
            <div 
              className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 lg:hidden"
              onClick={() => {
                setIsSourcesOpen(false);
                setSelectedClaim(null);
              }}
            />
          )}

          {/* RIGHT SIDE: Sources Panel */}
          {isSourcesOpen && (
            <SourcesPanel 
              selectedClaim={selectedClaim} 
              onClose={() => {
                setIsSourcesOpen(false);
                setSelectedClaim(null);
              }} 
            />
          )}
        </div>
      </main>
    </>
  );
}
