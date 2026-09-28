import React from 'react';
import { Claim } from '@/lib/schema';

export default function SourcesPanel({ selectedClaim, onClose }: { selectedClaim: Claim | null, onClose: () => void }) {
  return (
    <aside className="w-full lg:w-96 bg-white p-6 sm:p-7 flex flex-col justify-between shadow-sm border-l border-slate-200 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto" id="sources-sidebar">
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

            {/* Status Card */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest shadow-sm space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed/40 text-tertiary font-label-sm text-label-sm font-semibold">
                <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                <span>Sources coming soon</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold text-base">
                We're still adding sources for this
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Real citations, clinical trial links, and nutritional breakdown will be added in the next update. We're building a system to verify every takeaway with friendly, transparent sources.
              </p>
              {/* Mock Citation Sneak Peek */}
              <div className="mt-2 p-3 rounded-xl bg-surface-container-low/70 space-y-1.5">
                <div className="flex items-center justify-between text-outline">
                  <span className="font-caption text-caption font-semibold uppercase tracking-wider text-primary">Target Registry</span>
                  <span className="font-caption text-caption">PubMed Central</span>
                </div>
                <p className="font-caption text-caption text-on-surface font-medium">
                  “Effect of tart cherry juice on melatonin levels and sleep metrics: randomized trial”
                </p>
              </div>
            </div>

            {/* What's Next Tracker */}
            <div className="p-5 rounded-2xl bg-surface-container-low/60 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Verification Pipeline</span>
                <span className="font-caption text-caption text-outline">Step 1 of 2</span>
              </div>
              <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                <div className="h-full bg-[#0d9488] rounded-full transition-all duration-500" style={{ width: '50%' }}></div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                <strong className="text-on-surface font-medium">Next step:</strong> Linking peer-reviewed journals, DOI resolvers, and certified dietary guideline authorities.
              </p>
            </div>
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
