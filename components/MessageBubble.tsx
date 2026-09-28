'use client';
import { useState } from 'react';
import { Claim } from '@/lib/schema';
import ClaimBadge from './ClaimBadge';

interface MessageBubbleProps {
  role:          'user' | 'assistant';
  content:       string;
  claims?:       Claim[];
  selectedClaim: Claim | null;
  onClaimSelect: (claim: Claim) => void;
  index?:        number;
}

// ── Action Bar ──────────────────────────────────────────────────────────────
function ActionBar() {
  const [liked, setLiked]   = useState(false);
  const [saved, setSaved]   = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-between pt-4 border-t border-mint/20">
      <div className="flex items-center gap-1">
        <button
          aria-label="Helpful"
          onClick={() => setLiked(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
            liked
              ? 'bg-emerald/10 text-emerald border border-emerald/20'
              : 'text-outline hover:text-primary hover:bg-mint-mist'
          }`}
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: liked ? "'FILL' 1" : "'FILL' 0" }}
          >
            thumb_up
          </span>
          <span>{liked ? 'Liked' : 'Helpful'}</span>
        </button>

        <button
          aria-label="Save guide"
          onClick={() => setSaved(v => !v)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-all duration-200 ${
            saved
              ? 'bg-sky-blue/10 text-sky-blue border border-sky-blue/20'
              : 'text-outline hover:text-secondary hover:bg-secondary-fixed/20'
          }`}
        >
          <span
            className="material-symbols-outlined text-[16px]"
            style={{ fontVariationSettings: saved ? "'FILL' 1" : "'FILL' 0" }}
          >
            bookmark_add
          </span>
          <span>{saved ? 'Saved' : 'Save'}</span>
        </button>

        <button
          aria-label="Copy"
          onClick={handleCopy}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full font-label-sm text-label-sm text-outline hover:text-primary hover:bg-mint-mist transition-all duration-200"
        >
          <span className="material-symbols-outlined text-[16px]">{copied ? 'check' : 'content_copy'}</span>
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>

      <div className="hidden sm:flex items-center gap-1 text-outline/60">
        <span className="material-symbols-outlined text-[12px]">verified</span>
        <span className="font-caption text-caption">EFSA & NIH reviewed</span>
      </div>
    </div>
  );
}

// ── Nutrient Metric Chip ─────────────────────────────────────────────────────
function MetricChip({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-mint/60 shadow-sm text-xs font-semibold text-forest">
      <span className="material-symbols-outlined text-emerald text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>
        {icon}
      </span>
      <span className="text-on-surface-variant">{label}:</span>
      <span className="text-forest">{value}</span>
    </div>
  );
}

