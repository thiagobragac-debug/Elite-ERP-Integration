import React, { useState, useEffect } from 'react';
import { Mail, Lock, ArrowRight, Loader2, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { usePersistentState } from '../../hooks/usePersistentState';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '../../contexts/SystemSettingsContext';

// ─── Tauze SVG Logo ────────────────────────────────────────────────────────────
const TauzeLogo: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#00b865',
}) => (
  <svg
    viewBox="0 0 100 100"
    width={size}
    height={size}
    style={{ display: 'inline-block', flexShrink: 0 }}
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

// ─── Mini Sparkline ────────────────────────────────────────────────────────────
const Sparkline: React.FC<{ data: number[]; color?: string; w?: number; h?: number }> = ({
  data,
  color = '#00b865',
  w = 72,
  h = 28,
}) => {
  const max = Math.max(...data),
    min = Math.min(...data),
    range = max - min || 1;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────────
const KpiCard: React.FC<{
  label: string;
  value: string;
  change: string;
  positive: boolean;
  spark: number[];
  color: string;
}> = ({ label, value, change, positive, spark, color }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 16,
      padding: '16px 18px',
      backdropFilter: 'blur(12px)',
    }}
  >
    <div
      style={{
        fontSize: 10,
        color: 'rgba(255,255,255,0.38)',
        fontWeight: 700,
        letterSpacing: '0.07em',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}
    >
      <div>
        <div
          style={{ fontSize: 22, fontWeight: 900, color: '#fff', lineHeight: 1, marginBottom: 6 }}
        >
          {value}
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 800,
            color: positive ? '#00b865' : '#ef4444',
            background: positive ? 'rgba(0,184,101,0.12)' : 'rgba(239,68,68,0.12)',
            padding: '3px 7px',
            borderRadius: 6,
          }}
        >
          {positive ? '▲' : '▼'} {change}
        </div>
      </div>
      <Sparkline data={spark} color={color} />
    </div>
  </div>
);

