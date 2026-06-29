'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService, UserProfile, PersonalDictionaryItem, CompletedLesson } from '@/lib/supabase';

export default function Dashboard() {
  const router = useRouter();
  const { user, profile, refreshProfile, signOut } = useAuth();
  
  const [level, setLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B1');
  const [xp, setXp] = useState(1250);
  const [streak, setStreak] = useState(3);
  const [recentWords, setRecentWords] = useState<PersonalDictionaryItem[]>([]);
  const [completedCount, setCompletedCount] = useState(0);

  // Quick stats calculations
  useEffect(() => {
    if (profile) {
      setLevel(profile.current_level || 'A1');
      setXp(profile.xp || 0);
      setStreak(profile.daily_streak || 0);
    }
  }, [profile]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const dict = await dbService.getPersonalDictionary();
        setRecentWords(dict.slice(0, 3));

        const completed = await dbService.getCompletedLessons();
        // Count how many are in the current level
        const currentLevelCompleted = completed.filter(c => c.level === level);
        setCompletedCount(currentLevelCompleted.length);
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      }
    };
    loadDashboardData();
  }, [level]);

  const handleLevelChange = async (newLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') => {
    setLevel(newLevel);
    try {
      await dbService.updateProfile({ current_level: newLevel });
      await refreshProfile();
    } catch (e) {
      console.error(e);
    }
  };

  // Level specific descriptions matching Cambridge exams
  const levelMetadata = {
    A1: { title: 'Elementar Inicial', exam: 'Pre A1 Starters', prep: 30 },
    A2: { title: 'Elementar Superior', exam: 'A2 Key (KET)', prep: 50 },
    B1: { title: 'Intermédio', exam: 'B1 Preliminary (PET)', prep: 75 },
    B2: { title: 'Intermédio Superior', exam: 'B2 First (FCE)', prep: 60 },
    C1: { title: 'Avançado', exam: 'C1 Advanced (CAE)', prep: 40 },
    C2: { title: 'Proficiente', exam: 'C2 Proficiency (CPE)', prep: 20 },
  };

  const meta = levelMetadata[level] || levelMetadata.B1;

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-lg">
          <button onClick={() => router.push('/dashboard')} className="text-label-md font-bold text-primary">Painel</button>
          <button onClick={() => router.push(`/curriculum/${level}`)} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Currículo</button>
          <button onClick={() => router.push('/dictionary')} className="text-label-md font-medium text-secondary hover:text-primary transition-all">Dicionário</button>
          <div className="h-6 w-px bg-outline-variant mx-xs"></div>
          
          <div className="flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-full border border-outline-variant/30">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span className="text-label-md font-bold text-primary">XP: {xp}</span>
          </div>

          <button onClick={signOut} className="text-xs font-semibold text-secondary hover:text-error transition-all">Sair</button>
        </nav>

        <div className="flex md:hidden items-center gap-sm">
          <div className="flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-full text-xs font-bold text-primary">
            XP: {xp}
          </div>
        </div>
      </header>

      {/* Content canvas */}
      <main className="flex-grow pt-20 pb-24 px-container-margin max-w-5xl mx-auto w-full space-y-lg">
        
        {/* Profile and level header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-md bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm">
          <div className="flex items-center gap-md">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-extrabold shrink-0 border border-primary/20">
              {level}
            </div>
            <div>
              <span className="text-xs text-secondary font-bold uppercase tracking-widest block">Explorador Ativo</span>
              <h2 className="text-xl font-bold text-on-surface flex items-center gap-sm">
                {user?.email || 'explorador@englishpath.com'}
              </h2>
              <p className="text-xs text-secondary">A estudar para objetivos de {profile?.goal_reason || 'Viagens & Carreira'}</p>
            </div>
          </div>

          {/* Level Switcher (Selector) */}
          <div className="flex items-center gap-sm">
            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Alterar Nível:</span>
            <select
              value={level}
              onChange={(e) => handleLevelChange(e.target.value as any)}
              className="bg-white border-2 border-outline-variant text-on-surface rounded-xl px-sm py-xs font-bold text-xs focus:border-primary focus:outline-none"
            >
              <option value="A1">A1 - Elementar</option>
              <option value="A2">A2 - Elementar Superior</option>
              <option value="B1">B1 - Intermédio</option>
              <option value="B2">B2 - Pós-Intermédio</option>
              <option value="C1">C1 - Avançado</option>
              <option value="C2">C2 - Proficiente</option>
            </select>
          </div>
        </section>

        {/* Bento Grid Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-md">
          
          {/* Daily Streak Tracker */}
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">The Daily Path</span>
              <span className="material-symbols-outlined text-accent-warning text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-on-surface block">{streak} Dias</span>
              <p className="text-xs text-secondary mt-1">Pratica pelo menos 10 minutos por dia para manter a tua ofensiva ativa!</p>
            </div>
            <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-accent-warning w-3/4 rounded-full"></div>
            </div>
          </div>

          {/* XP Tracker */}
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">Experiência Acumulada</span>
              <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-on-surface block">{xp} XP</span>
              <p className="text-xs text-secondary mt-1">Somas 100 XP por cada lição resolvida e 250 XP em Milestones.</p>
            </div>
            <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-primary w-2/3 rounded-full"></div>
            </div>
          </div>

          {/* Lessons completed */}
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm flex flex-col justify-between h-48">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-secondary uppercase tracking-widest">Progresso no Nível</span>
              <span className="material-symbols-outlined text-tertiary text-3xl">task_alt</span>
            </div>
            <div>
              <span className="text-4xl font-extrabold text-on-surface block">{completedCount} Aulas</span>
              <p className="text-xs text-secondary mt-1">Aulas concluídas no nível actual. Complete 5 aulas para desbloquear o Milestone Test!</p>
            </div>
            <div className="h-2 bg-outline-variant/30 rounded-full overflow-hidden">
              <div className="h-full bg-tertiary rounded-full" style={{ width: `${Math.min((completedCount / 5) * 100, 100)}%` }}></div>
            </div>
          </div>

        </section>

        {/* Cambridge Alignment Insights & Milestone Tests */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-lg">
          
          {/* Cambridge Insights Card */}
          <div className="md:col-span-8 bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm space-y-md">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-2xl">verified</span>
              <div>
                <h3 className="font-bold text-on-surface">Cambridge Alignment Insights</h3>
                <p className="text-xs text-secondary">A tua preparação projetada para exames oficiais</p>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-lg items-center bg-surface-container-low/50 p-md rounded-xl border border-outline-variant/20">
              <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="56" cy="56" fill="none" r="48" stroke="#e0e3e5" strokeWidth="8"></circle>
                  <circle cx="56" cy="56" fill="none" r="48" stroke="#002d89" strokeDasharray="301.5" strokeDashoffset={301.5 - (301.5 * meta.prep) / 100} strokeWidth="8" className="transition-all duration-1000" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-primary">{meta.prep}%</span>
                  <span className="text-[8px] font-bold text-secondary uppercase">Preparado</span>
                </div>
              </div>

              <div className="space-y-xs text-left">
                <h4 className="font-bold text-on-surface text-sm">Alinhado com o Exame: <span className="text-primary font-extrabold">{meta.exam}</span></h4>
                <p className="text-xs text-secondary leading-relaxed">
                  Com base no teu rendimento atual de leitura, compreensão auditiva e gramática, estás no caminho certo para obter a certificação Cambridge de nível {level}.
                </p>
                <ul className="grid grid-cols-2 gap-xs text-[11px] font-semibold text-secondary">
                  <li className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary text-sm">check_circle</span> Use of English: Forte</li>
                  <li className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary text-sm">check_circle</span> Listening: Médio</li>
                  <li className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary text-sm">check_circle</span> Reading: Forte</li>
                  <li className="flex items-center gap-1"><span className="material-symbols-outlined text-tertiary text-sm">check_circle</span> Speaking: A Treinar</li>
                </ul>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/curriculum/${level}`)} 
              className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs flex items-center justify-center gap-xs shadow hover:opacity-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm font-bold">explore</span>
              Abrir Mapa de Aprendizagem (Curriculum)
            </button>
          </div>

          {/* Level Milestone Gate */}
          <div className="md:col-span-4 bg-primary text-on-primary p-lg rounded-2xl shadow-md flex flex-col justify-between h-full min-h-[300px]">
            <div className="space-y-sm">
              <div className="flex justify-between items-start">
                <span className="bg-white/20 text-white text-[10px] px-sm py-1 rounded-full font-bold uppercase tracking-wider">Milestone Gate</span>
                <span className="material-symbols-outlined text-white text-2xl">military_tech</span>
              </div>
              <h3 className="text-xl font-bold">Porta de Saída {level}</h3>
              <p className="text-xs text-white/80 leading-relaxed">
                Queres provar que dominas o nível {level} e desbloquear o seguinte nível? 
                Faz o teste oficial de Milestone com critérios adaptados de Cambridge.
              </p>
              
              <div className="bg-white/10 p-sm rounded-xl border border-white/10 space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span>Aulas Mínimas</span>
                  <span className="font-bold">{completedCount} de 5 Concluídas</span>
                </div>
                <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full" style={{ width: `${Math.min((completedCount / 5) * 100, 100)}%` }}></div>
                </div>
              </div>
            </div>

            <button
              onClick={() => router.push(`/milestone/${level}`)}
              className="w-full mt-lg bg-white text-primary hover:bg-surface-container py-3 rounded-xl font-bold text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-xs"
            >
              <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
              Prestar Prova de Nível
            </button>
          </div>

        </section>

        {/* Dictionary and personal glossaries snippet */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-lg">
          
          {/* Personal Dictionary Widget */}
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm space-y-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-xl">menu_book</span>
                <h3 className="font-bold text-on-surface text-md">Dicionário Pessoal</h3>
              </div>
              <button 
                onClick={() => router.push('/dictionary')}
                className="text-xs font-bold text-primary hover:underline"
              >
                Ver tudo
              </button>
            </div>
            
            <p className="text-xs text-secondary leading-relaxed">
              Palavras guardadas dos teus exercícios de leitura e audição. Revisa-as com IA!
            </p>

            <div className="space-y-xs pt-xs">
              {recentWords.length > 0 ? (
                recentWords.map((item) => (
                  <div key={item.id} className="p-sm bg-surface rounded-xl border border-outline-variant/30 flex justify-between items-center text-xs">
                    <div>
                      <strong className="text-primary text-sm font-bold capitalize">{item.word}</strong>
                      <span className="text-[10px] text-secondary block line-clamp-1">{item.definition}</span>
                    </div>
                    <span className="px-sm py-0.5 bg-surface-container-high rounded text-[10px] font-bold text-secondary uppercase">
                      {item.level || 'B1'}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-md text-center bg-surface rounded-xl border border-dashed border-outline-variant/80 text-xs text-secondary italic">
                  Ainda não guardaste nenhuma palavra. Clica duas vezes numa palavra nos exercícios de leitura!
                </div>
              )}
            </div>
          </div>

          {/* Travel Tips - Personality of the app */}
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-sm space-y-sm flex flex-col justify-between">
            <div className="space-y-xs">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-primary text-xl">explore</span>
                <h3 className="font-bold text-on-surface text-md">Conselhos do Teu Guia</h3>
              </div>
              
              <div className="p-md bg-tertiary-fixed-dim/15 rounded-xl border border-tertiary/10 text-xs text-secondary space-y-sm leading-relaxed">
                <p>
                  <strong>Dica de Hoje:</strong> &quot;Ao ouvir áudios em inglês, tenta não traduzir palavra por palavra na tua cabeça. Concentra-te nas palavras com ênfase (stress words) - substantivos e verbos principais. Elas contam 80% da história!&quot;
                </p>
                <p className="text-[10px] font-bold text-tertiary">
                  🎒 Rota Recomendada: Pratica Speaking hoje no currículo para desbloquear o teu primeiro marco.
                </p>
              </div>
            </div>

            <button 
              onClick={() => router.push(`/curriculum/${level}`)}
              className="w-full border-2 border-primary text-primary py-2.5 rounded-xl font-bold text-xs hover:bg-primary/5 transition-all"
            >
              Fazer Rota Diária
            </button>
          </div>

        </section>

      </main>

      {/* Persistent mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 w-full z-45 flex justify-around items-center px-4 py-3 bg-surface/90 backdrop-blur-md rounded-t-xl shadow-[0px_-4px_20px_rgba(0,0,0,0.05)] border-t border-outline-variant/20 md:hidden">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="flex flex-col items-center justify-center text-primary font-bold relative after:content-[''] after:w-1 after:h-1 after:bg-primary after:rounded-full after:mt-1"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
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
          className="flex flex-col items-center justify-center text-secondary hover:text-primary transition-all"
        >
          <span className="material-symbols-outlined">menu_book</span>
          <span className="text-[10px]">Dicionário</span>
        </button>
      </nav>
    </div>
  );
}
