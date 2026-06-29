import React from 'react';
import { Link } from 'react-router-dom';

interface InteractiveAppMockupProps {
  activeTab: number;
  setActiveTab: (index: number) => void;
  weighing: boolean;
  weight: number;
  handleWeigh: () => void;
  fuelPct: number;
  purchaseStep: number;
  setPurchaseStep: React.Dispatch<React.SetStateAction<number>>;
}

export const InteractiveAppMockup: React.FC<InteractiveAppMockupProps> = ({
  activeTab,
  setActiveTab,
  weighing,
  weight,
  handleWeigh,
  fuelPct,
  purchaseStep,
  setPurchaseStep,
}) => {
  const modules = [
    {
      emoji: '🐄',
      label: 'Bovinocultura',
      tag: 'RFID & GMD',
      title: 'Pesagem voluntária com RFID — sem estresse no rebanho',
      desc: 'O animal vai ao bebedouro e o sistema registra o peso automaticamente. Curvas de GMD diárias, previsão de abate e gestão de lotes sem manejo estressante.',
      bullets: [
        'Pesagem por brinco RFID sem parar o rebanho',
        'Cálculo automático de GMD e previsão de abate',
        'Gestão de lotes com entrada/saída e histórico completo',
      ],
      color: '#00b865',
      demo: (
        <div>
          <div
            style={{
              background: 'rgba(0,184,101,0.06)',
              border: '1px solid rgba(0,184,101,0.15)',
              borderRadius: 16,
              padding: 20,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 10,
                color: 'rgba(255,255,255,0.4)',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              ANTENA RFID — BRINCO IDENTIFICADO
            </div>
            <div
              style={{
                fontSize: 42,
                fontWeight: 900,
                color: '#fff',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span style={{ color: weighing ? '#f59e0b' : '#00b865' }}>{weight.toFixed(1)}</span>
              <span style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                kg
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
              Animal #BR-212 · Lote Pasto B · GMD: +1,22 kg/dia
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}
          >
            {[
              ['Peso Entrada', '380 kg'],
              ['Meta Abate', '520 kg'],
              ['Dias em Pasto', '118 dias'],
              ['Previsão Abate', '12/07/2026'],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {l}
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>{v}</div>
              </div>
            ))}
          </div>
          <button
            onClick={handleWeigh}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: weighing ? 'rgba(245,158,11,0.15)' : 'rgba(0,184,101,0.15)',
              color: weighing ? '#f59e0b' : '#00b865',
              fontWeight: 800,
              fontSize: 13,
              letterSpacing: '0.04em',
              transition: 'all 0.3s',
            }}
          >
            {weighing ? '⚡ Registrando pesagem...' : '📡 Simular Passagem pelo RFID'}
          </button>
        </div>
      ),
    },
    {
      emoji: '🚜',
      label: 'Frota',
      tag: 'Telemetria',
      title: 'Telemetria de máquinas e controle de diesel em tempo real',
      desc: 'Monitore consumo de combustível, horímetros e alertas de manutenção de toda a frota. Detecta anomalias de diesel e gera ordens de serviço automáticas.',
      bullets: [
        'Rastreamento GPS e horímetro offline-first',
        'Detecção de consumo anômalo de diesel',
        'OS automáticas por horimetria — sem agenda manual',
      ],
      color: '#f59e0b',
      demo: (
        <div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
                Trator JD 8R #04 — Combustível
              </span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 900,
                  color: fuelPct > 30 ? '#00b865' : '#ef4444',
                }}
              >
                {fuelPct}%
              </span>
            </div>
            <div
              style={{
                height: 10,
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${fuelPct}%`,
                  background:
                    fuelPct > 30
                      ? 'linear-gradient(90deg,#00b865,#34d399)'
                      : 'linear-gradient(90deg,#ef4444,#f97316)',
                  borderRadius: 8,
                  transition: 'width 1s ease',
                }}
              />
            </div>
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}
          >
            {[
              ['Horimetro', '4.820 h'],
              ['Consumo', '14,8 L/h'],
              ['Próx. Revisão', '38 h'],
              ['Status', 'OPERANDO'],
            ].map(([l, v]) => (
              <div
                key={l}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    color: 'rgba(255,255,255,0.35)',
                    fontWeight: 700,
                    marginBottom: 4,
                  }}
                >
                  {l}
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 800,
                    color: l === 'Status' ? '#00b865' : '#fff',
                  }}
                >
                  {v}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'rgba(245,158,11,0.06)',
              border: '1px solid rgba(245,158,11,0.15)',
              borderRadius: 12,
              padding: '12px 16px',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: '#f59e0b', marginBottom: 4 }}>
              ⚠ Alerta Preditivo
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
              Revisão de filtros de ar em 38h. OS gerada automaticamente.
            </div>
          </div>
        </div>
      ),
    },
    {
      emoji: '💰',
      label: 'Finanças',
      tag: 'Conciliação',
      title: 'Conciliação bancária automática via Open Finance',
      desc: 'Conecte seus bancos via API e elimine a conferência manual de extratos. O sistema casa lançamentos automaticamente e aponta divergências em segundos.',
      bullets: [
        'API com 6 bancos parceiros — BB, Itaú, Bradesco, Sicredi, Cresol, BTG',
        'Match automático por valor, data e histórico',
        'Relatório de compliance e auditoria completa',
      ],
      color: '#3b82f6',
      demo: (
        <div>
          {[
            { desc: 'BUNGE ALIMENTOS — TED', val: 'R$ 138.500', status: 'paired', date: '22/05' },
            {
              desc: 'NUTRIEN RURAL — NF 9241',
              val: '- R$ 58.400',
              status: 'paired',
              date: '21/05',
            },
            { desc: 'DIESEL POSTO CENTRAL', val: '- R$ 12.840', status: 'pending', date: '20/05' },
          ].map((r, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: r.status === 'paired' ? '#00b865' : '#f59e0b',
                  boxShadow: r.status === 'paired' ? '0 0 8px #00b86580' : '0 0 8px #f59e0b80',
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.desc}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>
                  {r.date}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: r.val.startsWith('-') ? '#ef4444' : '#00b865',
                  }}
                >
                  {r.val}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    color: r.status === 'paired' ? '#00b865' : '#f59e0b',
                    textAlign: 'right',
                  }}
                >
                  {r.status === 'paired' ? '✓ CASADO' : '⏳ PENDENTE'}
                </div>
              </div>
            </div>
          ))}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(0,184,101,0.06)',
              border: '1px solid rgba(0,184,101,0.15)',
              borderRadius: 12,
              marginTop: 4,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>
              Taxa de Conciliação Automática
            </span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#00b865' }}>94,7%</span>
          </div>
        </div>
      ),
    },
    {
      emoji: '🛒',
      label: 'Compras',
      tag: 'Cotações',
      title: 'Cotações inteligentes sem planilhas manuais',
      desc: 'Da requisição à nota de entrada em um fluxo contínuo. O sistema consulta fornecedores cadastrados, compara preços e gera a ordem de compra aprovada automaticamente.',
      bullets: [
        'Pipeline: Requisição → Cotação → Aprovação → NF-e entrada',
        'Importação automática de XML de NF-e',
        'Controle de estoque mínimo com alertas de reposição',
      ],
      color: '#8b5cf6',
      demo: (
        <div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {['Requisição', 'Cotações', 'Aprovado'].map((s, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: purchaseStep >= i ? '#8b5cf6' : 'rgba(255,255,255,0.05)',
                    border:
                      purchaseStep >= i ? '2px solid #8b5cf6' : '2px solid rgba(255,255,255,0.08)',
                    fontSize: 13,
                    fontWeight: 900,
                    color: purchaseStep >= i ? '#fff' : 'rgba(255,255,255,0.2)',
                    transition: 'all 0.4s',
                  }}
                >
                  {i + 1}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: purchaseStep >= i ? '#fff' : 'rgba(255,255,255,0.2)',
                    textAlign: 'center',
                  }}
                >
                  {s}
                </span>
              </div>
            ))}
          </div>
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 14,
              padding: 16,
              marginBottom: 12,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'rgba(255,255,255,0.35)',
                fontWeight: 700,
                marginBottom: 8,
              }}
            >
              FERTILIZANTE NPK — 12 TONELADAS
            </div>
            {purchaseStep === 0 && (
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                Aguardando consulta de fornecedores...
              </div>
            )}
            {purchaseStep >= 1 && (
              <div>
                {[
                  ['Nutrien Rural', 'R$ 58.400', true],
                  ['Agrobovinocultura XY', 'R$ 61.200', false],
                ].map(([n, v, best], i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 0',
                      borderBottom: i === 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#fff', fontWeight: 700 }}>
                      {n as string}{' '}
                      {best ? (
                        <span
                          style={{
                            fontSize: 9,
                            background: '#00b86520',
                            color: '#00b865',
                            padding: '2px 6px',
                            borderRadius: 4,
                          }}
                        >
                          MENOR PREÇO
                        </span>
                      ) : (
                        ''
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 900,
                        color: best ? '#00b865' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {v as string}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {purchaseStep === 2 && (
              <div style={{ fontSize: 13, fontWeight: 800, color: '#00b865', marginTop: 8 }}>
                ✓ Ordem de Compra Gerada — NF-e importada
              </div>
            )}
          </div>
          <button
            onClick={() => setPurchaseStep((p) => (p < 2 ? p + 1 : 0))}
            style={{
              width: '100%',
              padding: '13px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: purchaseStep === 2 ? 'rgba(0,184,101,0.15)' : 'rgba(139,92,246,0.15)',
              color: purchaseStep === 2 ? '#00b865' : '#8b5cf6',
              fontWeight: 800,
              fontSize: 12,
              letterSpacing: '0.04em',
            }}
          >
            {purchaseStep === 0
              ? '🔍 Buscar Fornecedores'
              : purchaseStep === 1
                ? '✅ Aprovar Menor Preço'
                : '🔄 Reiniciar Demo'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <section
      id="demo"
      style={{
        padding: '100px 40px',
        background: 'linear-gradient(180deg, transparent, rgba(0,184,101,0.04), transparent)',
      }}
    >
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
            DEMONSTRATIVO INTERATIVO
          </div>
          <h2
            style={{
              fontSize: 'clamp(28px, 4vw, 46px)',
              fontWeight: 900,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            Experimente antes de contratar
          </h2>
          <p
            style={{
              fontSize: 16,
              color: 'rgba(255,255,255,0.45)',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            Clique nos módulos abaixo e interaja com a interface real do sistema.
          </p>
        </div>

        <div id="modulos" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 24 }}>
          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {modules.map((m, i) => (
              <button
                key={i}
                className={`mod-tab ${activeTab === i ? 'active' : ''}`}
                onClick={() => setActiveTab(i)}
              >
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
            <div
              style={{
                padding: '14px 20px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', gap: 7 }}>
                {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                  <div
                    key={c}
                    style={{ width: 10, height: 10, borderRadius: '50%', background: c }}
                  />
                ))}
              </div>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                tauze://erp/{modules[activeTab].label.toLowerCase()}/live
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(0,184,101,0.1)',
                  border: '1px solid rgba(0,184,101,0.2)',
                  borderRadius: 6,
                  padding: '3px 10px',
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#00b865',
                    boxShadow: '0 0 6px #00b865',
                  }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#00b865',
                    letterSpacing: '0.06em',
                  }}
                >
                  AO VIVO
                </span>
              </div>
            </div>

            {/* content */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
              {/* Demo pane */}
              <div style={{ padding: 28, borderRight: '1px solid rgba(255,255,255,0.06)' }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.08em',
                    marginBottom: 20,
                  }}
                >
                  {modules[activeTab].tag.toUpperCase()} — SIMULAÇÃO INTERATIVA
                </div>
                {modules[activeTab].demo}
              </div>

              {/* Info pane */}
              <div style={{ padding: 28 }}>
                <div
                  style={{
                    display: 'inline-block',
                    fontSize: 10,
                    fontWeight: 800,
                    color: modules[activeTab].color,
                    background: `${modules[activeTab].color}12`,
                    border: `1px solid ${modules[activeTab].color}25`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    marginBottom: 16,
                    letterSpacing: '0.06em',
                  }}
                >
                  {modules[activeTab].label.toUpperCase()}
                </div>
                <h3
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    lineHeight: 1.3,
                    marginBottom: 14,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {modules[activeTab].title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: 'rgba(255,255,255,0.5)',
                    lineHeight: 1.75,
                    marginBottom: 24,
                  }}
                >
                  {modules[activeTab].desc}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {modules[activeTab].bullets.map((b, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        fontSize: 13,
                        color: 'rgba(255,255,255,0.65)',
                      }}
                    >
                      <span
                        style={{ color: '#00b865', fontWeight: 900, marginTop: 1, flexShrink: 0 }}
                      >
                        ✓
                      </span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
                <div
                  style={{
                    marginTop: 28,
                    paddingTop: 20,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <Link
                    to="/login"
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: modules[activeTab].color,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Ver módulo completo no ERP →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