// ─── Floating pill ─────────────────────────────────────────────────────────────
const Pill: React.FC<{ icon: string; text: string; delay?: number }> = ({
  icon,
  text,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.8 + delay, duration: 0.5 }}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 100,
      padding: '7px 14px',
      fontSize: 12,
      fontWeight: 700,
      color: 'rgba(255,255,255,0.6)',
      backdropFilter: 'blur(10px)',
    }}
  >
    <span>{icon}</span>
    <span>{text}</span>
  </motion.div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const { login, loginWithGoogle } = useAuth();
  const { settings } = useSystemSettings();
  
  // Track failed attempts
  const [failedAttempts, setFailedAttempts] = usePersistentState('Login_failedAttempts', 0);
  const [blockedUntil, setBlockedUntil] = usePersistentState<number | null>('Login_blockedUntil', null);

  // Animate KPI values slightly over time
  useEffect(() => {
    const t = setInterval(() => setTick((p) => p + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if currently blocked
    if (blockedUntil && Date.now() < blockedUntil) {
      const remainingMinutes = Math.ceil((blockedUntil - Date.now()) / 60000);
      setErrorMessage(`Múltiplas falhas detectadas. Dispositivo bloqueado por segurança. Tente novamente em ${remainingMinutes} minuto(s).`);
      return;
    } else if (blockedUntil && Date.now() >= blockedUntil) {
      // Unblock if time passed
      setBlockedUntil(null);
      setFailedAttempts(0);
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await login(email, password);
      if (error) {
        const newAttempts = failedAttempts + 1;
        setFailedAttempts(newAttempts);

        if (newAttempts >= 3) {
          // Block for 30 minutes
          setBlockedUntil(Date.now() + 30 * 60 * 1000);
          setErrorMessage('System Guard: 3 tentativas falhas. Seu acesso foi temporariamente bloqueado por 30 minutos.');
        } else {
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            setErrorMessage(
              `E-mail ou senha incorretos. Tentativa ${newAttempts}/3.`
            );
          } else {
            setErrorMessage(error.message);
          }
        }
      } else {
        // Success, reset attempts
        setFailedAttempts(0);
        setBlockedUntil(null);
      }
    } catch (err: any) {
      setErrorMessage('Erro inesperado ao acessar o sistema.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMessage(null);
    try {
      const { error } = await loginWithGoogle();
      if (error) {
        setErrorMessage('Falha ao conectar com Google. Tente novamente.');
      }
      // Se ok, o browser redireciona — não precisa de setIsGoogleLoading(false)
    } catch {
      setErrorMessage('Erro inesperado ao conectar com Google.');
      setIsGoogleLoading(false);
    }
  };

  const kpis = settings.login_kpis || [
    {
      label: 'REBANHO ATIVO',
      value: '4.820 cab.',
      change: '+3,2% mês',
      positive: true,
      color: '#00b865',
      spark: [42, 44, 41, 45, 48, 47, 50, 52],
    },
    {
      label: 'GMD MÉDIO DO LOTE',
      value: '1,42 kg/dia',
      change: 'Meta ✓',
      positive: true,
      color: '#3b82f6',
      spark: [1.1, 1.2, 1.15, 1.28, 1.3, 1.35, 1.4, 1.42],
    },
    {
      label: 'CAIXA CONSOLIDADO',
      value: 'R$ 2,4M',
      change: '+12% mês',
      positive: true,
      color: '#8b5cf6',
      spark: [1.8, 1.9, 1.85, 2.0, 2.1, 2.2, 2.35, 2.4],
    },
    {
      label: 'EFICIÊNCIA DIESEL',
      value: '14,8 L/h',
      change: '-2% consumo',
      positive: true,
      color: '#f59e0b',
      spark: [15.4, 15.1, 15.0, 14.9, 14.8, 14.7, 14.8, 14.8],
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        background: '#080d14',
        overflow: 'hidden',
        position: 'fixed',
        inset: 0,
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
import { usePersistentState } from '../../hooks/usePersistentState';
        * { box-sizing: border-box; }

        @keyframes glow-pulse { 0%,100%{opacity:.35} 50%{opacity:.65} }
        @keyframes float-a { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes float-b { 0%,100%{transform:translateY(-6px)} 50%{transform:translateY(4px)} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .login-input {
          width: 100%;
          padding: 14px 16px 14px 46px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 13px;
          font-size: 14px;
          color: #fff;
          outline: none;
          transition: all 0.25s;
          font-family: inherit;
          caret-color: #00b865;
        }
        .login-input::placeholder { color: rgba(255,255,255,0.22); }
        .login-input:focus {
          background: rgba(255,255,255,0.07);
          border-color: rgba(0,184,101,0.45);
          box-shadow: 0 0 0 4px rgba(0,184,101,0.1);
        }
        .login-input:-webkit-autofill,
        .login-input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #0d1a14 inset;
          -webkit-text-fill-color: #fff;
          border-color: rgba(0,184,101,0.45);
        }

        .submit-btn {
          width: 100%;
          padding: 15px;
          border-radius: 13px;
          border: none;
          background: #00b865;
          color: #fff;
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.25s;
          box-shadow: 0 8px 28px rgba(0,184,101,0.3);
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-family: inherit;
        }
        .submit-btn:hover:not(:disabled) {
          background: #00d474;
          transform: translateY(-2px);
          box-shadow: 0 12px 36px rgba(0,184,101,0.4);
        }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .eye-btn {
          position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
          background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.3);
          transition: color 0.2s; display: flex; align-items: center;
        }
        .eye-btn:hover { color: rgba(255,255,255,0.7); }

        @media (max-width: 900px) {
          .left-panel { display: none !important; }
          .right-panel { flex: 1 !important; }
        }

        @keyframes animate-spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .animate-spin { animation: animate-spin 1s linear infinite; }
      `}</style>

      {/* ──── LEFT PANEL — Branding ──── */}
      <div
        className="left-panel"
        style={{
          flex: 1,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 52px',
          overflow: 'hidden',
          borderRight: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {/* Background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-5%',
              width: 600,
              height: 600,
              background: 'radial-gradient(circle, rgba(0,184,101,0.13) 0%, transparent 65%)',
              animation: 'glow-pulse 6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-15%',
              right: '-10%',
              width: 500,
              height: 500,
              background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
              animation: 'glow-pulse 8s ease-in-out infinite 2s',
            }}
          />
          {/* Grid */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}
          >
            <defs>
              <pattern id="grid" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            to="/"
            style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                background: 'rgba(var(--brand-rgb, 0,184,101), 0.1)',
                border: '1px solid rgba(var(--brand-rgb, 0,184,101), 0.2)',
                borderRadius: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {settings.logo_base64 ? (
                <img src={settings.logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <TauzeLogo size={24} color="var(--brand)" />
              )}
            </div>
            <div>
              <div
                style={{ fontSize: 20, fontWeight: 900, color: '#fff', letterSpacing: '-0.04em' }}
              >
                {settings.system_name || 'tauze'}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.08em',
                }}
              >
                SISTEMA DE GESTÃO
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Center — headline + KPIs */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,184,101,0.1)',
                border: '1px solid rgba(0,184,101,0.2)',
                borderRadius: 100,
                padding: '5px 13px',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#00b865',
                  boxShadow: '0 0 8px #00b865',
                }}
              />
              <span
                style={{ fontSize: 10, fontWeight: 800, color: '#00b865', letterSpacing: '0.07em' }}
              >
                DADOS EM TEMPO REAL
              </span>
            </div>

            <h2
              style={{
                fontSize: 'clamp(28px, 3vw, 42px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
                marginBottom: 14,
                color: '#fff',
              }}
            >
              {settings.login_hero_title || 'Bem-vindo de volta à sua operação.'}
            </h2>
            <p
              style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.4)',
                lineHeight: 1.7,
                maxWidth: 380,
                marginBottom: 36,
              }}
            >
              {settings.login_hero_subtitle || 'Acompanhe rebanho, frota, finanças e colheita em tempo real — tudo em um único painel unificado.'}
            </p>
          </motion.div>

          {/* KPI cards grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 8 }}
          >
            {kpis.map((k, i) => (
              <div
                key={i}
                style={{
                  animation:
                    i % 2 === 0
                      ? 'float-a 6s ease-in-out infinite'
                      : 'float-b 7s ease-in-out infinite',
                  animationDelay: `${i * 0.8}s`,
                }}
              >
                <KpiCard {...k} />
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
        >
          <Pill icon="🌐" text="Offline-first" />
          <Pill icon="📡" text="RFID Integrado" delay={0.1} />
          <Pill icon="🏦" text="Open Finance" delay={0.2} />
          <Pill icon="🤖" text="IA Agrobovinocultura" delay={0.3} />
        </motion.div>
      </div>

      {/* ──── RIGHT PANEL — Form ──── */}
      <div
        className="right-panel"
        style={{
          width: 480,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 48px',
          position: 'relative',
        }}
      >
        {/* subtle glow behind form */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(0,184,101,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
            pointerEvents: 'none',
          }}
        />

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          style={{ width: '100%', maxWidth: 380, position: 'relative', zIndex: 1 }}
        >
          {/* Form header */}
          <div style={{ marginBottom: 36 }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              style={{
                width: 52,
                height: 52,
                background: 'rgba(var(--brand-rgb, 0,184,101), 0.1)',
                border: '1px solid rgba(var(--brand-rgb, 0,184,101), 0.22)',
                borderRadius: 15,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 24,
                overflow: 'hidden',
              }}
            >
              {settings.logo_base64 ? (
                <img src={settings.logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <TauzeLogo size={28} color="var(--brand)" />
              )}
            </motion.div>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 900,
                color: '#fff',
                letterSpacing: '-0.03em',
                marginBottom: 6,
              }}
            >
              Acessar o ERP
            </h1>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', lineHeight: 1.6 }}>
              Entre com suas credenciais para continuar
            </p>
          </div>

          {/* ── Botão Google ── */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            style={{
              width: '100%',
              padding: '13px 16px',
              borderRadius: 13,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: isGoogleLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              transition: 'all 0.25s',
              fontFamily: 'inherit',
              opacity: isGoogleLoading ? 0.7 : 1,
              marginBottom: 4,
            }}
            onMouseEnter={(e) => {
              if (!isGoogleLoading) {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
            }}
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              /* Google G icon — SVG inline */
              <svg width="18" height="18" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            <span>{isGoogleLoading ? 'Redirecionando...' : 'Continuar com Google'}</span>
          </button>

          {/* ── Separador ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.25)',
                letterSpacing: '0.06em',
              }}
            >
              OU
            </span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            {/* E-mail */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.5)',
                  letterSpacing: '0.04em',
                }}
              >
                SEU E-MAIL
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                />
                <input
                  id="login-email"
                  type="email"
                  className="login-input"
                  placeholder="seu@email.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <label
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'rgba(255,255,255,0.5)',
                    letterSpacing: '0.04em',
                  }}
                >
                  SENHA DE ACESSO
                </label>
                <a
                  href="#"
                  style={{
                    fontSize: 12,
                    color: '#00b865',
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  Esqueceu?
                </a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{
                    position: 'absolute',
                    left: 15,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'rgba(255,255,255,0.25)',
                  }}
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  className="login-input"
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword((p) => !p)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 12,
                  color: '#f87171',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>⚠</span> {errorMessage}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
              style={{ marginTop: 4 }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div
            style={{
              marginTop: 32,
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 100,
                padding: '7px 16px',
              }}
            >
              <ShieldCheck size={13} style={{ color: '#00b865' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>
                Conexão criptografada AES-256
              </span>
            </div>

            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 13,
                color: 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
                fontWeight: 600,
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) =>
                ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.7)')
              }
              onMouseLeave={(e) =>
                ((e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)')
              }
            >
              ← Voltar para o site
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
