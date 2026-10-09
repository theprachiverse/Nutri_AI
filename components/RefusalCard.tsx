import React from 'react';

interface RefusalCardProps {
  status: 'out_of_scope' | 'not_covered';
  message: string;
}

export default function RefusalCard({ status, message }: RefusalCardProps) {
  if (status === 'out_of_scope') {
    return (
      <div className="w-full bg-red-50 rounded-3xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border border-red-100 mb-6">
        <div className="relative z-10 flex items-center justify-between pb-4 border-b border-red-200">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-red-600">gavel</span>
            <span className="font-label-md text-label-md font-semibold text-red-900">Safety Policy Violation</span>
          </div>
        </div>
        <div className="relative z-10 my-4">
          <p className="font-body-md text-body-md text-red-800 leading-relaxed">
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-amber-50 rounded-3xl shadow-md p-6 sm:p-8 relative overflow-hidden transition-all duration-300 border border-amber-100 mb-6">
      <div className="relative z-10 flex items-center justify-between pb-4 border-b border-amber-200">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-amber-600">search_off</span>
          <span className="font-label-md text-label-md font-semibold text-amber-900">Information Not Found</span>
        </div>
      </div>
      <div className="relative z-10 my-4">
        <p className="font-body-md text-body-md text-amber-800 leading-relaxed">
          {message}
        </p>
        <div className="mt-4 p-4 bg-amber-100/50 rounded-xl border border-amber-200/50">
          <p className="font-caption text-caption text-amber-700">
            We searched our dietary corpus (including ICMR, WHO, FDA) but could not find verified claims covering your specific question.
          </p>
        </div>
      </div>
    </div>
  );
}
