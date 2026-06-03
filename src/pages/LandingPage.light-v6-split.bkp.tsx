import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  FileSpreadsheet
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

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

type ActiveState = 'soberania' | 'pecuaria' | 'frota' | 'hedge' | 'configurador';

export const LandingPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<ActiveState>('soberania');
  const [scrolled, setScrolled] = useState(false);
  const { theme } = useTheme();

  // Configurator dynamic state
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(false);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(850);
  const [userLicenses, setUserLicenses] = useState(5);

  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  
  // Real-time console logs simulator for current active mode
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);

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
  const estimatedSavings = Math.round((herdScale * 45) + (includeFrotas ? 38000 : 0));

  // IntersectionObserver to auto-spy scrolling segments on desktop
  useEffect(() => {
    const sections: ActiveState[] = ['soberania', 'pecuaria', 'frota', 'hedge', 'configurador'];
    const observers = sections.map(id => {
      const el = document.getElementById(`sec-${id}`);
      if (!el) return null;
      
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          setActiveSection(id);
        }
      }, {
        root: null,
        rootMargin: '-25% 0px -35% 0px',
        threshold: 0.15
      });
      
      observer.observe(el);
      return { observer, el };
    });

    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observers.forEach(item => {
        if (item) item.observer.unobserve(item.el);
      });
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Simulação de live gateway events dependendo do estado ativo no Cockpit
  useEffect(() => {
    const stateLogs: Record<ActiveState, string[]> = {
      soberania: [
        "[VAULT] Isolamento Físico de Tenant ativo e certificado.",
        "[CRYPT] Chaves encriptadas ativas - SHA-256 / AES-256-GCM.",
        "[SECURITY] Zero compartilhamento de banco de dados e pools."
      ],
      pecuaria: [
        "[RFID-GATEWAY] Antena voluntária Curral Pasto Norte - Conexão 99.8%.",
        "[WEIGHT-AI] Bovino #BR-2490 aferido: 494.5kg - Ganho Médio: +1.45 kg/dia.",
        "[RFID] Histórico persistido offline - Aguardando sincronização lote 14."
      ],
      frota: [
        "[FLEET-TRACK] Trator John Deere #04 ativo no Pasto Central.",
        "[FUEL] Sensor de fluxo calibrado - Consumo instantâneo: 12.2 L/h.",
        "[TELEMETRY] Sensor de nível de tanque estacionário conectado (92%)."
      ],
      hedge: [
        "[B3-INTEL] Boi Gordo Futuro B3 (BGI) indexado: R$ 285.50/@.",
        "[HEDGE] Blindagem ativada para lote L-12B - Margem assegurada: 34.2%.",
        "[AUDIT] Histórico contábil XML importado de forma segura e transparente."
      ],
      configurador: [
        "[LICENSING] Computando parâmetros contratuais pro-forma...",
        `[CALCULATOR] Módulos: ${selectedCount} ativos. Escala: ${herdScale} animais.`,
        `[AUDIT] Proposta comercial gerada com validade jurídica digital.`
      ]
    };

    setConsoleLogs(stateLogs[activeSection] || []);

    const interval = setInterval(() => {
      const dynamicFeed: Record<ActiveState, string[]> = {
        soberania: [
          "[CRYPT] Chave pública rotacionada com sucesso.",
          "[AUDIT] Auditoria de acesso de tenant - Status: OK."
        ],
        pecuaria: [
          `[RFID] Animal #${Math.floor(Math.random() * 900 + 100)} verificado na balança - Peso: ${Math.floor(Math.random() * 30 + 470)}kg.`,
          `[GMD] Recálculo estatístico de engorda para lote L-${Math.floor(Math.random() * 5 + 5)}.`
        ],
        frota: [
          `[FLEET] Colheitadeira #${Math.floor(Math.random() * 3 + 1)} enviando coordenadas GPS.`,
          `[TELEMETRY] Bomba de diesel local registrou abastecimento de ${Math.floor(Math.random() * 40 + 30)}L.`
        ],
        hedge: [
          `[B3-LIVE] Ticker futuro boi gordo: R$ ${Math.floor(Math.random() * 6 + 282)}.00/@.`,
          "[HEDGE] Proteção recalculada - Sem risco de oscilação cambial."
        ],
        configurador: [
          "[LICENSING] Sincronização de valores instantânea estabelecida.",
          "[CALCULATOR] Descontos de combo e margens recalculados em tempo real."
        ]
      };

      const options = dynamicFeed[activeSection];
      const selected = options[Math.floor(Math.random() * options.length)];
      setConsoleLogs(prev => [selected, prev[0], prev[1]].slice(0, 3));
    }, 4000);

    return () => clearInterval(interval);
  }, [activeSection, selectedCount, herdScale]);

  return (
    <div className="tauze-sovereign-cockpit">
      
      {/* Dynamic financial and stats ticker bar (High impact) */}
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

      {/* Floating elegant glass header */}
      <nav className={`navbar-elegant ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="brand-logo-group">
            <div className="logo-badge">
              <TauzeLogo size={32} />
            </div>
            <div className="brand-titles">
              <span className="brand-name">tauze</span>
              <span className="brand-edition">Sovereign Edition</span>
            </div>
          </div>

          <div className="navbar-links-group">
            <a href="#sec-soberania" className={activeSection === 'soberania' ? 'active' : ''}>Soberania</a>
            <a href="#sec-pecuaria" className={activeSection === 'pecuaria' ? 'active' : ''}>Pecuária</a>
            <a href="#sec-frota" className={activeSection === 'frota' ? 'active' : ''}>Telemetria</a>
            <a href="#sec-hedge" className={activeSection === 'hedge' ? 'active' : ''}>Mercado B3</a>
            <a href="#sec-configurador" className={activeSection === 'configurador' ? 'active' : ''}>Configurador</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-terminal-sec">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Split-Screen layout container */}
      <div className="split-screen-wrapper">
        
        {/* ======================================================== */}
        {/* LEFT COLUMN: THE STICKY COCKPIT (THE LIVE DIGITAL VIEWPORT) */}
        {/* ======================================================== */}
        <div className="left-sticky-pane">
          <div className="cockpit-enclosure">
            
            {/* Visual background structural grids */}
            <div className="cockpit-tactile-grid"></div>
            
            {/* Top metallic/glass chassis detail */}
            <div className="cockpit-chassis-top">
              <div className="chassis-dot red"></div>
              <div className="chassis-dot yellow"></div>
              <div className="chassis-dot green"></div>
              <span className="chassis-label">tauze.sovereign.telemetry.v6.0</span>
              <span className="chassis-status">
                <RefreshCw size={11} className="spin-status-icon" />
                <span>ONLINE</span>
              </span>
            </div>

            {/* Simulated Live Viewport Screen */}
            <div className="cockpit-screen-monitor">
              <AnimatePresence mode="wait">
                
                {/* STATE 1: SOBERANIA (Database isolation vault blueprint) */}
                {activeSection === 'soberania' && (
                  <motion.div 
                    key="soberania"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="monitor-viewport"
                  >
                    <div className="monitor-badge">BLINDAGEM CRIPTOGRÁFICA</div>
                    <h3 className="monitor-title">Servidor de Dados Isolado</h3>
                    
                    {/* Database Blueprint SVG Diagram */}
                    <div className="svg-container">
                      <svg viewBox="0 0 400 160" className="vector-schematic">
                        <g opacity="0.15">
                          <line x1="10" y1="80" x2="390" y2="80" stroke="#00b865" strokeWidth="1" strokeDasharray="5,5" />
                          <circle cx="200" cy="80" r="70" fill="none" stroke="#00b865" strokeWidth="1" />
                        </g>
                        
                        {/* Server nodes */}
                        <g className="pulse-slow">
                          <circle cx="200" cy="80" r="14" fill="#0e3e29" stroke="#00b865" strokeWidth="2.5" />
                          <Lock size={12} className="svg-icon-node" x="194" y="74" color="#00b865" />
                        </g>
                        
                        {/* Client Isolation partitions */}
                        <g>
                          <rect x="50" y="30" width="70" height="40" rx="6" fill="#fcfcf9" stroke="#e5e3dc" strokeWidth="1.5" />
                          <text x="85" y="54" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" fill="#475569">PRODUTOR A</text>
                          <path d="M 120,50 L 186,80" stroke="#ff5f56" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
                          <circle cx="150" cy="63" r="6" fill="#ff5f56" />
                          <text x="150" y="66" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">×</text>
                        </g>

                        <g>
                          <rect x="50" y="90" width="70" height="40" rx="6" fill="#fcfcf9" stroke="#e5e3dc" strokeWidth="1.5" />
                          <text x="85" y="114" fontSize="8" fontWeight="bold" fontFamily="monospace" textAnchor="middle" fill="#475569">PRODUTOR B</text>
                          <path d="M 120,110 L 186,80" stroke="#ff5f56" strokeWidth="1.5" strokeDasharray="4,4" opacity="0.6" />
                          <circle cx="150" cy="96" r="6" fill="#ff5f56" />
                          <text x="150" y="99" fontSize="8" fontWeight="bold" fill="#ffffff" textAnchor="middle">×</text>
                        </g>

                        {/* Sovereign Isolated Client Vault */}
                        <g>
                          <rect x="280" y="45" width="84" height="70" rx="8" fill="#f4fcf6" stroke="#00b865" strokeWidth="2" />
                          <text x="322" y="72" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle" fill="#0e3e29">SUA FAZENDA</text>
                          <text x="322" y="86" fontSize="7" fontWeight="bold" fontFamily="monospace" textAnchor="middle" fill="#00b865">PARTIÇÃO ATIVA</text>
                          <text x="322" y="98" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fill="#475569">AES-256-GCM</text>
                          <path d="M 280,80 L 214,80" stroke="#00b865" strokeWidth="2" strokeDasharray="3,3" />
                        </g>
                      </svg>
                    </div>

                    <div className="status-grid-mini">
                      <div className="status-item">
                        <span className="lbl">MODO OPERANTE:</span>
                        <span className="val-sec text-emerald">TENANT EXCLUSIVO</span>
                      </div>
                      <div className="status-item">
                        <span className="lbl">ENCRIPTAÇÃO:</span>
                        <span className="val-sec">AES-256-GCM Hardware</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 2: PECUÁRIA RFID (Spline weight curve & RFID stats) */}
                {activeSection === 'pecuaria' && (
                  <motion.div 
                    key="pecuaria"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="monitor-viewport"
                  >
                    <div className="monitor-badge">RFID TELEMETRIA VOLUNTÁRIA</div>
                    <h3 className="monitor-title">Mapeamento de Engorda (GMD)</h3>

                    {/* Weight Gains Spline curve SVG */}
                    <div className="svg-container">
                      <svg viewBox="0 0 400 150" className="vector-schematic">
                        {/* Grids lines */}
                        <g stroke="#e5e3dc" strokeWidth="0.5" strokeDasharray="4,4">
                          <line x1="20" y1="30" x2="380" y2="30" />
                          <line x1="20" y1="70" x2="380" y2="70" />
                          <line x1="20" y1="110" x2="380" y2="110" />
                          <line x1="100" y1="10" x2="100" y2="130" />
                          <line x1="200" y1="10" x2="200" y2="130" />
                          <line x1="300" y1="10" x2="300" y2="130" />
                        </g>

                        {/* Spline area */}
                        <path 
                          d="M 20,120 Q 110,105 200,60 T 380,25 L 380,130 L 20,130 Z" 
                          fill="url(#spline-light-emerald)" 
                          opacity="0.12" 
                        />
                        
                        {/* Spline stroke */}
                        <path 
                          d="M 20,120 Q 110,105 200,60 T 380,25" 
                          fill="none" 
                          stroke="#00b865" 
                          strokeWidth="3.5" 
                        />

                        <defs>
                          <linearGradient id="spline-light-emerald" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00b865" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>

                        {/* Glowing node and tooltip */}
                        <circle cx="200" cy="60" r="6" fill="#00b865" stroke="#ffffff" strokeWidth="2" />
                        <g>
                          <rect x="210" y="40" width="70" height="24" rx="4" fill="#0e3e29" />
                          <text x="245" y="55" fontSize="7.5" fontWeight="bold" fill="#00b865" fontFamily="monospace" textAnchor="middle">482.4kg (+1.45/d)</text>
                        </g>
                      </svg>
                    </div>

                    <div className="status-grid-mini">
                      <div className="status-item">
                        <span className="lbl">LOTE REGISTRADO:</span>
                        <span className="val-sec text-emerald">LOTE 14-B PASTAGEM</span>
                      </div>
                      <div className="status-item">
                        <span className="lbl">GMD ESTIMADO:</span>
                        <span className="val-sec">+1.45 kg/cabeça/dia</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 3: FROTA & COMBUSTÍVEL (Topographical telemetry and fuel flow) */}
                {activeSection === 'frota' && (
                  <motion.div 
                    key="frota"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="monitor-viewport"
                  >
                    <div className="monitor-badge">TELEMETRIA LORA DE FROTA</div>
                    <h3 className="monitor-title">Rastreamento de Tratorização</h3>

                    {/* Fleet map grid SVG */}
                    <div className="svg-container">
                      <svg viewBox="0 0 400 150" className="vector-schematic">
                        {/* Map grid lines */}
                        <g opacity="0.3">
                          <path d="M 20,40 C 80,10 180,60 220,20 C 280,-10 320,60 380,30" fill="none" stroke="#e5e3dc" strokeWidth="1" />
                          <path d="M 20,110 C 100,80 180,130 260,90 C 310,60 340,110 380,90" fill="none" stroke="#e5e3dc" strokeWidth="1" />
                        </g>

                        {/* Topo map contours */}
                        <circle cx="120" cy="55" r="40" fill="none" stroke="#e5e3dc" strokeWidth="0.8" strokeDasharray="3,3" />
                        <circle cx="120" cy="55" r="25" fill="none" stroke="#e5e3dc" strokeWidth="0.8" strokeDasharray="3,3" />
                        <circle cx="300" cy="95" r="30" fill="none" stroke="#e5e3dc" strokeWidth="0.8" strokeDasharray="3,3" />

                        {/* Animated route path */}
                        <path d="M 40,120 L 120,80 L 220,95 L 300,50" fill="none" stroke="#00b865" strokeWidth="2.5" strokeDasharray="5,5" className="dash-move-path" />

                        {/* Machine indicators */}
                        <g className="pulse-slow">
                          <circle cx="300" cy="50" r="8" fill="#0e3e29" stroke="#00b865" strokeWidth="2" />
                          <rect x="312" y="42" width="58" height="16" rx="3" fill="#fcfcf9" stroke="#e5e3dc" strokeWidth="1" />
                          <text x="341" y="52" fontSize="6.5" fontWeight="bold" fill="#475569" fontFamily="monospace" textAnchor="middle">TRATOR JD-4</text>
                        </g>

                        <g>
                          <circle cx="120" cy="80" r="5" fill="#e5e3dc" stroke="#94a3b8" strokeWidth="1.5" />
                        </g>
                      </svg>
                    </div>

                    <div className="status-grid-mini">
                      <div className="status-item">
                        <span className="lbl">ATIVIDADE DO DIA:</span>
                        <span className="val-sec text-emerald">TRABALHO DE ROTA SUL</span>
                      </div>
                      <div className="status-item">
                        <span className="lbl">CONSUMO DIÁRIO:</span>
                        <span className="val-sec">12.2 L/h (Média Nominal)</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 4: HEDGE B3 (Commodity indices and safe margins scale) */}
                {activeSection === 'hedge' && (
                  <motion.div 
                    key="hedge"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="monitor-viewport"
                  >
                    <div className="monitor-badge">AUDITORIA DE HEDGE FINANCEIRO</div>
                    <h3 className="monitor-title">Proteção Cambial & Margem B3</h3>

                    {/* Stock exchange metrics graphic */}
                    <div className="svg-container">
                      <svg viewBox="0 0 400 150" className="vector-schematic">
                        {/* Horizon base line */}
                        <line x1="20" y1="120" x2="380" y2="120" stroke="#e5e3dc" strokeWidth="1.5" />
                        
                        {/* Mock Candlestick Chart */}
                        {/* Candle 1 */}
                        <line x1="60" y1="70" x2="60" y2="115" stroke="#00b865" strokeWidth="6" />
                        <line x1="60" y1="60" x2="60" y2="120" stroke="#00b865" strokeWidth="1.5" />
                        
                        {/* Candle 2 */}
                        <line x1="120" y1="50" x2="120" y2="85" stroke="#00b865" strokeWidth="6" />
                        <line x1="120" y1="40" x2="120" y2="100" stroke="#00b865" strokeWidth="1.5" />

                        {/* Candle 3 (Red) */}
                        <line x1="180" y1="65" x2="180" y2="90" stroke="#ff5f56" strokeWidth="6" />
                        <line x1="180" y1="55" x2="180" y2="105" stroke="#ff5f56" strokeWidth="1.5" />

                        {/* Candle 4 */}
                        <line x1="240" y1="40" x2="240" y2="70" stroke="#00b865" strokeWidth="6" />
                        <line x1="240" y1="30" x2="240" y2="80" stroke="#00b865" strokeWidth="1.5" />

                        {/* Candle 5 (Breakout) */}
                        <line x1="300" y1="20" x2="300" y2="55" stroke="#00b865" strokeWidth="6" />
                        <line x1="300" y1="10" x2="300" y2="70" stroke="#00b865" strokeWidth="1.5" />

                        {/* Target line indicators */}
                        <line x1="20" y1="45" x2="380" y2="45" stroke="#00b865" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />
                        <text x="320" y="40" fontSize="7.5" fontWeight="bold" fill="#00b865" fontFamily="monospace">MARGEM ALVO</text>
                      </svg>
                    </div>

                    <div className="status-grid-mini">
                      <div className="status-item">
                        <span className="lbl">MARGEM BLINDADA:</span>
                        <span className="val-sec text-emerald">34.2% DE OPERAÇÃO</span>
                      </div>
                      <div className="status-item">
                        <span className="lbl">INDICE DE RETORNO B3:</span>
                        <span className="val-sec">R$ 285.50 / arroba</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STATE 5: CONFIGURADOR (Live Pro-Forma proposal invoice sheet) */}
                {activeSection === 'configurador' && (
                  <motion.div 
                    key="configurador"
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="monitor-viewport"
                  >
                    <div className="monitor-badge-config text-emerald">PROPOSTA COMERCIAL PRO-FORMA</div>
                    <div className="invoice-paper-preview">
                      <div className="invoice-stamp">HOMOLOGADA</div>
                      
                      <div className="invoice-header">
                        <TauzeLogo size={24} />
                        <div className="header-meta">
                          <strong>tauze ERP & Telemetry</strong>
                          <span>Contrato de Licenciamento</span>
                        </div>
                      </div>

                      <div className="invoice-divider"></div>

                      <div className="invoice-lines-list">
                        {includePecuaria && (
                          <div className="invoice-row">
                            <span>Licença Base Pecuária RFID</span>
                            <strong>R$ 399/mês</strong>
                          </div>
                        )}
                        {includeFrotas && (
                          <div className="invoice-row">
                            <span>Módulo Frotas & Combustível</span>
                            <strong>R$ 299/mês</strong>
                          </div>
                        )}
                        {includeHedge && (
                          <div className="invoice-row">
                            <span>Módulo Hedge & Futuros B3</span>
                            <strong>R$ 499/mês</strong>
                          </div>
                        )}
                        {includePecuaria && (
                          <div className="invoice-row">
                            <span>Escala de Rebanho ({herdScale} cab.)</span>
                            <strong>R$ {scaleSurcharge}/mês</strong>
                          </div>
                        )}
                        <div className="invoice-row">
                          <span>{userLicenses} Licenças de Usuários</span>
                          <strong>R$ {licenseSurcharge}/mês</strong>
                        </div>

                        {selectedCount >= 2 && (
                          <div className="invoice-row discount">
                            <span>Desconto Combo ({selectedCount === 3 ? '20%' : '10%'})</span>
                            <strong>-{selectedCount === 3 ? '20%' : '10%'}</strong>
                          </div>
                        )}
                      </div>

                      <div className="invoice-divider"></div>

                      <div className="invoice-totals">
                        <div className="total-main-row">
                          <span>INVESTIMENTO MENSAL:</span>
                          <span className="total-val text-gradient">R$ {finalPrice.toLocaleString('pt-BR')}</span>
                        </div>
                        <div className="savings-row">
                          <span>Economia Anual Operacional Estimada:</span>
                          <span className="savings-val text-emerald">R$ {estimatedSavings.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Bottom Real-time Live Log Feed Panel */}
            <div className="cockpit-logs-terminal">
              <span className="terminal-title">GATEWAY LIVE FEED (Offline-First Sync)</span>
              <div className="terminal-text-block">
                {consoleLogs.map((log, index) => (
                  <div key={index} className="terminal-line">
                    <span className="terminal-prompt">&gt;</span>
                    <span className="terminal-txt-msg">{log}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: THE SCROLLABLE NARRATIVE STORYTELLING */}
        {/* ======================================================== */}
        <div className="right-scroll-pane">
          
          {/* Stark Elegant Luxury Hero Header */}
          <section className="editorial-hero">
            <div className="hero-badge-tag">
              <Sparkles size={11} className="badge-glow-icon" />
              <span>Plataforma Agroindustrial Soberana</span>
            </div>
            
            <h1 className="editorial-hero-title">
              a inteligência digital da sua terra.
            </h1>
            
            <p className="editorial-hero-desc">
              Não compartilhe o cérebro da sua fazenda. O **tauze** foi desenvolvido de forma isolada, entregando governança contábil, telemetria RFID e auditoria física de frotas sob a sua própria custódia de dados.
            </p>

            <div className="editorial-hero-actions">
              <a href="#sec-configurador" className="btn-primary-editorial">
                <span>Calcular Proposta Comercial</span>
                <ArrowRight size={18} />
              </a>
              <a href="#sec-soberania" className="btn-secondary-editorial">
                <span>Módulos de Tecnologia</span>
              </a>
            </div>
          </section>

          {/* SECTION 1: SOBERANIA (Database isolation) */}
          <section id="sec-soberania" className={`story-narrative-section ${activeSection === 'soberania' ? 'active' : ''}`}>
            <span className="story-label">01 // SEGURANÇA</span>
            <h2 className="story-title">Isolamento Físico de Banco de Dados</h2>
            <p className="story-para">
              A imensa maioria das ferramentas SaaS agrícolas mistura todos os clientes em bancos compartilhados. Se um concorrente for atacado, sua margem ou dados confidenciais de pasto podem vazar.
            </p>
            <p className="story-para-sub">
              No **tauze**, cada produtor possui seu próprio contêiner lógico encriptado em **AES-256-GCM**. Nós blindamos as suas informações de forma física, garantindo auditoria de conformidade contábil e de operações.
            </p>
            
            <div className="bullet-feature-row">
              <div className="bullet-node">
                <ShieldCheck size={20} className="text-emerald" />
                <div className="bullet-txt">
                  <strong>Arquitetura Multi-Tenant Isolada</strong>
                  <span>Garantia de que seus dados contábeis e produtividade nunca passem por servidores compartilhados.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: PECUÁRIA (RFID / GMD weighing) */}
          <section id="sec-pecuaria" className={`story-narrative-section ${activeSection === 'pecuaria' ? 'active' : ''}`}>
            <span className="story-label">02 // PRODUTIVIDADE</span>
            <h2 className="story-title">Pecuária de Precisão e Ganho Diário (GMD)</h2>
            <p className="story-para">
              Pesagens estressantes desgastam o animal e causam perda imediata de arroba. A tecnologia do **tauze** utiliza antenas RFID Bluetooth integradas para calcular a pesagem voluntária no bebedouro ou cocho.
            </p>
            <p className="story-para-sub">
              Nossa inteligência computacional calcula a curva real de **Ganho Médio Diário (GMD)** de cada lote de forma contínua, permitindo prever a data exata do peso ótimo para o abate ideal.
            </p>

            <div className="bullet-feature-row">
              <div className="bullet-node">
                <Cpu size={20} className="text-emerald" />
                <div className="bullet-txt">
                  <strong>Monitoramento Sem Estresse</strong>
                  <span>Leitura voluntária por brinco RFID que elimina o manejo pesado de troncos tradicionais.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 3: FROTA & COMBUSTÍVEL */}
          <section id="sec-frota" className={`story-narrative-section ${activeSection === 'frota' ? 'active' : ''}`}>
            <span className="story-label">03 // OPERAÇÃO</span>
            <h2 className="story-title">Telemetria Offline-First de Frotas</h2>
            <p className="story-para">
              Sinais celulares são instáveis em áreas rurais remotas. O **tauze** opera sob arquitetura local **Offline-First**. Sensores de vazão de bombas e telemetria de frotas operam localmente e transmitem os pacotes compactados assim que há conectividade LoRa.
            </p>
            <p className="story-para-sub">
              Evite desvios de óleo diesel e otimize o consumo das suas colheitadeiras e tratores com alarmes automáticos baseados em curvas de telemetria nominal.
            </p>

            <div className="bullet-feature-row">
              <div className="bullet-node">
                <Truck size={20} className="text-emerald" />
                <div className="bullet-txt">
                  <strong>Prevenção Contínua de Perdas</strong>
                  <span>Identificação imediata de anomalias no fluxo de combustível das máquinas em tempo real.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 4: HEDGE B3 & MARGENS */}
          <section id="sec-hedge" className={`story-narrative-section ${activeSection === 'hedge' ? 'active' : ''}`}>
            <span className="story-label">04 // ESTRATÉGIA FINANCEIRA</span>
            <h2 className="story-title">Blindagem de Lucro e Indexação B3</h2>
            <p className="story-para">
              A produção rural não termina na porteira. A inteligência de mercado do **tauze** se conecta diretamente às cotações futuras de commodities da Bolsa de Valores (B3).
            </p>
            <p className="story-para-sub">
              Simule a rentabilidade do seu rebanho e ative o cálculo automático de **Hedge comercial** para fixar preços em patamares de alta segurança financeira, blindando suas margens contra variações bruscas de mercado.
            </p>

            <div className="bullet-feature-row">
              <div className="bullet-node">
                <BarChart3 size={20} className="text-emerald" />
                <div className="bullet-txt">
                  <strong>Integração Tributária e Financeira</strong>
                  <span>Consolidação imediata de boletos contábeis com conciliação OFX nativa e livre de intervenção manual.</span>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: CONFIGURATOR (Option selection) */}
          <section id="sec-configurador" className={`story-narrative-section ${activeSection === 'configurador' ? 'active' : ''}`}>
            <span className="story-label">05 // LICENCIAMENTO</span>
            <h2 className="story-title">Proposta Digital Imediata</h2>
            <p className="story-para">
              Configure sua própria licença corporativa. Marque os barramentos de módulos necessários, defina o tamanho de suas operações e veja o investimento instantaneamente ao lado.
            </p>

            <div className="configurator-narrative-form">
              
              {/* Toggles List */}
              <div className="narrative-form-group">
                <label className="form-group-title">MÓDULOS DE SISTEMA</label>
                
                <div 
                  onClick={() => setIncludePecuaria(!includePecuaria)}
                  className={`narrative-checkbox-item ${includePecuaria ? 'checked' : ''}`}
                >
                  <div className="checkbox-square">
                    {includePecuaria && <Check size={13} />}
                  </div>
                  <div className="checkbox-info">
                    <strong>Pecuária de Precisão (RFID & Balança Pasto)</strong>
                    <span>Pesagem voluntária, cálculo automático de GMD e curvas estatísticas.</span>
                  </div>
                </div>

                <div 
                  onClick={() => setIncludeFrotas(!includeFrotas)}
                  className={`narrative-checkbox-item ${includeFrotas ? 'checked' : ''}`}
                >
                  <div className="checkbox-square">
                    {includeFrotas && <Check size={13} />}
                  </div>
                  <div className="checkbox-info">
                    <strong>Telemetria de Frotas & Fluxo de Combustível</strong>
                    <span>Combate a perdas de combustível e rastreio off-line de maquinários.</span>
                  </div>
                </div>

                <div 
                  onClick={() => setIncludeHedge(!includeHedge)}
                  className={`narrative-checkbox-item ${includeHedge ? 'checked' : ''}`}
                >
                  <div className="checkbox-square">
                    {includeHedge && <Check size={13} />}
                  </div>
                  <div className="checkbox-info">
                    <strong>Hedge B3 & Gestão Estratégica Financeira</strong>
                    <span>Indexação com bolsa futura, conciliação XML e controle de taxas cambiais.</span>
                  </div>
                </div>
              </div>

              {/* Sliders Box */}
              <div className="narrative-form-group border-top">
                <label className="form-group-title">PORTE DA AGROINDÚSTRIA</label>
                
                <div className="narrative-slider-wrapper">
                  <div className="slider-label-row">
                    <span>Rebanho Ativo (Animais)</span>
                    <strong className="text-emerald">{includePecuaria ? `${herdScale.toLocaleString()} cabeças` : "Módulo Pecuária Desativado"}</strong>
                  </div>
                  <input 
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    disabled={!includePecuaria}
                    value={herdScale}
                    onChange={(e) => setHerdScale(parseInt(e.target.value))}
                    className="editorial-range-slider"
                  />
                </div>

                <div className="narrative-slider-wrapper">
                  <div className="slider-label-row">
                    <span>Usuários Administradores</span>
                    <strong className="text-emerald">{userLicenses} licenças</strong>
                  </div>
                  <input 
                    type="range"
                    min="2"
                    max="50"
                    step="1"
                    value={userLicenses}
                    onChange={(e) => setUserLicenses(parseInt(e.target.value))}
                    className="editorial-range-slider"
                  />
                </div>
              </div>

              {/* Mobile Only visible Invoice block */}
              <div className="mobile-only-invoice-box">
                <div className="mobile-invoice-header">PROPOSTA COMERCIAL PRO-FORMA</div>
                <div className="mobile-total-row">
                  <span>TOTAL ESTIMADO MENSAL:</span>
                  <strong>R$ {finalPrice.toLocaleString('pt-BR')}</strong>
                </div>
                <p className="mobile-invoice-disclaimer">Confira o detalhamento de custos e simulação no painel ao lado.</p>
              </div>

              <div className="proposal-cta-editorial-row">
                <Link to="/login" className="btn-confirm-narrative">
                  <span>Assinar Proposta Comercial</span>
                  <ArrowRight size={16} />
                </Link>
                <span className="disclaimer-narrative">Proposta com valor reativo homologado digitalmente de forma soberana.</span>
              </div>

            </div>
          </section>

          {/* Section: Specifications Table List */}
          <section className="editorial-specs-section">
            <span className="specs-tag">ENGENHARIA E CONFORMIDADE</span>
            <h3 className="specs-section-title">Ficha Técnica do Barramento</h3>
            
            <div className="specs-table-list">
              <div className="spec-table-row">
                <span className="label-col">Criptografia Tenant</span>
                <span className="val-col">Bancos de dados e chaves lógicas isoladas fisicamente em AES-256-GCM. Sem pool compartilhado.</span>
              </div>
              <div className="spec-table-row">
                <span className="label-col">Telemetria LoRa</span>
                <span className="val-col">Antenas locais de longa distância com operabilidade off-line nativa integrada a balanças de pasto.</span>
              </div>
              <div className="spec-table-row">
                <span className="label-col">Hedge Comercial</span>
                <span className="val-col">Algoritmo preditivo de margens operacionais indexado com commodities B3 em tempo real.</span>
              </div>
              <div className="spec-table-row">
                <span className="label-col">Fluxo Contábil</span>
                <span className="val-col">Conciliação automática OFX e nota fiscal eletrônica XML livre de interferência operacional humana.</span>
              </div>
            </div>
          </section>

          {/* Section: FAQ Accordions */}
          <section className="faq-accordions-section">
            <span className="specs-tag">SUPORTE E PERGUNTAS</span>
            <h3 className="specs-section-title">Perguntas Frequentes</h3>
            
            <div className="accordions-container">
              {[
                {
                  q: "Por que a custódia de dados do tauze é isolada?",
                  a: "A maioria dos sistemas agrícolas centraliza os dados de múltiplos produtores em tabelas compartilhadas. No tauze, cada agroindústria recebe sua própria partição de criptografia exclusiva, garantindo conformidade comercial e segurança estatística total das suas margens de mercado."
                },
                {
                  q: "Como funciona a leitura de peso off-line?",
                  a: "As antenas RFID capturam os sinais das etiquetas de orelha (brincos) quando os bovinos pesam voluntariamente nas balanças de campo. Esses pacotes são guardados com criptografia no roteador local e sincronizados automaticamente na nuvem híbrida assim que houver conectividade Lora ou rede local."
                },
                {
                  q: "Qual o prazo de homologação da proposta digital?",
                  a: "Imediata. O configurador de proposta digital acima possui validade contratual pro-forma em nosso sistema de licenciamento. Ao confirmar o acesso, sua nuvem isolada e contêiner seguro são provisionados automaticamente."
                }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`accord-block ${faqOpen === idx ? 'expanded' : ''}`}
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                >
                  <div className="accord-header">
                    <span>{item.q}</span>
                    <ChevronDown size={14} className="chevron-icon-arrow" />
                  </div>
                  <AnimatePresence>
                    {faqOpen === idx && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="accord-body-text"
                      >
                        <p>{item.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>

          {/* Footer inside the scrolling panel */}
          <footer className="elegant-footer-narrative">
            <div className="footer-top-brand">
              <TauzeLogo size={36} />
              <span className="brand-foot">tauze</span>
            </div>
            <p className="footer-tagline">Governança contábil e telemetria agroindustrial isolada, analítica e encriptada para marcas soberanas.</p>
            
            <div className="footer-nav-row">
              <div className="footer-col">
                <h5>Módulos</h5>
                <a href="#sec-soberania">Blindagem de Tenant</a>
                <a href="#sec-pecuaria">Pecuária RFID</a>
                <a href="#sec-frota">Telemetria de Frotas</a>
              </div>
              <div className="footer-col">
                <h5>Contratos</h5>
                <a href="#sec-configurador">Proposta Online</a>
                <a href="/login">Terminal Seguro</a>
                <a href="#sec-soberania">Políticas Contábeis</a>
              </div>
            </div>
            
            <div className="footer-bottom-copy">
              <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Garantidas de Ponta a Ponta.</p>
            </div>
          </footer>

        </div>
      </div>

      {/* Embedded CSS Core Design System */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-sovereign-cockpit {
          --bg-canvas: #faf9f6;          /* Gorgeous luxury warm light ivory */
          --bg-panel: #f4f3ee;           /* Warm soft beige sand */
          --border-light: #e5e3dc;       /* Hairline refined sand border */
          --accent: #00b865;             /* Signature brand vibrant emerald */
          --accent-dark: #0e3e29;        /* Sophisticated deep dark green */
          --accent-light: rgba(0, 184, 101, 0.05);
          --accent-border: rgba(0, 184, 101, 0.12);
          --text-main: #1c1c1a;          /* Rich luxury deep charcoal typography */
          --text-muted: #5e5c54;         /* High readability luxury muted tone */
          --bg-console: #0c0d0d;         /* Deep obsidian console body */
          --shadow-premium: 0 20px 40px rgba(28, 28, 26, 0.03);

          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          scroll-behavior: smooth;
        }

        /* --- STAGE: High Impact Stats Marquee --- */
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

        /* --- STAGE: Gorgeous Glass Navbar --- */
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
          background: rgba(250, 249, 246, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 72px;
          border-bottom-color: var(--border-light);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.02);
        }

        .navbar-container {
          max-width: 1300px;
          width: 100%;
          margin: 0 auto;
          padding: 0 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-badge {
          display: flex;
          align-items: center;
          justify-content: center;
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
          position: relative;
          padding: 4px 0;
        }

        .navbar-links-group a:hover,
        .navbar-links-group a.active {
          color: var(--text-main);
        }

        .navbar-links-group a.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--accent);
          border-radius: 100px;
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

        /* --- STAGE: Split Layout Structure --- */
        .split-screen-wrapper {
          display: flex;
          width: 100%;
          min-height: 100vh;
        }

        /* --- LEFT COLUMN: STICKY VIEWPORT PANE --- */
        .left-sticky-pane {
          width: 48%;
          height: 100vh;
          position: sticky;
          top: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 120px 40px 40px 60px;
          z-index: 10;
        }

        .cockpit-enclosure {
          width: 100%;
          height: 90%;
          background: rgba(244, 243, 238, 0.6);
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          backdrop-filter: blur(12px);
          box-shadow: var(--shadow-premium), inset 0 1px 2px rgba(255, 255, 255, 0.8);
          overflow: hidden;
        }

        .cockpit-tactile-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(var(--border-light) 1.2px, transparent 1.2px);
          background-size: 24px 24px;
          opacity: 0.55;
          pointer-events: none;
          z-index: 0;
        }

        .cockpit-chassis-top {
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1.5px solid var(--border-light);
          padding-bottom: 14px;
          z-index: 1;
        }

        .chassis-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .chassis-dot.red { background: #ff5f56; }
        .chassis-dot.yellow { background: #ffbd2e; }
        .chassis-dot.green { background: #00b865; }

        .chassis-label {
          font-family: monospace;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-left: 8px;
          letter-spacing: 0.05em;
        }

        .chassis-status {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          padding: 3px 8px;
          border-radius: 100px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--accent);
        }

        .spin-status-icon {
          animation: spin 4s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Console Screen Monitor */
        .cockpit-screen-monitor {
          flex: 1;
          margin: 20px 0;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.015);
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          z-index: 1;
        }

        .monitor-viewport {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
          text-align: left;
        }

        .monitor-badge {
          align-self: flex-start;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--accent-dark);
          background: var(--bg-panel);
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          border: 1px solid var(--border-light);
        }

        .monitor-badge-config {
          align-self: flex-start;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--accent);
          background: var(--accent-light);
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 0.05em;
          border: 1px solid var(--accent-border);
        }

        .monitor-title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.38rem;
          font-weight: 800;
          margin-top: 10px;
          color: var(--text-main);
          letter-spacing: -0.01em;
        }

        .svg-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
        }

        .vector-schematic {
          width: 100%;
          height: 100%;
          max-height: 160px;
        }

        .svg-icon-node {
          transform: translate(-6px, -6px);
        }

        .pulse-slow {
          animation: heartbeat 2.5s ease-in-out infinite;
        }

        @keyframes heartbeat {
          0% { transform: scale(1); transform-origin: center; }
          50% { transform: scale(1.05); transform-origin: center; }
          100% { transform: scale(1); transform-origin: center; }
        }

        .dash-move-path {
          stroke-dasharray: 6;
          animation: dashAnimation 20s linear infinite;
        }

        @keyframes dashAnimation {
          to { stroke-dashoffset: -120; }
        }

        .status-grid-mini {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          border-top: 1px solid var(--border-light);
          padding-top: 14px;
          margin-top: 10px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-item .lbl {
          font-size: 0.62rem;
          font-weight: 700;
          color: var(--text-muted);
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .status-item .val-sec {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .text-emerald {
          color: var(--accent) !important;
        }

        /* Invoice paper style inside configurator cockpit */
        .invoice-paper-preview {
          display: flex;
          flex-direction: column;
          gap: 14px;
          height: 100%;
          justify-content: space-between;
          position: relative;
        }

        .invoice-stamp {
          position: absolute;
          top: 0px;
          right: 0px;
          border: 1.5px solid var(--accent);
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

        .invoice-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-meta {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .header-meta strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 850;
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

        .invoice-lines-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          color: var(--accent);
          font-weight: 700;
        }

        .invoice-row.discount strong {
          color: var(--accent);
        }

        .invoice-totals {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .total-main-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .total-main-row span {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .total-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.7rem;
          font-weight: 900;
        }

        .savings-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.72rem;
        }

        .savings-val {
          font-weight: 700;
        }

        /* Cockpit Logs Terminal */
        .cockpit-logs-terminal {
          background: var(--bg-console);
          border-radius: 12px;
          padding: 16px;
          text-align: left;
          z-index: 1;
        }

        .terminal-title {
          font-family: monospace;
          font-size: 0.58rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.08em;
          display: block;
          margin-bottom: 8px;
        }

        .terminal-text-block {
          display: flex;
          flex-direction: column;
          gap: 5px;
          min-height: 52px;
        }

        .terminal-line {
          display: flex;
          gap: 6px;
          font-family: monospace;
          font-size: 0.7rem;
          line-height: 1.3;
        }

        .terminal-prompt {
          color: var(--accent);
          font-weight: 700;
        }

        .terminal-txt-msg {
          color: rgba(255, 255, 255, 0.8);
        }

        /* --- RIGHT COLUMN: THE SCROLLABLE CONTENT --- */
        .right-scroll-pane {
          width: 52%;
          padding: 120px 80px 100px 40px;
          display: flex;
          flex-direction: column;
          gap: 150px;
        }

        /* Editorial Hero Segment */
        .editorial-hero {
          text-align: left;
          padding-top: 60px;
        }

        .hero-badge-tag {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 100px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.01);
          margin-bottom: 24px;
        }

        .badge-glow-icon {
          color: var(--accent);
        }

        .editorial-hero-title {
          font-family: 'Lora', serif;
          font-size: 4rem;
          font-weight: 500;
          line-height: 1.1;
          letter-spacing: -0.03em;
          color: var(--text-main);
          margin-bottom: 28px;
        }

        .editorial-hero-desc {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 540px;
        }

        .editorial-hero-actions {
          display: flex;
          align-items: center;
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
          box-shadow: 0 14px 30px rgba(0, 184, 101, 0.3);
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
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.005);
        }

        .btn-secondary-editorial:hover {
          background: var(--bg-panel);
          border-color: rgba(28, 28, 26, 0.15);
        }

        /* Story Narrative Sections */
        .story-narrative-section {
          text-align: left;
          padding: 40px 0;
          border-bottom: 1px solid var(--border-light);
          transition: opacity 0.4s;
          opacity: 0.6;
        }

        .story-narrative-section.active {
          opacity: 1;
        }

        .story-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 14px;
        }

        .story-title {
          font-family: 'Lora', serif;
          font-size: 2.2rem;
          font-weight: 500;
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: 20px;
        }

        .story-para {
          font-size: 1.05rem;
          color: var(--text-main);
          line-height: 1.6;
          margin-bottom: 16px;
        }

        .story-para-sub {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .bullet-feature-row {
          margin-top: 24px;
        }

        .bullet-node {
          display: flex;
          gap: 16px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.005);
        }

        .bullet-txt {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .bullet-txt strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.92rem;
          font-weight: 800;
        }

        .bullet-txt span {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* Configurator narrative form controls */
        .configurator-narrative-form {
          display: flex;
          flex-direction: column;
          gap: 32px;
          margin-top: 24px;
        }

        .narrative-form-group {
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: left;
        }

        .narrative-form-group.border-top {
          border-top: 1px solid var(--border-light);
          padding-top: 28px;
        }

        .form-group-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }

        .narrative-checkbox-item {
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          background: hsl(var(--bg-card));
          transition: all 0.25s;
        }

        .narrative-checkbox-item:hover {
          border-color: rgba(0, 184, 101, 0.25);
          background: var(--bg-panel);
        }

        .narrative-checkbox-item.checked {
          border-color: var(--accent);
          background: rgba(0, 184, 101, 0.02);
        }

        .checkbox-square {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          border: 2px solid var(--border-light);
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.2s;
          margin-top: 2px;
        }

        .narrative-checkbox-item.checked .checkbox-square {
          border-color: var(--accent);
          background: var(--accent);
        }

        .checkbox-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .checkbox-info strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .checkbox-info span {
          font-size: 0.78rem;
          color: var(--text-muted);
          line-height: 1.35;
        }

        .narrative-slider-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.82rem;
          font-weight: 700;
        }

        .editorial-range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 100px;
          background: var(--border-light);
          outline: none;
        }

        .editorial-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 3px 8px rgba(0, 184, 101, 0.25);
        }

        .editorial-range-slider:disabled::-webkit-slider-thumb {
          background: var(--border-light);
          cursor: not-allowed;
          box-shadow: none;
        }

        .mobile-only-invoice-box {
          display: none;
        }

        .proposal-cta-editorial-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 14px;
        }

        .btn-confirm-narrative {
          background: var(--text-main);
          color: #ffffff;
          padding: 16px;
          border-radius: 12px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.25s;
          box-shadow: 0 10px 20px rgba(28, 28, 26, 0.12);
        }

        .btn-confirm-narrative:hover {
          background: #000000;
          transform: translateY(-2px);
        }

        .disclaimer-narrative {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
        }

        /* --- STAGE: Refined Specs Catalog --- */
        .editorial-specs-section {
          text-align: left;
          padding-top: 40px;
          border-top: 1.5px solid var(--text-main);
        }

        .specs-tag {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 0.12em;
          display: block;
          margin-bottom: 12px;
        }

        .specs-section-title {
          font-family: 'Lora', serif;
          font-size: 2rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin-bottom: 36px;
        }

        .specs-table-list {
          display: flex;
          flex-direction: column;
        }

        .spec-table-row {
          display: grid;
          grid-template-columns: 1.2fr 2.8fr;
          padding: 24px 0;
          border-bottom: 1px solid var(--border-light);
          align-items: flex-start;
          gap: 28px;
        }

        .spec-table-row .label-col {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
        }

        .spec-table-row .val-col {
          font-size: 0.85rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* FAQ Sections */
        .faq-accordions-section {
          text-align: left;
          padding-top: 40px;
        }

        .accordions-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .accord-block {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.25s;
        }

        .accord-block:hover {
          border-color: rgba(0, 184, 101, 0.15);
        }

        .accord-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 0.95rem;
        }

        .chevron-icon-arrow {
          transition: transform 0.25s;
          color: var(--text-muted);
        }

        .accord-block.expanded .chevron-icon-arrow {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .accord-body-text {
          padding: 0 20px 20px;
          font-size: 0.88rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* Luxury Footer */
        .elegant-footer-narrative {
          margin-top: 80px;
          border-top: 1.5px solid var(--text-main);
          padding-top: 60px;
          text-align: left;
        }

        .footer-top-brand {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-foot {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          letter-spacing: -0.04em;
          text-transform: lowercase;
        }

        .footer-tagline {
          font-size: 0.95rem;
          color: var(--text-muted);
          line-height: 1.55;
          margin-top: 14px;
          max-width: 420px;
        }

        .footer-nav-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 28px;
          margin-top: 36px;
        }

        .footer-col h5 {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 0.72rem;
          color: var(--text-main);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .footer-col a {
          display: block;
          color: var(--text-muted);
          font-size: 0.85rem;
          text-decoration: none;
          margin-bottom: 10px;
          transition: color 0.25s;
        }

        .footer-col a:hover {
          color: var(--text-main);
        }

        .footer-bottom-copy {
          margin-top: 48px;
          border-top: 1px solid var(--border-light);
          padding-top: 24px;
          font-size: 0.72rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        /* --- STAGE: Responsive layout controls --- */
        @media (max-width: 1024px) {
          .split-screen-wrapper {
            flex-direction: column;
          }

          .left-sticky-pane {
            width: 100%;
            height: auto;
            position: relative;
            padding: 120px 24px 20px 24px;
          }

          .cockpit-enclosure {
            height: 480px;
          }

          .right-scroll-pane {
            width: 100%;
            padding: 40px 24px;
            gap: 100px;
          }

          .editorial-hero-title {
            font-size: 3rem;
          }

          .editorial-hero-desc {
            max-width: 100%;
          }

          .story-narrative-section {
            opacity: 1;
          }

          .mobile-only-invoice-box {
            display: flex;
            flex-direction: column;
            gap: 8px;
            background: hsl(var(--bg-card));
            border: 1px dashed var(--accent-border);
            padding: 20px;
            border-radius: 12px;
            margin-top: 14px;
          }

          .mobile-invoice-header {
            font-family: 'Outfit', sans-serif;
            font-size: 0.65rem;
            font-weight: 850;
            color: var(--accent);
            letter-spacing: 0.05em;
          }

          .mobile-total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }

          .mobile-total-row span {
            font-size: 0.72rem;
            font-weight: 700;
            color: var(--text-muted);
          }

          .mobile-total-row strong {
            font-family: 'Outfit', sans-serif;
            font-size: 1.4rem;
            font-weight: 900;
            color: var(--text-main);
          }

          .mobile-invoice-disclaimer {
            font-size: 0.65rem;
            color: var(--text-muted);
            margin: 0;
          }
        }

        @media (max-width: 640px) {
          .editorial-hero-title {
            font-size: 2.2rem;
          }

          .navbar-elegant {
            height: 72px;
          }

          .navbar-container {
            padding: 0 16px;
          }

          .navbar-links-group {
            display: none;
          }

          .editorial-hero-actions {
            flex-direction: column;
            align-items: stretch;
            width: 100%;
          }

          .btn-primary-editorial,
          .btn-secondary-editorial {
            justify-content: center;
          }

          .spec-table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>

    </div>
  );
};

export default LandingPage;
