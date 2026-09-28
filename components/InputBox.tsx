'use client';
import { useState, useRef, useEffect } from 'react';

interface InputBoxProps {
  onSend:    (text: string) => void;
  disabled:  boolean;
  value?:    string;
  onChange?: (val: string) => void;
}

export default function InputBox({ onSend, disabled, value, onChange }: InputBoxProps) {
  const [internalText, setInternalText] = useState('');
  const [isFocused, setIsFocused]       = useState(false);
  const [charCount, setCharCount]       = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Support controlled (suggested prompt) or uncontrolled
  const text    = value !== undefined ? value : internalText;
  const setText = (val: string) => {
    if (onChange) onChange(val);
    else setInternalText(val);
    setCharCount(val.length);
  };

  // Auto-expand textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  // Focus on injected prompt
  useEffect(() => {
    if (value && textareaRef.current) textareaRef.current.focus();
  }, [value]);

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const hasText = text.trim().length > 0;

  return (
    <div
      className={`
        relative rounded-2xl transition-all duration-300
        ${isFocused
          ? 'ring-2 ring-emerald/30 shadow-[0_8px_24px_-4px_rgba(16,185,129,0.15)]'
          : 'shadow-[0_4px_16px_-4px_rgba(6,78,59,0.08)]'
        }
        ${disabled ? 'opacity-70 pointer-events-none' : ''}
      `}
      style={{
        background: 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(20px)',
        border: isFocused ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(167,243,208,0.5)',
      }}
    >
      {/* Top sparkle decoration */}
      <div className="absolute -top-px inset-x-4 h-px bg-gradient-to-r from-transparent via-emerald/40 to-transparent" />

      <div className="flex items-end gap-3 px-4 py-3">
        {/* AI sparkle icon */}
        <span
          className={`material-symbols-outlined text-[22px] shrink-0 mb-1 transition-all duration-300 ${
            isFocused ? 'text-emerald scale-110' : 'text-on-surface-variant'
          }`}
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          auto_awesome
        </span>

        {/* Auto-expanding textarea */}
        <textarea
          ref={textareaRef}
          id="prompt-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          disabled={disabled}
          placeholder="Ask about food, nutrition, supplements, sleep timing…"
          className="
            w-full bg-transparent text-on-surface placeholder:text-outline/50
            outline-none resize-none border-0 focus:ring-0 shadow-none
            font-body-md text-body-md leading-relaxed py-1 max-h-[180px] min-h-[28px]
            disabled:opacity-60 font-sans
          "
          rows={1}
          maxLength={2000}
        />

        {/* Right side: char count, mic, send */}
        <div className="flex items-center gap-1.5 shrink-0 mb-0.5">

          {/* Character count (shown when typing) */}
          {hasText && charCount > 100 && (
            <span className={`font-caption text-caption transition-colors ${
              charCount > 1800 ? 'text-error' : 'text-outline/60'
            }`}>
              {2000 - charCount}
            </span>
          )}

          {/* Mic button */}
          <button
            aria-label="Voice input"
            type="button"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-outline hover:text-emerald hover:bg-mint-mist transition-all duration-200"
          >
            <span className="material-symbols-outlined text-[19px]">mic</span>
          </button>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={disabled || !hasText}
            aria-label="Send message"
            type="button"
            className={`
              w-10 h-10 rounded-xl flex items-center justify-center
              transition-all duration-200 active:scale-95
              ${hasText && !disabled
                ? 'gradient-emerald text-white shadow-[0_4px_12px_rgba(16,185,129,0.35)] hover:shadow-[0_6px_16px_rgba(16,185,129,0.45)] hover:scale-105'
                : 'bg-surface-container text-outline cursor-not-allowed opacity-40'
              }
            `}
          >
            <span className="material-symbols-outlined text-[19px]">arrow_upward</span>
          </button>
        </div>
      </div>

      {/* Bottom hint bar */}
      <div className="flex items-center justify-between px-4 pb-2.5 pt-0">
        <span className="font-caption text-caption text-outline/60">
          Press <kbd className="px-1 py-0.5 rounded bg-surface-container text-[10px] font-mono">Enter</kbd> to send
          ·&nbsp;
          <kbd className="px-1 py-0.5 rounded bg-surface-container text-[10px] font-mono">Shift+Enter</kbd> for newline
        </span>
        <span className="font-caption text-caption text-outline/40">
          Powered by NutriAI Core
        </span>
      </div>
    </div>
  );
}
