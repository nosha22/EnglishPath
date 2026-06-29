'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/supabase';

// Diagnostic questions
interface Question {
  id: number;
  type: 'grammar' | 'vocab' | 'reading' | 'listening' | 'writing';
  skillName: string;
  questionText: string;
  contextText?: string;
  audioText?: string; // used for SpeechSynthesis
  options: string[];
  correctOptionIdx: number;
  explanation: string;
}

const DIAGNOSTIC_QUESTIONS: Question[] = [
  {
    id: 1,
    type: 'grammar',
    skillName: 'Gramática: Present Perfect',
    questionText: 'Escolhe a forma correta do verbo para preencher o espaço:',
    contextText: '"I _____ (see) that movie already, but I would love to watch it again with you."',
    options: ['saw', 'have seen', 'had seed'],
    correctOptionIdx: 1,
    explanation: '"Already" é uma palavra-chave para o Present Perfect (have + past participle) ao descrever uma experiência num tempo indefinido do passado.'
  },
  {
    id: 2,
    type: 'vocab',
    skillName: 'Vocabulário: Phrasal Verbs',
    questionText: 'Qual é o phrasal verb correto para indicar que uma reunião foi cancelada?',
    contextText: '"The corporate meeting was _____ because the CEO had an urgent travel conflict."',
    options: ['called off', 'called out', 'put up'],
    correctOptionIdx: 0,
    explanation: '"Call off" significa cancelar um evento. "Put up" significa tolerar ou alojar.'
  },
  {
    id: 3,
    type: 'reading',
    skillName: 'Compreensão de Leitura',
    questionText: 'Com base no texto abaixo, qual é o principal objetivo do viajante?',
    contextText: '"Although the hotel was distant from the conference hall, Arthur preferred staying there to enjoy the historic surrounding district after his business meetings concluded."',
    options: [
      'Ficar o mais perto possível das reuniões.',
      'Explorar a zona histórica da cidade nas horas vagas.',
      'Aproveitar o serviço de quartos gratuito.'
    ],
    correctOptionIdx: 1,
    explanation: 'O texto diz explicitamente que Arthur preferia ficar no hotel mais distante para "aproveitar o distrito histórico circundante" depois do trabalho.'
  },
  {
    id: 4,
    type: 'listening',
    skillName: 'Compreensão Auditiva',
    questionText: 'Clica em "Ouvir Áudio" e responde: O que deve o passageiro preparar?',
    audioText: 'Welcome to Heathrow Airport. Please stand behind the yellow line and have your passport and boarding pass ready for inspection.',
    options: [
      'Apenas o passaporte.',
      'O passaporte e o cartão de embarque.',
      'O bilhete de identidade nacional.'
    ],
    correctOptionIdx: 1,
    explanation: 'O áudio diz: "have your passport and boarding pass ready" (passaporte e cartão de embarque).'
  },
  {
    id: 5,
    type: 'writing',
    skillName: 'Expressão Escrita: Formalidade',
    questionText: 'Qual das opções reescreve a frase seguinte de forma mais polida/formal para um e-mail profissional?',
    contextText: '"I want to cancel the contract immediately."',
    options: [
      'I demand to drop this contract right now.',
      'I would like to request the immediate termination of our contract.',
      'Please kill our contract as fast as possible.'
    ],
    correctOptionIdx: 1,
    explanation: '"I would like to request..." e "termination" são termos adequados e formais para correspondência corporativa em inglês.'
  }
];

