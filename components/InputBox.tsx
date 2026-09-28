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
    <div className="w-full max-w-3xl mx-auto p-4">
      <div className="glass-2 rounded-2xl flex items-end p-2 transition-glass hover:shadow-lg focus-within:shadow-lg">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder="Ask a nutrition question..."
          className="flex-1 max-h-32 bg-transparent border-0 resize-none px-4 py-3 focus:ring-0 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:shadow-none"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={disabled || !text.trim()}
          className="p-3 m-1 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600 transition-colors flex-shrink-0"
        >
          <span className="material-symbols-outlined font-semibold">send</span>
        </button>
      </div>
    </div>
  );
}
