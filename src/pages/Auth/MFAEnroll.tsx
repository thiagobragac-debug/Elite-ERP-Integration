import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Smartphone, 
  CheckCircle2, 
  Copy, 
  ArrowRight,
  ShieldAlert,
  Loader2,
  Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const MFAEnroll: React.FC = () => {
  const { user, setAal } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'intro' | 'qr' | 'verify' | 'success'>('intro');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already enrolled
    const checkEnrollment = async () => {
      try {
        console.log("MFAEnroll: Checking existing factors...");
        const { data, error } = await supabase.auth.mfa.listFactors();
        if (error) throw error;

        if (data?.totp && data.totp.length > 0) {
          const verified = data.totp.find(f => f.status === 'verified');
          if (verified) {
            console.log("MFAEnroll: Verified factor found, checking AAL...");
            const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
            if (aalData?.currentLevel === 'aal2') {
              console.log("MFAEnroll: Already AAL2, redirecting to home.");
              navigate('/');
            } else {
              console.log("MFAEnroll: Verified but AAL1, going to verify step.");
              setStep('verify');
              setFactorId(verified.id);
            }
          } else {
            // Unverified factor exists. Let's offer to use it or just start fresh if we can.
            console.log("MFAEnroll: Unverified factor found.");
            // For simplicity, we'll let the user click 'Configurar Agora' which will create a new one
            // Or we could auto-resume if we had the secret.
          }
        }
      } catch (err: any) {
        console.error("MFAEnroll: Error checking enrollment:", err);
        setError(`Erro ao verificar status: ${err.message || 'Falha na conexão com Supabase'}`);
      }
    };
    checkEnrollment();
  }, [navigate]);

  const startEnrollment = async () => {
    setLoading(true);
    setError(null);
    console.log("MFAEnroll: Starting enrollment process...");
    
    // Safety timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError("A conexão está demorando mais que o esperado. Tente novamente.");
      }
    }, 15000);

    try {
      // Cleanup: Check if there are ANY unverified factors and remove them all to avoid friendlyName conflicts
      const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
      if (listError) console.warn("MFAEnroll: Error listing factors:", listError);
      
      const unverifiedFactors = factors?.totp?.filter(f => (f.status as string) === 'unverified') || [];
      if (unverifiedFactors.length > 0) {
        console.log(`MFAEnroll: Found ${unverifiedFactors.length} unverified factors, removing all...`);
        for (const factor of unverifiedFactors) {
          try {
            await supabase.auth.mfa.unenroll({ factorId: factor.id });
          } catch (e) {
            console.warn(`MFAEnroll: Failed to unenroll factor ${factor.id}:`, e);
          }
        }
      }

      // Pattern Diamond Precision 5.0: Using a slightly more unique friendly name to avoid race condition conflicts
      // but keeping it recognizable for the user's authenticator app.
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Tauze ERP',
        friendlyName: `${user?.email || 'User Account'} (${new Date().toLocaleDateString('pt-BR')})`
      });

      clearTimeout(timeoutId);

      if (error) {
        console.error("MFAEnroll: Enrollment error:", error);
        // If it still fails due to duplicate name, try one last time with a timestamp
        if (error.message?.includes('already exists')) {
          const retry = await supabase.auth.mfa.enroll({
            factorType: 'totp',
            issuer: 'Tauze ERP',
            friendlyName: `${user?.email || 'User'} [${Math.floor(Date.now() / 1000)}]`
          });
          if (retry.error) throw retry.error;
          setFactorId(retry.data.id);
          setQrCode(retry.data.totp.qr_code);
          setSecret(retry.data.totp.secret);
          setStep('qr');
          return;
        }
        throw error;
      }

      console.log("MFAEnroll: Enrollment initiated:", data.id);
      setFactorId(data.id);
      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setStep('qr');
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao iniciar configuração.");
    } finally {
      setLoading(false);
      clearTimeout(timeoutId);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;
    if (!factorId) {
      setError('Sessão de configuração não encontrada. Por favor, reinicie o processo.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log("MFAEnroll: Challenging factor", factorId);
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      console.log("MFAEnroll: Verifying challenge", challengeData.id);
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode
      });

      if (verifyError) {
        console.error("MFAEnroll: Verification error:", verifyError);
        throw verifyError;
      }

      setStep('success');
      if (setAal) setAal('aal2');
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      console.error("MFAEnroll: Verify exception:", err);
      setError(err.message === 'Invalid OTP' || err.message?.includes('invalid') 
        ? 'Código incorreto ou expirado. Verifique se o horário do seu celular está correto e use o código mais recente.' 
        : `Erro na validação: ${err.message || 'Tente novamente'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast here
  };

  return (
    <div className="mfa-enroll-page">
      <div className="mfa-bg">
        <div className="glow" />
      </div>

      <div className="mfa-container">
        <AnimatePresence mode="wait">
          {step === 'intro' && (
            <motion.div 
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mfa-card"
            >
              <div className="icon-badge">
                <ShieldCheck size={32} />
              </div>
              <h1>Segurança Administrativa</h1>
              <p>O Tauze ERP exige autenticação multifatorial para todas as contas com privilégios de administrador. Proteja o acesso à infraestrutura agora.</p>
              
              <div className="feature-list">
                <div className="feature-item">
                  <Smartphone size={20} />
                  <span>Use Google Authenticator ou Authy</span>
                </div>
                <div className="feature-item">
                  <Lock size={20} />
                  <span>Proteção contra acesso não autorizado</span>
                </div>
              </div>

              {error && <div className="mfa-error">{error}</div>}

              <button className="mfa-btn-primary" onClick={startEnrollment} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : <>Configurar Agora <ArrowRight size={18} /></>}
              </button>
            </motion.div>
          )}

          {step === 'qr' && (
            <motion.div 
              key="qr"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="mfa-card"
            >
              <h2>Escaneie o QR Code</h2>
              <p>Abra seu app de autenticação e escaneie o código abaixo para vincular sua conta.</p>
              
              <div className="qr-wrapper">
                <img src={qrCode} alt="QR Code" />
              </div>

              <div className="manual-secret">
                <span className="label">Ou insira o código manualmente:</span>
                <div className="secret-box">
                  <code>{secret}</code>
                  <button onClick={() => copyToClipboard(secret)} title="Copiar">
                    <Copy size={16} />
                  </button>
                </div>
              </div>

              <button className="mfa-btn-primary" onClick={() => setStep('verify')}>
                Próximo Passo <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 'verify' && (
            <motion.div 
              key="verify"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="mfa-card"
            >
              <div className="icon-badge alt">
                <ShieldAlert size={32} />
              </div>
              <h2>Verificar Código</h2>
              <p>Insira o código de 6 dígitos gerado pelo seu aplicativo para confirmar a configuração.</p>

              <div className="verify-input-group">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  autoFocus
                />
              </div>

              {error && <div className="mfa-error">{error}</div>}

              <div className="verify-actions">
                <button className="mfa-btn-primary" onClick={handleVerify} disabled={loading || verifyCode.length !== 6}>
                  {loading ? <Loader2 className="animate-spin" /> : 'Verificar e Ativar'}
                </button>
                <button className="mfa-btn-ghost" onClick={() => setStep('intro')} disabled={loading}>
                  Reiniciar Configuração
                </button>
              </div>
              
              <p className="mfa-hint">Dica: Se o código for rejeitado, remova contas antigas do "Tauze ERP" no seu app e escaneie o QR Code novamente.</p>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mfa-card success"
            >
              <div className="success-badge">
                <CheckCircle2 size={48} />
              </div>
              <h2>Segurança Ativada</h2>
              <p>Sua conta agora está protegida com autenticação em duas etapas. Redirecionando...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .mfa-enroll-page {
          min-height: 100vh;
          width: 100vw;
          background: #0f172a;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-family: 'Inter', sans-serif;
          position: fixed;
          top: 0;
          left: 0;
          z-index: 9999;
        }

        .mfa-bg {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
          overflow: hidden;
        }

        .mfa-bg .glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80vw;
          height: 80vw;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.05) 0%, transparent 70%);
        }

        .mfa-container {
          position: relative;
          width: 100%;
          max-width: 480px;
          padding: 24px;
        }

        .mfa-card {
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 32px;
          padding: 48px;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .icon-badge {
          width: 80px;
          height: 80px;
          margin: 0 auto 32px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .icon-badge.alt {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }

        h1, h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-bottom: 16px;
          letter-spacing: -0.02em;
        }

        p {
          color: #94a3b8;
          line-height: 1.6;
          margin-bottom: 32px;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 40px;
          text-align: left;
        }

        .feature-item {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #cbd5e1;
          font-size: 0.95rem;
        }

        .feature-item svg {
          color: #10b981;
        }

        .qr-wrapper {
          background: white;
          padding: 16px;
          border-radius: 20px;
          width: fit-content;
          margin: 0 auto 32px;
        }

        .qr-wrapper img {
          width: 200px;
          height: 200px;
        }

        .manual-secret {
          margin-bottom: 32px;
          text-align: left;
        }

        .manual-secret .label {
          display: block;
          font-size: 0.8rem;
          color: #64748b;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .secret-box {
          background: rgba(0, 0, 0, 0.2);
          padding: 12px 16px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .secret-box code {
          color: #10b981;
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.1rem;
        }

        .secret-box button {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          transition: color 0.2s;
        }

        .secret-box button:hover {
          color: white;
        }

        .verify-input-group input {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border: 2px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 20px;
          font-size: 2.5rem;
          text-align: center;
          letter-spacing: 0.5em;
          color: white;
          font-weight: 700;
          margin-bottom: 24px;
          transition: all 0.2s;
        }

        .verify-input-group input:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .mfa-error {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          padding: 12px;
          border-radius: 12px;
          font-size: 0.9rem;
          margin-bottom: 24px;
        }

        .mfa-btn-primary {
          width: 100%;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 16px;
          padding: 18px;
          font-size: 1.1rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s;
          box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);
        }

        .mfa-btn-primary:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 15px 30px -8px rgba(16, 185, 129, 0.4);
        }

        .mfa-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .mfa-btn-ghost {
          width: 100%;
          background: transparent;
          color: #94a3b8;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 14px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          margin-top: 12px;
          transition: all 0.2s;
        }

        .mfa-btn-ghost:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.05);
          color: white;
        }

        .mfa-hint {
          font-size: 0.8rem;
          margin-top: 24px;
          color: #64748b;
          font-style: italic;
        }

        .verify-actions {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .success-badge {
          width: 100px;
          height: 100px;
          margin: 0 auto 32px;
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .success h2 { color: #10b981; }
      `}</style>
    </div>
  );
};
