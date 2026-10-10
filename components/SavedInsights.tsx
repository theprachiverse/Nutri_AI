'use client';
import React, { useState } from 'react';
import { ClaimV2 as Claim } from '@/lib/schema';

export interface SavedInsight {
  id: string;
  claim_text: string;
  citation?: Claim['citation'];
  savedAt: string;
}

interface SavedInsightsProps {
  savedInsights: SavedInsight[];
  onRemoveInsight: (id: string) => void;
  onClearAll: () => void;
  onSelectClaim?: (claim: Claim) => void;
  onClose?: () => void;
}

export default function SavedInsights({
  savedInsights,
  onRemoveInsight,
  onClearAll,
  onSelectClaim,
  onClose
}: SavedInsightsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleCopyOne = (insight: SavedInsight) => {
    const text = `${insight.claim_text}\nSource: ${insight.citation?.publisher || 'Dietary Guidance'} (${insight.citation?.year || ''})`;
    navigator.clipboard.writeText(text);
    setCopiedId(insight.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = () => {
    if (savedInsights.length === 0) return;
    const summary = savedInsights.map((item, idx) => 
      `${idx + 1}. ${item.claim_text}\n   [Source: ${item.citation?.publisher || 'Dietary Guidance'} (${item.citation?.year || ''})]`
    ).join('\n\n');
    navigator.clipboard.writeText(`NutriAI — Saved Clinical Insights:\n\n${summary}`);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  return (
    <aside 
      className="fixed inset-y-0 left-0 z-40 w-80 sm:w-88 lg:w-80 xl:w-88 bg-white flex flex-col justify-between shadow-xl lg:shadow-none border-r border-slate-200 lg:sticky lg:top-20 lg:h-[calc(100vh-5rem)] overflow-y-auto animate-slide-in-left pt-20 lg:pt-0 shrink-0"
      id="saved-insights-sidebar"
    >
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-[18px]">bookmarks</span>
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">
                Saved Insights
              </h2>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {savedInsights.length > 0 
                  ? `${savedInsights.length} takeaway${savedInsights.length > 1 ? 's' : ''} saved` 
                  : 'Session Notebook'}
              </span>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              aria-label="Close Saved Insights" 
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        {savedInsights.length === 0 ? (
          /* Empty State */
          <div className="my-auto py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-sm">
              <span className="material-symbols-outlined text-3xl">bookmark_add</span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1 font-['Literata']">
              No Saved Insights Yet
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6">
              Click the bookmark icon (🔖) on any verified takeaway or AI answer to collect key dietary guidelines and evidence here.
            </p>

            <div className="w-full text-left space-y-2.5 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                How it helps you:
              </span>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-600 text-[14px] mt-0.5 shrink-0">check_circle</span>
                  <span>Save dietary targets, limits &amp; nutrient numbers.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-600 text-[14px] mt-0.5 shrink-0">check_circle</span>
                  <span>Click any saved note to review its clinical evidence citation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-teal-600 text-[14px] mt-0.5 shrink-0">check_circle</span>
                  <span>Copy all insights at the end of your session.</span>
                </li>
              </ul>
            </div>
          </div>
        ) : (
          /* Saved Insights List */
          <div className="mt-5 space-y-4 flex-1">
            {savedInsights.map((insight, idx) => (
              <div 
                key={insight.id}
                className="p-4 rounded-2xl bg-surface-container-low border border-teal-100/80 shadow-2xs space-y-2.5 hover:shadow-xs transition-shadow relative group"
              >
                {/* Card Header & Publisher */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-[10px] shrink-0">
                      {idx + 1}
                    </span>
                    {insight.citation?.publisher && (
                      <span className="text-[11px] font-semibold text-teal-900 truncate max-w-[170px]">
                        {insight.citation.publisher} {insight.citation.year ? `(${insight.citation.year})` : ''}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => onRemoveInsight(insight.id)}
                    aria-label="Remove saved insight"
                    title="Remove from saved notes"
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>

                {/* Claim Statement */}
                <p className="text-xs sm:text-sm font-medium text-slate-800 leading-snug">
                  {insight.claim_text}
                </p>

                {/* Quote Snippet if available */}
                {insight.citation?.quote && (
                  <p className="text-[11px] text-slate-500 italic line-clamp-2 border-l-2 border-teal-200 pl-2">
                    &ldquo;{insight.citation.quote}&rdquo;
                  </p>
                )}

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px]">
                  {insight.citation && onSelectClaim ? (
                    <button
                      onClick={() => onSelectClaim({ claim_text: insight.claim_text, citation: insight.citation! })}
                      className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[13px]">menu_book</span>
                      <span>View Evidence</span>
                    </button>
                  ) : <span />}
                  
                  <button
                    onClick={() => handleCopyOne(insight)}
                    className="text-slate-500 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[13px]">
                      {copiedId === insight.id ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedId === insight.id ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Actions */}
      {savedInsights.length > 0 && (
        <div className="p-4 border-t border-slate-100 bg-slate-50/80 space-y-2">
          <button
            onClick={handleCopyAll}
            className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">
              {copiedAll ? 'check' : 'content_copy'}
            </span>
            <span>{copiedAll ? 'All Notes Copied!' : `Copy All (${savedInsights.length}) Notes`}</span>
          </button>
          
          <button
            onClick={onClearAll}
            className="w-full py-1.5 text-center text-xs text-slate-500 hover:text-red-600 font-medium transition-colors cursor-pointer"
          >
            Clear All Notes
          </button>
        </div>
      )}
    </aside>
  );
}
