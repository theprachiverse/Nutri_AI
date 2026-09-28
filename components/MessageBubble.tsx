import React from 'react';
import ClaimBadge from './ClaimBadge';
import { Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
}

export default function MessageBubble({ message, onSelectClaim }: { message: Message, onSelectClaim: (claim: Claim) => void }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6 animate-fade-up`}>
      <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-5 shadow-sm ${
        isUser 
          ? 'bubble-user text-white rounded-br-sm' 
          : 'glass-1 text-slate-800 rounded-bl-sm prose-nutriai'
      }`}>
        <div className="whitespace-pre-wrap">{message.content}</div>
        
        {!isUser && message.claims && message.claims.length > 0 && (
          <div className="mt-4 pt-4 border-t border-emerald-100/50 flex flex-wrap">
            {message.claims.map((claim, idx) => (
              <ClaimBadge key={idx} claim={claim} onSelect={onSelectClaim} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
