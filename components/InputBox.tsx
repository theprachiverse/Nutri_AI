import React, { useState, useRef, useEffect } from 'react';

export default function InputBox({ onSend, disabled }: { onSend: (text: string) => void, disabled: boolean }) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [text]);

  return (
    <div className="max-w-3xl w-full mx-auto pt-2 pb-4 space-y-3 sticky bottom-3 z-30">
      {/* Floating Pill Input Container */}
      <div className="bg-white rounded-full shadow-lg p-2 pl-5 flex items-center gap-3 focus-within:shadow-xl transition-all duration-300 border border-slate-200/80">
        <span className="material-symbols-outlined text-[#0d9488] text-[22px]">temp_preferences_custom</span>
        <textarea 
          ref={textareaRef}
          autoComplete="off" 
          className="font-body-md text-body-md text-on-surface placeholder:text-outline/70 flex-1 bg-transparent outline-none border-none py-1 resize-none min-h-[32px] max-h-32" 
          id="chat-input" 
          placeholder="Ask about food, nutrition, supplements, bedtime timing..." 
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <div className="flex items-center gap-1.5 pr-1">
          <button aria-label="Voice input" className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-[#0d9488] hover:bg-slate-50 transition-colors" type="button">
            <span className="material-symbols-outlined text-[20px]">mic</span>
          </button>
          <button 
            aria-label="Send message" 
            className="w-11 h-11 rounded-full bg-[#0d9488] text-white flex items-center justify-center hover:bg-[#0f766e] active:scale-95 shadow-md shadow-teal-700/25 transition-all duration-200 disabled:opacity-50" 
            id="send-button" 
            type="button"
            onClick={handleSend}
            disabled={disabled || !text.trim()}
          >
            <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
          </button>
        </div>
      </div>
      
      {/* Suggested Queries Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-nowrap">
        <div className="flex items-center gap-1.5 pl-2 text-outline shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          <span className="font-label-sm text-label-sm font-semibold">Try asking:</span>
        </div>
        {[
          "What are the WHO guidelines on non-sugar sweeteners?",
          "What are the five keys to safer food?",
          "How should used cooking oil be handled safely?",
          "What are the Dietary Guidelines for Indians?"
        ].map((query, i) => (
          <button 
            key={i}
            onClick={() => onSend(query)}
            disabled={disabled}
            className="suggestion-chip px-3.5 py-1 rounded-full bg-surface-container-lowest hover:bg-surface-container-low text-on-surface font-label-sm text-label-sm shadow-sm transition-colors shrink-0" 
            type="button"
          >
            {query}
          </button>
        ))}
      </div>
    </div>
  );
}
