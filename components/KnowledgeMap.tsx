import React from 'react';

interface TopicNode {
  primary: string;
  related: string[];
}

export default function KnowledgeMap({ messages }: { messages: any[] }) {
  // Extract all topics from messages
  const topicNodes = messages
    .filter(m => m.role === 'assistant' && m.primary_topic)
    .map(m => ({
      primary: m.primary_topic,
      related: m.related_topics || []
    })) as TopicNode[];

  if (topicNodes.length === 0) return null;

  return (
    <div className="hidden lg:flex w-96 flex-col border-l border-surface-container bg-surface-container-lowest h-[calc(100vh-5rem)] shadow-lg overflow-y-auto animate-slide-in-right">
      <div className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md p-6 border-b border-surface-container z-10">
        <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">account_tree</span>
          Session Knowledge Map
        </h2>
        <p className="font-caption text-caption text-outline mt-1">
          A visual graph of topics explored in this session.
        </p>
      </div>

      <div className="p-6 relative">
        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-teal-100/50 -z-10"></div>
        <div className="space-y-12">
          {topicNodes.map((node, i) => (
            <div key={i} className="relative z-10 animate-fade-in" style={{ animationDelay: \`\${i * 0.1}s\` }}>
              {/* Primary Topic Bubble */}
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-teal-600 shadow-md flex items-center justify-center ring-4 ring-white shrink-0">
                  <span className="material-symbols-outlined text-white text-[16px]">psychology</span>
                </div>
                <div className="bg-teal-50 border border-teal-100 px-4 py-2 rounded-xl shadow-sm">
                  <span className="font-label-md text-teal-900 font-bold">{node.primary}</span>
                </div>
              </div>

              {/* Related Topics Branching Out */}
              {node.related.length > 0 && (
                <div className="mt-4 ml-12 space-y-3">
                  {node.related.map((rel, j) => (
                    <div key={j} className="flex items-center gap-3 relative">
                      <div className="absolute -left-[30px] top-1/2 w-[22px] h-px bg-teal-200"></div>
                      <div className="absolute -left-[30px] -top-10 h-14 w-px bg-teal-200"></div>
                      
                      <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                      <div className="bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-sm text-slate-600 font-medium hover:border-teal-200 hover:text-teal-700 transition-colors cursor-default shadow-sm">
                        {rel}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
