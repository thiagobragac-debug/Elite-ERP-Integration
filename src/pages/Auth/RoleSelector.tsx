import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

// ─── Tauze SVG Logo ────────────────────────────────────────────────────────────
const TauzeLogo: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#00b865' }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d="M 46,75 C 46,63 45,42 42,34 C 38,24 28,18 12,21 C 6,22 2,25 0,27 C 4,21 12,13 26,13 C 40,13 46,24 46,41 L 46,75 Z" fill={color} />
    <path d="M 54,75 C 54,63 55,42 58,34 C 62,24 72,18 88,21 C 94,22 98,25 100,27 C 96,21 88,13 74,13 C 60,13 54,24 54,41 L 54,75 Z" fill={color} />
  </svg>
);

export const RoleSelector: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState<'erp' | 'saas' | null>(null);
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setEntered(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleChoice = (destination: 'erp' | 'saas') => {
    if (destination === 'erp') {
      // Vai direto para o dashboard executivo, evitando loop em '/'
      navigate('/pecuaria/dashboard', { replace: true });
    } else {
      navigate('/saas/tenants', { replace: true });
    }
  };

  const firstName = user?.name?.split(' ')[0] || 'Admin';
  const avatarInitial = firstName[0]?.toUpperCase() || 'A';

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      background: '#080d14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      position: 'fixed',
      inset: 0,
      overflow: 'hidden',
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }

        @keyframes glow-pulse { 0%,100%{opacity:.3} 50%{opacity:.6} }
        @keyframes fade-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

        .role-card {
          position: relative;
          border-radius: 24px;
          padding: 36px 32px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.16,1,0.3,1);
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.03);
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 280px;
          text-align: left;
          outline: none;
          overflow: hidden;
        }
        .role-card:hover {
          transform: translateY(-6px);
          border-color: rgba(255,255,255,0.15);
          background: rgba(255,255,255,0.055);
        }
        .role-card.erp:hover {
          border-color: rgba(0,184,101,0.4);
          box-shadow: 0 20px 60px rgba(0,184,101,0.15), 0 0 0 1px rgba(0,184,101,0.15);
        }
        .role-card.saas:hover {
          border-color: rgba(139,92,246,0.4);
          box-shadow: 0 20px 60px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.15);
        }

        .logout-btn {
          background: none;
          border: 1px solid rgba(255,255,255,0.07);
          color: rgba(255,255,255,0.3);
          padding: 8px 18px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          letter-spacing: 0.04em;
        }
        .logout-btn:hover {
          border-color: rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.6);
        }
      `}</style>

      {/* Background glows */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '-5%', left: '20%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(0,184,101,0.08) 0%, transparent 65%)', animation: 'glow-pulse 6s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '15%', width: 500, height: 500, background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 65%)', animation: 'glow-pulse 8s ease-in-out infinite 2s' }} />
        {/* Grid pattern */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
          <defs><pattern id="g" width="56" height="56" patternUnits="userSpaceOnUse"><path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeWidth="1"/></pattern></defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>
      </div>

      <div style={{
        position: 'relative', zIndex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 48,
        opacity: entered ? 1 : 0,
        transform: entered ? 'none' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          {/* Logo orb */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
            <div style={{ position: 'relative', width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ position: 'absolute', width: 72, height: 72, borderRadius: '50%', background: 'radial-gradient(circle, rgba(0,184,101,0.25) 0%, transparent 70%)', animation: 'glow-pulse 3s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', width: 68, height: 68, borderRadius: '50%', border: '1px solid rgba(0,184,101,0.2)', animation: 'spin-slow 14s linear infinite' }}>
                <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 6, borderRadius: '50%', background: '#00b865', boxShadow: '0 0 10px #00b865' }} />
              </div>
              <div style={{ position: 'relative', width: 52, height: 52, background: 'rgba(6,10,18,0.95)', border: '1.5px solid rgba(0,184,101,0.35)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 28px rgba(0,184,101,0.2)' }}>
                <TauzeLogo size={28} />
              </div>
            </div>
          </div>

          {/* Avatar + saudação */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #00b865, #3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
              {avatarInitial}
            </div>
            <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
              Olá, <span style={{ color: '#fff', fontWeight: 800 }}>{firstName}</span>
            </span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', marginBottom: 8 }}>
            Como deseja acessar?
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
            Sua conta tem acesso a duas áreas do sistema.
          </p>
        </div>

        {/* Cards de seleção */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'stretch' }}>

          {/* Card ERP */}
          <button
            className="role-card erp"
            onClick={() => handleChoice('erp')}
            onMouseEnter={() => setHoveredCard('erp')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Glow interno no hover */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: 'radial-gradient(circle at 50% 0%, rgba(0,184,101,0.08) 0%, transparent 70%)',
              opacity: hoveredCard === 'erp' ? 1 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: hoveredCard === 'erp' ? 'rgba(0,184,101,0.15)' : 'rgba(0,184,101,0.08)',
              border: `1.5px solid ${hoveredCard === 'erp' ? 'rgba(0,184,101,0.4)' : 'rgba(0,184,101,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, transition: 'all 0.3s', flexShrink: 0,
            }}>
              🌾
            </div>

            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', marginBottom: 6, letterSpacing: '-0.02em' }}>
                Acessar ERP
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontWeight: 500 }}>
                Pecuária, frota, finanças,<br />compras e dashboards operacionais
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['Pecuária', 'Frotas', 'Finanças', 'BI'].map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(0,184,101,0.7)', background: 'rgba(0,184,101,0.08)', border: '1px solid rgba(0,184,101,0.15)', padding: '3px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>
                  {t}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: hoveredCard === 'erp' ? '#00b865' : 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 800, transition: 'color 0.3s', letterSpacing: '0.02em' }}>
              <span>Entrar no ERP</span>
              <span style={{ transform: hoveredCard === 'erp' ? 'translateX(4px)' : 'none', transition: 'transform 0.3s', display: 'inline-block' }}>→</span>
            </div>
          </button>

          {/* Divisor */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 4px' }}>
            <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.08em' }}>OU</span>
            <div style={{ width: 1, flex: 1, background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Card SaaS Admin */}
          <button
            className="role-card saas"
            onClick={() => handleChoice('saas')}
            onMouseEnter={() => setHoveredCard('saas')}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* Glow interno no hover */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 24,
              background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)',
              opacity: hoveredCard === 'saas' ? 1 : 0,
              transition: 'opacity 0.3s',
              pointerEvents: 'none',
            }} />

            <div style={{
              width: 52, height: 52, borderRadius: 16,
              background: hoveredCard === 'saas' ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.08)',
              border: `1.5px solid ${hoveredCard === 'saas' ? 'rgba(139,92,246,0.4)' : 'rgba(139,92,246,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, transition: 'all 0.3s', flexShrink: 0,
            }}>
              ⚡
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 17, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>Painel SaaS Admin</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: '#8b5cf6', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', padding: '2px 7px', borderRadius: 6, letterSpacing: '0.06em' }}>SUPER ADMIN</span>
              </div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, fontWeight: 500 }}>
                Tenants, planos, faturamento<br />e saúde global da plataforma
              </div>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {['Tenants', 'Planos', 'Billing', 'Health'].map(t => (
                <span key={t} style={{ fontSize: 10, fontWeight: 700, color: 'rgba(139,92,246,0.7)', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', padding: '3px 8px', borderRadius: 6, letterSpacing: '0.04em' }}>
                  {t}
                </span>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, color: hoveredCard === 'saas' ? '#8b5cf6' : 'rgba(255,255,255,0.25)', fontSize: 12, fontWeight: 800, transition: 'color 0.3s', letterSpacing: '0.02em' }}>
              <span>Entrar no Admin</span>
              <span style={{ transform: hoveredCard === 'saas' ? 'translateX(4px)' : 'none', transition: 'transform 0.3s', display: 'inline-block' }}>→</span>
            </div>
          </button>
        </div>

        {/* Footer */}
        <button className="logout-btn" onClick={logout}>
          Sair da conta
        </button>
      </div>
    </div>
  );
};
