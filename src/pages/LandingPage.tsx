import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

// ─── TAUZE SVG LOGO ──────────────────────────────────────────────────────────
const TauzeLogo: React.FC<{ size?: number; color?: string }> = ({ size = 32, color = '#00b865' }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} style={{ display: 'inline-block', flexShrink: 0 }}>
    <path d="M 46,75 C 46,63 45,42 42,34 C 38,24 28,18 12,21 C 6,22 2,25 0,27 C 4,21 12,13 26,13 C 40,13 46,24 46,41 L 46,75 Z" fill={color} />
    <path d="M 54,75 C 54,63 55,42 58,34 C 62,24 72,18 88,21 C 94,22 98,25 100,27 C 96,21 88,13 74,13 C 60,13 54,24 54,41 L 54,75 Z" fill={color} />
  </svg>
);

// ─── SPARKLINE MINI CHART ─────────────────────────────────────────────────────
const MiniSparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#00b865' }) => {
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const w = 80, h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
};

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
const AnimCounter: React.FC<{ end: number; suffix?: string; prefix?: string; duration?: number }> = ({
  end, suffix = '', prefix = '', duration = 1800
}) => {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const step = end / (duration / 16);
        const timer = setInterval(() => {
          start = Math.min(start + step, end);
          setVal(Math.round(start));
          if (start >= end) clearInterval(timer);
        }, 16);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [end, duration]);
  return <span ref={ref}>{prefix}{val.toLocaleString('pt-BR')}{suffix}</span>;
};

