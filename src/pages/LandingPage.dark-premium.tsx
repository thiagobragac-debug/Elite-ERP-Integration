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
  const [activeTerminalTab, setActiveTerminalTab] = useState<'telemetria' | 'b3' | 'ia'>('telemetria');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [activeEcosystemTab, setActiveEcosystemTab] = useState<'bovinocultura' | 'frota' | 'financeiro'>('bovinocultura');

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
            yearlyPrice: Math.round(p.price * 12 * 0.8), // 20% de desconto anual
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

  // Textos para simulação do terminal interativo
  const terminalScripts = {
    telemetria: [
      '$ tauze io-status --device all',
      '[INFO] Buscando barramento IoT em tempo real...',
      '[OK] Balança Curral #1: 542.4 kg (sincronizada)',
      '[OK] Alimentador Silo #A: 94% capacidade',
      '[OK] Sensor Umidade Solo Pasto #2: 42% (ótimo)',
      '[OK] Telemetria Trator JD-8370: 1,840 RPM - Transmissão OK',
      '[OK] 1,480 sensores RFID sincronizados na nuvem soberana.'
    ],
    b3: [
      '$ tauze b3-calc --contrato BGI --previsao',
      '[INFO] Consultando cotação boi gordo B3 em tempo real...',
      '[BGIK26] Cotação Atual: R$ 342.50 / @',
      '[BGIQ26] Cotação Futura (Ago/26): R$ 348.80 / @',
      '[INFO] Analisando sazonalidade histórica (12 anos)...',
      '[PREVISÃO] Forte tendência de alta para o terceiro trimestre.',
      '[ANÁLISE] Margem operacional líquida projetada: R$ 428.10 / animal.'
    ],
    ia: [
      '$ tauze ai-biometrics --id animal_9981 --scan',
      '[IA] Inicializando escaneamento biométrico de focinho...',
      '[SCAN] Face do animal detectada e mapeada em 3D.',
      '[MODELO] Analisando histórico de ganho de peso diário...',
      '[RESULTADO] GMD Atual: 1.280 kg/dia (Acima da média do lote)',
      '[PREDIÇÃO] Data estimada para abate ótimo: 14 dias',
      '[AÇÃO] Ajuste nutricional automatizado aplicado ao pasto #4B.'
    ]
  };

  // Efeito para digitar as linhas no terminal
  useEffect(() => {
    setIsTyping(true);
    setTerminalOutput([]);
    let currentLine = 0;
    const lines = terminalScripts[activeTerminalTab];

    const typeInterval = setInterval(() => {
      if (currentLine < lines.length) {
        setTerminalOutput(prev => [...prev, lines[currentLine]]);
        currentLine++;
      } else {
        clearInterval(typeInterval);
        setIsTyping(false);
      }
    }, 450);

    return () => clearInterval(typeInterval);
  }, [activeTerminalTab]);

  return (
    <div className={`tauze-landing ${theme}`}>
      
      {/* --- Ambient Background Glows --- */}
      <div className="ambient-background">
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>
        <div className="grid-line-overlay"></div>
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
            <a href="#ecosystem">Ecossistema</a>
            <a href="#pricing">Planos</a>
            <a href="#security">Segurança</a>
            <a href="#faq">FAQ</a>
          </div>

          <div className="nav-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Alternar Tema">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn-terminal">
              <Terminal size={14} />
              <span>Acessar Terminal</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section: The Global Command Center --- */}
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
              Onde a terra encontra <br/>
              <span className="gradient-text">a inteligência analítica.</span>
            </h1>
            
            <p className="hero-description">
              A plataforma definitiva para controle de ativos operacionais, biológicos e financeiros. 
              Inteligência preditiva B3, telemetria unificada e auditoria absoluta de insumos.
            </p>
            
            <div className="hero-btns">
              <Link to="/login" className="btn-primary">
                Iniciar Operação
                <ArrowRight size={18} />
              </Link>
              <a href="#ecosystem" className="btn-secondary">
                <div className="play-icon"><Play size={12} fill="currentColor" /></div>
                Ver Módulos
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
                <span className="stat-label">Vazamento de Dados</span>
              </div>
            </div>
          </motion.div>

          {/* Interactive Command Terminal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-visual"
          >
            <div className="terminal-card">
              <div className="terminal-header">
                <div className="terminal-dots">
                  <span className="dot close"></span>
                  <span className="dot minimize"></span>
                  <span className="dot expand"></span>
                </div>
                <div className="terminal-title">tauze-cli v5.0.4</div>
                <div className="terminal-sync">
                  <RefreshCw size={12} className={isTyping ? 'spin-anim' : ''} />
                  <span>Sincronizado</span>
                </div>
              </div>
              
              <div className="terminal-tabs">
                <button 
                  onClick={() => setActiveTerminalTab('telemetria')} 
                  className={`tab-btn ${activeTerminalTab === 'telemetria' ? 'active' : ''}`}
                >
                  <Activity size={14} /> Telemetria IoT
                </button>
                <button 
                  onClick={() => setActiveTerminalTab('b3')} 
                  className={`tab-btn ${activeTerminalTab === 'b3' ? 'active' : ''}`}
                >
                  <TrendingUp size={14} /> Indicadores B3
                </button>
                <button 
                  onClick={() => setActiveTerminalTab('ia')} 
                  className={`tab-btn ${activeTerminalTab === 'ia' ? 'active' : ''}`}
                >
                  <Cpu size={14} /> IA Biometria
                </button>
              </div>

              <div className="terminal-body">
                <div className="terminal-lines">
                  {terminalOutput.map((line, idx) => (
                    <div key={idx} className={`line ${line.startsWith('$') ? 'cmd' : line.startsWith('[OK]') ? 'ok' : line.startsWith('[ALERT]') ? 'alert' : 'info'}`}>
                      {line}
                    </div>
                  ))}
                  {isTyping && <div className="typing-indicator">Processando query analítica...<span className="cursor">█</span></div>}
                  {!isTyping && <div className="prompt"><span className="green-accent">$</span> <span className="cursor-blink">█</span></div>}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Bento Grid: Mosaic of Analytics --- */}
      <section className="features-mosaic-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">TECNOLOGIA SOBERANA</span>
            <h2 className="section-title">Governança Absoluta em Lotes</h2>
            <p className="section-subtitle">A potência digital desenhada sob a identidade exclusiva de quem dita o futuro do agro.</p>
          </div>

          <div className="bento-grid">
            <div className="bento-item item-large">
              <div className="bento-content">
                <div className="bento-header">
                  <TrendingUp className="bento-icon" />
                  <h4>Engenharia Genética & Ganho Médio</h4>
                </div>
                <p>Nossa inteligência calcula com máxima precisão o Ganho Médio Diário (GMD) projetado com base em dados climatológicos e nutricionais.</p>
                <div className="chart-preview">
                  <div className="chart-bars">
                    {[45, 60, 52, 75, 68, 90, 82, 100].map((h, i) => (
                      <div 
                        key={i} 
                        className="bar" 
                        style={{ height: `${h}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bento-item item-medium">
              <div className="bento-content">
                <div className="bento-header">
                  <Activity className="bento-icon" />
                  <h4>Integração Dinâmica de Campo</h4>
                </div>
                <p>Mapeamento e pareamento com balanças inteligentes e dispositivos RFID sem necessidade de reconfiguração de rede local.</p>
                <div className="telemetry-bar">
                  <div className="pulse-circle"></div>
                  <span className="telemetry-percentage">98.4%</span>
                  <span className="telemetry-txt">Eficiência de Sinal Local</span>
                </div>
              </div>
            </div>

            <div className="bento-item item-small">
              <div className="bento-content centered">
                <Cloud className="bento-icon large" />
                <h4>Sincronização Híbrida</h4>
                <p>Armazene em nuvem local ou em servidores soberanos isolados.</p>
              </div>
            </div>

            <div className="bento-item item-small">
              <div className="bento-content centered">
                <Smartphone className="bento-icon large" />
                <h4>Plataforma Mobile</h4>
                <p>Visualização de lotes e emissão de guias mesmo sem conexão estável.</p>
              </div>
            </div>

            <div className="bento-item item-wide">
              <div className="bento-content">
                <div className="bento-header">
                  <Lock className="bento-icon" />
                  <h4>Criptografia e Isolamento Militar</h4>
                </div>
                <div className="shield-block">
                  <div className="shield-icon"><ShieldCheck size={36} /></div>
                  <div className="shield-details">
                    <strong>Padrão AES-256 e Blindagem Multi-tenant</strong>
                    <p>Garantia completa de privacidade. Seus custos operacionais e margens não são expostos a terceiros.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Interactive Ecosystem Showcase --- */}
      <section className="ecosystem-showcase" id="ecosystem">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">ECOSSISTEMA INTEGRADO</span>
            <h2 className="section-title">Três Pilares de Governança</h2>
            <p className="section-subtitle">Gestão profunda que consolida dados operacionais, de frotas e finanças em uma experiência centralizada.</p>
          </div>

          <div className="showcase-tabs">
            <button 
              onClick={() => setActiveEcosystemTab('bovinocultura')}
              className={`eco-tab ${activeEcosystemTab === 'bovinocultura' ? 'active' : ''}`}
            >
              <Cpu size={16} />
              <span>Bovinocultura 5.0</span>
            </button>
            <button 
              onClick={() => setActiveEcosystemTab('frota')}
              className={`eco-tab ${activeEcosystemTab === 'frota' ? 'active' : ''}`}
            >
              <Truck size={16} />
              <span>Frotas & Máquinas</span>
            </button>
            <button 
              onClick={() => setActiveEcosystemTab('financeiro')}
              className={`eco-tab ${activeEcosystemTab === 'financeiro' ? 'active' : ''}`}
            >
              <BarChart3 size={16} />
              <span>Governança Financeira</span>
            </button>
          </div>

          <div className="showcase-viewer">
            <div className="viewer-details">
              {activeEcosystemTab === 'bovinocultura' && (
                <motion.div key="bovinocultura" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                  <h3>Rastreabilidade Bovinocultura Avançada</h3>
                  <p>Mapeie seus animais de forma granular. Monitore histórico de pesagens, genealogia completa, evolução de sanidade e taxas reprodutivas.</p>
                  <ul className="eco-list">
                    <li><CheckCircle2 size={16} /> Predição de abate com modelo de regressão estocástica</li>
                    <li><CheckCircle2 size={16} /> Controle automatizado de lotes e pesagem dinâmica</li>
                    <li><CheckCircle2 size={16} /> Histórico completo de manejo de vacinas e exames veterinários</li>
                  </ul>
                </motion.div>
              )}
              {activeEcosystemTab === 'frota' && (
                <motion.div key="frota" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                  <h3>Controle Absoluto de Ativos Móveis</h3>
                  <p>Gerencie o consumo, a eficiência e as ordens de manutenção da sua frota agroindustrial. Saiba exatamente onde cada litro de combustível é investido.</p>
                  <ul className="eco-list">
                    <li><CheckCircle2 size={16} /> Telemetria de maquinário pesado e alertas de manutenção preventiva</li>
                    <li><CheckCircle2 size={16} /> Gestão minuciosa de abastecimentos e custos por hora rodada</li>
                    <li><CheckCircle2 size={16} /> Auditoria completa de movimentação de veículos de campo</li>
                  </ul>
                </motion.div>
              )}
              {activeEcosystemTab === 'financeiro' && (
                <motion.div key="financeiro" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                  <h3>Auditoria de Custos e Contratos B3</h3>
                  <p>Descubra a saúde da sua margem comercial. Automatize o fluxo de caixa, emita DREs por fazendas e calcule hedges defensivos atrelados à B3.</p>
                  <ul className="eco-list">
                    <li><CheckCircle2 size={16} /> Conciliação bancária 100% automatizada por importação OFX</li>
                    <li><CheckCircle2 size={16} /> Divisão por centros de custo e fazendas específicas</li>
                    <li><CheckCircle2 size={16} /> Ferramenta completa de simulação de contratos de derivativos B3</li>
                  </ul>
                </motion.div>
              )}
            </div>

            <div className="viewer-preview">
              <div className="mockup-screen">
                <div className="screen-bar">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
                {activeEcosystemTab === 'bovinocultura' && <img src="/4.png" alt="Painel Bovinocultura" className="screen-image" />}
                {activeEcosystemTab === 'frota' && <img src="/1.png" alt="Painel Frota" className="screen-image" />}
                {activeEcosystemTab === 'financeiro' && <img src="/4.png" alt="Painel Financeiro" className="screen-image" />}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Dynamic Pricing Section --- */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">INVESTIMENTO E ESCALA</span>
            <h2 className="section-title">Valores transparentes de Soberania</h2>
            <p className="section-subtitle">Escolha o nível de governança ideal para o volume de cabeças e dados da sua fazenda.</p>
            
            <div className="billing-toggle-wrapper">
              <span className={`toggle-label ${billingCycle === 'monthly' ? 'active' : ''}`}>Mensal</span>
              <button 
                onClick={() => setBillingCycle(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
                className={`pricing-toggle-btn ${billingCycle === 'yearly' ? 'toggled' : ''}`}
                aria-label="Alternar Faturamento"
              >
                <span className="toggle-knob"></span>
              </button>
              <span className={`toggle-label ${billingCycle === 'yearly' ? 'active' : ''}`}>
                Anual <span className="discount-tag">Economize 20%</span>
              </span>
            </div>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => {
              const displayPrice = billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
              const periodLabel = billingCycle === 'monthly' ? '/mês' : '/ano';
              
              return (
                <motion.div 
                  key={index}
                  whileHover={{ y: -8 }}
                  className={`pricing-card-v2 ${plan.popular ? 'glowing' : ''}`}
                >
                  {plan.popular && <div className="popular-badge-v2">Mais Escolhido</div>}
                  <div className="card-header">
                    <h3>{plan.name}</h3>
                    <p className="desc">{plan.description}</p>
                    <div className="price-container">
                      <span className="symbol">R$</span>
                      <span className="amount">{displayPrice.toLocaleString('pt-BR')}</span>
                      <span className="period">{periodLabel}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="features-headline">O que está incluso:</div>
                    <div className="features-list">
                      {plan.features.map((feat: string, i: number) => (
                        <div key={i} className="feature-item">
                          <Check size={16} className="feature-check" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="card-footer">
                    <Link to="/login" className={`cta-button ${plan.popular ? 'primary' : 'secondary'}`}>
                      {plan.cta}
                    </Link>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- Premium Security Guard Section --- */}
      <section className="security-banner-section" id="security">
        <div className="container">
          <div className="security-container">
            <div className="security-visual-deco">
              <Server size={80} className="glow-icon-server" />
              <div className="security-badge-shield"><Lock size={24} /></div>
            </div>
            <div className="security-text-content">
              <h2>Blindagem Soberana e Isolamento de Dados</h2>
              <p>O Tauze ERP é estruturado em servidores modulares independentes. Suas margens comerciais, indicadores biológicos e dados de frotas são criptografados de ponta a ponta e nunca misturados com outros operadores.</p>
              <div className="security-certs">
                <span className="cert-item">AES-256</span>
                <span className="cert-item">NUVEM SOBERANA</span>
                <span className="cert-item">ISO 27001</span>
                <span className="cert-item">AUDITÁVEL</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Highly Interactive FAQ Section --- */}
      <section className="faq-section" id="faq">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">DÚVIDAS FREQUENTES</span>
            <h2 className="section-title">Perguntas Frequentes</h2>
            <p className="section-subtitle">Tudo o que você precisa saber sobre o ecossistema digital da tauze.</p>
          </div>

          <div className="faq-wrapper">
            {[
              {
                q: "Como o sistema lida com a falta de internet no campo?",
                a: "O Tauze ERP possui um ecossistema mobile-first com banco de dados local. Você executa manejos de pesagem, cadastros de animais e telemetria de combustível totalmente offline. Assim que seu dispositivo encontra qualquer conexão estável (Wi-Fi ou 4G), os dados são sincronizados perfeitamente na nuvem."
              },
              {
                q: "O que é o conceito de Nuvem Soberana?",
                a: "A maioria dos ERPs do mercado hospeda seus dados em pools comuns onde outras empresas compartilham do mesmo espaço computacional. Na tauze, cada tenant possui uma infraestrutura lógica isolada, garantindo total conformidade de segurança e blindagem estrita contra vazamentos industriais."
              },
              {
                q: "Posso integrar balanças de curral e coletores RFID?",
                a: "Sim! Oferecemos drivers de sincronização direta para as principais marcas de balanças e bastões de leitura RFID do mercado brasileiro. A leitura envia os pesos diretamente ao aplicativo via Bluetooth ou pareamento local em tempo real."
              },
              {
                q: "Como funciona a previsão de contratos futuros de boi gordo B3?",
                a: "Nosso painel de inteligência de mercado consulta feeds oficiais da B3 e cruza com a curva de ganho de peso do seu próprio rebanho, indicando o melhor momento financeiro para venda direta ou hedge defensivo."
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
      <footer className="noir-footer-v2">
        <div className="container footer-grid-v2">
          <div className="footer-brand-v2">
            <div className="logo-group">
              <TauzeLogo size={36} />
              <span className="brand">tauze</span>
            </div>
            <p>A governança analítica soberana por trás dos maiores produtores de ativos biológicos.</p>
          </div>
          <div className="footer-links-v2">
            <div className="col">
              <h5>Soluções</h5>
              <a href="#features">Precisão Bovinocultura</a>
              <a href="#features">Telemetria de Frotas</a>
              <a href="#features">Hedge Financeiro B3</a>
            </div>
            <div className="col">
              <h5>Tecnologia</h5>
              <a href="#security">Nuvem Soberana</a>
              <a href="#security">Criptografia AES-256</a>
              <a href="/login">Acessar Terminal</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom-v2">
          <div className="container">
            <p>&copy; 2026 tauze intelligence. Todos os direitos reservados. Soberania Operacional Garantida.</p>
          </div>
        </div>
      </footer>

      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@600;700;800;900&display=swap');

        .tauze-landing {
          --bg-primary: #020503;
          --bg-secondary: #050c07;
          --text-primary: #ffffff;
          --text-secondary: #a3b8cc;
          --accent: #00b865;
          --accent-glow: rgba(0, 184, 101, 0.15);
          --accent-border: rgba(0, 184, 101, 0.25);
          --border-color: rgba(255, 255, 255, 0.06);
          --card-bg: rgba(5, 12, 7, 0.6);
          --nav-bg: rgba(2, 5, 3, 0.7);
          --shadow-color: rgba(0, 0, 0, 0.85);
          --btn-sec-bg: rgba(255, 255, 255, 0.03);
          --btn-sec-border: rgba(255, 255, 255, 0.08);

          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          transition: background 0.5s ease, color 0.5s ease;
          scroll-behavior: smooth;
        }

        .tauze-landing.light {
          --bg-primary: #f8fafc;
          --bg-secondary: #f1f5f9;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --accent: #00b865;
          --accent-glow: rgba(0, 184, 101, 0.08);
          --accent-border: rgba(0, 184, 101, 0.18);
          --border-color: rgba(0, 0, 0, 0.08);
          --card-bg: rgba(255, 255, 255, 0.8);
          --nav-bg: rgba(248, 250, 252, 0.8);
          --shadow-color: rgba(0, 0, 0, 0.05);
          --btn-sec-bg: #e2e8f0;
          --btn-sec-border: transparent;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .gradient-text {
          background: linear-gradient(to right, var(--accent), #4ade80, var(--accent));
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine-text 5s linear infinite;
        }

        @keyframes shine-text {
          to { background-position: 200% center; }
        }

        /* --- Ambient Deco Background --- */
        .ambient-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          opacity: 0.15;
        }

        .tauze-landing.light .glow {
          opacity: 0.05;
        }

        .glow-1 {
          top: -10%;
          right: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
        }

        .glow-2 {
          top: 40%;
          left: -15%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
        }

        .glow-3 {
          bottom: -10%;
          right: -5%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
        }

        .grid-line-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(var(--border-color) 1px, transparent 1px),
            linear-gradient(90deg, var(--border-color) 1px, transparent 1px);
          background-size: 80px 80px;
          opacity: 0.25;
          mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 95%);
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
          box-shadow: 0 4px 30px var(--shadow-color);
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

        .theme-toggle-btn {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--btn-sec-bg);
          border: 1px solid var(--btn-sec-border);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s;
        }

        .theme-toggle-btn:hover {
          border-color: var(--accent);
          color: var(--accent);
          transform: scale(1.05);
        }

        .btn-terminal {
          background: var(--text-primary);
          color: var(--bg-primary);
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
          box-shadow: 0 4px 15px rgba(255, 255, 255, 0.15);
        }

        /* --- Hero --- */
        .hero-section {
          padding: 180px 0 100px;
          position: relative;
          z-index: 1;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
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
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.35);
          transition: all 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 30px rgba(0, 184, 101, 0.45);
        }

        .btn-secondary {
          background: var(--btn-sec-bg);
          color: var(--text-primary);
          border: 1px solid var(--btn-sec-border);
          padding: 16px 28px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
          transition: background 0.3s;
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .play-icon {
          width: 24px;
          height: 24px;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
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

        /* --- Interactive Terminal Mockup --- */
        .terminal-card {
          background: rgba(5, 12, 8, 0.85);
          border: 1px solid var(--accent-border);
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.7);
          overflow: hidden;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }

        .terminal-header {
          background: rgba(0, 0, 0, 0.4);
          padding: 14px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-color);
        }

        .terminal-dots {
          display: flex;
          gap: 6px;
        }

        .dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
        }

        .dot.close { background: #ff5f56; }
        .dot.minimize { background: #ffbd2e; }
        .dot.expand { background: #27c93f; }

        .terminal-title {
          font-family: monospace;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .terminal-sync {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          color: var(--accent);
          font-weight: 700;
        }

        .spin-anim {
          animation: spin-loop 1.2s linear infinite;
        }

        @keyframes spin-loop {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .terminal-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border-color);
        }

        .tab-btn {
          flex: 1;
          padding: 12px;
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

        .tab-btn:hover {
          color: var(--text-primary);
        }

        .tab-btn.active {
          color: var(--accent);
          border-bottom-color: var(--accent);
          background: rgba(0, 184, 101, 0.03);
        }

        .terminal-body {
          padding: 24px;
          height: 250px;
          overflow-y: auto;
          font-family: 'Courier New', Courier, monospace;
          font-size: 0.85rem;
          color: #e2e8f0;
          line-height: 1.6;
        }

        .line {
          margin-bottom: 6px;
        }

        .line.cmd {
          color: #f1f5f9;
          font-weight: bold;
        }

        .line.info {
          color: #94a3b8;
        }

        .line.ok {
          color: #4ade80;
        }

        .line.alert {
          color: #fb7185;
        }

        .green-accent {
          color: var(--accent);
          font-weight: bold;
        }

        .cursor-blink {
          animation: blink 1s step-end infinite;
        }

        @keyframes blink {
          50% { opacity: 0; }
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
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          display: flex;
          align-items: flex-end;
          padding: 20px;
          border: 1px solid var(--border-color);
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

        .telemetry-bar {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 16px;
          border: 1px solid var(--border-color);
          margin-top: auto;
        }

        .pulse-circle {
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

        .telemetry-percentage {
          font-size: 1.3rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .telemetry-txt {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .shield-block {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          background: rgba(0, 184, 101, 0.04);
          border: 1px solid var(--accent-border);
          border-radius: 16px;
        }

        .shield-icon {
          color: var(--accent);
        }

        .shield-details strong {
          display: block;
          font-size: 0.95rem;
          margin-bottom: 2px;
        }

        .shield-details p {
          margin: 0;
          font-size: 0.8rem;
        }

        /* --- Interactive Ecosystem Section --- */
        .ecosystem-showcase {
          padding: 120px 0;
          background: var(--bg-secondary);
          position: relative;
          z-index: 1;
        }

        .showcase-tabs {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-bottom: 48px;
        }

        .eco-tab {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          padding: 14px 28px;
          border-radius: 100px;
          color: var(--text-secondary);
          font-size: 0.9rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }

        .eco-tab:hover {
          color: var(--text-primary);
          border-color: var(--accent-border);
        }

        .eco-tab.active {
          background: var(--accent);
          color: #ffffff;
          border-color: var(--accent);
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.25);
        }

        .showcase-viewer {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
        }

        .viewer-details h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .viewer-details p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .eco-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .eco-list li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.95rem;
          font-weight: 500;
        }

        .eco-list li svg {
          color: var(--accent);
        }

        .viewer-preview {
          perspective: 1000px;
        }

        .mockup-screen {
          background: #000000;
          border: 1px solid var(--border-color);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 30px 60px var(--shadow-color);
          transform: rotateY(-5deg) rotateX(5deg);
        }

        .screen-bar {
          background: #0b0f0c;
          padding: 10px 16px;
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border-color);
        }

        .screen-bar .dot {
          width: 8px;
          height: 8px;
          background: var(--border-color);
          border-radius: 50%;
        }

        .screen-image {
          width: 100%;
          height: auto;
          display: block;
        }

        /* --- Dynamic Pricing Section --- */
        .pricing-section {
          padding: 120px 0;
          position: relative;
          z-index: 1;
        }

        .billing-toggle-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 6px;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          border-radius: 100px;
          margin-top: 24px;
        }

        .toggle-label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-secondary);
          transition: color 0.3s;
        }

        .toggle-label.active {
          color: var(--text-primary);
        }

        .discount-tag {
          font-size: 0.7rem;
          font-weight: 800;
          color: #ffffff;
          background: var(--accent);
          padding: 3px 8px;
          border-radius: 100px;
          margin-left: 4px;
        }

        .pricing-toggle-btn {
          width: 48px;
          height: 24px;
          border-radius: 100px;
          background: var(--border-color);
          border: none;
          cursor: pointer;
          position: relative;
          transition: all 0.3s;
          padding: 2px;
        }

        .pricing-toggle-btn.toggled {
          background: var(--accent);
        }

        .toggle-knob {
          display: block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: hsl(var(--bg-card));
          transition: transform 0.3s;
        }

        .pricing-toggle-btn.toggled .toggle-knob {
          transform: translateX(24px);
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          margin-top: 56px;
          align-items: stretch;
        }

        .pricing-card-v2 {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 28px;
          padding: 44px;
          display: flex;
          flex-direction: column;
          position: relative;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 10px 30px var(--shadow-color);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        .pricing-card-v2:hover {
          transform: translateY(-6px);
          border-color: var(--accent-border);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.05);
        }

        .pricing-card-v2.glowing {
          border-color: var(--accent);
          box-shadow: 0 20px 40px rgba(0, 184, 101, 0.12);
        }

        .popular-badge-v2 {
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

        .card-header h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 8px;
        }

        .card-header .desc {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 28px;
          min-height: 3em;
        }

        .price-container {
          display: flex;
          align-items: baseline;
          margin-bottom: 32px;
        }

        .price-container .symbol {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .price-container .amount {
          font-family: 'Outfit', sans-serif;
          font-size: 3.4rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .price-container .period {
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-left: 4px;
        }

        .card-body {
          flex-grow: 1;
        }

        .features-headline {
          font-size: 0.85rem;
          font-weight: 800;
          color: var(--text-primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
        }

        .features-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-bottom: 40px;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .feature-check {
          color: var(--accent);
          flex-shrink: 0;
        }

        .cta-button {
          display: block;
          text-align: center;
          padding: 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.3s;
        }

        .cta-button.primary {
          background: var(--accent);
          color: #ffffff;
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.2);
        }

        .cta-button.primary:hover {
          background: #009953;
          transform: translateY(-2px);
        }

        .cta-button.secondary {
          background: var(--btn-sec-bg);
          color: var(--text-primary);
          border: 1px solid var(--btn-sec-border);
        }

        .cta-button.secondary:hover {
          background: rgba(255, 255, 255, 0.08);
          transform: translateY(-2px);
        }

        /* --- Security Banner --- */
        .security-banner-section {
          padding: 80px 0;
          position: relative;
          z-index: 1;
        }

        .security-container {
          background: linear-gradient(135deg, rgba(0, 184, 101, 0.04) 0%, rgba(0, 0, 0, 0.3) 100%);
          border: 1px solid var(--border-color);
          border-radius: 36px;
          padding: 64px;
          display: flex;
          align-items: center;
          gap: 64px;
        }

        .security-visual-deco {
          position: relative;
          flex-shrink: 0;
        }

        .glow-icon-server {
          color: var(--border-color);
          filter: drop-shadow(0 0 15px var(--accent-glow));
        }

        .security-badge-shield {
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
          box-shadow: 0 10px 20px rgba(0, 184, 101, 0.3);
        }

        .security-text-content h2 {
          font-family: 'Outfit', sans-serif;
          font-size: 2.2rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .security-text-content p {
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 680px;
        }

        .security-certs {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }

        .cert-item {
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--text-secondary);
          padding: 6px 14px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 6px;
          letter-spacing: 0.05em;
        }

        /* --- FAQ Accordion --- */
        .faq-section {
          padding: 100px 0;
          position: relative;
          z-index: 1;
        }

        .faq-wrapper {
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
        .noir-footer-v2 {
          padding: 80px 0 0;
          border-top: 1px solid var(--border-color);
          background: var(--bg-secondary);
          position: relative;
          z-index: 1;
        }

        .footer-grid-v2 {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 64px;
          margin-bottom: 64px;
        }

        .footer-brand-v2 p {
          color: var(--text-secondary);
          margin-top: 16px;
          font-size: 1rem;
          line-height: 1.6;
          max-width: 480px;
        }

        .footer-links-v2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
        }

        .footer-links-v2 .col h5 {
          font-weight: 800;
          margin-bottom: 18px;
          color: var(--text-primary);
          text-transform: uppercase;
          font-size: 0.8rem;
          letter-spacing: 0.05em;
        }

        .footer-links-v2 .col a {
          display: block;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 10px;
          font-size: 0.9rem;
          transition: color 0.3s;
        }

        .footer-links-v2 .col a:hover {
          color: var(--text-primary);
        }

        .footer-bottom-v2 {
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
          .showcase-viewer { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
          .security-container { flex-direction: column; text-align: center; }
          .footer-grid-v2 { grid-template-columns: 1fr; }
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
