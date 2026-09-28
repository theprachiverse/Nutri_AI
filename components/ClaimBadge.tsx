'use client';
import { Claim } from '@/lib/schema';

interface ClaimBadgeProps {
  claim:      Claim;
  isSelected: boolean;
  onSelect:   (claim: Claim) => void;
  index?:     number;
}

export default function ClaimBadge({ claim, isSelected, onSelect, index = 0 }: ClaimBadgeProps) {
  return (
    <button
      onClick={() => onSelect(claim)}
      className={`
        group px-3.5 py-2 rounded-full font-label-md text-label-md
        flex items-center gap-2 transition-all duration-200 relative overflow-hidden
        ${isSelected
          ? 'gradient-emerald text-white shadow-[0_4px_14px_rgba(16,185,129,0.35)] scale-[1.03]'
          : 'glass-1 text-on-surface hover:bg-mint-mist hover:text-forest hover:border-mint hover:scale-[1.01] hover:shadow-[0_2px_8px_rgba(16,185,129,0.12)]'
        }
      `}
    >
      {/* Active shimmer */}
      {isSelected && (
        <div className="absolute inset-0 shimmer opacity-20 pointer-events-none" />
      )}

      {/* Number badge */}
      <span
        className={`
          relative z-10 w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 transition-all
          ${isSelected
            ? 'bg-white/25 text-white'
            : 'bg-mint-mist text-forest border border-mint group-hover:bg-emerald/10 group-hover:border-emerald/30'
          }
        `}
      >
        {index + 1}
      </span>

      <span className="relative z-10 leading-tight">{claim.claim_text}</span>

      {isSelected && (
        <span className="relative z-10 material-symbols-outlined text-[14px] transition-transform group-hover:translate-x-0.5 ml-0.5">
          arrow_forward
        </span>
      )}
    </button>
  );
}
