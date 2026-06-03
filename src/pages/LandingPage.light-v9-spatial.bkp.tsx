import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  Check, 
  Cpu, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  Lock, 
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  Activity,
  Layers,
  Database,
  Sliders,
  DollarSign,
  Award
} from 'lucide-react';

// Tauze official emerald logo (#00b865) with vertical central gap
const TauzeLogo: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 24, className, color = '#00b865' }) => (
  <svg 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path 
      d="M 46,75 C 46,63 45,42 42,34 C 38,24 28,18 12,21 C 6,22 2,25 0,27 C 4,21 12,13 26,13 C 40,13 46,24 46,41 L 46,75 Z" 
      fill={color} 
    />
    <path 
      d="M 54,75 C 54,63 55,42 58,34 C 62,24 72,18 88,21 C 94,22 98,25 100,27 C 96,21 88,13 74,13 C 60,13 54,24 54,41 L 54,75 Z" 
      fill={color} 
    />
  </svg>
);

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState<'soberania' | 'pecuaria' | 'frota' | 'hedge'>('pecuaria');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Configurator rich state
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(true);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(1800);
  const [userLicenses, setUserLicenses] = useState(12);

  // Pecuária simulation lot weight and tags
  const [selectedAnimal, setSelectedAnimal] = useState<'A' | 'B' | 'C'>('A');
  const [isWeighing, setIsWeighing] = useState(false);
  const [liveWeight, setLiveWeight] = useState(492.4);

  // Soberania key encryption state
  const [secureKey, setSecureKey] = useState("AES_256_ACTIVE_1A4F");
  const [logs, setLogs] = useState<string[]>([
    "SYS_READY: Canal isolado dedicado operacional.",
    "Tenant Sua Fazenda estabelecido em banco de dados físico físico.",
    "Bandeira de integridade: 100% SOBERANO."
  ]);

  // Telemetria simulator state
  const [tractorState, setTractorState] = useState<'idle' | 'running'>('running');
  const [tractorFuel, setTractorFuel] = useState(12.4);

  // Pricing calculations
  const basePecuaria = includePecuaria ? 390 : 0;
  const baseFrotas = includeFrotas ? 290 : 0;
  const baseHedge = includeHedge ? 490 : 0;
  const scaleSurcharge = includePecuaria ? Math.round(herdScale * 0.12) : 0;
  const licenseSurcharge = userLicenses * 18;

  const subtotal = basePecuaria + baseFrotas + baseHedge + scaleSurcharge + licenseSurcharge;
  const selectedCount = [includePecuaria, includeFrotas, includeHedge].filter(Boolean).length;
  const discountMultiplier = selectedCount === 3 ? 0.8 : selectedCount === 2 ? 0.9 : 1.0;
  const finalPrice = Math.round(subtotal * discountMultiplier);
  const annualSavings = Math.round((herdScale * 52) + (includeFrotas ? 48000 : 0));

  // Auto-scrolled navbar hook
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Soberania encryption key rotator
  useEffect(() => {
    const interval = setInterval(() => {
      const hexChars = "0123456789ABCDEF";
      let key = "AES_256_ACTIVE_";
      for (let i = 0; i < 4; i++) {
        key += hexChars[Math.floor(Math.random() * 16)];
      }
      setSecureKey(key);
      setLogs(prev => [
        `[SECURITY] Chaves assimétricas rotacionadas: ${key}`,
        ...prev.slice(0, 2)
      ]);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Tractor fuel consumption simulator
  useEffect(() => {
    if (tractorState === 'running') {
      const interval = setInterval(() => {
        setTractorFuel(prev => {
          const change = (Math.random() - 0.5) * 0.4;
          return parseFloat((prev + change).toFixed(1));
        });
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [tractorState]);

  // Animal scale weigher simulator
  const handleWeighAnimal = (animal: 'A' | 'B' | 'C') => {
    if (isWeighing) return;
    setSelectedAnimal(animal);
    setIsWeighing(true);
    
    let current = 0;
    const finalWeight = animal === 'A' ? 492.4 : animal === 'B' ? 518.8 : 462.1;
    const interval = setInterval(() => {
      setLiveWeight(prev => {
        const step = (finalWeight - prev) * 0.4;
        if (Math.abs(step) < 0.1) {
          clearInterval(interval);
          setIsWeighing(false);
          return finalWeight;
        }
        return parseFloat((prev + step).toFixed(1));
      });
    }, 80);
  };

  return (
    <div className="tauze-spatial-deck">

      {/* -------------------- STATS TICKER BAR -------------------- */}
      <div className="stats-ticker-bar">
        <div className="ticker-scroll-wrapper">
          <div className="ticker-scroll-content">
            <span className="ticker-item"><span className="indicator-emerald"></span> BOI GORDO B3 (BGI): R$ 285.50/@ <span className="tick-positive">(+1.20%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> MILHO B3 (CCM): R$ 68.20/sc <span className="tick-positive">(+0.85%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> DÓLAR COMERCIAL: R$ 5.12 <span className="tick-negative">(-0.40%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> TELEMETRIA LORA LOCAL: 100% OPERANTE</span>
            <span className="ticker-item"><span className="indicator-emerald"></span> ENCRIPTAÇÃO DE DADOS: AES-256-GCM ATIVA</span>
          </div>
          <div className="ticker-scroll-content">
            <span className="ticker-item"><span className="indicator-emerald"></span> BOI GORDO B3 (BGI): R$ 285.50/@ <span className="tick-positive">(+1.20%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> MILHO B3 (CCM): R$ 68.20/sc <span className="tick-positive">(+0.85%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> DÓLAR COMERCIAL: R$ 5.12 <span className="tick-negative">(-0.40%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> TELEMETRIA LORA LOCAL: 100% OPERANTE</span>
            <span className="ticker-item"><span className="indicator-emerald"></span> ENCRIPTAÇÃO DE DADOS: AES-256-GCM ATIVA</span>
          </div>
        </div>
      </div>

      {/* -------------------- FLOATING TACTILE NAVBAR -------------------- */}
      <nav className={`navbar-elegant ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="brand-logo-group">
            <div className="logo-badge">
              <TauzeLogo size={36} />
            </div>
            <div className="brand-titles">
              <span className="brand-name">tauze</span>
              <span className="brand-edition">Sovereign Edition</span>
            </div>
          </div>

          <div className="navbar-links-group">
            <a href="#control-hub">Centro Operacional</a>
            <a href="#dimensionador">Dimensionador ROI</a>
            <a href="#sec-faq">Especificações</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-terminal-sec">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- SPATIAL HERO CENTER STAGE -------------------- */}
      <header className="hero-spatial-stage">
        <div className="hero-radial-backdrop"></div>
        <div className="hero-dots-grid"></div>
        
        <div className="hero-stage-content">
          <span className="hero-premium-badge">
            <Sparkles size={11} className="badge-glow-icon" />
            <span>ARQUITETURA DE GOVERNANÇA INTEGRAL</span>
          </span>

          <h1 className="hero-main-title">
            O Sistema Operacional da sua Operação Agropecuária.
          </h1>

          <p className="hero-main-desc">
            Abaixo da complexidade, reside a clareza. Integramos telemetria offline-first, rastreabilidade RFID e blindagem financeira em uma matriz física e digital de alto impacto visual e alta performance operacional.
          </p>

          <div className="hero-actions-container">
            <a href="#control-hub" className="btn-primary-editorial">
              <span>Operar Centro Digital</span>
              <ArrowRight size={16} />
            </a>
            <a href="#dimensionador" className="btn-secondary-editorial">
              <span>Dimensionar Custos</span>
            </a>
          </div>
        </div>
      </header>

      {/* -------------------- CENTRAL WORKSPACE HUB (WOW FACTOR) -------------------- */}
      <section id="control-hub" className="workspace-deck-section">
        <div className="workspace-header-lead">
          <span className="sec-sub">CENTRO OPERACIONAL INTERATIVO</span>
          <h2>A Cabine de Comando Física e Digital</h2>
          <p>Selecione as abas abaixo para interagir e operar cada painel da matriz de inteligência do <strong>tauze</strong>.</p>
        </div>

        <div className="workspace-chassis-deck">
          {/* Deck Tabs */}
          <div className="deck-navigation-bar">
            <button 
              className={`deck-tab-btn ${activeTab === 'pecuaria' ? 'active' : ''}`}
              onClick={() => setActiveTab('pecuaria')}
            >
              <Activity size={14} />
              <span>01 // Balança RFID Voluntária</span>
            </button>
            <button 
              className={`deck-tab-btn ${activeTab === 'soberania' ? 'active' : ''}`}
              onClick={() => setActiveTab('soberania')}
            >
              <Database size={14} />
              <span>02 // Criptografia & Soberania</span>
            </button>
            <button 
              className={`deck-tab-btn ${activeTab === 'frota' ? 'active' : ''}`}
              onClick={() => setActiveTab('frota')}
            >
              <Truck size={14} />
              <span>03 // Telemetria Offline-First</span>
            </button>
            <button 
              className={`deck-tab-btn ${activeTab === 'hedge' ? 'active' : ''}`}
              onClick={() => setActiveTab('hedge')}
            >
              <TrendingUp size={14} />
              <span>04 // Blindagem de Margem B3</span>
            </button>
          </div>

          {/* Active Control Panel Frame */}
          <div className="deck-active-panel">
            
            {/* 1. PECUÁRIA ACTIVE FRAME */}
            {activeTab === 'pecuaria' && (
              <div className="panel-split-layout fade-in">
                <div className="panel-graphic-pane">
                  {/* Isometric corral scale graphic */}
                  <div className="isometric-viewport">
                    <svg viewBox="0 0 400 240" className="isometric-svg">
                      {/* Isometric Grid base */}
                      <path d="M 200,40 L 360,120 L 200,200 L 40,120 Z" fill="#ffffff" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="1.5" />
                      <path d="M 200,60 L 320,120 L 200,180 L 80,120 Z" fill="#f4f6f3" stroke="rgba(0, 184, 101, 0.05)" />
                      
                      {/* Isometric corral fences (green glassmorphic) */}
                      <path d="M 120,80 L 160,100 L 160,120 L 120,100 Z" fill="rgba(0, 184, 101, 0.08)" stroke="#00b865" strokeWidth="1" />
                      <path d="M 240,80 L 280,100 L 280,120 L 240,100 Z" fill="rgba(0, 184, 101, 0.08)" stroke="#00b865" strokeWidth="1" />
                      
                      {/* Gate columns */}
                      <rect x="156" y="90" width="8" height="34" fill="#072a1a" rx="2" />
                      <rect x="236" y="90" width="8" height="34" fill="#072a1a" rx="2" />
                      <line x1="160" y1="96" x2="240" y2="96" stroke="#00b865" strokeWidth="2.5" strokeDasharray="3" className="dash-move-path" />

                      {/* Isometric spline weigh curve inside grid */}
                      <path d="M 80,160 Q 150,150 200,105 T 320,70" fill="none" stroke="#00b865" strokeWidth="3" className="dash-move-path" />
                      
                      {/* Pulse active node */}
                      <circle cx="200" cy="105" r="6" fill="#072a1a" stroke="#00b865" strokeWidth="2.5" className="pulse-slow" />
                    </svg>

                    <div className="weighing-live-display">
                      <span className="disp-lbl">RFID DE BEBEDOURO // ANTENA PASTOCENTRAL</span>
                      <div className="disp-val-row">
                        <strong className={isWeighing ? 'anim-pulse' : ''}>{liveWeight.toFixed(1)} <span className="kg">KG</span></strong>
                        <span className="status-indicator">PESAGEM VOLUNTÁRIA</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel-text-pane">
                  <span className="panel-prm-badge">PECUÁRIA DE PRECISÃO</span>
                  <h3>Balança de Passagem Inteligente</h3>
                  <p className="lead-desc">Pesagens estressantes e manejo tradicional desgastam o animal, fazendo-o perder até 4 arrobas no dia do curral. A tecnologia de passagem resolve esse desperdício de forma inteligente.</p>
                  
                  <div className="tactile-animal-selector">
                    <span className="selector-title">Selecione o animal para passagem voluntária na antena:</span>
                    <div className="animal-tabs">
                      <button 
                        className={`animal-btn ${selectedAnimal === 'A' ? 'active' : ''}`}
                        onClick={() => handleWeighAnimal('A')}
                      >
                        <strong>BRINCO #BR-104</strong>
                        <span>Média GMD: +1.48kg</span>
                      </button>
                      <button 
                        className={`animal-btn ${selectedAnimal === 'B' ? 'active' : ''}`}
                        onClick={() => handleWeighAnimal('B')}
                      >
                        <strong>BRINCO #BR-212</strong>
                        <span>Média GMD: +1.22kg</span>
                      </button>
                      <button 
                        className={`animal-btn ${selectedAnimal === 'C' ? 'active' : ''}`}
                        onClick={() => handleWeighAnimal('C')}
                      >
                        <strong>BRINCO #BR-308</strong>
                        <span>Média GMD: +0.95kg</span>
                      </button>
                    </div>
                  </div>

                  <div className="stat-cards-deck">
                    <div className="s-card">
                      <span className="lbl">Abate Estimado</span>
                      <strong>14 Dias</strong>
                    </div>
                    <div className="s-card">
                      <span className="lbl">GMD Diário Lote</span>
                      <strong className="text-emerald">+1.32 kg</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. SOBERANIA ACTIVE FRAME */}
            {activeTab === 'soberania' && (
              <div className="panel-split-layout fade-in">
                <div className="panel-graphic-pane">
                  <div className="isometric-viewport">
                    <svg viewBox="0 0 400 240" className="isometric-svg">
                      {/* Concentric security grid tunnels */}
                      <circle cx="200" cy="120" r="90" fill="none" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="1" />
                      <circle cx="200" cy="120" r="70" fill="none" stroke="rgba(0, 184, 101, 0.05)" strokeWidth="1.5" strokeDasharray="5" />
                      
                      {/* Isometric Server Block 3D */}
                      <g transform="translate(160, 70)">
                        {/* Server Case Base */}
                        <path d="M 40,0 L 80,20 L 40,40 L 0,20 Z" fill="#072a1a" stroke="#00b865" strokeWidth="1.5" />
                        <path d="M 0,20 L 40,40 L 40,100 L 0,80 Z" fill="rgba(0, 184, 101, 0.15)" stroke="#00b865" strokeWidth="1.5" />
                        <path d="M 80,20 L 40,40 L 40,100 L 80,80 Z" fill="rgba(0, 184, 101, 0.05)" stroke="#00b865" strokeWidth="1.5" />
                        
                        {/* Bleading LED indicators */}
                        <circle cx="15" cy="40" r="2.5" fill="#00b865" className="pulse-slow" />
                        <circle cx="25" cy="45" r="2.5" fill="#ffbd2e" />
                        <circle cx="15" cy="55" r="2.5" fill="#00b865" className="pulse-slow" />
                      </g>

                      {/* Encrypted data paths floating */}
                      <path d="M 50,120 Q 120,60 160,110" fill="none" stroke="#00b865" strokeWidth="1.5" strokeDasharray="3" className="dash-move-path" />
                      <path d="M 350,120 Q 280,180 240,130" fill="none" stroke="#ffbd2e" strokeWidth="1.5" strokeDasharray="3" className="dash-move-path" />
                    </svg>

                    <div className="soberania-crypto-key-card">
                      <span className="key-lbl">CHAVE INTEGRAL ROTATIVA ATIVA</span>
                      <strong className="text-emerald">{secureKey}</strong>
                    </div>
                  </div>
                </div>

                <div className="panel-text-pane text-left">
                  <span className="panel-prm-badge">ISOLAMENTO FISICO DE TENANT</span>
                  <h3>Soberania Absoluta de Dados</h3>
                  <p className="lead-desc">Sistemas SaaS genéricos compartilham o mesmo pool de banco de dados, facilitando riscos fiscais e vazamentos. Nós criamos uma governança contábil inabalável e totalmente isolada.</p>
                  
                  <div className="mini-hud-console">
                    <span className="hud-title">GATEWAY DE AUDITORIA DE CRIPTOGRAFIA</span>
                    <div className="hud-lines">
                      {logs.map((log, index) => (
                        <div key={index} className="hud-line">
                          <span className="prompt">&gt;</span>
                          <span>{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <ul className="minimal-check-list mt-6">
                    <li><Check size={14} className="text-emerald" /> <span>Pools de banco de dados dedicados fisicamente</span></li>
                    <li><Check size={14} className="text-emerald" /> <span>Chaves rotativas de alta segurança militar (AES-256)</span></li>
                  </ul>
                </div>
              </div>
            )}

            {/* 3. TELEMETRIA ACTIVE FRAME */}
            {activeTab === 'frota' && (
              <div className="panel-split-layout fade-in">
                <div className="panel-graphic-pane">
                  <div className="isometric-viewport">
                    <svg viewBox="0 0 400 240" className="isometric-svg">
                      {/* Topographical grid lines */}
                      <path d="M 0,160 L 400,60" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="1" />
                      <path d="M 0,200 L 400,100" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="1" />
                      <path d="M 100,240 L 300,0" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="1" />
                      
                      {/* Tractor path mapping vector */}
                      <path d="M 60,180 C 120,160 180,90 240,110 C 280,120 340,60 380,40" fill="none" stroke="rgba(0, 184, 101, 0.15)" strokeWidth="4" strokeLinecap="round" />
                      <path d="M 60,180 C 120,160 180,90 240,110 C 280,120 340,60 380,40" fill="none" stroke="#00b865" strokeWidth="2.5" strokeDasharray="6" className="dash-move-path" strokeLinecap="round" />
                      
                      {/* Pulse vehicle dot */}
                      <circle cx="240" cy="110" r="6" fill="#072a1a" stroke="#00b865" strokeWidth="2" className="pulse-slow" />
                    </svg>

                    <div className="telemetry-live-hud">
                      <div className="hud-metric">
                        <span>FROTA OPERACIONAL</span>
                        <strong>TRATOR JD-04</strong>
                      </div>
                      <div className="hud-metric">
                        <span>CONSUMO REAL</span>
                        <strong className="text-emerald">{tractorFuel} L/h</strong>
                      </div>
                      <div className="hud-metric">
                        <span>CONEXÃO</span>
                        <strong className="text-emerald">LORA OFFLINE</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel-text-pane text-left">
                  <span className="panel-prm-badge">ARQUITETURA OFFLINE-FIRST</span>
                  <h3>Telemetria de Campo Sem Sinal Celular</h3>
                  <p className="lead-desc">Áreas rurais sofrem com sinal instável. Operar sob a premissa de internet contínua corrompe relatórios de insumos e balanços de consumo. Nosso gateway funciona de forma local offline-first.</p>
                  
                  <div className="telemetry-hud-controls">
                    <span className="title">Controlador de simulação de telemetria local:</span>
                    <div className="controls-row">
                      <button 
                        className={`action-btn ${tractorState === 'running' ? 'active' : ''}`}
                        onClick={() => setTractorState('running')}
                      >
                        SIMULAR TRAJETO OPERANTE
                      </button>
                      <button 
                        className={`action-btn ${tractorState === 'idle' ? 'active' : ''}`}
                        onClick={() => setTractorState('idle')}
                      >
                        DESLIGAR MAQUINÁRIO
                      </button>
                    </div>
                  </div>

                  <ul className="minimal-check-list">
                    <li><Check size={14} className="text-emerald" /> <span>Rastreabilidade georreferenciada local contínua</span></li>
                    <li><Check size={14} className="text-emerald" /> <span>Transmissão automática via rádio Lora de longa distância</span></li>
                  </ul>
                </div>
              </div>
            )}

            {/* 4. HEDGE B3 ACTIVE FRAME */}
            {activeTab === 'hedge' && (
              <div className="panel-split-layout fade-in">
                <div className="panel-graphic-pane">
                  <div className="isometric-viewport">
                    <svg viewBox="0 0 400 240" className="isometric-svg">
                      {/* Candlestick blocks in isometric coordinates */}
                      <g transform="translate(100, 60)">
                        {/* Green candle block 1 */}
                        <path d="M 20,40 L 40,50 L 20,60 L 0,50 Z" fill="#00b865" stroke="rgba(255,255,255,0.2)" />
                        <rect x="0" y="50" width="20" height="40" fill="rgba(0, 184, 101, 0.8)" />
                        <rect x="20" y="50" width="20" height="40" fill="rgba(0, 184, 101, 0.4)" />
                        
                        {/* Red candle block 2 */}
                        <path d="M 80,70 L 100,80 L 80,90 L 60,80 Z" fill="#ff5f56" stroke="rgba(255,255,255,0.2)" />
                        <rect x="60" y="80" width="20" height="30" fill="rgba(2ff, 95, 86, 0.8)" />
                        
                        {/* Green candle block 3 */}
                        <path d="M 140,20 L 160,30 L 140,40 L 120,30 Z" fill="#00b865" stroke="rgba(255,255,255,0.2)" />
                        <rect x="120" y="30" width="20" height="60" fill="rgba(0, 184, 101, 0.8)" />
                      </g>

                      {/* Golden safety margin highlight overlay */}
                      <path d="M 20,95 L 380,95" stroke="#00b865" strokeWidth="2.5" strokeDasharray="4" />
                    </svg>

                    <div className="hedge-indicator-status-card">
                      <span className="lbl">INDICE FUTURO BOI GORDO B3</span>
                      <strong className="text-emerald">R$ 285.50 / @ <span className="p">+1.20%</span></strong>
                    </div>
                  </div>
                </div>

                <div className="panel-text-pane text-left">
                  <span className="panel-prm-badge">BLINDAGEM FINANCEIRA B3</span>
                  <h3>Hedge & Travamento de Margem de Lucro</h3>
                  <p className="lead-desc">A física do seu rebanho e frotas integrada instantaneamente aos mercados futuros. Proteja sua operação de quedas sazonais de preço executando travas com validade física real.</p>
                  
                  <div className="hedge-interactive-toggles mt-6">
                    <span className="t-title">MARGEM DE SEGURANÇA B3 OPERANTE</span>
                    <div className="active-safe-margin-row text-emerald">
                      <ShieldCheck size={18} />
                      <strong>BLINDAGEM ATIVA: Lucro mínimo garantido a R$ 280,00/@</strong>
                    </div>
                  </div>

                  <ul className="minimal-check-list mt-6">
                    <li><Check size={14} className="text-emerald" /> <span>Indexadores integrados Boi Gordo e Milho</span></li>
                    <li><Check size={14} className="text-emerald" /> <span>Garantias calculadas sobre peso auditado local</span></li>
                  </ul>
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* -------------------- HIGH-IMPACT ROI DIMENSIONADOR (TACTILE CONFIGURATOR) -------------------- */}
      <section id="dimensionador" className="spatial-configurator-section">
        <div className="configurator-container">
          <div className="config-header-lead">
            <span className="pillar-num text-center">05 // PRO-FORMA</span>
            <h2>Dimensionador Operacional e de Faturamento</h2>
            <p>Selecione os módulos contábeis e físicos, arraste a régua de escala de animais e licenças e simule o Retorno sobre o Investimento (ROI) estimado.</p>
          </div>

          <div className="configurator-split-grid">
            {/* Skeuomorphic Slider and Controls Form */}
            <div className="controls-canvas-box">
              
              <div className="controls-group">
                <span className="group-lbl">1. Selecione os Módulos de Operação</span>
                <div className="modules-toggles-deck">
                  
                  <label className={`module-toggle-card ${includePecuaria ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includePecuaria} 
                      onChange={(e) => setIncludePecuaria(e.target.checked)} 
                    />
                    <Cpu size={16} className="icon" />
                    <div className="details">
                      <strong>Módulo Pecuária RFID</strong>
                      <span>Pesagens e GMD automáticos no bebedouro</span>
                    </div>
                  </label>

                  <label className={`module-toggle-card ${includeFrotas ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeFrotas} 
                      onChange={(e) => setIncludeFrotas(e.target.checked)} 
                    />
                    <Truck size={16} className="icon" />
                    <div className="details">
                      <strong>Módulo Telemetria Frotas</strong>
                      <span>Consumo e GPS offline-first via Lora</span>
                    </div>
                  </label>

                  <label className={`module-toggle-card ${includeHedge ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeHedge} 
                      onChange={(e) => setIncludeHedge(e.target.checked)} 
                    />
                    <TrendingUp size={16} className="icon" />
                    <div className="details">
                      <strong>Módulo Blindagem B3</strong>
                      <span>Indexador automático e travas de hedge</span>
                    </div>
                  </label>

                </div>
              </div>

              {/* Slider 1: Herd Scale */}
              <div className="controls-group">
                <div className="slider-label-row">
                  <span className="group-lbl">2. Escala de Rebanho Ativo</span>
                  <strong className="text-emerald">{herdScale.toLocaleString()} cabeças</strong>
                </div>
                <div className="slider-knob-wrapper">
                  <input 
                    type="range" 
                    min="100" 
                    max="10000" 
                    step="50" 
                    value={herdScale} 
                    onChange={(e) => setHerdScale(Number(e.target.value))} 
                    className="tactile-slider-range"
                  />
                  <div className="slider-scale-limits">
                    <span>100 cab</span>
                    <span>5.000 cab</span>
                    <span>10.000 cab</span>
                  </div>
                </div>
              </div>

              {/* Slider 2: User Licenses */}
              <div className="controls-group">
                <div className="slider-label-row">
                  <span className="group-lbl">3. Licenças de Acesso Administrativas</span>
                  <strong className="text-emerald">{userLicenses} usuários</strong>
                </div>
                <div className="slider-knob-wrapper">
                  <input 
                    type="range" 
                    min="2" 
                    max="50" 
                    step="1" 
                    value={userLicenses} 
                    onChange={(e) => setUserLicenses(Number(e.target.value))} 
                    className="tactile-slider-range"
                  />
                  <div className="slider-scale-limits">
                    <span>2 licenças</span>
                    <span>25 licenças</span>
                    <span>50 licenças</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Pristine Commercial Invoice Proposal Frame */}
            <div className="invoice-canvas-box">
              <div className="pristine-carbon-invoice">
                <div className="inv-watermark">SOVEREIGN</div>
                <div className="inv-seal-stamp">APROVADO</div>

                <div className="inv-header">
                  <TauzeLogo size={28} />
                  <div className="title-area">
                    <strong>Orçamento Técnico Pro-Forma</strong>
                    <span>tauze intelligence v6.0</span>
                  </div>
                </div>

                <div className="inv-dotted-divider"></div>

                <div className="inv-itemized-lines">
                  {includePecuaria && (
                    <div className="inv-line-row">
                      <span>Pecuária RFID Core</span>
                      <strong>R$ 390 / mês</strong>
                    </div>
                  )}
                  {includeFrotas && (
                    <div className="inv-line-row">
                      <span>Telemetria de Campo Core</span>
                      <strong>R$ 290 / mês</strong>
                    </div>
                  )}
                  {includeHedge && (
                    <div className="inv-line-row">
                      <span>Indexador & Blindagem B3</span>
                      <strong>R$ 490 / mês</strong>
                    </div>
                  )}
                  {includePecuaria && scaleSurcharge > 0 && (
                    <div className="inv-line-row">
                      <span>Escala Rebanho ({herdScale} cab)</span>
                      <strong>R$ {scaleSurcharge} / mês</strong>
                    </div>
                  )}
                  <div className="inv-line-row">
                    <span>{userLicenses} Licenças de Gestão</span>
                    <strong>R$ {licenseSurcharge} / mês</strong>
                  </div>

                  {selectedCount >= 2 && (
                    <div className="inv-line-row discount text-emerald">
                      <span>Desconto Combo ({selectedCount === 3 ? '20%' : '10%'})</span>
                      <strong>- R$ {Math.round(subtotal * (selectedCount === 3 ? 0.2 : 0.1))} / mês</strong>
                    </div>
                  )}
                </div>

                <div className="inv-dotted-divider"></div>

                <div className="inv-roi-totals">
                  <div className="total-investment-row">
                    <span>Mensalidade Estimada</span>
                    <strong className="text-emerald">R$ {finalPrice.toLocaleString()}<span className="mo">/mês</span></strong>
                  </div>

                  <div className="roi-calculator-alert-badge">
                    <div className="title-row">
                      <Award size={14} className="text-emerald animate-pulse" />
                      <strong>Retorno Anual Estimado (ROI)</strong>
                    </div>
                    <span className="savings-val text-emerald">R$ {annualSavings.toLocaleString()} / ano</span>
                    <p className="savings-desc">Mapeamento de engorda voluntária RFID e corte de refugo operacional de telemetria.</p>
                  </div>
                </div>

                <a href="#control-hub" className="btn-download-proposal">
                  <span>Exportar Proposta Comercial PDF</span>
                  <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- FAQ ACCORDIONS SECTION -------------------- */}
      <section id="sec-faq" className="faq-editorial-section">
        <div className="faq-container">
          <div className="faq-header-lead">
            <span className="pillar-num text-center">06 // DETALHAMENTO TÉCNICO</span>
            <h2>Especificações & Dúvidas</h2>
            <p>Esclareça os termos de governança, infraestrutura de hardware RFID e garantias contábeis.</p>
          </div>

          <div className="faq-accordion-list">
            {[
              {
                q: "Como o sistema opera sem sinal de celular no curral ou lavoura?",
                a: "O ecossistema do tauze opera sob arquitetura local offline-first dedicada. Antenas RFID de bebedouro e sensores de frota salvam todos os dados em storages encriptados locais em sua fazenda. A sincronização de dados ocorre de forma automática e segura apenas quando um sinal de internet está disponível ou via rede de rádio Lora dedicada de longa distância instalada pela nossa engenharia."
              },
              {
                q: "Como é garantido o isolamento físico de banco de dados por tenant?",
                a: "Sistemas SaaS tradicionais compartilham o mesmo banco de dados sob chaves de indexação lógica, permitindo falhas fiscais e vazamento cruzado de dados de produção. Nós alocamos e provisionamos instâncias físicas de servidores e bancos de dados isolados por tenant. Todos os dados são encriptados por chaves assimétricas exclusivas (AES-256-GCM)."
              },
              {
                q: "A equipe técnica do tauze instala as balanças físicas e antenas?",
                a: "Sim. A nossa engenharia e rede de parceiros homologados realizam todo o mapeamento topográfico do curral, a calibração de balanças hidráulicas de passagem, instalação de gateways Bluetooth/RFID de alta potência e configuração contábil local."
              },
              {
                q: "A plataforma se integra nativamente a ERPs de mercado?",
                a: "Sim, fornecemos conectividade nativa bidirecional homologada com SAP Business One, TOTVS e ERPs corporativos locais do setor agropecuário via conexões seguras RFC e APIs REST dedicadas."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className={`faq-accordion-card ${faqOpen === index ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              >
                <div className="faq-acc-trigger">
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className="arrow-icon" />
                </div>
                <div className="faq-acc-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- HIGH-END EDITORIAL FOOTER -------------------- */}
      <footer className="footer-elegant">
        <div className="footer-container">
          <div className="footer-brand-pane">
            <div className="footer-logo-row">
              <TauzeLogo size={32} />
              <span className="brand-name">tauze</span>
            </div>
            <p>Soberania, integridade e governança agropecuária física e digital de ponta a ponta.</p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Módulos</h4>
              <a href="#control-hub">Pecuária RFID</a>
              <a href="#control-hub">Telemetria Campo</a>
              <a href="#control-hub">Blindagem B3</a>
              <a href="#control-hub">Pontes ERP</a>
            </div>
            <div className="footer-column">
              <h4>Segurança</h4>
              <a href="#control-hub">Isolamento Criptográfico</a>
              <a href="#control-hub">Termos de Soberania</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Garantidas de Ponta a Ponta.</p>
        </div>
      </footer>

      {/* -------------------- EMBEDDED DYNAMIC DESIGN SYSTEM -------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-spatial-deck {
          --bg-canvas: #f4f6f3;          /* Warm elegant luxury off-white sand */
          --bg-panel: rgba(255, 255, 255, 0.85); /* Frosted clean glass card */
          --border-light: rgba(0, 184, 101, 0.12); /* Emerald thin hairline border */
          --accent: #00b865;             /* Signature brand vibrant emerald */
          --accent-dark: #072a1a;        /* Deep sophisticated obsidian forest green */
          --accent-light: rgba(0, 184, 101, 0.05);
          --accent-border: rgba(0, 184, 101, 0.18);
          --text-main: #0a0c0b;          /* Pure obsidian carbon charcoal typography */
          --text-muted: #4e5550;         /* Luxury warm readibility slate */
          --bg-obsidian: #0f1110;        /* Deep obsidian HUD dashboards */
          --shadow-premium: 0 30px 60px rgba(7, 42, 26, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.8);

          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          scroll-behavior: smooth;
        }

        /* --- STATS TICKER BAR --- */
        .stats-ticker-bar {
          background: #0c0d0d;
          color: #ffffff;
          height: 38px;
          display: flex;
          align-items: center;
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1001;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .ticker-scroll-wrapper {
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .ticker-scroll-content {
          display: flex;
          animation: infiniteMarquee 28s linear infinite;
        }

        @keyframes infiniteMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 7px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          margin-right: 56px;
          letter-spacing: 0.03em;
          color: rgba(255, 255, 255, 0.8);
        }

        .indicator-emerald {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
        }

        .tick-positive {
          color: var(--accent);
          font-weight: 800;
        }

        .tick-negative {
          color: #ff5f56;
          font-weight: 800;
        }

        /* --- TACTILE GLASS HEADER --- */
        .navbar-elegant {
          position: fixed;
          top: 38px;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 84px;
          display: flex;
          align-items: center;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          border-bottom: 1px solid transparent;
        }

        .navbar-elegant.scrolled {
          background: rgba(244, 246, 243, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 72px;
          border-bottom-color: var(--border-light);
          box-shadow: 0 10px 30px rgba(7, 42, 26, 0.03);
        }

        .navbar-container {
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-titles {
          display: flex;
          flex-direction: column;
          line-height: 1;
          text-align: left;
        }

        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.55rem;
          letter-spacing: -0.04em;
          text-transform: lowercase;
          color: var(--text-main);
        }

        .brand-edition {
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .navbar-links-group {
          display: flex;
          gap: 32px;
        }

        .navbar-links-group a {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.25s;
          letter-spacing: 0.02em;
        }

        .navbar-links-group a:hover {
          color: var(--text-main);
        }

        .btn-terminal-sec {
          background: var(--text-main);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.82rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.25s;
        }

        .btn-terminal-sec:hover {
          background: #000000;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 15px rgba(28, 28, 26, 0.12);
        }

        /* --- SPATIAL HERO STAGE --- */
        .hero-spatial-stage {
          position: relative;
          padding: 220px 24px 100px 24px;
          text-align: center;
          max-width: 900px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
          z-index: 2;
        }

        .hero-radial-backdrop {
          position: absolute;
          top: -20%;
          left: 50%;
          transform: translateX(-50%);
          width: 90vw;
          height: 80vh;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.06) 0%, transparent 65%);
          z-index: -1;
          pointer-events: none;
        }

        .hero-dots-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 184, 101, 0.08) 1.5px, transparent 1.5px);
          background-size: 32px 32px;
          z-index: -1;
          opacity: 0.7;
          pointer-events: none;
        }

        .hero-premium-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--border-light);
          border-radius: 100px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          box-shadow: 0 4px 12px rgba(7, 42, 26, 0.02);
          margin-bottom: 32px;
        }

        .badge-glow-icon {
          color: var(--accent);
        }

        .hero-main-title {
          font-family: 'Lora', serif;
          font-size: 4rem;
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--text-main);
          margin-bottom: 28px;
        }

        .hero-main-desc {
          font-size: 1.18rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 650px;
        }

        .hero-actions-container {
          display: flex;
          gap: 16px;
        }

        .btn-primary-editorial {
          background: var(--accent);
          color: #ffffff;
          padding: 16px 28px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.2);
          transition: all 0.3s;
        }

        .btn-primary-editorial:hover {
          transform: translateY(-2.5px);
          box-shadow: 0 14px 30px rgba(0, 184, 101, 0.35);
        }

        .btn-secondary-editorial {
          background: hsl(var(--bg-card));
          color: var(--text-main);
          border: 1px solid var(--border-light);
          padding: 16px 24px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s;
          box-shadow: 0 4px 12px rgba(7, 42, 26, 0.02);
        }

        .btn-secondary-editorial:hover {
          background: hsl(var(--bg-card));
          border-color: rgba(28, 28, 26, 0.25);
          transform: translateY(-1px);
        }

        /* --- CENTRAL WORKSPACE HUB --- */
        .workspace-deck-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .workspace-header-lead {
          text-align: center;
          margin-bottom: 48px;
        }

        .sec-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 12px;
        }

        .workspace-header-lead h2 {
          font-family: 'Lora', serif;
          font-size: 2.6rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .workspace-header-lead p {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 580px;
          margin: 0 auto;
        }

        .workspace-chassis-deck {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 28px;
          padding: 12px;
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .deck-navigation-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          background: rgba(7, 42, 26, 0.03);
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 4px;
          gap: 4px;
          margin-bottom: 16px;
        }

        .deck-tab-btn {
          border: none;
          background: transparent;
          outline: none;
          padding: 14px 10px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .deck-tab-btn.active {
          background: hsl(var(--bg-card));
          color: var(--accent-dark);
          box-shadow: 0 4px 15px rgba(7, 42, 26, 0.05);
        }

        .deck-active-panel {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 40px;
          min-height: 480px;
          display: flex;
        }

        .panel-split-layout {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 56px;
          width: 100%;
        }

        .panel-graphic-pane {
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border-light);
          background: var(--bg-canvas);
          border-radius: 16px;
          padding: 24px;
          position: relative;
          overflow: hidden;
        }

        .isometric-viewport {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .isometric-svg {
          width: 100%;
          max-height: 240px;
          flex: 1;
        }

        .dash-move-path {
          stroke-dasharray: 6;
          animation: dashAnimation 16s linear infinite;
        }
        @keyframes dashAnimation {
          to { stroke-dashoffset: -120; }
        }

        .pulse-slow {
          animation: heartbeat 2s ease-in-out infinite;
        }
        @keyframes heartbeat {
          0% { transform: scale(1); transform-origin: center; }
          50% { transform: scale(1.15); transform-origin: center; }
          100% { transform: scale(1); transform-origin: center; }
        }

        /* HUD weighing display inside viewport */
        .weighing-live-display {
          background: var(--bg-obsidian);
          border-radius: 12px;
          padding: 14px 18px;
          color: #ffffff;
          text-align: left;
          font-family: monospace;
          margin-top: 14px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .disp-lbl {
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 4px;
        }

        .disp-val-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .disp-val-row strong {
          font-size: 1.65rem;
          font-weight: 800;
          color: var(--accent);
        }

        .disp-val-row .kg {
          font-size: 0.85rem;
          color: #ffffff;
        }

        .disp-val-row .status-indicator {
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.6);
        }

        .anim-pulse {
          animation: fastPulse 0.4s ease infinite alternate;
        }
        @keyframes fastPulse {
          0% { opacity: 0.75; }
          100% { opacity: 1; }
        }

        /* Panel text and controls content */
        .panel-text-pane {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          text-align: left;
        }

        .panel-prm-badge {
          align-self: flex-start;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--accent);
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          margin-bottom: 14px;
        }

        .panel-text-pane h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.65rem;
          font-weight: 850;
          color: var(--text-main);
          letter-spacing: -0.02em;
          margin-bottom: 12px;
        }

        .lead-desc {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .tactile-animal-selector {
          margin: 20px 0;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .selector-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          display: block;
          margin-bottom: 10px;
        }

        .animal-tabs {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .animal-btn {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 8px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .animal-btn strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .animal-btn span {
          font-size: 0.58rem;
          color: var(--text-muted);
          margin-top: 2px;
        }

        .animal-btn.active {
          border-color: var(--accent);
          background: var(--accent-light);
          box-shadow: 0 4px 10px rgba(0, 184, 101, 0.04);
        }

        .animal-btn.active strong {
          color: var(--accent-dark);
        }

        .stat-cards-deck {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .s-card {
          background: var(--bg-canvas);
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 10px 14px;
          display: flex;
          flex-direction: column;
        }

        .s-card .lbl {
          font-size: 0.58rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .s-card strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 900;
          margin-top: 2px;
        }

        /* 2. Soberania Cryptography displays */
        .soberania-crypto-key-card {
          background: var(--bg-obsidian);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 14px;
          color: #ffffff;
          font-family: monospace;
          text-align: left;
          margin-top: 14px;
        }

        .key-lbl {
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          display: block;
          margin-bottom: 2px;
        }

        .soberania-crypto-key-card strong {
          font-size: 1.1rem;
        }

        .mini-hud-console {
          background: var(--bg-obsidian);
          border-radius: 10px;
          padding: 12px;
          margin: 20px 0;
          font-family: monospace;
          text-align: left;
        }

        .hud-title {
          font-size: 0.55rem;
          color: rgba(255, 255, 255, 0.35);
          display: block;
          margin-bottom: 6px;
        }

        .hud-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 52px;
        }

        .hud-line {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.85);
          display: flex;
          gap: 6px;
        }

        .hud-line .prompt {
          color: var(--accent);
          font-weight: 700;
        }

        /* 3. Telemetria GPS displays */
        .telemetry-live-hud {
          background: var(--bg-obsidian);
          border-radius: 12px;
          padding: 14px 18px;
          color: #ffffff;
          font-family: monospace;
          margin-top: 14px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          text-align: left;
        }

        .hud-metric span {
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          display: block;
        }

        .hud-metric strong {
          font-size: 0.85rem;
          margin-top: 2px;
          display: block;
        }

        .telemetry-hud-controls {
          margin: 20px 0;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .telemetry-hud-controls .title {
          font-size: 0.78rem;
          font-weight: 700;
          color: var(--text-muted);
          display: block;
          margin-bottom: 10px;
        }

        .controls-row {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 8px;
        }

        .action-btn {
          border: 1px solid var(--border-light);
          background: hsl(var(--bg-card));
          padding: 12px 10px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.active {
          background: var(--text-main);
          color: #ffffff;
          border-color: var(--text-main);
        }

        /* 4. Hedge displays */
        .hedge-indicator-status-card {
          background: var(--bg-obsidian);
          border-radius: 12px;
          padding: 14px;
          color: #ffffff;
          font-family: monospace;
          text-align: left;
          margin-top: 14px;
        }

        .hedge-indicator-status-card .lbl {
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          display: block;
          margin-bottom: 2px;
        }

        .hedge-indicator-status-card strong {
          font-size: 1.1rem;
        }

        .hedge-indicator-status-card .p {
          font-size: 0.85rem;
        }

        .active-safe-margin-row {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
        }

        /* --- SPATIAL CONFIGURATOR SECTION --- */
        .spatial-configurator-section {
          border-top: 1px solid var(--border-light);
          padding: 100px 24px;
        }

        .configurator-container {
          max-width: 1150px;
          margin: 0 auto;
        }

        .config-header-lead {
          text-align: center;
          margin-bottom: 56px;
        }

        .config-header-lead h2 {
          font-family: 'Lora', serif;
          font-size: 2.5rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .config-header-lead p {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 580px;
          margin: 0 auto;
        }

        .configurator-split-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 60px;
        }

        .controls-canvas-box {
          display: flex;
          flex-direction: column;
          gap: 36px;
          text-align: left;
        }

        .controls-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .group-lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .modules-toggles-deck {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .module-toggle-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 14px 18px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 4px 12px rgba(7, 42, 26, 0.01);
        }

        .module-toggle-card input {
          width: 15px;
          height: 15px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .module-toggle-card.active {
          background: var(--accent-light);
          border-color: var(--accent);
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.03);
        }

        .module-toggle-card.active .icon {
          color: var(--accent);
        }

        .module-toggle-card .icon {
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .module-toggle-card .details {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .module-toggle-card .details strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .module-toggle-card .details span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-knob-wrapper {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 14px 18px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(7, 42, 26, 0.01);
        }

        /* Tactile Skeuomorphic range slider range */
        .tactile-slider-range {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          background: var(--bg-canvas);
          border-radius: 10px;
          outline: none;
          margin: 10px 0;
          border: 1px solid var(--border-light);
        }

        .tactile-slider-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0, 184, 101, 0.3);
          border: 2px stroke #ffffff;
          transition: transform 0.15s;
        }

        .tactile-slider-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .slider-scale-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* PRISTINE CARBON COMMERCIAL INVOICE MOCKUP */
        .invoice-canvas-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pristine-carbon-invoice {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 32px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
          overflow: hidden;
        }

        .inv-watermark {
          position: absolute;
          top: 30%;
          left: 5%;
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          color: rgba(7, 42, 26, 0.015);
          transform: rotate(-25deg);
          user-select: none;
          pointer-events: none;
        }

        .inv-seal-stamp {
          position: absolute;
          top: 24px;
          right: 32px;
          border: 2px solid var(--accent);
          color: var(--accent);
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 4px;
          transform: rotate(5deg);
          letter-spacing: 0.08em;
          background: rgba(0, 184, 101, 0.03);
        }

        .inv-header {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .title-area strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 850;
          display: block;
        }

        .title-area span {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .inv-dotted-divider {
          height: 1px;
          border-top: 1px dashed var(--border-light);
        }

        .inv-itemized-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inv-line-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .inv-line-row strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .inv-line-row.discount {
          font-weight: 700;
        }

        .inv-roi-totals {
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: left;
        }

        .total-investment-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .total-investment-row span {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .total-investment-row strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.65rem;
          font-weight: 900;
        }

        .total-investment-row .mo {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .roi-calculator-alert-badge {
          background: var(--bg-canvas);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .roi-calculator-alert-badge .title-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
        }

        .roi-calculator-alert-badge .savings-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 900;
          margin: 2px 0;
        }

        .roi-calculator-alert-badge .savings-desc {
          font-size: 0.65rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .btn-download-proposal {
          background: var(--accent);
          color: #ffffff;
          padding: 12px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          box-shadow: 0 4px 12px rgba(0, 184, 101, 0.1);
          transition: all 0.25s;
        }

        .btn-download-proposal:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(0, 184, 101, 0.2);
        }

        /* --- FAQ EDITORIAL CHASSIS --- */
        .faq-editorial-section {
          border-top: 1px solid var(--border-light);
          padding: 100px 24px;
        }

        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-header-lead {
          text-align: center;
          margin-bottom: 48px;
        }

        .faq-header-lead h2 {
          font-family: 'Lora', serif;
          font-size: 2.4rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .faq-header-lead p {
          font-size: 1.05rem;
          color: var(--text-muted);
        }

        .faq-accordion-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .faq-accordion-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 14px;
          padding: 18px 24px;
          cursor: pointer;
          transition: all 0.25s;
          text-align: left;
        }

        .faq-accordion-card:hover {
          border-color: rgba(0, 184, 101, 0.2);
          box-shadow: 0 8px 20px rgba(7, 42, 26, 0.01);
        }

        .faq-acc-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 750;
          color: var(--text-main);
        }

        .faq-accordion-card .arrow-icon {
          color: var(--text-muted);
          transition: transform 0.25s;
        }

        .faq-accordion-card.open .arrow-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-acc-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease-out;
        }

        .faq-accordion-card.open .faq-acc-content {
          max-height: 140px;
          margin-top: 12px;
        }

        .faq-acc-content p {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* --- FOOTER ELEGANT --- */
        .footer-elegant {
          background: hsl(var(--bg-card));
          border-top: 1px solid var(--border-light);
          padding: 80px 24px 24px 24px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 48px;
          padding-bottom: 48px;
        }

        .footer-brand-pane {
          max-width: 300px;
          text-align: left;
        }

        .footer-logo-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .footer-logo-row .brand-name {
          font-size: 1.4rem;
        }

        .footer-brand-pane p {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .footer-links-grid {
          display: flex;
          gap: 60px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .footer-column h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 950;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .footer-column a {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-column a:hover {
          color: var(--text-main);
        }

        .footer-bottom-bar {
          border-top: 1px solid var(--border-light);
          max-width: 1200px;
          margin: 0 auto;
          padding-top: 24px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* --- RESPONSIVE MEDIA QUERIES --- */
        @media (max-width: 1024px) {
          .panel-split-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          .configurator-split-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
        }

        @media (max-width: 768px) {
          .hero-main-title {
            font-size: 2.8rem;
          }
          .deck-navigation-bar {
            grid-template-columns: 1fr 1fr;
          }
          .deck-active-panel {
            padding: 20px;
          }
          .navbar-links-group {
            display: none;
          }
          .footer-container {
            flex-direction: column;
            gap: 32px;
          }
          .footer-links-grid {
            gap: 40px;
          }
        }
      `}</style>

    </div>
  );
};
