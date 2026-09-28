'use client';

interface MacroRingProps {
  compact?: boolean;
}

const MACROS = [
  { label: 'Protein', pct: 40, val: '142g', color: '#10B981' },
  { label: 'Carbs',   pct: 35, val: '161g', color: '#0EA5E9' },
  { label: 'Fats',    pct: 25, val: '51g',  color: '#F59E0B' },
];

export default function MacroRing({ compact = false }: MacroRingProps) {
  const r = compact ? 30 : 38;
  const circ = 2 * Math.PI * r;

  // Build segments from macros
  let offset = 0;
  const segments = MACROS.map(m => {
    const dash = circ * (m.pct / 100);
    const gap  = circ - dash;
    const seg  = { ...m, dash, gap, offset };
    offset += dash;
    return seg;
  });

  if (compact) {
    return (
      <div className="glass-2 rounded-2xl p-3 flex items-center gap-3 min-w-[160px] shadow-[0_8px_24px_-4px_rgba(6,78,59,0.12)]">
        <div className="relative w-14 h-14 shrink-0 macro-ring">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(167,243,208,0.25)" strokeWidth="8" />
            {segments.map(s => (
              <circle
                key={s.label}
                cx="40" cy="40" r={r} fill="none"
                stroke={s.color} strokeWidth="8"
                strokeDasharray={`${s.dash} ${s.gap}`}
                strokeDashoffset={-s.offset}
                strokeLinecap="round"
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-bold text-forest text-[11px] leading-none">1,840</span>
            <span className="text-[8px] text-outline">kcal</span>
          </div>
        </div>
        <div className="space-y-1">
          {MACROS.map(m => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span className="font-caption text-caption text-on-surface-variant leading-none">{m.label}</span>
              <span className="font-caption text-caption text-on-surface font-bold ml-auto">{m.val}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32 macro-ring">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(167,243,208,0.25)" strokeWidth="10" />
          {segments.map(s => (
            <circle
              key={s.label}
              cx="50" cy="50" r={r} fill="none"
              stroke={s.color} strokeWidth="10"
              strokeDasharray={`${s.dash} ${s.gap}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="round"
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold text-forest text-[20px] leading-none">1,840</span>
          <span className="font-caption text-caption text-outline">kcal today</span>
        </div>
      </div>

      <div className="flex gap-3">
        {MACROS.map(m => (
          <div key={m.label} className="flex flex-col items-center gap-1">
            <span className="font-label-sm text-label-sm text-on-surface font-bold">{m.val}</span>
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ background: m.color }} />
              <span className="font-caption text-caption text-on-surface-variant">{m.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
