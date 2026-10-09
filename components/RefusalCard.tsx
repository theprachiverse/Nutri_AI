import React from 'react';

interface RefusalCardProps {
  status: 'out_of_scope' | 'not_covered';
  message: string;
}

export default function RefusalCard({ status, message }: RefusalCardProps) {
  if (status === 'out_of_scope') {
    return (
      <div className="w-full bg-error-container rounded-3xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border border-error mb-6">
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-error/20">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-error">gavel</span>
            <span className="font-label-md text-label-md font-semibold text-on-error-container">Safety Policy Violation</span>
          </div>
        </div>
        <div className="relative z-10 my-4">
          <p className="font-body-md text-body-md text-on-error-container leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-tertiary-fixed rounded-3xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border border-tertiary-fixed-dim mb-6">
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-tertiary-fixed-dim">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-tertiary">search_off</span>
          <span className="font-label-md text-label-md font-semibold text-on-tertiary-fixed">Information Not Found</span>
        </div>
      </div>
      <div className="relative z-10 my-4">
        <p className="font-body-md text-body-md text-on-tertiary-fixed leading-relaxed">
          {message}
        </p>
        <div className="mt-4 p-4 bg-tertiary-container/10 rounded-xl border border-tertiary-fixed-dim">
          <p className="font-caption text-caption text-on-tertiary-fixed-variant">
            We searched our dietary corpus (including ICMR, WHO, FDA) but could not find verified claims covering your specific question.
          </p>
        </div>
      </div>
    </div>
  );
}
