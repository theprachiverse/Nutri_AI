'use client';
import React, { useState } from 'react';
import MessageList from './MessageList';
import InputBox from './InputBox';
import SourcesPanel from './SourcesPanel';
import { Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async (text: string) => {
    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userMessage: text,
          conversationId: conversationId
        }),
      });

      if (!res.ok) {
        throw new Error('API error');
      }

      const data = await res.json();
      
      if (data.conversationId) {
        setConversationId(data.conversationId);
      }

      setMessages([
        ...newMessages, 
        { 
          role: 'assistant', 
          content: data.answer_text || data.error || 'No answer provided.', 
          claims: data.claims || [] 
        }
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Something went wrong. Please try again.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-transparent">
      <div className="flex-1 flex flex-col h-full relative z-10">
        <header className="px-6 py-4 glass-3 border-b border-emerald-100/50 flex justify-between items-center shadow-sm">
          <h1 className="text-xl font-['Literata'] font-semibold text-emerald-950 flex items-center">
            <span className="material-symbols-outlined mr-2 text-emerald-600">nutrition</span>
            NutriAI
          </h1>
          <button 
            onClick={() => { setMessages([]); setConversationId(null); setSelectedClaim(null); }}
            className="text-sm font-medium px-4 py-2 bg-white/50 hover:bg-white rounded-lg border border-emerald-200 text-emerald-800 transition-colors shadow-sm flex items-center"
          >
            <span className="material-symbols-outlined text-[18px] mr-1">add</span>
            New Chat
          </button>
        </header>
        
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <MessageList 
            messages={messages} 
            isLoading={isLoading} 
            onSelectClaim={setSelectedClaim} 
          />
          <div className="pb-6 pt-2 px-2 shrink-0 bg-gradient-to-t from-white/40 to-transparent">
            <InputBox onSend={handleSend} disabled={isLoading} />
          </div>
        </main>
      </div>
      
      <SourcesPanel selectedClaim={selectedClaim} />
    </div>
  );
}
