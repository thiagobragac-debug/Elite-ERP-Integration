import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  DollarSign, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  Check, 
  Cpu, 
  BarChart3, 
  Lock,
  ChevronDown,
  RefreshCw,
  Server,
  Layers,
  ChevronRight,
  TrendingUp,
  FileSpreadsheet,
  Eye,
  Wifi,
  ShieldAlert,
  Award,
  ArrowUpRight
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
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Configurator dynamic states
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(true);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(1200);
  const [userLicenses, setUserLicenses] = useState(8);

  // 1. Soberania: Security scan state
  const [isSecurityScanning, setIsSecurityScanning] = useState(false);
  const [securityLogs, setSecurityLogs] = useState<string[]>([
    "SISTEMA PRONTO: Canal de dados isolado e encriptado.",
    "Chaves AES-256-GCM sincronizadas por tenant.",
    "Pressione 'Iniciar Varredura' para auditar chaves físicas."
  ]);

  // 2. Pecuária: Active Lot selector
  const [activeLot, setActiveLot] = useState<'norte' | 'central' | 'sul'>('norte');

  // 3. Telemetria: Vehicle simulation path
  const [isFleetSimulating, setIsFleetSimulating] = useState(false);
  const [fleetProgress, setFleetProgress] = useState(0);

  // 4. Hedge: Protection state
  const [isHedgeActive, setIsHedgeActive] = useState(true);

  // Calculate pricing & ROI metrics
  const basePecuaria = includePecuaria ? 399 : 0;
  const baseFrotas = includeFrotas ? 299 : 0;
  const baseHedge = includeHedge ? 499 : 0;
  const scaleSurcharge = includePecuaria ? Math.round(herdScale * 0.12) : 0;
  const licenseSurcharge = userLicenses * 20;

  const subtotal = basePecuaria + baseFrotas + baseHedge + scaleSurcharge + licenseSurcharge;
  const selectedCount = [includePecuaria, includeFrotas, includeHedge].filter(Boolean).length;
  const discountMultiplier = selectedCount === 3 ? 0.8 : selectedCount === 2 ? 0.9 : 1.0;
  const finalPrice = Math.round(subtotal * discountMultiplier);

  // ROI: R$ 45 estimated per animal head weight optimizations + fleet logistics improvements
  const estimatedSavings = Math.round((herdScale * 48) + (includeFrotas ? 42000 : 0));

  // Ticker and scroll detector hooks
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Soberania simulation intervals
  const scanIntervalRef = useRef<any | null>(null);
  const startSecurityScan = () => {
    if (isSecurityScanning) return;
    setIsSecurityScanning(true);
    setSecurityLogs(["[INICIANDO AUDITORIA DE CRIPTOGRAFIA]..."]);
    
    let step = 0;
    const steps = [
      "[AUDIT] Isolamento físico de Tenant certificado com sucesso.",
      "[CRYPT] Rotacionando par de chaves assimétricas SHA-256...",
      "[SECURITY] Chaves rotacionadas com sucesso (AES-256-GCM).",
      "[AUDIT] Nenhum vazamento ou pool compartilhado de dados detectado.",
      "[OK] Varredura completa. Governança soberana 100% íntegra."
    ];

    scanIntervalRef.current = setInterval(() => {
      if (step < steps.length) {
        setSecurityLogs(prev => [...prev, steps[step]]);
        step++;
      } else {
        setIsSecurityScanning(false);
        if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
      }
    }, 1200);
  };

  // Telemetria Fleet Route Simulation
  useEffect(() => {
    let interval: any;
    if (isFleetSimulating) {
      interval = setInterval(() => {
        setFleetProgress(prev => {
          if (prev >= 100) {
            setIsFleetSimulating(false);
            return 0;
          }
          return prev + 2.5;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isFleetSimulating]);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    };
  }, []);

  return (
    <div className="tauze-bento-canvas">

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

      {/* -------------------- GORGEOUS FLOATING NAVBAR -------------------- */}
      <nav className={`navbar-elegant ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="brand-logo-group">
            <div className="logo-badge">
              <TauzeLogo size={34} />
            </div>
            <div className="brand-titles">
              <span className="brand-name">tauze</span>
              <span className="brand-edition">Sovereign Edition</span>
            </div>
          </div>

          <div className="navbar-links-group">
            <a href="#hero-stage">Início</a>
            <a href="#bento-matrix">Canvas de Inteligência</a>
            <a href="#sec-faq">Dúvidas</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-terminal-sec">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- ELEGANT HERO STAGE -------------------- */}
      <header id="hero-stage" className="hero-editorial-stage">
        <div className="hero-radial-backdrop"></div>
        <div className="hero-content-wrapper">
          <span className="hero-badge-tag">
            <Sparkles size={11} className="badge-glow-icon" />
            <span>Conceito Bento Canvas // Alta Governança</span>
          </span>

          <h1 className="hero-main-title">
            Sua operação agropecuária governada sob um único canvas de inteligência.
          </h1>

          <p className="hero-main-desc">
            Abaixo da complexidade, reside a clareza. Integramos telemetria offline-first, rastreabilidade RFID e blindagem financeira em uma matriz interativa de alta performance física e digital.
          </p>

          <div className="hero-actions-container">
            <a href="#bento-matrix" className="btn-primary-editorial">
              <span>Explorar Matriz Bento</span>
              <ArrowRight size={16} />
            </a>
            <Link to="/login" className="btn-secondary-editorial">
              <span>Acessar Terminal Pro</span>
            </Link>
          </div>
        </div>
      </header>

      {/* -------------------- BENTO INTELLIGENCE MATRIX -------------------- */}
      <main id="bento-matrix" className="bento-matrix-container">
        <div className="bento-grid-header">
          <span className="bento-sub">MATRIZ INTERATIVA</span>
          <h2 className="bento-title">Controle Absoluto de Ponta a Ponta</h2>
          <p className="bento-desc">
            Clique nas ferramentas, arraste os controles e interaja diretamente com cada módulo do ecossistema do <strong>tauze</strong> abaixo.
          </p>
        </div>

        <div className="bento-matrix-grid">
          
          {/* TILE 1: SOBERANIA (Encrypted Vault Simulator) */}
          <div className="bento-card span-2 card-soberania">
            <div className="bento-badge-node">01 // SOBERANIA</div>
            <div className="bento-text-area">
              <h3>Isolamento Físico de Banco de Dados</h3>
              <p>Segurança máxima com exclusão completa de pools compartilhados. Cada cliente opera em um servidor e banco dedicados e encriptados.</p>
            </div>

            <div className="vault-simulator-widget">
              <div className="vault-chassis">
                <div className="chassis-header">
                  <span className="chassis-title">tauze-security-vault.sys</span>
                  <div className="chassis-indicators">
                    <span className="chassis-dot red"></span>
                    <span className="chassis-dot yellow"></span>
                    <span className="chassis-dot green"></span>
                  </div>
                </div>
                
                <div className="vault-body">
                  <div className="database-silos">
                    <div className="silo-block inactive">
                      <Server size={20} className="silo-icon" />
                      <span>Tenant B</span>
                      <div className="lock-indicator locked"><Lock size={10} /> LOCK</div>
                    </div>
                    <div className="silo-block active-tenant">
                      <Server size={24} className="silo-icon text-emerald" />
                      <strong className="text-emerald">SUA FAZENDA</strong>
                      <div className="lock-indicator unlocked"><ShieldCheck size={10} /> ENCRYPTED</div>
                    </div>
                    <div className="silo-block inactive">
                      <Server size={20} className="silo-icon" />
                      <span>Tenant C</span>
                      <div className="lock-indicator locked"><Lock size={10} /> LOCK</div>
                    </div>
                  </div>

                  <div className="console-display">
                    <span className="console-header-lbl">CONSOLE DE AUDITORIA CRIPTOGRÁFICA</span>
                    <div className="console-lines">
                      {securityLogs.map((log, index) => (
                        <div key={index} className="console-line">
                          <span className="console-prompt">&gt;</span>
                          <span className="console-txt">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="vault-controls">
                <button 
                  className={`btn-widget-action ${isSecurityScanning ? 'loading' : ''}`}
                  onClick={startSecurityScan}
                  disabled={isSecurityScanning}
                >
                  <RefreshCw size={12} className={isSecurityScanning ? 'spin-status-icon' : ''} />
                  <span>{isSecurityScanning ? 'Varrendo chaves...' : 'Iniciar Varredura Criptográfica'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TILE 2: RFID PECUÁRIA (Spline curve & Active Lote) */}
          <div className="bento-card span-1 card-pecuaria">
            <div className="bento-badge-node text-emerald">02 // PECUÁRIA RFID</div>
            <div className="bento-text-area">
              <h3>Balança de Passagem Inteligente</h3>
              <p>Mapeamento voluntário no bebedouro. Coleta automática de peso e cálculo preciso de Ganho Médio Diário (GMD).</p>
            </div>

            <div className="pecuaria-chart-widget">
              <div className="lot-selector-tabs">
                <button 
                  className={activeLot === 'norte' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setActiveLot('norte')}
                >
                  Pasto Norte
                </button>
                <button 
                  className={activeLot === 'central' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setActiveLot('central')}
                >
                  Recinto 04
                </button>
                <button 
                  className={activeLot === 'sul' ? 'tab-btn active' : 'tab-btn'} 
                  onClick={() => setActiveLot('sul')}
                >
                  Pasto Sul
                </button>
              </div>

              <div className="chart-preview-box">
                <svg viewBox="0 0 260 120" className="spline-chart-svg">
                  {/* Grid Lines */}
                  <line x1="10" y1="20" x2="250" y2="20" stroke="#f0ede4" strokeWidth="1" strokeDasharray="3" />
                  <line x1="10" y1="60" x2="250" y2="60" stroke="#f0ede4" strokeWidth="1" strokeDasharray="3" />
                  <line x1="10" y1="100" x2="250" y2="100" stroke="#f0ede4" strokeWidth="1" strokeDasharray="3" />
                  
                  {/* Dynamic spline curves based on active lot */}
                  {activeLot === 'norte' && (
                    <path 
                      d="M 10,105 Q 70,80 130,55 T 250,22" 
                      fill="none" 
                      stroke="#00b865" 
                      strokeWidth="2.5" 
                      className="dash-move-path" 
                    />
                  )}
                  {activeLot === 'central' && (
                    <path 
                      d="M 10,95 Q 80,95 140,45 T 250,38" 
                      fill="none" 
                      stroke="#00b865" 
                      strokeWidth="2.5" 
                      className="dash-move-path" 
                    />
                  )}
                  {activeLot === 'sul' && (
                    <path 
                      d="M 10,112 Q 60,95 120,75 T 250,52" 
                      fill="none" 
                      stroke="#00b865" 
                      strokeWidth="2.5" 
                      className="dash-move-path" 
                    />
                  )}

                  {/* Target Node */}
                  {activeLot === 'norte' && <circle cx="250" cy="22" r="5" fill="#00b865" className="pulse-slow" />}
                  {activeLot === 'central' && <circle cx="250" cy="38" r="5" fill="#00b865" className="pulse-slow" />}
                  {activeLot === 'sul' && <circle cx="250" cy="52" r="5" fill="#00b865" className="pulse-slow" />}

                  {/* Tooltip Overlay */}
                  <g transform="translate(115, 12)">
                    <rect width="68" height="20" rx="3" fill="#0c0d0d" />
                    <text x="34" y="13" fill="#ffffff" fontSize="7.5" fontFamily="monospace" textAnchor="middle">
                      {activeLot === 'norte' ? 'GMD: +1.48kg' : activeLot === 'central' ? 'GMD: +1.22kg' : 'GMD: +0.95kg'}
                    </text>
                  </g>
                </svg>
              </div>

              <div className="pecuaria-stats-grid">
                <div className="pec-stat">
                  <span className="lbl">Animais Lidos</span>
                  <strong>{activeLot === 'norte' ? '412 cab' : activeLot === 'central' ? '280 cab' : '504 cab'}</strong>
                </div>
                <div className="pec-stat">
                  <span className="lbl">Peso Médio</span>
                  <strong>{activeLot === 'norte' ? '492.4 kg' : activeLot === 'central' ? '518.2 kg' : '464.0 kg'}</strong>
                </div>
                <div className="pec-stat">
                  <span className="lbl">Abate Estimado</span>
                  <strong className="text-emerald">{activeLot === 'norte' ? '22 Dias' : activeLot === 'central' ? '12 Dias' : '38 Dias'}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* TILE 3: TELEMETRIA OFFLINE-FIRST (GPS tracker visual) */}
          <div className="bento-card span-1 card-telemetria">
            <div className="bento-badge-node">03 // TELEMETRIA</div>
            <div className="bento-text-area">
              <h3>Telemetria de Campo Offline-First</h3>
              <p>Mapeamento de frotas e consumo sem dependência de sinal celular. Armazenamento e sincronização local por rádio Lora.</p>
            </div>

            <div className="telemetry-widget">
              <div className="simulated-map">
                {/* Topographical styled grids */}
                <div className="grid-topo-lines"></div>
                <div className="grid-map-overlay"></div>
                
                {/* Route drawing */}
                <svg viewBox="0 0 200 120" className="map-vector-svg">
                  <path 
                    d="M 20,30 C 60,10 110,80 140,50 C 160,30 150,110 180,90" 
                    fill="none" 
                    stroke="rgba(0, 184, 101, 0.15)" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                  />
                  <path 
                    d="M 20,30 C 60,10 110,80 140,50 C 160,30 150,110 180,90" 
                    fill="none" 
                    stroke="#00b865" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeDasharray="200"
                    strokeDashoffset={200 - (200 * (fleetProgress / 100))}
                  />

                  {/* Pulsing indicator tractor */}
                  {fleetProgress > 0 && (
                    <circle 
                      cx={20 + (160 * (fleetProgress / 100))} 
                      cy={30 + (60 * (fleetProgress / 100))} 
                      r="6" 
                      fill="#0e3e29" 
                      stroke="#00b865" 
                      strokeWidth="2" 
                    />
                  )}
                </svg>

                <div className="widget-overlay-telemetry">
                  <span>TRATOR JD-4</span>
                  <strong>{isFleetSimulating ? 'TRANSMITINDO LORA' : 'AGUARDANDO SIMULAÇÃO'}</strong>
                </div>
              </div>

              <div className="telemetry-metrics">
                <div className="metric-row">
                  <span>Combustível instantâneo</span>
                  <strong>11.8 L/h</strong>
                </div>
                <div className="metric-row">
                  <span>Velocidade operacional</span>
                  <strong>14.2 km/h</strong>
                </div>
              </div>

              <div className="telemetry-actions">
                <button 
                  className={`btn-widget-action ${isFleetSimulating ? 'active' : ''}`}
                  onClick={() => setIsFleetSimulating(true)}
                  disabled={isFleetSimulating}
                >
                  <Truck size={12} />
                  <span>{isFleetSimulating ? 'Simulação Rodando...' : 'Iniciar Simulação de Rota'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* TILE 4: HEDGE & MERCADO B3 */}
          <div className="bento-card span-1 card-hedge">
            <div className="bento-badge-node">04 // MERCADO B3</div>
            <div className="bento-text-area">
              <h3>Hedge & Travamento de Margem</h3>
              <p>Integração inteligente com os índices futuros da bolsa. Proteção absoluta contra volatilidades sazonais do mercado.</p>
            </div>

            <div className="hedge-widget">
              <div className="hedge-graph-chassis">
                <div className="graph-meta">
                  <span>BGI (Boi Gordo B3)</span>
                  <strong className="tick-positive">R$ 285.50 / @</strong>
                </div>

                <div className="candlestick-area">
                  <svg viewBox="0 0 200 90" className="candle-svg">
                    {/* Safe Area highlight */}
                    {isHedgeActive && (
                      <rect x="0" y="0" width="200" height="42" fill="rgba(0, 184, 101, 0.06)" stroke="rgba(0,184,101,0.12)" strokeWidth="1" strokeDasharray="2" />
                    )}

                    {/* Stock trend chart representations */}
                    <line x1="20" y1="75" x2="20" y2="45" stroke="#ff5f56" strokeWidth="2" />
                    <rect x="15" y="55" width="10" height="15" fill="#ff5f56" />

                    <line x1="60" y1="65" x2="60" y2="35" stroke="#00b865" strokeWidth="2" />
                    <rect x="55" y="40" width="10" height="20" fill="#00b865" />

                    <line x1="100" y1="50" x2="100" y2="20" stroke="#00b865" strokeWidth="2" />
                    <rect x="95" y="25" width="10" height="20" fill="#00b865" />

                    <line x1="140" y1="40" x2="140" y2="15" stroke="#00b865" strokeWidth="2" />
                    <rect x="135" y="20" width="10" height="15" fill="#00b865" />

                    <line x1="180" y1="35" x2="180" y2="10" stroke="#00b865" strokeWidth="2" />
                    <rect x="175" y="15" width="10" height="15" fill="#00b865" />

                    {/* Target Safe Protection Line */}
                    {isHedgeActive && (
                      <line x1="0" y1="42" x2="200" y2="42" stroke="#00b865" strokeWidth="1.5" strokeDasharray="4" />
                    )}
                  </svg>
                  
                  {isHedgeActive && (
                    <div className="safe-margin-badge">
                      <ShieldCheck size={10} />
                      <span>MARGEM TRAVADA</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="hedge-toggles">
                <span className="lbl-status">Status da Blindagem</span>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={isHedgeActive} 
                    onChange={(e) => setIsHedgeActive(e.target.checked)} 
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          {/* TILE 5: CONFIGURADOR DILIGENTE & ROI (Double Grid Tile) */}
          <div className="bento-card span-2 card-configurador">
            <div className="bento-badge-node text-emerald">05 // SIMULADOR E ECONOMIA</div>
            
            <div className="configurador-split-box">
              {/* Sliders and Toggles form */}
              <div className="config-form-pane">
                <div className="config-text-lead">
                  <h3>Dimensionador de Retorno e Escala</h3>
                  <p>Adicione módulos de telemetria física, amplie as licenças de gestão e veja a estimativa de governança e faturamento pro-forma.</p>
                </div>

                <div className="config-form-group">
                  <span className="lbl-primary">1. Selecione os Módulos Operacionais</span>
                  <div className="modules-check-box">
                    <label className={`check-card-node ${includePecuaria ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={includePecuaria} 
                        onChange={(e) => setIncludePecuaria(e.target.checked)} 
                      />
                      <Cpu size={14} className="icon-mod" />
                      <div className="check-details">
                        <strong>Pecuária RFID</strong>
                        <span>Pesagens e GMD automáticos</span>
                      </div>
                    </label>

                    <label className={`check-card-node ${includeFrotas ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={includeFrotas} 
                        onChange={(e) => setIncludeFrotas(e.target.checked)} 
                      />
                      <Truck size={14} className="icon-mod" />
                      <div className="check-details">
                        <strong>Telemetria Frota</strong>
                        <span>Offline-First geolocalização</span>
                      </div>
                    </label>

                    <label className={`check-card-node ${includeHedge ? 'active' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={includeHedge} 
                        onChange={(e) => setIncludeHedge(e.target.checked)} 
                      />
                      <TrendingUp size={14} className="icon-mod" />
                      <div className="check-details">
                        <strong>Blindagem B3</strong>
                        <span>Indexador e trava de hedge</span>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="config-form-group">
                  <div className="slider-header">
                    <span className="lbl-primary">2. Rebanho Ativo</span>
                    <strong className="slider-live-value">{herdScale.toLocaleString()} cabeças</strong>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="10000" 
                    step="50" 
                    value={herdScale} 
                    onChange={(e) => setHerdScale(Number(e.target.value))} 
                    className="slider-range-input"
                  />
                  <div className="slider-limits">
                    <span>100 cab</span>
                    <span>5.000 cab</span>
                    <span>10.000 cab</span>
                  </div>
                </div>

                <div className="config-form-group">
                  <div className="slider-header">
                    <span className="lbl-primary">3. Licenças Administrativas</span>
                    <strong className="slider-live-value">{userLicenses} acessos</strong>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="50" 
                    step="1" 
                    value={userLicenses} 
                    onChange={(e) => setUserLicenses(Number(e.target.value))} 
                    className="slider-range-input"
                  />
                  <div className="slider-limits">
                    <span>2 usuários</span>
                    <span>25 usuários</span>
                    <span>50 usuários</span>
                  </div>
                </div>
              </div>

              {/* Invoicing preview screen */}
              <div className="config-invoice-preview-pane">
                <div className="invoice-paper">
                  <div className="invoice-stamp">SOVEREIGN PRO</div>
                  
                  <div className="invoice-header">
                    <TauzeLogo size={24} />
                    <div className="header-meta">
                      <strong>Proposta de Integração</strong>
                      <span>tauze intelligence v6.0</span>
                    </div>
                  </div>

                  <div className="invoice-divider"></div>

                  <div className="invoice-lines">
                    {includePecuaria && (
                      <div className="invoice-row">
                        <span>Pecuária RFID Core</span>
                        <strong>R$ 399 / mês</strong>
                      </div>
                    )}
                    {includeFrotas && (
                      <div className="invoice-row">
                        <span>Telemetria Offline-First</span>
                        <strong>R$ 299 / mês</strong>
                      </div>
                    )}
                    {includeHedge && (
                      <div className="invoice-row">
                        <span>Blindagem B3 & Hedge</span>
                        <strong>R$ 499 / mês</strong>
                      </div>
                    )}
                    {includePecuaria && scaleSurcharge > 0 && (
                      <div className="invoice-row">
                        <span>Escala Rebanho ({herdScale} cab)</span>
                        <strong>R$ {scaleSurcharge} / mês</strong>
                      </div>
                    )}
                    <div className="invoice-row">
                      <span>{userLicenses} Licenças de Gestão</span>
                      <strong>R$ {licenseSurcharge} / mês</strong>
                    </div>

                    {selectedCount >= 2 && (
                      <div className="invoice-row discount text-emerald">
                        <span>Desconto Multi-Módulo ({selectedCount === 3 ? '20%' : '10%'})</span>
                        <strong>- R$ {Math.round(subtotal * (selectedCount === 3 ? 0.2 : 0.1))} / mês</strong>
                      </div>
                    )}
                  </div>

                  <div className="invoice-divider"></div>

                  <div className="invoice-totals">
                    <div className="total-main">
                      <span>Investimento Estimado</span>
                      <strong className="text-emerald">R$ {finalPrice.toLocaleString()}<span className="mo">/mês</span></strong>
                    </div>

                    <div className="roi-alert-badge">
                      <div className="roi-alert-title">
                        <Award size={13} className="text-emerald animate-pulse" />
                        <strong>Economia Anual Assegurada</strong>
                      </div>
                      <span className="roi-alert-value">R$ {estimatedSavings.toLocaleString()} / ano</span>
                      <span className="roi-alert-desc">Redução de refugo e perdas logísticas estimadas.</span>
                    </div>
                  </div>

                  <a href="#hero-stage" className="btn-invoice-pdf-cta">
                    <span>Exportar Proposta Comercial PDF</span>
                    <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* TILE 6: ERP BRIDGE & BACKEND CONNECTIVITY */}
          <div className="bento-card span-1 card-erp">
            <div className="bento-badge-node">06 // INTEGRAÇÃO ERP</div>
            <div className="bento-text-area">
              <h3>Conectividade ERP Homologada</h3>
              <p>Pontes de sincronização nativa e transparente com SAP Business One, TOTVS e ERPs corporativos locais.</p>
            </div>

            <div className="erp-widget">
              <div className="erp-pipeline-flow">
                <div className="pipeline-node text-emerald">
                  <TauzeLogo size={18} />
                  <span>tauze</span>
                </div>
                <div className="flow-arrows">
                  <div className="arrow-pulse-line"></div>
                </div>
                <div className="pipeline-node erp">
                  <Layers size={18} />
                  <span>SAP / TOTVS</span>
                </div>
              </div>

              <div className="mini-terminal-logs">
                <span className="term-hdr">INTEGRATION GATEWAY ACTIVE</span>
                <div className="term-body">
                  <div className="term-line"><span className="prm">[SAP-B1]</span> RFC handshake established (v2.4)</div>
                  <div className="term-line"><span className="prm">[DATA]</span> Synchronizing weighing logs...</div>
                  <div className="term-line text-emerald"><span className="prm">[OK]</span> 14 records persisted in SAP DB</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* -------------------- ELEGANT FAQ SECTION -------------------- */}
      <section id="sec-faq" className="faq-editorial-section">
        <div className="faq-container">
          <div className="faq-header">
            <span className="faq-sub">TRANSPARÊNCIA EXCLUSIVA</span>
            <h2 className="faq-title">Perguntas Frequentes</h2>
            <p className="faq-desc">Entenda a arquitetura técnica, as condições de implantação e a blindagem legal do tauze.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Como o sistema opera sem sinal de celular no curral ou lavoura?",
                a: "O tauze é construído sob uma arquitetura offline-first proprietária. Equipamentos locais como antenas RFID e computadores operacionais armazenam e processam todos os dados em bancos locais encriptados. A sincronização com a nuvem ocorre de forma automática e segura apenas quando há sinal de internet estável ou através de pontes de rede via rádio Lora locais."
              },
              {
                q: "O que garante o isolamento e soberania de dados prometidos?",
                a: "Diferente de sistemas SaaS comuns (multitenant de banco compartilhado), nós instalamos bancos de dados dedicados e isolados fisicamente por tenant. Seus dados e registros nunca compartilham pools ou conexões em comum com outros clientes. Além disso, todas as chaves de segurança são rotacionadas em algoritmos de encriptação militar (AES-256-GCM)."
              },
              {
                q: "A implantação física e suporte das antenas RFID estão incluídos?",
                a: "A equipe de engenharia do tauze e nossa rede de parceiros homologados cuidam de todo o mapeamento topográfico do curral, instalação dos gateways Bluetooth/RFID de alta potência nos bebedouros e calibração das balanças de passagem voluntária. As propostas emitidas no simulador cobrem a licença do software e assessoria de instalação completa."
              },
              {
                q: "É possível integrar com sistemas contábeis legados e ERPs?",
                a: "Sim, integramos nativamente com SAP Business One, TOTVS, e outros ERPs contábeis e fiscais do mercado agropecuário. A sincronização de notas de entrada (Invoices), movimentação física de rebanho e balanços de depreciação ocorre através de APIs ou conexões diretas RFC homologadas."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className={`faq-accordion-item ${faqOpen === index ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              >
                <div className="faq-acc-trigger">
                  <span>{faq.q}</span>
                  <ChevronDown size={16} className="faq-arrow-icon" />
                </div>
                <div className="faq-acc-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- ELEGANT MINIMALIST FOOTER -------------------- */}
      <footer className="footer-elegant">
        <div className="footer-container">
          <div className="footer-brand-section">
            <div className="footer-logo-row">
              <TauzeLogo size={28} />
              <span className="brand-name">tauze</span>
            </div>
            <p className="footer-tagline">Soberania e integridade garantidas de ponta a ponta na sua operação física e digital.</p>
          </div>

          <div className="footer-links-grid">
            <div className="footer-column">
              <h4>Módulos</h4>
              <a href="#bento-matrix">Pecuária RFID</a>
              <a href="#bento-matrix">Telemetria de Frotas</a>
              <a href="#bento-matrix">Blindagem B3</a>
              <a href="#bento-matrix">Integrações ERP</a>
            </div>
            <div className="footer-column">
              <h4>Governança</h4>
              <a href="#bento-matrix">Isolamento Criptográfico</a>
              <a href="#bento-matrix">Arquitetura de Dados</a>
              <a href="#bento-matrix">Termos de Soberania</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom-bar">
          <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Garantidas de Ponta a Ponta.</p>
        </div>
      </footer>

      {/* -------------------- EMBEDDED CSS DESIGN SYSTEM -------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-bento-canvas {
          --bg-canvas: #faf9f6;          /* Luxurious warm light alabaster */
          --bg-panel: #ffffff;           /* Clean premium white card glass */
          --border-light: #e5e3dc;       /* Ultra-thin luxury sand hairline border */
          --accent: #00b865;             /* Signature brand vibrant emerald */
          --accent-dark: #093c25;        /* Deep sophisticated dark green */
          --accent-light: rgba(0, 184, 101, 0.05);
          --accent-border: rgba(0, 184, 101, 0.12);
          --text-main: #1c1c1a;          /* Rich premium deep charcoal slate */
          --text-muted: #5e5c54;         /* Readability luxury warm grey tone */
          --bg-console: #0c0d0d;         /* Obsidian black displays */
          --shadow-premium: 0 16px 36px rgba(28, 28, 26, 0.02);

          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          scroll-behavior: smooth;
        }

        /* --- STATS TICKER BAR --- */
        .stats-ticker-bar {
          background: #0f1010;
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
          animation: infiniteMarquee 32s linear infinite;
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

        /* --- ELEGANT FLOATING HEADER --- */
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
          background: rgba(250, 249, 246, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          height: 72px;
          border-bottom-color: var(--border-light);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.01);
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
        }

        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.04em;
          text-transform: lowercase;
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
          gap: 28px;
        }

        .navbar-links-group a {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: all 0.25s;
          letter-spacing: 0.02em;
          padding: 4px 0;
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

        /* --- HERO STAGE --- */
        .hero-editorial-stage {
          position: relative;
          padding: 210px 24px 100px 24px;
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
          width: 80vw;
          height: 70vh;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.04) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
        }

        .hero-badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 100px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.005);
          margin-bottom: 32px;
        }

        .badge-glow-icon {
          color: var(--accent);
        }

        .hero-main-title {
          font-family: 'Lora', serif;
          font-size: 3.8rem;
          font-weight: 500;
          line-height: 1.12;
          letter-spacing: -0.03em;
          color: var(--text-main);
          margin-bottom: 28px;
        }

        .hero-main-desc {
          font-size: 1.18rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 620px;
        }

        .hero-actions-container {
          display: flex;
          gap: 16px;
        }

        .btn-primary-editorial {
          background: var(--accent);
          color: #ffffff;
          padding: 16px 30px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.15);
          transition: all 0.3s;
        }

        .btn-primary-editorial:hover {
          transform: translateY(-2.5px);
          box-shadow: 0 14px 30px rgba(0, 184, 101, 0.25);
        }

        .btn-secondary-editorial {
          background: hsl(var(--bg-card));
          color: var(--text-main);
          border: 1px solid var(--border-light);
          padding: 16px 26px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.25s;
        }

        .btn-secondary-editorial:hover {
          background: #f4f3ee;
          border-color: rgba(28, 28, 26, 0.15);
        }

        /* --- BENTO MATRIX CONTAINER --- */
        .bento-matrix-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 40px 0;
        }

        .bento-grid-header {
          text-align: center;
          margin-bottom: 56px;
          padding: 0 24px;
        }

        .bento-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 12px;
        }

        .bento-title {
          font-family: 'Lora', serif;
          font-size: 2.6rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .bento-desc {
          font-size: 1.05rem;
          color: var(--text-muted);
          max-width: 580px;
          margin: 0 auto;
          line-height: 1.5;
        }

        /* --- BENTO GRID SYSTEM --- */
        .bento-matrix-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px 80px 24px;
        }

        .bento-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 32px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-premium);
          min-height: 380px;
        }

        .bento-card:hover {
          transform: translateY(-6px);
          border-color: rgba(0, 184, 101, 0.25);
          box-shadow: 0 24px 48px rgba(0, 184, 101, 0.03), var(--shadow-premium);
        }

        .bento-card.span-2 {
          grid-column: span 2;
        }

        .bento-badge-node {
          align-self: flex-start;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--text-muted);
          border: 1px solid var(--border-light);
          padding: 4px 10px;
          border-radius: 100px;
          letter-spacing: 0.05em;
          background: hsl(var(--bg-card));
          margin-bottom: 18px;
        }

        .bento-text-area {
          margin-bottom: 24px;
          text-align: left;
        }

        .bento-text-area h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 8px;
          color: var(--text-main);
        }

        .bento-text-area p {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        /* --- WIDGET: SOBERANIA VAULT SIMULATOR --- */
        .vault-simulator-widget {
          display: flex;
          flex-direction: column;
          gap: 16px;
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 16px;
        }

        .vault-chassis {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          overflow: hidden;
        }

        .chassis-header {
          background: #f4f3ee;
          padding: 8px 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
        }

        .chassis-title {
          font-family: monospace;
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .chassis-indicators {
          display: flex;
          gap: 5px;
        }

        .chassis-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
        }
        .chassis-dot.red { background: #ff5f56; }
        .chassis-dot.yellow { background: #ffbd2e; }
        .chassis-dot.green { background: #00b865; }

        .vault-body {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .database-silos {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .silo-block {
          border: 1px solid var(--border-light);
          background: hsl(var(--bg-card));
          border-radius: 8px;
          padding: 12px 6px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .silo-block span {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .silo-block.active-tenant {
          border-color: var(--accent);
          background: var(--accent-light);
          box-shadow: 0 4px 12px rgba(0, 184, 101, 0.05);
        }

        .lock-indicator {
          font-family: monospace;
          font-size: 0.58rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .lock-indicator.locked {
          background: #faf9f6;
          color: var(--text-muted);
        }

        .lock-indicator.unlocked {
          background: rgba(0, 184, 101, 0.1);
          color: var(--accent);
        }

        .console-display {
          background: var(--bg-console);
          border-radius: 8px;
          padding: 12px;
          text-align: left;
        }

        .console-header-lbl {
          font-family: monospace;
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.35);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 6px;
        }

        .console-lines {
          display: flex;
          flex-direction: column;
          gap: 4px;
          min-height: 52px;
        }

        .console-line {
          font-family: monospace;
          font-size: 0.68rem;
          line-height: 1.3;
          display: flex;
          gap: 6px;
        }

        .console-prompt {
          color: var(--accent);
          font-weight: 700;
        }

        .console-txt {
          color: rgba(255, 255, 255, 0.85);
        }

        .btn-widget-action {
          width: 100%;
          background: var(--text-main);
          color: #ffffff;
          padding: 10px 14px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
        }

        .btn-widget-action:hover:not(:disabled) {
          background: #000000;
          transform: translateY(-1px);
        }

        .btn-widget-action:disabled {
          opacity: 0.75;
          cursor: not-allowed;
        }

        .spin-status-icon {
          animation: spin 3s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* --- WIDGET: PECUÁRIA RFID GAIN SPLINE --- */
        .pecuaria-chart-widget {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }

        .lot-selector-tabs {
          display: flex;
          background: hsl(var(--bg-card));
          padding: 3px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          gap: 2px;
        }

        .tab-btn {
          flex: 1;
          background: transparent;
          border: none;
          outline: none;
          padding: 6px 4px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .tab-btn.active {
          background: var(--bg-canvas);
          color: var(--text-main);
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.015);
        }

        .chart-preview-box {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 10px;
          height: 120px;
          padding: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .spline-chart-svg {
          width: 100%;
          height: 100%;
        }

        .dash-move-path {
          stroke-dasharray: 6;
          animation: dashAnimation 12s linear infinite;
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

        .pecuaria-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }

        .pec-stat {
          display: flex;
          flex-direction: column;
          text-align: left;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 8px;
          border-radius: 8px;
        }

        .pec-stat .lbl {
          font-size: 0.58rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .pec-stat strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .text-emerald {
          color: var(--accent) !important;
        }

        /* --- WIDGET: TELEMETRIA OFFLINE ROUTING --- */
        .telemetry-widget {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .simulated-map {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          height: 120px;
          position: relative;
          overflow: hidden;
        }

        .grid-topo-lines {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(var(--border-light) 1.2px, transparent 1.2px);
          background-size: 16px 16px;
          opacity: 0.5;
        }

        .map-vector-svg {
          width: 100%;
          height: 100%;
          position: relative;
          z-index: 1;
        }

        .widget-overlay-telemetry {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          background: rgba(28, 28, 26, 0.9);
          border-radius: 6px;
          padding: 6px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 2;
          font-family: monospace;
          color: #ffffff;
        }

        .widget-overlay-telemetry span {
          font-size: 0.58rem;
          color: rgba(255, 255, 255, 0.55);
        }

        .widget-overlay-telemetry strong {
          font-size: 0.65rem;
          color: var(--accent);
        }

        .telemetry-metrics {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .metric-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .metric-row strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        /* --- WIDGET: HEDGE B3 --- */
        .hedge-widget {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 14px;
          flex: 1;
        }

        .hedge-graph-chassis {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .graph-meta {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
        }

        .graph-meta span {
          font-weight: 700;
          color: var(--text-muted);
        }

        .graph-meta strong {
          font-weight: 800;
        }

        .candlestick-area {
          height: 80px;
          position: relative;
        }

        .candle-svg {
          width: 100%;
          height: 100%;
        }

        .safe-margin-badge {
          position: absolute;
          top: 8px;
          right: 8px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          padding: 2px 6px;
          border-radius: 100px;
          display: flex;
          align-items: center;
          gap: 3px;
        }

        .hedge-toggles {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        /* Standard Toggle Switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 38px;
          height: 20px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          inset: 0;
          background-color: var(--border-light);
          transition: .3s;
          border-radius: 34px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 14px;
          width: 14px;
          left: 3px;
          bottom: 3px;
          background-color: hsl(var(--bg-card));
          transition: .3s;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--accent);
        }

        input:checked + .slider:before {
          transform: translateX(18px);
        }

        /* --- WIDGET: DOUBLE TILE CONFIGURADOR --- */
        .configurador-split-box {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          flex: 1;
        }

        .config-form-pane {
          display: flex;
          flex-direction: column;
          gap: 24px;
          text-align: left;
        }

        .config-text-lead h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .config-text-lead p {
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .config-form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lbl-primary {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .modules-check-box {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .check-card-node {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 12px 16px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.25s;
        }

        .check-card-node input {
          width: 14px;
          height: 14px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .icon-mod {
          color: var(--text-muted);
          transition: color 0.25s;
        }

        .check-card-node.active {
          background: var(--accent-light);
          border-color: var(--accent);
        }

        .check-card-node.active .icon-mod {
          color: var(--accent);
        }

        .check-details {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }

        .check-details strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .check-details span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .slider-live-value {
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 900;
          color: var(--accent);
        }

        .slider-range-input {
          -webkit-appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 10px;
          background: var(--border-light);
          outline: none;
          margin: 6px 0;
        }

        .slider-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 184, 101, 0.2);
          transition: transform 0.1s;
        }

        .slider-range-input::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* RIGHT INVOICE PREVIEW */
        .config-invoice-preview-pane {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .invoice-paper {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 20px;
          padding: 24px;
          width: 100%;
          max-width: 340px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.015);
          display: flex;
          flex-direction: column;
          gap: 16px;
          position: relative;
        }

        .invoice-stamp {
          position: absolute;
          top: 16px;
          right: 16px;
          border: 1.5px solid var(--accent);
          color: var(--accent);
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 4px;
          transform: rotate(5deg);
          letter-spacing: 0.08em;
          background: rgba(0, 184, 101, 0.03);
        }

        .invoice-header {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .header-meta strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 850;
          display: block;
        }

        .header-meta span {
          font-size: 0.68rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .invoice-divider {
          height: 1px;
          border-top: 1px dashed var(--border-light);
        }

        .invoice-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .invoice-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .invoice-row strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .invoice-row.discount {
          font-weight: 700;
        }

        .invoice-totals {
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .total-main {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .total-main span {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .total-main strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.65rem;
          font-weight: 900;
        }

        .total-main .mo {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .roi-alert-badge {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          border-radius: 10px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .roi-alert-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--text-main);
        }

        .roi-alert-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.05rem;
          font-weight: 900;
          color: var(--accent);
          margin: 2px 0;
        }

        .roi-alert-desc {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .btn-invoice-pdf-cta {
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

        .btn-invoice-pdf-cta:hover {
          transform: translateY(-1.5px);
          box-shadow: 0 6px 16px rgba(0, 184, 101, 0.2);
        }

        /* --- WIDGET: ERP FLOW --- */
        .erp-widget {
          background: #faf9f6;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          flex: 1;
        }

        .erp-pipeline-flow {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: hsl(var(--bg-card));
          padding: 10px 14px;
          border: 1px solid var(--border-light);
          border-radius: 10px;
        }

        .pipeline-node {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
        }

        .pipeline-node.erp {
          color: var(--text-muted);
        }

        .flow-arrows {
          flex: 1;
          height: 2px;
          background: var(--border-light);
          margin: 0 12px;
          position: relative;
          overflow: hidden;
        }

        .arrow-pulse-line {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          width: 24px;
          background: linear-gradient(to right, transparent, var(--accent), transparent);
          animation: pulseArrow 2s linear infinite;
        }
        @keyframes pulseArrow {
          0% { left: -30%; }
          100% { left: 110%; }
        }

        .mini-terminal-logs {
          background: var(--bg-console);
          border-radius: 8px;
          padding: 10px;
          text-align: left;
        }

        .term-hdr {
          font-family: monospace;
          font-size: 0.55rem;
          color: rgba(255, 255, 255, 0.3);
          display: block;
          margin-bottom: 6px;
        }

        .term-body {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .term-line {
          font-family: monospace;
          font-size: 0.65rem;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .term-line .prm {
          color: var(--accent);
          font-weight: 700;
        }

        /* --- FAQ SECTION --- */
        .faq-editorial-section {
          max-width: 1200px;
          margin: 0 auto;
          padding: 80px 24px;
          border-top: 1px solid var(--border-light);
        }

        .faq-container {
          max-width: 800px;
          margin: 0 auto;
        }

        .faq-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .faq-sub {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 12px;
        }

        .faq-title {
          font-family: 'Lora', serif;
          font-size: 2.3rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          margin-bottom: 16px;
        }

        .faq-desc {
          font-size: 1rem;
          color: var(--text-muted);
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-accordion-item {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 20px 24px;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }

        .faq-accordion-item:hover {
          border-color: rgba(0, 184, 101, 0.2);
          box-shadow: var(--shadow-premium);
        }

        .faq-acc-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .faq-arrow-icon {
          color: var(--text-muted);
          transition: transform 0.3s;
        }

        .faq-accordion-item.open .faq-arrow-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-acc-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease-out;
        }

        .faq-accordion-item.open .faq-acc-content {
          max-height: 150px;
          margin-top: 14px;
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
          padding: 64px 24px 24px 24px;
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 40px;
          padding-bottom: 40px;
        }

        .footer-brand-section {
          max-width: 320px;
          text-align: left;
        }

        .footer-logo-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .footer-logo-row .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.4rem;
        }

        .footer-tagline {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .footer-links-grid {
          display: flex;
          gap: 64px;
        }

        .footer-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .footer-column h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 950;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .footer-column a {
          font-size: 0.82rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.25s;
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
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        /* --- RESPONSIVE MEDIA QUERIES --- */
        @media (max-width: 1024px) {
          .bento-matrix-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bento-card.span-2 {
            grid-column: span 2;
          }
        }

        @media (max-width: 768px) {
          .hero-main-title {
            font-size: 2.8rem;
          }
          .bento-matrix-grid {
            grid-template-columns: 1fr;
          }
          .bento-card.span-2 {
            grid-column: span 1;
          }
          .configurador-split-box {
            grid-template-columns: 1fr;
            gap: 24px;
          }
          .navbar-links-group {
            display: none; /* simple mobile drawer could be added */
          }
          .footer-container {
            flex-direction: column;
            align-items: flex-start;
          }
          .footer-links-grid {
            gap: 40px;
          }
        }
      `}</style>

    </div>
  );
};