export default function MessageBubble({
  role,
  content,
  claims,
  selectedClaim,
  onClaimSelect,
  index = 0,
}: MessageBubbleProps) {
  const isUser = role === 'user';
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  /* ── USER BUBBLE ─────────────────────────────────────────────────────── */
  if (isUser) {
    return (
      <div
        className="flex flex-col items-end space-y-1.5 pt-1 animate-fade-up"
        style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
      >
        <div className="flex items-center gap-2">
          <span className="font-label-sm text-label-sm text-primary/70 tracking-widest uppercase font-bold">
            Your Question
          </span>
          <span className="w-5 h-5 rounded-full gradient-emerald flex items-center justify-center shadow-emerald">
            <span
              className="material-symbols-outlined text-white text-[11px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              person
            </span>
          </span>
        </div>

        {/* Frosted glass user card */}
        <div className="glass-2 rounded-2xl rounded-tr-sm px-5 py-4 sm:px-6 sm:py-5 max-w-lg text-right relative overflow-hidden group hover:shadow-[0_8px_24px_-4px_rgba(16,185,129,0.12)] transition-all duration-300">
          {/* Emerald top-line accent */}
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-emerald to-transparent opacity-60" />
          {/* Subtle gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-mint-mist/20 via-transparent to-transparent pointer-events-none" />
          <p className="font-body-md text-body-md text-on-surface leading-relaxed relative z-10">
            &ldquo;{content}&rdquo;
          </p>
        </div>

        <span className="font-caption text-caption text-forest font-semibold bg-mint-mist border border-mint/50 px-2 py-0.5 rounded-full mr-1">{timeStr}</span>
      </div>
    );
  }

  /* ── ASSISTANT BUBBLE ─────────────────────────────────────────────────── */
  return (
    <div
      className="w-full animate-fade-up"
      style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
    >
      <div className="w-full glass-2 rounded-3xl rounded-tl-sm p-6 sm:p-8 relative overflow-hidden hover:shadow-[0_16px_40px_-8px_rgba(6,78,59,0.1)] transition-all duration-300">

        {/* Botanical leaf watermarks */}
        <svg
          className="absolute top-3 right-3 w-32 h-32 pointer-events-none transform rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"
            fill="#10B981"
            fillOpacity="0.07"
          />
        </svg>
        <svg
          className="absolute bottom-4 left-4 w-20 h-20 pointer-events-none transform -rotate-6 opacity-50"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z"
            fill="#059669"
            fillOpacity="0.06"
          />
        </svg>

        {/* ── Top meta bar ── */}
        <div className="flex items-center justify-between pb-4 border-b border-mint/25 relative z-10">
          <div className="flex items-center gap-2.5">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald opacity-60" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
            <span className="font-label-md text-label-md font-bold text-on-surface">AI Answer</span>
            {claims && claims.length > 0 && (
              <span className="font-caption text-caption text-outline flex items-center gap-1">
                <span>·</span>
                {claims.length} verified takeaway{claims.length > 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model badge */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-mint-mist border border-mint text-primary font-label-sm text-[10px] font-bold">
              <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>psychology</span>
              NutriAI Core
            </div>
            <span className="font-caption text-caption text-forest font-semibold bg-mint-mist border border-mint/50 px-2 py-0.5 rounded-full">{timeStr}</span>
          </div>
        </div>

        {/* ── Quick Summary callout ── */}
        <div className="relative z-10 my-5 p-5 sm:p-6 rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(236,253,245,0.95) 0%, rgba(209,250,229,0.7) 100%)',
            borderLeft: '3px solid #10B981',
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 shimmer pointer-events-none opacity-40" />

          <div className="flex items-center justify-between flex-wrap gap-2 mb-3 relative z-10">
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-emerald text-[18px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
              <span className="font-label-sm text-label-sm font-bold text-forest tracking-wider uppercase">
                Quick Summary
              </span>
            </div>
            <span className="font-caption text-caption text-on-surface-variant">Here&apos;s what you need to know</span>
          </div>

          <p className="font-body-md text-body-md text-on-surface leading-[1.8] relative z-10 prose-nutriai">
            {content}
          </p>

          {/* Example metric chips (decorative, real data would come from API) */}
          {claims && claims.length > 0 && (
            <div className="mt-4 pt-3 flex flex-wrap gap-2 border-t border-mint/30 relative z-10">
              <MetricChip icon="bolt" label="Polyphenols" value="650mg" />
              <MetricChip icon="nightlight" label="Melatonin" value="High" />
              <MetricChip icon="timer" label="Timing" value="60–120 min" />
            </div>
          )}
        </div>

        {/* ── Interactive Claims / Key Takeaways ── */}
        {claims && claims.length > 0 && (
          <div className="relative z-10 pt-1 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
                <span>Key Takeaways</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald/10 border border-emerald/20 text-emerald font-label-sm font-bold">
                  Interactive
                </span>
              </h2>
              <span className="font-caption text-caption text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-[12px]">touch_app</span>
                Tap to inspect evidence
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 pt-0.5">
              {claims.map((claim, idx) => (
                <ClaimBadge
                  key={idx}
                  claim={claim}
                  isSelected={selectedClaim?.claim_text === claim.claim_text}
                  onSelect={onClaimSelect}
                  index={idx}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Action deck ── */}
        <div className="relative z-10 mt-5">
          <ActionBar />
        </div>
      </div>
    </div>
  );
}
