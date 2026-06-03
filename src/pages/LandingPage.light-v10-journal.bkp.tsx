import React, { useState, useEffect } from 'react';
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
  Award,
  Map,
  Scale,
  Calendar,
  Compass,
  AlertCircle
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
  const [activeFeature, setActiveFeature] = useState<'rfid' | 'telemetria' | 'hedge'>('rfid');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // ROI Calculator states
  const [herdScale, setHerdScale] = useState(1500);
  const [farmSize, setFarmSize] = useState(2500);
  const [fleetSize, setFleetSize] = useState(8);

  // Interactive RFID Simulator State
  const [selectedBovine, setSelectedBovine] = useState<'bov-104' | 'bov-212' | 'bov-309'>('bov-104');
  const [isWeighing, setIsWeighing] = useState(false);
  const [simWeight, setSimWeight] = useState(482.5);

  // Interactive Telemetry Simulator State
  const [mapPin, setMapPin] = useState<'piquete-A' | 'piquete-B'>('piquete-A');
  const [tractorProgress, setTractorProgress] = useState(0);

  // Interactive Hedge Calculator State
  const [strikePrice, setStrikePrice] = useState(285.0);

  // Scroll event for navbar opacity
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tractor route progress loop
  useEffect(() => {
    const interval = setInterval(() => {
      setTractorProgress(prev => (prev >= 100 ? 0 : prev + 2.5));
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Weighing simulation handler
  const triggerWeighing = (bovine: 'bov-104' | 'bov-212' | 'bov-309') => {
    if (isWeighing) return;
    setSelectedBovine(bovine);
    setIsWeighing(true);

    const targetWeights = {
      'bov-104': 482.5,
      'bov-212': 512.2,
      'bov-309': 456.8
    };
    const target = targetWeights[bovine];

    // Simulate scale settling
    let step = 0;
    const interval = setInterval(() => {
      setSimWeight(prev => {
        const diff = target - prev;
        if (Math.abs(diff) < 0.1 || step > 15) {
          clearInterval(interval);
          setIsWeighing(false);
          return target;
        }
        step++;
        return parseFloat((prev + diff * 0.45).toFixed(1));
      });
    }, 70);
  };

  // ROI Math
  const rfidSavings = herdScale * 42.5; // R$ 42,50 saved per head in weight loss prevention
  const fleetSavings = fleetSize * 4800; // R$ 4.800 fuel saved per machinery annually
  const totalAnnualSavings = Math.round(rfidSavings + fleetSavings + (herdScale > 800 ? 64000 : 25000));

  return (
    <div className="tauze-premium-journal">

      {/* -------------------- DYNAMIC TICKER BAR -------------------- */}
      <div className="commodity-ticker-bar">
        <div className="ticker-scroll">
          <div className="ticker-track">
            <span className="ticker-item"><span className="ticker-dot"></span> BOI GORDO B3: <strong>R$ 286,85/@</strong> <span className="text-positive">(+0,95%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> MILHO B3 (CCM): <strong>R$ 67,40/sc</strong> <span className="text-positive">(+1,12%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> DÓLAR COMERCIAL: <strong>R$ 5,14</strong> <span className="text-negative">(-0,32%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> TELEMETRIA LORA LOCAL: <strong className="text-positive">OPERANTE (915 MHz)</strong></span>
            <span className="ticker-item"><span className="ticker-dot"></span> BANCO DE DADOS: <strong className="text-gold">Sovereign Vault Ativo</strong></span>
          </div>
          <div className="ticker-track">
            <span className="ticker-item"><span className="ticker-dot"></span> BOI GORDO B3: <strong>R$ 286,85/@</strong> <span className="text-positive">(+0,95%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> MILHO B3 (CCM): <strong>R$ 67,40/sc</strong> <span className="text-positive">(+1,12%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> DÓLAR COMERCIAL: <strong>R$ 5,14</strong> <span className="text-negative">(-0,32%)</span></span>
            <span className="ticker-item"><span className="ticker-dot"></span> TELEMETRIA LORA LOCAL: <strong className="text-positive">OPERANTE (915 MHz)</strong></span>
            <span className="ticker-item"><span className="ticker-dot"></span> BANCO DE DADOS: <strong className="text-gold">Sovereign Vault Ativo</strong></span>
          </div>
        </div>
      </div>

      {/* -------------------- FLOATING EMBOSSED NAVIGATION -------------------- */}
      <nav className={`premium-nav ${scrolled ? 'nav-scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-brand">
            <div className="brand-logo-container">
              <TauzeLogo size={32} />
            </div>
            <div className="brand-details">
              <span className="brand-title">tauze</span>
              <span className="brand-version">SOVEREIGN SUITE</span>
            </div>
          </div>

          <div className="nav-links">
            <a href="#solucoes">Integrações</a>
            <a href="#soberania">Blindagem de Dados</a>
            <a href="#calculadora">Simulador ROI</a>
            <a href="#especificacoes">Especificações</a>
          </div>

          <div className="nav-action">
            <Link to="/login" className="nav-btn-terminal">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- CINEMATIC LITERARY HERO -------------------- */}
      <header className="journal-hero">
        <div className="hero-grid-overlay"></div>
        <div className="hero-radial-gradient"></div>
        
        <div className="hero-content">
          <div className="hero-meta-badge">
            <Sparkles size={11} className="badge-glow" />
            <span>SISTEMA OPERACIONAL AGROPECUÁRIO PREMIUM</span>
          </div>

          <h1 className="hero-headline">
            A elegância da precisão no campo.<br />
            A soberania absoluta nos números.
          </h1>

          <p className="hero-subline">
            Muito além do SaaS tradicional. O <strong>tauze</strong> integra telemetria offline de alta frequência, 
            rastreamento voluntário RFID e blindagem fiscal. Desenvolvido para produtores que exigem 
            segurança contábil inabalável e máximo controle físico em uma interface impecável.
          </p>

          <div className="hero-actions">
            <a href="#solucoes" className="btn-hero-primary">
              <span>Operar Painel de Controle</span>
              <ArrowRight size={16} />
            </a>
            <a href="#calculadora" className="btn-hero-secondary">
              <span>Dimensionar Retorno</span>
            </a>
          </div>
        </div>

        {/* Hero Decorative Premium Card Grid showing system status highlights */}
        <div className="hero-specs-highlight">
          <div className="highlight-item">
            <span className="num">01</span>
            <div>
              <strong>Tenant Físico Isolado</strong>
              <span>Banco de dados independente para cada fazenda.</span>
            </div>
          </div>
          <div className="highlight-item">
            <span className="num">02</span>
            <div>
              <strong>Pesagem Voluntária</strong>
              <span>Balanças autônomas integradas sem estresse bovino.</span>
            </div>
          </div>
          <div className="highlight-item">
            <span className="num">03</span>
            <div>
              <strong>Hedge B3 nativo</strong>
              <span>Proteção automática contra flutuações de mercado.</span>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------- INTERACTIVE SOLUTIONS CONTROLLER -------------------- */}
      <section id="solucoes" className="interactive-hub-section">
        <div className="section-header-centered">
          <span className="section-kpi-badge">CABINE OPERACIONAL</span>
          <h2>A Matriz Digital da sua Propriedade</h2>
          <p>
            Não criamos caixas de texto estáticas. Interaja abaixo diretamente com os dados 
            de telemetria, pesagem e mercado gerados em tempo real na fazenda modelo.
          </p>
        </div>

        <div className="interactive-tabs-card">
          {/* Main Controls Left */}
          <div className="interactive-selector-aside">
            <div className="aside-title">Sistemas Integrados</div>
            
            <button 
              className={`select-btn ${activeFeature === 'rfid' ? 'active' : ''}`}
              onClick={() => setActiveFeature('rfid')}
            >
              <div className="btn-icon"><Scale size={16} /></div>
              <div className="btn-texts">
                <strong>Balança de Passagem RFID</strong>
                <span>Pesagem constante sem manejo forçado</span>
              </div>
              <div className="btn-glow"></div>
            </button>

            <button 
              className={`select-btn ${activeFeature === 'telemetria' ? 'active' : ''}`}
              onClick={() => setActiveFeature('telemetria')}
            >
              <div className="btn-icon"><Compass size={16} /></div>
              <div className="btn-texts">
                <strong>Telemetria Offline-First</strong>
                <span>Rastreamento de frotas e insumos em LoraWAN</span>
              </div>
              <div className="btn-glow"></div>
            </button>

            <button 
              className={`select-btn ${activeFeature === 'hedge' ? 'active' : ''}`}
              onClick={() => setActiveFeature('hedge')}
            >
              <div className="btn-icon"><TrendingUp size={16} /></div>
              <div className="btn-texts">
                <strong>Hedge e Proteção B3</strong>
                <span>Segurança de margem automatizada</span>
              </div>
              <div className="btn-glow"></div>
            </button>
          </div>

          {/* Interactive Screen Display Right */}
          <div className="interactive-display-pane">
            <div className="pane-header-mac">
              <div className="dots-row">
                <span className="dot-red"></span>
                <span className="dot-yellow"></span>
                <span className="dot-green"></span>
              </div>
              <span className="pane-title-address">tauze://hub-operacional/fazenda-soberana/visualizador</span>
              <span className="status-live-pill">LIVE SECURE</span>
            </div>

            <div className="pane-content-area">
              {/* RFID TAB CONTENT */}
              {activeFeature === 'rfid' && (
                <div className="tab-fade-in rfid-simulator">
                  <div className="simulator-grid">
                    <div className="sim-visualization">
                      <div className="isometric-corral">
                        <div className="scale-indicator-card">
                          <span className="lbl">BALANÇA DE PASSAGEM RFID VOLUNTÁRIA</span>
                          <div className="weight-display">
                            <strong className={isWeighing ? 'text-weighing' : ''}>{simWeight.toFixed(1)} <span className="unit">KG</span></strong>
                            <div className="status">
                              <span className="live-dot"></span>
                              <span>PESAGEM ESTÁVEL</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 400 160" className="vector-isometric">
                            {/* Topo grids */}
                            <path d="M 200,10 L 370,85 L 200,150 L 30,85 Z" fill="rgba(240, 238, 230, 0.4)" stroke="rgba(195, 176, 145, 0.25)" strokeWidth="1.5" />
                            <path d="M 200,30 L 340,85 L 200,135 L 60,85 Z" fill="none" stroke="rgba(0, 184, 101, 0.1)" strokeWidth="1" strokeDasharray="3" />
                            
                            {/* Corral Corridor Fences */}
                            <path d="M 140,55 L 180,75 L 180,95 L 140,75 Z" fill="rgba(0, 184, 101, 0.04)" stroke="#00b865" strokeWidth="1.5" />
                            <path d="M 220,55 L 260,75 L 260,95 L 220,75 Z" fill="rgba(0, 184, 101, 0.04)" stroke="#00b865" strokeWidth="1.5" />
                            
                            {/* Main scales antenna plate */}
                            <path d="M 180,75 L 220,95 L 180,115 L 140,95 Z" fill="rgba(195, 176, 145, 0.15)" stroke="rgba(197, 160, 115, 0.6)" strokeWidth="2" />
                            
                            {/* RFID Reader Pillar */}
                            <g transform="translate(225, 65)">
                              <path d="M 0,0 L 10,5 L 10,45 L 0,40 Z" fill="#252d26" />
                              <path d="M 10,5 L 20,0 L 20,40 L 10,45 Z" fill="#1b211c" />
                              <path d="M 0,0 L 10,-5 L 20,0 L 10,5 Z" fill="#354037" />
                              {/* Antenna glow */}
                              <circle cx="10" cy="15" r="3" fill="#00b865" className="sim-pulse-light" />
                            </g>

                            {/* Spline pathway of bovine */}
                            <path d="M 80,110 Q 140,110 180,95 T 280,45" fill="none" stroke="#00b865" strokeWidth="2" strokeDasharray="4" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="sim-controls-panel">
                      <span className="pnl-title">MANEJO DA INFORMAÇÃO</span>
                      <h3>Histórico de Pesagem Voluntária</h3>
                      <p>
                        A balança de passagem Tauze monitora o rebanho autonomamente quando os animais 
                        vão ao bebedouro. Isso elimina o estresse do manejo tradicional e gera curvas perfeitas de GMD.
                      </p>

                      <div className="animal-tag-selector">
                        <span className="lbl-selector">Selecione o brinco ativo na antena:</span>
                        <div className="tag-buttons">
                          <button 
                            className={`tag-btn ${selectedBovine === 'bov-104' ? 'active' : ''}`}
                            onClick={() => triggerWeighing('bov-104')}
                          >
                            <strong>BRINCO #BR-104</strong>
                            <span>GMD Médio: +1,42 kg/dia</span>
                          </button>
                          <button 
                            className={`tag-btn ${selectedBovine === 'bov-212' ? 'active' : ''}`}
                            onClick={() => triggerWeighing('bov-212')}
                          >
                            <strong>BRINCO #BR-212</strong>
                            <span>GMD Médio: +1,28 kg/dia</span>
                          </button>
                          <button 
                            className={`tag-btn ${selectedBovine === 'bov-309' ? 'active' : ''}`}
                            onClick={() => triggerWeighing('bov-309')}
                          >
                            <strong>BRINCO #BR-309</strong>
                            <span>GMD Médio: +0,98 kg/dia</span>
                          </button>
                        </div>
                      </div>

                      <div className="mini-stats-grid">
                        <div className="mini-stat">
                          <span className="stat-label">Eficiência de Engorda</span>
                          <strong className="text-positive">GMD Ótimo</strong>
                        </div>
                        <div className="mini-stat">
                          <span className="stat-label">Abate Estimado</span>
                          <strong>18 Dias</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TELEMETRY TAB CONTENT */}
              {activeFeature === 'telemetria' && (
                <div className="tab-fade-in telemetry-simulator">
                  <div className="simulator-grid">
                    <div className="sim-visualization">
                      <div className="map-view-deck">
                        <div className="telemetry-live-card">
                          <span className="lbl">SINAL LORAWAN LONG RANGE // ANTENA 01</span>
                          <div className="telemetry-meta">
                            <div>
                              <span className="sub-lbl">Máquina Ativa</span>
                              <strong>TRATOR JOHN DEERE 8R</strong>
                            </div>
                            <div>
                              <span className="sub-lbl">Consumo Médio</span>
                              <strong className="text-positive">14,2 L/h</strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg viewBox="0 0 400 160" className="vector-topo-map">
                            {/* Contour Lines */}
                            <path d="M 20,80 Q 100,20 200,80 T 380,80" fill="none" stroke="rgba(197, 160, 115, 0.15)" strokeWidth="1" />
                            <path d="M 20,110 Q 100,50 200,110 T 380,110" fill="none" stroke="rgba(197, 160, 115, 0.1)" strokeWidth="1" />
                            <path d="M 20,50 Q 100,0 200,50 T 380,50" fill="none" stroke="rgba(197, 160, 115, 0.1)" strokeWidth="1" />
                            
                            {/* Harvest plots boundaries */}
                            <rect x="50" y="20" width="120" height="60" rx="6" fill="rgba(0, 184, 101, 0.03)" stroke="rgba(0, 184, 101, 0.2)" strokeWidth="1" />
                            <rect x="230" y="70" width="120" height="70" rx="6" fill="rgba(197, 160, 115, 0.03)" stroke="rgba(197, 160, 115, 0.2)" strokeWidth="1" />
                            
                            {/* Tractor path tracking overlay */}
                            {mapPin === 'piquete-A' ? (
                              <path d="M 60,30 L 160,30 L 160,70 L 60,70 Z" fill="none" stroke="#00b865" strokeWidth="2.5" strokeDasharray="4" className="tractor-path-drawn" />
                            ) : (
                              <path d="M 240,80 L 340,80 L 340,130 L 240,130 Z" fill="none" stroke="#c5a880" strokeWidth="2.5" strokeDasharray="4" className="tractor-path-drawn" />
                            )}

                            {/* Dynamic GPS Pin */}
                            {mapPin === 'piquete-A' ? (
                              <g transform="translate(110, 30)">
                                <circle cx="0" cy="0" r="8" fill="rgba(0, 184, 101, 0.2)" className="pulse-slow" />
                                <circle cx="0" cy="0" r="3" fill="#00b865" />
                              </g>
                            ) : (
                              <g transform="translate(290, 105)">
                                <circle cx="0" cy="0" r="8" fill="rgba(197, 160, 115, 0.2)" className="pulse-slow" />
                                <circle cx="0" cy="0" r="3" fill="#c5a880" />
                              </g>
                            )}
                          </svg>
                        </div>
                      </div>
                    </div>

                    <div className="sim-controls-panel">
                      <span className="pnl-title">CONEXÃO OFFline-FIRST</span>
                      <h3>Rastreamento Total sem Internet</h3>
                      <p>
                        A infraestrutura do Tauze opera com antenas LoraWAN proprietárias, 
                        transmitindo dados de telemetria de tratores e gado em um raio de até 15km 
                        mesmo em áreas de sombra de operadoras celulares.
                      </p>

                      <div className="map-zone-selector">
                        <span className="lbl-selector">Selecione o Lote de Plantio:</span>
                        <div className="zone-buttons">
                          <button 
                            className={`zone-btn ${mapPin === 'piquete-A' ? 'active' : ''}`}
                            onClick={() => setMapPin('piquete-A')}
                          >
                            <strong>Lote Alfa (Soja)</strong>
                            <span>Gargalo de umidade: Normal</span>
                          </button>
                          <button 
                            className={`zone-btn ${mapPin === 'piquete-B' ? 'active' : ''}`}
                            onClick={() => setMapPin('piquete-B')}
                          >
                            <strong>Lote Bravo (Milho)</strong>
                            <span>Gargalo de umidade: Baixo</span>
                          </button>
                        </div>
                      </div>

                      <div className="mini-stats-grid">
                        <div className="mini-stat">
                          <span className="stat-label">Intensidade do Sinal</span>
                          <strong className="text-positive">-88 dBm (Forte)</strong>
                        </div>
                        <div className="mini-stat">
                          <span className="stat-label">Hectares Mapeados</span>
                          <strong>100%</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* HEDGE TAB CONTENT */}
              {activeFeature === 'hedge' && (
                <div className="tab-fade-in hedge-simulator">
                  <div className="simulator-grid">
                    <div className="sim-visualization">
                      <div className="hedge-chart-card">
                        <div className="chart-title-row">
                          <span className="title-desc">FLUXO DE CAIXA OPERACIONAL vs RISCO B3</span>
                          <span className="prm-stamp">HEDGE ATIVADO</span>
                        </div>
                        
                        <div className="vector-chart-container">
                          <svg viewBox="0 0 380 120" className="vector-financial-chart">
                            {/* Gridlines */}
                            <line x1="0" y1="20" x2="380" y2="20" stroke="rgba(19, 28, 22, 0.05)" strokeWidth="1" />
                            <line x1="0" y1="60" x2="380" y2="60" stroke="rgba(19, 28, 22, 0.05)" strokeWidth="1" />
                            <line x1="0" y1="100" x2="380" y2="100" stroke="rgba(19, 28, 22, 0.05)" strokeWidth="1" />

                            {/* Strike Price Floor Guideline */}
                            <line 
                              x1="0" 
                              y1={120 - (strikePrice - 200) * 1.1} 
                              x2="380" 
                              y2={120 - (strikePrice - 200) * 1.1} 
                              stroke="#c5a880" 
                              strokeWidth="2" 
                              strokeDasharray="4" 
                            />
                            
                            {/* Volatile Market price curve (Red line going down below floor) */}
                            <path 
                              d="M 0,25 Q 80,35 160,75 T 280,105 T 380,115" 
                              fill="none" 
                              stroke="rgba(255, 95, 86, 0.6)" 
                              strokeWidth="2" 
                            />

                            {/* Secure revenue lock line (Stays flat at strike price level) */}
                            <path 
                              d={`M 0,25 Q 80,35 160,75 L 205,${120 - (strikePrice - 200) * 1.1} L 380,${120 - (strikePrice - 200) * 1.1}`} 
                              fill="none" 
                              stroke="#00b865" 
                              strokeWidth="3.5" 
                            />

                            {/* Safe locked zone gradient shading */}
                            <path 
                              d={`M 160,75 L 205,${120 - (strikePrice - 200) * 1.1} L 380,${120 - (strikePrice - 200) * 1.1} L 380,120 L 160,120 Z`} 
                              fill="rgba(0, 184, 101, 0.04)" 
                            />
                          </svg>

                          <div className="price-strike-label" style={{ bottom: `${(strikePrice - 200) * 0.9}px` }}>
                            PISO DE SEGURANÇA B3: R$ {strikePrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="sim-controls-panel">
                      <span className="pnl-title">BLINDAGEM FINANCEIRA</span>
                      <h3>Piso Mínimo Garantido</h3>
                      <p>
                        A oscilação de commodities pode corroer a rentabilidade de um ano inteiro de trabalho. 
                        Nossa plataforma conecta sua estimativa de peso físico à mesa de derivativos B3 para estabelecer 
                        trava de preços no momento exato.
                      </p>

                      <div className="slider-box-hedge">
                        <div className="slider-label-row">
                          <span>Ajustar Preço de Venda do Boi (@):</span>
                          <strong>R$ {strikePrice.toFixed(0)}</strong>
                        </div>
                        <input 
                          type="range" 
                          min="240" 
                          max="310" 
                          value={strikePrice} 
                          onChange={(e) => setStrikePrice(parseFloat(e.target.value))}
                          className="premium-slider-green"
                        />
                      </div>

                      <div className="mini-stats-grid">
                        <div className="mini-stat">
                          <span className="stat-label">Receita Protegida</span>
                          <strong className="text-positive">R$ {Math.round(strikePrice * herdScale * 16.5).toLocaleString('pt-BR')}</strong>
                        </div>
                        <div className="mini-stat">
                          <span className="stat-label">Exposição ao Risco</span>
                          <strong>0% Lock-in</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- SOVEREIGN DATABASE SHOWCASE (THE BLUEPRINT) -------------------- */}
      <section id="soberania" className="sovereignty-blueprint-section">
        <div className="container-narrowed">
          <div className="section-header-centered">
            <span className="section-kpi-badge">SEGURANÇA CORPORATIVA</span>
            <h2>Soberania Contábil & Tenant Isolado</h2>
            <p>
              Em plataformas SaaS convencionais, seus dados contábeis, produtivos e de estoque compartilham 
              a mesma partição de banco de dados com concorrentes. Um risco estrutural inaceitável.
            </p>
          </div>

          <div className="blueprint-comparative-grid">
            {/* Standard SaaS Card */}
            <div className="blueprint-card shared-architecture">
              <div className="card-badge red-alert">ARQUITETURA DE RISCO COMUM</div>
              <h3>Banco Compartilhado (Multi-tenant)</h3>
              <p>
                Os concorrentes operam no mesmo servidor lógico. Erros de código simples ou falhas 
                de indexação podem misturar balanços e expor informações estratégicas de mercado.
              </p>
              
              <div className="vector-container-schema">
                <svg viewBox="0 0 300 160" className="schema-svg">
                  {/* Shared database server block */}
                  <rect x="90" y="40" width="120" height="80" rx="8" fill="#faf6f5" stroke="#ff5f56" strokeWidth="1.5" strokeDasharray="3" />
                  <text x="150" y="85" textAnchor="middle" fill="#ff5f56" fontSize="10" fontWeight="bold">BANCO COMPARTILHADO</text>
                  
                  {/* Tenant streams connecting */}
                  <path d="M 30,50 L 90,65" stroke="#777" strokeWidth="1" strokeDasharray="2" />
                  <text x="25" y="45" fill="#777" fontSize="8">Fazenda A (Concorrente)</text>

                  <path d="M 30,110 L 90,95" stroke="#777" strokeWidth="1" strokeDasharray="2" />
                  <text x="25" y="125" fill="#777" fontSize="8">Sua Fazenda (Dados)</text>

                  {/* Red Alert Threat Arrow */}
                  <path d="M 30,50 L 90,65 M 90,65 L 30,110" stroke="#ff5f56" strokeWidth="1.5" className="alert-arrow-dash" />
                </svg>
              </div>

              <div className="bullet-points font-sm">
                <div className="bullet"><AlertCircle size={14} className="text-negative" /> Risco de vazamento por falhas de injeção</div>
                <div className="bullet"><AlertCircle size={14} className="text-negative" /> Queda de performance devido a picos de terceiros</div>
                <div className="bullet"><AlertCircle size={14} className="text-negative" /> Vulnerabilidade fiscal sob auditoria de servidores</div>
              </div>
            </div>

            {/* Sovereign Tauze Vault Card */}
            <div className="blueprint-card sovereign-architecture">
              <div className="card-badge green-success">MODELO DE ISOLAMENTO TOTAL</div>
              <h3>Cofre Físico Individual (Isolated Vault)</h3>
              <p>
                Cada contratante possui uma máquina virtual independente e uma partição de dados exclusiva. 
                Sua governança fiscal e suas estratégias de hedge permanecem invioláveis sob criptografia forte.
              </p>

              <div className="vector-container-schema">
                <svg viewBox="0 0 300 160" className="schema-svg">
                  {/* Isolated Server Vault 1 */}
                  <rect x="20" y="30" width="100" height="100" rx="8" fill="#f4f6f3" stroke="#00b865" strokeWidth="2" />
                  <rect x="25" y="35" width="90" height="40" rx="4" fill="rgba(0,184,101,0.06)" />
                  <text x="70" y="58" textAnchor="middle" fill="#00b865" fontSize="8" fontWeight="bold">Sua Fazenda</text>
                  <text x="70" y="115" textAnchor="middle" fill="#252d26" fontSize="7">DATABASE ISOLADA</text>

                  {/* Isolated Server Vault 2 */}
                  <rect x="180" y="30" width="100" height="100" rx="8" fill="#fafafa" stroke="#c5a880" strokeWidth="1.5" />
                  <rect x="185" y="35" width="90" height="40" rx="4" fill="rgba(197, 160, 115, 0.06)" />
                  <text x="230" y="58" textAnchor="middle" fill="#c5a880" fontSize="8" fontWeight="bold">Outro Cliente</text>
                  <text x="230" y="115" textAnchor="middle" fill="#777" fontSize="7">DATABASE PRIVADA</text>
                </svg>
              </div>

              <div className="bullet-points font-sm">
                <div className="bullet"><Check size={14} className="text-positive" /> Blindagem completa de balanços e registros fiscais</div>
                <div className="bullet"><Check size={14} className="text-positive" /> Performance computacional 100% garantida</div>
                <div className="bullet"><Check size={14} className="text-positive" /> Criptografia simétrica AES-256 com chave rotativa</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- INTERACTIVE CAPITAL CALCULATOR (THE LEDGER) -------------------- */}
      <section id="calculadora" className="roi-calculator-section">
        <div className="calculator-wrapper">
          <div className="section-header-centered">
            <span className="section-kpi-badge">LEDGER DE CAPITAL</span>
            <h2>Dimensionador de Lucratividade Operacional</h2>
            <p>
              Estime os ganhos práticos da implementação de processos inteligentes da suíte Tauze 
              na sua propriedade agropecuária.
            </p>
          </div>

          <div className="calculator-layout-split">
            {/* Input Controls Panel */}
            <div className="calculator-sliders-panel">
              <span className="panel-prm-badge">INSUMOS OPERACIONAIS</span>
              <h3>Parâmetros Físicos</h3>
              <p>Mova os controles abaixo conforme as especificidades atuais do seu negócio rural:</p>

              {/* Slider 1: Herd scale */}
              <div className="input-group-slider">
                <div className="slider-header">
                  <span>Tamanho do Rebanho Ativo:</span>
                  <strong>{herdScale.toLocaleString('pt-BR')} Cabeças</strong>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="12000" 
                  step="100" 
                  value={herdScale} 
                  onChange={(e) => setHerdScale(parseInt(e.target.value))}
                  className="premium-slider-green"
                />
              </div>

              {/* Slider 2: Hectares */}
              <div className="input-group-slider">
                <div className="slider-header">
                  <span>Área Produtiva Total:</span>
                  <strong>{farmSize.toLocaleString('pt-BR')} Hectares</strong>
                </div>
                <input 
                  type="range" 
                  min="500" 
                  max="30000" 
                  step="250" 
                  value={farmSize} 
                  onChange={(e) => setFarmSize(parseInt(e.target.value))}
                  className="premium-slider-green"
                />
              </div>

              {/* Slider 3: Fleet Machinery */}
              <div className="input-group-slider">
                <div className="slider-header">
                  <span>Frota de Maquinário Ativa:</span>
                  <strong>{fleetSize} Máquinas</strong>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="60" 
                  step="1" 
                  value={fleetSize} 
                  onChange={(e) => setFleetSize(parseInt(e.target.value))}
                  className="premium-slider-green"
                />
              </div>
            </div>

            {/* Output Ledger Document Page (Receipt Style) */}
            <div className="calculator-ledger-receipt">
              <div className="receipt-paper">
                <div className="receipt-header">
                  <span className="co-name">TAUZE INTELLIGENCE SYSTEMS</span>
                  <span className="doc-type">DIMENSIONAMENTO DE CAPITAL // ROI</span>
                  <span className="doc-date">GERADO EM: 2026-05-22</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-lines">
                  <div className="receipt-line-item">
                    <span>Otimização RFID (Proteção de Perda de Peso)</span>
                    <strong className="text-positive">+ R$ {Math.round(rfidSavings).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="receipt-line-item">
                    <span>Combustível Otimizado via Telemetria</span>
                    <strong className="text-positive">+ R$ {Math.round(fleetSavings).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="receipt-line-item">
                    <span>Eficiência Operacional & Integração de Notas</span>
                    <strong className="text-positive">+ R$ {Math.round(farmSize * 22.4).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="receipt-line-item text-muted font-sm">
                    <span>Blindagem Derivativos B3 (Piso Lockout)</span>
                    <span>100% Coberto</span>
                  </div>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-total-row">
                  <span>RETORNO ANUAL ESTIMADO</span>
                  <span className="total-value">R$ {totalAnnualSavings.toLocaleString('pt-BR')}</span>
                </div>

                <div className="receipt-divider"></div>

                <div className="receipt-footer">
                  <div className="receipt-stamp-gold">
                    <Award size={16} />
                    <span>AUDITORIA APROVADA</span>
                  </div>
                  <p>Valores baseados em médias de performance real de clientes ativos Tauze.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- ELEGANT FAQ ACCORDION -------------------- */}
      <section className="elegant-faq-section">
        <div className="container-narrowed">
          <div className="section-header-centered">
            <span className="section-kpi-badge">SUPORTE E TRANSPARÊNCIA</span>
            <h2>Especificações & Dúvidas Frequentes</h2>
            <p>
              Tudo o que você precisa saber sobre a implementação da matriz de governança inteligente do <strong>tauze</strong>.
            </p>
          </div>

          <div className="faq-accordion">
            {[
              {
                q: "A balança RFID precisa de conexão constante com a internet?",
                a: "Não. A balança de passagem Tauze foi desenhada para operar de forma 100% autônoma e offline-first. Ela armazena as pesagens e os IDs dos brincos RFID localmente no hardware embarcado e sincroniza os dados via protocolo LoraWAN assim que detecta o canal local operacional."
              },
              {
                q: "O que é o isolamento de tenant em banco de dados?",
                a: "A maioria das plataformas de software utiliza bancos compartilhados (multi-tenant) onde um único banco de dados contém registros de todos os clientes. No Tauze, cada contratante tem sua partição física ou servidor de banco de dados isolado com criptografia própria AES-256-GCM. Seus dados contábeis, notas de compra e margem de hedge nunca residem no mesmo espaço lógico de terceiros."
              },
              {
                q: "A implantação do sistema exige a troca de maquinário ou brincos?",
                a: "Absolutamente não. Nossos sensores de telemetria e leitores de antena são universais e compatíveis com a maioria das marcas de maquinário agrícola e padrões de identificação bovina do mercado (padrões ISO 11784 e 11785)."
              },
              {
                q: "Como funciona a trava de Hedge B3 integrada?",
                a: "Conectamos sua estimativa física de produção e GMD (Ganho Médio Diário) diretamente à nossa mesa de derivativos. Quando o rebanho se aproxima do peso de abate, a plataforma sugere e automatiza a trava de preços B3, estabelecendo um piso seguro de venda."
              }
            ].map((faq, idx) => (
              <div 
                key={idx} 
                className={`faq-card ${faqOpen === idx ? 'expanded' : ''}`}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="faq-question-header">
                  <strong>{faq.q}</strong>
                  <ChevronDown size={18} className="chevron-icon" />
                </div>
                <div className="faq-answer-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- SPECIFICATIONS TECHNICAL GRID (FOOTER INDEX) -------------------- */}
      <section id="especificacoes" className="technical-specs-section">
        <div className="container-large">
          <div className="specs-table-box">
            <span className="specs-tag">INDEX TÉCNICO</span>
            <h3>Ficha de Especificações Técnicas</h3>
            <p className="specs-subtitle font-sm">Abaixo das interfaces elegantes, opera um sistema de engenharia robusta:</p>
            
            <div className="specs-grid">
              <div className="spec-row">
                <span className="label">CONEXÃO OFF-GRID</span>
                <span className="value">Sincronização offline-first inteligente via LoraWAN (915 MHz)</span>
              </div>
              <div className="spec-row">
                <span className="label">CRIPTOGRAFIA DE ARQUIVOS</span>
                <span className="value">Criptografia simétrica de ponta a ponta AES-256-GCM</span>
              </div>
              <div className="spec-row">
                <span className="label">PADRÃO RFID LEITURA</span>
                <span className="value">Suporte universal a brincos e botões ISO 11784 / 11785 (HDX/FDX-B)</span>
              </div>
              <div className="spec-row">
                <span className="label">ISOLAMENTO FISCAL</span>
                <span className="value">Database físico isolado por tenant, impossibilitando vazamento cruzado</span>
              </div>
              <div className="spec-row">
                <span className="label">INTEGRAÇÃO DERIVATIVOS</span>
                <span className="value">API de conexão em tempo real com corretoras credenciadas B3</span>
              </div>
              <div className="spec-row">
                <span className="label">UPTIME COMPUTACIONAL</span>
                <span className="value">99,95% garantido em contrato através de redundância regional</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- BRAND FOOTER -------------------- */}
      <footer className="brand-footer">
        <div className="footer-container">
          <div className="footer-brand-side">
            <div className="footer-logo">
              <TauzeLogo size={42} />
              <span className="footer-title">tauze</span>
            </div>
            <p className="footer-desc">
              Arquitetando a governança física e digital do agro moderno.
            </p>
          </div>

          <div className="footer-links-side">
            <div className="links-col">
              <h4>Plataforma</h4>
              <a href="#solucoes">Integrações</a>
              <a href="#soberania">Soberania</a>
              <a href="#calculadora">Simulador ROI</a>
            </div>
            <div className="links-col">
              <h4>Segurança</h4>
              <span className="footer-text-badge">AES-256 Ativa</span>
              <span className="footer-text-badge">Isolated Tenant</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 Tauze Intelligence Systems. Todos os direitos reservados. Soberania e integridade de ponta a ponta no agronegócio.</p>
        </div>
      </footer>

      {/* -------------------- EMBEDDED LUXURY SYSTEM DESIGN -------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-premium-journal {
          /* Color Design Tokens */
          --bg-canvas: #faf9f6;          /* Luxurious warm off-white alabaster */
          --bg-card: rgba(255, 255, 255, 0.85); /* Premium clean glass */
          --text-main: #131c16;          /* Deep obsidian carbon text */
          --text-muted: #4e5651;         /* Warm readability graphite */
          --accent: #00b865;             /* Signature vibrant emerald */
          --accent-hover: #009953;
          --gold: #c5a880;               /* Soft warm luxury gold/brass */
          --gold-light: rgba(197, 160, 115, 0.08);
          --border-premium: rgba(197, 160, 115, 0.22); /* Gold hairline border */
          --border-light: rgba(19, 28, 22, 0.06);     /* Micro hairline border */
          --shadow-luxe: 0 25px 50px rgba(19, 28, 22, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          
          background-color: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          position: relative;
          scroll-behavior: smooth;
        }

        /* Helpers */
        .text-positive { color: var(--accent); }
        .text-negative { color: #ff5f56; }
        .text-gold { color: var(--gold); }
        .font-sm { font-size: 0.85rem; }

        /* --- TICKER BAR --- */
        .commodity-ticker-bar {
          background: #0f1411;
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .ticker-scroll {
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .ticker-track {
          display: flex;
          animation: infiniteTicker 32s linear infinite;
        }

        @keyframes infiniteTicker {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          margin-right: 48px;
          letter-spacing: 0.03em;
          color: rgba(255, 255, 255, 0.75);
        }

        .ticker-dot {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
        }

        /* --- ELEGANT NAV BAR --- */
        .premium-nav {
          position: fixed;
          top: 38px;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 86px;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-bottom: 1px solid transparent;
        }

        .premium-nav.nav-scrolled {
          background: rgba(250, 249, 246, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 72px;
          border-bottom: 1px solid var(--border-premium);
          box-shadow: 0 10px 30px rgba(19, 28, 22, 0.02);
        }

        .nav-container {
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-details {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .brand-title {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.6rem;
          letter-spacing: -0.04em;
          color: var(--text-main);
          line-height: 1;
        }

        .brand-version {
          font-family: 'Outfit', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.12em;
          margin-top: 2px;
        }

        .nav-links {
          display: flex;
          gap: 36px;
        }

        .nav-links a {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.25s;
        }

        .nav-links a:hover {
          color: var(--text-main);
        }

        .nav-btn-terminal {
          background: var(--text-main);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
          border: 1px solid transparent;
        }

        .nav-btn-terminal:hover {
          background: #000000;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(19, 28, 22, 0.08);
        }

        /* --- JOURNAL HERO --- */
        .journal-hero {
          position: relative;
          padding: 200px 24px 100px 24px;
          min-height: 80vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .hero-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(var(--border-premium) 1px, transparent 1px), 
            radial-gradient(var(--border-premium) 1px, transparent 1px);
          background-size: 40px 40px;
          background-position: 0 0, 20px 20px;
          opacity: 0.25;
          z-index: 1;
        }

        .hero-radial-gradient {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.04) 0%, transparent 70%);
          z-index: 1;
        }

        .hero-content {
          position: relative;
          z-index: 2;
          max-width: 900px;
        }

        .hero-meta-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--border-premium);
          padding: 8px 16px;
          border-radius: 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-main);
          margin-bottom: 28px;
          box-shadow: 0 4px 12px rgba(19, 28, 22, 0.02);
        }

        .hero-headline {
          font-family: 'Lora', serif;
          font-size: 3.8rem;
          font-weight: 500;
          line-height: 1.15;
          color: var(--text-main);
          letter-spacing: -0.02em;
          margin-bottom: 24px;
        }

        .hero-subline {
          font-size: 1.15rem;
          line-height: 1.7;
          color: var(--text-muted);
          max-width: 720px;
          margin: 0 auto 36px auto;
        }

        .hero-actions {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .btn-hero-primary {
          background: var(--accent);
          color: #ffffff;
          padding: 16px 28px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.15);
        }

        .btn-hero-primary:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 184, 101, 0.22);
        }

        .btn-hero-secondary {
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-main);
          border: 1px solid var(--border-premium);
          padding: 16px 28px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s;
        }

        .btn-hero-secondary:hover {
          background: hsl(var(--bg-card));
          border-color: var(--gold);
          transform: translateY(-2px);
        }

        .hero-specs-highlight {
          position: relative;
          z-index: 2;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1100px;
          width: 100%;
          margin: 64px auto 0 auto;
          border-top: 1px solid var(--border-premium);
          padding-top: 40px;
        }

        .highlight-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          text-align: left;
        }

        .highlight-item .num {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 300;
          color: var(--gold);
          line-height: 1;
        }

        .highlight-item strong {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
        }

        .highlight-item span {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* --- INTERACTIVE STUDIO GRID --- */
        .interactive-hub-section {
          padding: 100px 24px;
          max-width: 1240px;
          margin: 0 auto;
        }

        .section-header-centered {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 56px auto;
        }

        .section-kpi-badge {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--gold);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .section-header-centered h2 {
          font-family: 'Lora', serif;
          font-size: 2.4rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }

        .section-header-centered p {
          color: var(--text-muted);
          line-height: 1.6;
        }

        .interactive-tabs-card {
          background: var(--bg-card);
          border: 1px solid var(--border-premium);
          border-radius: 16px;
          padding: 24px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          box-shadow: var(--shadow-luxe);
        }

        .interactive-selector-aside {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .aside-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          text-transform: uppercase;
          padding-left: 12px;
          margin-bottom: 4px;
        }

        .select-btn {
          position: relative;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .select-btn .btn-icon {
          background: rgba(19, 28, 22, 0.04);
          color: var(--text-muted);
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .select-btn .btn-texts strong {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
          transition: color 0.3s;
        }

        .select-btn .btn-texts span {
          display: block;
          font-size: 0.76rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        /* Hover & Active Button Styles */
        .select-btn:hover {
          background: rgba(255, 255, 255, 0.5);
          border-color: rgba(197, 160, 115, 0.15);
        }

        .select-btn.active {
          background: hsl(var(--bg-card));
          border-color: var(--border-premium);
          box-shadow: 0 10px 30px rgba(19, 28, 22, 0.02);
        }

        .select-btn.active .btn-icon {
          background: var(--gold-light);
          color: var(--accent);
        }

        .select-btn.active .btn-texts strong {
          color: var(--accent);
        }

        /* Interactive Display Frame (Mac Style) */
        .interactive-display-pane {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 360px;
          box-shadow: inset 0 0 40px rgba(19, 28, 22, 0.01);
        }

        .pane-header-mac {
          background: #FAF8F4;
          height: 40px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
        }

        .dots-row {
          display: flex;
          gap: 6px;
        }

        .dots-row span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-red { background: #ff5f56; }
        .dot-yellow { background: #ffbd2e; }
        .dot-green { background: #27c93f; }

        .pane-title-address {
          font-family: monospace;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .status-live-pill {
          background: var(--gold-light);
          color: var(--gold);
          border: 1px solid var(--border-premium);
          font-size: 0.62rem;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 12px;
          letter-spacing: 0.05em;
        }

        .pane-content-area {
          flex: 1;
          padding: 24px;
          display: flex;
          align-items: stretch;
        }

        .tab-fade-in {
          animation: fadeEffect 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }

        @keyframes fadeEffect {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- SUB-COMPONENTS SIMULATORS --- */
        .simulator-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
          align-items: center;
          height: 100%;
        }

        .sim-visualization {
          background: #FAF9F6;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          height: 100%;
          min-height: 280px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }

        /* 1. RFID Simulator */
        .isometric-corral {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
        }

        .vector-isometric {
          width: 100%;
          max-height: 200px;
        }

        .scale-indicator-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-premium);
          border-radius: 8px;
          padding: 12px 16px;
          box-shadow: 0 8px 20px rgba(19, 28, 22, 0.02);
          text-align: left;
        }

        .scale-indicator-card .lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .weight-display {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .weight-display strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-main);
          transition: color 0.2s;
        }

        .weight-display strong.text-weighing {
          color: var(--accent);
          animation: digitBlink 0.15s infinite alternate;
        }

        @keyframes digitBlink {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        .weight-display .unit {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-left: 2px;
        }

        .weight-display .status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--accent);
        }

        .live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: heartBeat 1.8s infinite;
        }

        @keyframes heartBeat {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        .sim-controls-panel {
          text-align: left;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .sim-controls-panel .pnl-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .sim-controls-panel h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 12px;
          line-height: 1.25;
        }

        .sim-controls-panel p {
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .animal-tag-selector .lbl-selector {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-main);
          display: block;
          margin-bottom: 8px;
        }

        .tag-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .tag-btn {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.25s;
        }

        .tag-btn strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          color: var(--text-main);
        }

        .tag-btn span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .tag-btn:hover {
          border-color: var(--gold);
        }

        .tag-btn.active {
          border-color: var(--accent);
          background: var(--gold-light);
        }

        .tag-btn.active strong {
          color: var(--accent);
        }

        .mini-stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          border-top: 1px solid var(--border-light);
          padding-top: 16px;
        }

        .mini-stat {
          background: rgba(255, 255, 255, 0.4);
          border: 1px solid var(--border-light);
          padding: 8px 12px;
          border-radius: 6px;
        }

        .mini-stat .stat-label {
          display: block;
          font-size: 0.65rem;
          color: var(--text-muted);
          margin-bottom: 4px;
        }

        .mini-stat strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          color: var(--text-main);
        }

        /* 2. Telemetry mapping */
        .map-view-deck {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
        }

        .vector-topo-map {
          width: 100%;
          max-height: 200px;
        }

        .telemetry-live-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-premium);
          border-radius: 8px;
          padding: 10px 14px;
        }

        .telemetry-live-card .lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
          text-align: left;
        }

        .telemetry-meta {
          display: flex;
          justify-content: space-between;
          text-align: left;
        }

        .telemetry-meta .sub-lbl {
          display: block;
          font-size: 0.6rem;
          color: var(--text-muted);
        }

        .telemetry-meta strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .map-zone-selector .lbl-selector {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-main);
          display: block;
          margin-bottom: 8px;
        }

        .zone-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }

        .zone-btn {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.25s;
        }

        .zone-btn strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
        }

        .zone-btn span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .zone-btn:hover {
          border-color: var(--gold);
        }

        .zone-btn.active {
          border-color: var(--gold);
          background: var(--gold-light);
        }

        .zone-btn.active strong {
          color: var(--gold);
        }

        /* 3. Hedge Derivativos */
        .hedge-chart-card {
          width: 100%;
          padding: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .chart-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .chart-title-row .title-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .chart-title-row .prm-stamp {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
        }

        .vector-chart-container {
          position: relative;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 6px;
          padding: 10px;
          min-height: 150px;
        }

        .price-strike-label {
          position: absolute;
          left: 10px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--gold);
          background: hsl(var(--bg-card));
          padding: 2px 6px;
          border: 1px solid var(--border-premium);
          border-radius: 4px;
          box-shadow: 0 4px 10px rgba(19, 28, 22, 0.02);
          transition: bottom 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .slider-box-hedge {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          margin-bottom: 20px;
          text-align: left;
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.74rem;
          margin-bottom: 8px;
        }

        .slider-label-row strong {
          color: var(--accent);
        }

        .premium-slider-green {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--border-premium);
          outline: none;
        }

        .premium-slider-green::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(19, 28, 22, 0.15);
          transition: transform 0.1s;
        }

        .premium-slider-green::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        /* --- SOVEREIGNTY ARCHITECTURE BLUEPRINT --- */
        .sovereignty-blueprint-section {
          padding: 100px 24px;
          background: #FAF9F6;
          border-top: 1px solid var(--border-premium);
          border-bottom: 1px solid var(--border-premium);
        }

        .container-narrowed {
          max-width: 1040px;
          margin: 0 auto;
        }

        .blueprint-comparative-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-top: 56px;
        }

        .blueprint-card {
          background: hsl(var(--bg-card));
          border-radius: 16px;
          padding: 32px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .blueprint-card.shared-architecture {
          border: 1px solid rgba(255, 95, 86, 0.15);
        }

        .blueprint-card.sovereign-architecture {
          border: 2px solid var(--border-premium);
        }

        .card-badge {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          padding: 4px 10px;
          border-radius: 4px;
          margin-bottom: 16px;
        }

        .card-badge.red-alert {
          background: rgba(255, 95, 86, 0.08);
          color: #ff5f56;
        }

        .card-badge.green-success {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
        }

        .blueprint-card h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.3rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .blueprint-card p {
          font-size: 0.88rem;
          line-height: 1.5;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .vector-container-schema {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 24px;
        }

        .schema-svg {
          width: 100%;
          max-height: 140px;
        }

        .bullet-points {
          display: flex;
          flex-direction: column;
          gap: 10px;
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .bullet {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        /* --- ROI CALCULATOR LEDGER --- */
        .roi-calculator-section {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .calculator-layout-split {
          display: grid;
          grid-template-columns: 1fr 480px;
          gap: 40px;
          align-items: stretch;
          margin-top: 48px;
        }

        .calculator-sliders-panel {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-premium);
          border-radius: 16px;
          padding: 36px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .calculator-sliders-panel h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .calculator-sliders-panel p {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 32px;
        }

        .input-group-slider {
          margin-bottom: 28px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 10px;
        }

        .slider-header strong {
          color: var(--accent);
        }

        /* Vintage Paper Ledger Style */
        .calculator-ledger-receipt {
          perspective: 1000px;
        }

        .receipt-paper {
          background: #fdfcf9;
          border: 1px solid #e8e3d5;
          box-shadow: 0 30px 60px rgba(28, 24, 20, 0.05), inset 0 0 100px rgba(197, 160, 115, 0.03);
          padding: 40px;
          border-radius: 4px;
          text-align: left;
          position: relative;
          background-image: 
            linear-gradient(rgba(197, 160, 115, 0.05) 1px, transparent 1px);
          background-size: 100% 28px;
        }

        .receipt-header {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 24px;
        }

        .receipt-header .co-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }

        .receipt-header .doc-type {
          font-family: 'Lora', serif;
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .receipt-header .doc-date {
          font-family: monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .receipt-divider {
          border-top: 1px dashed rgba(197, 160, 115, 0.4);
          margin: 16px 0;
        }

        .receipt-lines {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 24px 0;
        }

        .receipt-line-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .receipt-line-item span {
          color: var(--text-muted);
          max-width: 260px;
        }

        .receipt-line-item strong {
          font-family: 'Outfit', sans-serif;
          color: var(--text-main);
        }

        .receipt-total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 24px 0;
        }

        .receipt-total-row span {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: 0.05em;
        }

        .receipt-total-row .total-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--accent);
        }

        .receipt-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          border-top: 1px solid rgba(19, 28, 22, 0.05);
          padding-top: 24px;
        }

        .receipt-stamp-gold {
          border: 2px double var(--gold);
          color: var(--gold);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          transform: rotate(-6deg);
        }

        .receipt-footer p {
          font-size: 0.62rem;
          color: var(--text-muted);
          max-width: 180px;
          line-height: 1.4;
          text-align: right;
        }

        /* --- FAQ ACCORDION --- */
        .elegant-faq-section {
          padding: 100px 24px;
          background: hsl(var(--bg-card));
          border-top: 1px solid var(--border-premium);
        }

        .faq-accordion {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 48px;
        }

        .faq-card {
          background: var(--bg-canvas);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .faq-question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faq-question-header strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.98rem;
          color: var(--text-main);
        }

        .faq-card .chevron-icon {
          color: var(--text-muted);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-answer-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-answer-content p {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--text-muted);
          padding-top: 16px;
          margin: 0;
        }

        /* Expanded States */
        .faq-card.expanded {
          border-color: var(--gold);
          background: hsl(var(--bg-card));
          box-shadow: 0 15px 35px rgba(19, 28, 22, 0.02);
        }

        .faq-card.expanded .chevron-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-card.expanded .faq-answer-content {
          max-height: 200px;
        }

        /* --- TECHNICAL INDEX SPECIFICATIONS --- */
        .technical-specs-section {
          padding: 80px 24px;
          background: #faf9f6;
          border-top: 1px solid var(--border-premium);
        }

        .container-large {
          max-width: 1200px;
          margin: 0 auto;
        }

        .specs-table-box {
          border: 1px solid var(--border-premium);
          background: hsl(var(--bg-card));
          border-radius: 12px;
          padding: 40px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
        }

        .specs-tag {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 12px;
        }

        .specs-table-box h3 {
          font-family: 'Lora', serif;
          font-size: 1.8rem;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .specs-subtitle {
          color: var(--text-muted);
          margin-bottom: 32px;
          display: block;
        }

        .specs-grid {
          display: grid;
          grid-template-columns: 1fr;
          border-top: 1px solid var(--border-light);
        }

        .spec-row {
          display: grid;
          grid-template-columns: 240px 1fr;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
          align-items: center;
        }

        .spec-row .label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .spec-row .value {
          font-size: 0.88rem;
          color: var(--text-main);
          font-weight: 500;
        }

        /* --- FOOTER --- */
        .brand-footer {
          background: #0f1411;
          color: #ffffff;
          padding: 80px 24px 40px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 48px;
          margin-bottom: 32px;
        }

        .footer-brand-side {
          max-width: 320px;
          text-align: left;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .footer-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #ffffff;
        }

        .footer-desc {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .footer-links-side {
          display: flex;
          gap: 64px;
          text-align: left;
        }

        .links-col {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .links-col h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .links-col a {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.25s;
        }

        .links-col a:hover {
          color: var(--accent);
        }

        .footer-text-badge {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-family: monospace;
          display: inline-block;
          margin-bottom: 4px;
        }

        .footer-bottom {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* --- RESPONSIVENESS AND LAYOUT ALIGNMENT --- */
        @media (max-width: 991px) {
          .hero-headline {
            font-size: 2.8rem;
          }
          
          .interactive-tabs-card {
            grid-template-columns: 1fr;
          }

          .blueprint-comparative-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .calculator-layout-split {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .calculator-ledger-receipt {
            max-width: 480px;
            margin: 0 auto;
          }

          .hero-specs-highlight {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .spec-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }

        @media (max-width: 576px) {
          .hero-headline {
            font-size: 2.2rem;
          }

          .nav-links {
            display: none;
          }

          .hero-actions {
            flex-direction: column;
            gap: 12px;
          }

          .btn-hero-primary, .btn-hero-secondary {
            width: 100%;
            justify-content: center;
          }

          .simulator-grid {
            grid-template-columns: 1fr;
          }

          .receipt-paper {
            padding: 20px;
          }

          .footer-container {
            flex-direction: column;
            gap: 32px;
          }
        }
      `}</style>
    </div>
  );
};
