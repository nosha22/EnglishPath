'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService, PersonalDictionaryItem } from '@/lib/supabase';

export default function PersonalDictionary() {
  const router = useRouter();
  const { profile } = useAuth();
  const level = profile?.current_level || 'B1';
  
  const [words, setWords] = useState<PersonalDictionaryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Game states
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [gameWords, setGameWords] = useState<PersonalDictionaryItem[]>([]);
  const [currentGameIdx, setCurrentGameIdx] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const loadWords = async () => {
    try {
      setLoading(true);
      const dict = await dbService.getPersonalDictionary();
      setWords(dict);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWords();
  }, []);

  const handleDelete = async (word: string) => {
    try {
      const ok = await dbService.deleteWord(word);
      if (ok) {
        setWords(prev => prev.filter(w => w.word !== word));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartReview = () => {
    if (words.length === 0) return;
    // Filter words due for review or just take a random set of 5 words
    const shuffled = [...words].sort(() => 0.5 - Math.random()).slice(0, 5);
    setGameWords(shuffled);
    setCurrentGameIdx(0);
    setShowDefinition(false);
    setCorrectCount(0);
    setIsReviewMode(true);
  };

  const handleReviewReply = async (remembered: boolean) => {
    const activeWord = gameWords[currentGameIdx];
    try {
      await dbService.updateWordReview(activeWord.word, remembered);
      if (remembered) {
        setCorrectCount(prev => prev + 1);
      }
    } catch (e) {
      console.error(e);
    }

    if (currentGameIdx < gameWords.length - 1) {
      setShowDefinition(false);
      setCurrentGameIdx(prev => prev + 1);
    } else {
      // Game finished
      setShowDefinition(true);
      setCurrentGameIdx(prev => prev + 1); // trigger finish screen
      await loadWords(); // reload progress stats
    }
  };

  const filteredWords = words.filter(item => 
    item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/dashboard')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
          <div className="ml-md px-sm py-0.5 bg-primary-container text-white rounded font-bold text-[10px] uppercase">
            Glossário
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-lg">
          <button onClick={() => router.push('/dashboard')} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Painel</button>
          <button onClick={() => router.push(`/curriculum/${level}`)} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Currículo</button>
          <button onClick={() => router.push('/dictionary')} className="text-label-md font-bold text-primary">Dicionário</button>
          <div className="h-6 w-px bg-outline-variant mx-xs"></div>
          
          <div className="flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-full border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-label-md font-bold text-primary">XP: {profile?.xp || 0}</span>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="flex-grow pt-20 pb-24 px-container-margin max-w-4xl mx-auto w-full">
        
        {isReviewMode ? (
          /* Spaced Repetition Review Game interface */
          <div className="max-w-[28rem] mx-auto py-lg space-y-lg">
            <div className="flex justify-between items-center text-sm">
              <button 
                onClick={() => setIsReviewMode(false)}
                className="text-secondary hover:text-on-surface flex items-center gap-xs font-semibold"
              >
                <span className="material-symbols-outlined text-sm font-bold">arrow_back</span>
                Sair do Treino
              </button>
              {currentGameIdx < gameWords.length && (
                <span className="font-bold text-primary">
                  Progresso: {currentGameIdx + 1} de {gameWords.length}
                </span>
              )}
            </div>

            {currentGameIdx < gameWords.length ? (
              /* Review Word Card */
              <div className="space-y-lg">
                <div className="bg-surface-container-lowest border-2 border-primary rounded-2xl p-lg min-h-[260px] flex flex-col justify-between items-center text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-md left-md bg-primary-container/10 text-primary text-[10px] font-bold px-sm py-0.5 rounded uppercase">
                    Flipping Memory Card
                  </div>
                  
                  <div className="my-auto space-y-md">
                    <span className="text-4xl font-extrabold text-primary capitalize block tracking-tight">
                      {gameWords[currentGameIdx].word}
                    </span>
                    
                    {showDefinition ? (
                      <div className="space-y-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <p className="text-sm text-on-surface font-semibold bg-surface-container-low p-sm rounded-xl">
                          {gameWords[currentGameIdx].definition}
                        </p>
                        {gameWords[currentGameIdx].example && (
                          <p className="text-xs text-secondary italic">
                            &quot;{gameWords[currentGameIdx].example}&quot;
                          </p>
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowDefinition(true)}
                        className="px-lg py-2 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-xs transition-all mx-auto active:scale-95"
                      >
                        <span className="material-symbols-outlined text-sm font-bold">visibility</span>
                        Ver Significado
                      </button>
                    )}
                  </div>
                  
                  <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">
                    Nível Alinhado: {gameWords[currentGameIdx].level || 'B1'}
                  </span>
                </div>

                {/* Game actions */}
                {showDefinition && (
                  <div className="grid grid-cols-2 gap-md animate-in fade-in duration-200">
                    <button
                      onClick={() => handleReviewReply(false)}
                      className="py-3 border-2 border-error text-error bg-transparent rounded-xl font-bold text-xs hover:bg-error/5 active:scale-95 transition-all flex items-center justify-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">close</span>
                      Não me Lembrava
                    </button>
                    <button
                      onClick={() => handleReviewReply(true)}
                      className="py-3 bg-tertiary text-white rounded-xl font-bold text-xs hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-xs shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">check</span>
                      Lembro-me!
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Finish Screen */
              <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-lg text-center space-y-md">
                <span className="material-symbols-outlined text-tertiary text-5xl bg-tertiary-fixed/30 rounded-full p-sm animate-bounce">emoji_events</span>
                <h3 className="text-2xl font-bold text-on-surface">Treino Concluído!</h3>
                <p className="text-xs text-secondary leading-relaxed">
                  Concluíste a tua sessão de memorização guiada. Excelente trabalho para reforçar conexões neurais!
                </p>

                <div className="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30 flex justify-between text-xs font-semibold">
                  <span>Taxa de Acertos</span>
                  <span className="text-primary font-bold">{Math.round((correctCount / gameWords.length) * 100)}% ({correctCount} de {gameWords.length})</span>
                </div>

                <div className="flex flex-col gap-sm pt-xs">
                  <button
                    onClick={handleStartReview}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs active:scale-95 shadow transition-all hover:opacity-95"
                  >
                    Treinar Mais 5 Palavras
                  </button>
                  <button
                    onClick={() => setIsReviewMode(false)}
                    className="w-full py-3 border-2 border-outline-variant text-secondary rounded-xl font-bold text-xs hover:bg-surface-container-low transition-all"
                  >
                    Voltar ao Glossário
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* standard Dictionary index */
          <div className="space-y-lg">
            
            {/* Top overview stats card */}
            <section className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm">
              <div className="space-y-xs">
                <h2 className="text-2xl font-extrabold text-primary flex items-center gap-xs">
                  <span className="material-symbols-outlined text-3xl">menu_book</span>
                  Dicionário Pessoal
                </h2>
                <p className="text-xs text-secondary leading-relaxed">
                  Tens <strong className="text-on-surface font-bold">{words.length} palavras</strong> guardadas para estudo de repetição espaçada.
                </p>
              </div>

              {words.length > 0 && (
                <button
                  onClick={handleStartReview}
                  className="bg-primary text-white rounded-xl px-lg py-3 font-bold text-xs shadow-[0px_8px_24px_rgba(26,68,173,0.12)] hover:opacity-95 active:scale-95 transition-all flex items-center gap-xs"
                >
                  <span className="material-symbols-outlined text-sm font-bold">local_activity</span>
                  Treinar Memorização (Flipping Cards)
                </button>
              )}
            </section>

            {/* Search filter input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-sm flex items-center pointer-events-none text-secondary">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input
                type="text"
                placeholder="Procurar palavra ou definição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-lg pr-md py-3 rounded-xl border border-outline-variant bg-surface-container-lowest text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Glossary list */}
            {loading ? (
              <div className="text-center p-xl text-xs text-secondary">A carregar vocabulário...</div>
            ) : filteredWords.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                {filteredWords.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-surface-container-lowest p-md rounded-xl border border-outline-variant/35 shadow-sm hover:shadow transition-all relative flex flex-col justify-between"
                  >
                    <button
                      onClick={() => handleDelete(item.word)}
                      className="absolute top-md right-md text-secondary hover:text-error transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
                      title="Remover palavra"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">delete</span>
                    </button>

                    <div className="space-y-sm pr-6">
                      <div className="flex items-center gap-xs flex-wrap">
                        <strong className="text-primary font-extrabold capitalize text-md">
                          {item.word}
                        </strong>
                        <span className="bg-surface-container-high text-secondary px-sm py-0.5 rounded text-[9px] font-bold uppercase">
                          {item.level || 'B1'}
                        </span>
                        <span className="bg-tertiary-fixed-dim/30 text-on-tertiary-fixed-variant px-sm py-0.5 rounded text-[9px] font-bold uppercase">
                          Rev. {item.review_count}
                        </span>
                      </div>
                      
                      <p className="text-xs text-on-surface leading-relaxed font-semibold">
                        {item.definition}
                      </p>
                      
                      {item.example && (
                        <p className="text-[11px] text-secondary italic leading-relaxed bg-surface p-xs rounded border-l-2 border-outline-variant">
                          &quot;{item.example}&quot;
                        </p>
                      )}
                    </div>

                    <div className="mt-md pt-sm border-t border-outline-variant/20 flex items-center justify-between text-[10px] text-secondary font-medium">
                      <span>Adicionada a: {new Date(item.created_at).toLocaleDateString('pt-PT')}</span>
                      <span>Próxima rev: {new Date(item.next_review).toLocaleDateString('pt-PT')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-xl text-center bg-surface-container-lowest border-2 border-dashed border-outline-variant/60 rounded-2xl space-y-xs">
                <span className="material-symbols-outlined text-secondary text-4xl">menu_book</span>
                <p className="text-sm font-bold text-on-surface-variant">Nenhum termo encontrado</p>
                <p className="text-xs text-secondary max-w-[20rem] mx-auto">
                  Tenta refinar os termos da pesquisa, ou entra no currículo e clica duas vezes em qualquer palavra difícil para adicioná-la aqui!
                </p>
              </div>
            )}

            {/* Travel Guide personality card */}
            <div className="p-md rounded-2xl bg-surface-container-low/40 border border-outline-variant/50 flex items-start gap-sm text-xs text-secondary leading-relaxed italic mt-xl">
              <span className="material-symbols-outlined text-primary text-lg shrink-0">explore</span>
              <div>
                <p>
                  <strong>🎒 Conselhos de Viagem:</strong> &quot;Estudos provam que rever termos usando repetição espaçada (Spaced Repetition) duplica a retenção a longo prazo! Tenta praticar as tuas flipping cards 3 vezes por semana.&quot;
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Persistent mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-md rounded-t-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] border-t border-outline-variant/20 md:hidden">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">home</span>
          <span className="text-[10px]">Home</span>
        </button>
        <button 
          onClick={() => router.push(`/curriculum/${level}`)} 
          className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">school</span>
          <span className="text-[10px]">Cursos</span>
        </button>
        <button 
          onClick={() => router.push('/dictionary')} 
          className="flex flex-col items-center justify-center text-primary font-bold relative after:content-[''] after:w-1 after:h-1 after:bg-primary after:rounded-full after:mt-1"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
          <span className="text-[10px]">Dicionário</span>
        </button>
      </nav>
    </div>
  );
}
