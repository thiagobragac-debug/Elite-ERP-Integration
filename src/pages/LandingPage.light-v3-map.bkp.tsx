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
  Sun, 
  Moon, 
  Check, 
  TrendingUp, 
  Layout, 
  Smartphone, 
  Cloud, 
  FileText,
  ChevronDown,
  RefreshCw,
  Server,
  Map,
  Compass,
  Zap,
  Sliders,
  DollarSign as CurrencyIcon
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

type SectorType = 'pastos' | 'logistica' | 'tecnologia' | 'financeiro';

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  
  // Custom command center state
  const [activeSector, setActiveSector] = useState<SectorType>('pastos');
  const [telemetryLogs, setTelemetryLogs] = useState<string[]>([]);
  
  // ROI Calculator states
  const [herdSize, setHerdSize] = useState<number>(850);
  const [fleetSize, setFleetSize] = useState<number>(12);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  // Simulation parameters
  const calculatedSavings = Math.round((herdSize * 45) + (fleetSize * 4200));
  const additionalMeatTons = ((herdSize * 18.5) / 1000).toFixed(1);
  const planCostMultiplier = Math.round((herdSize * 0.45) + (fleetSize * 15));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Simulação de telemetria em tempo real baseada no setor ativo
  useEffect(() => {
    const defaultLogs: Record<SectorType, string[]> = {
      pastos: [
        "[SYSTEM] Balança Pasto #4 calibrada com sucesso.",
        "[RFID] Lote 12B lido por antena curral principal - Peso médio 482kg.",
        "[IA-GMD] Curva estatística projeta abate ideal em 14 dias."
      ],
      logistica: [
        "[FLEET] Trator JD #3 em movimento - Consumo médio 12.4 L/h.",
        "[FUEL] Dispositivo de telemetria tanque abastecido - Nível: 94%.",
        "[TELEMETRY] Sensor de umidade no motor emitindo alerta preventivo."
      ],
      tecnologia: [
        "[HYBRID-CLOUD] Isolamento da base tenant verificado (AES-256).",
        "[SYNC] Sincronização offline-first concluída sem perda de pacotes.",
        "[MILITARY-SHIELD] Conexão com barramento de telemetria local encriptada."
      ],
      financeiro: [
        "[B3-HEDGE] Mapeamento futuro de boi gordo B3 - Previsão R$ 285/@.",
        "[AUDIT] Fluxo contábil exportado em compliance com SOX.",
        "[RECONCILIATION] Integração OFX consolidada automaticamente."
      ]
    };
    
    setTelemetryLogs(defaultLogs[activeSector]);

    // Intervalo para adicionar logs dinâmicos aleatórios
    const interval = setInterval(() => {
      const extraLogs: Record<SectorType, string[]> = {
        pastos: [
          `[RFID] Sucesso na pesagem voluntária Animal #${Math.floor(Math.random() * 800 + 100)} - Peso: ${Math.floor(Math.random() * 50 + 450)}kg.`,
          `[BIOMETRY] Lote #${Math.floor(Math.random() * 10 + 1)} sincronizado no app local.`
        ],
        logistica: [
          `[FLEET] Pulverizador #${Math.floor(Math.random() * 5 + 1)} conectado - Telemetria OK.`,
          `[ROUTE] Cerca virtual ultrapassada pelo veículo Frota #${Math.floor(Math.random() * 12 + 1)}.`
        ],
        tecnologia: [
          `[SECURITY] Chave criptográfica rotacionada com sucesso.`,
          `[DATABASE] Latência de leitura local-cloud: ${Math.floor(Math.random() * 15 + 5)}ms.`
        ],
        financeiro: [
          `[B3-HEDGE] Margem de proteção ativada para o Lote L-${Math.floor(Math.random() * 20 + 1)}A.`,
          `[RECONCILIATION] Lançamento de ${Math.floor(Math.random() * 50000 + 5000)} BRL reconciliado.`
        ]
      };
      
      const newLog = extraLogs[activeSector][Math.floor(Math.random() * extraLogs[activeSector].length)];
      setTelemetryLogs(prev => [newLog, prev[0], prev[1]].slice(0, 3));
    }, 4500);

    return () => clearInterval(interval);
  }, [activeSector]);

  // Busca de planos do Supabase
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('saas_plans')
          .select('*').limit(500)
          .gt('price', 0)
          .order('price', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const popularIndex = data.length > 1 ? 1 : 0;
          
          const formattedPlans = data.map((p, index) => ({
            id: p.id,
            name: p.name,
            monthlyPrice: p.price,
            yearlyPrice: Math.round(p.price * 12 * 0.8), // 20% de desconto
            description: `Acesso ao plano ${p.name} com ${p.users_limit} usuários e ${p.storage_gb}GB de armazenamento.`,
            features: Array.isArray(p.features) ? p.features : [],
            cta: 'Assinar Agora',
            popular: index === popularIndex
          }));
          setPlans(formattedPlans);
        }
      } catch (err) {
        console.error('Error fetching plans:', err);
      }
    };
    fetchPlans();
  }, []);

  return (
    <div className={`tauze-landing light-command-center`}>
      
      {/* --- Visual Topographical Background Grid --- */}
      <div className="ambient-background">
        <div className="dotted-grid"></div>
        <div className="topological-isolines"></div>
        <div className="organic-glow glow-emerald"></div>
        <div className="organic-glow glow-mint"></div>
      </div>

      {/* --- Navigation --- */}
      <nav className={`noir-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo-group">
            <div className="logo-icon-wrapper">
              <TauzeLogo size={34} />
            </div>
            <div className="logo-text">
              <span className="brand">tauze</span>
              <span className="version">COMMAND 6.0</span>
            </div>
          </div>
          
          <div className="nav-links">
            <a href="#map-center">Mapa Operacional</a>
            <a href="#roi-calc">Simulador de ROI</a>
            <a href="#lifecycle">Jornada de Ativos</a>
            <a href="#pricing">Modelos de Assinatura</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-terminal">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero: Ultra Minimal & Immersive --- */}
      <section className="hero-section">
        <div className="container hero-layout">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-header-block"
          >
            <div className="badge-premium">
              <Compass size={12} className="spin-slow" />
              <span>A Nova Fronteira do Agro Corporativo</span>
            </div>
            
            <h1 className="hero-title">
              Soberania digital <br/>
              <span className="gradient-text">para marcas que ditam o mercado.</span>
            </h1>
            
            <p className="hero-description">
              Uma abordagem radicalmente nova para o controle agroindustrial. Integre biometria de rebanhos, telemetria de frotas e auditoria B3 em um painel central de alta performance.
            </p>
            
            <div className="hero-actions">
              <Link to="/login" className="btn-primary">
                Iniciar Operação
                <ArrowRight size={18} />
              </Link>
              <a href="#map-center" className="btn-secondary">
                Ver Centro de Comando
              </a>
            </div>
          </motion.div>

          {/* Minimalist Brands wall */}
          <div className="brands-wall">
            <span className="brand-tag">TECNOLOGIA HOMOLOGADA POR</span>
            <div className="brands-logos">
              <div className="brand-logo-item"><TauzeLogo size={16} color="#475569" /> AgroSoberano</div>
              <div className="brand-logo-item"><TauzeLogo size={16} color="#475569" /> TerraForte</div>
              <div className="brand-logo-item"><TauzeLogo size={16} color="#475569" /> Recinto Digital</div>
              <div className="brand-logo-item"><TauzeLogo size={16} color="#475569" /> BovinoTech</div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: The Interactive Command Center Map (THE REVOLUTIONARY ELEMENT) --- */}
      <section className="map-center-section" id="map-center">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">TECNOLOGIA EXCLUSIVA</span>
            <h2 className="section-title">Centro de Comando Topográfico</h2>
            <p className="section-subtitle">
              Sua fazenda em alta resolução matemática. Clique nos setores da planta vetorial abaixo para simular as conexões em tempo real.
            </p>
          </div>

          <div className="command-grid">
            
            {/* Left Side: The Interactive SVG Map */}
            <div className="map-visual-container">
              <div className="map-card-wrapper">
                <div className="map-grid-overlay"></div>
                <div className="map-hud-header">
                  <div className="hud-indicator">
                    <span className="pulse-dot"></span>
                    <span>SINAL ATIVO LORA</span>
                  </div>
                  <span className="coordinate">LAT -21.1789, LON -47.9902</span>
                </div>

                {/* Vector Map Drawing */}
                <div className="interactive-svg-map">
                  <svg viewBox="0 0 500 400" className="map-vector">
                    {/* Topographical Lines (decorative) */}
                    <path d="M 20,80 Q 120,40 220,110 T 480,90" fill="none" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="2" />
                    <path d="M 10,180 Q 150,130 250,220 T 490,190" fill="none" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="2" />
                    <path d="M 30,300 Q 130,280 270,340 T 470,290" fill="none" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="2" />
                    
                    {/* Road Network */}
                    <path d="M 250,0 L 250,400" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />
                    <path d="M 0,200 L 500,200" fill="none" stroke="rgba(0,0,0,0.03)" strokeWidth="8" />

                    {/* Sector A: Pastos de Recria */}
                    <g 
                      className={`map-sector-group ${activeSector === 'pastos' ? 'active' : ''}`}
                      onClick={() => setActiveSector('pastos')}
                    >
                      <rect x="30" y="30" width="180" height="130" rx="16" className="sector-bg" />
                      <text x="120" y="90" textAnchor="middle" className="sector-label">Pecuária de Precisão</text>
                      {activeSector === 'pastos' && (
                        <circle cx="120" cy="115" r="5" className="glowing-node" />
                      )}
                    </g>

                    {/* Sector B: Logística e Garagem */}
                    <g 
                      className={`map-sector-group ${activeSector === 'logistica' ? 'active' : ''}`}
                      onClick={() => setActiveSector('logistica')}
                    >
                      <rect x="290" y="30" width="180" height="130" rx="16" className="sector-bg" />
                      <text x="380" y="90" textAnchor="middle" className="sector-label">Logística & Frotas</text>
                      {activeSector === 'logistica' && (
                        <circle cx="380" cy="115" r="5" className="glowing-node" />
                      )}
                    </g>

                    {/* Sector C: Tecnologia e Silos */}
                    <g 
                      className={`map-sector-group ${activeSector === 'tecnologia' ? 'active' : ''}`}
                      onClick={() => setActiveSector('tecnologia')}
                    >
                      <rect x="30" y="240" width="180" height="130" rx="16" className="sector-bg" />
                      <text x="120" y="300" textAnchor="middle" className="sector-label">Nuvem Soberana</text>
                      {activeSector === 'tecnologia' && (
                        <circle cx="120" cy="325" r="5" className="glowing-node" />
                      )}
                    </g>

                    {/* Sector D: Hub Financeiro / B3 */}
                    <g 
                      className={`map-sector-group ${activeSector === 'financeiro' ? 'active' : ''}`}
                      onClick={() => setActiveSector('financeiro')}
                    >
                      <rect x="290" y="240" width="180" height="130" rx="16" className="sector-bg" />
                      <text x="380" y="300" textAnchor="middle" className="sector-label">Hedge & B3 Inteligência</text>
                      {activeSector === 'financeiro' && (
                        <circle cx="380" cy="325" r="5" className="glowing-node" />
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>

            {/* Right Side: Visual Telemetry Modals */}
            <div className="telemetry-panel-container">
              <AnimatePresence mode="wait">
                <motion.div 
                  key={activeSector}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="telemetry-card"
                >
                  <div className="card-badge">
                    <Zap size={12} />
                    <span>MÓDULO DE TELEMETRIA ATIVO</span>
                  </div>

                  {activeSector === 'pastos' && (
                    <div className="sector-telemetry-body">
                      <h3>Pecuária de Precisão</h3>
                      <p className="desc">Acompanhamento automatizado de ganho médio diário de peso (GMD) por radiofrequência (RFID).</p>
                      
                      <div className="metric-row">
                        <div className="mini-metric">
                          <span className="label">Pesagem Recente</span>
                          <span className="value">482.4 kg</span>
                        </div>
                        <div className="mini-metric">
                          <span className="label">Engorda Média</span>
                          <span className="value text-emerald">+1.42 kg/dia</span>
                        </div>
                      </div>

                      {/* Smooth SVG Bezier Livestock graph */}
                      <div className="graph-box">
                        <span className="graph-title">CURVA PROJETADA DE PESAGEM (LOTE 12B)</span>
                        <svg viewBox="0 0 300 80" className="bezier-graph">
                          <path 
                            d="M 10,65 Q 80,45 150,30 T 290,12" 
                            fill="none" 
                            stroke="var(--accent)" 
                            strokeWidth="3" 
                          />
                          <path 
                            d="M 10,65 Q 80,45 150,30 T 290,12 L 290,75 L 10,75 Z" 
                            fill="url(#grad-emerald)" 
                            opacity="0.1" 
                          />
                          <defs>
                            <linearGradient id="grad-emerald" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  )}

                  {activeSector === 'logistica' && (
                    <div className="sector-telemetry-body">
                      <h3>Logística de Campo e Frotas</h3>
                      <p className="desc">Controle em tempo real de abastecimentos móveis, rendimentos operacionais e telemetria de tratorização.</p>
                      
                      <div className="metric-row">
                        <div className="mini-metric">
                          <span className="label">Consumo de Ativos</span>
                          <span className="value">12.4 L/h</span>
                        </div>
                        <div className="mini-metric">
                          <span className="label">Eficiência Geral</span>
                          <span className="value text-emerald">91.8%</span>
                        </div>
                      </div>

                      {/* Fleet Bar graphs */}
                      <div className="graph-box">
                        <span className="graph-title">UTILIZAÇÃO DIÁRIA DE DIESEL S10</span>
                        <div className="bar-charts-mini">
                          {[35, 60, 45, 80, 50, 95].map((val, idx) => (
                            <div key={idx} className="bar-wrapper">
                              <div className="bar-fill" style={{ height: `${val}%` }}></div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSector === 'tecnologia' && (
                    <div className="sector-telemetry-body">
                      <h3>Nuvem Soberana Híbrida</h3>
                      <p className="desc">Total conformidade e proteção absoluta dos seus ativos agrícolas. Isolamento completo de servidores.</p>
                      
                      <div className="metric-row">
                        <div className="mini-metric">
                          <span className="label">Protocolo</span>
                          <span className="value">AES-256-GCM</span>
                        </div>
                        <div className="mini-metric">
                          <span className="label">Nuvem Local</span>
                          <span className="value text-emerald">100% Ativa</span>
                        </div>
                      </div>

                      <div className="tech-shield-preview">
                        <ShieldCheck size={28} className="shield-icon" />
                        <div className="shield-text">
                          <strong>Isolamento de Base Nível Militar</strong>
                          <p>O Tauze isola fisicamente e de forma encriptada os seus dados agroindustriais das outras marcas.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeSector === 'financeiro' && (
                    <div className="sector-telemetry-body">
                      <h3>Hedge e Inteligência B3</h3>
                      <p className="desc">Monitoramento estatístico de preços futuros e integração financeira automática com a Bolsa de Valores.</p>
                      
                      <div className="metric-row">
                        <div className="mini-metric">
                          <span className="label">Hedge Projeta</span>
                          <span className="value">R$ 285.50/@</span>
                        </div>
                        <div className="mini-metric">
                          <span className="label">Exposição Financeira</span>
                          <span className="value text-emerald">Mínima (0.8%)</span>
                        </div>
                      </div>

                      {/* Sparkline curve */}
                      <div className="graph-box">
                        <span className="graph-title">TENDÊNCIA FUTURA BOI GORDO B3</span>
                        <svg viewBox="0 0 300 60" className="bezier-graph">
                          <path 
                            d="M 10,45 Q 70,15 140,55 T 290,18" 
                            fill="none" 
                            stroke="var(--accent)" 
                            strokeWidth="2.5" 
                          />
                        </svg>
                      </div>
                    </div>
                  )}

                  {/* Dynamic scrolling logs console */}
                  <div className="telemetry-console-logs">
                    <span className="console-title">TERMINAL LIVE FEED</span>
                    <div className="console-screen">
                      {telemetryLogs.map((log, index) => (
                        <div key={index} className="log-row">
                          <span className="bullet">&gt;</span>
                          <span className="text">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </div>
      </section>

      {/* --- Section: The Live ROI Calculator (THE STUNNING USER ENGAGEMENT ELEMENT) --- */}
      <section className="roi-calculator-section" id="roi-calc">
        <div className="container calc-layout">
          
          <div className="calc-text">
            <span className="section-tag">SIMULE SEU OPERACIONAL</span>
            <h2 className="section-title">O impacto da eficiência no bolso.</h2>
            <p className="section-subtitle">
              Configure abaixo o tamanho da sua operação e descubra a projeção de economia direta gerada pela nossa blindagem digital.
            </p>

            <div className="sliders-container">
              <div className="slider-group">
                <div className="slider-header">
                  <span>Rebanho (Cabeças de Gado)</span>
                  <span className="slider-value">{herdSize.toLocaleString()}</span>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="50"
                  value={herdSize} 
                  onChange={(e) => setHerdSize(parseInt(e.target.value))}
                  className="custom-range-slider"
                />
              </div>

              <div className="slider-group">
                <div className="slider-header">
                  <span>Frota de Ativos (Máquinas/Tratores)</span>
                  <span className="slider-value">{fleetSize}</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="100" 
                  step="1"
                  value={fleetSize} 
                  onChange={(e) => setFleetSize(parseInt(e.target.value))}
                  className="custom-range-slider"
                />
              </div>
            </div>
          </div>

          {/* Right Side Output Box */}
          <div className="calc-outputs-container">
            <div className="glass-output-card">
              <div className="output-top">
                <span className="lbl">RETORNO ESTIMADO ANUAL</span>
                <span className="output-val text-gradient">R$ {calculatedSavings.toLocaleString('pt-BR')}</span>
                <p className="explanation">Cálculo simulado atrelado à diminuição no consumo de combustível (-8.2%) e ao ganho médio de peso otimizado.</p>
              </div>

              <div className="output-divider"></div>

              <div className="output-middle">
                <div className="mid-item">
                  <span className="lbl">Carne Excedente Projetada</span>
                  <span className="val">{additionalMeatTons} toneladas</span>
                </div>
                <div className="mid-item">
                  <span className="lbl">Licenciamento Estimado</span>
                  <span className="val">R$ {planCostMultiplier.toLocaleString('pt-BR')}/mês</span>
                </div>
              </div>

              <div className="output-bottom">
                <Link to="/login" className="btn-primary full-width">
                  Quero Contratar esta Operação
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- Section: The Modern "Grass-to-B3" Lifecycle Interactive Timeline --- */}
      <section className="lifecycle-section" id="lifecycle">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">FLUXO DE FLUIDEZ</span>
            <h2 className="section-title">A Jornada do Ativo Biológico</h2>
            <p className="section-subtitle">
              Veja como nossa plataforma interconecta todas as frentes de uma marca líder do mercado agroindustrial brasileiro.
            </p>
          </div>

          <div className="vertical-timeline">
            {[
              {
                step: "01",
                title: "Identificação Inteligente no Curral",
                desc: "Brincos eletrônicos com RFID e leitores Bluetooth garantem o rastreamento biológico blindado de cada animal sem stress.",
                badge: "PESAGEM VOLUNTÁRIA LORA"
              },
              {
                step: "02",
                title: "Rastreabilidade e Nutrição Automatizada",
                desc: "Algoritmos avançados cruzam a alimentação fornecida com o peso aferido diariamente pelas balanças de pasto voluntárias.",
                badge: "EFICIÊNCIA BIOMÉTRICA"
              },
              {
                step: "03",
                title: "Logística e Telemetria de Frota Integrada",
                desc: "Consumo de combustível monitorado diretamente da bomba de abastecimento ao trator, mitigando desvios e otimizando rotas de pasto.",
                badge: "TELEMETRIA DE BARRAMENTO"
              },
              {
                step: "04",
                title: "Liquidez e Proteção Financeira na B3",
                desc: "Nossa IA prediz o melhor momento comercial e gera contratos automáticos de hedge, travando o preço de boi gordo no pico futuro.",
                badge: "COMPLIANCE SOX / AUDITÁVEL"
              }
            ].map((item, idx) => (
              <div key={idx} className="timeline-node">
                <div className="node-marker">
                  <span className="num">{item.step}</span>
                  <div className="marker-line"></div>
                </div>
                <div className="node-content-box">
                  <span className="node-tag">{item.badge}</span>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Section: Transparent Pricing --- */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">OPÇÕES DISPONÍVEIS</span>
            <h2 className="section-title">Modelos Sérios e Transparentes</h2>
            <p className="section-subtitle">
              Hospede sua operação em bases totalmente independentes. Planos justos para escalabilidade robusta.
            </p>
          </div>

          <div className="pricing-grid">
            {plans.length > 0 ? (
              plans.map((plan, index) => (
                <div key={index} className={`pricing-card ${plan.popular ? 'highlighted-premium' : ''}`}>
                  {plan.popular && <span className="card-banner">A Escolha Soberana</span>}
                  
                  <div className="card-top">
                    <h3>{plan.name}</h3>
                    <p className="desc">{plan.description}</p>
                    <div className="price-box">
                      <span className="currency">R$</span>
                      <span className="price">{plan.monthlyPrice.toLocaleString('pt-BR')}</span>
                      <span className="period">/mês</span>
                    </div>
                  </div>

                  <div className="card-features">
                    <span className="feats-title">O QUE ESTÁ INCLUSO:</span>
                    <div className="feats-list">
                      {plan.features.map((feat: string, i: number) => (
                        <div key={i} className="feat-row">
                          <CheckCircle2 size={14} className="check-icon" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-footer">
                    <Link to="/login" className={`cta-button-premium ${plan.popular ? 'primary' : 'secondary'}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              // Fallback cards em caso de erro na consulta
              [
                {
                  name: "Tauze Light Enterprise",
                  desc: "Ideal para produtores com rebanho de até 1.000 cabeças.",
                  price: "499",
                  features: ["RFID pareamento completo", "Nuvem local", "Telemetria de até 5 frotas"]
                },
                {
                  name: "Tauze Diamond Pro",
                  desc: "Soberania operacional completa para médias e grandes fazendas.",
                  price: "1.299",
                  features: ["Inteligência de Pesagem Voluntária", "Hedge automático B3", "Suporte 24/7 de barramento"],
                  popular: true
                },
                {
                  name: "Tauze Latam Sovereignty",
                  desc: "Base física de dados isolada para múltiplos tenants e marcas.",
                  price: "3.499",
                  features: ["Ambiente fisicamente isolado", "API com auditorias externas", "Customizações agrobiológicas"]
                }
              ].map((p, idx) => (
                <div key={idx} className={`pricing-card ${p.popular ? 'highlighted-premium' : ''}`}>
                  {p.popular && <span className="card-banner">A Escolha Soberana</span>}
                  
                  <div className="card-top">
                    <h3>{p.name}</h3>
                    <p className="desc">{p.desc}</p>
                    <div className="price-box">
                      <span className="currency">R$</span>
                      <span className="price">{p.price}</span>
                      <span className="period">/mês</span>
                    </div>
                  </div>

                  <div className="card-features">
                    <span className="feats-title">O QUE ESTÁ INCLUSO:</span>
                    <div className="feats-list">
                      {p.features.map((feat, i) => (
                        <div key={i} className="feat-row">
                          <CheckCircle2 size={14} className="check-icon" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-footer">
                    <Link to="/login" className={`cta-button-premium ${p.popular ? 'primary' : 'secondary'}`}>
                      Contratar Operação
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* --- Section: Elegant Light FAQ --- */}
      <section className="faq-section" id="faq">
        <div className="container faq-layout-box">
          <div className="section-header">
            <span className="section-tag">SUPORTE E CONCEITO</span>
            <h2 className="section-title">Perguntas Frequentes</h2>
            <p className="section-subtitle">Tudo o que você precisa saber sobre o barramento operacional da tauze.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Por que as bases de dados são isoladas?",
                a: "A maioria dos sistemas comerciais mistura os registros em um único pool público de banco de dados. O Tauze cria contêineres e partições computacionais encriptadas e exclusivas por fazenda, impedindo vazamentos mercadológicos das suas margens de engorda e frotas."
              },
              {
                q: "O simulador de ROI representa cenários reais?",
                a: "Sim. Os cálculos simulam a eliminação da ineficiência de abastecimento em frotas e estimam a lucratividade adicional baseando-se no ganho de peso voluntário diário gerado por IA."
              },
              {
                q: "O barramento funciona mesmo sem internet?",
                a: "Absolutamente. O aplicativo foi desenhado para registrar as pesagens, telemetrias e manutenções de forma off-line. Ele armazena os dados localmente e sincroniza assim que detecta conectividade celular ou Wi-Fi."
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
            <p>Governança digital agroindustrial soberana para marcas de alto impacto operacional.</p>
          </div>
          <div className="footer-links">
            <div className="col">
              <h5>Tecnologia</h5>
              <a href="#map-center">Pecuária Autônoma</a>
              <a href="#map-center">Telemetria Lora</a>
              <a href="#roi-calc">Simulador de Custos</a>
            </div>
            <div className="col">
              <h5>Corporativo</h5>
              <a href="#pricing">Licenciamentos</a>
              <a href="/login">Terminal Seguro</a>
              <a href="#faq">FAQ Geral</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania Operacional Homologada.</p>
          </div>
        </div>
      </footer>

      {/* Embedded CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800;900&display=swap');

        .light-command-center {
          --bg-canvas: #ffffff;
          --bg-subtle: #f6faf7;
          --accent: #00b865;
          --accent-light: rgba(0, 184, 101, 0.07);
          --accent-border: rgba(0, 184, 101, 0.12);
          --text-main: #0f172a;
          --text-muted: #475569;
          --card-border: rgba(0, 0, 0, 0.05);
          --card-bg: rgba(255, 255, 255, 0.7);
          --glass-shadow: rgba(0, 184, 101, 0.03);

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
          background: linear-gradient(to right, var(--accent), #10b981, #059669);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        /* --- Ambient Background --- */
        .ambient-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .dotted-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 184, 101, 0.06) 1.5px, transparent 1.5px);
          background-size: 40px 40px;
          opacity: 0.8;
          mask-image: radial-gradient(circle at center, black 50%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 50%, transparent 95%);
        }

        .topological-isolines {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(ellipse at 80% 20%, rgba(0, 184, 101, 0.02) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(0, 184, 101, 0.02) 0%, transparent 60%);
          opacity: 0.7;
        }

        .organic-glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.5;
        }

        .glow-emerald {
          top: -10%;
          right: -5%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.06) 0%, transparent 70%);
        }

        .glow-mint {
          bottom: 10%;
          left: -10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
        }

        /* --- Premium Navbar --- */
        .noir-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 96px;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .noir-nav.scrolled {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          height: 76px;
          border-bottom: 1px solid var(--card-border);
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
          margin-top: 1px;
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

        /* --- Hero Section --- */
        .hero-section {
          padding: 180px 0 100px;
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
          padding: 7px 14px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          border-radius: 100px;
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 28px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 4.6rem;
          font-weight: 900;
          line-height: 1.08;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
          max-width: 900px;
        }

        .hero-description {
          font-size: 1.25rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 44px;
          max-width: 680px;
        }

        .hero-actions {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 80px;
        }

        .btn-primary {
          background: var(--accent);
          color: #ffffff;
          padding: 16px 32px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.25);
          transition: all 0.3s;
          border: none;
          cursor: pointer;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 184, 101, 0.35);
        }

        .btn-primary.full-width {
          width: 100%;
          justify-content: center;
        }

        .btn-secondary {
          background: #ffffff;
          color: var(--text-main);
          border: 1px solid rgba(0, 0, 0, 0.08);
          padding: 16px 28px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
          transition: all 0.3s;
        }

        .btn-secondary:hover {
          background: var(--bg-subtle);
          border-color: rgba(0, 0, 0, 0.15);
        }

        /* Minimal Brands wall */
        .brands-wall {
          width: 100%;
          max-width: 1000px;
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .brand-tag {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.12em;
        }

        .brands-logos {
          display: flex;
          justify-content: space-around;
          align-items: center;
          flex-wrap: wrap;
          gap: 32px;
        }

        .brand-logo-item {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 8px;
          opacity: 0.75;
          transition: opacity 0.3s;
        }

        .brand-logo-item:hover {
          opacity: 1;
        }

        /* --- Section: Map Center & Command Console --- */
        .map-center-section {
          padding: 120px 0;
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

        .command-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 40px;
          align-items: stretch;
        }

        .map-visual-container {
          display: flex;
          flex-direction: column;
        }

        .map-card-wrapper {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid var(--accent-border);
          border-radius: 28px;
          box-shadow: 0 30px 60px var(--glass-shadow), 0 1px 3px rgba(0, 0, 0, 0.01);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
          padding: 24px;
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .map-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 184, 101, 0.01) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 184, 101, 0.01) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
        }

        .map-hud-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          font-weight: 700;
          margin-bottom: 24px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
          padding-bottom: 16px;
        }

        .hud-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--accent);
        }

        .pulse-dot {
          width: 8px;
          height: 8px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(0, 184, 101, 0.2);
          animation: pulse-hud 2s infinite;
        }

        @keyframes pulse-hud {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.3); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }

        .coordinate {
          font-family: monospace;
          color: var(--text-muted);
        }

        .interactive-svg-map {
          flex-grow: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-vector {
          width: 100%;
          max-height: 380px;
        }

        .map-sector-group {
          cursor: pointer;
        }

        .sector-bg {
          fill: rgba(255, 255, 255, 0.9);
          stroke: rgba(0, 0, 0, 0.05);
          stroke-width: 1.5;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sector-label {
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.82rem;
          fill: var(--text-muted);
          transition: fill 0.3s;
        }

        .map-sector-group:hover .sector-bg {
          fill: var(--bg-subtle);
          stroke: var(--accent);
          transform: translateY(-2px);
        }

        .map-sector-group:hover .sector-label {
          fill: var(--text-main);
        }

        .map-sector-group.active .sector-bg {
          fill: rgba(0, 184, 101, 0.03);
          stroke: var(--accent);
          stroke-width: 2.5;
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.1);
        }

        .map-sector-group.active .sector-label {
          fill: var(--accent);
          font-weight: 800;
        }

        .glowing-node {
          fill: var(--accent);
          animation: pulse-node 1.5s infinite;
        }

        @keyframes pulse-node {
          0% { r: 4px; opacity: 1; }
          50% { r: 8px; opacity: 0.4; }
          100% { r: 4px; opacity: 1; }
        }

        /* --- Telemetry Panel --- */
        .telemetry-panel-container {
          display: flex;
        }

        .telemetry-card {
          background: rgba(255, 255, 255, 0.75);
          border: 1px solid var(--accent-border);
          border-radius: 28px;
          box-shadow: 0 30px 60px var(--glass-shadow), 0 1px 3px rgba(0, 0, 0, 0.01);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 32px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .card-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          background: var(--accent-light);
          border-radius: 6px;
          color: var(--accent);
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.04em;
          align-self: flex-start;
        }

        .sector-telemetry-body h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .sector-telemetry-body .desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 20px;
        }

        .metric-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        .mini-metric {
          background: #f8fafc;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(0, 0, 0, 0.03);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mini-metric .label {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .mini-metric .value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.55rem;
          font-weight: 800;
        }

        .text-emerald {
          color: var(--accent);
        }

        .graph-box {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 16px;
          padding: 16px;
        }

        .graph-title {
          display: block;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .bezier-graph {
          width: 100%;
          height: 80px;
        }

        .bar-charts-mini {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          height: 60px;
        }

        .bar-wrapper {
          flex: 1;
          background: #f1f5f9;
          height: 100%;
          border-radius: 4px;
          display: flex;
          align-items: flex-end;
          overflow: hidden;
        }

        .bar-fill {
          width: 100%;
          background: linear-gradient(to top, var(--accent), #10b981);
          border-radius: 4px;
        }

        .tech-shield-preview {
          background: rgba(0, 184, 101, 0.02);
          border: 1px solid var(--accent-border);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .tech-shield-preview .shield-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .tech-shield-preview strong {
          display: block;
          font-size: 0.9rem;
          margin-bottom: 2px;
        }

        .tech-shield-preview p {
          margin: 0;
          font-size: 0.78rem;
          color: var(--text-muted);
        }

        /* Telemetry Console screen */
        .telemetry-console-logs {
          border-top: 1px solid rgba(0, 0, 0, 0.05);
          padding-top: 20px;
        }

        .console-title {
          display: block;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 10px;
        }

        .console-screen {
          background: #0f172a;
          border-radius: 12px;
          padding: 16px;
          font-family: monospace;
          font-size: 0.78rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 80px;
        }

        .log-row {
          display: flex;
          gap: 8px;
          line-height: 1.4;
        }

        .log-row .bullet {
          color: var(--accent);
          font-weight: bold;
        }

        .log-row .text {
          color: rgba(255, 255, 255, 0.85);
        }

        /* --- Section: Live ROI Calculator --- */
        .roi-calculator-section {
          padding: 120px 0;
          background: var(--bg-subtle);
          position: relative;
          z-index: 1;
        }

        .calc-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .calc-text .section-title {
          font-size: 3.2rem;
          line-height: 1.1;
        }

        .calc-text .section-subtitle {
          margin-inline: 0;
        }

        .sliders-container {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .slider-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .slider-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .slider-value {
          color: var(--accent);
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 800;
        }

        .custom-range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 100px;
          background: #e2e8f0;
          outline: none;
          transition: background 0.3s;
        }

        .custom-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 184, 101, 0.3);
          transition: transform 0.1s;
        }

        .custom-range-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .calc-outputs-container {
          display: flex;
        }

        .glass-output-card {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--accent-border);
          border-radius: 28px;
          box-shadow: 0 30px 60px rgba(0, 184, 101, 0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 44px;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        .output-top {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .output-top .lbl {
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
        }

        .output-val {
          font-family: 'Outfit', sans-serif;
          font-size: 3.2rem;
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1;
        }

        .output-top .explanation {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-top: 8px;
        }

        .output-divider {
          height: 1px;
          background: rgba(0, 0, 0, 0.05);
        }

        .output-middle {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .mid-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mid-item .lbl {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .mid-item .val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
        }

        /* --- Section: Vertical Timeline --- */
        .lifecycle-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .vertical-timeline {
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 56px;
        }

        .timeline-node {
          display: flex;
          gap: 40px;
          position: relative;
        }

        .node-marker {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex-shrink: 0;
        }

        .node-marker .num {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 0.95rem;
          color: var(--accent);
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .marker-line {
          width: 2px;
          background: rgba(0, 184, 101, 0.1);
          flex-grow: 1;
          margin-top: 12px;
          position: absolute;
          bottom: -56px;
          top: 44px;
        }

        .timeline-node:last-child .marker-line {
          display: none;
        }

        .node-content-box {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
          flex-grow: 1;
          transition: transform 0.3s;
        }

        .node-content-box:hover {
          transform: translateX(4px);
          border-color: var(--accent-border);
        }

        .node-tag {
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.06em;
          display: block;
          margin-bottom: 8px;
        }

        .node-content-box h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .node-content-box p {
          font-size: 0.92rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* --- Section: Pricing --- */
        .pricing-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 64px;
          align-items: stretch;
        }

        .pricing-card {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--card-border);
          border-radius: 28px;
          padding: 44px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.01);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .pricing-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent-border);
          box-shadow: 0 25px 50px var(--glass-shadow);
        }

        .pricing-card.highlighted-premium {
          border-color: var(--accent);
          box-shadow: 0 25px 50px rgba(0, 184, 101, 0.1);
        }

        .card-banner {
          position: absolute;
          top: 20px;
          right: 20px;
          background: var(--accent);
          color: white;
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .card-top h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 850;
          margin-bottom: 8px;
        }

        .card-top .desc {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
          margin-bottom: 28px;
          min-height: 3em;
        }

        .price-box {
          display: flex;
          align-items: baseline;
          margin-bottom: 32px;
        }

        .price-box .currency {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .price-box .price {
          font-family: 'Outfit', sans-serif;
          font-size: 3.4rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .price-box .period {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-muted);
          margin-left: 4px;
        }

        .card-features {
          flex-grow: 1;
        }

        .feats-title {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 16px;
        }

        .feats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .feat-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          font-weight: 500;
        }

        .feat-row .check-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .cta-button-premium {
          display: block;
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-button-premium.primary {
          background: var(--accent);
          color: #ffffff;
          box-shadow: 0 8px 20px rgba(0, 184, 101, 0.15);
        }

        .cta-button-premium.primary:hover {
          background: #009953;
          transform: translateY(-2px);
        }

        .cta-button-premium.secondary {
          background: #ffffff;
          color: var(--text-main);
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .cta-button-premium.secondary:hover {
          background: var(--bg-subtle);
          border-color: rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        /* --- Section: FAQ Accordions --- */
        .faq-section {
          padding: 100px 0;
          position: relative;
          z-index: 1;
        }

        .faq-layout-box {
          max-width: 800px;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 48px;
        }

        .faq-accordion-item {
          background: rgba(255, 255, 255, 0.7);
          border: 1px solid var(--card-border);
          border-radius: 18px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.005);
        }

        .faq-accordion-item:hover {
          border-color: var(--accent-border);
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
          border-top: 1px solid var(--card-border);
          background: #ffffff;
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
        }

        .footer-links .col a {
          display: block;
          color: var(--text-muted);
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 0.9rem;
          transition: color 0.3s;
        }

        .footer-links .col a:hover {
          color: var(--text-main);
        }

        .footer-bottom {
          padding: 36px 0;
          border-top: 1px solid var(--card-border);
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        /* --- Responsive media queries --- */
        @media (max-width: 1024px) {
          .command-grid { grid-template-columns: 1fr; }
          .calc-layout { grid-template-columns: 1fr; }
          .pricing-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .hero-title { font-size: 3.2rem; }
          .section-title { font-size: 2.3rem; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.6rem; }
          .section-title { font-size: 2rem; }
          .mini-metric .value { font-size: 1.25rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
