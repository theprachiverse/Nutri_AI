'use client';
import { useEffect, useRef, useState } from 'react';
import { Claim } from '@/lib/schema';
import MessageBubble from './MessageBubble';

export interface MessageTurn {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
  claims?: Claim[];
}

const TOPIC_TAGS = ['Macronutrients', 'Sleep & Recovery', 'Supplements', 'Hydration', 'Metabolism', 'Vitamins', 'Plant-Based'];

const WELCOME_PROMPTS = [
  { icon: 'nightlight', label: 'Sleep & Recovery', q: 'What foods help improve sleep quality?' },
  { icon: 'fitness_center', label: 'Performance', q: 'Best pre-workout nutrition strategies?' },
  { icon: 'water_drop', label: 'Hydration', q: 'How much water should I drink daily?' },
  { icon: 'restaurant', label: 'Meal Planning', q: 'How do I plan a balanced meal?' },
];

interface MessageListProps {
  messages:       MessageTurn[];
  isLoading:      boolean;
  selectedClaim:  Claim | null;
  onClaimSelect:  (claim: Claim) => void;
  errorMessage?:  string | null;
  onPromptSelect?: (prompt: string) => void;
}

export default function MessageList({
  messages,
  isLoading,
  selectedClaim,
  onClaimSelect,
  errorMessage,
  onPromptSelect,
}: MessageListProps) {
  const endRef  = useRef<HTMLDivElement>(null);
  const [now]   = useState(() => new Date());

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 relative">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* ────────────────────────────────────────────────────────── */}
        {/* SESSION HEADER                                              */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between pb-3 border-b border-mint/25">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-mint-mist border border-mint text-primary">
              <span
                className="material-symbols-outlined text-[15px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                spa
              </span>
            </span>
            <span className="font-label-sm text-label-sm text-forest tracking-wider uppercase font-bold">
              NutriAI · Wellness Session
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-caption text-caption text-outline">
              {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
            {messages.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-mint-mist border border-mint text-forest font-label-sm text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald animate-pulse inline-block" />
                {messages.filter(m => m.role === 'assistant').length} answers
              </span>
            )}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* EMPTY WELCOME STATE                                          */}
        {/* ────────────────────────────────────────────────────────── */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center text-center py-8 space-y-6 animate-fade-up">

            {/* Animated botanical icon ring */}
            <div className="relative w-24 h-24 mx-auto">
              {/* Outer pulse rings */}
              <div className="absolute inset-0 rounded-full border-2 border-mint/40 animate-ping" style={{ animationDuration: '3s' }} />
              <div className="absolute inset-2 rounded-full border border-mint/30 animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
              {/* Main ring */}
              <div className="absolute inset-0 rounded-full glass-2 animate-ring-pulse" />
              {/* Gradient background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-mint-mist via-white to-transparent" />
              {/* Icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span
                  className="material-symbols-outlined text-primary text-[38px] animate-float"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  nutrition
                </span>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-2 max-w-sm">
              <h1 className="font-headline-lg-mobile text-headline-lg-mobile text-forest text-balance font-bold">
                Your nutrition,{' '}
                <em className="font-normal" style={{ fontStyle: 'italic' }}>explained.</em>
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                Ask anything about food, supplements, sleep, or metabolism.
                Evidence-based answers synthesized from{' '}
                <span className="text-forest font-medium">PubMed & Cochrane</span>.
              </p>
            </div>

            {/* Quick access cards */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-sm pt-2">
              {WELCOME_PROMPTS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => onPromptSelect?.(item.q)}
                  className="flex flex-col items-start gap-2 p-3.5 rounded-2xl glass-1 hover:glass-2 hover:border-mint text-left transition-all duration-200 group"
                >
                  <span className="w-8 h-8 rounded-xl bg-mint-mist border border-mint flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span
                      className="material-symbols-outlined text-primary text-[17px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                  </span>
                  <div>
                    <p className="font-label-sm text-label-sm text-forest font-bold leading-tight">{item.label}</p>
                    <p className="font-caption text-caption text-on-surface-variant mt-0.5 leading-tight line-clamp-2">{item.q}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Topic tags */}
            <div className="flex flex-wrap justify-center gap-2 pt-1">
              {TOPIC_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => onPromptSelect?.(`Tell me about ${tag}`)}
                  className="px-3 py-1 rounded-full text-[11px] font-bold bg-mint-mist text-forest border border-mint hover:bg-emerald hover:text-white hover:border-emerald transition-all duration-200 font-label-sm"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Trust indicators */}
            <div className="flex items-center gap-4 pt-2 opacity-60">
              {[
                { icon: 'verified', text: 'Clinical sources' },
                { icon: 'science', text: 'Evidence-based' },
                { icon: 'lock', text: 'Private & secure' },
              ].map(({ icon, text }) => (
                <div key={text} className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-outline">{icon}</span>
                  <span className="font-caption text-caption text-outline">{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* MESSAGES                                                    */}
        {/* ────────────────────────────────────────────────────────── */}
        {messages.map((m, idx) => (
          <MessageBubble
            key={m.id}
            role={m.role}
            content={m.content}
            claims={m.claims}
            selectedClaim={selectedClaim}
            onClaimSelect={onClaimSelect}
            index={idx}
          />
        ))}

        {/* ────────────────────────────────────────────────────────── */}
        {/* LOADING INDICATOR                                           */}
        {/* ────────────────────────────────────────────────────────── */}
        {isLoading && (
          <div className="flex items-center gap-3 px-5 py-3.5 glass-2 rounded-2xl rounded-tl-sm w-fit animate-fade-up border border-mint/30">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald dot-1 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald dot-2 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald dot-3 inline-block opacity-70" />
            </div>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-forest font-semibold tracking-wide">
                Synthesising clinical insights…
              </span>
              <span className="font-caption text-caption text-on-surface-variant">Cross-referencing PubMed & Cochrane</span>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────── */}
        {/* ERROR STATE                                                 */}
        {/* ────────────────────────────────────────────────────────── */}
        {errorMessage && (
          <div className="flex justify-start animate-fade-up">
            <div className="glass-1 rounded-2xl rounded-tl-sm px-5 py-4 max-w-[82%] flex items-start gap-2.5 border border-error/20 bg-error-container/30">
              <span className="material-symbols-outlined text-error text-[18px] shrink-0 mt-0.5">error_outline</span>
              <div>
                <p className="font-label-sm text-label-sm text-error font-bold">Something went wrong</p>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} className="h-1" />
      </div>
    </div>
  );
}
