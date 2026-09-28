'use client';
import { useState, useCallback } from 'react';
import MessageList, { MessageTurn } from './MessageList';
import InputBox from './InputBox';
import SourcesPanel from './SourcesPanel';
import MacroRing from './MacroRing';
import { Claim } from '@/lib/schema';

const SUGGESTED_PROMPTS = [
  'Does tart cherry juice help with sleep?',
  'What are the health benefits of fasting?',
  'How do Omega-3s support heart health?',
  'Which magnesium form is best for sleep?',
  'What foods are highest in vitamin D?',
  'How much protein do I need daily?',
];

export default function ChatWindow() {
  const [messages, setMessages]             = useState<MessageTurn[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading]           = useState(false);
  const [errorMessage, setErrorMessage]     = useState<string | null>(null);
  const [selectedClaim, setSelectedClaim]   = useState<Claim | null>(null);
  const [pendingPrompt, setPendingPrompt]   = useState('');
  const [sidebarOpen, setSidebarOpen]       = useState(true);

  const handleSend = useCallback(async (text: string) => {
    const userMsg: MessageTurn = {
      id:      Date.now().toString(),
      role:    'user',
      content: text,
    };

    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setErrorMessage(null);
    setPendingPrompt('');

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ conversationId, userMessage: text }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'API error');
      }

      const data = await res.json();
      if (data.conversationId) setConversationId(data.conversationId);

      const assistantMsg: MessageTurn = {
        id:      (Date.now() + 1).toString(),
        role:    'assistant',
        content: data.answer_text,
        claims:  data.claims,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  const handleClaimSelect = useCallback((claim: Claim) => {
    setSelectedClaim(claim);
    setSidebarOpen(true);
  }, []);

  return (
    <div className="flex w-full h-full overflow-hidden">

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MAIN CONVERSATION COLUMN                                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative min-w-0">

        {/* Scrollable message canvas */}
        <MessageList
          messages={messages}
          isLoading={isLoading}
          selectedClaim={selectedClaim}
          onClaimSelect={handleClaimSelect}
          errorMessage={errorMessage}
          onPromptSelect={setPendingPrompt}
        />

        {/* ──────────────────────────────────────────────────────────── */}
        {/* STICKY CHAT DOCK — Glass Tier 3                              */}
        {/* ──────────────────────────────────────────────────────────── */}
        <div className="shrink-0 px-4 sm:px-6 lg:px-8 pb-4 pt-2 relative z-20 glass-3 border-t border-mint/20">
          <div className="max-w-3xl mx-auto space-y-2">

            <InputBox
              onSend={handleSend}
              disabled={isLoading}
              value={pendingPrompt}
              onChange={setPendingPrompt}
            />

            {/* Suggested chips row */}
            <div className="flex items-center gap-2 overflow-x-auto pb-0.5 text-nowrap">
              <div className="flex items-center gap-1.5 pl-1 shrink-0">
                <span
                  className="material-symbols-outlined text-emerald text-[14px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  tips_and_updates
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant font-semibold">Try:</span>
              </div>
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setPendingPrompt(prompt)}
                  className="shrink-0 px-3 py-1 rounded-full glass-1 hover:bg-mint-mist hover:border-mint text-on-surface hover:text-forest font-label-sm text-label-sm transition-all duration-200 group"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* RIGHT PANEL: SOURCES + NUTRITION TRACKER                         */}
      {/* ════════════════════════════════════════════════════════════════ */}
      {sidebarOpen && (
        <SourcesPanel
          selectedClaim={selectedClaim}
          onClose={() => setSidebarOpen(false)}
          messageCount={messages.length}
        />
      )}

      {/* Toggle sidebar button (shown when closed on desktop) */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 w-9 h-16 glass-2 rounded-l-xl items-center justify-center text-primary hover:glass-3 transition-all duration-200 z-30 border border-mint/40"
          aria-label="Open sources panel"
        >
          <span className="material-symbols-outlined text-[18px]">chevron_left</span>
        </button>
      )}

      {/* Macro ring floating widget (desktop) */}
      {messages.length > 0 && !sidebarOpen && (
        <div className="hidden lg:block fixed right-16 bottom-24 z-20">
          <MacroRing compact />
        </div>
      )}
    </div>
  );
}
