'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/supabase';

// Multi-skill questions
interface MilestoneQuestion {
  id: number;
  skill: 'Use of English' | 'Reading' | 'Listening' | 'Speaking' | 'Writing';
  title: string;
  instruction: string;
  contextText?: string;
  audioText?: string; // used for SpeechSynthesis
  options?: string[];
  correctOptionIdx?: number;
  speechTextToMatch?: string; // used for speech-to-text comparison
  minWordsRequired?: number; // used for writing
}

const MILESTONE_TESTS: Record<string, MilestoneQuestion[]> = {
  default: [
    {
      id: 1,
      skill: 'Use of English',
      title: 'Gramática e Estrutura',
      instruction: 'Escolhe a melhor opção para reescrever a frase mantendo o mesmo significado:',
      contextText: '"They built this bridge in 1980."',
      options: [
        'This bridge was built by them in 1980.',
        'This bridge was builded in 1980.',
        'The bridge has been built by 1980.'
      ],
      correctOptionIdx: 0
    },
    {
      id: 2,
      skill: 'Reading',
      title: 'Leitura Compreensiva',
      instruction: 'Com base no texto corporativo, assinale a opção correta:',
      contextText: '"Project Voyager has been delayed by two weeks due to supply chain complications. The launch is rescheduled for November 15th. All teams must submit updated reports by Friday."',
      options: [
        'O atraso foi provocado por falhas na equipa.',
        'O lançamento foi adiado para meados de Novembro.',
        'Os relatórios finais devem ser entregues no dia do lançamento.'
      ],
      correctOptionIdx: 1
    },
    {
      id: 3,
      skill: 'Listening',
      title: 'Compreensão Auditiva',
      instruction: 'Clica em "Ouvir Mensagem" e responde: Qual é a porta de embarque para Lisboa?',
      audioText: 'Attention passengers for flight EP204 to Lisbon. The boarding gate has been changed to gate number seventeen. Boarding starts in ten minutes.',
      options: [
        'Porta 10.',
        'Porta 17.',
        'Porta 70.'
      ],
      correctOptionIdx: 1
    },
    {
      id: 4,
      skill: 'Speaking',
      title: 'Expressão Oral',
      instruction: 'Clica no microfone e lê a seguinte frase com clareza:',
      speechTextToMatch: 'I would like to confirm my reservation for tomorrow morning.'
    },
    {
      id: 5,
      skill: 'Writing',
      title: 'Expressão Escrita',
      instruction: 'Escreve um e-mail de resposta profissional a confirmar uma reunião com um cliente (mínimo 30 palavras):',
      contextText: 'Dica: Inclui uma saudação (ex: "Dear Mr. Smith"), o motivo ("I confirm our meeting") e um encerramento ("Best regards").',
      minWordsRequired: 30
    }
  ]
};

