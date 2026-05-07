import React, { useState } from 'react';
import { 
  Activity, 
  Mail, 
  Lock, 
  ArrowRight, 
  ShieldCheck, 
  Globe,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await login(email, password);
    
    if (error) {
      alert(error.message); // In a real app, use a toast
    }
    
    setIsLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-visual">
        <div className="visual-content">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="visual-logo"
          >
            <Activity size={48} color="white" />
          </motion.div>
          <h1 className="visual-title">Elite Pecuária ERP</h1>
          <p className="visual-subtitle">Tecnologia industrial para o agronegócio de alta performance.</p>
          
          <div className="visual-features">
            <div className="feat-item">
              <ShieldCheck size={20} />
              <span>Isolamento Multi-tenant Nível Bancário</span>
            </div>
            <div className="feat-item">
              <Globe size={20} />
              <span>Acesso Global e Sincronização em Tempo Real</span>
            </div>
          </div>
        </div>
        <div className="visual-overlay"></div>
      </div>

      <div className="login-form-container">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="login-box"
        >
          <div className="login-header">
            <h2>Bem-vindo ao Futuro</h2>
            <p>Entre com suas credenciais corporativas.</p>
          </div>

          <form onSubmit={handleSubmit} className="form-content">
            <div className="input-group">
              <label>E-mail Corporativo</label>
              <div className="input-wrapper">
                <Mail size={18} className="input-icon" />
                <input 
                  type="email" 
                  placeholder="exemplo@fazenda.com.br" 
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
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  Acessar Ecossistema
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>Não tem uma conta? <a href="#">Solicitar demonstração</a></p>
          </div>
        </motion.div>
      </div>

      <style>{`
        .login-page {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          height: 100vh;
          width: 100vw;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
          background: white;
        }

        .login-visual {
          position: relative;
          background: url('https://images.unsplash.com/photo-1544473244-f6895a69ad41?q=80&w=2070&auto=format&fit=crop') center/cover;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px;
          color: white;
        }

        .visual-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(5, 46, 22, 0.95) 0%, rgba(5, 46, 22, 0.7) 100%);
        }

        .visual-content {
          position: relative;
          z-index: 10;
          max-width: 500px;
        }

        .visual-logo {
          width: 80px;
          height: 80px;
          background: var(--primary);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        .visual-title {
          font-size: 3rem;
          font-weight: 900;
          line-height: 1.1;
          margin-bottom: 16px;
          font-family: 'Outfit', sans-serif;
        }

        .visual-subtitle {
          font-size: 1.25rem;
          opacity: 0.8;
          margin-bottom: 48px;
        }

        .visual-features {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .feat-item {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 0.9375rem;
          font-weight: 600;
        }

        .login-form-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f8fafc;
        }

        .login-box {
          width: 100%;
          max-width: 440px;
          padding: 48px;
          background: white;
          border-radius: 32px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.05);
        }

        .login-header h2 {
          font-size: 1.75rem;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 8px;
        }

        .login-header p {
          color: #64748b;
          font-size: 0.9375rem;
        }

        .form-content {
          margin-top: 40px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: #334155;
        }

        .label-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .forgot-link {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .input-wrapper input {
          width: 100%;
          padding: 14px 16px 14px 48px;
          background: #f1f5f9;
          border: 2px solid transparent;
          border-radius: 12px;
          font-size: 0.9375rem;
          transition: all 0.2s;
        }

        .input-wrapper input:focus {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
          outline: none;
        }

        .login-btn {
          width: 100%;
          background: var(--primary);
          color: white;
          padding: 16px;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s;
          margin-top: 12px;
        }

        .login-btn:hover {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 10px 20px rgba(16, 185, 129, 0.2);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 16px;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
        }

        .login-footer a {
          font-weight: 700;
          color: var(--primary);
        }

        @media (max-width: 1024px) {
          .login-page { grid-template-columns: 1fr; }
          .login-visual { display: none; }
        }
      `}</style>
    </div>
  );
};
