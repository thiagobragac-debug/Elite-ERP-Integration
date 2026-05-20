import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  ArrowRight, 
  Loader2,
  Zap,
  ShieldCheck,
  Terminal
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const { error } = await login(email, password);
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err: any) {
       console.error("Login error:", err);
       setErrorMessage("Erro inesperado ao acessar o sistema.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Light Clean Background */}
      <div className="login-bg">
        <div className="glow-top"></div>
        <div className="glow-bottom"></div>
        <div className="grid-overlay"></div>
      </div>

      <div className="login-container">
        <motion.div 
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="clean-card"
        >
          <div className="login-header">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
              className="logo-wrapper"
            >
              <Zap size={28} className="logo-icon" />
            </motion.div>
            <h1 className="title">Elite ERP</h1>
            <p className="subtitle">Autenticação de Nível Executivo</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label>E-mail Corporativo</label>
              <div className="input-wrapper">
                <Mail size={18} className="icon" />
                <input 
                  type="email" 
                  placeholder="admin@elite.com.br" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="input-group">
              <div className="label-row">
                <label>Senha de Acesso</label>
                <a href="#" className="forgot-link">Esqueceu a senha?</a>
              </div>
              <div className="input-wrapper">
                <Lock size={18} className="icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            {errorMessage && (
              <div style={{ padding: '12px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '12px', color: '#dc2626', fontSize: '13px', fontWeight: 600, marginBottom: '16px', textAlign: 'center' }}>
                {errorMessage}
              </div>
            )}

            <button type="submit" className="btn-submit" disabled={isLoading}>
              <span className="btn-content">
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <Terminal size={18} />
                    Acessar Sistema
                    <ArrowRight size={18} className="arrow" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="login-footer">
            <div className="security-badge">
              <ShieldCheck size={14} />
              <span>Conexão Segura AES-256</span>
            </div>
            
            <Link to="/" className="back-link">
              <ArrowRight size={14} className="back-arrow" />
              Voltar para o site
            </Link>
          </div>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800;900&display=swap');

        .login-page {
          min-height: 100vh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          position: fixed;
          top: 0;
          left: 0;
          font-family: 'Inter', sans-serif;
          background: #f8fafc;
          overflow: hidden;
        }

        /* --- Clean Light Background --- */
        .login-bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
        }

        .glow-top {
          position: absolute;
          top: -20%;
          left: -10%;
          width: 60vw;
          height: 60vw;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 60%);
        }

        .glow-bottom {
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 50vw;
          height: 50vw;
          background: radial-gradient(circle, rgba(52, 211, 153, 0.06) 0%, transparent 60%);
        }

        .grid-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
          -webkit-mask-image: radial-gradient(circle at center, black 30%, transparent 80%);
        }

        /* --- Clean White Card --- */
        .login-container {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 440px;
          padding: 24px;
        }

        .clean-card {
          background: #ffffff;
          border: 1px solid rgba(0, 0, 0, 0.04);
          border-radius: 24px;
          padding: 48px 40px;
          box-shadow: 
            0 10px 25px -5px rgba(0, 0, 0, 0.05),
            0 20px 48px -12px rgba(0, 0, 0, 0.05),
            0 0 0 1px rgba(0, 0, 0, 0.02);
        }

        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .logo-wrapper {
          width: 56px;
          height: 56px;
          margin: 0 auto 20px;
          background: #ebfdf5;
          border: 1px solid rgba(16, 185, 129, 0.1);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.1);
        }

        .logo-icon {
          color: #10b981;
        }

        .title {
          font-family: 'Outfit', sans-serif;
          font-size: 2rem;
          font-weight: 800;
          color: #0f172a;
          letter-spacing: -0.03em;
          margin-bottom: 8px;
        }

        .subtitle {
          color: #64748b;
          font-size: 0.95rem;
        }

        /* --- Forms --- */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.85rem;
          font-weight: 600;
          color: #334155;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          font-size: 0.8rem;
          color: #10b981;
          font-weight: 600;
          text-decoration: none;
          transition: color 0.2s;
        }

        .forgot-link:hover {
          color: #059669;
        }

        .input-wrapper {
          position: relative;
        }

        .icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
          transition: color 0.3s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 14px 16px 14px 44px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 0.95rem;
          color: #0f172a;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          outline: none;
          background: #ffffff;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .input-wrapper input:focus ~ .icon {
          color: #10b981;
        }

        .input-wrapper input::placeholder {
          color: #94a3b8;
        }

        /* --- Submit Button --- */
        .btn-submit {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: #10b981;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
        }

        .btn-submit:hover {
          background: #059669;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
        }

        .btn-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
        }

        .arrow {
          transition: transform 0.2s;
        }

        .btn-submit:hover .arrow {
          transform: translateX(4px);
        }

        .btn-submit:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        /* --- Footer --- */
        .login-footer {
          margin-top: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .security-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #f1f5f9;
          border-radius: 100px;
          font-size: 0.75rem;
          color: #475569;
          font-weight: 500;
        }

        .security-badge svg {
          color: #10b981;
        }

        .back-link {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          color: #64748b;
          text-decoration: none;
          transition: color 0.2s;
          font-weight: 500;
        }

        .back-arrow {
          transform: rotate(180deg);
        }

        .back-link:hover {
          color: #0f172a;
        }

        @media (max-width: 480px) {
          .clean-card { padding: 32px 24px; }
          .title { font-size: 1.8rem; }
        }
      `}</style>
    </div>
  );
};