export default function MilestoneTest() {
  const router = useRouter();
  const params = useParams();
  const { profile, refreshProfile } = useAuth();
  
  const rawLevel = params.level as string;
  const level = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(rawLevel) ? (rawLevel as 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2') : 'B1';

  const [step, setStep] = useState<'intro' | 'test' | 'results'>('intro');
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [questions, setQuestions] = useState<MilestoneQuestion[]>([]);
  
  // Scoring
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  // Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Speech Recognition states
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechAccuracy, setSpeechAccuracy] = useState<number | null>(null);

  // Writing states
  const [writingText, setWritingText] = useState('');

  useEffect(() => {
    setQuestions(MILESTONE_TESTS.default);
  }, [level]);

  // Audio Playback
  const handlePlayAudio = (text: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 0.95;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  // Speech Recognition Web API wrapper
  const handleStartRecording = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('A API de Reconhecimento de Voz não é suportada neste browser. Pode digitar a frase para avançar.');
      // Fallback: input prompt
      const text = prompt('Digite a frase que leu:');
      if (text) {
        setSpeechTranscript(text);
        evaluateSpeech(text);
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechTranscript('');
      setSpeechAccuracy(null);
    };

    recognition.onresult = (event: any) => {
      const resultText = event.results[0][0].transcript;
      setSpeechTranscript(resultText);
      evaluateSpeech(resultText);
    };

    recognition.onerror = (event: any) => {
      console.error(event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const evaluateSpeech = (transcript: string) => {
    const target = questions[currentQuestionIdx].speechTextToMatch || '';
    const cleanTarget = target.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanTranscript = transcript.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    const targetWords = cleanTarget.split(/\s+/);
    const transcriptWords = cleanTranscript.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(w => {
      if (transcriptWords.includes(w)) matches++;
    });

    const accuracy = Math.round((matches / targetWords.length) * 100);
    setSpeechAccuracy(accuracy);
    setAnswers(prev => ({ ...prev, [currentQuestionIdx]: { text: transcript, accuracy } }));
  };

  // Writing eval helper
  const handleWritingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setWritingText(val);
    setAnswers(prev => ({ ...prev, [currentQuestionIdx]: val }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
      // Reset visual states
      setSpeechTranscript('');
      setSpeechAccuracy(null);
    } else {
      // Evaluate test results
      evaluateTest();
    }
  };

  const evaluateTest = async () => {
    let correctCount = 0;

    questions.forEach((q, idx) => {
      const answerVal = answers[idx];

      if (q.skill === 'Use of English' || q.skill === 'Reading' || q.skill === 'Listening') {
        if (answerVal === q.correctOptionIdx) {
          correctCount++;
        }
      } else if (q.skill === 'Speaking') {
        if (answerVal && answerVal.accuracy >= 70) {
          correctCount++;
        }
      } else if (q.skill === 'Writing') {
        // Evaluate writing criteria (word count > minWords && must include greetings)
        const wordCount = (answerVal || '').trim().split(/\s+/).filter(Boolean).length;
        const textLower = (answerVal || '').toLowerCase();
        const hasGreeting = textLower.includes('dear') || textLower.includes('hello') || textLower.includes('hi');
        const hasSignoff = textLower.includes('regards') || textLower.includes('sincerely') || textLower.includes('thanks');
        
        if (wordCount >= (q.minWordsRequired || 30) && (hasGreeting || hasSignoff)) {
          correctCount++;
        }
      }
    });

    const scorePct = Math.round((correctCount / questions.length) * 100);
    const isPassed = scorePct >= 70; // 4 or 5 correct

    setScore(scorePct);
    setPassed(isPassed);

    if (isPassed) {
      // Unlock next level
      const levelsOrder: ('A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2')[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentIdx = levelsOrder.indexOf(level);
      const nextLevel = currentIdx < levelsOrder.length - 1 ? levelsOrder[currentIdx + 1] : level;

      try {
        await dbService.updateProfile({
          current_level: nextLevel,
          xp: (profile?.xp || 0) + 250 // bonus XP for passing milestone!
        });
        await refreshProfile();
      } catch (err) {
        console.error(err);
      }
    }

    setStep('results');
  };

  const currentQuestion = questions[currentQuestionIdx];

  // Helper to determine next level string
  const getNextLevel = () => {
    const levelsOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const idx = levelsOrder.indexOf(level);
    return idx < levelsOrder.length - 1 ? levelsOrder[idx + 1] : level;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Header */}
      <header className="px-container-margin h-16 bg-surface shadow-sm flex items-center justify-between border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/dashboard')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
          <div className="ml-md px-sm py-0.5 bg-tertiary-container text-white rounded font-bold text-[10px] uppercase">
            Milestone {level}
          </div>
        </div>
        <button 
          onClick={() => router.push('/dashboard')}
          className="text-xs font-bold text-secondary hover:text-on-surface"
        >
          Abandonar Exame
        </button>
      </header>

      <main className="flex-grow flex items-center justify-center py-xl px-container-margin">
        <div className="max-w-2xl w-full bg-surface-container-lowest rounded-2xl p-lg shadow-xl border border-outline-variant/40 space-y-lg">
          
          {/* INTRO STEP */}
          {step === 'intro' && (
            <div className="space-y-lg text-center">
              <div className="space-y-xs">
                <span className="material-symbols-outlined text-primary text-5xl bg-primary-container/10 p-sm rounded-full animate-pulse">verified_user</span>
                <h2 className="text-2xl font-extrabold text-on-surface">Prova Modelo de Saída: Nível {level}</h2>
                <p className="text-sm text-secondary leading-relaxed">
                  Este teste simula a avaliação e o rigor científico dos exames Cambridge.
                  Precisas de uma pontuação mínima de <strong className="text-primary font-bold">70% (4 de 5 competências)</strong> para desbloquear o nível {getNextLevel()}.
                </p>
              </div>

              <div className="p-md bg-surface-container-low rounded-xl border border-outline-variant/30 text-left space-y-sm">
                <h4 className="font-bold text-xs text-on-surface uppercase tracking-wider">Regras do Exame:</h4>
                <ul className="space-y-xs text-xs text-secondary">
                  <li className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary text-sm">check_circle</span> 5 perguntas cobrindo Gramática, Leitura, Audição, Fala e Escrita.</li>
                  <li className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary text-sm">mic</span> Requer microfone ativado para a secção de Speaking.</li>
                  <li className="flex items-center gap-xs"><span className="material-symbols-outlined text-primary text-sm">spellcheck</span> A secção de escrita exige cumprimento de regras formais de Cambridge.</li>
                </ul>
              </div>

              <button
                onClick={() => setStep('test')}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-sm font-bold">lock_open</span>
                Iniciar Prova de Nível
              </button>
            </div>
          )}

          {/* TESTING STEP */}
          {step === 'test' && currentQuestion && (
            <div className="space-y-lg">
              {/* Progress and Skill Indicator */}
              <div className="flex justify-between items-center text-sm border-b border-outline-variant/30 pb-xs">
                <div className="flex items-center gap-xs">
                  <span className="bg-primary/10 text-primary px-sm py-0.5 rounded font-bold text-xs uppercase">
                    {currentQuestion.skill}
                  </span>
                  <span className="font-bold text-on-surface text-xs">{currentQuestion.title}</span>
                </div>
                <span className="text-secondary font-bold">
                  Competência {currentQuestionIdx + 1} de {questions.length}
                </span>
              </div>

              <div className="h-2 w-full bg-surface-container-low rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${((currentQuestionIdx + 1) / questions.length) * 100}%` }}
                ></div>
              </div>

              {/* Instructions and context details */}
              <div className="space-y-md">
                <p className="font-bold text-on-surface text-md">
                  {currentQuestion.instruction}
                </p>

                {currentQuestion.contextText && (
                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant/40 italic text-sm">
                    {currentQuestion.contextText}
                  </div>
                )}

                {/* Specific UI for Skills */}

                {/* 1. Multi-choice quiz (Use of English, Reading, Listening) */}
                {currentQuestion.options && (
                  <div className="grid gap-sm">
                    {currentQuestion.options.map((opt, idx) => {
                      const isSelected = answers[currentQuestionIdx] === idx;
                      return (
                        <button
                          key={idx}
                          onClick={() => setAnswers(prev => ({ ...prev, [currentQuestionIdx]: idx }))}
                          className={`p-md rounded-xl border flex items-center text-left transition-all ${
                            isSelected 
                              ? 'border-primary ring-2 ring-primary bg-surface-container' 
                              : 'border-outline-variant hover:border-primary-container bg-white hover:bg-surface-container-low'
                          }`}
                        >
                          <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-secondary text-xs mr-sm">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="text-xs font-semibold text-on-surface">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Audio button (Listening) */}
                {currentQuestion.audioText && (
                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between">
                    <span className="text-xs text-secondary font-semibold italic">Heathrow Airport Announcement</span>
                    <button
                      onClick={() => handlePlayAudio(currentQuestion.audioText!)}
                      disabled={isPlayingAudio}
                      className="px-sm py-xs bg-primary text-white font-bold text-xs rounded-lg flex items-center gap-xs"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">
                        {isPlayingAudio ? 'volume_mute' : 'play_arrow'}
                      </span>
                      {isPlayingAudio ? 'A reproduzir...' : 'Ouvir Mensagem'}
                    </button>
                  </div>
                )}

                {/* 3. Speech capture (Speaking) */}
                {currentQuestion.speechTextToMatch && (
                  <div className="space-y-lg">
                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant text-center font-bold text-primary italic capitalize text-lg">
                      &quot;{currentQuestion.speechTextToMatch}&quot;
                    </div>

                    <div className="flex flex-col items-center justify-center gap-md">
                      <button
                        onClick={handleStartRecording}
                        disabled={isRecording}
                        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all ${
                          isRecording ? 'bg-error text-white animate-pulse' : 'bg-primary text-white hover:opacity-95'
                        }`}
                      >
                        <span className="material-symbols-outlined text-3xl">
                          {isRecording ? 'settings_voice' : 'mic'}
                        </span>
                      </button>
                      
                      <span className="text-xs text-secondary font-bold uppercase tracking-wider">
                        {isRecording ? 'A ouvir... Fale agora' : 'Pressione a barra de espaço ou o ícone para gravar'}
                      </span>
                    </div>

                    {speechTranscript && (
                      <div className="p-sm bg-surface rounded-xl border border-outline-variant space-y-1 text-center">
                        <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Transcrição Capturada:</span>
                        <p className="text-sm font-bold text-on-surface">&quot;{speechTranscript}&quot;</p>
                        {speechAccuracy !== null && (
                          <span className={`inline-block px-sm py-0.5 rounded text-[10px] font-bold text-white uppercase mt-1 ${
                            speechAccuracy >= 70 ? 'bg-tertiary-container' : 'bg-error'
                          }`}>
                            Precisão de Pronúncia: {speechAccuracy}%
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Text Editor (Writing) */}
                {currentQuestion.skill === 'Writing' && (
                  <div className="space-y-sm">
                    <textarea
                      placeholder="Escreve a tua resposta aqui..."
                      value={writingText}
                      onChange={handleWritingChange}
                      rows={6}
                      className="w-full p-md rounded-xl border border-outline-variant bg-white focus:outline-none focus:border-primary text-sm focus:ring-2 focus:ring-primary/20"
                    ></textarea>

                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-secondary">Exame de Escrita de Resposta Rápida</span>
                      <span className={`${
                        writingText.trim().split(/\s+/).filter(Boolean).length >= (currentQuestion.minWordsRequired || 30)
                          ? 'text-tertiary'
                          : 'text-error'
                      }`}>
                        Contador: {writingText.trim().split(/\s+/).filter(Boolean).length} de {currentQuestion.minWordsRequired || 30} palavras
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {/* Step Action navigation */}
              <div>
                <button
                  onClick={handleNextQuestion}
                  disabled={answers[currentQuestionIdx] === undefined}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 disabled:opacity-50 transition-all active:scale-95 flex items-center justify-center gap-xs"
                >
                  {currentQuestionIdx < questions.length - 1 ? 'Confirmar e Continuar' : 'Submeter Exame'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

            </div>
          )}

          {/* RESULTS STEP */}
          {step === 'results' && (
            <div className="space-y-lg text-center">
              <div className="space-y-xs">
                {passed ? (
                  <>
                    <span className="material-symbols-outlined text-tertiary text-6xl bg-tertiary-fixed/30 rounded-full p-sm animate-bounce">emoji_events</span>
                    <h2 className="text-3xl font-extrabold text-on-surface">Parabéns! Passaste!</h2>
                    <p className="text-sm text-secondary">
                      Cumpriste todos os critérios Cambridge e passaste na Porta de Saída {level}!
                    </p>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-error text-6xl bg-error-container/20 rounded-full p-sm">error</span>
                    <h2 className="text-2xl font-extrabold text-on-surface">Não foi desta vez</h2>
                    <p className="text-sm text-secondary">
                      Não atingiste a pontuação mínima de 70%. Errar faz parte do percurso!
                    </p>
                  </>
                )}
              </div>

              <div className={`p-lg rounded-2xl border-2 space-y-md text-left ${
                passed ? 'border-tertiary bg-tertiary-fixed/10' : 'border-error bg-error-container/10'
              }`}>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span>Resultado da Prova</span>
                  <span className={`text-xl font-extrabold ${passed ? 'text-tertiary' : 'text-error'}`}>
                    {score}%
                  </span>
                </div>

                <div className="h-px bg-outline-variant/60"></div>

                <div className="space-y-sm">
                  {passed ? (
                    <>
                      <p className="text-xs text-secondary leading-relaxed">
                        Desbloqueaste oficialmente o nível <strong className="text-primary">{getNextLevel()}</strong>! Foram-te atribuídos <strong>250 XP</strong> de bónus.
                      </p>
                      <div className="p-sm bg-white rounded-xl border border-outline-variant/30 text-xs font-semibold text-primary">
                        🚀 Nível Atualizado: {getNextLevel()} (Exame Starters/Key/First)
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-secondary leading-relaxed">
                        Recomendamos que revejas as aulas do currículo do nível {level}, especialmente as competências em que tiveste maior dificuldade, e tentes de novo quando te sentires preparado.
                      </p>
                      <div className="p-sm bg-white rounded-xl border border-outline-variant/30 text-xs font-semibold text-error">
                        🎒 Dica do Guia: Foca-te nas secções de Speaking e Listening!
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                onClick={() => router.push('/dashboard')}
                className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
              >
                Voltar ao Painel
                <span className="material-symbols-outlined text-sm">explore</span>
              </button>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
