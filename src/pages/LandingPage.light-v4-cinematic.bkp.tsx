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
  FileSpreadsheet
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

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  // Configurator states
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(false);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(800);
  const [userLicenses, setUserLicenses] = useState(5);
  
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  // Dynamic calculations for the contract configuration
  const basePricePecuaria = includePecuaria ? 399 : 0;
  const basePriceFrotas = includeFrotas ? 299 : 0;
  const basePriceHedge = includeHedge ? 499 : 0;
  const herdSurcharge = includePecuaria ? Math.round(herdScale * 0.18) : 0;
  const licenseSurcharge = userLicenses * 25;
  
  const rawSubtotal = basePricePecuaria + basePriceFrotas + basePriceHedge + herdSurcharge + licenseSurcharge;
  
  // Volume discount if multiple modules are checked
  const modulesCheckedCount = [includePecuaria, includeFrotas, includeHedge].filter(Boolean).length;
  const discountMultiplier = modulesCheckedCount === 3 ? 0.8 : modulesCheckedCount === 2 ? 0.9 : 1.0;
  const finalMonthlyPrice = Math.round(rawSubtotal * discountMultiplier);
  const totalAnnualSavings = Math.round((herdScale * 38) + (includeFrotas ? 45000 : 0));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`tauze-landing cinematic-apple-light`}>
      
      {/* --- Ambient Structural Background --- */}
      <div className="ambient-background">
        <div className="subtle-dot-grid"></div>
        <div className="organic-light-mesh"></div>
      </div>

      {/* --- Minimal Navigation --- */}
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
            <a href="#showcase">Showcase</a>
            <a href="#specs">Ficha Técnica</a>
            <a href="#configurator">Configurar Licença</a>
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

      {/* --- Hero: Massive Bold Architectural Focus (Apple Style) --- */}
      <section className="hero-section">
        <div className="container hero-layout">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text-block"
          >
            <div className="badge-premium">
              <Sparkles size={12} />
              <span>Soberania de Dados Agroindustriais</span>
            </div>
            
            <h1 className="hero-title">
              tauze. <br/>
              <span className="gradient-text">a nova soberania.</span>
            </h1>
            
            <p className="hero-description">
              Uma transformação na governança do agro. Acesso absoluto ao peso biológico de rebanhos, telemetria de frotas e auditoria financeira atrelada à B3. Sem dependência de nuvens públicas.
            </p>

            <div className="hero-cta-group">
              <a href="#configurator" className="btn-primary-large">
                Configurar Licença
                <ArrowRight size={18} />
              </a>
              <a href="#showcase" className="btn-secondary-large">
                Conhecer Recursos
              </a>
            </div>
          </motion.div>

          {/* Wide-screen Cinematic Mockup Panel */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.9, delay: 0.2 }}
            className="wide-mockup-wrapper"
            id="showcase"
          >
            <div className="mockup-frame">
              <div className="frame-header">
                <div className="frame-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div className="frame-title">tauze-sovereignty-console</div>
                <div className="frame-badge">
                  <RefreshCw size={11} className="spin-slow" />
                  <span>Sincronismo Local</span>
                </div>
              </div>
              <div className="frame-body">
                <div className="mockup-inner-grid">
                  <div className="mockup-side">
                    <span className="section-label">MONITORAMENTO</span>
                    <div className="side-nav-item active"><Cpu size={14} /> Pecuária 5.0</div>
                    <div className="side-nav-item"><Truck size={14} /> Frota Analítica</div>
                    <div className="side-nav-item"><BarChart3 size={14} /> Hedge B3</div>
                  </div>
                  <div className="mockup-content">
                    <div className="content-header">
                      <h3>Painel de Ativos Biológicos</h3>
                      <span className="status-live">ONLINE LORA</span>
                    </div>
                    
                    <div className="content-stats">
                      <div className="stats-box">
                        <span className="lbl">MÉDIA DE PESO GERAL</span>
                        <span className="val">482.4 kg</span>
                        <span className="trend positive">+4.8% GMD</span>
                      </div>
                      <div className="stats-box">
                        <span className="lbl">LOTE COMPILADO</span>
                        <span className="val">Lote 14-B</span>
                        <span className="trend neutral">240 Animais</span>
                      </div>
                    </div>

                    <div className="content-chart">
                      <span className="chart-lbl">CURVA PROJETADA DE GANHO DE PESO (GMD)</span>
                      <div className="beautiful-svg-curve">
                        <svg viewBox="0 0 400 100" className="svg-curve-draw">
                          <path 
                            d="M 10,80 Q 100,60 200,45 T 390,15" 
                            fill="none" 
                            stroke="var(--accent)" 
                            strokeWidth="3.5" 
                          />
                          <path 
                            d="M 10,80 Q 100,60 200,45 T 390,15 L 390,95 L 10,95 Z" 
                            fill="url(#emerald-fade)" 
                            opacity="0.08" 
                          />
                          <defs>
                            <linearGradient id="emerald-fade" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="var(--accent)" />
                              <stop offset="100%" stopColor="transparent" />
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Cinematic Slide Section: Pilar I (Biometria) --- */}
      <section className="narrative-slide-section gray-bg">
        <div className="container slide-layout">
          <div className="slide-content">
            <span className="slide-num">PILAR 01</span>
            <h2>A precisão absoluta na balança.</h2>
            <p>
              Esqueça controles manuais e planilhas instáveis. O Tauze integra brincos RFID ativos com balanças de pasto voluntárias comuns do mercado. Cada pesagem é cruzada instantaneamente com a curva estatística de engorda do lote.
            </p>
            <div className="slide-specs-mini">
              <div className="spec-mini-item">
                <strong>+18.5kg</strong>
                <span>Engorda Otimizada por Animal</span>
              </div>
              <div className="spec-mini-item">
                <strong>98.8%</strong>
                <span>Precisão Estatística de Abate</span>
              </div>
            </div>
          </div>
          
          <div className="slide-visual">
            <div className="visual-glass-card">
              <div className="card-hud">
                <span className="lbl">RFID SCANNER</span>
                <span className="status-pulse">DETECTOR LORA ATIVO</span>
              </div>
              <div className="rfid-pulse-animation">
                <div className="pulse-circle c1"></div>
                <div className="pulse-circle c2"></div>
                <div className="pulse-center"><Cpu size={24} /></div>
              </div>
              <div className="scanned-tag-details">
                <span>Brinco Aferido: #BR-89240</span>
                <span>Peso Líquido: 512 kg</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Cinematic Slide Section: Pilar II (Telemetria) --- */}
      <section className="narrative-slide-section">
        <div className="container slide-layout alternate">
          <div className="slide-visual">
            <div className="visual-glass-card border-mint">
              <div className="card-hud">
                <span className="lbl">LOGÍSTICA DE COMBUSTÍVEL</span>
                <span className="status-pulse green">TELEMETRIA ATIVA</span>
              </div>
              <div className="fuel-gauge-container">
                <svg viewBox="0 0 120 120" className="gauge-draw">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="60" 
                    cy="60" 
                    r="50" 
                    fill="none" 
                    stroke="var(--accent)" 
                    strokeWidth="8" 
                    strokeDasharray="314" 
                    strokeDashoffset="75" 
                  />
                  <text x="60" y="65" textAnchor="middle" className="gauge-text">92%</text>
                </svg>
              </div>
              <div className="scanned-tag-details text-center">
                <span>Trator John Deere #3</span>
                <span>Consumo Médio: 12.4 L/hora</span>
              </div>
            </div>
          </div>

          <div className="slide-content">
            <span className="slide-num">PILAR 02</span>
            <h2>O controle operacional em movimento.</h2>
            <p>
              Monitore frotas de campo, tratores, colheitadeiras e caminhões de abastecimento diretamente do painel central. A telemetria local integrada ao barramento de tanque de diesel evita qualquer tipo de vazamento ou ineficiência operacional.
            </p>
            <div className="slide-specs-mini">
              <div className="spec-mini-item">
                <strong>-8.2%</strong>
                <span>Redução no Consumo de Combustível</span>
              </div>
              <div className="spec-mini-item">
                <strong>100%</strong>
                <span>Rastreabilidade de Rotas em Pasto</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Cinematic Slide Section: Pilar III (Segurança) --- */}
      <section className="narrative-slide-section gray-bg">
        <div className="container slide-layout">
          <div className="slide-content">
            <span className="slide-num">PILAR 03</span>
            <h2>Sua fazenda encriptada a nível militar.</h2>
            <p>
              Seus dados comerciais e margens de engorda não são compartilhados em pools de nuvem pública com outras marcas. O barramento de segurança do Tauze provê ambientes de banco de dados virtualmente isolados para cada tenant.
            </p>
            <div className="slide-specs-mini">
              <div className="spec-mini-item">
                <strong>AES-256-GCM</strong>
                <span>Algoritmo de Isolamento de Base</span>
              </div>
              <div className="spec-mini-item">
                <strong>Offline-First</strong>
                <span>Operabilidade Local Sem Internet</span>
              </div>
            </div>
          </div>
          
          <div className="slide-visual">
            <div className="visual-glass-card">
              <div className="security-shield-showcase">
                <div className="shield-icon-wrapper">
                  <ShieldCheck size={48} className="shield-icon" />
                </div>
                <div className="security-badges-list">
                  <div className="badge-row"><Check size={14} /> Isolamento Tenant Físico</div>
                  <div className="badge-row"><Check size={14} /> Chaves Criptográficas Rotativas</div>
                  <div className="badge-row"><Check size={14} /> Barramento Local Encriptado</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: The Sports-Car Spec Sheet (Stunning Typography) --- */}
      <section className="specs-sheet-section" id="specs">
        <div className="container">
          <div className="section-header-left">
            <span className="section-tag">FICHA TÉCNICA</span>
            <h2 className="section-title">Especificações de Alto Desempenho</h2>
            <p className="section-subtitle">Tudo o que torna o ecossistema digital da tauze a tecnologia mais robusta do agronegócio corporativo brasileiro.</p>
          </div>

          <div className="specs-grid">
            <div className="spec-row-item">
              <span className="label">Criptografia e Blindagem</span>
              <span className="value">AES-256-GCM com isolamento físico de banco de dados</span>
            </div>
            <div className="spec-row-item">
              <span className="label">Protocolo de Comunicação</span>
              <span className="value">LoRa local, Bluetooth ativo e pareamento offline-first</span>
            </div>
            <div className="spec-row-item">
              <span className="label">Integração de Balanças</span>
              <span className="value">Drivers nativos compatíveis com marcas líderes e bastões RFID</span>
            </div>
            <div className="spec-row-item">
              <span className="label">Telemetria de Diesel</span>
              <span className="value">Barramento direto acoplado à boia de tanque e bombas móveis</span>
            </div>
            <div className="spec-row-item">
              <span className="label">Proteção Financeira</span>
              <span className="value">Mapeamento contínuo de curva de peso futuro atrelado à B3</span>
            </div>
            <div className="spec-row-item">
              <span className="label">Compliance Contábil</span>
              <span className="value">Emissão de relatórios OFX e XML auditáveis sob regulação SOX</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- Section: The Dynamic Contract Configurator (THE OUT-OF-THE-BOX ELEMENT) --- */}
      <section className="configurator-section" id="configurator">
        <div className="container">
          
          <div className="config-header-center">
            <span className="section-tag">CONTRATO DE LICENÇA</span>
            <h2 className="section-title">Configure sua Soberania</h2>
            <p className="section-subtitle">Escolha os módulos operacionais necessários e ajuste a escala para gerar uma proposta personalizada e auditável.</p>
          </div>

          <div className="configurator-grid">
            
            {/* Left Column: Interactive Controls */}
            <div className="configurator-controls">
              
              <div className="config-control-card">
                <h3>1. Módulos Operacionais</h3>
                <p className="desc-text">Selecione quais áreas do ecossistema deseja licenciar para as suas fazendas:</p>
                
                <div className="selection-list">
                  <div 
                    onClick={() => setIncludePecuaria(!includePecuaria)} 
                    className={`selection-item ${includePecuaria ? 'checked' : ''}`}
                  >
                    <div className="check-box">
                      {includePecuaria && <Check size={14} />}
                    </div>
                    <div className="selection-text">
                      <strong>Pecuária de Precisão (RFID)</strong>
                      <span>Pesagem voluntária, curva GMD estatística e monitoramento de lotes.</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIncludeFrotas(!includeFrotas)} 
                    className={`selection-item ${includeFrotas ? 'checked' : ''}`}
                  >
                    <div className="check-box">
                      {includeFrotas && <Check size={14} />}
                    </div>
                    <div className="selection-text">
                      <strong>Telemetria de Frotas & Combustível</strong>
                      <span>Dispositivo local acoplado ao diesel de tratores e frotas de campo.</span>
                    </div>
                  </div>

                  <div 
                    onClick={() => setIncludeHedge(!includeHedge)} 
                    className={`selection-item ${includeHedge ? 'checked' : ''}`}
                  >
                    <div className="check-box">
                      {includeHedge && <Check size={14} />}
                    </div>
                    <div className="selection-text">
                      <strong>Hedge e Proteção Comercial B3</strong>
                      <span>IA que prevê abate ótimo atrelado à tabela futura da Bolsa de Valores.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="config-control-card">
                <h3>2. Escala Operacional</h3>
                <p className="desc-text">Ajuste os parâmetros conforme a dimensão real do seu negócio:</p>

                <div className="slider-wrapper">
                  <div className="slider-label-row">
                    <span>Cabeças de Gado (Pecuária)</span>
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
                    className="premium-range-slider"
                  />
                </div>

                <div className="slider-wrapper">
                  <div className="slider-label-row">
                    <span>Licenças de Usuário</span>
                    <strong>{userLicenses} usuários</strong>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="50" 
                    step="1"
                    value={userLicenses} 
                    onChange={(e) => setUserLicenses(parseInt(e.target.value))}
                    className="premium-range-slider"
                  />
                </div>
              </div>

            </div>

            {/* Right Column: The Dynamic Digital Contract */}
            <div className="configurator-contract-preview">
              <div className="contract-card">
                <div className="contract-stamp">HOMOLOGADO</div>
                
                <div className="contract-header">
                  <TauzeLogo size={32} />
                  <div className="h-text">
                    <h4>PROPOSTA COMERCIAL</h4>
                    <span>CONTRATO DE LICENCIAMENTO MENSAL</span>
                  </div>
                </div>

                <div className="contract-divider"></div>

                <div className="contract-details">
                  <div className="detail-row">
                    <span className="lbl">CONTRATANTE:</span>
                    <span className="val text-uppercase">Produtor Integrado Tauze</span>
                  </div>
                  <div className="detail-row">
                    <span className="lbl">EMISSÃO DA PROPOSTA:</span>
                    <span className="val">2026</span>
                  </div>
                  <div className="detail-row">
                    <span className="lbl">BASE COMPUTACIONAL:</span>
                    <span className="val text-emerald">ISOLADA (AES-256)</span>
                  </div>
                </div>

                <div className="contract-divider"></div>

                {/* Itemized Pricing breakdown */}
                <div className="contract-breakdown">
                  <h5>ITENS INTEGRADOS:</h5>
                  <div className="breakdown-list">
                    {includePecuaria && (
                      <div className="breakdown-item">
                        <span>Pecuária de Precisão (Módulo Base)</span>
                        <strong>R$ 399/mês</strong>
                      </div>
                    )}
                    {includeFrotas && (
                      <div className="breakdown-item">
                        <span>Telemetria de Frotas (Módulo Base)</span>
                        <strong>R$ 299/mês</strong>
                      </div>
                    )}
                    {includeHedge && (
                      <div className="breakdown-item">
                        <span>Inteligência B3 Hedge (Módulo Base)</span>
                        <strong>R$ 499/mês</strong>
                      </div>
                    )}
                    {includePecuaria && (
                      <div className="breakdown-item">
                        <span>Escala de Rebanho ({herdScale} heads)</span>
                        <strong>R$ {herdSurcharge}/mês</strong>
                      </div>
                    )}
                    <div className="breakdown-item">
                      <span>{userLicenses} Licenças de Acesso</span>
                      <strong>R$ {licenseSurcharge}/mês</strong>
                    </div>

                    {modulesCheckedCount >= 2 && (
                      <div className="breakdown-item text-emerald">
                        <span>Desconto Combo ({modulesCheckedCount === 3 ? "20%" : "10%"})</span>
                        <strong>-{modulesCheckedCount === 3 ? "20%" : "10%"}</strong>
                      </div>
                    )}
                  </div>
                </div>

                <div className="contract-divider"></div>

                <div className="contract-totals">
                  <div className="total-row">
                    <span className="lbl">INVESTIMENTO MENSAL:</span>
                    <span className="val-total">R$ {finalMonthlyPrice.toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="total-row text-muted-small">
                    <span className="lbl">Economia Operacional Estimada Anual:</span>
                    <span className="val text-emerald">R$ {totalAnnualSavings.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="contract-cta-block">
                  <Link to="/login" className="btn-primary-contract">
                    Assinar Contrato de Operação
                    <ArrowRight size={16} />
                  </Link>
                  <span className="disclaimer">Documento digital gerado em compliance com segurança da informação.</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* --- Section: Pure Light FAQ --- */}
      <section className="faq-section" id="faq">
        <div className="container faq-layout-wrapper">
          <div className="section-header-left">
            <span className="section-tag">DÚVIDAS FREQUENTES</span>
            <h2 className="section-title">Esclarecimentos Técnicos</h2>
            <p className="section-subtitle">Informações complementares sobre a governança e infraestrutura do ecossistema.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Como é garantido o isolamento físico dos dados?",
                a: "Diferente de sistemas convencionais multi-tenant que misturam todas as informações de clientes na mesma partição lúdica, a tauze cria ambientes e containers independentes. Cada produtor conta com suas próprias chaves e isolamento criptográfico AES-256."
              },
              {
                q: "Posso utilizar minhas balanças e bastões RFID atuais?",
                a: "Sim. Oferecemos suporte e drivers nativos de conexão para as principais marcas de balanças e antenas de curral Bluetooth do mercado brasileiro."
              },
              {
                q: "A telemetria de frota exige cobertura 4G contínua no campo?",
                a: "Não. A telemetria opera de forma autônoma offline. Os dados dos tratores e tanques de combustível são consolidados localmente e sincronizados de forma segura assim que houver sinal LoRa ou conexão de rede."
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

      {/* --- Clean Footer --- */}
      <footer className="elegant-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo-group">
              <TauzeLogo size={36} />
              <span className="brand">tauze</span>
            </div>
            <p>A mais limpa, segura e moderna plataforma de governança agroindustrial e controle biológico soberano.</p>
          </div>
          <div className="footer-links">
            <div className="col">
              <h5>Tecnologia</h5>
              <a href="#showcase">Showcase Geral</a>
              <a href="#specs">Ficha Técnica</a>
              <a href="#configurator">Configurador de Contrato</a>
            </div>
            <div className="col">
              <h5>Marca</h5>
              <a href="#faq">Políticas de Base Isolada</a>
              <a href="/login">Portal de Operação</a>
              <a href="#faq">FAQ</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Operacional.</p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap');

        .cinematic-apple-light {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --accent: #00b865;
          --accent-light: rgba(0, 184, 101, 0.05);
          --accent-border: rgba(0, 184, 101, 0.1);
          --text-main: #0f172a;
          --text-muted: #475569;
          --border-light: #e2e8f0;
          --shadow-premium: rgba(0, 184, 101, 0.03);

          background: var(--bg-primary);
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

        /* --- Ambient Background --- */
        .ambient-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .subtle-dot-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 184, 101, 0.04) 1px, transparent 1px);
          background-size: 36px 36px;
          opacity: 0.8;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
        }

        .organic-light-mesh {
          position: absolute;
          top: -15%;
          right: -10%;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.05) 0%, transparent 70%);
          filter: blur(100px);
        }

        /* --- Navbar --- */
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

        /* --- Hero Section --- */
        .hero-section {
          padding: 200px 0 120px;
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
          margin-bottom: 32px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 5.6rem;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.05em;
          margin-bottom: 28px;
          max-width: 900px;
        }

        .hero-description {
          font-size: 1.3rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 720px;
        }

        .hero-cta-group {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 100px;
        }

        .btn-primary-large {
          background: var(--accent);
          color: #ffffff;
          padding: 18px 36px;
          border-radius: 14px;
          font-size: 1.05rem;
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
          background: var(--bg-secondary);
          border-color: rgba(0, 0, 0, 0.15);
        }

        /* Wide cinematic mockup frame */
        .wide-mockup-wrapper {
          width: 100%;
          max-width: 1100px;
          margin-inline: auto;
        }

        .mockup-frame {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--accent-border);
          border-radius: 24px;
          box-shadow: 0 30px 60px var(--shadow-premium), 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .frame-header {
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
          background: #e2e8f0;
        }

        .frame-dots span:nth-child(1) { background: #ff5f56; }
        .frame-dots span:nth-child(2) { background: #ffbd2e; }
        .frame-dots span:nth-child(3) { background: #27c93f; }

        .frame-title {
          font-family: monospace;
          font-size: 0.82rem;
          color: var(--text-muted);
        }

        .frame-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--accent);
          font-weight: 700;
        }

        .spin-slow {
          animation: spin 3s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .mockup-inner-grid {
          display: grid;
          grid-template-columns: 240px 1fr;
          min-height: 380px;
          background: hsl(var(--bg-card));
        }

        .mockup-side {
          background: hsl(var(--bg-main));
          border-right: 1px solid var(--border-light);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          text-align: left;
        }

        .mockup-side .section-label {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.08em;
          margin-bottom: 12px;
        }

        .side-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
        }

        .side-nav-item.active {
          background: hsl(var(--bg-card));
          color: var(--accent);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
          border: 1px solid rgba(0, 184, 101, 0.06);
        }

        .mockup-content {
          padding: 36px;
          text-align: left;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .content-header h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.45rem;
          font-weight: 800;
        }

        .status-live {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--accent);
          padding: 4px 10px;
          background: var(--accent-light);
          border-radius: 100px;
          letter-spacing: 0.04em;
        }

        .content-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .stats-box {
          background: var(--bg-secondary);
          border: 1px solid var(--border-light);
          padding: 20px;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .stats-box .lbl {
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .stats-box .val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
        }

        .stats-box .trend {
          font-size: 0.72rem;
          font-weight: 800;
          align-self: flex-start;
          padding: 2px 8px;
          border-radius: 100px;
        }

        .stats-box .trend.positive {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
        }

        .stats-box .trend.neutral {
          background: #e2e8f0;
          color: var(--text-muted);
        }

        .content-chart {
          border-top: 1px solid var(--border-light);
          padding-top: 20px;
        }

        .chart-lbl {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 12px;
        }

        .svg-curve-draw {
          width: 100%;
          height: 100px;
        }

        /* --- Narrative Slides --- */
        .narrative-slide-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .narrative-slide-section.gray-bg {
          background: var(--bg-secondary);
          border-block: 1px solid var(--border-light);
        }

        .slide-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 80px;
          align-items: center;
        }

        .slide-layout.alternate {
          direction: ltr;
        }

        .slide-content h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 3.2rem;
          font-weight: 900;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 24px;
        }

        .slide-num {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 16px;
        }

        .slide-content p {
          font-size: 1.1rem;
          color: var(--text-muted);
          line-height: 1.6;
          margin-bottom: 40px;
        }

        .slide-specs-mini {
          display: flex;
          gap: 36px;
        }

        .spec-mini-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .spec-mini-item strong {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
          line-height: 1;
        }

        .spec-mini-item span {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .visual-glass-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 28px;
          padding: 36px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.015);
          display: flex;
          flex-direction: column;
          gap: 28px;
          position: relative;
        }

        .visual-glass-card.border-mint {
          border-color: rgba(0, 184, 101, 0.15);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.02);
        }

        .card-hud {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.72rem;
          font-weight: 800;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
        }

        .status-pulse {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--accent);
        }

        .status-pulse::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(0, 184, 101, 0.2);
        }

        .rfid-pulse-animation {
          position: relative;
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pulse-circle {
          position: absolute;
          border: 1px stroke var(--accent);
          border-radius: 50%;
          opacity: 0;
          animation: rfid-pulse 3s cubic-bezier(0.16, 1, 0.3, 1) infinite;
        }

        .pulse-circle.c1 {
          width: 80px;
          height: 80px;
          border: 1.5px solid rgba(0, 184, 101, 0.3);
        }

        .pulse-circle.c2 {
          width: 140px;
          height: 140px;
          border: 1px solid rgba(0, 184, 101, 0.15);
          animation-delay: 1s;
        }

        @keyframes rfid-pulse {
          0% { transform: scale(0.6); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: scale(1.3); opacity: 0; }
        }

        .pulse-center {
          background: var(--accent-light);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1;
        }

        .scanned-tag-details {
          background: var(--bg-secondary);
          border-radius: 12px;
          padding: 14px;
          font-family: monospace;
          font-size: 0.8rem;
          display: flex;
          flex-direction: column;
          gap: 4px;
          color: var(--text-muted);
        }

        .fuel-gauge-container {
          height: 180px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .gauge-draw {
          width: 140px;
          height: 140px;
        }

        .gauge-text {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.5rem;
          fill: var(--text-main);
        }

        .security-shield-showcase {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 24px;
          padding-block: 20px;
        }

        .shield-icon-wrapper {
          background: rgba(0, 184, 101, 0.05);
          border: 1px solid var(--accent-border);
          color: var(--accent);
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.1);
        }

        .security-badges-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
        }

        .badge-row {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .badge-row svg {
          color: var(--accent);
        }

        /* --- Technical Specs Sheet --- */
        .specs-sheet-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .section-header-left {
          margin-bottom: 72px;
          text-align: left;
        }

        .specs-grid {
          border-top: 1px solid var(--text-main);
          display: flex;
          flex-direction: column;
        }

        .spec-row-item {
          display: grid;
          grid-template-columns: 1fr 2fr;
          padding: 32px 0;
          border-bottom: 1px solid var(--border-light);
          align-items: center;
          gap: 32px;
        }

        .spec-row-item .label {
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1.15rem;
        }

        .spec-row-item .value {
          font-size: 1rem;
          color: var(--text-muted);
          line-height: 1.5;
        }

        /* --- Section: Custom Configurator --- */
        .configurator-section {
          padding: 120px 0;
          background: var(--bg-secondary);
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

        .config-control-card {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 24px;
          padding: 36px;
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.005);
        }

        .config-control-card h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .config-control-card .desc-text {
          font-size: 0.88rem;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .selection-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .selection-item {
          border: 1.5px solid var(--border-light);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.25s;
        }

        .selection-item:hover {
          border-color: rgba(0, 184, 101, 0.3);
          background: var(--bg-secondary);
        }

        .selection-item.checked {
          border-color: var(--accent);
          background: rgba(0, 184, 101, 0.02);
        }

        .selection-item .check-box {
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

        .selection-item.checked .check-box {
          border-color: var(--accent);
          background: var(--accent);
        }

        .selection-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          text-align: left;
        }

        .selection-text strong {
          font-size: 0.95rem;
        }

        .selection-text span {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .slider-wrapper {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 24px;
        }

        .slider-wrapper:last-child {
          margin-bottom: 0;
        }

        .slider-label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          font-weight: 700;
        }

        .slider-label-row strong {
          color: var(--accent);
        }

        .premium-range-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 100px;
          background: hsl(var(--bg-main));
          outline: none;
        }

        .premium-range-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0, 184, 101, 0.25);
        }

        /* --- Dynamic Digital Contract --- */
        .configurator-contract-preview {
          display: flex;
        }

        .contract-card {
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

        .contract-stamp {
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

        .contract-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .contract-header h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 900;
          letter-spacing: 0.02em;
          margin-bottom: 2px;
        }

        .contract-header span {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .contract-divider {
          height: 1px;
          border-top: 1px dashed var(--border-light);
        }

        .contract-details {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          font-family: monospace;
          font-size: 0.78rem;
        }

        .detail-row .lbl {
          color: var(--text-muted);
        }

        .detail-row .val {
          font-weight: 700;
        }

        .contract-breakdown {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .contract-breakdown h5 {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: 0.05em;
        }

        .breakdown-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .breakdown-item {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
          font-weight: 500;
          color: var(--text-muted);
        }

        .breakdown-item strong {
          color: var(--text-main);
        }

        .contract-breakdown .text-emerald {
          color: var(--accent);
          font-weight: 700;
        }

        .contract-totals {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .total-row .lbl {
          font-size: 0.72rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .val-total {
          font-family: 'Outfit', sans-serif;
          font-size: 2.3rem;
          font-weight: 900;
          color: var(--text-main);
          line-height: 1;
        }

        .text-muted-small {
          font-size: 0.78rem;
        }

        .contract-cta-block {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 12px;
        }

        .btn-primary-contract {
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

        .btn-primary-contract:hover {
          background: #000000;
          transform: translateY(-2px);
        }

        .contract-cta-block .disclaimer {
          font-size: 0.65rem;
          color: var(--text-muted);
          text-align: center;
        }

        /* --- Section: Accordion FAQ --- */
        .faq-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .faq-layout-wrapper {
          max-width: 800px;
        }

        .faq-list {
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
          border-top: 1px solid var(--border-light);
          text-align: center;
          color: var(--text-muted);
          font-size: 0.8rem;
        }

        /* --- Responsive media queries --- */
        @media (max-width: 1024px) {
          .slide-layout { grid-template-columns: 1fr; gap: 40px; }
          .slide-layout.alternate { display: flex; flex-direction: column-reverse; }
          .spec-row-item { grid-template-columns: 1fr; gap: 8px; padding: 20px 0; }
          .configurator-grid { grid-template-columns: 1fr; }
          .footer-grid { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .hero-title { font-size: 3.6rem; }
          .slide-content h2 { font-size: 2.3rem; }
          .mockup-inner-grid { grid-template-columns: 1fr; }
          .mockup-side { border-right: none; border-bottom: 1px solid var(--border-light); }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 2.8rem; }
          .spec-mini-item strong { font-size: 1.8rem; }
          .val-total { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
