import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Zap, 
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
  Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-diamond-v8">
      {/* --- Minimalist Nav --- */}
      <nav className={`nav-v8 ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container-v8">
          <div className="logo-v8">
            <div className="logo-icon-v8"><Zap size={18} fill="currentColor" /></div>
            <div className="logo-text-v8">
              <span className="brand">ELITE ERP</span>
              <span className="version">DIAMOND 5.0</span>
            </div>
          </div>
          
          <div className="nav-links-v8">
            <a href="#solucoes">Soluções</a>
            <a href="#tecnologia">Tecnologia</a>
            <a href="#sobre">Sobre</a>
          </div>

          <div className="nav-cta-v8">
            <Link to="/login" className="btn-v8-terminal">
              <Terminal size={14} />
              Acessar
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section (The Diamond Air) --- */}
      <section className="hero-v8">
        <div className="hero-bg-v8">
          <div className="dot-grid-v8"></div>
        </div>

        <div className="container-v8 hero-grid-v8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hero-text-v8"
          >
            <div className="pre-title-v8">
              <Sparkles size={14} />
              <span>PRECISÃO AGROINDUSTRIAL</span>
            </div>
            <h1>
              Soberania Digital <br/>
              <span>para a Pecuária.</span>
            </h1>
            <p>
              O sistema de gestão mais avançado para produtores de elite. 
              Clareza total, dados em tempo real e eficiência absoluta.
            </p>
            
            <div className="hero-actions-v8">
              <Link to="/login" className="btn-v8-primary">
                Iniciar Operação
                <ArrowRight size={20} />
              </Link>
              <div className="btn-v8-ghost">
                <div className="play-circle-v8"><Play size={16} fill="currentColor" /></div>
                Assistir Vídeo
              </div>
            </div>

            <div className="hero-metrics-v8">
              <div className="metric-v8">
                <strong>+24%</strong>
                <span>ROI MÉDIO</span>
              </div>
              <div className="metric-v8">
                <strong>99.9%</strong>
                <span>UPTIME</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="hero-visual-v8"
          >
            <div className="visual-stack-v9">
              {/* Dashboard Preview */}
              <motion.div 
                initial={{ x: 50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="dashboard-layer-v9"
              >
                <img src="/dashboard-v9.png" alt="Elite Dashboard" />
              </motion.div>

              {/* Cattle Visual */}
              <motion.div 
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="cattle-layer-v9"
              >
                <img src="/pecuaria-v9.png" alt="Elite Pecuária" />
              </motion.div>

              <div className="floating-card-v8 c1">
                <Activity size={16} color="#10b981" />
                <span>GMD: 0.85kg</span>
              </div>
              <div className="floating-card-v8 c2">
                <ShieldCheck size={16} color="#3b82f6" />
                <span>Pecuária 5.0</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Features Section (Clean Grid) --- */}
      <section className="features-v8" id="solucoes">
        <div className="container-v8">
          <div className="header-v8">
            <span className="label-v8">MÓDULOS DE ELITE</span>
            <h2>O Centro de Comando da sua Fazenda</h2>
          </div>

          <div className="grid-v8">
            <div className="card-v8">
              <div className="icon-v8"><Activity /></div>
              <h3>Pecuária 5.0</h3>
              <p>Manejo biológico com predição de abate e rastreabilidade total.</p>
              <ul className="list-v8">
                <li><CheckCircle2 size={14} /> GMD Preditivo</li>
                <li><CheckCircle2 size={14} /> Telemetria Satelital</li>
              </ul>
            </div>

            <div className="card-v8">
              <div className="icon-v8"><DollarSign /></div>
              <h3>Financeiro</h3>
              <p>Governança de caixa e auditoria de contratos em tempo real.</p>
              <ul className="list-v8">
                <li><CheckCircle2 size={14} /> DRE Automático</li>
                <li><CheckCircle2 size={14} /> ROI por Lote</li>
              </ul>
            </div>

            <div className="card-v8">
              <div className="icon-v8"><Truck /></div>
              <h3>Máquinas</h3>
              <p>Gestão de ativos móveis, consumo e manutenção técnica.</p>
              <ul className="list-v8">
                <li><CheckCircle2 size={14} /> GPS Ativo</li>
                <li><CheckCircle2 size={14} /> Preventiva Inteligente</li>
              </ul>
            </div>

            <div className="card-v8">
              <div className="icon-v8"><ShieldCheck /></div>
              <h3>Blindagem</h3>
              <p>Criptografia de nível governamental para seus dados operacionais.</p>
              <ul className="list-v8">
                <li><CheckCircle2 size={14} /> AES-256 Bit</li>
                <li><CheckCircle2 size={14} /> ISO 27001</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* --- CTA Section --- */}
      <section className="cta-v8">
        <div className="container-v8">
          <div className="cta-box-v8">
            <h2>Pronto para elevar o nível?</h2>
            <p>Junte-se aos maiores produtores do Brasil com o Diamond 5.0.</p>
            <Link to="/login" className="btn-v8-cta">
              Acessar Painel
              <ChevronRight size={24} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="footer-v8">
        <div className="container-v8">
          <div className="footer-wrap-v8">
            <div className="f-logo-v8">
              <Zap size={20} fill="currentColor" />
              <span>ELITE ERP</span>
            </div>
            <div className="f-meta-v8">
              <span>&copy; 2026 Elite Intelligence</span>
              <div className="divider-v8"></div>
              <span className="v-tag-v8">DIAMOND 5.0</span>
            </div>
          </div>
        </div>
      </footer>

      <style>{`
        .landing-diamond-v8 {
          background: #ffffff;
          color: #1e293b;
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .container-v8 { max-width: 1200px; margin: 0 auto; padding: 0 24px; }

        /* --- Nav --- */
        .nav-v8 {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 90px;
          display: flex;
          align-items: center;
          transition: 0.3s;
        }
        .nav-v8.scrolled {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          height: 70px;
          border-bottom: 1px solid #f1f5f9;
        }

        .nav-container-v8 {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 40px;
        }

        .logo-v8 { display: flex; align-items: center; gap: 12px; }
        .logo-icon-v8 { width: 34px; height: 34px; background: #0f172a; color: #10b981; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .logo-text-v8 { display: flex; flex-direction: column; line-height: 1; }
        .brand { font-family: 'Outfit'; font-weight: 900; font-size: 1.2rem; color: #0f172a; }
        .version { font-size: 0.6rem; font-weight: 900; color: #10b981; letter-spacing: 0.1em; margin-top: 2px; }

        .nav-links-v8 { display: flex; gap: 40px; }
        .nav-links-v8 a { font-size: 0.9rem; font-weight: 700; color: #64748b; transition: 0.2s; }
        .nav-links-v8 a:hover { color: #10b981; }

        .btn-v8-terminal { padding: 10px 24px; background: #0f172a; color: white; border-radius: 100px; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 10px; }

        /* --- Hero --- */
        .hero-v8 { padding: 180px 0 120px; position: relative; background: linear-gradient(to bottom, #f8fafc 0%, #ffffff 100%); }
        .dot-grid-v8 { position: absolute; inset: 0; background-image: radial-gradient(#e2e8f0 1px, transparent 1px); background-size: 40px 40px; opacity: 0.5; }

        .hero-grid-v8 { display: grid; grid-template-columns: 1fr 1.1fr; gap: 60px; align-items: center; position: relative; }

        .pre-title-v8 { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px; background: white; border-radius: 100px; border: 1px solid #e2e8f0; font-size: 0.75rem; font-weight: 900; color: #10b981; margin-bottom: 24px; }
        .hero-text-v8 h1 { font-family: 'Outfit'; font-size: 4.5rem; font-weight: 900; line-height: 1.1; letter-spacing: -0.04em; color: #0f172a; margin-bottom: 24px; }
        .hero-text-v8 h1 span { color: #10b981; }
        .hero-text-v8 p { font-size: 1.25rem; color: #64748b; line-height: 1.6; margin-bottom: 48px; max-width: 500px; }

        .hero-actions-v8 { display: flex; align-items: center; gap: 32px; margin-bottom: 64px; }
        .btn-v8-primary { padding: 20px 40px; background: #10b981; color: white; border-radius: 16px; font-size: 1.1rem; font-weight: 900; display: flex; align-items: center; gap: 12px; box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2); }
        .btn-v8-ghost { display: flex; align-items: center; gap: 12px; font-weight: 800; color: #64748b; cursor: pointer; }
        .play-circle-v8 { width: 44px; height: 44px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 10px 20px rgba(0,0,0,0.05); }

        .hero-metrics-v8 { display: flex; gap: 60px; padding-top: 40px; border-top: 1px solid #f1f5f9; }
        .metric-v8 { display: flex; flex-direction: column; }
        .metric-v8 strong { font-size: 2rem; font-weight: 900; font-family: 'Outfit'; color: #0f172a; }
        .metric-v8 span { font-size: 0.75rem; font-weight: 800; color: #94a3b8; }

        .hero-visual-v8 { position: relative; }
        .visual-stack-v9 { position: relative; width: 100%; height: 500px; display: flex; align-items: center; justify-content: center; }
        
        .dashboard-layer-v9 {
          position: absolute;
          right: 0;
          top: 0;
          width: 90%;
          z-index: 1;
          transform: perspective(2000px) rotateY(-15deg) rotateX(5deg);
        }
        .dashboard-layer-v9 img {
          width: 100%;
          border-radius: 20px;
          box-shadow: 0 40px 80px rgba(0,0,0,0.08);
          border: 1px solid #f1f5f9;
        }

        .cattle-layer-v9 {
          position: absolute;
          left: -40px;
          bottom: -20px;
          width: 70%;
          z-index: 2;
        }
        .cattle-layer-v9 img {
          width: 100%;
          border-radius: 24px;
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.1));
        }

        .floating-card-v8 {
          position: absolute;
          background: white;
          padding: 16px 24px;
          border-radius: 16px;
          border: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 0.8rem;
          box-shadow: 0 20px 40px rgba(0,0,0,0.03);
          z-index: 10;
        }
        .c1 { top: 10%; right: -20px; }
        .c2 { bottom: 10%; right: 20%; }

        /* --- Features --- */
        .features-v8 { padding: 120px 0; }
        .header-v8 { text-align: center; margin-bottom: 80px; }
        .label-v8 { font-size: 0.8rem; font-weight: 900; color: #10b981; letter-spacing: 0.2em; display: block; margin-bottom: 12px; }
        .header-v8 h2 { font-family: 'Outfit'; font-size: 3.5rem; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; }

        .grid-v8 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 30px; }
        .card-v8 { background: #f8fafc; padding: 40px; border-radius: 32px; border: 1px solid transparent; transition: 0.3s; }
        .card-v8:hover { background: white; border-color: #10b981; transform: translateY(-10px); box-shadow: 0 30px 60px rgba(0,0,0,0.05); }
        .icon-v8 { width: 56px; height: 56px; background: white; color: #10b981; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.02); }
        .card-v8 h3 { font-size: 1.6rem; font-weight: 900; margin-bottom: 16px; color: #0f172a; }
        .card-v8 p { font-size: 1rem; color: #64748b; line-height: 1.5; margin-bottom: 24px; }
        .list-v8 { list-style: none; display: flex; flex-direction: column; gap: 12px; }
        .list-v8 li { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; font-weight: 800; color: #475569; }
        .list-v8 li svg { color: #10b981; }

        /* --- CTA --- */
        .cta-v8 { padding: 100px 0; }
        .cta-box-v8 {
          background: #0f172a;
          color: white;
          padding: 100px 40px;
          border-radius: 40px;
          text-align: center;
        }
        .cta-box-v8 h2 { font-family: 'Outfit'; font-size: 4rem; font-weight: 900; margin-bottom: 24px; }
        .cta-box-v8 p { font-size: 1.4rem; color: #94a3b8; margin-bottom: 60px; }
        .btn-v8-cta { background: #10b981; color: white; padding: 22px 60px; border-radius: 16px; font-size: 1.4rem; font-weight: 900; display: inline-flex; align-items: center; gap: 16px; }

        /* --- Footer --- */
        .footer-v8 { padding: 80px 0; border-top: 1px solid #f1f5f9; }
        .footer-wrap-v8 { display: flex; justify-content: space-between; align-items: center; }
        .f-logo-v8 { display: flex; align-items: center; gap: 12px; font-weight: 900; font-family: 'Outfit'; font-size: 1.4rem; }
        .f-meta-v8 { display: flex; align-items: center; gap: 32px; font-size: 0.85rem; font-weight: 800; color: #94a3b8; }
        .divider-v8 { width: 1px; height: 16px; background: #e2e8f0; }
        .v-tag-v8 { color: #10b981; }

        @media (max-width: 1100px) {
          .hero-grid-v8 { grid-template-columns: 1fr; text-align: center; }
          .hero-text-v8 p { margin-inline: auto; }
          .hero-actions-v8 { justify-content: center; }
          .hero-metrics-v8 { justify-content: center; }
          .hero-visual-v8 { display: none; }
          .grid-v8 { grid-template-columns: 1fr 1fr; }
          .nav-links-v8 { display: none; }
        }
      `}</style>
    </div>
  );
};
