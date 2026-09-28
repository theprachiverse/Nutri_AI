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
  timestamp?: string;
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSend = async (text: string) => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    // Add user message to UI
    const newMessages: Message[] = [...messages, { role: 'user', content: text, timestamp: currentTime }];
    setMessages(newMessages);
    setIsLoading(true);

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
          claims: data.claims || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error) {
      setMessages([
        ...newMessages,
        { role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-surface-container-lowest/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-20 w-full px-gutter flex items-center justify-between">
          <div className="flex items-center gap-space-md">
            <div className="flex items-center gap-space-sm cursor-pointer" onClick={() => { setMessages([]); setConversationId(null); setSelectedClaim(null); }}>
              <img alt="NutriAI Sprout Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1WB9ISPHPz33N5SLOdl-StatpBMp7cVu-sl3YqrWEq88HFtYAGdmyiCVlG-G2kiNt2o-ICRbJ0F6gPUCJrvkOnl4jTGgZPYSpFlLicA5hhj6suTts8fyAvXDMrGWeEq90LTB8V72FhLl01wfnQDV7miVbOeH-6e2uEPnM_niqvlGiTirNrYve7sKuBzhQd0-xrMO112C8OGiDhR3X-G0TEXhkuZG1W2PE0M60mtNXeOF5hprLX5NAmA-g"/>
              <span className="font-headline-md text-headline-md text-primary tracking-tight">NutriAI</span>
            </div>
            <div className="hidden sm:flex items-center gap-space-xs bg-surface-container-low px-3 py-1 rounded-full">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-primary">Ready to help</span>
            </div>
          </div>
          <div className="flex items-center gap-space-sm">
            <div className="relative ml-space-xs">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center ring-2 ring-surface-container-lowest">
                <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-primary-container ring-2 ring-surface-container-lowest"></span>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full pt-20">
        <div className="flex flex-col w-full">
          <div className="flex flex-col lg:flex-row w-full max-w-[1560px] mx-auto min-h-[calc(100vh-5rem)]">
            {/* LEFT COLUMN */}
            <div className="flex-1 flex flex-col justify-between px-4 sm:px-6 lg:px-10 py-6 min-w-0">
              <MessageList 
                messages={messages} 
                isLoading={isLoading} 
                onSelectClaim={setSelectedClaim} 
                selectedClaim={selectedClaim}
              />
              <InputBox onSend={handleSend} disabled={isLoading} />
            </div>

            {/* RIGHT COLUMN */}
            <SourcesPanel selectedClaim={selectedClaim} />
          </div>
        </div>
      </main>
    </>
  );
}
