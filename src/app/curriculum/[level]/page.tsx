'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService, CompletedLesson } from '@/lib/supabase';

interface Lesson {
  id: string;
  title: string;
  description: string;
  durationMin: number;
  imageIndex: number; // to show different visual styles
}

interface Module {
  id: string;
  icon: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

const MODULES_DATA: Record<string, Module[]> = {
  default: [
    {
      id: 'listening',
      icon: 'hearing',
      title: 'Listening Mastery',
      description: 'Desenvolve a tua capacidade de compreender sotaques e contextos práticos.',
      lessons: [
        { id: 'list-1', title: 'Professional Introductions', description: 'Aprende a decifrar cumprimentos corporativos e apresentações numa reunião de negócios.', durationMin: 10, imageIndex: 1 },
        { id: 'list-2', title: 'Social Nuances in Public', description: 'Descodifica ironias, pedidos indiretos e dicas de conversação em ambientes barulhentos.', durationMin: 12, imageIndex: 2 },
        { id: 'list-3', title: 'Negotiation Tactics', description: 'Técnicas de escuta ativa para detetar interesses e prioridades em reuniões formais.', durationMin: 15, imageIndex: 3 },
        { id: 'list-4', title: 'Airport Announcements', description: 'Treina o teu ouvido para anúncios e indicações essenciais de viagem em aeroportos.', durationMin: 10, imageIndex: 4 },
        { id: 'list-5', title: 'Interactive Podcast Audit', description: 'Rever conversas reais com exercícios rápidos de preenchimento de espaços.', durationMin: 10, imageIndex: 5 },
      ]
    },
    {
      id: 'speaking',
      icon: 'record_voice_over',
      title: 'Speaking Fluency',
      description: 'Grava a tua pronúncia com a API de Voz e treina falar sem medos.',
      lessons: [
        { id: 'speak-1', title: 'Describing Your Role', description: 'Treina descrever as tuas responsabilidades diárias no trabalho com vocabulário exato.', durationMin: 10, imageIndex: 3 },
        { id: 'speak-2', title: 'Handling Objections', description: 'Pratica frases formais e polidas para resolver desacordos em chamadas profissionais.', durationMin: 15, imageIndex: 4 },
        { id: 'speak-3', title: 'Travel Check-In Simulation', description: 'Grava frases para alfândega, reservas de hotel e pedidos de direções.', durationMin: 10, imageIndex: 1 },
        { id: 'speak-4', title: 'Spontaneous Pitches', description: 'Aprende a fazer uma pequena apresentação (pitch) de 1 minuto.', durationMin: 10, imageIndex: 2 },
      ]
    },
    {
      id: 'reading',
      icon: 'menu_book',
      title: 'Reading Interpretation',
      description: 'Lê textos alinhados com Cambridge e descobre vocabulário no dicionário.',
      lessons: [
        { id: 'read-1', title: 'Corporate Report Analysis', description: 'Lê relatórios executivos, correspondendo títulos a parágrafos.', durationMin: 12, imageIndex: 5 },
        { id: 'read-2', title: 'Travel Itinerary Review', description: 'Decifra horários, restrições e guias turísticos reais em inglês.', durationMin: 10, imageIndex: 2 },
        { id: 'read-3', title: 'Academic Essay Basics', description: 'Análise de ensaios e vocabulário formal avançado.', durationMin: 15, imageIndex: 1 },
      ]
    },
    {
      id: 'writing',
      icon: 'edit_note',
      title: 'Writing Precision',
      description: 'Escreve pequenos textos e recebe correções detalhadas de IA.',
      lessons: [
        { id: 'write-1', title: 'Formal Business E-mails', description: 'Escreve um e-mail a solicitar reagendamento de uma reunião ou proposta comercial.', durationMin: 15, imageIndex: 4 },
        { id: 'write-2', title: 'Short Travel Essay', description: 'Descreve as tuas férias ideais focando em coesão e vocabulário descritivo.', durationMin: 15, imageIndex: 3 },
        { id: 'write-3', title: 'Cambridge Model Essays', description: 'Estruturação de ensaios formais e uso de conectores avançados.', durationMin: 20, imageIndex: 1 },
      ]
    },
    {
      id: 'grammar',
      icon: 'extension',
      title: 'Grammar & Vocab (Use of English)',
      description: 'Exercícios de correspondência e spaced-repetition flashcards.',
      lessons: [
        { id: 'gram-1', title: 'Present Perfect vs Past Simple', description: 'Domina de vez a diferença entre tempos passados com flashcards e gap fills.', durationMin: 10, imageIndex: 2 },
        { id: 'gram-2', title: 'Conditional Sentences (Ifs)', description: 'Treina as condicionais tipo 0, 1, 2 e 3 com exercícios de arrastar e largar.', durationMin: 12, imageIndex: 1 },
        { id: 'gram-3', title: 'Phonetic Symbols & Accents', description: 'Explora pronúncia correta de palavras de som semelhante (homófonos).', durationMin: 10, imageIndex: 5 },
      ]
    }
  ]
};

export default function LevelCurriculum() {
  const router = useRouter();
  const params = useParams();
  const { user, profile } = useAuth();
  
  const rawLevel = params.level as string;
  const level = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(rawLevel) ? (rawLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') : 'B1';
  
  const [activeModuleId, setActiveModuleId] = useState('listening');
  const [completedLessons, setCompletedLessons] = useState<CompletedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const completed = await dbService.getCompletedLessons();
        setCompletedLessons(completed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProgress();
  }, []);

  const modules = MODULES_DATA.default;
  const activeModule = modules.find(m => m.id === activeModuleId) || modules[0];

  // Helper to determine status of a lesson
  const getLessonStatus = (moduleId: string, lessonId: string, idx: number): 'completed' | 'active' | 'locked' => {
    // Check if it is completed
    const isCompleted = completedLessons.some(
      c => c.level === level && c.module_id === moduleId && c.lesson_id === lessonId
    );
    if (isCompleted) return 'completed';

    // If it is the first lesson, it is active
    if (idx === 0) return 'active';

    // Otherwise, check if the previous lesson in the module was completed
    const prevLesson = activeModule.lessons[idx - 1];
    if (prevLesson) {
      const isPrevCompleted = completedLessons.some(
        c => c.level === level && c.module_id === moduleId && c.lesson_id === prevLesson.id
      );
      if (isPrevCompleted) return 'active';
    }

    return 'locked';
  };

  const getModuleProgress = (moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return { count: 0, percent: 0, total: 0 };
    
    const total = mod.lessons.length;
    const completed = completedLessons.filter(
      c => c.level === level && c.module_id === moduleId
    ).length;
    
    return {
      count: completed,
      total,
      percent: Math.round((completed / total) * 100)
    };
  };

  const placeholderImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBg9LRlJsbPPXR-upUAn7IiExtyd1JX2qZ7v0jBAZo8H2h2mUE0ObQTaYq4PcTPm1xKknG-EIGy5SI3Jcd-A-TX828Gn4XZPlcE8fbfag2_i57Vg1cg5UsvECt88IBlcmJUR2NzTXXZ7CZp0_eFF4nDup5PRhCCFz16W8_kEOT8f1Wcurbt4WyIhPUKWFiRVREyDfcU4_tnKEuBWeO6Pu_etvMh8Z-7_UXwz_FD27g49OEclwZHTacUXyqwtgyQflHYz4_wRrBbxV8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDs3L7UaRJZRjl1aHlQ2vLi0MoTtfIgaY1Uu3Phg8mAttSdA1_isq5m7rTEpsHTS1C_1rnL3zosO0kIQYJ2F0j7WWojP8xkF6KTOSZedIYRKmsW3fSAyykFw3Bx3p2Yek2Em9NSnv0q8M51i59dv1Kl4Z6SGO5BKXdf6elhnUudc3Y2qEwrwZSlnJS0tkhifw8oOhbOSAtgeDV4RBnnErE-eVLUcJz0OiVEFPipDI4x_sAU2gK4nGSjwwO4qkgf0WIZrBBlkNcjtdg',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAl5YwPN_gOp8PdRIaFg2c67WteMsWBh_HzX3gjqTF9_r-hCottqLqUjOmQKH_WJr56zHGHzmoxQk7Sy1W_TNOrxX9h5phuYuNIIBU7T7Oo4Mo5MlEUEgQlxQXdo6IPdTQKTDdtNEZHRDb2jYY0mzNiEBtWcC4mscdBLG7Tw8tamFm9x2aNVBGBsDrRxAlXaCKIugWVz9xQde0NiSLJRUj8B9l8vJmN-JMpOA43mXglhiu0rp5RfRhF8QlotXQwZZQHXpB79KGj1K0',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAnlxHZuL0c4WrMeifYkcqOnd6GGlGbFpJhCF5h6fAiaqvZKvAYJtMcbA1uc6zDrn_q0k6vPqAIEI_1imQr-Te3xOMtfWXjyDDMsFp0UkqhgdCmOjt5l1cqBxQWz6uL0Z8WDHuU-8v7scnvKl69SX5fsJrdIwWtapAZtuj4gAdsk5mmI_Z0pgqgRJCwBxtXHi6eyXOk1gAS0404gY2zcdN16lAPve_Yq9Z8iZO9Rsv6K_W142Vg9x6dZXdnbEaZRLpAuhoQjrD3ta8',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuBEx4ippBePHnmcHqVjACAdzTR3XNrX9TsE3kP0ndfSCeKbXHEt4IYqrVtxUwg6fr77W7kXEXVxCJe1KHJygXpQnroLw_uWx6w2odfq-EZu-S28tZ5ooP4Tp_UimO3dTxbO_4q5UnReepgxSsBEF6-MIt3Cw-4HcCVRK4L0J58lJtDHAeAOBKAU2120WrZ39njHSuPJSeUo6YntURr2sYKRNSxIqL_A6YplvG5zd-wEuCA-O1MruUNNtIY9grrEnIB9Rm9tQolGIVs'
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-45 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/dashboard')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
          <div className="ml-md px-sm py-0.5 bg-primary-container text-white rounded font-bold text-[10px] uppercase">
            Nível {level}
          </div>
        </div>
        
        <nav className="hidden md:flex items-center gap-lg">
          <button onClick={() => router.push('/dashboard')} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Painel</button>
          <button onClick={() => router.push(`/curriculum/${level}`)} className="text-label-md font-bold text-primary">Currículo</button>
          <button onClick={() => router.push('/dictionary')} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Dicionário</button>
          <div className="h-6 w-px bg-outline-variant mx-xs"></div>
          
          <div className="flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-full border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-label-md font-bold text-primary">XP: {profile?.xp || 0}</span>
          </div>
        </nav>
      </header>

      {/* Main curriculum grid layout */}
      <main className="flex-grow pt-20 pb-32 px-container-margin max-w-7xl mx-auto grid grid-cols-12 gap-lg w-full">
        
        {/* Left Sidebar: Modules List */}
        <aside className="col-span-12 lg:col-span-4 xl:col-span-3 flex flex-col gap-md">
          <div className="flex flex-col gap-xs mb-sm">
            <h2 className="text-headline-md font-bold text-on-surface">Currículo</h2>
            <p className="text-xs text-secondary font-medium uppercase tracking-wider">
              {level === 'A1' || level === 'A2' ? 'Básico / Elementar' : level === 'B1' || level === 'B2' ? 'Independente' : 'Proficiente Avançado'} • {level}
            </p>
          </div>

          <div className="flex flex-col gap-sm overflow-y-auto custom-scrollbar pr-1">
            {modules.map((mod) => {
              const isActive = mod.id === activeModuleId;
              const progress = getModuleProgress(mod.id);
              
              return (
                <button
                  key={mod.id}
                  onClick={() => setActiveModuleId(mod.id)}
                  className={`flex flex-col gap-xs p-md rounded-xl transition-all duration-200 text-left border-l-4 ${
                    isActive 
                      ? 'border-primary bg-surface-container shadow-sm' 
                      : 'border-transparent bg-surface-container-lowest hover:border-outline-variant hover:bg-surface-container-low shadow-[0px_4px_20px_rgba(0,0,0,0.05)]'
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-xs">
                      <span className={`material-symbols-outlined ${isActive ? 'text-primary' : 'text-secondary'}`}>
                        {mod.icon}
                      </span>
                      <span className={`text-xs font-bold ${isActive ? 'text-primary' : 'text-on-surface'}`}>
                        {mod.title.split(' ')[0]}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold text-secondary">
                      {progress.count}/{progress.total} Aulas
                    </span>
                  </div>
                  <div className="w-full bg-outline-variant/30 h-1.5 rounded-full overflow-hidden mt-xs">
                    <div 
                      className={`h-full rounded-full ${progress.percent === 100 ? 'bg-tertiary-container' : 'bg-primary'}`}
                      style={{ width: `${progress.percent}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Level Milestone CTA Box */}
          <div className="mt-md p-md rounded-xl bg-primary-container text-white flex flex-col gap-sm relative overflow-hidden shadow">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
            <div className="relative z-10 space-y-1">
              <h4 className="font-bold text-sm leading-tight">Porta de Saída {level}</h4>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Pronto para provar as tuas competências Cambridge e passar ao nível seguinte?
              </p>
              <button 
                onClick={() => router.push(`/milestone/${level}`)}
                className="w-full mt-sm bg-white text-primary hover:bg-surface-container py-2 rounded-lg font-bold text-xs transition-all shadow"
              >
                Prestar Exame Milestone
              </button>
            </div>
          </div>
        </aside>

        {/* Right Content Area: Active Module and Lessons list */}
        <section className="col-span-12 lg:col-span-8 xl:col-span-9 flex flex-col gap-lg">
          
          {/* Module description banner */}
          <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-outline-variant/30 pb-md gap-sm">
            <div className="space-y-xs">
              <h1 className="text-3xl font-extrabold text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined text-3xl">{activeModule.icon}</span>
                {activeModule.title}
              </h1>
              <p className="text-sm text-secondary leading-relaxed">{activeModule.description}</p>
            </div>
            <div className="flex gap-xs">
              <span className="px-sm py-1 rounded-full bg-surface-container-high text-primary font-bold text-[10px] uppercase">
                Módulo Ativo
              </span>
              <span className="px-sm py-1 rounded-full border border-outline text-secondary font-bold text-[10px] uppercase">
                QECR {level}
              </span>
            </div>
          </div>

          {/* Lessons list grid */}
          {loading ? (
            <div className="p-xl text-center text-xs text-secondary">A carregar o itinerário...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
              {activeModule.lessons.map((lesson, idx) => {
                const status = getLessonStatus(activeModule.id, lesson.id, idx);
                const isCompleted = status === 'completed';
                const isActive = status === 'active';
                const isLocked = status === 'locked';

                let borderClass = 'border-outline-variant/40 opacity-70';
                let shadowClass = 'shadow-sm';
                let badge = null;

                if (isCompleted) {
                  borderClass = 'border-tertiary-container ring-1 ring-tertiary-container/30';
                  badge = (
                    <span className="absolute top-md right-md bg-tertiary text-white rounded-full p-0.5 text-xs material-symbols-outlined font-bold">
                      check
                    </span>
                  );
                } else if (isActive) {
                  borderClass = 'border-primary ring-2 ring-primary/40';
                  shadowClass = 'shadow-md scale-[1.02]';
                  badge = (
                    <span className="absolute top-md right-md bg-primary text-white text-[9px] px-sm py-0.5 rounded font-bold uppercase tracking-wider">
                      Próxima Aula
                    </span>
                  );
                }

                return (
                  <div
                    key={lesson.id}
                    className={`bg-surface-container-lowest p-md rounded-2xl border flex flex-col justify-between relative transition-all duration-300 ${borderClass} ${shadowClass}`}
                  >
                    {badge}

                    <div className="space-y-md w-full">
                      {/* Image header */}
                      {isLocked ? (
                        <div className="h-32 rounded-xl bg-surface-container-low flex items-center justify-center border border-dashed border-outline-variant/60">
                          <span className="material-symbols-outlined text-secondary text-4xl">lock</span>
                        </div>
                      ) : (
                        <div className="h-32 rounded-xl overflow-hidden relative border border-outline-variant/20 shadow-inner">
                          <img 
                            className="w-full h-full object-cover" 
                            src={placeholderImages[lesson.imageIndex % placeholderImages.length]} 
                            alt={lesson.title}
                          />
                          {isActive && (
                            <div className="absolute inset-0 bg-primary/20 backdrop-blur-[1px] flex items-center justify-center cursor-pointer" onClick={() => router.push(`/exercise/${lesson.id}`)}>
                              <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                play_circle
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Info text */}
                      <div className="space-y-xs">
                        <h4 className={`font-bold text-sm ${isLocked ? 'text-secondary' : 'text-on-surface'}`}>
                          {lesson.title}
                        </h4>
                        <p className="text-xs text-secondary leading-relaxed line-clamp-2">
                          {lesson.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-md pt-sm border-t border-outline-variant/20 w-full flex items-center justify-between">
                      <span className="text-[10px] font-bold text-secondary flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">schedule</span>
                        {lesson.durationMin} min
                      </span>
                      
                      {isCompleted && (
                        <button
                          onClick={() => router.push(`/exercise/${lesson.id}`)}
                          className="text-primary font-bold text-xs flex items-center gap-xs hover:underline"
                        >
                          Rever
                          <span className="material-symbols-outlined text-xs">replay</span>
                        </button>
                      )}
                      
                      {isActive && (
                        <button
                          onClick={() => router.push(`/exercise/${lesson.id}`)}
                          className="bg-primary text-white text-[10px] px-sm py-1.5 rounded-lg font-bold hover:opacity-90 transition-all flex items-center gap-xs"
                        >
                          Iniciar Aula
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      )}

                      {isLocked && (
                        <span className="text-[10px] text-secondary font-medium italic">
                          Bloqueada
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Encourage tip banner */}
          <div className="p-md rounded-2xl bg-surface-container-low/40 border border-outline-variant/60 flex items-start gap-sm text-xs text-secondary leading-relaxed italic">
            <span className="material-symbols-outlined text-primary text-lg shrink-0">explore</span>
            <div>
              <p>
                <strong>Dica do Guia de Viagem:</strong> &quot;O teu caminho faz-se caminhando. Se sentires dificuldade em Speaking, revê a aula de Listening correspondente. Ouvir e articular estão intimamente ligados na neurociência da linguagem!&quot;
              </p>
            </div>
          </div>

        </section>

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
          className="flex flex-col items-center justify-center text-primary font-bold relative after:content-[''] after:w-1 after:h-1 after:bg-primary after:rounded-full after:mt-1"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
          <span className="text-[10px]">Cursos</span>
        </button>
        <button 
          onClick={() => router.push('/dictionary')} 
          className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px]">Dicionário</span>
        </button>
      </nav>
    </div>
  );
}