export default function PlacementTest() {
  const router = useRouter();
  const { user, profile, refreshProfile, loginAsDemoUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  
  // Step 1: Goals data
  const [goalReason, setGoalReason] = useState('work');
  const [goalTime, setGoalTime] = useState('15');
  
  // Step 3: Test variables
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState(false);

  // Step 4: Placement result
  const [assignedLevel, setAssignedLevel] = useState<'A2' | 'B1' | 'B2' | 'C1'>('B1');

  // If user is not logged in, auto log in as mock so they can still do the test and save results
  useEffect(() => {
    if (!user) {
      // Lazy auto demo login to facilitate onboarding
      loginAsDemoUser('explorador@englishpath.com');
    }
  }, [user, loginAsDemoUser]);

  // Audio trigger using browser SpeechSynthesis
  const handlePlayAudio = (text: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth.speaking) {
      synth.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB';
    utterance.rate = 0.9; // clear, travel guide voice

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  const handleStartTest = () => {
    setStep(3);
    setCurrentQuestionIdx(0);
    setCorrectAnswersCount(0);
    setSelectedOption(null);
    setShowAnswerFeedback(false);
  };

  const handleSkipTest = async () => {
    // Start from A1
    try {
      await dbService.updateProfile({
        current_level: 'A1',
        goal_reason: goalReason === 'work' ? 'Profissional' : goalReason === 'travel' ? 'Viagens' : 'Social',
        goal_time: `${goalTime} minutos/dia`
      });
      await refreshProfile();
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedOption === null) return;
    
    const isCorrect = selectedOption === DIAGNOSTIC_QUESTIONS[currentQuestionIdx].correctOptionIdx;
    if (isCorrect) {
      setCorrectAnswersCount(prev => prev + 1);
    }
    
    setShowAnswerFeedback(true);
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setShowAnswerFeedback(false);

    if (currentQuestionIdx < DIAGNOSTIC_QUESTIONS.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // Diagnostic complete! Determine Level
      let level: 'A2' | 'B1' | 'B2' | 'C1' = 'B1';
      const score = correctAnswersCount + (selectedOption === DIAGNOSTIC_QUESTIONS[currentQuestionIdx].correctOptionIdx ? 1 : 0);
      
      if (score <= 1) {
        level = 'A2';
      } else if (score === 2 || score === 3) {
        level = 'B1';
      } else if (score === 4) {
        level = 'B2';
      } else {
        level = 'C1';
      }

      setAssignedLevel(level);
      
      try {
        await dbService.updateProfile({
          current_level: level,
          goal_reason: goalReason === 'work' ? 'Profissional' : goalReason === 'travel' ? 'Viagens' : 'Social',
          goal_time: `${goalTime} minutos/dia`
        });
        await refreshProfile();
      } catch (err) {
        console.error(err);
      }
      
      setStep(4);
    }
  };

  const currentQuestion = DIAGNOSTIC_QUESTIONS[currentQuestionIdx];

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Mini Header */}
      <header className="px-container-margin h-16 bg-surface shadow-sm flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
        </div>
        <div className="flex items-center gap-xs px-sm py-1 bg-surface-container-high rounded-full">
          <span className="material-symbols-outlined text-primary text-sm">explore</span>
          <span className="text-label-sm font-bold text-primary">Diário de Onboarding</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center py-xl px-container-margin">
        <div className="max-w-xl w-full bg-surface-container-lowest rounded-2xl p-lg shadow-xl border border-outline-variant/40 space-y-lg">
          
          {/* STEP 1: Survey Goals */}
          {step === 1 && (
            <div className="space-y-lg">
              <div className="text-center space-y-xs">
                <span className="material-symbols-outlined text-primary text-4xl">flight</span>
                <h2 className="text-2xl font-bold text-on-surface">Bem-vindo à tua jornada!</h2>
                <p className="text-sm text-secondary">
                  Como teu guia de viagem, quero preparar a melhor rota para o teu destino.
                </p>
              </div>

              <div className="space-y-md">
                <div className="space-y-sm">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                    Qual é o teu objetivo principal?
                  </label>
                  <div className="grid grid-cols-3 gap-xs">
                    <button
                      type="button"
                      onClick={() => setGoalReason('work')}
                      className={`p-sm rounded-xl border-2 flex flex-col items-center gap-xs text-center transition-all ${
                        goalReason === 'work' ? 'border-primary bg-surface-container-low text-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className="material-symbols-outlined">work</span>
                      <span className="text-xs font-bold">Carreira</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalReason('travel')}
                      className={`p-sm rounded-xl border-2 flex flex-col items-center gap-xs text-center transition-all ${
                        goalReason === 'travel' ? 'border-primary bg-surface-container-low text-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className="material-symbols-outlined">explore</span>
                      <span className="text-xs font-bold">Viagens</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGoalReason('social')}
                      className={`p-sm rounded-xl border-2 flex flex-col items-center gap-xs text-center transition-all ${
                        goalReason === 'social' ? 'border-primary bg-surface-container-low text-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low/50'
                      }`}
                    >
                      <span className="material-symbols-outlined">chat</span>
                      <span className="text-xs font-bold">Social</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-sm">
                  <label className="block text-xs font-bold text-secondary uppercase tracking-wider">
                    Tempo diário de estudo recomendado:
                  </label>
                  <div className="grid grid-cols-3 gap-xs">
                    {[
                      { val: '10', label: 'Hábito Rápido', time: '10 min/dia' },
                      { val: '15', label: 'O Viajante', time: '15 min/dia' },
                      { val: '30', label: 'Intensivo', time: '30 min/dia' }
                    ].map((t) => (
                      <button
                        key={t.val}
                        type="button"
                        onClick={() => setGoalTime(t.val)}
                        className={`p-sm rounded-xl border-2 flex flex-col items-center gap-xs text-center transition-all ${
                          goalTime === t.val ? 'border-primary bg-surface-container-low text-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low/50'
                        }`}
                      >
                        <span className="text-xs font-bold text-on-surface">{t.label}</span>
                        <span className="text-[10px] text-secondary font-medium">{t.time}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setStep(2)}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
              >
                Definir Itinerário
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: Path Choice */}
          {step === 2 && (
            <div className="space-y-lg">
              <div className="text-center space-y-xs">
                <span className="material-symbols-outlined text-primary text-4xl">navigation</span>
                <h2 className="text-2xl font-bold text-on-surface">Onde queres começar?</h2>
                <p className="text-sm text-secondary">
                  Podemos partir do zero para construir bases sólidas ou fazer um diagnóstico rápido.
                </p>
              </div>

              <div className="grid gap-md">
                {/* Placement Diagnostic path */}
                <div 
                  onClick={handleStartTest}
                  className="p-md rounded-2xl border-2 border-primary hover:bg-surface-container-low cursor-pointer transition-all flex items-start gap-md group shadow-sm"
                >
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">assignment</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-on-surface text-sm">Fazer Teste de Diagnóstico</h4>
                    <p className="text-xs text-secondary leading-relaxed">
                      Leva cerca de 5-10 minutos. Avaliamos a tua gramática, vocabulário e compreensão para te colocar no nível certo (A1 a C2).
                    </p>
                  </div>
                </div>

                {/* Start from Zero path */}
                <div 
                  onClick={handleSkipTest}
                  className="p-md rounded-2xl border-2 border-outline-variant hover:border-primary hover:bg-surface-container-low/50 cursor-pointer transition-all flex items-start gap-md group"
                >
                  <div className="w-10 h-10 bg-surface-container-high text-secondary rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined">directions_walk</span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-on-surface text-sm">Começar do Zero (A1)</h4>
                    <p className="text-xs text-secondary leading-relaxed">
                      Ideal para quem está a dar os primeiros passos no inglês ou quer rever toda a base estrutural de forma guiada.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-xs justify-center text-xs text-secondary">
                <span className="material-symbols-outlined text-sm text-primary">security</span>
                <span>Podes alterar o teu nível livremente no dashboard a qualquer momento.</span>
              </div>
            </div>
          )}

          {/* STEP 3: Test Questions */}
          {step === 3 && (
            <div className="space-y-lg">
              {/* Test Header */}
              <div className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-xs">
                <span className="font-bold text-primary">{currentQuestion.skillName}</span>
                <span className="text-secondary font-semibold">
                  Questão {currentQuestionIdx + 1} de {DIAGNOSTIC_QUESTIONS.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / DIAGNOSTIC_QUESTIONS.length) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <div className="space-y-md">
                <p className="font-bold text-on-surface text-md">
                  {currentQuestion.questionText}
                </p>

                {/* Subtitle / Context box */}
                {currentQuestion.contextText && (
                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/40 italic">
                    {currentQuestion.contextText}
                  </div>
                )}

                {/* Audio Listening Player mock */}
                {currentQuestion.audioText && (
                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-sm">
                      <span className="material-symbols-outlined text-primary text-2xl">hearing</span>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Ficheiro de Áudio Heathrow</p>
                        <p className="text-[10px] text-secondary">Sotaque Britânico (UK)</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlayAudio(currentQuestion.audioText!)}
                      disabled={isPlayingAudio}
                      className={`px-sm py-xs rounded-lg font-bold text-xs flex items-center gap-xs shadow active:scale-95 transition-all ${
                        isPlayingAudio ? 'bg-secondary text-white' : 'bg-primary text-white hover:opacity-90'
                      }`}
                    >
                      <span className="material-symbols-outlined text-sm">
                        {isPlayingAudio ? 'hourglass_empty' : 'play_arrow'}
                      </span>
                      {isPlayingAudio ? 'A reproduzir...' : 'Ouvir Áudio'}
                    </button>
                  </div>
                )}

                {/* Options Grid */}
                <div className="grid gap-sm pt-xs">
                  {currentQuestion.options.map((opt, idx) => {
                    const isSelected = selectedOption === idx;
                    let borderClass = 'border-outline-variant hover:border-primary-container';
                    let bgClass = 'bg-white hover:bg-surface-container-low';
                    
                    if (showAnswerFeedback) {
                      const isCorrect = idx === currentQuestion.correctOptionIdx;
                      if (isCorrect) {
                        borderClass = 'border-tertiary ring-2 ring-tertiary';
                        bgClass = 'bg-tertiary-fixed/20';
                      } else if (isSelected) {
                        borderClass = 'border-error ring-2 ring-error';
                        bgClass = 'bg-error-container/20';
                      } else {
                        bgClass = 'opacity-50';
                      }
                    } else if (isSelected) {
                      borderClass = 'border-primary ring-2 ring-primary';
                      bgClass = 'bg-surface-container';
                    }

                    return (
                      <button
                        key={idx}
                        disabled={showAnswerFeedback}
                        onClick={() => setSelectedOption(idx)}
                        className={`p-md rounded-xl border flex items-center text-left transition-all ${borderClass} ${bgClass}`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-secondary text-xs mr-sm">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-sm font-semibold text-on-surface">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback Explanation */}
              {showAnswerFeedback && (
                <div className="p-md rounded-xl bg-surface-container-low border border-dashed border-outline-variant space-y-1">
                  <p className="text-xs font-bold text-primary flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    Explicação Teórica
                  </p>
                  <p className="text-xs text-secondary leading-relaxed">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}

              {/* Step Navigation Button */}
              <div>
                {!showAnswerFeedback ? (
                  <button
                    onClick={handleAnswerSubmit}
                    disabled={selectedOption === null}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Confirmar Resposta
                  </button>
                ) : (
                  <button
                    onClick={handleNextQuestion}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
                  >
                    {currentQuestionIdx < DIAGNOSTIC_QUESTIONS.length - 1 ? 'Seguinte Questão' : 'Ver Resultados'}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: Test Results */}
          {step === 4 && (
            <div className="space-y-lg text-center">
              <div className="space-y-xs">
                <span className="material-symbols-outlined text-tertiary text-5xl bg-tertiary-fixed/30 rounded-full p-sm animate-bounce">celebration</span>
                <h2 className="text-2xl font-bold text-on-surface">Diagnóstico Concluído!</h2>
                <p className="text-sm text-secondary">
                  Avaliámos as tuas respostas com base na grelha CEFR e no rigor Cambridge.
                </p>
              </div>

              <div className="p-lg bg-surface-container-low rounded-2xl border-2 border-primary space-y-md">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-secondary block">Foste colocado em:</span>
                  <span className="text-5xl font-extrabold text-primary block mt-1">LEVEL {assignedLevel}</span>
                  <span className="text-xs font-bold text-tertiary uppercase tracking-wider block mt-1">
                    {assignedLevel === 'A2' ? 'Elementar Superior' : assignedLevel === 'B1' ? 'Intermédio' : assignedLevel === 'B2' ? 'Pós-Intermédio' : 'Avançado'}
                  </span>
                </div>

                <div className="h-px bg-outline-variant/65"></div>

                <div className="grid grid-cols-2 gap-sm text-left">
                  <div className="p-sm bg-white rounded-xl">
                    <span className="text-[10px] text-secondary font-semibold uppercase">Pontuação</span>
                    <span className="block font-bold text-on-surface text-sm">{correctAnswersCount} / {DIAGNOSTIC_QUESTIONS.length} Certas</span>
                  </div>
                  <div className="p-sm bg-white rounded-xl">
                    <span className="text-[10px] text-secondary font-semibold uppercase">Exame Alinhado</span>
                    <span className="block font-bold text-on-surface text-sm">
                      {assignedLevel === 'A2' ? 'Key (KET)' : assignedLevel === 'B1' ? 'Preliminary (PET)' : assignedLevel === 'B2' ? 'First (FCE)' : 'Advanced (CAE)'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-md rounded-xl bg-surface-container/60 border border-outline-variant/80 text-left flex items-start gap-xs text-xs text-secondary italic">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">explore</span>
                <div>
                  <h5 className="font-bold text-on-surface not-italic">Mensagem do Guia de Viagem:</h5>
                  <p className="mt-0.5">
                    &quot;O teu caminho está traçado! Este nível oferece o equilíbrio perfeito: desafia as tuas fraquezas sem te desanimar. Errar faz parte da viagem. Vamos começar a praticar!&quot;
                  </p>
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow-[0px_8px_24px_rgba(26,68,173,0.12)] hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
              >
                Iniciar Viagem
                <span className="material-symbols-outlined text-sm">explore</span>
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
