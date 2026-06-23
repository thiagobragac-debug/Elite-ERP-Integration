import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useSystemSettings } from '../../../contexts/SystemSettingsContext';

// ─── TAUZE SVG LOGO ──────────────────────────────────────────────────────────
export const TauzeLogo: React.FC<{ size?: number; color?: string }> = ({
  size = 32,
  color = '#00b865',
}) => {
  const { settings } = useSystemSettings();
  
  if (settings.logo_base64) {
    return (
      <img 
        src={settings.logo_base64} 
        alt="Logo do Sistema" 
        style={{ width: size, height: size, objectFit: 'contain' }} 
      />
    );
  }

  return (
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
};

// ─── SPARKLINE MINI CHART ─────────────────────────────────────────────────────
const MiniSparkline: React.FC<{ data: number[]; color?: string }> = ({
  data,
  color = '#00b865',
}) => {
  const max = Math.max(...data),
    min = Math.min(...data);
  const range = max - min || 1;
  const w = 80,
    h = 32;
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
};

// ─── FLOATING METRIC CARD ────────────────────────────────────────────────────
const FloatCard: React.FC<{
  label: string;
  value: string;
  spark: number[];
  color: string;
  change: string;
  style?: React.CSSProperties;
}> = ({ label, value, spark, color, change, style }) => (
  <div
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: 20,
      padding: '18px 20px',
      backdropFilter: 'blur(20px)',
      minWidth: 200,
      ...style,
    }}
  >
    <div
      style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.45)',
        fontWeight: 700,
        letterSpacing: '0.06em',
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <MiniSparkline data={spark} color={color} />
      <span
        style={{
          fontSize: 11,
          fontWeight: 800,
          color,
          background: `${color}18`,
          padding: '3px 8px',
          borderRadius: 6,
        }}
      >
        {change}
      </span>
    </div>
  </div>
);