// ─── FLOATING METRIC CARD ────────────────────────────────────────────────────
const FloatCard: React.FC<{ label: string; value: string; spark: number[]; color: string; change: string; style?: React.CSSProperties }> = ({
  label, value, spark, color, change, style
}) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 20,
    padding: '18px 20px',
    backdropFilter: 'blur(20px)',
    minWidth: 200,
    ...style
  }}>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 24, fontWeight: 900, color: '#fff', marginBottom: 8 }}>{value}</div>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <MiniSparkline data={spark} color={color} />
      <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}18`, padding: '3px 8px', borderRadius: 6 }}>{change}</span>
    </div>
  </div>
);

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────────
export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [weighing, setWeighing] = useState(false);
  const [weight, setWeight] = useState(482.4);
  const [purchaseStep, setPurchaseStep] = useState(0);
  const [fuelPct, setFuelPct] = useState(78);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFuelPct(p => p <= 20 ? 95 : p - 1), 4000);
    return () => clearInterval(t);
  }, []);

  const handleWeigh = () => {
    if (weighing) return;
    setWeighing(true);
    const target = 524.8;
    let v = weight;
    const t = setInterval(() => {
      v = v + (target - v) * 0.4;
      setWeight(parseFloat(v.toFixed(1)));
      if (Math.abs(target - v) < 0.2) { setWeight(target); clearInterval(t); setWeighing(false); }
    }, 80);
  };

  const modules = [
    {
      emoji: '🐄', label: 'Pecuária', tag: 'RFID & GMD',
      title: 'Pesagem voluntária com RFID — sem estresse no rebanho',
      desc: 'O animal vai ao bebedouro e o sistema registra o peso automaticamente. Curvas de GMD diárias, previsão de abate e gestão de lotes sem manejo estressante.',
      bullets: ['Pesagem por brinco RFID sem parar o rebanho', 'Cálculo automático de GMD e previsão de abate', 'Gestão de lotes com entrada/saída e histórico completo'],
      color: '#00b865',
      demo: (
        <div>
          <div style={{ background: 'rgba(0,184,101,0.06)', border: '1px solid rgba(0,184,101,0.15)', borderRadius: 16, padding: 20, marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '0.08em', marginBottom: 8 }}>ANTENA RFID — BRINCO IDENTIFICADO</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ color: weighing ? '#f59e0b' : '#00b865' }}>{weight.toFixed(1)}</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>kg</span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>Animal #BR-212 · Lote Pasto B · GMD: +1,22 kg/dia</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[['Peso Entrada', '380 kg'], ['Meta Abate', '520 kg'], ['Dias em Pasto', '118 dias'], ['Previsão Abate', '12/07/2026']].map(([l, v]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          <button onClick={handleWeigh} style={{
            width: '100%', padding: '14px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: weighing ? 'rgba(245,158,11,0.15)' : 'rgba(0,184,101,0.15)',
            color: weighing ? '#f59e0b' : '#00b865',
            fontWeight: 800, fontSize: 13, letterSpacing: '0.04em', transition: 'all 0.3s'
          }}>
            {weighing ? '⚡ Registrando pesagem...' : '📡 Simular Passagem pelo RFID'}
          </button>
        </div>
      )
    },
    {
      emoji: '🚜', label: 'Frota', tag: 'Telemetria',
      title: 'Telemetria de máquinas e controle de diesel em tempo real',
      desc: 'Monitore consumo de combustível, horímetros e alertas de manutenção de toda a frota. Detecta anomalias de diesel e gera ordens de serviço automáticas.',
      bullets: ['Rastreamento GPS e horímetro offline-first', 'Detecção de consumo anômalo de diesel', 'OS automáticas por horimetria — sem agenda manual'],
      color: '#f59e0b',
      demo: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Trator JD 8R #04 — Combustível</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: fuelPct > 30 ? '#00b865' : '#ef4444' }}>{fuelPct}%</span>
            </div>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${fuelPct}%`, background: fuelPct > 30 ? 'linear-gradient(90deg,#00b865,#34d399)' : 'linear-gradient(90deg,#ef4444,#f97316)', borderRadius: 8, transition: 'width 1s ease' }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
            {[['Horimetro', '4.820 h'], ['Consumo', '14,8 L/h'], ['Próx. Revisão', '38 h'], ['Status', 'OPERANDO']].map(([l, v]) => (
              <div key={l} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '12px 14px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 4 }}>{l}</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: l === 'Status' ? '#00b865' : '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>⚠ Alerta Preditivo</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Revisão de filtros de ar em 38h. OS gerada automaticamente.</div>
          </div>
        </div>
      )
    },
    {
      emoji: '💰', label: 'Finanças', tag: 'Conciliação',
      title: 'Conciliação bancária automática via Open Finance',
      desc: 'Conecte seus bancos via API e elimine a conferência manual de extratos. O sistema casa lançamentos automaticamente e aponta divergências em segundos.',
      bullets: ['API com 6 bancos parceiros — BB, Itaú, Bradesco, Sicredi, Cresol, BTG', 'Match automático por valor, data e histórico', 'Relatório de compliance e auditoria completa'],
      color: '#3b82f6',
      demo: (
        <div>
          {[
            { desc: 'BUNGE ALIMENTOS — TED', val: 'R$ 138.500', status: 'paired', date: '22/05' },
            { desc: 'NUTRIEN RURAL — NF 9241', val: '- R$ 58.400', status: 'paired', date: '21/05' },
            { desc: 'DIESEL POSTO CENTRAL', val: '- R$ 12.840', status: 'pending', date: '20/05' },
          ].map((r, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 12, marginBottom: 8
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                background: r.status === 'paired' ? '#00b865' : '#f59e0b',
                boxShadow: r.status === 'paired' ? '0 0 8px #00b86580' : '0 0 8px #f59e0b80'
              }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.desc}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{r.date}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: r.val.startsWith('-') ? '#ef4444' : '#00b865' }}>{r.val}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: r.status === 'paired' ? '#00b865' : '#f59e0b', textAlign: 'right' }}>
                  {r.status === 'paired' ? '✓ CASADO' : '⏳ PENDENTE'}
                </div>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(0,184,101,0.06)', border: '1px solid rgba(0,184,101,0.15)', borderRadius: 12, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Taxa de Conciliação Automática</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#00b865' }}>94,7%</span>
          </div>
        </div>
      )
    },
    {
      emoji: '🛒', label: 'Compras', tag: 'Cotações',
      title: 'Cotações inteligentes sem planilhas manuais',
      desc: 'Da requisição à nota de entrada em um fluxo contínuo. O sistema consulta fornecedores cadastrados, compara preços e gera a ordem de compra aprovada automaticamente.',
      bullets: ['Pipeline: Requisição → Cotação → Aprovação → NF-e entrada', 'Importação automática de XML de NF-e', 'Controle de estoque mínimo com alertas de reposição'],
      color: '#8b5cf6',
      demo: (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['Requisição', 'Cotações', 'Aprovado'].map((s, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: purchaseStep >= i ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                  border: purchaseStep >= i ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.08)',
                  fontSize: 13, fontWeight: 900, color: purchaseStep >= i ? '#fff' : 'rgba(255,255,255,0.2)',
                  transition: 'all 0.4s'
                }}>{i + 1}</div>
                <span style={{ fontSize: 10, fontWeight: 700, color: purchaseStep >= i ? '#fff' : 'rgba(255,255,255,0.2)', textAlign: 'center' }}>{s}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontWeight: 700, marginBottom: 8 }}>FERTILIZANTE NPK — 12 TONELADAS</div>
            {purchaseStep === 0 && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>Aguardando consulta de fornecedores...</div>}
            {purchaseStep >= 1 && (
              <div>
                {[['Nutrien Rural', 'R$ 58.400', true], ['Agropecuária XY', 'R$ 61.200', false]].map(([n, v, best], i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>{n as string} {best ? <span style={{ fontSize: 9, background: '#00b86520', color: '#00b865', padding: '2px 6px', borderRadius: 4 }}>MENOR PREÇO</span> : ''}</div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: best ? '#00b865' : 'rgba(255,255,255,0.4)' }}>{v as string}</div>
                  </div>
                ))}
              </div>
            )}
            {purchaseStep === 2 && <div style={{ fontSize: 13, fontWeight: 800, color: '#00b865', marginTop: 8 }}>✓ Ordem de Compra Gerada — NF-e importada</div>}
          </div>
          <button onClick={() => setPurchaseStep(p => p < 2 ? p + 1 : 0)} style={{
            width: '100%', padding: '13px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: purchaseStep === 2 ? 'rgba(0,184,101,0.15)' : 'rgba(139,92,246,0.15)',
            color: purchaseStep === 2 ? '#00b865' : '#8b5cf6',
            fontWeight: 800, fontSize: 12, letterSpacing: '0.04em'
          }}>
            {purchaseStep === 0 ? '🔍 Buscar Fornecedores' : purchaseStep === 1 ? '✅ Aprovar Menor Preço' : '🔄 Reiniciar Demo'}
          </button>
        </div>
      )
    },
  ];

  const stats = [
    { label: 'Fazendas Ativas', val: 430, suffix: '+', color: '#00b865' },
    { label: 'Animais Monitorados', val: 280000, suffix: '+', color: '#3b82f6' },
    { label: 'Redução em Planilhas', val: 87, suffix: '%', color: '#8b5cf6' },
    { label: 'Horas Salvas / Mês', val: 240, suffix: 'h', color: '#f59e0b' },
  ];

  const faqs = [
    { q: 'O sistema funciona sem internet no campo?', a: 'Sim. O Tauze foi construído offline-first. Todas as pesagens RFID, abastecimentos e registros de campo funcionam sem conexão e sincronizam automaticamente ao retornar ao wi-fi da sede.' },
    { q: 'Como funciona a integração bancária?', a: 'Conectamos via Open Finance com BB, Itaú, Bradesco, Sicredi, Cresol e BTG. O extrato é importado automaticamente e o sistema casa os lançamentos com seu controle interno sem digitação.' },
    { q: 'É possível gerenciar múltiplas fazendas?', a: 'Sim. O painel central consolida todas as unidades num único dashboard executivo. Você pode filtrar por fazenda, ver o agregado do grupo ou comparar desempenho entre propriedades.' },
    { q: 'Quanto tempo leva a implantação?', a: 'A média de go-live completo é de 7 dias úteis. Realizamos a migração dos dados históricos de planilhas, treinamento da equipe e configuração das integrações nesse período.' },
    { q: 'O sistema emite NF-e e documentos fiscais?', a: 'Sim. NF-e, CT-e e MDF-e de forma integrada ao módulo de vendas e compras. A nota é gerada automaticamente no momento da venda ou da entrada de mercadoria, sem necessidade de outro sistema.' },
  ];

  const features = [
    { icon: '🐄', title: 'Pecuária & GMD', desc: 'Pesagem RFID, lotes, reprodução e previsão de abate com curvas de engorda automáticas' },
    { icon: '🌱', title: 'Agrícola & Solo', desc: 'Gestão de talhões, plantios, pulverizações e rendimento físico por safra' },
    { icon: '🚜', title: 'Frota & Diesel', desc: 'Telemetria, horímetros, OS automáticas e controle de combustível por máquina' },
    { icon: '🛒', title: 'Compras & Estoque', desc: 'Cotações multi-fornecedor, controle de almoxarifado e importação de NF-e XML' },
    { icon: '💼', title: 'Vendas & Contratos', desc: 'Gestão de contratos de grãos e gado, NF-e automática e pipeline comercial' },
    { icon: '💰', title: 'Finanças & Conciliação', desc: 'Fluxo de caixa, DRE, contas a pagar/receber e conciliação bancária automática' },
    { icon: '📊', title: 'BI & Custos Reais', desc: 'EBITDA, custo por arroba, DRE por safra e dashboards executivos consolidados' },
    { icon: '🤖', title: 'IA Agropecuária', desc: 'Recomendações de manejo, alertas preditivos e análise de anomalias automatizada' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#080d14', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0d1520; }
        ::-webkit-scrollbar-thumb { background: #00b86540; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #00b865; }

        @keyframes ticker-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes float-a { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes float-b { 0%,100% { transform: translateY(-8px); } 50% { transform: translateY(4px); } }
        @keyframes glow-pulse { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        @keyframes fade-up { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes gradient-shift { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }

        .fade-up { animation: fade-up 0.7s ease both; }
        .d1 { animation-delay: 0.1s; }
        .d2 { animation-delay: 0.2s; }
        .d3 { animation-delay: 0.3s; }
        .d4 { animation-delay: 0.4s; }

        .nav-link { color: rgba(255,255,255,0.55); text-decoration: none; font-size: 14px; font-weight: 600; transition: color 0.2s; }
        .nav-link:hover { color: #00b865; }

        .btn-primary { display: inline-flex; align-items: center; gap: 10px; padding: 15px 32px; background: #00b865; color: #fff; border-radius: 14px; font-weight: 800; font-size: 15px; text-decoration: none; border: none; cursor: pointer; transition: all 0.25s; box-shadow: 0 8px 32px rgba(0,184,101,0.35); letter-spacing: -0.01em; }
        .btn-primary:hover { background: #00d474; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,184,101,0.45); }

        .btn-ghost { display: inline-flex; align-items: center; gap: 8px; padding: 15px 28px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); border-radius: 14px; font-weight: 700; font-size: 15px; text-decoration: none; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.25s; }
        .btn-ghost:hover { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: #fff; transform: translateY(-2px); }

        .glass-card { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 24px; backdrop-filter: blur(20px); }

        .mod-tab { padding: 12px 16px; border-radius: 14px; border: 1px solid transparent; cursor: pointer; transition: all 0.25s; background: transparent; color: rgba(255,255,255,0.45); font-weight: 700; font-size: 13px; display: flex; align-items: center; gap: 10px; text-align: left; width: 100%; }
        .mod-tab:hover { background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.75); }
        .mod-tab.active { background: rgba(0,184,101,0.1); border-color: rgba(0,184,101,0.25); color: #00b865; }

        .faq-item { border-bottom: 1px solid rgba(255,255,255,0.06); }
        .faq-btn { width: 100%; padding: 20px 0; display: flex; justify-content: space-between; align-items: center; cursor: pointer; background: transparent; border: none; color: #fff; font-size: 15px; font-weight: 700; text-align: left; gap: 16px; }
        .faq-answer { font-size: 14px; color: rgba(255,255,255,0.55); line-height: 1.8; padding-bottom: 20px; }

        .stat-card { padding: 32px; border-radius: 24px; text-align: center; position: relative; overflow: hidden; }
        .feature-card { padding: 28px; border-radius: 20px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06); transition: all 0.3s; }
        .feature-card:hover { background: rgba(255,255,255,0.055); border-color: rgba(0,184,101,0.2); transform: translateY(-4px); }
      `}</style>

      {/* ──── COMMODITY TICKER ──── */}
      <div style={{ background: 'rgba(0,184,101,0.07)', borderBottom: '1px solid rgba(0,184,101,0.12)', overflow: 'hidden', height: 36 }}>
        <div style={{ display: 'flex', animation: 'ticker-scroll 28s linear infinite', width: 'max-content', height: '100%', alignItems: 'center' }}>
          {[...Array(2)].map((_, r) => (
            <div key={r} style={{ display: 'flex', gap: 40, paddingRight: 40, alignItems: 'center', height: '100%' }}>
              {[
                ['🐂 BOI GORDO B3', 'R$ 286,40/@', '+0,85%', true],
                ['🌾 SOJA PARANAGUÁ', 'R$ 138,50/sc', '+1,20%', true],
                ['🌽 MILHO B3', 'R$ 68,10/sc', '-0,45%', false],
                ['💵 DÓLAR COMERCIAL', 'R$ 5,13', '-0,28%', false],
                ['🏦 API BANCÁRIA', '6 BANCOS ATIVOS', 'ONLINE', true],
                ['📋 NF-e XML', 'IMPORTAÇÃO AUTOMÁTICA', '✓', true],
              ].map(([label, val, chg, up], i) => (
                <span key={i} style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', whiteSpace: 'nowrap', display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span>{label as string}</span>
                  <span style={{ color: '#fff', fontWeight: 800 }}>{val as string}</span>
                  <span style={{ color: (up as boolean) ? '#00b865' : '#ef4444' }}>{chg as string}</span>
                  <span style={{ color: 'rgba(255,255,255,0.15)', margin: '0 8px' }}>|</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ──── NAVBAR ──── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: scrolled ? 'rgba(8,13,20,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(24px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(255,255,255,0.06)' : '1px solid transparent',
        transition: 'all 0.4s ease',
        padding: '0 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, background: 'rgba(0,184,101,0.12)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,184,101,0.2)' }}>
              <TauzeLogo size={22} />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>tauze</div>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: -2 }}>SISTEMAS DE GESTÃO RURAL</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
            {[['Módulos', '#modulos'], ['Demonstrativo', '#demo'], ['Resultados', '#resultados'], ['FAQ', '#faq']].map(([l, h]) => (
              <a key={l} href={h} className="nav-link">{l}</a>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Link to="/login" className="btn-ghost" style={{ padding: '10px 20px', fontSize: 13 }}>Entrar</Link>
            <a href="#contato" className="btn-primary" style={{ padding: '10px 20px', fontSize: 13 }}>Solicitar Demo</a>
          </div>
        </div>
      </nav>

      {/* ──── HERO ──── */}
      <header style={{ position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* background glows */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-10%', left: '5%', width: 700, height: 700, background: 'radial-gradient(circle, rgba(0,184,101,0.12) 0%, transparent 65%)', animation: 'glow-pulse 6s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', bottom: '-5%', right: '10%', width: 600, height: 600, background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 65%)', animation: 'glow-pulse 8s ease-in-out infinite 2s' }} />
          {/* Grid pattern */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.03 }}>
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '80px 40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center', width: '100%' }}>
          {/* Left */}
          <div>
            <div className="fade-up" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,184,101,0.1)', border: '1px solid rgba(0,184,101,0.2)', borderRadius: 100, padding: '6px 14px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b865', boxShadow: '0 0 8px #00b865' }} />
              <span style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.06em' }}>ERP RURAL NATIVO DO CAMPO</span>
            </div>

            <h1 className="fade-up d1" style={{ fontSize: 'clamp(40px, 5vw, 68px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', marginBottom: 24 }}>
              O ERP que<br />
              <span style={{ background: 'linear-gradient(135deg, #00b865, #34d399, #0ea5e9)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% auto', animation: 'gradient-shift 4s linear infinite' }}>
                o agro merece.
              </span>
            </h1>

            <p className="fade-up d2" style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', lineHeight: 1.75, marginBottom: 36, maxWidth: 480 }}>
              Do RFID no cocho ao balanço bancário — o <strong style={{ color: '#fff' }}>tauze</strong> integra toda a operação da fazenda num único sistema construído para o produtor rural.
            </p>

            <div className="fade-up d3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 48 }}>
              <a href="#contato" className="btn-primary">
                <span>Solicitar Demonstração</span>
                <span style={{ fontSize: 18 }}>→</span>
              </a>
              <Link to="/login" className="btn-ghost">
                <span>Acessar o ERP</span>
              </Link>
            </div>

            <div className="fade-up d4" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {['Sem fidelidade', 'Suporte em PT-BR', 'Funciona offline', 'Implantação em 7 dias'].map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>
                  <span style={{ color: '#00b865', fontSize: 16 }}>✓</span> {f}
                </div>
              ))}
            </div>
          </div>

          {/* Right — floating cards */}
          <div style={{ position: 'relative', height: 520 }}>
            <div style={{ position: 'absolute', top: 20, left: 0, animation: 'float-a 5s ease-in-out infinite' }}>
              <FloatCard label="REBANHO ATIVO" value="4.820 cab." spark={[42,44,41,45,48,47,49,52,51,54]} color="#00b865" change="+3,2%" />
            </div>
            <div style={{ position: 'absolute', top: 160, right: 0, animation: 'float-b 6s ease-in-out infinite' }}>
              <FloatCard label="GMD MÉDIO DO LOTE" value="1,42 kg/dia" spark={[1.1,1.2,1.15,1.25,1.3,1.28,1.35,1.4,1.38,1.42]} color="#3b82f6" change="▲ Meta ✓" />
            </div>
            <div style={{ position: 'absolute', bottom: 60, left: 20, animation: 'float-a 7s ease-in-out infinite 1s' }}>
              <FloatCard label="CAIXA CONSOLIDADO" value="R$ 2,4M" spark={[1.8,1.9,1.85,2.0,2.1,2.05,2.2,2.3,2.35,2.4]} color="#8b5cf6" change="+12% mês" />
            </div>
            <div style={{ position: 'absolute', bottom: 10, right: 20, animation: 'float-b 5.5s ease-in-out infinite 0.5s' }}>
              <FloatCard label="CONSUMO DIESEL" value="14,8 L/h" spark={[15.2,14.9,15.1,14.8,14.6,14.9,14.7,14.8,14.9,14.8]} color="#f59e0b" change="Eficiente" />
            </div>
            {/* ── ORB CENTRAL entre os floating cards ── */}
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 120, height: 120,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {/* Glow radial pulsante */}
              <div style={{
                position: 'absolute', width: 160, height: 160, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(0,184,101,0.22) 0%, transparent 70%)',
                animation: 'glow-pulse 3s ease-in-out infinite',
              }} />
              {/* Anel externo girando */}
              <div style={{
                position: 'absolute', width: 110, height: 110, borderRadius: '50%',
                border: '1.5px solid rgba(0,184,101,0.3)',
                animation: 'spin-slow 16s linear infinite',
              }}>
                <div style={{
                  position: 'absolute', top: -5, left: '50%', transform: 'translateX(-50%)',
                  width: 10, height: 10, borderRadius: '50%',
                  background: '#00b865',
                  boxShadow: '0 0 14px #00b865, 0 0 30px rgba(0,184,101,0.7)',
                }} />
              </div>
              {/* Anel médio contra-giro */}
              <div style={{
                position: 'absolute', width: 82, height: 82, borderRadius: '50%',
                border: '1px dashed rgba(0,184,101,0.2)',
                animation: 'spin-slow 11s linear infinite reverse',
              }}>
                <div style={{
                  position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)',
                  width: 7, height: 7, borderRadius: '50%',
                  background: '#3b82f6',
                  boxShadow: '0 0 10px #3b82f6, 0 0 20px rgba(59,130,246,0.5)',
                }} />
              </div>
              {/* Badge com logo Tauze */}
              <div style={{
                position: 'relative', zIndex: 2,
                width: 60, height: 60, borderRadius: 18,
                background: 'rgba(6,10,18,0.95)',
                border: '1.5px solid rgba(0,184,101,0.45)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(0,184,101,0.3), inset 0 0 24px rgba(0,184,101,0.06)',
                backdropFilter: 'blur(20px)',
              }}>
                <TauzeLogo size={32} />
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ──── STATS ──── */}
      <section id="resultados" style={{ padding: '60px 40px', background: 'rgba(0,184,101,0.04)', borderTop: '1px solid rgba(0,184,101,0.08)', borderBottom: '1px solid rgba(0,184,101,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 2 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', padding: '20px 16px', borderRight: i < 3 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: s.color, letterSpacing: '-0.03em', lineHeight: 1 }}>
                <AnimCounter end={s.val} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginTop: 8 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ──── ALL FEATURES GRID ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>MÓDULOS DO SISTEMA</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Uma plataforma.<br />Todos os processos do campo.
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto', lineHeight: 1.7 }}>
              Do preparo do solo ao extrato bancário, 8 módulos integrados em um fluxo contínuo para a operação rural.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── INTERACTIVE DEMO ──── */}
      <section id="demo" style={{ padding: '100px 40px', background: 'linear-gradient(180deg, transparent, rgba(0,184,101,0.04), transparent)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>DEMONSTRATIVO INTERATIVO</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>
              Experimente antes de contratar
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 480, margin: '0 auto' }}>
              Clique nos módulos abaixo e interaja com a interface real do sistema.
            </p>
          </div>

          <div id="modulos" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
            {/* Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {modules.map((m, i) => (
                <button key={i} className={`mod-tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
                  <span style={{ fontSize: 20 }}>{m.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>{m.label}</div>
                    <div style={{ fontSize: 10, opacity: 0.6, marginTop: 2 }}>{m.tag}</div>
                  </div>
                </button>
              ))}
            </div>

            {/* Console */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* top bar */}
              <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: 7 }}>
                  {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.04em' }}>
                  tauze://erp/{modules[activeTab].label.toLowerCase()}/live
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,184,101,0.1)', border: '1px solid rgba(0,184,101,0.2)', borderRadius: 6, padding: '3px 10px' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00b865', boxShadow: '0 0 6px #00b865' }} />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#00b865', letterSpacing: '0.06em' }}>AO VIVO</span>
                </div>
              </div>

              {/* content */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                {/* Demo pane */}
                <div style={{ padding: 28, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 20 }}>
                    {modules[activeTab].tag.toUpperCase()} — SIMULAÇÃO INTERATIVA
                  </div>
                  {modules[activeTab].demo}
                </div>

                {/* Info pane */}
                <div style={{ padding: 28 }}>
                  <div style={{ display: 'inline-block', fontSize: 10, fontWeight: 800, color: modules[activeTab].color, background: `${modules[activeTab].color}12`, border: `1px solid ${modules[activeTab].color}25`, borderRadius: 8, padding: '4px 10px', marginBottom: 16, letterSpacing: '0.06em' }}>
                    {modules[activeTab].label.toUpperCase()}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, lineHeight: 1.3, marginBottom: 14, letterSpacing: '-0.02em' }}>{modules[activeTab].title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 24 }}>{modules[activeTab].desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {modules[activeTab].bullets.map((b, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
                        <span style={{ color: '#00b865', fontWeight: 900, marginTop: 1, flexShrink: 0 }}>✓</span>
                        <span>{b}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link to="/login" style={{ fontSize: 13, fontWeight: 800, color: modules[activeTab].color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      Ver módulo completo no ERP →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── WORKFLOW SECTION ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>FLUXO INTEGRADO</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 16 }}>Do campo ao balanço em um único fluxo</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', maxWidth: 500, margin: '0 auto' }}>
              Cada operação física alimenta automaticamente o financeiro. Sem redigitação.
            </p>
          </div>

          <div style={{ position: 'relative' }}>
            {/* connector line */}
            <div style={{ position: 'absolute', top: 28, left: 28, right: 28, height: 2, background: 'linear-gradient(90deg, #00b865, #3b82f6, #8b5cf6, #f59e0b)', borderRadius: 2, opacity: 0.3 }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {[
                { step: '01', icon: '🐄', label: 'Campo', desc: 'Pesagem RFID, abastecimentos, colheitas e movimentos físicos registrados no app' },
                { step: '02', icon: '📊', label: 'ERP', desc: 'Dados sincronizados e organizados por módulo: estoque, frota, pecuária, agrícola' },
                { step: '03', icon: '💰', label: 'Financeiro', desc: 'DRE, fluxo de caixa e contas gerados automaticamente a partir das operações' },
                { step: '04', icon: '🤖', label: 'IA + BI', desc: 'Dashboards executivos, alertas preditivos e recomendações baseadas nos seus dados' },
              ].map((s, i) => (
                <div key={i} style={{ position: 'relative', textAlign: 'center', padding: '0 16px' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 18, background: 'rgba(0,184,101,0.1)', border: '1px solid rgba(0,184,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', marginBottom: 6 }}>PASSO {s.step}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#fff', marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.65 }}>{s.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──── WHY TAUZE ──── */}
      <section style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>POR QUE O TAUZE</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 20 }}>
              Construído por quem conhece o campo de perto
            </h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, marginBottom: 36 }}>
              A maioria dos ERPs foi criada para indústrias urbanas e adaptada ao agro com gambiarras. O Tauze nasceu para pecuária e agricultura — com lógicas de lotes, talhões e telemetria de campo no coração do sistema.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                ['Offline-first', 'Funciona sem internet no campo. Sincroniza automaticamente ao voltar à rede.'],
                ['Suporte em português real', 'Time de suporte brasileiro, com conhecimento do dia a dia do produtor rural.'],
                ['Sem telas desnecessárias', 'Interface projetada para o gerente de fazenda usar no celular ou tablet.'],
              ].map(([t, d]) => (
                <div key={t} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,184,101,0.12)', border: '1px solid rgba(0,184,101,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                    <span style={{ color: '#00b865', fontSize: 14, fontWeight: 900 }}>✓</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{t}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[
              { icon: '⚡', title: 'Implantação em 7 dias', desc: 'Migração de dados, treinamento e configuração de integrações incluídos' },
              { icon: '🔒', title: 'Dados 100% seus', desc: 'Backup automático, export completo a qualquer momento' },
              { icon: '📱', title: 'App mobile incluído', desc: 'Android e iOS para uso no campo sem custo adicional' },
              { icon: '🔧', title: 'Suporte sem chatbot', desc: 'Atendimento humano por WhatsApp em horário comercial' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 22 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{c.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── TESTIMONIALS ──── */}
      <section style={{ padding: '100px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>DEPOIMENTOS</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em' }}>O que dizem os produtores</h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
            {[
              { name: 'Carlos Mendes', role: 'Pecuarista · 3.200 cabeças · MS', text: 'A pesagem RFID eliminou o estresse do manejo. Antes perdia 2 arrobas por animal no dia da pesagem. Hoje o sistema registra sozinho toda semana.' },
              { name: 'Adriana Fonseca', role: 'Gestora Agrícola · 8.500 ha · GO', text: 'O controle de diesel foi o que me convenceu. Em 60 dias identificamos um desvio de R$ 38 mil no consumo de combustível que nunca teríamos encontrado em planilha.' },
              { name: 'Roberto Pinheiro', role: 'Produtor Integrado · MT', text: 'A conciliação bancária economizou 3 dias de trabalho do meu financeiro todo mês. O sistema casa os lançamentos automaticamente com uma taxa de 94% de acerto.' },
            ].map((t, i) => (
              <div key={i} className="glass-card" style={{ padding: 28 }}>
                <div style={{ fontSize: 32, color: 'rgba(0,184,101,0.3)', fontWeight: 900, marginBottom: 16, lineHeight: 1 }}>"</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 24 }}>{t.text}</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 18 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FAQ ──── */}
      <section id="faq" style={{ padding: '100px 40px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>PERGUNTAS FREQUENTES</div>
            <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 900, letterSpacing: '-0.03em' }}>Dúvidas comuns</h2>
          </div>

          <div>
            {faqs.map((f, i) => (
              <div key={i} className="faq-item">
                <button className="faq-btn" onClick={() => setFaqOpen(faqOpen === i ? null : i)}>
                  <span>{f.q}</span>
                  <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.3)', flexShrink: 0, transform: faqOpen === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.3s' }}>+</span>
                </button>
                {faqOpen === i && <div className="faq-answer">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── CTA ──── */}
      <section id="contato" style={{ padding: '100px 40px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '-30%', left: '50%', transform: 'translateX(-50%)', width: 800, height: 800, background: 'radial-gradient(circle, rgba(0,184,101,0.1) 0%, transparent 65%)', animation: 'glow-pulse 5s ease-in-out infinite' }} />
        </div>

        <div style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', position: 'relative' }}>
          <div style={{ width: 72, height: 72, borderRadius: 22, background: 'rgba(0,184,101,0.12)', border: '1px solid rgba(0,184,101,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px' }}>
            <TauzeLogo size={38} />
          </div>

          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.03em', marginBottom: 18, lineHeight: 1.1 }}>
            Pronto para transformar<br />a gestão da sua fazenda?
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
            Agende uma demonstração de 30 minutos com nossa equipe técnica e veja o sistema funcionando com dados reais do seu negócio.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a
              href="https://wa.me/5511999999999?text=Olá!%20Tenho%20interesse%20em%20conhecer%20o%20Tauze%20ERP."
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ fontSize: 16, padding: '17px 36px' }}
            >
              <span>💬</span>
              <span>Falar no WhatsApp</span>
            </a>
            <Link to="/login" className="btn-ghost" style={{ fontSize: 16, padding: '17px 36px' }}>
              Acessar o ERP agora →
            </Link>
          </div>

          <div style={{ marginTop: 32, display: 'flex', gap: 28, justifyContent: 'center', flexWrap: 'wrap' }}>
            {['Sem cartão de crédito', 'Demo gratuita', 'Dados reais da sua fazenda'].map(t => (
              <span key={t} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#00b865' }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FOOTER ──── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 40px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TauzeLogo size={28} />
            <div>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#fff' }}>tauze</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontWeight: 600 }}>Sistemas de Gestão Rural</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            {['Pecuária', 'Agrícola', 'Frota', 'Finanças', 'Compras', 'BI'].map(l => (
              <Link key={l} to="/login" style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', fontWeight: 600, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.target as HTMLElement).style.color = '#fff'}
                onMouseLeave={e => (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.35)'}
              >{l}</Link>
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© 2026 Tauze · Todos os direitos reservados</div>
        </div>
      </footer>
    </div>
  );
};
