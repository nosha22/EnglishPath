'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface TutorResponse {
  corrected: string;
  isCorrect: boolean;
  explanation: string;
  tips: string[];
}

interface ChatMessage {
  id: string;
  type: 'user' | 'tutor';
  text?: string;
  response?: TutorResponse;
  timestamp: Date;
}

export default function TutorChat() {
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [showPulse, setShowPulse] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Hide pulse animation after first open
  useEffect(() => {
    if (isOpen) setShowPulse(false);
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      text: trimmed,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: trimmed,
          level: profile?.current_level || 'B1',
        }),
      });

      const data = await res.json();

      if (data.error) {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'tutor',
          response: {
            corrected: '',
            isCorrect: false,
            explanation: data.error,
            tips: [],
          },
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMsg]);
      } else {
        const tutorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'tutor',
          response: data,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, tutorMsg]);
      }
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'tutor',
        response: {
          corrected: '',
          isCorrect: false,
          explanation: '❌ Não foi possível contactar o Professor Virtual. Verifica a tua ligação à Internet.',
          tips: [],
        },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        id="tutor-fab"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed z-50 flex items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen
            ? 'bottom-5 right-5 w-12 h-12 bg-error text-white md:bottom-6 md:right-6'
            : 'bottom-20 right-4 w-14 h-14 bg-primary text-white md:bottom-6 md:right-6 md:w-16 md:h-16'
        }`}
        aria-label={isOpen ? 'Fechar Professor Virtual' : 'Abrir Professor Virtual'}
      >
        {isOpen ? (
          <span className="material-symbols-outlined text-xl">close</span>
        ) : (
          <>
            <span className="material-symbols-outlined text-2xl md:text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
            {showPulse && (
              <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
            )}
          </>
        )}
      </button>

      {/* Chat Panel */}
      <div
        className={`fixed z-50 transition-all duration-300 ease-out ${
          isOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 translate-y-4 pointer-events-none'
        } ${
          /* Mobile: full-width bottom sheet. Desktop: fixed panel bottom-right */
          'bottom-0 left-0 right-0 h-[85vh] md:bottom-20 md:left-auto md:right-6 md:h-[600px] md:w-[420px] md:rounded-2xl'
        }`}
      >
        <div className="flex flex-col h-full bg-surface/95 backdrop-blur-xl border border-outline-variant/40 shadow-2xl md:rounded-2xl rounded-t-2xl overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-primary text-white shrink-0">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                school
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm leading-tight">Professor Virtual</h3>
              <p className="text-[11px] text-white/70 leading-tight">
                Escreve uma frase em inglês e eu corrijo-a! 🎒
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white/15 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {profile?.current_level || 'B1'}
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 custom-scrollbar">
            
            {/* Welcome message */}
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-4 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    explore
                  </span>
                </div>
                <div className="space-y-2">
                  <h4 className="font-bold text-on-surface text-lg">Olá, Explorador! 👋</h4>
                  <p className="text-sm text-secondary leading-relaxed max-w-xs">
                    Sou o teu Professor Virtual. Escreve qualquer frase em inglês e eu vou corrigi-la, explicar os erros e dar-te dicas — tudo em português!
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                  {[
                    'I goed to the store yesterday',
                    'She don\'t like coffee',
                    'He is more taller than me',
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => {
                        setInput(example);
                        inputRef.current?.focus();
                      }}
                      className="text-left px-3 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/40 text-xs text-on-surface hover:border-primary hover:bg-primary/5 transition-all group"
                    >
                      <span className="text-primary font-bold mr-1 group-hover:mr-2 transition-all">→</span>
                      <span className="italic text-secondary">&quot;{example}&quot;</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat messages */}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.type === 'user' ? (
                  /* User message bubble */
                  <div className="max-w-[85%] bg-primary text-white px-4 py-3 rounded-2xl rounded-br-md shadow-sm">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className="block text-[10px] text-white/50 mt-1 text-right">
                      {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : msg.response ? (
                  /* Tutor response card */
                  <div className="max-w-[90%] space-y-2.5">
                    {/* Corrected sentence */}
                    {msg.response.corrected && (
                      <div className={`px-4 py-3 rounded-2xl rounded-bl-md shadow-sm border ${
                        msg.response.isCorrect 
                          ? 'bg-tertiary-fixed/15 border-tertiary/20' 
                          : 'bg-surface-container-lowest border-outline-variant/40'
                      }`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className={`material-symbols-outlined text-sm ${msg.response.isCorrect ? 'text-tertiary' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {msg.response.isCorrect ? 'check_circle' : 'edit_note'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.response.isCorrect ? 'text-tertiary' : 'text-primary'}`}>
                            {msg.response.isCorrect ? 'Correto! ✨' : 'Versão Corrigida'}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-on-surface leading-relaxed">
                          {msg.response.corrected}
                        </p>
                      </div>
                    )}

                    {/* Explanation */}
                    {msg.response.explanation && (
                      <div className="px-4 py-3 bg-surface-container-low rounded-2xl border border-outline-variant/30">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="material-symbols-outlined text-sm text-primary">menu_book</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">Explicação</span>
                        </div>
                        <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                          {msg.response.explanation}
                        </p>
                      </div>
                    )}

                    {/* Tips */}
                    {msg.response.tips && msg.response.tips.length > 0 && (
                      <div className="px-4 py-3 bg-accent-warning/5 rounded-2xl border border-accent-warning/20">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="material-symbols-outlined text-sm text-accent-warning" style={{ fontVariationSettings: "'FILL' 1" }}>tips_and_updates</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-accent-warning">Dicas do Guia</span>
                        </div>
                        <ul className="space-y-1.5">
                          {msg.response.tips.map((tip, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-on-surface-variant leading-relaxed">
                              <span className="text-accent-warning font-bold mt-0.5 shrink-0">💡</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <span className="block text-[10px] text-secondary pl-1">
                      {msg.timestamp.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ) : null}
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low px-5 py-3 rounded-2xl rounded-bl-md border border-outline-variant/30 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-sm animate-spin">progress_activity</span>
                    <span className="text-xs text-secondary">O Professor está a analisar...</span>
                  </div>
                  <div className="flex gap-1 mt-2">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="shrink-0 border-t border-outline-variant/30 bg-surface-container-lowest px-4 py-3">
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Escreve uma frase em inglês..."
                  rows={1}
                  disabled={isLoading}
                  className="w-full resize-none rounded-xl border border-outline-variant bg-white px-4 py-3 pr-10 text-sm text-on-surface placeholder:text-secondary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-50 transition-all"
                  style={{ maxHeight: '120px', minHeight: '44px' }}
                  onInput={(e) => {
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                    target.style.height = Math.min(target.scrollHeight, 120) + 'px';
                  }}
                />
                <span className="absolute right-3 bottom-3 text-[10px] text-secondary/40 font-mono">
                  {input.length}/2000
                </span>
              </div>
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="shrink-0 w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Enviar"
              >
                <span className="material-symbols-outlined text-lg">send</span>
              </button>
            </form>
            <p className="text-[10px] text-secondary/60 mt-1.5 text-center">
              Powered by Groq AI · Nível {profile?.current_level || 'B1'} · Enter para enviar
            </p>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
