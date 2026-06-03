import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Activity, 
  DollarSign, 
  Truck, 
  ShieldCheck, 
  ArrowRight, 
  Terminal, 
  Play, 
  CheckCircle2, 
  ChevronRight, 
  Database, 
  Layers, 
  Globe, 
  Lock, 
  Cpu, 
  BarChart3, 
  Microscope, 
  Check, 
  TrendingUp, 
  Smartphone, 
  Cloud, 
  ChevronDown,
  RefreshCw,
  Server,
  Sliders,
  SlidersHorizontal,
  FileSpreadsheet,
  Globe2,
  TrendingDown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

// Logo oficial com o vão central vertical e pontas verdes `#00b865`
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

type SimulatorTabType = 'pecuaria' | 'frota' | 'hedge' | 'security';

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Simulation controls
  const [activeSimTab, setActiveSimTab] = useState<SimulatorTabType>('pecuaria');
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  
  // Custom configurator states
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(false);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(850);
  const [userLicenses, setUserLicenses] = useState(5);
  
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Configurator math
  const basePecuaria = includePecuaria ? 399 : 0;
  const baseFrotas = includeFrotas ? 299 : 0;
  const baseHedge = includeHedge ? 499 : 0;
  const scaleSurcharge = includePecuaria ? Math.round(herdScale * 0.16) : 0;
  const licenseSurcharge = userLicenses * 25;
  
  const totalSubtotal = basePecuaria + baseFrotas + baseHedge + scaleSurcharge + licenseSurcharge;
  const selectedCount = [includePecuaria, includeFrotas, includeHedge].filter(Boolean).length;
  const discountMultiplier = selectedCount === 3 ? 0.8 : selectedCount === 2 ? 0.9 : 1.0;
  const finalPrice = Math.round(totalSubtotal * discountMultiplier);
  const estimatedSavings = Math.round((herdScale * 42) + (includeFrotas ? 35000 : 0));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulação de live logs do barramento local
  useEffect(() => {
    const tabLogs: Record<SimulatorTabType, string[]> = {
      pecuaria: [
        "[GATEWAY] Antena Curral Lora ativa - Conexão 99.8%.",
        "[RFID] Brinco #BR-89410 aferido voluntariamente - Peso: 482kg.",
        "[IA-GMD] Ganho Médio Diário Lote 14-B calculado: +1.42 kg/dia."
      ],
      frota: [
        "[FLEET] Trator John Deere #4 conectado - Rota Pasto Sul.",
        "[FUEL] Telemetria de tanque móvel calibrada - Nível: 92%.",
        "[TELEMETRY] Sensor de fluxo diesel ativo - Consumo: 12.4 L/h."
      ],
      hedge: [
        "[B3-IA] Mapeamento futuro boi gordo B3 - Previsão R$ 285.50/@.",
        "[HEDGE] Proteção ativada para Lote L-12A - Margem comercial blindada.",
        "[AUDIT] Compliance OFX exportado com sucesso para B3."
      ],
      security: [
        "[CRYPTO] Chave física rotativa encriptada ativada (AES-256).",
        "[TENANT-ISOLATION] Banco de dados isolado fisicamente sem pools públicos.",
        "[OFFLINE-FIRST] Gateway local sincronizado - Sincronismo concluído."
      ]
    };

    setLiveLogs(tabLogs[activeSimTab]);

    const logTimer = setInterval(() => {
      const dynamics: Record<SimulatorTabType, string[]> = {
        pecuaria: [
          `[RFID] Animal #${Math.floor(Math.random() * 900 + 100)} pesado - Peso: ${Math.floor(Math.random() * 40 + 460)}kg.`,
          `[IA] Curva estatística recalculada para Lote ${Math.floor(Math.random() * 10 + 5)}-C.`
        ],
        frota: [
          `[FLEET] Colheitadeira #${Math.floor(Math.random() * 4 + 1)} conectada - Status OK.`,
          `[TELEMETRY] Abastecimento concluído: ${Math.floor(Math.random() * 100 + 50)}L no Tanque #${Math.floor(Math.random() * 3 + 1)}.`
        ],
        hedge: [
          `[B3] Cotação Futura atualizada: R$ ${Math.floor(Math.random() * 10 + 280)}/@.`,
          `[HEDGE] Contrato de proteção indexado com sucesso.`
        ],
        security: [
          `[SECURITY] Auditoria de chaves de acesso concluída - Zero vulnerabilidades.`,
          `[GATEWAY] Latência de sincronismo local-nuvem: ${Math.random() > 0.5 ? '12ms' : '8ms'}.`
        ]
      };

      const selected = dynamics[activeSimTab][Math.floor(Math.random() * dynamics[activeSimTab].length)];
      setLiveLogs(prev => [selected, prev[0], prev[1]].slice(0, 3));
    }, 4500);

    return () => clearInterval(logTimer);
  }, [activeSimTab]);

  return (
    <div className={`tauze-landing sovereign-operations`}>
      
      {/* --- Sleek Financial Marquee Ticker (HIGH-IMPACT TOP BAR) --- */}
      <div className="financial-ticker-bar">
        <div className="ticker-wrapper">
          <div className="ticker-content">
            <span className="ticker-item"><span className="dot text-emerald"></span> BOI GORDO B3 Futuro: R$ 285.50/@ <span className="trend positive">(+1.2%)</span></span>
            <span className="ticker-item"><span className="dot text-emerald"></span> DÓLAR COMERCIAL: R$ 5.12 <span className="trend negative">(-0.4%)</span></span>
            <span className="ticker-item"><span className="dot text-emerald"></span> TELEMETRIA LORA: 100% ATIVA</span>
            <span className="ticker-item"><span className="dot text-emerald"></span> ISOLAMENTO DE BASE: AES-256</span>
            <span className="ticker-item"><span className="dot text-emerald"></span> MILHO B3 Futuro: R$ 68.20/sc <span className="trend positive">(+0.8%)</span></span>
          </div>
          {/* Repeating for infinite loop */}
          <div className="ticker-content">
            <span className="ticker-item"><span className="dot text-emerald"></span> BOI GORDO B3 Futuro: R$ 285.50/@ <span className="trend positive">(+1.2%)</span></span>
            <span className="ticker-item"><span className="dot text-emerald"></span> DÓLAR COMERCIAL: R$ 5.12 <span className="trend negative">(-0.4%)</span></span>
            <span className="ticker-item"><span className="dot text-emerald"></span> TELEMETRIA LORA: 100% ATIVA</span>
            <span className="ticker-item"><span className="dot text-emerald"></span> ISOLAMENTO DE BASE: AES-256</span>
            <span className="ticker-item"><span className="dot text-emerald"></span> MILHO B3 Futuro: R$ 68.20/sc <span className="trend positive">(+0.8%)</span></span>
          </div>
        </div>
      </div>

      {/* --- Ambient Visual Canvas --- */}
      <div className="ambient-background">
        <div className="structural-radial-grid"></div>
        <div className="glowing-mint-orb-top"></div>
        <div className="glowing-mint-orb-bottom"></div>
      </div>

      {/* --- Minimal Frosted Navbar --- */}
      <nav className={`noir-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo-group">
            <div className="logo-icon-wrapper">
              <TauzeLogo size={32} />
            </div>
            <div className="logo-text">
              <span className="brand">tauze</span>
              <span className="version">DIAMOND 6.0</span>
            </div>
          </div>
          
          <div className="nav-links">
            <a href="#control-room">Painel Central</a>
            <a href="#specs">Ficha de Ativos</a>
            <a href="#configurator">Proposta Pro-Forma</a>
            <a href="#faq">Dúvidas</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-terminal">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero: Minimalist, Stark & Immersive --- */}
      <section className="hero-section">
        <div className="container hero-layout">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-header-block"
          >
            <div className="badge-premium">
              <Sparkles size={12} />
              <span>Governança Analítica Soberana</span>
            </div>
            
            <h1 className="hero-title">
              tauze intelligence.
            </h1>
            
            <p className="hero-description">
              A soberania digital que dita o rumo da sua terra. Controle absoluto de ativos biológicos, telemetria de frotas e auditoria B3 em um painel corporativo isolado fisicamente.
            </p>

            <div className="hero-actions">
              <a href="#configurator" className="btn-primary-large">
                Gerar Proposta Comercial
                <ArrowRight size={18} />
              </a>
              <a href="#control-room" className="btn-secondary-large">
                Explorar Painel Central
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Interactive Operations Command Center (FULL-SCREEN PANEL) --- */}
      <section className="control-room-section" id="control-room">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">SALA DE OPERAÇÕES</span>
            <h2 className="section-title">Painel de Comando Central</h2>
            <p className="section-subtitle">
              Dados do campo unificados sem latência. Selecione as abas abaixo para interagir e visualizar a telemetria ao vivo.
            </p>
          </div>

          <div className="room-layout-panel">
            {/* The Unified Dashboard Mockup Card */}
            <div className="dashboard-console-card">
              
              <div className="dashboard-console-header">
                <div className="frame-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="frame-title">tauze-central-operations-console</div>
                <div className="frame-status">
                  <RefreshCw size={11} className="spin-slow" />
                  <span>Sincronismo Híbrido Concluído</span>
                </div>
              </div>

              {/* Tabs list inside the dashboard */}
              <div className="dashboard-tabs-bar">
                <button 
                  onClick={() => setActiveSimTab('pecuaria')}
                  className={`tab-btn-item ${activeSimTab === 'pecuaria' ? 'active' : ''}`}
                >
                  <Cpu size={14} /> Pecuária 5.0
                </button>
                <button 
                  onClick={() => setActiveSimTab('frota')}
                  className={`tab-btn-item ${activeSimTab === 'frota' ? 'active' : ''}`}
                >
                  <Truck size={14} /> Frota & Logística
                </button>
                <button 
                  onClick={() => setActiveSimTab('hedge')}
                  className={`tab-btn-item ${activeSimTab === 'hedge' ? 'active' : ''}`}
                >
                  <BarChart3 size={14} /> Hedge & Bolsa B3
                </button>
                <button 
                  onClick={() => setActiveSimTab('security')}
                  className={`tab-btn-item ${activeSimTab === 'security' ? 'active' : ''}`}
                >
                  <Lock size={14} /> Segurança & Blindagem
                </button>
              </div>

              <div className="dashboard-body">
                <AnimatePresence mode="wait">
                  <motion.div 
                    key={activeSimTab}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.25 }}
                    className="tab-content-wrapper"
                  >
                    {activeSimTab === 'pecuaria' && (
                      <div className="sim-block">
                        <div className="sim-intro">
                          <h3>Pecuária de Precisão (RFID)</h3>
                          <p>Acompanhamento automatizado de ganho médio diário de peso (GMD) por radiofrequência voluntária.</p>
                        </div>
                        
                        <div className="sim-metrics-grid">
                          <div className="metric-cell">
                            <span className="label">Média de Peso Geral</span>
                            <span className="val">482.4 kg</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Ganho Médio Diário</span>
                            <span className="val text-emerald">+1.42 kg/dia</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Animais Rastreados</span>
                            <span className="val">1,240 cabeças</span>
                          </div>
                        </div>

                        {/* Bezier weigh progress graph */}
                        <div className="sim-chart-box">
                          <span className="lbl-title">CURVA ESTATÍSTICA DE ENGORDA (LOTE 14-B)</span>
                          <svg viewBox="0 0 400 80" className="bezier-curve-svg">
                            <path 
                              d="M 10,65 Q 120,40 230,25 T 390,12" 
                              fill="none" 
                              stroke="var(--accent)" 
                              strokeWidth="3.5" 
                            />
                            <path 
                              d="M 10,65 Q 120,40 230,25 T 390,12 L 390,75 L 10,75 Z" 
                              fill="url(#emerald-glow-mesh)" 
                              opacity="0.1" 
                            />
                            <defs>
                              <linearGradient id="emerald-glow-mesh" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="var(--accent)" />
                                <stop offset="100%" stopColor="transparent" />
                              </linearGradient>
                            </defs>
                          </svg>
                        </div>
                      </div>
                    )}

                    {activeSimTab === 'frota' && (
                      <div className="sim-block">
                        <div className="sim-intro">
                          <h3>Frota Analítica & Combustível</h3>
                          <p>Controle preciso de telemetria de tratores, máquinas agrícolas e bomba de combustível local.</p>
                        </div>

                        <div className="sim-metrics-grid">
                          <div className="metric-cell">
                            <span className="label">Consumo de Máquinas</span>
                            <span className="val">12.4 L/hora</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Abastecido Hoje</span>
                            <span className="val text-emerald">850 Litros</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Ativos Conectados</span>
                            <span className="val">14 tratores</span>
                          </div>
                        </div>

                        <div className="sim-chart-box">
                          <span className="lbl-title">CONSUMO DE DIESEL S10 POR MÁQUINA DE CAMPO (L/h)</span>
                          <div className="sim-bar-charts">
                            {[38, 62, 48, 85, 55, 92, 70, 80].map((h, idx) => (
                              <div key={idx} className="bar-column">
                                <div className="bar-fill" style={{ height: `${h}%` }}></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeSimTab === 'hedge' && (
                      <div className="sim-block">
                        <div className="sim-intro">
                          <h3>Hedge e Proteção Comercial B3</h3>
                          <p>Mapeamento de peso ótimo para abate indexado diretamente com as cotações futuras da Bolsa de Valores.</p>
                        </div>

                        <div className="sim-metrics-grid">
                          <div className="metric-cell">
                            <span className="label">Hedge Futuro B3</span>
                            <span className="val">R$ 285.50/@</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Margem Blindada</span>
                            <span className="val text-emerald">34.2%</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Lançamentos OFX</span>
                            <span className="val">100% Auditados</span>
                          </div>
                        </div>

                        <div className="sim-chart-box">
                          <span className="lbl-title">PROJEÇÃO DE TENDÊNCIA BOI GORDO B3</span>
                          <svg viewBox="0 0 400 80" className="bezier-curve-svg">
                            <path 
                              d="M 10,48 Q 110,18 210,58 T 390,22" 
                              fill="none" 
                              stroke="var(--accent)" 
                              strokeWidth="3" 
                            />
                          </svg>
                        </div>
                      </div>
                    )}

                    {activeSimTab === 'security' && (
                      <div className="sim-block">
                        <div className="sim-intro">
                          <h3>Segurança e Blindagem de Dados</h3>
                          <p>Isolamento físico de bases de dados do produtor (sem pools públicos ou compartilhamento de nuvem).</p>
                        </div>

                        <div className="sim-metrics-grid">
                          <div className="metric-cell">
                            <span className="label">Encriptação</span>
                            <span className="val">AES-256-GCM</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Isolamento Tenant</span>
                            <span className="val text-emerald">Físico Total</span>
                          </div>
                          <div className="metric-cell">
                            <span className="label">Operabilidade Local</span>
                            <span className="val">Offline-First</span>
                          </div>
                        </div>

                        <div className="security-shield-card">
                          <ShieldCheck size={32} className="shield-icon" />
                          <div className="text-sec-info">
                            <strong>Nuvem Soberana Homologada</strong>
                            <p>O Tauze ERP opera sob partições computacionais totalmente independentes de outras marcas do mercado.</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {/* Real-time scrolling gateway log feed */}
                <div className="live-log-console">
                  <span className="console-title-text">TERMINAL LIVE GATEWAY FEED</span>
                  <div className="console-display-window">
                    {liveLogs.map((log, index) => (
                      <div key={index} className="console-row-line">
                        <span className="arrow-cmd">&gt;</span>
                        <span className="log-text">{log}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          </div>
        </div>
      </section>

      {/* --- Section: The Modern Specifications List (NO Bento Grid) --- */}
      <section className="specs-section" id="specs">
        <div className="container">
          <div className="section-header-left">
            <span className="section-tag">FICHA DE ENGENHARIA</span>
            <h2 className="section-title">Especificações Técnicas de Ativos</h2>
            <p className="section-subtitle">Toda a robustez contábil e de telemetria consolidada em um barramento tecnológico auditável e soberano.</p>
          </div>

          <div className="specs-list-table">
            <div className="spec-row-item">
              <span className="spec-label">Isolamento Criptográfico</span>
              <span className="spec-val">Banco de dados com isolamento físico de tenant encriptado em AES-256-GCM.</span>
            </div>
            <div className="spec-row-item">
              <span className="spec-label">Barramento de Conexão</span>
              <span className="spec-val">Drivers Bluetooth integrados de forma nativa para balanças de pasto voluntárias comuns.</span>
            </div>
            <div className="spec-row-item">
              <span className="spec-label">Sincronismo de Campo</span>
              <span className="spec-val">Operabilidade autônoma off-line com transmissão automática de pacotes de dados.</span>
            </div>
            <div className="spec-row-item">
              <span className="spec-label">Telemetria de Combustível</span>
              <span className="spec-val">Sensor acoplado à boia de reservatórios e tanques móveis contendo alertas imediatos.</span>
            </div>
            <div className="spec-row-item">
              <span className="spec-label">Inteligência Financeira B3</span>
              <span className="spec-val">Previsão e simulação de abate indexada diretamente à Bolsa de Valores.</span>
            </div>
            <div className="spec-row-item">
              <span className="spec-label">Compliance SOX</span>
              <span className="spec-val">Geração e conciliação automática de arquivos contábeis OFX e XML integrados.</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: Build Your Pro-Forma Proposal Configurator (OUT-OF-THE-BOX PRICING) --- */}
      <section className="configurator-section" id="configurator">
        <div className="container">
          <div className="config-header-center">
            <span className="section-tag">PROPOSTA COMERCIAL</span>
            <h2 className="section-title">Configure sua Soberania</h2>
            <p className="section-subtitle">Marque os módulos, configure a escala das suas fazendas e veja a proposta digital pro-forma com descontos imediatos.</p>
          </div>

          <div className="configurator-grid">
            
            {/* Left Controls Card */}
            <div className="configurator-controls">
              
              <div className="control-card">
                <h3>1. Módulos Operacionais</h3>
                <p className="description">Habilite os barramentos de licenciamento necessários:</p>

                <div className="toggles-selection-list">
                  <div 
                    onClick={() => setIncludePecuaria(!includePecuaria)}
                    className={`toggle-selection-item ${includePecuaria ? 'checked' : ''}`}
                  >
                    <div className="checkbox-frame">
                      {includePecuaria && <Check size={14} />}
                    </div>
                    <div className="info-text">
                      <strong>Pecuária de Precisão (RFID)</strong>
                      <span>Pesagem de pasto, estatísticas GMD e curva estatística de engorda.</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIncludeFrotas(!includeFrotas)}
                    className={`toggle-selection-item ${includeFrotas ? 'checked' : ''}`}
                  >
                    <div className="checkbox-frame">
                      {includeFrotas && <Check size={14} />}
                    </div>
                    <div className="info-text">
                      <strong>Telemetria de Frotas & Combustível</strong>
                      <span>Sensor de diesel de tratorização móvel e bombas de combustível.</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIncludeHedge(!includeHedge)}
                    className={`toggle-selection-item ${includeHedge ? 'checked' : ''}`}
                  >
                    <div className="checkbox-frame">
                      {includeHedge && <Check size={14} />}
                    </div>
                    <div className="info-text">
                      <strong>Hedge e Proteção Comercial B3</strong>
                      <span>Modelos preditivos futuros de boi gordo integrados com a Bolsa de Valores.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="control-card">
                <h3>2. Dimensão Operacional</h3>
                <p className="description">Configure o porte da sua agroindústria:</p>

                <div className="slider-wrapper-premium">
                  <div className="slider-lbl-row">
                    <span>Tamanho do Rebanho (Animais)</span>
                    <strong>{includePecuaria ? `${herdScale.toLocaleString()} cabeças` : "Desativado"}</strong>
                  </div>
                  <input 
                    type="range" 
                    min="100" 
                    max="10000" 
                    step="50"
                    disabled={!includePecuaria}
                    value={herdScale} 
                    onChange={(e) => setHerdScale(parseInt(e.target.value))}
                    className="premium-range-input"
                  />
                </div>

                <div className="slider-wrapper-premium">
                  <div className="slider-lbl-row">
                    <span>Contas de Acesso (Usuários)</span>
                    <strong>{userLicenses} usuários</strong>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="50" 
                    step="1"
                    value={userLicenses} 
                    onChange={(e) => setUserLicenses(parseInt(e.target.value))}
                    className="premium-range-input"
                  />
                </div>
              </div>

            </div>

            {/* Right Pro-Forma Digital Contract Card */}
            <div className="configurator-proposal-preview">
              <div className="pro-forma-proposal-card">
                <div className="proposal-badge-stamp">HOMOLOGADA</div>
                
                <div className="proposal-header-card">
                  <TauzeLogo size={32} />
                  <div className="h-text">
                    <h4>PROPOSTA COMERCIAL PRO-FORMA</h4>
                    <span>CONTRATO DE LICENCIAMENTO MENSAL</span>
                  </div>
                </div>

                <div className="card-divider-dashed"></div>

                <div className="proposal-identity">
                  <div className="identity-row">
                    <span className="lbl">EMISSÃO DA PROPOSTA:</span>
                    <span className="val">2026</span>
                  </div>
                  <div className="identity-row">
                    <span className="lbl">BASE COMPUTACIONAL:</span>
                    <span className="val text-emerald">ISOLADA (AES-256)</span>
                  </div>
                </div>

                <div className="card-divider-dashed"></div>

                <div className="proposal-itemization">
                  <h5>ITENS INTEGRADOS NA LICENÇA:</h5>
                  <div className="itemization-list">
                    {includePecuaria && (
                      <div className="item-row">
                        <span>Pecuária de Precisão (Módulo Base)</span>
                        <strong>R$ 399/mês</strong>
                      </div>
                    )}
                    {includeFrotas && (
                      <div className="item-row">
                        <span>Telemetria de Frotas (Módulo Base)</span>
                        <strong>R$ 299/mês</strong>
                      </div>
                    )}
                    {includeHedge && (
                      <div className="item-row">
                        <span>Inteligência B3 Hedge (Módulo Base)</span>
                        <strong>R$ 499/mês</strong>
                      </div>
                    )}
                    {includePecuaria && (
                      <div className="item-row">
                        <span>Escala de Rebanho ({herdScale} heads)</span>
                        <strong>R$ {scaleSurcharge}/mês</strong>
                      </div>
                    )}
                    <div className="item-row">
                      <span>{userLicenses} Licenças de Acesso</span>
                      <strong>R$ {licenseSurcharge}/mês</strong>
                    </div>

                    {selectedCount >= 2 && (
                      <div className="item-row text-emerald">
                        <span>Desconto Combo ({selectedCount === 3 ? "20%" : "10%"})</span>
                        <strong>-{selectedCount === 3 ? "20%" : "10%"}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="card-divider-dashed"></div>

                <div className="proposal-totals-block">
                  <div className="total-row-main">
                    <span className="lbl">INVESTIMENTO MENSAL:</span>
                    <span className="val-total-price text-gradient">R$ {finalPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="total-row-savings">
                    <span className="lbl">Retorno Anual Operacional Estimado:</span>
                    <span className="val text-emerald">R$ {estimatedSavings.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="proposal-cta-wrapper">
                  <Link to="/login" className="btn-contract-confirm">
                    Assinar Contrato de Licença
                    <ArrowRight size={16} />
                  </Link>
                  <span className="disclaimer-text">Documento digital gerado de forma segura e auditável por IA.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Section: FAQ Accordions --- */}
      <section className="faq-section" id="faq">
        <div className="container faq-narrow-box">
          <div className="section-header-left">
            <span className="section-tag">PERGUNTAS RELEVANTES</span>
            <h2 className="section-title">Dúvidas Frequentes</h2>
            <p className="section-subtitle">Respostas técnicas e operacionais sobre a nossa infraestrutura corporativa.</p>
          </div>

          <div className="faq-accordions-list">
            {[
              {
                q: "Por que a base de dados do Tauze é isolada?",
                a: "A imensa maioria das soluções SaaS compartilha tabelas e pools públicos de dados de múltiplos clientes. No Tauze, cada fazenda conta com seu próprio contêiner computacional e chaves exclusivas de criptografia AES-256, blindando totalmente suas margens comerciais."
              },
              {
                q: "Como o simulador calcula a economia operacional?",
                a: "O cálculo do retorno estimado baseia-se na eliminação de perdas operacionais em abastecimentos móveis e na antecipação e otimização do peso ideal do rebanho gerada pelos algoritmos de pesagem voluntária."
              },
              {
                q: "O sistema opera off-line em pastos isolados?",
                a: "Perfeitamente. O barramento tecnológico foi construído com arquitetura off-line-first. Registros de RFID, balanças e consumos de frotas são salvos no dispositivo e sincronizados assim que houver conectividade LoRa ou internet."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`faq-accordion-item ${faqOpen === idx ? 'expanded' : ''}`}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="accordion-question">
                  <span>{item.q}</span>
                  <ChevronDown size={16} className="chevron-icon" />
                </div>
                <AnimatePresence>
                  {faqOpen === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="accordion-answer"
                    >
                      <p>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="elegant-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo-group">
              <TauzeLogo size={36} />
              <span className="brand">tauze</span>
            </div>
            <p>Governança digital agroindustrial soberana, analítica e encriptada para marcas líderes de mercado.</p>
          </div>
          <div className="footer-links">
            <div className="col">
              <h5>Módulos</h5>
              <a href="#control-room">Pecuária RFID</a>
              <a href="#control-room">Telemetria Lora</a>
              <a href="#control-room">Hedge Financeiro</a>
            </div>
            <div className="col">
              <h5>Contrato</h5>
              <a href="#configurator">Proposta Digital</a>
              <a href="/login">Terminal Seguro</a>
              <a href="#faq">Políticas de Isolamento</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Garantidas.</p>
          </div>
        </div>
      </footer>

      {/* Embedded CSS styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap');

        .sovereign-operations {
          --bg-canvas: #ffffff;
          --bg-panel: #f8fafc;
          --accent: #00b865;
          --accent-light: rgba(0, 184, 101, 0.05);
          --accent-border: rgba(0, 184, 101, 0.1);
          --text-main: #0f172a;
          --text-muted: #475569;
          --border-light: #e2e8f0;
          --shadow-glow: rgba(0, 184, 101, 0.03);

          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          scroll-behavior: smooth;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .gradient-text {
          background: linear-gradient(to right, var(--text-main), var(--accent), #10b981);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .text-gradient {
          background: linear-gradient(to right, var(--text-main), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* --- Sleek Financial Marquee Ticker --- */
        .financial-ticker-bar {
          background: #0f172a;
          color: #ffffff;
          height: 40px;
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

        .ticker-wrapper {
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .ticker-content {
          display: flex;
          animation: marquee 25s linear infinite;
        }

        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: monospace;
          font-size: 0.72rem;
          font-weight: 700;
          margin-right: 48px;
          color: rgba(255, 255, 255, 0.85);
        }

        .ticker-item .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
        }

        .ticker-item .trend {
          font-weight: 800;
          font-size: 0.68rem;
        }

        .ticker-item .trend.positive { color: var(--accent); }
        .ticker-item .trend.negative { color: #ff5f56; }

        /* --- Ambient Visual Canvas --- */
        .ambient-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .structural-radial-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 184, 101, 0.04) 1.5px, transparent 1.5px);
          background-size: 44px 44px;
          opacity: 0.8;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
        }

        .glowing-mint-orb-top {
          position: absolute;
          top: -10%;
          right: -5%;
          width: 650px;
          height: 650px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.05) 0%, transparent 70%);
          filter: blur(100px);
        }

        .glowing-mint-orb-bottom {
          position: absolute;
          bottom: 15%;
          left: -10%;
          width: 550px;
          height: 550px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.04) 0%, transparent 70%);
          filter: blur(100px);
        }

        /* --- Navbar --- */
        .noir-nav {
          position: fixed;
          top: 40px; /* Offset for financial ticker */
          left: 0;
          right: 0;
          z-index: 1000;
          height: 96px;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .noir-nav.scrolled {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 76px;
          border-bottom: 1px solid var(--border-light);
          box-shadow: 0 4px 30px rgba(0, 184, 101, 0.02);
        }

        .nav-container {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon-wrapper {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .brand {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.55rem;
          letter-spacing: -0.04em;
          line-height: 1;
          text-transform: lowercase;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .version {
          font-size: 0.62rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.08em;
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
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: var(--text-main);
        }

        .btn-terminal {
          background: var(--text-main);
          color: #ffffff;
          padding: 11px 20px;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .btn-terminal:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(15, 23, 42, 0.15);
        }

        /* --- Hero --- */
        .hero-section {
          padding: 220px 0 100px;
          position: relative;
          z-index: 1;
        }

        .hero-layout {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 28px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 5.6rem;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.05em;
          margin-bottom: 24px;
          max-width: 950px;
          text-transform: lowercase;
        }

        .hero-description {
          font-size: 1.3rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 44px;
          max-width: 720px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .btn-primary-large {
          background: var(--accent);
          color: #ffffff;
          padding: 18px 36px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.25);
          transition: all 0.3s;
        }

        .btn-primary-large:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 184, 101, 0.35);
        }

        .btn-secondary-large {
          background: hsl(var(--bg-card));
          color: var(--text-main);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 18px 32px;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.01);
          transition: all 0.3s;
        }

        .btn-secondary-large:hover {
          background: var(--bg-panel);
          border-color: rgba(0, 0, 0, 0.15);
        }

        /* --- Control Room Dashboard Simulation --- */
        .control-room-section {
          padding: 80px 0 120px;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-tag {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.25em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.4rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 1.15rem;
          color: var(--text-muted);
          margin-top: 12px;
          max-width: 600px;
          margin-inline: auto;
          line-height: 1.6;
        }

        .room-layout-panel {
          max-width: 1100px;
          margin-inline: auto;
        }

        .dashboard-console-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--accent-border);
          border-radius: 28px;
          box-shadow: 0 35px 70px var(--shadow-glow), 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          display: flex;
          flex-direction: column;
        }

        .dashboard-console-header {
          background: hsl(var(--bg-main));
          padding: 16px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
        }

        .frame-dots {
          display: flex;
          gap: 6px;
        }

        .frame-dots span {
          width: 9px;
          height: 9px;
          border-radius: 50%;
        }

        .frame-dots span:nth-child(1) { background: #ff5f56; }
        .frame-dots span:nth-child(2) { background: #ffbd2e; }
        .frame-dots span:nth-child(3) { background: #27c93f; }

        .frame-title {
          font-family: monospace;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .frame-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.72rem;
          color: var(--accent);
          font-weight: 700;
        }

        .dashboard-tabs-bar {
          display: flex;
          background: hsl(var(--bg-main));
          border-bottom: 1px solid var(--border-light);
        }

        .tab-btn-item {
          flex: 1;
          padding: 16px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-muted);
          font-size: 0.82rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s;
        }

        .tab-btn-item:hover {
          color: var(--text-main);
        }

        .tab-btn-item.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          background: hsl(var(--bg-card));
        }

        .dashboard-body {
          padding: 40px;
          min-height: 380px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .sim-block {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .sim-intro h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .sim-intro p {
          font-size: 0.9rem;
          color: var(--text-muted);
        }

        .sim-metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }

        .metric-cell {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .metric-cell .label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .metric-cell .val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 850;
        }

        .sim-chart-box {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 18px;
          padding: 20px;
        }

        .lbl-title {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 12px;
        }

        .bezier-curve-svg {
          width: 100%;
          height: 80px;
        }

        .sim-bar-charts {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 60px;
          width: 100%;
        }

        .bar-column {
          flex: 1;
          background: hsl(var(--bg-main));
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-column .bar-fill {
          width: 100%;
          background: linear-gradient(to top, var(--accent), #10b981);
          border-radius: 4px;
        }

        .security-shield-card {
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          border-radius: 18px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .security-shield-card .shield-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .text-sec-info strong {
          display: block;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .text-sec-info p {
          margin: 0;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        /* Console screen live logs */
        .live-log-console {
          border-top: 1px solid var(--border-light);
          padding-top: 24px;
        }

        .console-title-text {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 12px;
        }

        .console-display-window {
          background: #0f172a;
          border-radius: 12px;
          padding: 18px;
          font-family: monospace;
          font-size: 0.78rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 80px;
        }

        .console-row-line {
          display: flex;
          gap: 8px;
          line-height: 1.4;
        }

        .console-row-line .arrow-cmd {
          color: var(--accent);
          font-weight: bold;
        }

        .console-row-line .log-text {
          color: rgba(255, 255, 255, 0.85);
        }

        /* --- Technical Specs Catalog List --- */
        .specs-section {
          padding: 100px 0;
          position: relative;
          z-index: 1;
        }

        .section-header-left {
          text-align: left;
          margin-bottom: 72px;
        }

        .specs-list-table {
          border-top: 1px solid var(--text-main);
          display: flex;
          flex-direction: column;
        }

        .spec-row-item {
          display: grid;
          grid-template-columns: 1fr 2fr;
          padding: 28px 0;
          border-bottom: 1px solid var(--border-light);
          align-items: center;
          gap: 32px;
          text-align: left;
        }

        .spec-row-item .spec-label {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
        }

        .spec-row-item .spec-val {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* --- Dynamic Pricing Configurator --- */
        .configurator-section {
          padding: 120px 0;
          background: var(--bg-panel);
          border-block: 1px solid var(--border-light);
          position: relative;
          z-index: 1;
        }

        .config-header-center {
          text-align: center;
          margin-bottom: 80px;
        }

        .configurator-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 48px;
          align-items: stretch;
        }

        .configurator-controls {
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        .control-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.005);
          text-align: left;
        }

        .control-card h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 4px;
        }

        .control-card .description {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .toggles-selection-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .toggle-selection-item {
          border: 1.5px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.25s;
        }

        .toggle-selection-item:hover {
          border-color: rgba(0, 184, 101, 0.25);
          background: var(--bg-panel);
        }

        .toggle-selection-item.checked {
          border-color: var(--accent);
          background: rgba(0, 184, 101, 0.02);
        }

        .checkbox-frame {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid var(--border-light);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.2s;
        }

        .toggle-selection-item.checked .checkbox-frame {
          border-color: var(--accent);
          background: var(--accent);
        }

        .info-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .info-text strong {
          font-size: 0.95rem;
        }

        .info-text span {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .slider-wrapper-premium {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .slider-wrapper-premium:last-child {
          margin-bottom: 0;
        }

        .slider-lbl-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .slider-lbl-row strong {
          color: var(--accent);
        }

        .premium-range-input {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 100px;
          background: hsl(var(--bg-main));
          outline: none;
        }

        .premium-range-input::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 184, 101, 0.25);
        }

        /* --- Dynamic Pro-Forma Digital Contract Card --- */
        .configurator-proposal-preview {
          display: flex;
        }

        .pro-forma-proposal-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--accent-border);
          border-radius: 28px;
          padding: 40px;
          width: 100%;
          box-shadow: 0 30px 60px rgba(0, 184, 101, 0.05);
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 24px;
          overflow: hidden;
          text-align: left;
        }

        .proposal-badge-stamp {
          position: absolute;
          top: 36px;
          right: -32px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          font-size: 0.65rem;
          font-weight: 900;
          padding: 6px 36px;
          transform: rotate(45deg);
          letter-spacing: 0.1em;
        }

        .proposal-header-card {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .proposal-header-card h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          margin-bottom: 2px;
        }

        .proposal-header-card span {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .card-divider-dashed {
          height: 1px;
          border-top: 1px dashed var(--border-light);
        }

        .proposal-identity {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .identity-row {
          display: flex;
          justify-content: space-between;
          font-family: monospace;
          font-size: 0.78rem;
        }

        .identity-row .lbl {
          color: var(--text-muted);
        }

        .identity-row .val {
          font-weight: 700;
        }

        .proposal-itemization {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .proposal-itemization h5 {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: 0.05em;
        }

        .itemization-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .item-row strong {
          color: var(--text-main);
        }

        .proposal-itemization .text-emerald {
          color: var(--accent);
          font-weight: 700;
        }

        .proposal-totals-block {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .total-row-main {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .total-row-main .lbl {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .val-total-price {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 900;
          line-height: 1;
        }

        .total-row-savings {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .total-row-savings .lbl {
          color: var(--text-muted);
        }

        .proposal-cta-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .btn-contract-confirm {
          background: var(--text-main);
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.3s;
          box-shadow: 0 10px 20px rgba(15, 23, 42, 0.15);
        }

        .btn-contract-confirm:hover {
          background: #000000;
          transform: translateY(-2px);
        }

        .disclaimer-text {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
        }

        /* --- Section: FAQ Accordions --- */
        .faq-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .faq-narrow-box {
          max-width: 800px;
        }

        .faq-accordions-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 48px;
        }

        .faq-accordion-item {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          text-align: left;
        }

        .faq-accordion-item:hover {
          border-color: rgba(0, 184, 101, 0.15);
        }

        .accordion-question {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .accordion-question .chevron-icon {
          transition: transform 0.3s;
          color: var(--text-muted);
        }

        .faq-accordion-item.expanded .chevron-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .accordion-answer {
          padding: 0 24px 24px;
          color: var(--text-muted);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* --- Elegant Footer --- */
        .elegant-footer {
          padding: 100px 0 0;
          border-top: 1px solid var(--border-light);
          background: hsl(var(--bg-card));
          position: relative;
          z-index: 1;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 1.8fr 1.2fr;
          gap: 64px;
          margin-bottom: 64px;
        }

        .footer-brand p {
          color: var(--text-muted);
          margin-top: 20px;
          font-size: 1rem;
          line-height: 1.6;
          max-width: 480px;
          text-align: left;
        }

        .footer-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .footer-links .col h5 {
          font-weight: 800;
          margin-bottom: 18px;
          color: var(--text-main);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
          text-align: left;
        }

        .footer-links .col a {
          display: block;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 0.9rem;
          transition: color 0.3s;
          text-align: left;
        }

        .footer-links .col a:hover {
          color: var(--text-main);
        }

        .footer-bottom {
          padding: 36px 0;
          border-top: 1px solid var(--border-light);
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        /* --- Responsive media queries --- */
        @media (max-width: 1024px) {
          .spec-row-item { grid-template-columns: 1fr; gap: 8px; padding: 20px 0; }
          .configurator-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .hero-title { font-size: 3.6rem; }
          .dashboard-tabs-bar { flex-wrap: wrap; }
          .tab-btn-item { padding: 12px; font-size: 0.78rem; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.8rem; }
          .val-total-price { font-size: 1.8rem; }
          .metric-cell { padding: 14px; }
          .metric-cell .val { font-size: 1.4rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
