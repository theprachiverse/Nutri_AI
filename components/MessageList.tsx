import React, { useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import { Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
  timestamp?: string;
}

export default function MessageList({ messages, isLoading, onSelectClaim, selectedClaim }: { messages: Message[], isLoading: boolean, onSelectClaim: (claim: Claim) => void, selectedClaim: Claim | null }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  const hour = new Date().getHours();
  let sessionTitle = "Evening Rest & Recovery Session";
  if (hour >= 5 && hour < 12) {
    sessionTitle = "Morning Start & Fuel Session";
  } else if (hour >= 12 && hour < 17) {
    sessionTitle = "Afternoon Energy & Focus Session";
  }

  return (
    <div className="max-w-3xl w-full mx-auto space-y-7 flex-1 pb-8 overflow-y-auto">
      {/* Conversation Header / Session Marker */}
      <div className="flex items-center justify-between pb-3 border-b border-surface-container mt-4">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary-container/20 text-primary">
            <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>spa</span>
          </span>
          <span className="font-label-sm text-label-sm text-primary tracking-wider uppercase font-semibold">{sessionTitle}</span>
        </div>
        <span className="font-caption text-caption text-outline">Today</span>
      </div>

      {messages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-emerald-800/60 animate-fade-in mt-16">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-emerald-600">eco</span>
          </div>
          <h2 className="text-xl font-medium mb-2 font-['Literata']">Evidence-Based Nutrition</h2>
          <p className="text-center max-w-md text-sm">Ask questions about food, nutrients, and safety. I provide answers backed by clinical synthesis and highlight verifiable claims.</p>
        </div>
      ) : (
        <div className="pt-2">
          {messages.map((msg, idx) => (
            <MessageBubble key={idx} message={msg} onSelectClaim={onSelectClaim} selectedClaim={selectedClaim} />
          ))}
        </div>
      )}
      
      {isLoading && (
        <div className="flex items-center gap-3.5 px-6 py-4 bg-white rounded-2xl w-fit shadow-md border border-slate-100 mb-6">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0d9488] animate-bounce"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#14b8a6] animate-bounce" style={{ animationDelay: '0.18s' }}></span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#5eead4] animate-bounce" style={{ animationDelay: '0.36s' }}></span>
          </div>
          <span className="font-label-md text-label-md text-[#0f766e] font-semibold tracking-wide">Thinking &amp; synthesizing clinical insights...</span>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}
