import React from 'react';
import { Claim } from '@/lib/schema';

export default function SourcesPanel({ selectedClaim }: { selectedClaim: Claim | null }) {
  return (
    <div className="w-80 border-l border-emerald-100/50 glass-2 hidden lg:flex flex-col h-full animate-slide-in-right z-10 relative">
      <div className="p-6 border-b border-emerald-100/50">
        <h2 className="text-lg font-semibold text-emerald-900 flex items-center">
          <span className="material-symbols-outlined mr-2 text-emerald-600">menu_book</span>
          Sources & Evidence
        </h2>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedClaim ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-emerald-700/60 mt-16">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">touch_app</span>
            <p className="text-sm text-balance">Select a claim from the chat to trace its evidence and clinical sources.</p>
          </div>
        ) : (
          <div className="animate-fade-up">
            <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100 shadow-sm">
              <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-2">Selected Claim</h3>
              <p className="text-sm text-emerald-950 font-medium">"{selectedClaim.claim_text}"</p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Primary Source</h3>
              <div className="glass-1 p-4 rounded-xl border border-emerald-100 shadow-sm">
                <div className="flex items-start">
                  <span className="material-symbols-outlined text-emerald-500 mr-3 mt-0.5">article</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-800 mb-1">Not yet available</p>
                    <p className="text-xs text-slate-500 mb-3">Source tracking is part of Milestone 2.</p>
                    <div className="w-full h-1.5 bg-emerald-100 rounded-full overflow-hidden">
                      <div className="w-1/3 h-full bg-emerald-400 opacity-50 shimmer"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
