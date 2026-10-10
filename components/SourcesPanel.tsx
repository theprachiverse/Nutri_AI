import React from 'react';
import { ClaimV2 as Claim } from '@/lib/schema';
import SourceChunkCard from './SourceChunkCard';

export default function SourcesPanel({ selectedClaim, onClose }: { selectedClaim: Claim | null, onClose: () => void }) {
  return (
    <aside className="fixed inset-y-0 right-0 z-40 w-80 sm:w-96 lg:w-80 xl:w-96 bg-white p-5 sm:p-7 flex flex-col justify-between shadow-xl lg:shadow-none border-l border-slate-200 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto animate-slide-in-right pt-20 lg:pt-6 shrink-0" id="sources-sidebar">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[18px]">menu_book</span>
            </span>
            <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">Sources &amp; References</h2>
          </div>
          <button onClick={onClose} aria-label="Dismiss sources tray" className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors" type="button">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {selectedClaim ? (
          <>
            {/* Active Takeaway Banner Card */}
            <div className="space-y-2">
              <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">SELECTED TAKEAWAY</span>
              <div className="p-4 rounded-2xl bg-surface-container-low shadow-sm" id="active-takeaway-display">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">1</span>
                  <div>
                    <p className="font-headline-sm text-headline-sm text-on-surface font-medium text-sm leading-snug">
                      {selectedClaim.claim_text}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Render the true citation */}
            {selectedClaim.citation && (
              <div className="space-y-2 pt-2">
                 <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">VERIFIED EVIDENCE</span>
                 <SourceChunkCard claim={selectedClaim} />
              </div>
            )}
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center text-emerald-700/60 mt-16">
            <span className="material-symbols-outlined text-4xl mb-4 opacity-50">touch_app</span>
            <p className="text-sm text-balance">Select a claim from the chat to trace its evidence and clinical sources.</p>
          </div>
        )}
      </div>

      {/* Bottom Advisory Note */}
      <div className="pt-6 border-t border-surface-container mt-6">
        <div className="flex items-start gap-2.5">
          <span className="material-symbols-outlined text-outline text-[18px] shrink-0 mt-0.5">info</span>
          <p className="font-caption text-caption text-outline italic leading-relaxed">
            NutriAI is designed for educational &amp; wellness curiosity. Always check with a certified nutritionist or medical practitioner for individualized dietary or clinical advice.
          </p>
        </div>
      </div>
    </aside>
  );
}
