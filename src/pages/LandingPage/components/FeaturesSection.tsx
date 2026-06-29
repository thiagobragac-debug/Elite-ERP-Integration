import React, { useState, useEffect, useRef } from 'react';
import { useSystemSettings } from '../../../contexts/SystemSettingsContext';

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
const AnimCounter: React.FC<{
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}> = ({ end, suffix = '', prefix = '', duration = 1800 }) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const step = end / (duration / 16);
          const timer = setInterval(() => {
            start = Math.min(start + step, end);
            setVal(Math.round(start));
            if (start >= end) {
              clearInterval(timer);
            }
          }, 16);
          obs.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) {
      obs.observe(ref.current);
    }
    return () => obs.disconnect();
  }, [end, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {val.toLocaleString('pt-BR')}
      {suffix}
    </span>
  );
};

export const FeaturesSection: React.FC = () => {
  const { settings } = useSystemSettings();

  const stats = [
    { label: 'Fazendas Ativas', val: 430, suffix: '+', color: '#00b865' },
    { label: 'Animais Monitorados', val: 280000, suffix: '+', color: '#3b82f6' },
    { label: 'Redução em Planilhas', val: 87, suffix: '%', color: '#8b5cf6' },
    { label: 'Horas Salvas / Mês', val: 240, suffix: 'h', color: '#f59e0b' },
  ];

  const defaultFeatures = [
    {
      icon: '🐄',
      title: 'Bovinocultura & GMD',
      desc: 'Pesagem RFID, lotes, reprodução e previsão de abate com curvas de engorda automáticas',
    },
    {
      icon: '🌱',
      title: 'Agrícola & Solo',
      desc: 'Gestão de talhões, plantios, pulverizações e rendimento físico por safra',
    },
    {
      icon: '🚜',
      title: 'Frota & Diesel',
      desc: 'Telemetria, horímetros, OS automáticas e controle de combustível por máquina',
    },
    {
      icon: '🛒',
      title: 'Compras & Estoque',
      desc: 'Pipeline completo de cotações, aprovação de preços, estoque mínimo e importação de XML',
    },
    {
      icon: '💰',
      title: 'Financeiro & Fluxo',
      desc: 'Contas a pagar/receber, conciliação Open Finance, DRE, EBITDA e custos por @ ou sacas',
    },
    {
      icon: '🛡️',
      title: 'Segurança & Auditoria',
      desc: 'Gestão de acessos por cargos/fazendas, log de auditoria, MFA e bloqueio por IP (System Guard)',
    },
    {
      icon: '📊',
      title: 'BI & Relatórios',
      desc: 'Dashboards executivos dinâmicos, relatórios em PDF/Excel e exportações inteligentes',
    },
    {
      icon: '🌾',
      title: 'LCDPR & Fisco',
      desc: 'Geração automática do Livro Caixa Digital do Produtor Rural e obrigações fiscais agrícolas',
    },
  ];

  const features = settings.landing_features && settings.landing_features.length > 0
    ? settings.landing_features
    : defaultFeatures;

  return (
    <>
      {/* ──── STATS ──── */}
      <section
        id="resultados"
        style={{
          padding: '60px 40px',
          background: 'rgba(0,184,101,0.04)',
          borderTop: '1px solid rgba(0,184,101,0.08)',
          borderBottom: '1px solid rgba(0,184,101,0.08)',
        }}
      >
        <div
          style={{
            maxWidth: 1280,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 2,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '20px 16px',
                borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 44,
                  fontWeight: 900,
                  color: s.color,
                  letterSpacing: '-0.03em',
                  lineHeight: 1,
                }}
              >
                <AnimCounter end={s.val} suffix={s.suffix} />
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'rgba(255,255,255,0.4)',
                  fontWeight: 600,
                  marginTop: 8,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── ALL FEATURES GRID ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#00b865',
                letterSpacing: '0.1em',
                marginBottom: 14,
              }}
            >
              MÓDULOS DO SISTEMA
            </div>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 46px)',
                fontWeight: 900,
                letterSpacing: '-0.03em',
                marginBottom: 16,
              }}
            >
              Uma plataforma.
              <br />
              Todos os processos do campo.
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'rgba(255,255,255,0.45)',
                maxWidth: 520,
                margin: '0 auto',
                lineHeight: 1.7,
              }}
            >
              Do preparo do solo ao extrato bancário, 8 módulos integrados em um fluxo contínuo para
              a operação rural.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};
