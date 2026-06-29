'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { dbService } from '@/lib/supabase';

// Definition of exercise structures
interface BaseExercise {
  title: string;
  categoryName: string;
  tutorTip: string;
}

export default function ExercisePlayer() {
  const router = useRouter();
  const params = useParams();
  const { profile, refreshProfile } = useAuth();
  
  const id = params.id as string;
  const level = profile?.current_level || 'B1';

  // Determine type from ID prefix: list-, speak-, read-, write-, gram-
  const type = id.startsWith('list-') ? 'listening' :
               id.startsWith('speak-') ? 'speaking' :
               id.startsWith('read-') ? 'reading' :
               id.startsWith('write-') ? 'writing' : 'grammar';

  // General states
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Bottom drawer feedback state
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [feedbackTitle, setFeedbackTitle] = useState('');
  const [feedbackExplanation, setFeedbackExplanation] = useState('');

  // 1. Listening States
  const [playbackRate, setPlaybackRate] = useState<0.75 | 1 | 1.25>(1);
  const [listeningSelection, setListeningSelection] = useState<number | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // 2. Speaking States
  const [isRecording, setIsRecording] = useState(false);
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [speechAccuracy, setSpeechAccuracy] = useState<number | null>(null);

  // 3. Writing States
  const [writingInput, setWritingInput] = useState('');
  const [aiCorrection, setAiCorrection] = useState<{
    score: string;
    errors: string[];
    suggestions: string;
  } | null>(null);

  // 4. Reading States
  const [readingSelection, setReadingSelection] = useState<number | null>(null);
  const [popupWord, setPopupWord] = useState<string | null>(null);
  const [wordDefinition, setWordDefinition] = useState('');
  const [isSavingWord, setIsSavingWord] = useState(false);

  // 5. Grammar States
  // Flashcard space repetition state
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  // Word bank selection state
  const [wordBankOptions, setWordBankOptions] = useState<string[]>(['has already seen', 'already saw', 'seen already']);
  const [selectedWordBankWord, setSelectedWordBankWord] = useState<string | null>(null);

  // Trigger audio playback
  const handlePlayAudioText = (text: string) => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (synth.speaking) synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-GB'; // British English for listening standard
    utterance.rate = playbackRate;

    utterance.onstart = () => setIsPlayingAudio(true);
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    synth.speak(utterance);
  };

  // Keyboard shortcut listener for spacebar in Speaking
  useEffect(() => {
    if (type !== 'speaking') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !isRecording && !showFeedback) {
        e.preventDefault();
        handleStartSpeakingRecognition();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording, showFeedback, type]);

  // Speech Recognition
  const handleStartSpeakingRecognition = () => {
    if (typeof window === 'undefined') return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      // Fallback
      const text = prompt('A API de voz não é suportada. Digite o texto para simular o speaking:');
      if (text) {
        setSpeechTranscript(text);
        evaluateSpeechResult(text);
      }
      return;
    }

    const rec = new SpeechRec();
    rec.lang = 'en-US';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setIsRecording(true);
      setSpeechTranscript('');
      setSpeechAccuracy(null);
    };

    rec.onresult = (event: any) => {
      const trans = event.results[0][0].transcript;
      setSpeechTranscript(trans);
      evaluateSpeechResult(trans);
    };

    rec.onerror = () => setIsRecording(false);
    rec.onend = () => setIsRecording(false);

    rec.start();
  };

  const evaluateSpeechResult = (trans: string) => {
    const target = "I am looking forward to meeting the team in London next week.";
    const cleanTarget = target.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanTrans = trans.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    
    const targetWords = cleanTarget.split(/\s+/);
    const transWords = cleanTrans.split(/\s+/);
    
    let matches = 0;
    targetWords.forEach(w => {
      if (transWords.includes(w)) matches++;
    });

    const acc = Math.round((matches / targetWords.length) * 100);
    setSpeechAccuracy(acc);

    setIsCorrect(acc >= 75);
    setFeedbackTitle(acc >= 75 ? 'Excelente Pronúncia!' : 'Vamos tentar de novo?');
    setFeedbackExplanation(`A tua transcrição foi: "${trans}". Precisão de pronúncia de ${acc}% contra a frase padrão.`);
    setShowFeedback(true);
  };

  // Double click word dictionary lookup
  const handleWordDoubleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
    const selection = window.getSelection();
    if (!selection) return;
    const word = selection.toString().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    if (!word || word.includes(' ')) return;

    setPopupWord(word);
    
    // Quick local dictionary lookups
    const localDict: Record<string, string> = {
      voyager: 'Viajante, explorador ou nave espacial de longo curso.',
      historic: 'Histórico, com grande importância para a história.',
      surrounding: 'Circundante, que envolve ou rodeia.',
      district: 'Distrito, zona ou bairro de uma cidade.',
      supply: 'Fornecimento, provisão ou cadeia logística.',
      termination: 'Cessação, rescisão ou encerramento.',
      negotiation: 'Negociação, discussão para alcançar um acordo.',
      anouncement: 'Anúncio ou declaração formal.'
    };

    const def = localDict[word.toLowerCase()] || 'Termo em inglês de uso geral. Salve no teu dicionário pessoal para treinar com flashcards!';
    setWordDefinition(def);
  };

  const handleSaveWordToDictionary = async () => {
    if (!popupWord) return;
    try {
      setIsSavingWord(true);
      await dbService.addWord(popupWord, wordDefinition, '', 'Exemplo em contexto prático.', level);
      alert(`A palavra "${popupWord}" foi guardada no teu dicionário pessoal!`);
      setPopupWord(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingWord(false);
    }
  };

  // Submit exercises evaluations
  const handleListeningSubmit = () => {
    if (listeningSelection === null) return;
    const correct = listeningSelection === 1; // Option B is correct
    setIsCorrect(correct);
    setFeedbackTitle(correct ? 'Correto!' : 'Tenta de novo');
    setFeedbackExplanation(correct 
      ? 'Excelente! O passageiro deve ter o passaporte e o cartão de embarque prontos.' 
      : 'Lembra-te do anúncio: "have your passport and boarding pass ready".'
    );
    setShowFeedback(true);
  };

  const handleGrammarSubmit = () => {
    if (selectedWordBankWord === null) return;
    const correct = selectedWordBankWord === 'has already seen';
    setIsCorrect(correct);
    setFeedbackTitle(correct ? 'Correto!' : 'Tenta de novo');
    setFeedbackExplanation(correct 
      ? 'Excelente! "Has already seen" é a forma correta do Present Perfect.' 
      : 'Revisa as regras das flipping cards de tempos passados.'
    );
    setShowFeedback(true);
  };

  const handleReadingSubmit = () => {
    if (readingSelection === null) return;
    const correct = readingSelection === 1; // Option B is correct
    setIsCorrect(correct);
    setFeedbackTitle(correct ? 'Correto!' : 'Tenta de novo');
    setFeedbackExplanation(correct 
      ? 'Exato! Arthur preferiu ficar distante para explorar o bairro histórico.' 
      : 'Revê o final do texto: "stays there to enjoy the historic surrounding district".'
    );
    setShowFeedback(true);
  };

  const handleWritingVerify = () => {
    const wordCount = writingInput.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      alert('Escreve pelo menos 10 palavras antes de submeter ao corretor de IA.');
      return;
    }

    // Simulated AI grammar evaluation
    const errors: string[] = [];
    const textLower = writingInput.toLowerCase();
    
    if (textLower.includes('schedule a meeting') && !textLower.includes('i would like to')) {
      errors.push('Usa "I would like to request" em vez de "I want to" para aumentar o nível de polidez.');
    }
    if (textLower.includes('cancel') && !textLower.includes('termination')) {
      errors.push('Sugestão: "termination of contract" soa mais profissional do que "cancel".');
    }

    const aiRes = {
      score: wordCount >= 30 ? 'B1 Pass' : 'A2 Progress',
      errors: errors.length > 0 ? errors : ['Sem erros ortográficos severos detectados!'],
      suggestions: 'O e-mail cumpre os requisitos de comunicação. Tenta incorporar mais conectores de frase.'
    };

    setAiCorrection(aiRes);
    setIsCorrect(errors.length === 0);
    setFeedbackTitle(errors.length === 0 ? 'Excelente Escrita!' : 'Revisão Necessária');
    setFeedbackExplanation('O teu e-mail foi avaliado pela inteligência artificial com sugestões de melhoria.');
    setShowFeedback(true);
  };

  // Proceed to next lesson
  const handleProceedNext = async () => {
    setShowFeedback(false);
    
    if (isCorrect) {
      try {
        setLoading(true);
        // Save module completion
        const moduleId = id.startsWith('list-') ? 'listening' :
                         id.startsWith('speak-') ? 'speaking' :
                         id.startsWith('read-') ? 'reading' :
                         id.startsWith('write-') ? 'writing' : 'grammar';

        await dbService.completeLesson(level, moduleId, id);
        await refreshProfile();
        setCompleted(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background font-sans">
      {/* Top Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-container-margin h-16 bg-surface shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-xs">
          <button 
            onClick={() => router.push(`/curriculum/${level}`)}
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-all active:scale-95 mr-sm"
          >
            <span className="material-symbols-outlined text-secondary">close</span>
          </button>
          <div className="space-y-0.5">
            <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Aula Prática</span>
            <h3 className="font-bold text-on-surface text-sm capitalize">{type} Exercise</h3>
          </div>
        </div>
        
        <div className="flex items-center gap-sm">
          <div className="hidden md:flex items-center gap-xs bg-surface-container-high px-sm py-1 rounded-full border border-outline-variant/30 text-xs font-bold text-primary">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
            <span>XP: {profile?.xp || 0}</span>
          </div>
        </div>
      </header>

      {/* Main player canvas */}
      <main className="flex-grow pt-20 pb-32 px-container-margin max-w-3xl mx-auto w-full flex flex-col justify-center">
        
        {completed ? (
          /* Lesson complete summary card */
          <div className="bg-surface-container-lowest p-lg rounded-2xl border border-outline-variant/40 shadow-xl text-center space-y-md py-xl animate-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-tertiary text-6xl bg-tertiary-fixed/30 rounded-full p-sm animate-bounce">celebration</span>
            <h2 className="text-2xl font-extrabold text-on-surface">Parabéns! Aula Concluída!</h2>
            <p className="text-sm text-secondary">
              Acabas de somar <strong className="text-primary">+100 XP</strong> ao teu diário de bordo.
            </p>

            <div className="p-sm bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold flex justify-between max-w-[24rem] mx-auto">
              <span>Bónus de Hábito</span>
              <span className="text-primary font-bold">+100 XP Adicionado</span>
            </div>

            <div className="pt-sm">
              <button
                onClick={() => router.push(`/curriculum/${level}`)}
                className="w-full max-w-[24rem] py-3 bg-primary text-white rounded-xl font-bold text-xs shadow hover:opacity-95 active:scale-95 transition-all"
              >
                Voltar ao Currículo
              </button>
            </div>
          </div>
        ) : (
          /* Exercise Body */
          <div className="space-y-lg">
            
            {/* Exercise Header card */}
            <div className="text-center space-y-xs">
              <span className="inline-block px-sm py-1 rounded-full bg-surface-container text-primary font-bold text-[10px] uppercase tracking-wider">
                Metodologia Cambridge • Nível {level}
              </span>
              <h2 className="text-xl font-extrabold text-on-surface">
                {type === 'listening' && 'Compreensão Auditiva'}
                {type === 'speaking' && 'Expressão Oral'}
                {type === 'reading' && 'Compreensão de Leitura'}
                {type === 'writing' && 'Expressão Escrita'}
                {type === 'grammar' && 'Use of English: Gramática'}
              </h2>
            </div>

            {/* Exercise Details depending on type */}
            <section className="bg-surface-container-lowest p-md md:p-lg rounded-2xl border border-outline-variant/35 shadow-sm space-y-md">
              
              {/* 1. LISTENING */}
              {type === 'listening' && (
                <div className="space-y-lg">
                  <p className="text-sm font-semibold text-on-surface">
                    Ouve o anúncio do aeroporto de Heathrow e assinale o que o passageiro deve preparar:
                  </p>

                  {/* Audio segment */}
                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant flex items-center justify-between flex-wrap gap-sm">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-primary text-2xl">hearing</span>
                      <div>
                        <strong className="text-xs text-on-surface block">Aeroporto Heathrow UK</strong>
                        <span className="text-[10px] text-secondary">Sotaque Britânico</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-sm">
                      {/* Speed selector */}
                      <select
                        value={playbackRate}
                        onChange={(e) => setPlaybackRate(parseFloat(e.target.value) as any)}
                        className="bg-white border border-outline-variant rounded-lg px-2 py-1 text-[11px] font-bold text-secondary focus:outline-none"
                      >
                        <option value="0.75">Speed: 0.75x</option>
                        <option value="1.0">Speed: 1x</option>
                        <option value="1.25">Speed: 1.25x</option>
                      </select>

                      <button
                        onClick={() => handlePlayAudioText('Welcome to Heathrow Airport. Please stand behind the yellow line and have your passport and boarding pass ready for inspection.')}
                        className="px-sm py-1.5 bg-primary text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all"
                      >
                        {isPlayingAudio ? 'A reproduzir...' : 'Ouvir Áudio'}
                      </button>
                    </div>
                  </div>

                  {/* Quiz Option */}
                  <div className="grid gap-sm">
                    {[
                      'Apenas o passaporte nacional.',
                      'O passaporte e o cartão de embarque.',
                      'A carta de condução internacional.'
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setListeningSelection(idx)}
                        className={`p-md rounded-xl border flex items-center text-left transition-all ${
                          listeningSelection === idx 
                            ? 'border-primary ring-2 ring-primary bg-surface-container' 
                            : 'border-outline-variant hover:border-primary-container bg-white hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-secondary text-xs mr-sm">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs font-semibold text-on-surface">{opt}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleListeningSubmit}
                    disabled={listeningSelection === null}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow disabled:opacity-50 transition-all active:scale-95"
                  >
                    Confirmar Resposta
                  </button>
                </div>
              )}

              {/* 2. SPEAKING */}
              {type === 'speaking' && (
                <div className="space-y-lg">
                  <p className="text-sm font-semibold text-on-surface">
                    Lê a frase corporativa seguinte em voz alta para treinar a fluência de reuniões:
                  </p>

                  <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant text-center font-bold text-primary italic text-lg leading-relaxed">
                    &quot;I am looking forward to meeting the team in London next week.&quot;
                  </div>

                  <div className="flex flex-col items-center justify-center gap-md py-xs">
                    <button
                      onClick={handleStartSpeakingRecognition}
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
                      {isRecording ? 'A gravar áudio...' : 'Clica no microfone ou clica na BARRA DE ESPAÇO'}
                    </span>
                  </div>

                  {speechTranscript && (
                    <div className="p-sm bg-surface rounded-xl border border-outline-variant text-center space-y-1">
                      <span className="text-[10px] text-secondary font-bold uppercase tracking-wider block">Transcrição da tua voz:</span>
                      <p className="text-sm font-bold text-on-surface">&quot;{speechTranscript}&quot;</p>
                      {speechAccuracy !== null && (
                        <span className={`inline-block px-sm py-0.5 rounded text-[10px] font-bold text-white uppercase mt-1 ${
                          speechAccuracy >= 75 ? 'bg-tertiary-container' : 'bg-error'
                        }`}>
                          Precisão: {speechAccuracy}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3. READING */}
              {type === 'reading' && (
                <div className="space-y-lg">
                  <div className="space-y-sm">
                    <p className="text-xs text-secondary font-bold uppercase tracking-widest flex items-center gap-xs">
                      <span className="material-symbols-outlined text-sm">tips_and_updates</span>
                      Dica: Dá duplo clique em qualquer palavra para ver a tradução!
                    </p>
                    {/* Double-click text block */}
                    <div className="p-md rounded-xl bg-surface-container-low border border-outline-variant text-on-surface leading-relaxed text-sm">
                      <span onDoubleClick={handleWordDoubleClick}>
                        Although the hotel was distant from the conference hall, Arthur preferred staying there to enjoy the historic surrounding district after his business meetings concluded.
                      </span>
                    </div>
                  </div>

                  <p className="text-sm font-semibold text-on-surface">
                    Com base na leitura acima, qual das opções melhor descreve a decisão do Arthur?
                  </p>

                  <div className="grid gap-sm">
                    {[
                      'Arthur preferia o hotel por ser o mais económico.',
                      'Arthur sacrificou a proximidade ao evento para desfrutar da zona histórica.',
                      'Arthur viajou a passeio e não tinha reuniões de trabalho.'
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={() => setReadingSelection(idx)}
                        className={`p-md rounded-xl border flex items-center text-left transition-all ${
                          readingSelection === idx 
                            ? 'border-primary ring-2 ring-primary bg-surface-container' 
                            : 'border-outline-variant hover:border-primary-container bg-white hover:bg-surface-container-low'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-lg bg-surface-container-high flex items-center justify-center font-bold text-secondary text-xs mr-sm">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-xs font-semibold text-on-surface">{opt}</span>
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={handleReadingSubmit}
                    disabled={readingSelection === null}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow disabled:opacity-50 transition-all active:scale-95"
                  >
                    Confirmar Leitura
                  </button>
                </div>
              )}

              {/* 4. WRITING */}
              {type === 'writing' && (
                <div className="space-y-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-md items-start">
                    {/* Prompt Left */}
                    <div className="p-md bg-surface-container-low border border-outline-variant/60 rounded-xl space-y-sm">
                      <h4 className="font-bold text-xs text-primary uppercase tracking-wider">Instrução de Redação</h4>
                      <p className="text-xs text-on-surface leading-relaxed">
                        Escreve um pequeno e-mail a solicitar o cancelamento imediato de uma proposta comercial ou contrato em inglês.
                        Usa termos polidos e adequados à cultura de negócios.
                      </p>
                      <div className="text-[10px] text-secondary leading-normal">
                        Mínimo recomendado: 15 palavras.
                      </div>
                    </div>

                    {/* Textarea Right */}
                    <div className="space-y-xs">
                      <textarea
                        placeholder="Escreve o teu e-mail..."
                        value={writingInput}
                        onChange={(e) => setWritingInput(e.target.value)}
                        rows={6}
                        className="w-full p-sm border border-outline-variant rounded-xl text-xs bg-white focus:outline-none focus:border-primary"
                      ></textarea>
                      <div className="text-right text-[10px] font-bold text-secondary">
                        Contador: {writingInput.trim().split(/\s+/).filter(Boolean).length} palavras
                      </div>
                    </div>
                  </div>

                  {aiCorrection && (
                    <div className="p-md bg-surface-container-low border border-dashed border-outline-variant rounded-xl text-xs space-y-xs animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <strong className="text-primary font-bold uppercase">Resultado do Corretor de IA</strong>
                        <span className="px-sm py-0.5 bg-primary text-white font-bold rounded text-[9px] uppercase">
                          {aiCorrection.score}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-secondary font-bold uppercase">Alertas Gramaticais / Ortografia:</span>
                        <ul className="list-disc pl-sm text-error space-y-0.5">
                          {aiCorrection.errors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-secondary font-bold uppercase">Recomendações e Estilo:</span>
                        <p className="text-secondary">{aiCorrection.suggestions}</p>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleWritingVerify}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow transition-all active:scale-95"
                  >
                    Analisar com IA Corretora
                  </button>
                </div>
              )}

              {/* 5. GRAMMAR */}
              {type === 'grammar' && (
                <div className="space-y-lg">
                  <div className="space-y-sm">
                    <p className="text-sm font-semibold text-on-surface">
                      Selecione a opção correta para preencher a lacuna da frase Present Perfect:
                    </p>
                    <div className="p-md bg-surface-container-low border border-outline-variant/60 rounded-xl text-center italic text-md">
                      &quot;I <span className="text-primary font-bold border-b-2 border-primary/30 px-sm">_____</span> that movie already.&quot;
                    </div>
                  </div>

                  {/* Drag-and-drop selector style click blocks for mobile optimization */}
                  <div className="flex flex-wrap gap-sm justify-center py-xs">
                    {wordBankOptions.map((word) => {
                      const isSelected = selectedWordBankWord === word;
                      return (
                        <button
                          key={word}
                          onClick={() => setSelectedWordBankWord(word)}
                          className={`px-lg py-sm rounded-xl font-bold text-xs border shadow-sm transition-all active:scale-95 ${
                            isSelected 
                              ? 'bg-primary text-white border-primary' 
                              : 'bg-white border-outline-variant text-secondary hover:bg-surface-container-low'
                          }`}
                        >
                          {word}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleGrammarSubmit}
                    disabled={selectedWordBankWord === null}
                    className="w-full py-3 bg-primary text-white rounded-xl font-bold text-xs shadow disabled:opacity-50 transition-all active:scale-95"
                  >
                    Confirmar Resposta
                  </button>
                </div>
              )}

            </section>

            {/* Professor Tip card */}
            <div className="p-md flex items-start gap-md bg-surface-container-low/50 rounded-xl border border-dashed border-outline-variant">
              <span className="material-symbols-outlined text-primary text-3xl shrink-0">explore</span>
              <div>
                <h5 className="font-bold text-xs text-on-surface">Conselho do Guia de Viagem:</h5>
                <p className="text-xs text-secondary italic mt-0.5 leading-relaxed">
                  &quot;{type === 'listening' && 'Tenta escutar o som global da frase primeiro. Os passageiros tendem a focar em termos desconhecidos perdendo o rumo.'}
                  {type === 'speaking' && 'Falar com ritmo e melodia natural (connected speech) é muito mais importante para a fluência do que ter uma pronúncia individual perfeita.'}
                  {type === 'reading' && 'Ao ler, clica duas vezes em termos difíceis como "historic" ou "surrounding". Guardá-los-á no dicionário pessoal.'}
                  {type === 'writing' && 'Escrever com termos corporativos precisos como "termination" em vez de "cancel" confere credibilidade científica à tua escrita.'}
                  {type === 'grammar' && 'A palavra "already" (já) coloca quase sempre a frase no tempo Present Perfect.'}&quot;
                </p>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Dictionary Double click word definition popup */}
      {popupWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm" onClick={() => setPopupWord(null)}></div>
          <div className="relative bg-surface rounded-2xl max-w-[24rem] w-full p-md shadow-2xl border border-outline-variant/60 z-10 animate-in fade-in duration-200">
            <h4 className="text-lg font-bold text-primary flex items-center gap-xs">
              <span className="material-symbols-outlined">menu_book</span>
              Definição Inline
            </h4>
            <div className="my-md space-y-xs">
              <span className="text-xl font-extrabold text-on-surface capitalize">{popupWord}</span>
              <p className="text-xs text-secondary leading-relaxed font-semibold bg-surface-container-low p-sm rounded-xl border border-outline-variant/20">
                {wordDefinition}
              </p>
            </div>
            <div className="flex gap-sm">
              <button
                onClick={() => setPopupWord(null)}
                className="flex-1 py-2 border-2 border-outline-variant text-secondary rounded-xl font-bold text-xs"
              >
                Fechar
              </button>
              <button
                onClick={handleSaveWordToDictionary}
                disabled={isSavingWord}
                className="flex-1 py-2 bg-primary text-white rounded-xl font-bold text-xs shadow flex items-center justify-center gap-xs"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                Guardar Dicionário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bottom sliding Feedback panel */}
      {showFeedback && (
        <div className="fixed bottom-0 left-0 w-full z-50 glass-effect border-t border-outline-variant/30 bg-surface/95 py-md shadow-[0px_-8px_24px_rgba(0,0,0,0.06)] animate-in slide-in-from-bottom duration-300">
          <div className="max-w-2xl mx-auto px-container-margin flex flex-col md:flex-row items-center justify-between gap-md">
            
            <div className="flex items-center gap-md text-left w-full">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-lg text-white ${
                isCorrect ? 'bg-tertiary' : 'bg-error'
              }`}>
                <span className="material-symbols-outlined">
                  {isCorrect ? 'check' : 'close'}
                </span>
              </div>
              
              <div className="space-y-0.5">
                <h4 className={`font-bold text-md leading-none ${isCorrect ? 'text-tertiary' : 'text-error'}`}>
                  {feedbackTitle}
                </h4>
                <p className="text-xs text-secondary leading-relaxed font-semibold">
                  {feedbackExplanation}
                </p>
              </div>
            </div>

            <button
              onClick={handleProceedNext}
              className="w-full md:w-auto px-xl py-3 bg-primary text-white font-bold rounded-xl shadow-[0px_8px_24px_rgba(26,68,173,0.12)] hover:opacity-95 active:scale-95 transition-all text-center text-xs shrink-0"
            >
              Seguinte
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
