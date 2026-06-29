'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { isDemoMode } from '@/lib/supabase';

export default function Home() {
  const router = useRouter();
  const { user, signInWithGoogle, loginAsDemoUser, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleStartNow = () => {
    if (user) {
      router.push('/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLevelTest = () => {
    router.push('/placement');
  };

  const handleSocialLogin = async () => {
    try {
      setIsLoggingIn(true);
      await signInWithGoogle();
      if (isDemoMode) {
        setShowAuthModal(false);
        router.push('/placement');
      }
    } catch (err) {
      console.error(err);
      alert('Erro ao iniciar sessão.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoggingIn(true);
      const email = emailInput.trim() || 'viajante@englishpath.com';
      await loginAsDemoUser(email);
      setShowAuthModal(false);
      router.push('/placement');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 w-full z-40 flex justify-between items-center px-container-margin h-16 bg-surface/90 backdrop-blur-md shadow-sm border-b border-outline-variant/30">
        <div className="flex items-center gap-xs cursor-pointer" onClick={() => router.push('/')}>
          <span className="material-symbols-outlined text-primary text-3xl">school</span>
          <span className="text-headline-md font-bold text-primary">EnglishPath</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-lg">
          <a className="text-label-md font-medium text-primary hover:opacity-80 transition-all" href="#methodology">Metodologia</a>
          <a className="text-label-md font-medium text-secondary hover:opacity-80 transition-all" href="#levels">Níveis</a>
          <a className="text-label-md font-medium text-secondary hover:opacity-80 transition-all" href="#teaser">Estatísticas</a>
          <div className="h-6 w-px bg-outline-variant mx-xs"></div>
          {user ? (
            <div className="flex items-center gap-md">
              <button 
                onClick={() => router.push('/dashboard')} 
                className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
              >
                O meu Painel
              </button>
              <button 
                onClick={signOut} 
                className="text-secondary hover:text-error text-xs font-medium transition-all"
              >
                Sair
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowAuthModal(true)} 
              className="bg-primary text-white text-xs font-bold px-4 py-2 rounded-xl shadow hover:opacity-90 active:scale-95 transition-all"
            >
              Iniciar Sessão
            </button>
          )}
        </nav>
        
        <button 
          onClick={handleStartNow}
          className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container transition-all"
        >
          <span className="material-symbols-outlined text-primary">login</span>
        </button>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-16">
        
        {/* Banner for Demo mode status */}
        {isDemoMode && (
          <div className="bg-primary-container/20 border-b border-primary/20 text-primary px-container-margin py-xs text-center text-xs font-semibold">
            🚀 Modo Demonstração Ativo. O progresso será guardado localmente no browser.
          </div>
        )}

        {/* Hero Section */}
        <section className="relative min-h-[calc(100vh-4rem)] flex items-center overflow-hidden bg-surface-container-low py-xl px-container-margin">
          <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-xl items-center">
            
            {/* Left Content */}
            <div className="space-y-lg text-center md:text-left max-w-xl mx-auto md:mx-0">
              <div className="inline-flex items-center gap-xs px-sm py-1 bg-surface-container-lowest rounded-full shadow-sm border border-outline-variant">
                <span className="material-symbols-outlined text-tertiary text-sm">stars</span>
                <span className="text-label-sm font-label-sm text-tertiary uppercase tracking-wider">Alinhamento Cambridge</span>
              </div>
              <h1 className="font-display text-4xl md:text-5xl text-on-surface leading-tight font-bold">
                O teu caminho para a <span className="text-primary text-glow">fluência em inglês</span> começa aqui.
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant">
                A EnglishPath é o teu guia de viagem experiente, motivador e prático. Aprende inglês real com um método estruturado no CEFR/QECR que cabe na tua rotina.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-md justify-center md:justify-start pt-md">
                <button 
                  onClick={handleStartNow} 
                  className="px-lg h-14 bg-primary text-on-primary rounded-xl font-bold shadow-lg hover:shadow-xl hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
                >
                  Começar Agora
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <button 
                  onClick={handleLevelTest} 
                  className="px-lg h-14 border-2 border-primary text-primary bg-transparent rounded-xl font-bold hover:bg-primary/5 transition-all active:scale-95 flex items-center justify-center"
                >
                  Fazer Teste de Nível
                </button>
              </div>
            </div>

            {/* Right Visual element */}
            <div className="relative hidden md:block">
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-surface-container-highest rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
              <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
              <div className="relative glass-card rounded-3xl p-md shadow-2xl overflow-hidden border-2 border-white rotate-1 hover:rotate-0 transition-all duration-500">
                
                {/* 3D Visual Mockup */}
                <div className="w-full aspect-[4/3] bg-primary rounded-2xl overflow-hidden relative flex flex-col justify-end p-lg text-white">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent z-10"></div>
                  <div className="absolute top-lg left-lg bg-white/20 backdrop-blur-md px-sm py-1 rounded-full text-xs font-bold">
                    CEFR Levels A1-C2
                  </div>
                  <div className="relative z-20 space-y-xs">
                    <div className="flex items-center gap-xs">
                      <span className="material-symbols-outlined text-tertiary-fixed text-lg">explore</span>
                      <span className="text-sm font-semibold tracking-wider uppercase text-tertiary-fixed">Guia de Viagem</span>
                    </div>
                    <h3 className="text-xl font-bold">O Teu Diário de Bordo para o Inglês Profissional</h3>
                    <p className="text-xs text-white/80">Lições curtas de 10 minutos adaptadas a negócios, viagens e interações sociais.</p>
                  </div>
                </div>

                {/* Floating Achievement */}
                <div className="absolute bottom-lg right-lg bg-white/95 backdrop-blur-md p-sm rounded-xl shadow-lg border border-outline-variant/50 max-w-[200px]">
                  <div className="flex items-center gap-xs">
                    <div className="w-8 h-8 bg-tertiary-fixed text-on-tertiary-fixed rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">trending_up</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-secondary leading-none">Taxa de Sucesso</p>
                      <p className="text-xs font-bold text-on-surface">94% nos Exames</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section id="methodology" className="py-xl bg-white scroll-mt-16 px-container-margin">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-xl">
              <h2 className="text-headline-lg font-bold text-on-surface mb-md">Uma metodologia validada cientificamente</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Seguimos o Quadro Europeu Comum de Referência para Línguas (CEFR) e o rigor de Cambridge, para garantir que o teu progresso seja reconhecido internacionalmente.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-lg">
              <div className="p-lg rounded-2xl bg-surface hover:shadow-md transition-shadow border border-outline-variant/50 group">
                <div className="w-14 h-14 bg-surface-container-highest text-primary rounded-xl flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">psychology</span>
                </div>
                <h3 className="font-headline-md font-bold text-on-surface mb-sm">Aprendizagem Adaptativa</h3>
                <p className="font-body-md text-body-md text-secondary">
                  O nosso sistema ajusta os exercícios à tua velocidade e foca-se no vocabulário e gramática que realmente precisas de praticar.
                </p>
              </div>

              <div className="p-lg rounded-2xl bg-surface hover:shadow-md transition-shadow border border-outline-variant/50 group">
                <div className="w-14 h-14 bg-surface-container-highest text-primary rounded-xl flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">record_voice_over</span>
                </div>
                <h3 className="font-headline-md font-bold text-on-surface mb-sm">Inglês Real e Contextual</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Esquece frases absurdas como &quot;o urso bebe cerveja&quot;. Pratica com cenários e e-mails reais de reuniões, viagens e convívio social.
                </p>
              </div>

              <div className="p-lg rounded-2xl bg-surface hover:shadow-md transition-shadow border border-outline-variant/50 group">
                <div className="w-14 h-14 bg-surface-container-highest text-primary rounded-xl flex items-center justify-center mb-md group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-3xl">assignment_turned_in</span>
                </div>
                <h3 className="font-headline-md font-bold text-on-surface mb-sm">Simulador de Exames</h3>
                <p className="font-body-md text-body-md text-secondary">
                  Prepara-te para certificados oficiais como os exames Cambridge (B2 First, C1 Advanced) com testes de milestone que replicam o rigor real.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Bento Grid Levels */}
        <section id="levels" className="py-xl bg-surface-container-low px-container-margin scroll-mt-16">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-headline-lg font-bold text-on-surface text-center mb-xl">Explora os teus horizontes</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-6 gap-md">
              {/* Elementar */}
              <div onClick={handleStartNow} className="md:col-span-2 bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant/60 flex flex-col justify-between h-80 hover:border-primary transition-all cursor-pointer shadow-sm hover:shadow-md">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-primary/10 text-primary px-sm py-1 rounded-lg font-bold text-lg">A1 / A2</span>
                    <span className="material-symbols-outlined text-secondary">flight_takeoff</span>
                  </div>
                  <h4 className="font-headline-md font-bold mt-md">Elementar</h4>
                  <p className="text-body-md text-secondary mt-xs">Comunica em situações simples do dia a dia e apresenta-te com confiança.</p>
                </div>
                <div className="h-2 bg-outline-variant/50 rounded-full overflow-hidden">
                  <div className="h-full w-1/3 bg-primary rounded-full"></div>
                </div>
              </div>

              {/* Independente */}
              <div onClick={handleStartNow} className="md:col-span-4 bg-primary text-on-primary rounded-2xl p-lg flex flex-col justify-between h-80 relative overflow-hidden group cursor-pointer shadow-md hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent)] pointer-events-none"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <span className="bg-white/20 text-white px-sm py-1 rounded-lg font-bold text-lg">B1 / B2</span>
                    <span className="material-symbols-outlined text-white">work</span>
                  </div>
                  <h4 className="font-headline-md font-bold mt-md text-white text-2xl">Independente</h4>
                  <p className="text-body-lg text-white/80 mt-xs max-w-md">O nível profissional. Consegue trabalhar em ambientes internacionais e participar em reuniões técnicas sem dificuldades.</p>
                </div>
                <div className="relative z-10 flex items-center justify-between gap-md">
                  <span className="bg-white text-primary px-lg py-2 rounded-xl font-bold hover:scale-105 transition-transform text-xs shadow">Iniciar Nível</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary-fixed">Nível mais procurado no mercado</span>
                </div>
              </div>

              {/* Proficiente */}
              <div onClick={handleStartNow} className="md:col-span-3 bg-tertiary-container text-white rounded-2xl p-lg h-80 flex flex-col justify-between cursor-pointer hover:shadow-lg transition-all border border-tertiary/20">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="bg-tertiary text-on-tertiary-container px-sm py-1 rounded-lg font-bold text-lg">C1 / C2</span>
                    <span className="material-symbols-outlined text-on-tertiary-container">military_tech</span>
                  </div>
                  <h4 className="font-headline-md font-bold mt-md text-white">Proficiente</h4>
                  <p className="text-body-md text-white/85 mt-xs">Fluência total. Domina o inglês académico, negociações complexas e nuances da língua como um nativo.</p>
                </div>
                <div className="text-[10px] text-on-tertiary-container font-bold tracking-wider">
                  PREPARAÇÃO PARA IELTS / CAMBRIDGE C1 ADVANCED
                </div>
              </div>

              {/* Stats */}
              <div className="md:col-span-3 bg-surface-container-highest rounded-2xl p-lg h-80 flex items-center justify-center border border-outline-variant/60 shadow-sm">
                <div className="text-center">
                  <div className="text-5xl font-extrabold text-primary mb-xs">4.9 / 5</div>
                  <div className="flex justify-center gap-1 mb-md">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <span key={s} className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    ))}
                  </div>
                  <p className="font-label-md text-label-md text-secondary">Classificação média de 10.000+ alunos</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Teaser System */}
        <section id="teaser" className="py-xl bg-white px-container-margin">
          <div className="max-w-4xl mx-auto glass-card p-8 rounded-3xl flex flex-col md:flex-row items-center gap-8 shadow-md border border-outline-variant/40">
            <div className="flex-1 space-y-md">
              <h3 className="text-headline-md font-bold text-primary">Acompanha a tua evolução diária</h3>
              <p className="text-body-md text-secondary">
                Mantém o teu hábito ativo com o <strong className="text-primary font-bold">The Daily Path</strong>. Apenas 10 minutos por dia ajudam-te a construir a fluência sem sobrecargas.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-label-sm font-bold">
                    <span className="text-on-surface">Vocabulário Técnico (Workplace)</span>
                    <span className="text-primary">75%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-label-sm font-bold">
                    <span className="text-on-surface">Expressão Escrita (Emails)</span>
                    <span className="text-primary">40%</span>
                  </div>
                  <div className="h-3 w-full bg-surface-container-low rounded-full overflow-hidden">
                    <div className="h-full bg-tertiary rounded-full transition-all duration-1000" style={{ width: '40%' }}></div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-1/3 flex justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center bg-surface-container rounded-full shadow-inner border border-outline-variant/20">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="72" cy="72" fill="none" r="62" stroke="#eff4ff" strokeWidth="8"></circle>
                  <circle cx="72" cy="72" fill="none" r="62" stroke="#002d89" strokeDasharray="389.5" strokeDashoffset="120" strokeWidth="8" className="transition-all duration-1000" strokeLinecap="round"></circle>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-2xl font-extrabold text-primary">75%</span>
                  <span className="text-[9px] uppercase font-bold text-secondary tracking-widest">Para B2 First</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA section */}
        <section className="py-xl px-container-margin bg-surface-container-low">
          <div className="max-w-7xl mx-auto">
            <div className="bg-on-surface rounded-3xl p-xl flex flex-col md:flex-row items-center gap-xl overflow-hidden relative shadow-xl">
              <div className="md:w-1/2 space-y-md relative z-10">
                <h2 className="text-white font-bold text-3xl leading-tight">Pronto para transformar a tua jornada?</h2>
                <p className="text-white/70 text-body-lg">
                  Junta-te a milhares de estudantes e profissionais que usam o inglês do mundo real para alavancar a sua carreira.
                </p>
                <div className="flex gap-md pt-sm">
                  <button 
                    onClick={handleStartNow} 
                    className="bg-primary text-white px-lg py-3 rounded-xl font-bold hover:scale-[1.03] active:scale-95 transition-all shadow-md text-sm"
                  >
                    Criar Conta Grátis
                  </button>
                  <button 
                    onClick={handleLevelTest} 
                    className="text-white flex items-center gap-xs hover:underline text-sm font-semibold"
                  >
                    Fazer Diagnóstico <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>
              <div className="md:w-1/2 relative z-10 grid grid-cols-2 gap-md w-full">
                <div className="bg-white/5 backdrop-blur-sm p-md rounded-2xl border border-white/10">
                  <span className="text-white text-3xl font-extrabold block">150+</span>
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mt-1">Exercícios Reais</span>
                </div>
                <div className="bg-white/5 backdrop-blur-sm p-md rounded-2xl border border-white/10">
                  <span className="text-white text-3xl font-extrabold block">24/7</span>
                  <span className="text-white/60 text-xs font-semibold uppercase tracking-wider block mt-1">Correções de IA</span>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-surface-container py-xl border-t border-outline-variant px-container-margin">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-xl">
          <div className="col-span-2 md:col-span-1 space-y-sm">
            <div className="flex items-center gap-xs">
              <span className="material-symbols-outlined text-primary text-2xl">school</span>
              <span className="text-xl font-bold text-primary">EnglishPath</span>
            </div>
            <p className="text-on-surface-variant text-sm leading-relaxed">
              O guia de viagem prático e cientificamente estruturado para a tua fluência em inglês.
            </p>
          </div>
          
          <div className="space-y-sm">
            <h5 className="font-bold text-on-surface text-sm">Produto</h5>
            <ul className="space-y-xs text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Níveis CEFR</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Metodologia</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Exercícios</a></li>
            </ul>
          </div>

          <div className="space-y-sm">
            <h5 className="font-bold text-on-surface text-sm">Ferramentas</h5>
            <ul className="space-y-xs text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="/placement">Teste de Nível</a></li>
              <li><a className="hover:text-primary transition-colors" href="/dictionary">Dicionário Pessoal</a></li>
            </ul>
          </div>

          <div className="space-y-sm">
            <h5 className="font-bold text-on-surface text-sm">Regulamento</h5>
            <ul className="space-y-xs text-sm text-on-surface-variant">
              <li><a className="hover:text-primary transition-colors" href="#">Privacidade</a></li>
              <li><a className="hover:text-primary transition-colors" href="#">Termos de Uso</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-outline-variant/30 mt-lg pt-md text-center text-xs text-secondary">
          &copy; {new Date().getFullYear()} EnglishPath. Criado com ❤️ para viajantes e profissionais.
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div 
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            onClick={() => setShowAuthModal(false)}
          ></div>
          
          <div className="relative bg-surface rounded-2xl max-w-md w-full p-lg shadow-2xl border border-outline-variant/50 z-10 animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-md right-md text-secondary hover:text-on-surface transition-all flex items-center justify-center w-8 h-8 rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined">close</span>
            </button>

            <div className="text-center space-y-xs mb-lg">
              <span className="material-symbols-outlined text-primary text-4xl">explore</span>
              <h3 className="text-2xl font-bold text-on-surface">Entrar no Caminho</h3>
              <p className="text-sm text-secondary">
                Acede ao teu guia de viagem personalizado. Salva o teu progresso em tempo real.
              </p>
            </div>

            <div className="space-y-md">
              <button 
                onClick={handleSocialLogin}
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-xs px-md py-3 border-2 border-outline-variant rounded-xl font-bold text-sm bg-white hover:bg-surface-container-low transition-all active:scale-95 text-on-surface"
              >
                <span className="material-symbols-outlined text-primary text-lg">login</span>
                {isLoggingIn ? 'A carregar...' : 'Entrar com o Google'}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-outline-variant/60"></div>
                <span className="flex-shrink mx-4 text-xs text-secondary font-semibold uppercase tracking-wider">ou modo demo</span>
                <div className="flex-grow border-t border-outline-variant/60"></div>
              </div>

              <form onSubmit={handleDemoLogin} className="space-y-sm">
                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-secondary uppercase tracking-wider mb-1">
                    Nome de Explorador (Email)
                  </label>
                  <input 
                    type="email" 
                    id="email" 
                    placeholder="viajante@englishpath.com" 
                    required
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full px-md py-3 rounded-xl border border-outline-variant bg-white focus:outline-none focus:border-primary text-sm focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className="w-full py-3 bg-primary text-white rounded-xl font-bold text-sm shadow hover:opacity-95 transition-all active:scale-95 flex items-center justify-center gap-xs"
                >
                  <span className="material-symbols-outlined">explore</span>
                  Entrar Sem Registo (Offline/Local)
                </button>
              </form>
            </div>

            <div className="mt-lg p-sm bg-surface-container-low rounded-xl border border-dashed border-outline-variant/80 flex items-start gap-xs text-xs text-secondary italic">
              <span className="material-symbols-outlined text-primary text-sm shrink-0">tips_and_updates</span>
              <p>
                <strong>Dica do Guia:</strong> Podes usar o Modo Demo para experimentar a app. Se quiseres fazer deploy permanente, podes conectar a tua conta Supabase!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
