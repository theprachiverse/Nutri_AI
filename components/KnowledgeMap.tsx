'use client';
import React from 'react';

interface TopicNode {
  primary: string;
  related: string[];
}

interface KnowledgeMapProps {
  messages: any[];
  onClose?: () => void;
  onTopicClick?: (topic: string) => void;
}

export default function KnowledgeMap({ messages, onClose, onTopicClick }: KnowledgeMapProps) {
  // Extract all topics from assistant messages
  const topicNodes = messages
    .filter(m => m.role === 'assistant' && m.primary_topic)
    .map(m => ({
      primary: m.primary_topic as string,
      related: (m.related_topics || []) as string[]
    })) as TopicNode[];

  // Starter exploration ideas when no topics have been explored yet
  const starterTopics = [
    { label: "Dietary Guidelines for Indians", query: "What are the Dietary Guidelines for Indians?" },
    { label: "Canada's Dietary Guidelines", query: "What are Canada's Dietary Guidelines?" },
    { label: "Daily Protein Intake", query: "What are the recommended daily protein requirements?" },
    { label: "Added Sugars & Sodium Limits", query: "What are the guideline limits on added sugar and sodium?" }
  ];

  return (
    <aside 
      className="fixed inset-y-0 left-0 z-40 w-80 sm:w-88 lg:w-80 xl:w-88 bg-white flex flex-col justify-between shadow-xl lg:shadow-none border-r border-slate-200 lg:static lg:h-[calc(100vh-5rem)] overflow-y-auto animate-slide-in-left pt-20 lg:pt-0 shrink-0"
      id="knowledge-map-sidebar"
    >
      <div className="p-5 sm:p-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-surface-container">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
              <span className="material-symbols-outlined text-[18px]">account_tree</span>
            </span>
            <div>
              <h2 className="font-headline-sm text-headline-sm font-semibold text-primary">
                Knowledge Map
              </h2>
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                {topicNodes.length > 0 ? `${topicNodes.length} topic${topicNodes.length > 1 ? 's' : ''} explored` : 'Session Graph'}
              </span>
            </div>
          </div>
          {onClose && (
            <button 
              onClick={onClose} 
              aria-label="Close Knowledge Map" 
              className="w-8 h-8 rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-low transition-colors" 
              type="button"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}
        </div>

        {/* Content */}
        {topicNodes.length === 0 ? (
          /* Empty State */
          <div className="my-auto py-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-3 shadow-sm">
              <span className="material-symbols-outlined text-3xl">hub</span>
            </div>
            <h3 className="text-base font-semibold text-slate-800 mb-1 font-['Literata']">
              Session Knowledge Map
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-xs mb-6">
              Ask questions to automatically map out topics, connections, and clinical nutritional relationships discovered in your session.
            </p>

            <div className="w-full text-left space-y-2">
              <span className="text-[10px] font-bold text-teal-800 uppercase tracking-wider block">
                Click to explore:
              </span>
              <div className="space-y-1.5">
                {starterTopics.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => onTopicClick && onTopicClick(item.query)}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-700 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-100 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                  >
                    <span>{item.label}</span>
                    <span className="material-symbols-outlined text-[14px] text-slate-400 group-hover:text-teal-600 transition-colors">
                      arrow_forward
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Interactive Topic Nodes Graph */
          <div className="mt-6 relative flex-1">
            {/* Vertical spine line */}
            <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gradient-to-b from-teal-400 via-teal-200 to-transparent -z-0"></div>

            <div className="space-y-7 relative z-10">
              {topicNodes.map((node, i) => (
                <div key={i} className="relative animate-fade-in" style={{ animationDelay: `${i * 0.08}s` }}>
                  {/* Primary Node */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-600 text-white shadow-md flex items-center justify-center ring-4 ring-white shrink-0">
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                    </div>
                    <button
                      onClick={() => onTopicClick && onTopicClick(`Tell me more about ${node.primary}`)}
                      title={`Ask more about ${node.primary}`}
                      className="bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3.5 py-1.5 rounded-xl shadow-xs text-left transition-all cursor-pointer group"
                    >
                      <span className="font-label-md text-xs sm:text-sm text-teal-950 font-bold group-hover:text-teal-700 flex items-center gap-1.5">
                        {node.primary}
                        <span className="material-symbols-outlined text-[13px] opacity-0 group-hover:opacity-100 transition-opacity">
                          search
                        </span>
                      </span>
                    </button>
                  </div>

                  {/* Related Branches */}
                  {node.related.length > 0 && (
                    <div className="mt-2.5 ml-5 pl-5 space-y-1.5 border-l-2 border-teal-100">
                      {node.related.map((rel, j) => (
                        <div key={j} className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 shrink-0"></span>
                          <button
                            onClick={() => onTopicClick && onTopicClick(`What do dietary guidelines say about ${rel}?`)}
                            title={`Explore ${rel}`}
                            className="bg-white border border-slate-200 hover:border-teal-300 hover:bg-teal-50 px-2.5 py-1 rounded-lg text-xs text-slate-700 hover:text-teal-800 font-medium transition-all shadow-2xs text-left cursor-pointer flex items-center gap-1 group"
                          >
                            <span>{rel}</span>
                            <span className="material-symbols-outlined text-[11px] text-slate-300 group-hover:text-teal-600 transition-colors">
                              north_east
                            </span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Advisory */}
      <div className="p-3.5 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 flex items-center gap-2">
        <span className="material-symbols-outlined text-[15px] text-teal-600 shrink-0">touch_app</span>
        <span>Click any node to explore that concept in depth.</span>
      </div>
    </aside>
  );
}
