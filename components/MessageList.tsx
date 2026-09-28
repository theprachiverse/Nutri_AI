import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
}

export default function MessageList({ messages, isLoading, onSelectClaim }: { messages: Message[], isLoading: boolean, onSelectClaim: (claim: Claim) => void }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto p-4 overflow-y-auto">
      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-emerald-800/60 animate-fade-in mt-16">
          <div className="macro-ring w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-emerald-600">eco</span>
          </div>
          <h2 className="text-xl font-medium mb-2 font-['Literata']">Evidence-Based Nutrition</h2>
          <p className="text-center max-w-md text-sm">Ask questions about food, nutrients, and safety. I provide answers backed by clinical synthesis and highlight verifiable claims.</p>
        </div>
      ) : (
        <div className="pt-8">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} onSelectClaim={onSelectClaim} />
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="flex w-full justify-start mb-6 animate-fade-in">
          <div className="glass-1 rounded-2xl rounded-bl-sm p-5 flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 dot-1"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 dot-2"></div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 dot-3"></div>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
