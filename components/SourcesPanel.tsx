'use client';
import { Claim } from '@/lib/schema';
import { useState } from 'react';

interface SourcesPanelProps {
  selectedClaim:  Claim | null;
  onClose:        () => void;
  messageCount:   number;
}

// ── Mini nutrition stat card ─────────────────────────────────────────────────
function NutrientStat({ label, value, unit, color, icon }: {
  label: string; value: number; unit: string; color: string; icon: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-mint/15 last:border-0">
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[12px]"
          style={{ background: color }}
        >
          <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      </div>
      <span className="font-label-md text-label-md text-on-surface font-semibold">
        {value}<span className="text-outline font-normal text-[11px] ml-0.5">{unit}</span>
      </span>
    </div>
  );
}

export default function SourcesPanel({ selectedClaim, onClose, messageCount }: SourcesPanelProps) {
  const [activeTab, setActiveTab] = useState<'sources' | 'tracker'>('sources');

  return (
    <aside
      id="sources-sidebar"
      className="w-full lg:w-[22rem] shrink-0 border-l border-mint/30 flex flex-col h-full z-20 relative hidden lg:flex animate-slide-in-right"
      style={{
        background: 'rgba(255,255,255,0.88)',
        backdropFilter: 'blur(24px) saturate(200%)',
      }}
    >
      {/* Botanical corner flourish */}
      <div className="absolute bottom-8 -right-8 w-40 h-40 opacity-[0.06] pointer-events-none">
        <svg viewBox="0 0 120 120" fill="none" className="w-full h-full text-emerald" aria-hidden="true">
          <path
            d="M60 110 C60 110 20 80 20 50 C20 30 40 10 60 10 C80 10 100 30 100 50 C100 80 60 110 60 110Z"
            stroke="currentColor" strokeWidth="1.5" fill="currentColor" opacity="0.4"
          />
          <path d="M60 10 L60 110" stroke="white" strokeWidth="1.5" />
          <path d="M60 35 C45 22 25 32 20 50" stroke="white" strokeWidth="1.2" />
          <path d="M60 60 C75 47 95 55 100 50" stroke="white" strokeWidth="1.2" />
          <circle cx="60" cy="10" r="3.5" fill="currentColor" opacity="0.4" />
        </svg>
      </div>

      {/* Subtle top gradient */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald/30 via-emerald/60 to-sky-blue/30" />

      {/* ── Panel Header ── */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0 relative z-10 border-b border-mint/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-mint-mist border border-mint flex items-center justify-center text-primary shadow-sm">
            <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              menu_book
            </span>
          </div>
          <div>
            <h2 className="font-headline-sm text-headline-sm font-bold text-forest" style={{ fontSize: '15px' }}>
              Sources & References
            </h2>
            <p className="font-caption text-caption text-outline mt-0.5">
              {messageCount > 0 ? `${messageCount} exchange${messageCount > 1 ? 's' : ''} analysed` : 'Ask a question to begin'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-mint-mist text-forest border border-mint font-label-sm">
            {selectedClaim ? '1 Active' : '0 Active'}
          </span>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-all"
            aria-label="Close panel"
          >
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* ── Tab switcher ── */}
      <div className="flex items-center gap-1 px-5 py-2.5 shrink-0 border-b border-mint/15 relative z-10">
        {([
          { id: 'sources', label: 'Evidence', icon: 'science' },
          { id: 'tracker', label: 'Nutrition', icon: 'monitoring' },
        ] as const).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-xl font-label-sm text-label-sm transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-mint-mist border border-mint text-forest font-bold shadow-sm'
                : 'text-on-surface-variant hover:bg-surface-container-low'
            }`}
          >
            <span
              className="material-symbols-outlined text-[14px]"
              style={{ fontVariationSettings: activeTab === tab.id ? "'FILL' 1" : "'FILL' 0" }}
            >
              {tab.icon}
            </span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Panel Body ── */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 relative z-10">

        {/* ══════════════ EVIDENCE TAB ══════════════ */}
        {activeTab === 'sources' && (
          <>
            {!selectedClaim ? (
              /* ── Default / empty state ── */
              <div className="space-y-4">
                {/* Selected Takeaway placeholder */}
                <div className="space-y-2">
                  <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
                    Selected Takeaway
                  </span>
                  <div className="p-4 rounded-2xl bg-surface-container-low border border-mint/25 border-dashed">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-surface-container flex items-center justify-center text-outline shrink-0">
                        <span className="material-symbols-outlined text-[15px]">touch_app</span>
                      </span>
                      <p className="font-body-sm text-body-sm text-on-surface-variant italic mt-0.5">
                        Click any Key Takeaway to inspect its clinical evidence
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sources coming soon */}
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-mint/20 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgba(245,158,11,0.1)] text-amber border border-[rgba(245,158,11,0.25)] font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber animate-pulse" />
                    Sources coming soon
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold" style={{ fontSize: '14px' }}>
                    We&apos;re building the evidence layer
                  </h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Real citations, clinical trial links, and nutritional breakdowns from{' '}
                    <span className="text-forest font-medium">PubMed & Cochrane</span> coming in the next update.
                  </p>

                  {/* Mock citation */}
                  <div className="p-3 rounded-xl bg-surface-container-low/80 space-y-2 border border-mint/15">
                    <div className="flex items-center justify-between">
                      <span className="font-caption text-caption font-bold uppercase tracking-wider text-primary">Target Registry</span>
                      <span className="px-2 py-0.5 rounded bg-mint-mist text-forest text-[10px] font-bold border border-mint">PubMed</span>
                    </div>
                    <p className="font-caption text-caption text-on-surface font-medium leading-relaxed">
                      &ldquo;Effect of tart cherry juice on melatonin levels and sleep metrics: randomized trial&rdquo;
                    </p>
                    <div className="flex items-center gap-1.5 text-outline">
                      <span className="material-symbols-outlined text-[12px]">schedule</span>
                      <span className="font-caption text-caption">Journal of Pineal Research · 2018</span>
                    </div>
                  </div>
                </div>

                {/* Verification pipeline */}
                <div className="p-4 rounded-2xl bg-surface-container-low/50 border border-mint/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Verification Pipeline</span>
                    <span className="font-caption text-caption text-outline">Step 1 of 3</span>
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { step: 'Claim extraction', done: true },
                      { step: 'DOI resolution & linking', done: false },
                      { step: 'Authority verification', done: false },
                    ].map(({ step, done }) => (
                      <div key={step} className="flex items-center gap-2">
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          done ? 'bg-emerald' : 'bg-surface-container border border-outline/20'
                        }`}>
                          {done && (
                            <span className="material-symbols-outlined text-white text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                              check
                            </span>
                          )}
                        </span>
                        <span className={`font-caption text-caption ${done ? 'text-forest font-medium' : 'text-on-surface-variant'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* ── Active claim detail ── */
              <div className="space-y-4 animate-fade-up">
                {/* Selected takeaway */}
                <div className="space-y-2">
                  <span className="font-label-sm text-label-sm text-primary tracking-widest uppercase font-bold">
                    Selected Takeaway
                  </span>
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-mint-mist/80 to-white/60 border border-mint">
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-emerald text-white flex items-center justify-center shrink-0 mt-0.5 shadow-[0_2px_6px_rgba(16,185,129,0.3)]">
                        <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                          check
                        </span>
                      </span>
                      <p className="font-label-md text-label-md text-on-surface font-semibold leading-snug">
                        {selectedClaim.claim_text}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence card */}
                <div className="p-4 rounded-2xl bg-surface-container-lowest border border-mint/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Evidence</span>
                    <span className="px-2 py-0.5 rounded-lg bg-mint-mist text-forest border border-mint text-[10px] font-bold">
                      Indexed
                    </span>
                  </div>

                  {selectedClaim.source ? (
                    <a
                      href={selectedClaim.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-mint-mist to-white border border-mint hover:border-emerald text-forest hover:text-emerald text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200 group"
                    >
                      <span className="material-symbols-outlined text-[15px] group-hover:scale-110 transition-transform">open_in_new</span>
                      <span className="font-label-md text-label-md">Verify on PubMed / NLM</span>
                    </a>
                  ) : (
                    <div className="text-sm text-on-surface-variant bg-white/60 border border-mint/25 border-dashed rounded-xl p-4 text-center leading-relaxed font-body-sm flex flex-col items-center gap-2">
                      <span className="material-symbols-outlined text-outline text-[24px]">link_off</span>
                      Source URL not yet indexed for this claim.
                    </div>
                  )}

                  <p className="font-caption text-caption text-on-surface-variant leading-relaxed">
                    References synthesised from Cochrane, PubMed & Lancet. Non-prescriptive.
                  </p>
                </div>

                {/* Related topics */}
                <div className="space-y-2">
                  <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Related Topics</span>
                  <div className="flex flex-wrap gap-1.5">
                    {['Sleep Science', 'Phytochemistry', 'Melatonin', 'Antioxidants'].map(tag => (
                      <span key={tag} className="px-2.5 py-1 rounded-full bg-mint-mist border border-mint text-forest text-[11px] font-bold font-label-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════ NUTRITION TRACKER TAB ══════════════ */}
        {activeTab === 'tracker' && (
          <div className="space-y-4 animate-fade-in">

            {/* Macro ring */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-mint-mist/60 to-white/80 border border-mint/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">
                  Today&apos;s Macros
                </span>
                <span className="font-caption text-caption text-outline">Sample data</span>
              </div>

              {/* SVG Macro Ring */}
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 shrink-0 macro-ring">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Background circle */}
                    <circle cx="50" cy="50" r="38" fill="none" stroke="rgba(167,243,208,0.3)" strokeWidth="10" />
                    {/* Protein — emerald */}
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="#10B981" strokeWidth="10"
                      strokeDasharray={`${38 * 2 * Math.PI * 0.40} ${38 * 2 * Math.PI * 0.60}`}
                      strokeLinecap="round"
                    />
                    {/* Carbs — sky blue */}
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="#0EA5E9" strokeWidth="10"
                      strokeDasharray={`${38 * 2 * Math.PI * 0.35} ${38 * 2 * Math.PI * 0.65}`}
                      strokeDashoffset={`-${38 * 2 * Math.PI * 0.40}`}
                      strokeLinecap="round"
                    />
                    {/* Fats — amber */}
                    <circle
                      cx="50" cy="50" r="38" fill="none"
                      stroke="#F59E0B" strokeWidth="10"
                      strokeDasharray={`${38 * 2 * Math.PI * 0.25} ${38 * 2 * Math.PI * 0.75}`}
                      strokeDashoffset={`-${38 * 2 * Math.PI * 0.75}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  {/* Center label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-bold text-forest text-[16px] leading-none">1,840</span>
                    <span className="font-caption text-[9px] text-outline">kcal</span>
                  </div>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-2">
                  {[
                    { label: 'Protein', pct: 40, val: '142g', color: '#10B981' },
                    { label: 'Carbs', pct: 35, val: '161g', color: '#0EA5E9' },
                    { label: 'Fats', pct: 25, val: '51g', color: '#F59E0B' },
                  ].map(({ label, pct, val, color }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                      <span className="font-label-sm text-label-sm text-on-surface-variant flex-1">{label}</span>
                      <span className="font-label-sm text-label-sm text-on-surface font-bold">{val}</span>
                      <span className="font-caption text-caption text-outline w-7 text-right">{pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Micronutrients */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-mint/20 space-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Micronutrients</span>
                <span className="font-caption text-caption text-outline">Daily %</span>
              </div>
              {[
                { label: 'Vitamin D', value: 78, color: '#F59E0B' },
                { label: 'Omega-3', value: 55, color: '#0EA5E9' },
                { label: 'Magnesium', value: 92, color: '#10B981' },
                { label: 'Iron', value: 43, color: '#EF4444' },
              ].map(({ label, value, color }) => (
                <div key={label} className="py-1.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
                    <span className="font-label-sm text-label-sm text-on-surface font-semibold">{value}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${value}%`, background: color }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Nutrient stats grid */}
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-mint/20">
              <span className="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider block mb-2">
                Key Metrics
              </span>
              <NutrientStat label="Hydration" value={2.1} unit="L" color="#0EA5E9" icon="water_drop" />
              <NutrientStat label="Fiber" value={28} unit="g" color="#10B981" icon="grass" />
              <NutrientStat label="Sodium" value={1820} unit="mg" color="#F59E0B" icon="science" />
              <NutrientStat label="Calories" value={1840} unit="kcal" color="#059669" icon="local_fire_department" />
            </div>

          </div>
        )}
      </div>

      {/* ── Panel Footer ── */}
      <div className="px-5 py-3.5 border-t border-mint/20 shrink-0 relative z-10">
        <div className="flex items-start gap-2">
          <span className="material-symbols-outlined text-outline/70 text-[14px] shrink-0 mt-0.5">info</span>
          <p className="font-caption text-caption text-outline/80 italic leading-relaxed">
            NutriAI is for educational & wellness curiosity. Always consult a certified nutritionist for individualized advice.
          </p>
        </div>
      </div>
    </aside>
  );
}
