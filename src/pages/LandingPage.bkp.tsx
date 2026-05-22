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
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [plans, setPlans] = useState<any[]>([]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data, error } = await supabase
          .from('saas_plans')
          .select('*').limit(500)
          .gt('price', 0) // Oculta planos gratuitos da vitrine pública
          .order('price', { ascending: true });
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          // Identify the most popular plan (e.g. the middle one or the second one)
          const popularIndex = data.length > 1 ? 1 : 0;
          
          const formattedPlans = data.map((p, index) => ({
            id: p.id,
            name: p.name,
            price: p.price.toLocaleString('pt-BR', { minimumFractionDigits: 0 }),
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
    <div className={`tauze-landing ${theme}`}>
      {/* --- Premium Navigation --- */}
      <nav className={`noir-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="logo-group">
            <div className="logo-icon">
              <TauzeLogo size={28} />
            </div>
            <div className="logo-text">
              <span className="brand" style={{ textTransform: 'lowercase' }}>tauze</span>
              <span className="version">DIAMOND 5.0</span>
            </div>
          </div>
          
          <div className="nav-links">
            <a href="#intelligence">Intelligence</a>
            <a href="#features">Recursos</a>
            <a href="#modules">Ecosystem</a>
            <a href="#pricing">Planos</a>
          </div>

          <div className="nav-actions">
            <button onClick={toggleTheme} className="theme-toggle-btn" title="Alternar Tema">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="btn-login">
              <Terminal size={14} />
              Acessar Terminal
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section: The Global Command Center --- */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="glow-top"></div>
          <div className="glow-bottom"></div>
          <div className="grid-overlay"></div>
        </div>

        <div className="container hero-grid">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-content"
          >
            <div className="badge-premium">
              <Sparkles size={12} />
              <span>Soberania Digital Agroindustrial</span>
            </div>
            
            <h1 className="hero-title">
              O Futuro da <br/>
              <span className="gradient-text">Pecuária de Precisão.</span>
            </h1>
            
            <p className="hero-description">
              A plataforma definitiva para gestão de ativos biológicos e operacionais. 
              Inteligência artificial, telemetria em tempo real e auditoria absoluta para produtores de tauze.
            </p>
            
            <div className="hero-btns">
              <Link to="/login" className="btn-primary">
                Iniciar Operação
                <ArrowRight size={20} />
              </Link>
              <button className="btn-secondary">
                <div className="play-icon"><Play size={14} fill="currentColor" /></div>
                Explorar Ecossistema
              </button>
            </div>

            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-value">+24%</span>
                <span className="stat-label">ROI Médio</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">99.9%</span>
                <span className="stat-label">Uptime</span>
              </div>
              <div className="stat-divider"></div>
              <div className="stat-item">
                <span className="stat-value">AES-256</span>
                <span className="stat-label">Encryption</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="hero-visual-flat"
          >
            <div className="browser-mockup">
              <div className="browser-header">
                <div className="dot close"></div>
                <div className="dot min"></div>
                <div className="dot max"></div>
              </div>
              <img src="/1.png" alt="Dashboard Global" className="flat-dashboard-img" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Intelligence Hub --- */}
      <section className="intelligence-section" id="intelligence">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">DIAMOND PRECISION 5.0</span>
            <h2 className="section-title">Onde a Dados Viram Soberania</h2>
          </div>

          <div className="intel-grid">
            <div className="intel-card">
              <div className="intel-icon"><Cpu /></div>
              <h3>Algoritmos Biológicos</h3>
              <p>Modelagem preditiva de crescimento e conversão alimentar com 98% de precisão estatística.</p>
            </div>
            <div className="intel-card">
              <div className="intel-icon"><Globe /></div>
              <h3>Visão Global 360°</h3>
              <p>Controle total de múltiplas fazendas em uma única interface centralizada e segura.</p>
            </div>
            <div className="intel-card">
              <div className="intel-icon"><Microscope /></div>
              <h3>Auditoria em Tempo Real</h3>
              <p>Rastreabilidade completa de cada insumo, animal e centavo investido na sua operação.</p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Bento Grid: Features Mosaic --- */}
      <section className="features-mosaic-section" id="features">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">VISÃO ANALÍTICA</span>
            <h2 className="section-title">Mosaico de Inteligência</h2>
            <p className="section-subtitle">Toda a potência do Tauze ERP consolidada em uma experiência visual superior.</p>
          </div>

          <div className="bento-grid">
            <motion.div whileHover={{ scale: 1.02 }} className="bento-item item-large">
              <div className="bento-content">
                <div className="bento-header">
                  <TrendingUp className="bento-icon" />
                  <h4>Performance do Rebanho</h4>
                </div>
                <div className="chart-preview">
                  <div className="chart-bars">
                    {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                      <motion.div 
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        className="bar"
                      />
                    ))}
                  </div>
                </div>
                <p>Evolução de peso e GMD em tempo real com projeção de abate otimizada.</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bento-item item-medium">
              <div className="bento-content">
                <div className="bento-header">
                  <Activity className="bento-icon" />
                  <h4>Telemetria IoT</h4>
                </div>
                <div className="telemetry-visual">
                  <div className="pulse-dot"></div>
                  <span className="telemetry-value">94.2%</span>
                  <span className="telemetry-label">Eficiência de Frota</span>
                </div>
                <p>Conectividade direta com balanças e sensores de campo.</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bento-item item-small">
              <div className="bento-content centered">
                <Cloud className="bento-icon large" />
                <h4>Cloud Sync</h4>
                <p>Dados seguros e sempre disponíveis.</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bento-item item-small">
              <div className="bento-content centered">
                <Smartphone className="bento-icon large" />
                <h4>Mobile First</h4>
                <p>Gestão na palma da sua mão.</p>
              </div>
            </motion.div>

            <motion.div whileHover={{ scale: 1.02 }} className="bento-item item-wide">
              <div className="bento-content">
                <div className="bento-header">
                  <Lock className="bento-icon" />
                  <h4>Segurança Multi-tenant</h4>
                </div>
                <div className="security-visual">
                  <div className="shield-wrap">
                    <ShieldCheck size={32} />
                  </div>
                  <div className="security-text">
                    <strong>Isolamento de Dados Nível 4</strong>
                    <span>Arquitetura de segurança blindada para cada parceiro.</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* --- Ecosystem Modules --- */}
      <section className="modules-section" id="modules">
        <div className="container">
          <div className="modules-wrap">
            <div className="modules-text">
              <h2 className="section-title">Módulos Integrados</h2>
              <p>Uma suíte completa para governança total da sua agroindústria.</p>
              
              <div className="modules-list">
                <div className="module-item active">
                  <Activity size={20} />
                  <div>
                    <h4>Pecuária 5.0</h4>
                    <p>Gestão de rebanho, manejo e predição de abate.</p>
                  </div>
                </div>
                <div className="module-item">
                  <Truck size={20} />
                  <div>
                    <h4>Frota & Máquinas</h4>
                    <p>Telemetria, manutenção e custos de ativos móveis.</p>
                  </div>
                </div>
                <div className="module-item">
                  <BarChart3 size={20} />
                  <div>
                    <h4>Financeiro de Tauze</h4>
                    <p>DRE, fluxo de caixa e gestão de contratos.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modules-visual">
              <div className="visual-stack">
                <img src="/4.png" alt="Pecuária Module" className="v-img v1" />
                <div className="v-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Pricing Section --- */}
      <section className="pricing-section" id="pricing">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">INVESTIMENTO E ESCALA</span>
            <h2 className="section-title">Planos de Soberania Digital</h2>
            <p className="section-subtitle">Escolha o nível de governança ideal para o tamanho da sua operação.</p>
          </div>

          <div className="pricing-grid">
            {plans.map((plan, index) => (
              <motion.div 
                key={index}
                whileHover={{ y: -10 }}
                className={`pricing-card ${plan.popular ? 'popular' : ''}`}
              >
                {plan.popular && <div className="popular-badge">Mais Escolhido</div>}
                <div className="plan-header">
                  <h3>{plan.name}</h3>
                  <div className="price-wrap">
                    <span className="currency">R$</span>
                    <span className="amount">{plan.price}</span>
                    <span className="period">/mês</span>
                  </div>
                  <p className="plan-desc">{plan.description}</p>
                </div>

                <div className="plan-features">
                  {plan.features.map((feat: any, i: number) => (
                    <div key={i} className="feat-line">
                      <Check size={16} className="check-icon" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                <Link to="/login" className={`plan-btn ${plan.popular ? 'primary' : 'secondary'}`}>
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- Security Section --- */}
      <section className="security-section" id="security">
        <div className="container">
          <div className="security-box">
            <div className="security-content">
              <div className="security-icon-large"><Lock size={40} /></div>
              <h2>Privacidade & Blindagem</h2>
              <p>Seus dados são o seu maior ativo. Protegemos sua operação com criptografia de nível militar e infraestrutura soberana.</p>
              <div className="security-badges">
                <span className="badge-s">AES-256</span>
                <span className="badge-s">SOC2 TYPE II</span>
                <span className="badge-s">GDPR COMPLIANT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="noir-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <div className="logo-group">
              <TauzeLogo size={36} />
              <span className="brand" style={{ textTransform: 'lowercase' }}>tauze</span>
            </div>
            <p>A inteligência por trás dos maiores produtores.</p>
          </div>
          <div className="footer-links">
            <div className="link-col">
              <h5>Produto</h5>
              <a href="#">Recursos</a>
              <a href="#">Segurança</a>
              <a href="#">Roadmap</a>
            </div>
            <div className="link-col">
              <h5>Empresa</h5>
              <a href="#">Sobre</a>
              <a href="#">Contato</a>
              <a href="#">Termos</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="container">
            <p>&copy; 2026 Tauze Intelligence. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');

        .tauze-landing {
          --bg-primary: #ffffff;
          --bg-secondary: #f8fafc;
          --text-primary: #0f172a;
          --text-secondary: #475569;
          --border-color: rgba(0, 0, 0, 0.06);
          --nav-bg: rgba(255, 255, 255, 0.85);
          --card-bg: #ffffff;
          --btn-secondary-bg: #f1f5f9;
          --btn-secondary-text: #0f172a;
          --btn-secondary-border: transparent;
          --glow-opacity: 0.05;
          --grid-opacity: 0.04;
          --shadow-color: rgba(0, 0, 0, 0.04);
          --pricing-popular-border: #10b981;
          --bento-bg: #f8fafc;

          background: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
          transition: background 0.5s ease, color 0.5s ease;
          scroll-behavior: smooth;
        }

        .tauze-landing.dark {
          --bg-primary: #020202;
          --bg-secondary: #050505;
          --text-primary: #ffffff;
          --text-secondary: #94a3b8;
          --border-color: rgba(255, 255, 255, 0.05);
          --nav-bg: rgba(2, 2, 2, 0.5);
          --card-bg: rgba(255, 255, 255, 0.02);
          --btn-secondary-bg: transparent;
          --btn-secondary-text: #ffffff;
          --btn-secondary-border: rgba(255, 255, 255, 0.1);
          --glow-opacity: 0.15;
          --grid-opacity: 0.02;
          --shadow-color: rgba(0, 0, 0, 0.8);
          --bento-bg: transparent;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .gradient-text {
          background: linear-gradient(to right, #10b981, #34d399, #10b981);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: textShine 4s linear infinite;
        }

        @keyframes textShine {
          to { background-position: 200% center; }
        }

        /* --- Nav --- */
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
          backdrop-filter: blur(30px);
          -webkit-backdrop-filter: blur(30px);
          height: 70px;
          border-bottom: 1px solid var(--border-color);
        }

        .nav-container {
          width: 100%;
          max-width: 1300px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
        }

        .logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .logo-icon {
          width: 38px;
          height: 38px;
          background: var(--bg-primary);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-text {
          display: flex;
          flex-direction: column;
          line-height: 1;
        }

        .brand {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.2rem;
          letter-spacing: -0.02em;
        }

        .version {
          font-size: 0.6rem;
          font-weight: 800;
          color: #10b981;
          letter-spacing: 0.1em;
          margin-top: 3px;
        }

        .nav-links {
          display: flex;
          gap: 40px;
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
          width: 40px;
          height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.3s;
        }

        .theme-toggle-btn:hover {
          transform: scale(1.05);
          border-color: #10b981;
        }

        .btn-login {
          background: var(--text-primary);
          color: var(--bg-primary);
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: transform 0.2s;
        }

        .btn-login:hover {
          transform: translateY(-2px);
        }

        /* --- Hero --- */
        .hero-section {
          padding: 180px 0 120px;
          position: relative;
        }

        .hero-background {
          position: absolute;
          inset: 0;
          overflow: hidden;
          z-index: 0;
          background: linear-gradient(180deg, var(--bg-secondary) 0%, var(--bg-primary) 100%);
        }

        .glow-top {
          position: absolute;
          top: -20%;
          right: -10%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(16, 185, 129, var(--glow-opacity)) 0%, transparent 60%);
        }

        .glow-bottom {
          position: absolute;
          bottom: -10%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(16, 185, 129, var(--glow-opacity)) 0%, transparent 60%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 0, 0, var(--grid-opacity)) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, var(--grid-opacity)) 1px, transparent 1px);
          background-size: 50px 50px;
          mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 80px;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        .badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 100px;
          font-size: 0.7rem;
          font-weight: 800;
          color: #10b981;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 32px;
        }

        .hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 5rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -0.04em;
          margin-bottom: 32px;
        }

        .hero-description {
          font-size: 1.25rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 48px;
          max-width: 540px;
        }

        .hero-btns {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 64px;
        }

        .btn-primary {
          background: #10b981;
          color: white;
          padding: 18px 36px;
          border-radius: 12px;
          font-size: 1.1rem;
          font-weight: 800;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
          transition: all 0.3s;
        }

        .btn-primary:hover {
          transform: translateY(-4px);
          box-shadow: 0 15px 40px rgba(16, 185, 129, 0.4);
        }

        .btn-secondary {
          background: var(--btn-secondary-bg);
          color: var(--btn-secondary-text);
          border: 1px solid var(--btn-secondary-border);
          padding: 18px 32px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: background 0.3s;
        }

        .btn-secondary:hover {
          background: rgba(128, 128, 128, 0.05);
        }

        .play-icon {
          width: 32px;
          height: 32px;
          background: rgba(128, 128, 128, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .hero-stats {
          display: flex;
          align-items: center;
          gap: 40px;
          padding-top: 40px;
          border-top: 1px solid var(--border-color);
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--text-primary);
        }

        .stat-label {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-secondary);
          text-transform: uppercase;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--border-color);
        }



        /* --- Intelligence --- */
        .intelligence-section {
          padding: 120px 0;
          background: var(--bg-secondary);
        }

        .section-header {
          text-align: center;
          margin-bottom: 80px;
        }

        .section-tag {
          font-size: 0.8rem;
          font-weight: 800;
          color: #10b981;
          letter-spacing: 0.2em;
          margin-bottom: 16px;
          display: block;
        }

        .section-title {
          font-family: 'Outfit', sans-serif;
          font-size: 3.5rem;
          font-weight: 900;
          letter-spacing: -0.02em;
        }

        .section-subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          margin-top: 16px;
        }

        .intel-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .intel-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 24px;
          padding: 48px;
          transition: all 0.3s;
          position: relative;
          box-shadow: 0 10px 30px var(--shadow-color);
        }

        .intel-card:hover {
          border-color: rgba(16, 185, 129, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
        }

        .intel-icon {
          width: 60px;
          height: 60px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 32px;
        }

        .intel-card h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 16px;
        }

        .intel-card p {
          color: var(--text-secondary);
          line-height: 1.6;
        }

        /* --- Bento Grid --- */
        .features-mosaic-section {
          padding: 120px 0;
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
          border-radius: 32px;
          padding: 32px;
          position: relative;
          transition: all 0.3s;
          box-shadow: 0 10px 30px var(--shadow-color);
        }

        .bento-item:hover {
          border-color: rgba(16, 185, 129, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
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
          position: relative;
          z-index: 1;
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
          color: #10b981;
        }

        .bento-icon.large {
          width: 48px;
          height: 48px;
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

        /* Bento Visuals */
        .chart-preview {
          flex-grow: 1;
          background: var(--bg-secondary);
          border-radius: 16px;
          display: flex;
          align-items: flex-end;
          padding: 20px;
          gap: 12px;
        }

        .chart-bars {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          width: 100%;
          height: 100%;
        }

        .bar {
          flex: 1;
          background: linear-gradient(to top, #10b981, #34d399);
          border-radius: 4px;
        }

        .telemetry-visual {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: var(--bg-secondary);
          border-radius: 16px;
        }

        .pulse-dot {
          width: 12px;
          height: 12px;
          background: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }

        .telemetry-value {
          font-size: 1.5rem;
          font-weight: 900;
          color: var(--text-primary);
        }

        .security-visual {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 16px;
          background: rgba(16, 185, 129, 0.05);
          border-radius: 16px;
          border: 1px solid rgba(16, 185, 129, 0.1);
        }

        .shield-wrap {
          color: #10b981;
        }

        .security-text strong {
          display: block;
          font-size: 1rem;
        }

        .security-text span {
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        /* --- Modules --- */
        .modules-section {
          padding: 120px 0;
          background: var(--bg-secondary);
        }

        .modules-wrap {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 100px;
          align-items: center;
        }

        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 48px;
        }

        .module-item {
          padding: 24px;
          background: var(--card-bg);
          border-radius: 20px;
          display: flex;
          gap: 24px;
          transition: all 0.3s;
          cursor: pointer;
          border: 1px solid var(--border-color);
        }

        .module-item.active {
          background: rgba(16, 185, 129, 0.05);
          border-color: rgba(16, 185, 129, 0.2);
        }

        .module-item h4 {
          font-weight: 800;
          font-size: 1.2rem;
          margin-bottom: 4px;
        }

        .module-item p {
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .module-item svg {
          color: #10b981;
          margin-top: 4px;
        }

        .modules-visual {
          position: relative;
        }

        .visual-stack {
          position: relative;
          border-radius: 32px;
          overflow: hidden;
          box-shadow: 0 40px 80px var(--shadow-color);
        }

        .v-img {
          width: 100%;
          display: block;
        }

        .v-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, var(--bg-primary) 0%, transparent 40%);
        }

        /* --- Pricing --- */
        .pricing-section {
          padding: 120px 0;
        }

        .pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
        }

        .pricing-card {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 32px;
          padding: 48px;
          position: relative;
          display: flex;
          flex-direction: column;
          transition: all 0.3s;
          box-shadow: 0 10px 30px var(--shadow-color);
        }

        .pricing-card:hover {
          border-color: rgba(16, 185, 129, 0.2);
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
        }

        .pricing-card.popular {
          border-color: var(--pricing-popular-border);
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.12);
          transform: scale(1.02);
        }

        .popular-badge {
          position: absolute;
          top: 24px;
          right: 24px;
          background: #10b981;
          color: white;
          padding: 6px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .plan-header h3 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-bottom: 24px;
          color: var(--text-primary);
        }

        .price-wrap {
          display: flex;
          align-items: baseline;
          gap: 4px;
          margin-bottom: 16px;
        }

        .currency {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-secondary);
        }

        .amount {
          font-size: 3.5rem;
          font-weight: 900;
          color: var(--text-primary);
          font-family: 'Outfit', sans-serif;
        }

        .period {
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
        }

        .plan-desc {
          font-size: 0.95rem;
          color: var(--text-secondary);
          line-height: 1.5;
          margin-bottom: 40px;
          min-height: 3em;
        }

        .plan-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 48px;
          flex-grow: 1;
        }

        .feat-line {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }

        .check-icon {
          color: #10b981;
          flex-shrink: 0;
        }

        .plan-btn {
          display: block;
          text-align: center;
          padding: 18px;
          border-radius: 16px;
          font-size: 1rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.3s;
        }

        .plan-btn.primary {
          background: #10b981;
          color: white;
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }

        .plan-btn.primary:hover {
          background: #059669;
          transform: translateY(-2px);
        }

        .plan-btn.secondary {
          background: var(--bg-secondary);
          color: var(--text-primary);
          border: 1px solid var(--border-color);
        }

        .plan-btn.secondary:hover {
          background: var(--border-color);
          transform: translateY(-2px);
        }

        /* --- Security --- */
        .security-section {
          padding: 100px 0;
          background: var(--bg-secondary);
        }

        .security-box {
          background: var(--card-bg);
          border: 1px solid var(--border-color);
          border-radius: 40px;
          padding: 100px 40px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }

        .security-icon-large {
          width: 100px;
          height: 100px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 40px;
        }

        .security-badges {
          display: flex;
          justify-content: center;
          gap: 24px;
          margin-top: 48px;
        }

        .badge-s {
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--text-secondary);
          padding: 8px 16px;
          border: 1px solid var(--border-color);
          border-radius: 8px;
        }

        /* --- Footer --- */
        .noir-footer {
          padding: 100px 0 0;
          border-top: 1px solid var(--border-color);
        }

        .footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 100px;
          margin-bottom: 80px;
        }

        .footer-brand p {
          color: var(--text-secondary);
          margin-top: 24px;
          font-size: 1.1rem;
        }

        .footer-links {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }

        .link-col h5 {
          font-weight: 800;
          margin-bottom: 24px;
          color: var(--text-primary);
        }

        .link-col a {
          display: block;
          color: var(--text-secondary);
          text-decoration: none;
          margin-bottom: 12px;
          font-size: 0.9rem;
          transition: color 0.3s;
        }

        .link-col a:hover { color: var(--text-primary); }

        .footer-bottom {
          padding: 40px 0;
          border-top: 1px solid var(--border-color);
          color: var(--text-secondary);
          font-size: 0.85rem;
          text-align: center;
        }

        @media (max-width: 1200px) {
          .hero-visual { padding-left: 0; }
          .c1 { left: -40px; }
          .c2 { right: -20px; }
        }

        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; text-align: center; }
          .hero-description { margin-inline: auto; }
          .hero-btns { justify-content: center; }
          .hero-stats { justify-content: center; }
          .hero-visual { display: none; }
          .intel-grid { grid-template-columns: 1fr; }
          .bento-grid { grid-template-columns: repeat(2, 1fr); }
          .item-large, .item-medium, .item-small, .item-wide { grid-column: span 2; grid-row: auto; }
          .modules-wrap { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .pricing-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .hero-title { font-size: 3.5rem; }
        }
      `}</style>
    </div>
  );
};
