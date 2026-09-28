import React from 'react';
import ClaimBadge from './ClaimBadge';
import { Claim } from '@/lib/schema';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  claims?: Claim[];
  timestamp?: string;
}

export default function MessageBubble({ message, onSelectClaim, selectedClaim }: { message: Message, onSelectClaim: (claim: Claim) => void, selectedClaim: Claim | null }) {
  const isUser = message.role === 'user';
  
  if (isUser) {
    return (
      <div className="flex flex-col items-end space-y-1.5 pt-2 mb-6">
        <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">YOUR QUESTION</span>
        <div className="bg-white shadow-md rounded-2xl rounded-tr-sm p-5 sm:p-6 max-w-lg text-right relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-slate-100">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-40"></div>
          <p className="font-body-md text-body-md text-on-surface leading-relaxed">
            {message.content}
          </p>
          {message.timestamp && (
            <div className="absolute bottom-1 right-2.5 text-[10px] text-slate-400 font-medium tracking-wide">
              {message.timestamp}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-3xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border border-slate-100/80 mb-6">
      <svg className="absolute top-2 right-2 w-36 h-36 text-primary-container/10 pointer-events-none transform rotate-12 -z-0" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"></path>
      </svg>
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-surface-container">
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
          </span>
          <span className="font-label-md text-label-md font-semibold text-on-surface">AI Answer</span>
          <span className="font-caption text-caption text-outline flex items-center gap-1">
            <span>•</span> {message.claims?.length || 0} verified takeaways
          </span>
        </div>
        <div className="flex items-center gap-2">
          {message.timestamp && (
            <span className="text-xs text-slate-400 font-medium">
              {message.timestamp}
            </span>
          )}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low text-primary font-label-sm text-label-sm font-semibold">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            <span>NutriAI Core</span>
          </div>
        </div>
      </div>
      
      <div className="relative z-10 my-6 p-7 sm:p-8 rounded-2xl bg-[#f0fdfa]/90 border-l-4 border-[#0d9488] shadow-sm">
        <p className="font-body-md text-body-md text-slate-800 mt-4 leading-loose whitespace-pre-wrap">{message.content}</p>
      </div>

      {message.claims && message.claims.length > 0 && (
        <div className="relative z-10 pt-2 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
              <span>Key Takeaways</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary-container/20 text-primary font-label-sm">Interactive</span>
            </h2>
            <span className="font-caption text-caption text-outline">Click a takeaway to inspect sources &amp; evidence</span>
          </div>
          <div className="flex flex-wrap gap-3.5 pt-1.5">
            {message.claims.map((claim, idx) => (
              <button 
                key={idx} 
                onClick={() => onSelectClaim(claim)}
                className={`takeaway-pill group px-4 py-2.5 rounded-full font-label-md text-label-md flex items-center gap-2 transition-all duration-200 border ${selectedClaim?.claim_text === claim.claim_text ? 'bg-teal-100 text-teal-900 border-teal-300 shadow-md ring-2 ring-teal-500/20' : 'bg-white text-slate-800 hover:bg-teal-50/50 shadow-sm border-slate-200/80'}`}
                type="button"
              >
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">{idx + 1}</span>
                <span>{claim.claim_text.slice(0, 40)}{claim.claim_text.length > 40 ? '...' : ''}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="relative z-10 mt-6 pt-4 border-t border-surface-container flex items-center justify-between text-outline">
        <div className="flex items-center gap-3">
          <button aria-label="Helpful response" className="flex items-center gap-1.5 font-label-sm text-label-sm hover:text-primary transition-colors" type="button">
            <span className="material-symbols-outlined text-[18px]">thumb_up</span>
            <span>Helpful</span>
          </button>
        </div>
      </div>
    </div>
  );
}