interface HeroSectionProps {
  scrolled: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ scrolled }) => {
  const { settings } = useSystemSettings();
  
  return (
    <>
      {/* ──── NAVBAR ──── */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          background: scrolled ? 'rgba(8,13,20,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(24px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
          transition: 'all 0.4s ease',
          padding: '0 40px',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 40,
                height: 40,
                background: 'rgba(var(--brand-rgb, 0,184,101), 0.12)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(var(--brand-rgb, 0,184,101), 0.2)',
                overflow: 'hidden'
              }}
            >
              {settings.logo_base64 ? (
                <img src={settings.logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              ) : (
                <TauzeLogo size={22} color="var(--brand)" />
              )}
            </div>
            <div>
              <div
                style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}
              >
                {settings.system_name}
              </div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.1em',
                  marginTop: -2,
                }}
              >
                SISTEMA DE GESTÃO
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {[
              ['Módulos', '#modulos'],
              ['Demonstrativo', '#demo'],
              ['Resultados', '#resultados'],
              ['Planos', '#planos'],
              ['FAQ', '#faq'],
            ].map(([l, h]) => (
              <a key={l} href={h} className="nav-link">
                {l}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: 13 }}
            >
              Teste Gratuito
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO ──── */}
      <header
        style={{
          position: 'relative',
          minHeight: '92vh',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        {/* background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '5%',
              width: 700,
              height: 700,
              background: 'radial-gradient(circle, rgba(0,184,101,0.12) 0%, transparent 65%)',
              animation: 'glow-pulse 6s ease-in-out infinite',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-5%',
              right: '10%',
              width: 600,
              height: 600,
              background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)',
              animation: 'glow-pulse 8s ease-in-out infinite 2s',
            }}
          />
          {/* Grid pattern */}
          <svg
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}
          >
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            padding: '80px 40px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 80,
            alignItems: 'center',
            width: '100%',
          }}
        >
          {/* Left */}
          <div>
            <div
              className="fade-up"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(0,184,101,0.1)',
                border: '1px solid rgba(0,184,101,0.2)',
                borderRadius: 100,
                padding: '6px 14px',
                marginBottom: 28,
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
                style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.06em' }}
              >
                ERP RURAL NATIVO DO CAMPO
              </span>
            </div>

            <h1
              className="fade-up d1"
              style={{
                fontSize: 'clamp(32px, 4.5vw, 62px)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.03em',
                marginBottom: 24,
              }}
            >
              {settings.landing_hero_title}
            </h1>

            <p
              className="fade-up d2"
              style={{
                fontSize: 17,
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.75,
                marginBottom: 36,
                maxWidth: 480,
              }}
            >
              {settings.landing_hero_subtitle}
            </p>

            <div
              className="fade-up d3"
              style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}
            >
              <Link to="/cadastro" className="btn-primary">
                <span>{settings.landing_hero_cta}</span>
                <span style={{ fontSize: 18 }}>→</span>
              </Link>
              <Link to="/login" className="btn-ghost">
                <span>Acessar o ERP</span>
              </Link>
            </div>

            <div className="fade-up d4" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {[
                'Sem fidelidade',
                'Suporte em PT-BR',
                'Funciona offline',
                'Implantação em 7 dias',
              ].map((f) => (
                <div
                  key={f}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.5)',
                    fontWeight: 600,
                  }}
                >
                  <span style={{ color: '#00b865', fontSize: 16 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div style={{ position: 'relative', height: 520 }}>
            <div
              style={{
                position: 'absolute',
                top: 20,
                left: 0,
                animation: 'float-a 5s ease-in-out infinite',
              }}
            >
              <FloatCard
                label="REBANHO ATIVO"
                value="4.820 cab."
                spark={[42, 44, 41, 45, 48, 47, 49, 52, 51, 54]}
                color="#00b865"
                change="+3,2%"
              />
            </div>
            <div
              style={{
                position: 'absolute',
                top: 160,
                right: 0,
                animation: 'float-b 6s ease-in-out infinite',
              }}
            >
              <FloatCard
                label="GMD MÉDIO DO LOTE"
                value="1,42 kg/dia"
                spark={[1.1, 1.2, 1.15, 1.25, 1.3, 1.28, 1.35, 1.4, 1.38, 1.42]}
                color="#3b82f6"
                change="▲ Meta ✓"
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 60,
                left: 20,
                animation: 'float-a 7s ease-in-out infinite 1s',
              }}
            >
              <FloatCard
                label="CAIXA CONSOLIDADO"
                value="R$ 2,4M"
                spark={[1.8, 1.9, 1.85, 2.0, 2.1, 2.05, 2.2, 2.3, 2.35, 2.4]}
                color="#8b5cf6"
                change="+12% mês"
              />
            </div>
            <div
              style={{
                position: 'absolute',
                bottom: 10,
                right: 20,
                animation: 'float-b 5.5s ease-in-out infinite 0.5s',
              }}
            >
              <FloatCard
                label="CONSUMO DIESEL"
                value="14,8 L/h"
                spark={[15.2, 14.9, 15.1, 14.8, 14.6, 14.9, 14.7, 14.8, 14.9, 14.8]}
                color="#f59e0b"
                change="Eficiente"
              />
            </div>
            {/* ── ORB CENTRAL entre os floating cards ── */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 120,
                height: 120,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Glow radial pulsante */}
              <div
                style={{
                  position: 'absolute',
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(0,184,101,0.22) 0%, transparent 70%)',
                  animation: 'glow-pulse 3s ease-in-out infinite',
                }}
              />
              {/* Anel externo girando */}
              <div
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 110,
                  borderRadius: '50%',
                  border: '1.5px solid rgba(0,184,101,0.3)',
                  animation: 'spin-slow 16s linear infinite',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: -5,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: '#00b865',
                    boxShadow: '0 0 14px #00b865, 0 0 30px rgba(0,184,101,0.7)',
                  }}
                />
              </div>
              {/* Anel médio contra-giro */}
              <div
                style={{
                  position: 'absolute',
                  width: 82,
                  height: 82,
                  borderRadius: '50%',
                  border: '1px dashed rgba(0,184,101,0.2)',
                  animation: 'spin-slow 11s linear infinite reverse',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    bottom: -4,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#3b82f6',
                    boxShadow: '0 0 10px #3b82f6, 0 0 20px rgba(59,130,246,0.5)',
                  }}
                />
              </div>
              {/* Badge com logo Tauze */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 2,
                  width: 60,
                  height: 60,
                  borderRadius: 18,
                  background: 'rgba(6,10,18,0.95)',
                  border: '1.5px solid rgba(0,184,101,0.45)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 40px rgba(0,184,101,0.3), inset 0 0 24px rgba(0,184,101,0.06)',
                  backdropFilter: 'blur(20px)',
                }}
              >
                <TauzeLogo size={32} />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};
