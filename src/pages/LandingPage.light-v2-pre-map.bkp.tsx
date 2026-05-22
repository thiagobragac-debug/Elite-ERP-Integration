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
  Server
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
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'pecuaria' | 'frota' | 'financeiro'>('pecuaria');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    <div className={`tauze-landing light`}>
      
      {/* --- Ambient Organic Background Grid --- */}
      <div className="ambient-background">
        <div className="grid-overlay"></div>
        <div className="gradient-glow-1"></div>
        <div className="gradient-glow-2"></div>
      </div>

      {/* --- Premium Navigation --- */}
      <nav className={`noir-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo-group">
            <div className="logo-icon-wrapper">
              <TauzeLogo size={32} />
            </div>
            <div className="logo-text">
              <span className="brand">tauze</span>
              <span className="version">DIAMOND 5.0</span>
            </div>
          </div>
          
          <div className="nav-links">
            <a href="#features">Recursos</a>
            <a href="#console">Console de Campo</a>
            <a href="#pricing">Planos</a>
            <a href="#security">Segurança</a>
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

      {/* --- Hero Section: Pristine Agro-Industrial Sovereignty --- */}
      <section className="hero-section">
        <div className="container hero-grid">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <div className="badge-premium">
              <Sparkles size={12} />
              <span>Soberania Digital Agroindustrial</span>
            </div>
            
            <h1 className="hero-title">
              A inteligência digital <br/>
              <span className="gradient-text">que dita o rumo da sua terra.</span>
            </h1>
            
            <p className="hero-description">
              Mapeamento total de ativos biológicos, frotas de campo e auditoria financeira atrelada à B3. A tecnologia mais avançada e limpa do agro nacional.
            </p>
            
            <div className="hero-btns">
              <Link to="/login" className="btn-primary">
                Iniciar Operação
                <ArrowRight size={18} />
              </Link>
              <a href="#console" className="btn-secondary">
                Explorar Painel
              </a>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">+26%</span>
                <span className="stat-label">Eficiência Operacional</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">99.98%</span>
                <span className="stat-label">Nuvem Soberana</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">Zero</span>
                <span className="stat-label">Fugas de Dados</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Operations Console Mockup */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-visual"
            id="console"
          >
            <div className="console-wrapper">
              <div className="console-header">
                <div className="dots">
                  <span className="dot-c close"></span>
                  <span className="dot-c minimize"></span>
                  <span className="dot-c expand"></span>
                </div>
                <div className="title">tauze central-console</div>
                <div className="sync-badge">
                  <RefreshCw size={12} className="spin-slow" />
                  <span>Conexão Segura</span>
                </div>
              </div>

              <div className="console-tabs">
                <button 
                  onClick={() => setActiveConsoleTab('pecuaria')}
                  className={`tab-link ${activeConsoleTab === 'pecuaria' ? 'active' : ''}`}
                >
                  <Cpu size={14} /> Pecuária
                </button>
                <button 
                  onClick={() => setActiveConsoleTab('frota')}
                  className={`tab-link ${activeConsoleTab === 'frota' ? 'active' : ''}`}
                >
                  <Truck size={14} /> Frota
                </button>
                <button 
                  onClick={() => setActiveConsoleTab('financeiro')}
                  className={`tab-link ${activeConsoleTab === 'financeiro' ? 'active' : ''}`}
                >
                  <BarChart3 size={14} /> Finanças
                </button>
              </div>

              <div className="console-body">
                <AnimatePresence mode="wait">
                  {activeConsoleTab === 'pecuaria' && (
                    <motion.div 
                      key="pecuaria" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="tab-content"
                    >
                      <div className="metric-box">
                        <span className="label">Pesagem Média</span>
                        <div className="val-group">
                          <span className="value">482.4 kg</span>
                          <span className="trend-badge positive">+4.8% GMD</span>
                        </div>
                      </div>
                      <div className="progress-group">
                        <div className="progress-header">
                          <span>Meta de Abate Lote 4B</span>
                          <span className="percentage">84%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: '84%' }}></div>
                        </div>
                      </div>
                      <div className="console-logs">
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> RFID Pareamento completo</div>
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> Curva de peso estatística recalculada</div>
                      </div>
                    </motion.div>
                  )}

                  {activeConsoleTab === 'frota' && (
                    <motion.div 
                      key="frota" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="tab-content"
                    >
                      <div className="metric-box">
                        <span className="label">Consumo de Combustível</span>
                        <div className="val-group">
                          <span className="value">12.4 L/h</span>
                          <span className="trend-badge positive">-8.2% economia</span>
                        </div>
                      </div>
                      <div className="progress-group">
                        <div className="progress-header">
                          <span>Utilização de Ativos</span>
                          <span className="percentage">91%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: '91%' }}></div>
                        </div>
                      </div>
                      <div className="console-logs">
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> Telemetria de Trator John Deere OK</div>
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> Preventiva recomendada para Caminhão #4</div>
                      </div>
                    </motion.div>
                  )}

                  {activeConsoleTab === 'financeiro' && (
                    <motion.div 
                      key="financeiro" 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="tab-content"
                    >
                      <div className="metric-box">
                        <span className="label">Margem Comercial Estimada</span>
                        <div className="val-group">
                          <span className="value">34.2%</span>
                          <span className="trend-badge positive">+2.4% alta B3</span>
                        </div>
                      </div>
                      <div className="progress-group">
                        <div className="progress-header">
                          <span>Fluxo de Caixa Mensal</span>
                          <span className="percentage">R$ 1.84M</span>
                        </div>
                        <div className="progress-bar-container">
                          <div className="progress-bar-fill" style={{ width: '75%' }}></div>
                        </div>
                      </div>
                      <div className="console-logs">
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> Conciliação Bancária OFX importada</div>
                        <div className="log-line"><CheckCircle2 size={12} className="green" /> Contratos de proteção de hedge salvos</div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Bento Grid Features (Pristine Light Mosaic) --- */}
      <section className="features-mosaic-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">TECNOLOGIA DE PONTA</span>
            <h2 className="section-title">Engenharia Digital Avançada</h2>
            <p className="section-subtitle">Toda a robustez do ERP consolidada em blocos visualmente extraordinários e de alto impacto.</p>
          </div>

          <div className="bento-grid">
            <div className="bento-item item-large">
              <div className="bento-content">
                <div className="bento-header">
                  <TrendingUp className="bento-icon" />
                  <h4>Estatística de Engorda e GMD</h4>
                </div>
                <p>Nossos algoritmos biológicos cruzam o ganho médio diário de peso com dados nutricionais e de campo para prever com 98% de acerto a data do abate ótimo.</p>
                
                <div className="chart-preview">
                  <div className="chart-bars">
                    {[40, 58, 48, 70, 62, 85, 78, 95].map((h, i) => (
                      <div key={i} className="bar" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-item item-medium">
              <div className="bento-content">
                <div className="bento-header">
                  <Activity className="bento-icon" />
                  <h4>Conectividade no Campo</h4>
                </div>
                <p>Mantenha-se online e conectado às balanças de campo mais comuns e sensores agrícolas mesmo com flutuações de sinal local.</p>
                <div className="signal-badge">
                  <div className="pulse-dot"></div>
                  <span className="val">98.9%</span>
                  <span className="lbl">Estabilidade de Barramento</span>
                </div>
              </div>
            </div>

            <div className="bento-item item-small">
              <div className="bento-content centered">
                <Cloud className="bento-icon large" />
                <h4>Híbrido e Seguro</h4>
                <p>Dados salvos localmente e sincronizados de forma segura na nuvem.</p>
              </div>
            </div>

            <div className="bento-item item-small">
              <div className="bento-content centered">
                <Smartphone className="bento-icon large" />
                <h4>Aplicativo Móvel</h4>
                <p>Manejos operacionais de rebanho e frotas direto no celular.</p>
              </div>
            </div>

            <div className="bento-item item-wide">
              <div className="bento-content">
                <div className="bento-header">
                  <Lock className="bento-icon" />
                  <h4>Segurança e Blindagem Multi-tenant</h4>
                </div>
                <div className="shield-block">
                  <div className="shield-icon"><ShieldCheck size={36} /></div>
                  <div className="shield-text">
                    <strong>Isolamento de Base Nível Militar (AES-256)</strong>
                    <p>Suas fazendas operam em partições computacionais totalmente independentes das outras marcas do mercado.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Dynamic Pricing Section --- */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">INVESTIMENTO</span>
            <h2 className="section-title">Planos Transparentes e Escaláveis</h2>
            <p className="section-subtitle">Escolha o plano ideal para governar e expandir sua marca com total segurança de dados.</p>
            
            <div className="toggle-container">
              <span className={`toggle-txt ${billingCycle === 'monthly' ? 'active' : ''}`}>Mensal</span>
              <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className={`billing-toggle ${billingCycle === 'yearly' ? 'active' : ''}`}
                aria-label="Alternar Faturamento"
              >
                <span className="knob"></span>
              </button>
              <span className={`toggle-txt ${billingCycle === 'yearly' ? 'active' : ''}`}>
                Anual <span className="save-badge">Salvar 20%</span>
              </span>
            </div>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => {
              const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const periodText = billingCycle === 'monthly' ? '/mês' : '/ano';
              
              return (
                <motion.div 
                  key={index}
                  whileHover={{ y: -6 }}
                  className={`pricing-card ${plan.popular ? 'glowing' : ''}`}
                >
                  {plan.popular && <div className="popular-badge">Mais Escolhido</div>}
                  <div className="card-top">
                    <h3>{plan.name}</h3>
                    <p className="desc">{plan.description}</p>
                    <div className="price-wrap">
                      <span className="curr">R$</span>
                      <span className="price">{displayPrice.toLocaleString('pt-BR')}</span>
                      <span className="period">{periodText}</span>
                    </div>
                  </div>

                  <div className="card-middle">
                    <div className="middle-title">O que está incluso:</div>
                    <div className="feats">
                      {plan.features.map((feat: string, i: number) => (
                        <div key={i} className="feat-item">
                          <Check size={16} className="check-icon" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-bottom">
                    <Link to="/login" className={`cta-btn ${plan.popular ? 'primary' : 'secondary'}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Elegant Light Shield Banner --- */}
      <section className="security-banner" id="security">
        <div className="container">
          <div className="security-box">
            <div className="visual-block">
              <Server size={72} className="server-icon" />
              <div className="lock-badge"><Lock size={20} /></div>
            </div>
            <div className="text-block">
              <h2>Nuvem Soberana e Criptografia Híbrida</h2>
              <p>O Tauze ERP opera sob a arquitetura de **Nuvem Soberana**, o que significa que seus dados biológicos e financeiros nunca são compartilhados ou armazenados em pools públicos. Cada produtor conta com isolamento e criptografia exclusivos.</p>
              <div className="certs">
                <span className="badge">AES-256</span>
                <span className="badge">NUVEM LOCAL</span>
                <span className="badge">CONFORMIDADE ISO</span>
                <span className="badge">100% AUDITÁVEL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- High Contrast Light FAQ Accordion --- */}
      <section className="faq-section" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">DÚVIDAS</span>
            <h2 className="section-title">Perguntas Frequentes</h2>
            <p className="section-subtitle">Tudo o que você precisa saber sobre o ecossistema digital da tauze.</p>
          </div>

          <div className="faq-list">
            {[
              {
                q: "O sistema opera de forma offline no campo?",
                a: "Com certeza. O aplicativo sincroniza localmente os cadastros de rebanho, pesagens e frotas de combustível. Assim que o dispositivo móvel se conecta a qualquer rede (Wi-Fi ou 4G), os dados são transmitidos automaticamente de forma segura."
              },
              {
                q: "O que é o conceito de Nuvem Soberana no agro?",
                a: "Enquanto outros softwares utilizam bases de dados integradas compartilhadas por centenas de marcas, a tauze entrega ambientes de banco de dados virtualmente isolados para cada produtor, garantindo que suas margens comerciais fiquem totalmente blindadas."
              },
              {
                q: "Consigo integrar com minhas balanças de curral?",
                a: "Sim. Oferecemos drivers de conexão nativos e pareamento Bluetooth direto com as marcas de balanças e bastões RFID mais comuns do mercado brasileiro."
              },
              {
                q: "Como o hedge de boi gordo B3 é calculado?",
                a: "Nossa IA cruza a curva de ganho de peso do seu rebanho e o histórico financeiro com a tabela de cotação futura de boi gordo da B3, prevendo o melhor período financeiro para fechamento ou venda."
              }
            ].map((item, idx) => (
              <div 
                key={idx} 
                className={`faq-item ${faqOpen === idx ? 'open' : ''}`}
                onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
              >
                <div className="faq-question">
                  <span>{item.q}</span>
                  <ChevronDown size={18} className="chevron" />
                </div>
                <AnimatePresence>
                  {faqOpen === idx && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="faq-answer"
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
      <footer className="light-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo-group">
              <TauzeLogo size={36} />
              <span className="brand">tauze</span>
            </div>
            <p>Governança agroindustrial analítica e soberana por trás dos maiores produtores de ativos biológicos.</p>
          </div>
          <div className="footer-links">
            <div className="col">
              <h5>Tecnologia</h5>
              <a href="#features">Precisão Pecuária</a>
              <a href="#features">Telemetria de Frotas</a>
              <a href="#features">Hedge Financeiro B3</a>
            </div>
            <div className="col">
              <h5>Empresa</h5>
              <a href="#security">Nuvem Soberana</a>
              <a href="#security">AES-256</a>
              <a href="/login">Acessar Terminal</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania Operacional Garantida.</p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap');

        .tauze-landing {
          --bg-primary: #ffffff;
          --bg-secondary: #f3f8f5;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --accent: #00b865;
          --accent-glow: rgba(0, 184, 101, 0.06);
          --accent-border: rgba(0, 184, 101, 0.12);
          --border-color: rgba(0, 0, 0, 0.05);
          --card-bg: rgba(255, 255, 255, 0.85);
          --nav-bg: rgba(255, 255, 255, 0.8);
          --shadow-color: rgba(0, 184, 101, 0.04);
          --btn-sec-bg: #e2e8f0;
          --btn-sec-border: transparent;

          background: var(--bg-primary);
          color: var(--text-primary);
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
          background: linear-gradient(to right, var(--accent), #10b981, var(--accent));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine-text 5s linear infinite;
        }

        @keyframes shine-text {
          to { background-position: 200% center; }
        }

        /* --- Ambient Background --- */
        .ambient-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 184, 101, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 184, 101, 0.04) 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.8;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
        }

        .gradient-glow-1 {
          position: absolute;
          top: -15%;
          right: -10%;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.05) 0%, transparent 70%);
          filter: blur(80px);
        }

        .gradient-glow-2 {
          position: absolute;
          bottom: 10%;
          left: -15%;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.04) 0%, transparent 70%);
          filter: blur(80px);
        }

        /* --- Navbar --- */
        .noir-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 90px;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .noir-nav.scrolled {
          background: var(--nav-bg);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 72px;
          border-bottom: 1px solid var(--border-color);
          box-shadow: 0 4px 30px rgba(0, 184, 101, 0.03);
        }

        .nav-container {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 24px;
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
          font-size: 1.5rem;
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
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--accent);
          letter-spacing: 0.08em;
          margin-top: 2px;
        }

        .nav-links {
          display: flex;
          gap: 32px;
        }

        .nav-links a {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.3s;
        }

        .nav-links a:hover {
          color: var(--text-primary);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-terminal {
          background: var(--text-primary);
          color: #ffffff;
          padding: 10px 18px;
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
          padding: 180px 0 100px;
          position: relative;
          z-index: 1;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.15fr 0.85fr;
          gap: 64px;
          align-items: center;
        }

        .badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: var(--accent-glow);
          border: 1px solid var(--accent-border);
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--accent);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 24px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 4.8rem;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.04em;
          margin-bottom: 24px;
        }

        .hero-description {
          font-size: 1.2rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 40px;
          max-width: 520px;
        }

        .hero-btns {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 56px;
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
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 184, 101, 0.35);
        }

        .btn-secondary {
          background: #ffffff;
          color: var(--text-primary);
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
          background: #f8fafc;
          border-color: rgba(0, 0, 0, 0.15);
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 32px;
          padding-top: 36px;
          border-top: 1px solid var(--border-color);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.02em;
        }

        .stat-divider {
          width: 1px;
          height: 36px;
          background: var(--border-color);
        }

        /* --- Interactive Light Console --- */
        .console-wrapper {
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid var(--accent-border);
          border-radius: 24px;
          box-shadow: 0 30px 60px rgba(0, 184, 101, 0.06), 0 1px 3px rgba(0, 0, 0, 0.02);
          overflow: hidden;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .console-header {
          background: #f8fafc;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }

        .dots {
          display: flex;
          gap: 6px;
        }

        .dot-c {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-c.close { background: #ff5f56; }
        .dot-c.minimize { background: #ffbd2e; }
        .dot-c.expand { background: #27c93f; }

        .title {
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .sync-badge {
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

        .console-tabs {
          display: flex;
          background: #f1f5f9;
          border-bottom: 1px solid var(--border-color);
        }

        .tab-link {
          flex: 1;
          padding: 14px;
          background: transparent;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-secondary);
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: all 0.3s;
        }

        .tab-link:hover {
          color: var(--text-primary);
        }

        .tab-link.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          background: #ffffff;
        }

        .console-body {
          padding: 28px;
          min-height: 240px;
        }

        .metric-box {
          margin-bottom: 24px;
        }

        .metric-box .label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .metric-box .val-group {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-top: 4px;
        }

        .metric-box .value {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 900;
        }

        .trend-badge {
          font-size: 0.75rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 100px;
        }

        .trend-badge.positive {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
        }

        .progress-group {
          margin-bottom: 24px;
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 6px;
        }

        .progress-bar-container {
          height: 8px;
          background: #e2e8f0;
          border-radius: 100px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--accent);
          border-radius: 100px;
        }

        .console-logs {
          border-top: 1px solid var(--border-color);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .log-line {
          font-size: 0.8rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 500;
        }

        .log-line svg.green {
          color: var(--accent);
        }

        /* --- Bento Grid --- */
        .features-mosaic-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .section-header {
          text-align: center;
          margin-bottom: 72px;
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
          font-size: 3.2rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          font-size: 1.1rem;
          color: var(--text-secondary);
          margin-top: 12px;
          max-width: 600px;
          margin-inline: auto;
        }

        .bento-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          grid-auto-rows: 240px;
          gap: 24px;
        }

        .bento-item {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 32px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px var(--shadow-color);
          overflow: hidden;
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .bento-item:hover {
          transform: translateY(-4px);
          border-color: var(--accent-border);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.08);
        }

        .item-large { grid-column: span 2; grid-row: span 2; }
        .item-medium { grid-column: span 2; grid-row: span 1; }
        .item-small { grid-column: span 1; grid-row: span 1; }
        .item-wide { grid-column: span 2; grid-row: span 1; }

        .bento-content {
          height: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .bento-content.centered {
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .bento-header {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .bento-icon {
          color: var(--accent);
        }

        .bento-icon.large {
          width: 44px;
          height: 44px;
          margin-bottom: 12px;
        }

        .bento-content h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.25rem;
          font-weight: 800;
        }

        .bento-content p {
          font-size: 0.9rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }

        /* Bento elements */
        .chart-preview {
          flex-grow: 1;
          background: rgba(0, 184, 101, 0.02);
          border-radius: 16px;
          display: flex;
          align-items: flex-end;
          padding: 20px;
          border: 1px solid var(--accent-border);
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          width: 100%;
          height: 100px;
        }

        .bar {
          flex: 1;
          background: linear-gradient(to top, var(--accent), #4ade80);
          border-radius: 4px;
        }

        .signal-badge {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 16px;
          border: 1px solid var(--border-color);
          margin-top: auto;
        }

        .pulse-dot {
          width: 10px;
          height: 10px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow: 0 0 0 4px var(--accent-glow);
          animation: pulse-ring 2s infinite;
        }

        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }

        .signal-badge .val {
          font-size: 1.3rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .signal-badge .lbl {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .shield-block {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: rgba(0, 184, 101, 0.03);
          border: 1px solid var(--accent-border);
          border-radius: 16px;
        }

        .shield-icon {
          color: var(--accent);
        }

        .shield-text strong {
          display: block;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .shield-text p {
          margin: 0;
          font-size: 0.8rem;
        }

        /* --- Pricing Section --- */
        .pricing-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .toggle-container {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 6px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 100px;
          margin-top: 24px;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.02);
        }

        .toggle-txt {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          transition: color 0.3s;
        }

        .toggle-txt.active {
          color: var(--text-primary);
        }

        .save-badge {
          font-size: 0.7rem;
          font-weight: 800;
          color: #ffffff;
          background: var(--accent);
          padding: 3px 8px;
          border-radius: 100px;
          margin-left: 4px;
        }

        .billing-toggle {
          width: 48px;
          height: 24px;
          border-radius: 100px;
          background: #e2e8f0;
          border: none;
          cursor: pointer;
          position: relative;
          transition: all 0.3s;
          padding: 2px;
        }

        .billing-toggle.active {
          background: var(--accent);
        }

        .knob {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          transition: transform 0.3s;
        }

        .billing-toggle.active .knob {
          transform: translateX(24px);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 56px;
          align-items: stretch;
        }

        .pricing-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 28px;
          padding: 44px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .pricing-card:hover {
          transform: translateY(-6px);
          border-color: var(--accent-border);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.08);
        }

        .pricing-card.glowing {
          border-color: var(--accent);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.12);
        }

        .popular-badge {
          position: absolute;
          top: 20px;
          right: 20px;
          background: var(--accent);
          color: white;
          padding: 6px 14px;
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .card-top h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .card-top .desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 28px;
          min-height: 3em;
        }

        .price-wrap {
          display: flex;
          align-items: baseline;
          margin-bottom: 32px;
        }

        .price-wrap .curr {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .price-wrap .price {
          font-family: 'Outfit', sans-serif;
          font-size: 3.4rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .price-wrap .period {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-left: 4px;
        }

        .card-middle {
          flex-grow: 1;
        }

        .middle-title {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .feats {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .feat-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .check-icon {
          color: var(--accent);
          flex-shrink: 0;
        }

        .cta-btn {
          display: block;
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-btn.primary {
          background: var(--accent);
          color: #ffffff;
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.15);
        }

        .cta-btn.primary:hover {
          background: #009953;
          transform: translateY(-2px);
        }

        .cta-btn.secondary {
          background: #ffffff;
          color: var(--text-primary);
          border: 1px solid rgba(0, 0, 0, 0.08);
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
        }

        .cta-btn.secondary:hover {
          background: #f8fafc;
          border-color: rgba(0, 0, 0, 0.15);
          transform: translateY(-2px);
        }

        /* --- Security Banner --- */
        .security-banner {
          padding: 80px 0;
          position: relative;
          z-index: 1;
        }

        .security-box {
          background: linear-gradient(135deg, rgba(0, 184, 101, 0.02) 0%, rgba(255, 255, 255, 0.8) 100%);
          border: 1px solid var(--border-color);
          border-radius: 36px;
          padding: 64px;
          display: flex;
          align-items: center;
          gap: 64px;
          box-shadow: 0 20px 50px rgba(0, 184, 101, 0.02);
        }

        .visual-block {
          position: relative;
          flex-shrink: 0;
        }

        .server-icon {
          color: rgba(0, 184, 101, 0.15);
        }

        .lock-badge {
          position: absolute;
          bottom: -10px;
          right: -10px;
          background: var(--accent);
          color: white;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.2);
        }

        .text-block h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .text-block p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 680px;
        }

        .certs {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .certs .badge {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-secondary);
          padding: 6px 14px;
          background: #ffffff;
          border: 1px solid var(--border-color);
          border-radius: 6px;
          letter-spacing: 0.05em;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.01);
        }

        /* --- FAQ Accordion --- */
        .faq-section {
          padding: 100px 0;
          position: relative;
          z-index: 1;
        }

        .faq-list {
          max-width: 800px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .faq-item {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.01);
        }

        .faq-item:hover {
          border-color: var(--accent-border);
        }

        .faq-question {
          padding: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .faq-question .chevron {
          transition: transform 0.3s;
          color: var(--text-secondary);
        }

        .faq-item.open .faq-question .chevron {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-answer {
          padding: 0 24px 24px;
          color: var(--text-secondary);
          font-size: 0.95rem;
          line-height: 1.6;
        }

        /* --- Footer --- */
        .light-footer {
          padding: 80px 0 0;
          border-top: 1px solid var(--border-color);
          background: #ffffff;
          position: relative;
          z-index: 1;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 64px;
          margin-bottom: 64px;
        }

        .footer-brand p {
          color: var(--text-secondary);
          margin-top: 16px;
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
          color: var(--text-primary);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .footer-links .col a {
          display: block;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 10px;
          font-size: 0.9rem;
          transition: color 0.3s;
        }

        .footer-links .col a:hover {
          color: var(--text-primary);
        }

        .footer-bottom {
          padding: 32px 0;
          border-top: 1px solid var(--border-color);
          text-align: center;
          color: var(--text-secondary);
          font-size: 0.8rem;
        }

        /* --- Responsive Queries --- */
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-description { margin-inline: auto; }
          .hero-btns { justify-content: center; }
          .hero-stats { justify-content: center; }
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .item-large, .item-medium, .item-small, .item-wide { grid-column: span 2; grid-row: auto; }
          .nav-links { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
          .security-box { flex-direction: column; text-align: center; }
          .footer-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 3rem; }
          .section-title { font-size: 2.2rem; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
