import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowRight, 
  Terminal, 
  Check, 
  Cpu, 
  Truck, 
  TrendingUp, 
  ShieldCheck, 
  ChevronRight, 
  Lock, 
  ArrowUpRight,
  ChevronDown
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

  // Configurator minimal state
  const [includePecuaria, setIncludePecuaria] = useState(true);
  const [includeFrotas, setIncludeFrotas] = useState(true);
  const [includeHedge, setIncludeHedge] = useState(false);
  const [herdScale, setHerdScale] = useState(1500);
  const [userLicenses, setUserLicenses] = useState(10);

  // Pricing calculations
  const basePecuaria = includePecuaria ? 390 : 0;
  const baseFrotas = includeFrotas ? 290 : 0;
  const baseHedge = includeHedge ? 490 : 0;
  const scaleSurcharge = includePecuaria ? Math.round(herdScale * 0.10) : 0;
  const licenseSurcharge = userLicenses * 15;

  const subtotal = basePecuaria + baseFrotas + baseHedge + scaleSurcharge + licenseSurcharge;
  const selectedCount = [includePecuaria, includeFrotas, includeHedge].filter(Boolean).length;
  const discountMultiplier = selectedCount === 3 ? 0.8 : selectedCount === 2 ? 0.9 : 1.0;
  const finalPrice = Math.round(subtotal * discountMultiplier);

  // ROI: R$ 50/animal optimizations + logistics savings
  const estimatedSavings = Math.round((herdScale * 50) + (includeFrotas ? 45000 : 0));

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="tauze-minimal-canvas">

      {/* -------------------- DYNAMIC GLOBAL TICKER -------------------- */}
      <div className="stats-ticker-bar">
        <div className="ticker-scroll-wrapper">
          <div className="ticker-scroll-content">
            <span className="ticker-item"><span className="indicator-emerald"></span> BOI GORDO B3: R$ 285.50/@ <span className="tick-positive">(+1.20%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> MILHO B3: R$ 68.20/sc <span className="tick-positive">(+0.85%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> DÓLAR: R$ 5.12 <span className="tick-negative">(-0.40%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> TELEMETRIA LORA: OPERANTE</span>
            <span className="ticker-item"><span className="indicator-emerald"></span> CRIPTOGRAFIA AES-256: ATIVA</span>
          </div>
          <div className="ticker-scroll-content">
            <span className="ticker-item"><span className="indicator-emerald"></span> BOI GORDO B3: R$ 285.50/@ <span className="tick-positive">(+1.20%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> MILHO B3: R$ 68.20/sc <span className="tick-positive">(+0.85%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> DÓLAR: R$ 5.12 <span className="tick-negative">(-0.40%)</span></span>
            <span className="ticker-item"><span className="indicator-emerald"></span> TELEMETRIA LORA: OPERANTE</span>
            <span className="ticker-item"><span className="indicator-emerald"></span> CRIPTOGRAFIA AES-256: ATIVA</span>
          </div>
        </div>
      </div>

      {/* -------------------- FLOATING QUIET HEADER -------------------- */}
      <nav className={`navbar-elegant ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="brand-logo-group">
            <div className="logo-badge">
              <TauzeLogo size={28} />
            </div>
            <span className="brand-name">tauze</span>
          </div>

          <div className="navbar-links-group">
            <a href="#hero-stage">Início</a>
            <a href="#sec-features">Governança</a>
            <a href="#sec-config">Simulador</a>
            <a href="#sec-faq">Perguntas</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-terminal-sec">
              <span>Entrar</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- EDITORIAL HERO STAGE -------------------- */}
      <header id="hero-stage" className="hero-editorial-stage">
        <div className="hero-content-wrapper">
          <span className="hero-badge-tag">
            <span>TAUZE SOVEREIGN EDITION</span>
          </span>

          <h1 className="hero-main-title">
            A clareza governa a complexidade.
          </h1>

          <p className="hero-main-desc">
            Uma plataforma minimalista de inteligência física e digital para grandes operações agropecuárias. Mapeamento RFID voluntário, telemetria offline-first e soberania absoluta de dados.
          </p>

          <div className="hero-actions-container">
            <a href="#sec-features" className="btn-primary-editorial">
              <span>Conhecer Plataforma</span>
            </a>
            <a href="#sec-config" className="btn-secondary-editorial">
              <span>Dimensionar Custos</span>
            </a>
          </div>
        </div>

        {/* Quiet Luxury Showcase Card Mockup */}
        <div className="hero-showcase-canvas">
          <div className="showcase-frame">
            <div className="showcase-header">
              <div className="circle-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="showcase-url">tauze.sovereign.interface</div>
            </div>
            <div className="showcase-body">
              <div className="mock-sidebar">
                <div className="mock-logo"><TauzeLogo size={18} /></div>
                <div className="mock-nav-item active"></div>
                <div className="mock-nav-item"></div>
                <div className="mock-nav-item"></div>
              </div>
              <div className="mock-content">
                <div className="mock-kpi-row">
                  <div className="mock-kpi-card">
                    <span className="lbl">PESO MÉDIO LOTE L-14</span>
                    <strong>492.5 kg</strong>
                    <div className="spark-line-mock"></div>
                  </div>
                  <div className="mock-kpi-card">
                    <span className="lbl">GMD DIÁRIO ESTIMADO</span>
                    <strong className="text-emerald">+1.48 kg</strong>
                    <div className="spark-line-mock"></div>
                  </div>
                </div>
                <div className="mock-main-chart">
                  <svg viewBox="0 0 400 120" className="mock-svg-spline">
                    <path d="M 0,110 C 100,110 180,60 280,40 C 340,28 370,18 400,10" fill="none" stroke="#00b865" strokeWidth="2.5" />
                    <circle cx="280" cy="40" r="4.5" fill="#00b865" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------- MINIMALIST EDITORIAL FEATURES -------------------- */}
      <section id="sec-features" className="editorial-features-section">
        
        {/* PILLAR 1: SOBERANIA (Encrypted Vault) */}
        <div className="feature-block-editorial">
          <div className="feature-text-pane">
            <span className="pillar-num">01 // SEGURANÇA</span>
            <h2>Soberania Absoluta de Dados</h2>
            <p className="lead-para">
              Diferente de sistemas multitenant convencionais que compartilham pools de banco de dados, o <strong>tauze</strong> isola fisicamente os seus registros de produção e contabilidade.
            </p>
            <p className="sub-para">
              Cada cliente possui servidores e bancos de dados criptografados dedicados, operando sob chaves assimétricas de rotação contínua (AES-256-GCM). Nenhum dado é compartilhado ou trafega em canais comuns.
            </p>
            <ul className="minimal-check-list">
              <li><Check size={14} className="text-emerald" /> <span>Bancos de dados 100% isolados por tenant</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Encriptação ponta a ponta na nuvem e local</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Zero compartilhamento ou pools de conexões comuns</span></li>
            </ul>
          </div>
          
          <div className="feature-visual-pane">
            <div className="abstract-safety-circles">
              <svg viewBox="0 0 300 300" className="safety-svg">
                <circle cx="150" cy="150" r="130" fill="none" stroke="#eeeeee" strokeWidth="1" />
                <circle cx="150" cy="150" r="100" fill="none" stroke="#eeeeee" strokeWidth="1" strokeDasharray="6" />
                <circle cx="150" cy="150" r="70" fill="none" stroke="rgba(0, 184, 101, 0.08)" strokeWidth="2" />
                <circle cx="150" cy="150" r="70" fill="none" stroke="#00b865" strokeWidth="1.5" strokeDasharray="30 180" className="spin-slow" />
                <g transform="translate(132, 132)">
                  <rect width="36" height="36" rx="18" fill="#ffffff" stroke="#e5e3dc" strokeWidth="1" />
                  <Lock size={14} className="lock-icon-minimal" />
                </g>
              </svg>
              <div className="visual-badge">TENANT ISOLADO</div>
            </div>
          </div>
        </div>

        {/* PILLAR 2: PECUÁRIA (RFID Spline Weighting) */}
        <div className="feature-block-editorial reverse">
          <div className="feature-text-pane">
            <span className="pillar-num">02 // OPERAÇÃO</span>
            <h2>Pecuária RFID Voluntária</h2>
            <p className="lead-para">
              Pesagens estressantes desgastam o animal e geram perda imediata de arrobas. A tecnologia de passagem voluntária resolve esse gargalo.
            </p>
            <p className="sub-para">
              Ao instalar antenas RFID e balanças inteligentes de alta precisão em corredores de bebedouros ou cochos, a pesagem é realizada sem manejo humano direto. Nosso algoritmo calcula curvas reais de GMD (Ganho Médio Diário) e estima as melhores datas de abate.
            </p>
            <ul className="minimal-check-list">
              <li><Check size={14} className="text-emerald" /> <span>Leitura voluntária por brincos RFID</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Curva spline real de engorda e GMD diário</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Previsão de ótimo biológico para abate</span></li>
            </ul>
          </div>

          <div className="feature-visual-pane">
            <div className="minimal-chart-card">
              <div className="chart-card-header">
                <strong>HISTÓRICO DE PESAGENS</strong>
                <span>LO-14 (Recinto Pasto Norte)</span>
              </div>
              <div className="chart-body-box">
                <svg viewBox="0 0 280 120" className="clean-spline-svg">
                  <path d="M 10,110 Q 80,95 150,50 T 270,18" fill="none" stroke="#00b865" strokeWidth="2.5" />
                  <circle cx="270" cy="18" r="4.5" fill="#00b865" />
                  <g transform="translate(170, 22)">
                    <rect width="84" height="24" rx="4" fill="#1c1c1a" />
                    <text x="42" y="15" fill="#ffffff" fontSize="8" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
                      BOVINO: 492.4 kg
                    </text>
                  </g>
                </svg>
              </div>
              <div className="chart-card-footer">
                <div className="footer-stat">
                  <span>MÉDIA LOTE</span>
                  <strong>486.2 kg</strong>
                </div>
                <div className="footer-stat">
                  <span>GMD LOTE</span>
                  <strong className="text-emerald">+1.34 kg/dia</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PILLAR 3: TELEMETRIA OFFLINE-FIRST */}
        <div className="feature-block-editorial">
          <div className="feature-text-pane">
            <span className="pillar-num">03 // LOGÍSTICA</span>
            <h2>Telemetria Offline-First de Frotas</h2>
            <p className="lead-para">
              Áreas agrícolas remotas raramente contam com sinal celular estável. Operar sob a premissa de conectividade contínua gera perda de dados.
            </p>
            <p className="sub-para">
              A telemetria do <strong>tauze</strong> funciona em arquitetura local offline-first. Sensores de fluxo de bomba, telemetria de tratores e colheitadeiras e rastreamento operam de forma autônoma e sincronizam dados por rádio Lora local assim que um gateway é alcançado.
            </p>
            <ul className="minimal-check-list">
              <li><Check size={14} className="text-emerald" /> <span>Rastreamento georreferenciado offline local</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Sensores de consumo instantâneo integrados</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Pontes de transmissão automática via Lora rádio</span></li>
            </ul>
          </div>

          <div className="feature-visual-pane">
            <div className="abstract-fleet-map">
              <svg viewBox="0 0 280 180" className="fleet-map-svg">
                <path d="M 20,40 Q 90,20 120,90 T 260,110" fill="none" stroke="#e5e3dc" strokeWidth="3" strokeLinecap="round" />
                <path d="M 20,40 Q 90,20 120,90 T 260,110" fill="none" stroke="#00b865" strokeWidth="1.5" strokeDasharray="4" strokeLinecap="round" />
                <circle cx="120" cy="90" r="5" fill="#00b865" className="pulse-slow" />
                <g transform="translate(132, 75)">
                  <rect width="68" height="20" rx="3" fill="#ffffff" stroke="#e5e3dc" strokeWidth="1" />
                  <text x="34" y="12" fill="#1c1c1a" fontSize="7" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">
                    JD TRACTOR-04
                  </text>
                </g>
              </svg>
              <div className="visual-badge bottom-left">GPS OFFLINE ACTIVE</div>
            </div>
          </div>
        </div>

        {/* PILLAR 4: HEDGE & B3 */}
        <div className="feature-block-editorial reverse">
          <div className="feature-text-pane">
            <span className="pillar-num">04 // FINANCEIRO</span>
            <h2>Blindagem de Margens B3</h2>
            <p className="lead-para">
              A volatilidade das commodities agrícolas é a maior vilã da previsibilidade fiscal. Integrar a física de produção com a financeira é essencial.
            </p>
            <p className="sub-para">
              Conectamos os dados reais de peso e estoque de animais diretamente a indexadores de commodities no mercado futuro da bolsa B3. Isso permite simular cenários de travamento e executar hedges com base em dados de campo reais, reduzindo riscos de oscilação cambial.
            </p>
            <ul className="minimal-check-list">
              <li><Check size={14} className="text-emerald" /> <span>Indexador em tempo real Boi Gordo (BGI) e Milho (CCM)</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Mapeamento automático de margem de segurança</span></li>
              <li><Check size={14} className="text-emerald" /> <span>Garantias calculadas sobre peso físico real auditado</span></li>
            </ul>
          </div>

          <div className="feature-visual-pane">
            <div className="minimal-hedge-card">
              <div className="hedge-card-header">
                <strong>BLINDAGEM FINANCEIRA B3</strong>
                <span className="text-emerald">MARGEM TRAVADA</span>
              </div>
              <div className="hedge-chart-box">
                <svg viewBox="0 0 260 100" className="clean-hedge-svg">
                  <rect x="0" y="0" width="260" height="46" fill="rgba(0, 184, 101, 0.03)" />
                  <line x1="0" y1="46" x2="260" y2="46" stroke="#00b865" strokeWidth="1" strokeDasharray="3" />
                  
                  {/* Candle graphs */}
                  <rect x="30" y="55" width="8" height="15" fill="#ff5f56" />
                  <line x1="34" y1="75" x2="34" y2="50" stroke="#ff5f56" strokeWidth="1.5" />

                  <rect x="90" y="42" width="8" height="20" fill="#00b865" />
                  <line x1="94" y1="65" x2="94" y2="35" stroke="#00b865" strokeWidth="1.5" />

                  <rect x="150" y="30" width="8" height="20" fill="#00b865" />
                  <line x1="154" y1="55" x2="154" y2="25" stroke="#00b865" strokeWidth="1.5" />

                  <rect x="210" y="18" width="8" height="25" fill="#00b865" />
                  <line x1="214" y1="48" x2="214" y2="10" stroke="#00b865" strokeWidth="1.5" />
                </svg>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* -------------------- ELEGANT MINIMALIST SIMULATOR -------------------- */}
      <section id="sec-config" className="minimalist-configurator-section">
        <div className="config-container">
          <div className="config-header">
            <span className="pillar-num text-center">05 // PRO-FORMA</span>
            <h2>Dimensionamento de Retorno e Escala</h2>
            <p className="lead-para text-center max-w-xl mx-auto">
              Selecione seus módulos, defina a escala operacional do rebanho e receba a estimativa de custos e ROI anual na hora.
            </p>
          </div>

          <div className="config-split-grid">
            
            {/* Sliders and Toggles Form */}
            <div className="config-controls-box">
              
              <div className="config-group">
                <span className="config-lbl">Módulos de Tecnologia</span>
                <div className="toggles-list">
                  <label className={`toggle-card ${includePecuaria ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includePecuaria} 
                      onChange={(e) => setIncludePecuaria(e.target.checked)} 
                    />
                    <div className="toggle-info">
                      <strong>Pecuária RFID</strong>
                      <span>Pesagem involuntária no bebedouro</span>
                    </div>
                  </label>

                  <label className={`toggle-card ${includeFrotas ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeFrotas} 
                      onChange={(e) => setIncludeFrotas(e.target.checked)} 
                    />
                    <div className="toggle-info">
                      <strong>Telemetria Frota</strong>
                      <span>Mapeamento de frotas offline-first</span>
                    </div>
                  </label>

                  <label className={`toggle-card ${includeHedge ? 'active' : ''}`}>
                    <input 
                      type="checkbox" 
                      checked={includeHedge} 
                      onChange={(e) => setIncludeHedge(e.target.checked)} 
                    />
                    <div className="toggle-info">
                      <strong>Hedge & Bolsa B3</strong>
                      <span>Indexador e blindagem de margem</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="config-group">
                <div className="slider-header-info">
                  <span className="config-lbl">Rebanho Ativo</span>
                  <strong className="text-emerald">{herdScale.toLocaleString()} cabeças</strong>
                </div>
                <input 
                  type="range" 
                  min="100" 
                  max="10000" 
                  step="50" 
                  value={herdScale} 
                  onChange={(e) => setHerdScale(Number(e.target.value))} 
                  className="clean-slider"
                />
                <div className="slider-limits">
                  <span>100 cab</span>
                  <span>10.000 cab</span>
                </div>
              </div>

              <div className="config-group">
                <div className="slider-header-info">
                  <span className="config-lbl">Licenças Administrativas</span>
                  <strong className="text-emerald">{userLicenses} acessos</strong>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="50" 
                  step="1" 
                  value={userLicenses} 
                  onChange={(e) => setUserLicenses(Number(e.target.value))} 
                  className="clean-slider"
                />
                <div className="slider-limits">
                  <span>2 acessos</span>
                  <span>50 acessos</span>
                </div>
              </div>

            </div>

            {/* Pristine Minimalist Contract Paper Invoice */}
            <div className="config-invoice-box">
              <div className="pristine-invoice">
                <div className="inv-badge">SOVEREIGN PRO</div>
                
                <div className="inv-header">
                  <TauzeLogo size={24} />
                  <div className="inv-title">
                    <strong>Orçamento Pro-Forma</strong>
                    <span>tauze.intelligence.v6.0</span>
                  </div>
                </div>

                <div className="inv-divider"></div>

                <div className="inv-lines">
                  {includePecuaria && (
                    <div className="inv-line">
                      <span>Pecuária RFID Core</span>
                      <strong>R$ 390 / mês</strong>
                    </div>
                  )}
                  {includeFrotas && (
                    <div className="inv-line">
                      <span>Telemetria Offline-First</span>
                      <strong>R$ 290 / mês</strong>
                    </div>
                  )}
                  {includeHedge && (
                    <div className="inv-line">
                      <span>Hedge & Blindagem B3</span>
                      <strong>R$ 490 / mês</strong>
                    </div>
                  )}
                  {includePecuaria && scaleSurcharge > 0 && (
                    <div className="inv-line">
                      <span>Escala Rebanho ({herdScale} cab)</span>
                      <strong>R$ {scaleSurcharge} / mês</strong>
                    </div>
                  )}
                  <div className="inv-line">
                    <span>{userLicenses} Licenças de Acesso</span>
                    <strong>R$ {licenseSurcharge} / mês</strong>
                  </div>

                  {selectedCount >= 2 && (
                    <div className="inv-line discount text-emerald">
                      <span>Desconto Múltiplos Módulos ({selectedCount === 3 ? '20%' : '10%'})</span>
                      <strong>- R$ {Math.round(subtotal * (selectedCount === 3 ? 0.2 : 0.1))} / mês</strong>
                    </div>
                  )}
                </div>

                <div className="inv-divider"></div>

                <div className="inv-totals">
                  <div className="inv-total-row">
                    <span>Valor Estimado</span>
                    <strong className="text-emerald">R$ {finalPrice.toLocaleString()}<span className="mo">/mês</span></strong>
                  </div>

                  <div className="roi-alert-card">
                    <span className="lbl">ECONOMIA ANUAL ASSEGURADA</span>
                    <strong className="text-emerald">R$ {estimatedSavings.toLocaleString()} / ano</strong>
                    <span className="desc">Estimativa de redução de perdas de refugo, pesagem e eficiência logística de frotas.</span>
                  </div>
                </div>

                <a href="#hero-stage" className="btn-invoice-action">
                  <span>Exportar Proposta Comercial PDF</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* -------------------- ELEGANT MINIMALIST FAQ -------------------- */}
      <section id="sec-faq" className="faq-editorial-section">
        <div className="faq-container">
          <div className="faq-header">
            <span className="pillar-num text-center">06 // TRANSPARÊNCIA</span>
            <h2>Perguntas Frequentes</h2>
            <p className="lead-para text-center">Entenda a arquitetura técnica, segurança e termos de governança contábil do tauze.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "Como o sistema opera sem sinal de celular no curral ou lavoura?",
                a: "A telemetria do tauze é baseada em uma arquitetura local offline-first. As antenas RFID de bebedouros e sensores instalados nos maquinários processam e salvam os dados localmente de forma encriptada. A sincronização com a nuvem dedicada ocorre de forma automática por rádio Lora de longo alcance assim que o gateway detecta sinal."
              },
              {
                q: "Como é garantido o isolamento físico de bancos de dados?",
                a: "Diferente de sistemas multitenant em nuvem convencionais que dividem o mesmo banco de dados com tabelas indexadas, nós alocamos instâncias de bancos de dados e pools de segurança totalmente isolados por cliente. Seus dados nunca compartilham memória física ou conexões comuns."
              },
              {
                q: "A equipe técnica do tauze cuida da instalação física?",
                a: "Sim. A nossa engenharia e parceiros homologados efetuam toda a análise de topografia da fazenda, instalação física de balanças e portais Bluetooth/RFID, bem como a calibração de sensores de frota local."
              },
              {
                q: "O sistema se integra nativamente com ERPs contábeis e de gestão?",
                a: "Sim. Homologamos e integramos nativamente todas as entradas de dados de produção e pesagem física diretamente com SAP Business One, TOTVS e outros ERPs corporativos agrícolas locais via chamadas RFC e APIs."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className={`faq-accordion-item ${faqOpen === index ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              >
                <div className="faq-acc-trigger">
                  <span>{faq.q}</span>
                  <ChevronDown size={14} className="faq-arrow-icon" />
                </div>
                <div className="faq-acc-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- MINIMALIST FOOTER -------------------- */}
      <footer className="footer-elegant">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <TauzeLogo size={24} />
              <span className="brand-name">tauze</span>
            </div>
            <p>Plataforma dedicada de inteligência e governança física e digital agropecuária.</p>
          </div>

          <div className="footer-links">
            <div className="footer-col">
              <h4>Módulos</h4>
              <a href="#sec-features">Pecuária RFID</a>
              <a href="#sec-features">Telemetria Campo</a>
              <a href="#sec-features">Travamento B3</a>
            </div>
            <div className="footer-col">
              <h4>Privacidade</h4>
              <a href="#sec-features">Isolamento Criptográfico</a>
              <a href="#sec-features">Termos de Uso</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania e Integridade Garantidas.</p>
        </div>
      </footer>

      {/* -------------------- EMBEDDED DESIGN SYSTEM (QUIET LUXURY) -------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-minimal-canvas {
          --bg-canvas: #ffffff;          /* Pristine absolute white canvas */
          --bg-panel: #fcfcfc;           /* Light sand-white card panel */
          --border-light: #eeeeee;       /* Super thin paper borders */
          --accent: #00b865;             /* Signature brand vibrant emerald */
          --accent-light: rgba(0, 184, 101, 0.03);
          --accent-border: rgba(0, 184, 101, 0.08);
          --text-main: #111111;          /* Pure slate obsidian charcoal text */
          --text-muted: #6e6e66;         /* Sophisticated clean grey readability */
          --shadow-premium: 0 10px 30px rgba(0, 0, 0, 0.015);

          background: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          scroll-behavior: smooth;
        }

        /* --- STATS TICKER --- */
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
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .ticker-scroll-wrapper {
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .ticker-scroll-content {
          display: flex;
          animation: infiniteMarquee 34s linear infinite;
        }

        @keyframes infiniteMarquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          margin-right: 64px;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.75);
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

        /* --- NAVBAR QUIET --- */
        .navbar-elegant {
          position: fixed;
          top: 38px;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 84px;
          display: flex;
          align-items: center;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          border-bottom: 1px solid transparent;
        }

        .navbar-elegant.scrolled {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          height: 72px;
          border-bottom-color: var(--border-light);
          box-shadow: var(--shadow-premium);
        }

        .navbar-container {
          max-width: 1100px;
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
          gap: 10px;
        }

        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.45rem;
          letter-spacing: -0.04em;
          text-transform: lowercase;
          color: var(--text-main);
        }

        .navbar-links-group {
          display: flex;
          gap: 32px;
        }

        .navbar-links-group a {
          font-size: 0.85rem;
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
          background: transparent;
          border: 1px solid var(--text-main);
          color: var(--text-main);
          padding: 8px 16px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-terminal-sec:hover {
          background: var(--text-main);
          color: #ffffff;
          transform: translateY(-1px);
        }

        /* --- HERO STAGE --- */
        .hero-editorial-stage {
          padding: 220px 24px 80px 24px;
          text-align: center;
          max-width: 820px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .hero-badge-tag {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 900;
          letter-spacing: 0.18em;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .hero-main-title {
          font-family: 'Lora', serif;
          font-size: 4.8rem;
          font-weight: 400;
          line-height: 1.08;
          letter-spacing: -0.04em;
          color: var(--text-main);
          margin-bottom: 24px;
        }

        .hero-main-desc {
          font-size: 1.15rem;
          color: var(--text-muted);
          line-height: 1.55;
          max-width: 580px;
          margin-bottom: 38px;
        }

        .hero-actions-container {
          display: flex;
          gap: 14px;
          margin-bottom: 80px;
        }

        .btn-primary-editorial {
          background: var(--text-main);
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.25s;
          border: 1px solid var(--text-main);
        }

        .btn-primary-editorial:hover {
          background: #000000;
          transform: translateY(-1.5px);
        }

        .btn-secondary-editorial {
          background: hsl(var(--bg-card));
          color: var(--text-main);
          border: 1px solid var(--border-light);
          padding: 14px 24px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }

        .btn-secondary-editorial:hover {
          background: #f7f7f5;
          border-color: #d1d1cc;
        }

        /* --- HERO APP SHOWCASE CANVAS --- */
        .hero-showcase-canvas {
          width: 100%;
          max-width: 820px;
          margin-top: 20px;
          border-radius: 16px;
          background: hsl(var(--bg-card));
          padding: 12px;
          border: 1px solid var(--border-light);
          box-shadow: 0 30px 60px rgba(0,0,0,0.015);
        }

        .showcase-frame {
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: hsl(var(--bg-card));
          overflow: hidden;
        }

        .showcase-header {
          height: 38px;
          background: #fcfcfc;
          border-bottom: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          padding: 0 16px;
          position: relative;
        }

        .circle-dots {
          display: flex;
          gap: 6px;
        }

        .circle-dots span {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #e2e2df;
        }

        .showcase-url {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          font-family: monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .showcase-body {
          display: flex;
          height: 240px;
        }

        .mock-sidebar {
          width: 48px;
          border-right: 1px solid var(--border-light);
          padding: 12px 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          background: #fcfcfc;
        }

        .mock-nav-item {
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: #eeeeee;
        }

        .mock-nav-item.active {
          background: var(--accent-light);
          border: 1.5px solid var(--accent);
        }

        .mock-content {
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: hsl(var(--bg-card));
        }

        .mock-kpi-row {
          display: flex;
          gap: 16px;
        }

        .mock-kpi-card {
          flex: 1;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 8px;
          text-align: left;
        }

        .mock-kpi-card .lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          margin-bottom: 4px;
          display: block;
        }

        .mock-kpi-card strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 900;
        }

        .mock-main-chart {
          border: 1px solid var(--border-light);
          border-radius: 8px;
          height: 90px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          overflow: hidden;
        }

        .mock-svg-spline {
          width: 100%;
          height: 100%;
        }

        /* --- ASYMMETRICAL EDITORIAL FEATURE BLOCKS --- */
        .editorial-features-section {
          max-width: 1000px;
          margin: 0 auto;
          padding: 100px 24px;
        }

        .feature-block-editorial {
          display: flex;
          align-items: center;
          gap: 80px;
          padding: 80px 0;
          border-bottom: 1px solid var(--border-light);
        }

        .feature-block-editorial.reverse {
          flex-direction: row-reverse;
        }

        .feature-text-pane {
          flex: 1.1;
          text-align: left;
        }

        .pillar-num {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 900;
          color: var(--accent);
          letter-spacing: 0.2em;
          display: block;
          margin-bottom: 16px;
        }

        .feature-text-pane h2 {
          font-family: 'Lora', serif;
          font-size: 2.5rem;
          font-weight: 400;
          letter-spacing: -0.03em;
          margin-bottom: 18px;
          line-height: 1.15;
        }

        .lead-para {
          font-size: 1.08rem;
          line-height: 1.5;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .sub-para {
          font-size: 0.92rem;
          line-height: 1.55;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .minimal-check-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .minimal-check-list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.88rem;
          font-weight: 500;
          color: var(--text-main);
        }

        .feature-visual-pane {
          flex: 0.9;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Abstract Safety concentric circles */
        .abstract-safety-circles {
          width: 260px;
          height: 260px;
          border: 1px solid var(--border-light);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          background: hsl(var(--bg-card));
        }

        .safety-svg {
          width: 100%;
          height: 100%;
        }

        .spin-slow {
          animation: spinOrbit 24s linear infinite;
        }
        @keyframes spinOrbit {
          0% { transform: rotate(0deg); transform-origin: center; }
          100% { transform: rotate(360deg); transform-origin: center; }
        }

        .lock-icon-minimal {
          color: var(--text-main);
          margin: 10px;
        }

        .visual-badge {
          position: absolute;
          bottom: 16px;
          background: var(--text-main);
          color: #ffffff;
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          padding: 4px 10px;
          border-radius: 100px;
        }

        .visual-badge.bottom-left {
          bottom: 16px;
          left: 16px;
        }

        /* Clean Spline weight chart visual */
        .minimal-chart-card {
          width: 100%;
          max-width: 320px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-premium);
        }

        .chart-card-header {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 850;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .chart-body-box {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clean-spline-svg {
          width: 100%;
          height: 100%;
        }

        .chart-card-footer {
          border-top: 1px solid var(--border-light);
          padding-top: 12px;
          display: flex;
          justify-content: space-between;
        }

        .footer-stat {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .footer-stat span {
          font-size: 0.58rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .footer-stat strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 800;
        }

        .pulse-slow {
          animation: heartbeat 2s ease-in-out infinite;
        }
        @keyframes heartbeat {
          0% { transform: scale(1); transform-origin: center; }
          50% { transform: scale(1.15); transform-origin: center; }
          100% { transform: scale(1); transform-origin: center; }
        }

        /* Dotted topographical GPS map visual */
        .abstract-fleet-map {
          width: 280px;
          height: 180px;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          background: hsl(var(--bg-card));
          position: relative;
          overflow: hidden;
        }

        .fleet-map-svg {
          width: 100%;
          height: 100%;
        }

        /* Minimal Candlestick hedge visual */
        .minimal-hedge-card {
          width: 100%;
          max-width: 320px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-premium);
        }

        .hedge-card-header {
          display: flex;
          justify-content: space-between;
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 850;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 10px;
          margin-bottom: 12px;
        }

        .hedge-chart-box {
          height: 100px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .clean-hedge-svg {
          width: 100%;
          height: 100%;
        }

        /* --- CONFIGURADOR SECTION --- */
        .minimalist-configurator-section {
          border-top: 1px solid var(--border-light);
          padding: 100px 24px;
        }

        .config-container {
          max-width: 1100px;
          margin: 0 auto;
        }

        .config-header {
          margin-bottom: 60px;
        }

        .config-split-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 64px;
        }

        .config-controls-box {
          display: flex;
          flex-direction: column;
          gap: 32px;
          text-align: left;
        }

        .config-group {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .config-lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 900;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .toggles-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .toggle-card {
          display: flex;
          align-items: center;
          gap: 14px;
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          padding: 14px 18px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .toggle-card input {
          width: 14px;
          height: 14px;
          accent-color: var(--accent);
          cursor: pointer;
        }

        .toggle-card.active {
          background: var(--accent-light);
          border-color: var(--accent);
        }

        .toggle-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .toggle-info strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
        }

        .toggle-info span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .slider-header-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .clean-slider {
          -webkit-appearance: none;
          width: 100%;
          height: 2px;
          background: var(--border-light);
          outline: none;
          margin: 8px 0;
        }

        .clean-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--text-main);
          cursor: pointer;
          transition: transform 0.1s;
        }

        .clean-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }

        .slider-limits {
          display: flex;
          justify-content: space-between;
          font-size: 0.65rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        /* Clean Pristine paper contract invoice */
        .config-invoice-box {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pristine-invoice {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 32px;
          width: 100%;
          max-width: 380px;
          box-shadow: var(--shadow-premium);
          display: flex;
          flex-direction: column;
          gap: 20px;
          position: relative;
        }

        .inv-badge {
          position: absolute;
          top: 24px;
          right: 32px;
          border: 1px solid var(--text-main);
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          padding: 2px 8px;
          border-radius: 3px;
          letter-spacing: 0.05em;
        }

        .inv-header {
          display: flex;
          align-items: center;
          gap: 12px;
          text-align: left;
        }

        .inv-title strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 850;
          display: block;
        }

        .inv-title span {
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        .inv-divider {
          height: 1px;
          border-top: 1px solid var(--border-light);
        }

        .inv-lines {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .inv-line {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .inv-line strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .inv-totals {
          display: flex;
          flex-direction: column;
          gap: 14px;
          text-align: left;
        }

        .inv-total-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }

        .inv-total-row span {
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--text-muted);
        }

        .inv-total-row strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.65rem;
          font-weight: 900;
        }

        .inv-total-row .mo {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
        }

        .roi-alert-card {
          background: var(--bg-panel);
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .roi-alert-card .lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 900;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .roi-alert-card strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 900;
        }

        .roi-alert-card .desc {
          font-size: 0.65rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        .btn-invoice-action {
          width: 100%;
          background: var(--text-main);
          color: #ffffff;
          padding: 12px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.2s;
        }

        .btn-invoice-action:hover {
          background: #000000;
          transform: translateY(-1px);
        }

        /* --- FAQ EDITORIAL --- */
        .faq-editorial-section {
          border-top: 1px solid var(--border-light);
          padding: 100px 24px;
        }

        .faq-container {
          max-width: 720px;
          margin: 0 auto;
        }

        .faq-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .faq-accordion-item {
          background: hsl(var(--bg-card));
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 18px 24px;
          cursor: pointer;
          transition: border-color 0.2s;
          text-align: left;
        }

        .faq-accordion-item:hover {
          border-color: #d1d1cc;
        }

        .faq-acc-trigger {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 750;
          color: var(--text-main);
        }

        .faq-arrow-icon {
          color: var(--text-muted);
          transition: transform 0.25s;
        }

        .faq-accordion-item.open .faq-arrow-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-acc-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.25s ease-out;
        }

        .faq-accordion-item.open .faq-acc-content {
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
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 48px;
          padding-bottom: 48px;
        }

        .footer-brand {
          max-width: 280px;
          text-align: left;
        }

        .footer-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .footer-logo .brand-name {
          font-size: 1.35rem;
        }

        .footer-brand p {
          font-size: 0.82rem;
          color: var(--text-muted);
          line-height: 1.45;
        }

        .footer-links {
          display: flex;
          gap: 60px;
        }

        .footer-col {
          display: flex;
          flex-direction: column;
          gap: 10px;
          text-align: left;
        }

        .footer-col h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 950;
          color: var(--text-main);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 6px;
        }

        .footer-col a {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.2s;
        }

        .footer-col a:hover {
          color: var(--text-main);
        }

        .footer-bottom {
          border-top: 1px solid var(--border-light);
          max-width: 1100px;
          margin: 0 auto;
          padding-top: 24px;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-muted);
        }

        /* --- RESPONSIVE BREAKPOINTS --- */
        @media (max-width: 768px) {
          .hero-main-title {
            font-size: 3.2rem;
          }
          .hero-showcase-canvas {
            display: none; /* simplifies mobile rendering */
          }
          .feature-block-editorial {
            flex-direction: column;
            gap: 40px;
            padding: 48px 0;
          }
          .feature-block-editorial.reverse {
            flex-direction: column;
          }
          .config-split-grid {
            grid-template-columns: 1fr;
            gap: 48px;
          }
          .navbar-links-group {
            display: none;
          }
          .footer-container {
            flex-direction: column;
            gap: 32px;
          }
          .footer-links {
            gap: 40px;
          }
        }
      `}</style>

    </div>
  );
};
