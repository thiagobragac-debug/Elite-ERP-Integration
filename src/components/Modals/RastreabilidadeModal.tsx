import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import {
  FileText,
  Tag,
  Heart,
  Scale,
  ArrowRightLeft,
  Truck,
  Printer,
  QrCode,
  Copy,
  X,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface RastreabilidadeModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: {
    id: string;
    brinco: string;
    raca?: string;
    sexo?: string;
    categoria?: string;
    status?: string;
    peso_inicial?: number;
    peso_atual?: number;
    data_nascimento?: string;
    valor_compra?: number;
  } | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  FileText,
  Tag,
  Heart,
  Scale,
  ArrowRightLeft,
  Truck,
};

const mockTimeline = [
  {
    icon: 'FileText',
    color: '#6366f1',
    date: '2026-01-15',
    title: 'Entrada via NF-e',
    desc: 'NF-e 123456 | Fornecedor: Fazenda Santa Rita | 50 cabeças | R$ 75.000,00',
  },
  {
    icon: 'Tag',
    color: '#10b981',
    date: '2026-01-18',
    title: 'Identificação e Pesagem',
    desc: 'Brinco #101 aplicado | Peso inicial: 320 kg | Lote: Recria 01',
  },
  {
    icon: 'Heart',
    color: '#ec4899',
    date: '2026-02-05',
    title: 'Vacinação â€” Aftosa',
    desc: 'Vacina Bovicel | Dose: 2ml | Aplicada por: João Vaqueiro | Carência: 21 dias',
  },
  {
    icon: 'Scale',
    color: '#f59e0b',
    date: '2026-03-01',
    title: 'Pesagem Periódica',
    desc: 'Peso: 380 kg (+60 kg) | GMD: 0.857 kg/dia | Lote: Recria 01',
  },
  {
    icon: 'ArrowRightLeft',
    color: '#3b82f6',
    date: '2026-03-15',
    title: 'Transferência de Lote',
    desc: 'Origem: Recria 01 | Destino: Engorda A | Motivo: Atingiu peso alvo de recria',
  },
  {
    icon: 'Scale',
    color: '#f59e0b',
    date: '2026-05-01',
    title: 'Pesagem Periódica',
    desc: 'Peso: 498 kg (+118 kg) | GMD: 0.905 kg/dia | Lote: Engorda A',
  },
];

// Deterministic pseudo-QR code pattern from a seed string
function generateQRPattern(seed: string, size: number): boolean[][] {
  const grid: boolean[][] = [];
  for (let r = 0; r < size; r++) {
    grid[r] = [];
    for (let c = 0; c < size; c++) {
      // Finder pattern corners (top-left, top-right, bottom-left)
      const inCorner =
        (r < 7 && c < 7) ||
        (r < 7 && c >= size - 7) ||
        (r >= size - 7 && c < 7);
      if (inCorner) {
        const lr = r < 7 ? r : size - 1 - r;
        const lc = c < 7 ? c : size - 1 - c;
        grid[r][c] =
          lr === 0 || lr === 6 || lc === 0 || lc === 6 ||
          (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4);
      } else {
        // Timing pattern
        if ((r === 6 || c === 6) && r >= 7 && c >= 7) {
          grid[r][c] = (r + c) % 2 === 0;
        } else {
          // Data pattern driven by seed
          const charCode = seed.charCodeAt((r * size + c) % seed.length) || 0;
          grid[r][c] = ((charCode + r * 3 + c * 7) % 3) !== 0;
        }
      }
    }
  }
  return grid;
}

const QRCodeBlock: React.FC<{ link: string }> = ({ link }) => {
  return (
    <div
      style={{
        width: 150,
        height: 150,
        border: '3px solid hsl(var(--border-strong))',
        borderRadius: 8,
        padding: 6,
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <img
        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(link)}`}
        alt="QR Code de Rastreabilidade"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </div>
  );
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return 'â€”';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null) return 'â€”';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const formatWeight = (value?: number) => {
  if (value === undefined || value === null) return 'â€”';
  return `${value} kg`;
};

export const RastreabilidadeModal: React.FC<RastreabilidadeModalProps> = ({
  isOpen,
  onClose,
  animal,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !animal) return null;

  const isSold = animal.status === 'Vendido' || animal.status === 'Abatido';

  const timeline = [
    ...mockTimeline,
    ...(isSold
      ? [
          {
            icon: 'Truck',
            color: '#ef4444',
            date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
            title: 'Saída via Romaneio de Embarque',
            desc: `Animal registrado como ${animal.status} | Brinco #${animal.brinco}`,
          },
        ]
      : []),
  ];

  const pesoInicial = animal.peso_inicial;
  const pesoAtual = animal.peso_atual;
  const ganho =
    pesoInicial !== undefined && pesoAtual !== undefined
      ? pesoAtual - pesoInicial
      : undefined;

  const kpiCards = [
    {
      label: 'Peso Inicial',
      value: formatWeight(pesoInicial),
      color: '#6366f1',
      bg: 'rgba(99,102,241,0.08)',
    },
    {
      label: 'Peso Atual',
      value: formatWeight(pesoAtual),
      color: '#10b981',
      bg: 'rgba(16,185,129,0.08)',
    },
    {
      label: 'Ganho de Peso',
      value: ganho !== undefined ? `+${ganho} kg` : 'â€”',
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.08)',
    },
    {
      label: 'Custo de Aquisição',
      value: formatCurrency(animal.valor_compra),
      color: '#3b82f6',
      bg: 'rgba(59,130,246,0.08)',
    },
  ];

  const publicLink = `https://rastreio.fazenda.app/animal/${animal.id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink).then(() => {
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadQR = () => {
    toast.success('QR Code exportado! (simulação)');
  };

  const handlePrint = () => {
    window.print();
  };

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(0,0,0,0.45)',
        animation: 'rast-fade-in 0.2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 700,
          maxHeight: '85vh',
          overflowY: 'auto',
          background: 'hsl(var(--bg-card))',
          borderRadius: 20,
          boxShadow: '0 32px 80px -12px rgba(0,0,0,0.35), 0 0 0 1px hsl(var(--border))',
          display: 'flex',
          flexDirection: 'column',
          animation: 'rast-slide-up 0.28s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* â”€â”€ Header â”€â”€ */}
        <div
          style={{
            padding: '20px 24px 18px',
            borderBottom: '1px solid hsl(var(--border))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexShrink: 0,
            background: 'linear-gradient(135deg, hsl(var(--bg-card)) 0%, hsl(var(--bg-main)/0.4) 100%)',
            borderRadius: '20px 20px 0 0',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'hsl(161 64% 39% / 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--brand))',
                flexShrink: 0,
              }}
            >
              <Tag size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: 'hsl(var(--text-main))',
                  fontFamily: 'var(--font-heading)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  margin: 0,
                }}
              >
                #{animal.brinco}
              </h2>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  margin: '2px 0 0',
                }}
              >
                Rastreabilidade Completa
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 14px',
                borderRadius: 8,
                background: 'hsl(var(--bg-main))',
                border: '1px solid hsl(var(--border))',
                fontSize: 12,
                fontWeight: 800,
                color: 'hsl(var(--text-main))',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--brand))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-main))'; }}
            >
              <Printer size={14} />
              Imprimir
            </button>
            <button
              onClick={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'hsl(var(--bg-main))',
                border: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'hsl(var(--text-muted))',
                cursor: 'pointer',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = '#fee2e2'; (e.currentTarget as HTMLButtonElement).style.color = '#ef4444'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#fca5a5'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'hsl(var(--bg-main))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-muted))'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* â”€â”€ Body â”€â”€ */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* â”€â”€ KPI Cards â”€â”€ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  padding: '14px 16px',
                  borderRadius: 14,
                  background: kpi.bg,
                  border: `1px solid ${kpi.color}22`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'transform 0.2s',
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    color: kpi.color,
                  }}
                >
                  {kpi.label}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 900,
                    color: 'hsl(var(--text-main))',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.1,
                  }}
                >
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>

          {/* â”€â”€ Timeline Section â”€â”€ */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'hsl(var(--text-muted))',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
              Linha do Tempo
              <div style={{ flex: 1, height: 1, background: 'hsl(var(--border))' }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {timeline.map((event, idx) => {
                const IconComp = ICON_MAP[event.icon] || FileText;
                const isLast = idx === timeline.length - 1;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      gap: 0,
                      position: 'relative',
                    }}
                  >
                    {/* Connector column */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        width: 40,
                        flexShrink: 0,
                        marginRight: 14,
                      }}
                    >
                      {/* Icon circle */}
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: `${event.color}18`,
                          border: `2.5px solid ${event.color}44`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: `0 0 0 4px ${event.color}0c`,
                          zIndex: 1,
                          position: 'relative',
                        }}
                      >
                        <IconComp size={16} style={{ color: event.color }} />
                      </div>
                      {/* Vertical line */}
                      {!isLast && (
                        <div
                          style={{
                            width: 2,
                            flex: 1,
                            minHeight: 16,
                            background: `linear-gradient(to bottom, ${event.color}66, hsl(var(--border)))`,
                            borderRadius: 2,
                            marginTop: 2,
                            marginBottom: 2,
                          }}
                        />
                      )}
                    </div>

                    {/* Event content */}
                    <div
                      style={{
                        flex: 1,
                        paddingBottom: isLast ? 0 : 16,
                        paddingTop: 4,
                      }}
                    >
                      <div
                        style={{
                          padding: '12px 16px',
                          borderRadius: 12,
                          background: 'hsl(var(--bg-main)/0.5)',
                          border: '1px solid hsl(var(--border))',
                          transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background = `${event.color}08`;
                          el.style.borderColor = `${event.color}33`;
                          el.style.transform = 'translateX(3px)';
                        }}
                        onMouseLeave={(e) => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.background = 'hsl(var(--bg-main)/0.5)';
                          el.style.borderColor = 'hsl(var(--border))';
                          el.style.transform = 'translateX(0)';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: 'hsl(var(--text-main))',
                              fontFamily: 'var(--font-heading)',
                            }}
                          >
                            {event.title}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: event.color,
                              background: `${event.color}14`,
                              padding: '2px 8px',
                              borderRadius: 100,
                              whiteSpace: 'nowrap',
                              flexShrink: 0,
                            }}
                          >
                            {formatDate(event.date)}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 11,
                            fontWeight: 500,
                            color: 'hsl(var(--text-muted))',
                            margin: 0,
                            lineHeight: 1.5,
                          }}
                        >
                          {event.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* â”€â”€ QR Code Section â”€â”€ */}
          <div
            style={{
              borderRadius: 16,
              border: '1px solid hsl(var(--border))',
              background: 'hsl(var(--bg-main)/0.3)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'hsl(var(--text-muted))',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <QrCode size={14} style={{ color: 'hsl(var(--brand))' }} />
              QR Code de Rastreabilidade
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <QRCodeBlock link={publicLink} />

              <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'hsl(var(--text-muted))', margin: 0, lineHeight: 1.5 }}>
                  Escaneie para acessar o histórico público deste animal e verificar sua procedência com segurança.
                </p>
                <div
                  style={{
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: 'hsl(var(--bg-card))',
                    border: '1px solid hsl(var(--border))',
                    fontSize: 10,
                    fontFamily: 'monospace',
                    color: 'hsl(var(--text-muted))',
                    wordBreak: 'break-all',
                    lineHeight: 1.4,
                  }}
                >
                  {publicLink}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleDownloadQR}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: 'hsl(var(--brand))',
                      border: 'none',
                      fontSize: 11,
                      fontWeight: 800,
                      color: '#fff',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                  >
                    <QrCode size={13} />
                    Baixar QR Code
                  </button>
                  <button
                    onClick={handleCopyLink}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '9px 12px',
                      borderRadius: 8,
                      background: copied ? '#dcfce7' : 'hsl(var(--bg-card))',
                      border: `1px solid ${copied ? '#86efac' : 'hsl(var(--border))'}`,
                      fontSize: 11,
                      fontWeight: 800,
                      color: copied ? '#15803d' : 'hsl(var(--text-main))',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                    onMouseEnter={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--brand))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))'; } }}
                    onMouseLeave={(e) => { if (!copied) { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-main))'; } }}
                  >
                    {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
                    {copied ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Footer â”€â”€ */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexShrink: 0,
            background: 'hsl(var(--bg-main)/0.3)',
            borderRadius: '0 0 20px 20px',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border-strong))',
              fontSize: 12,
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--brand))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--brand))'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'hsl(var(--border-strong))'; (e.currentTarget as HTMLButtonElement).style.color = 'hsl(var(--text-main))'; }}
          >
            Fechar
          </button>
          <button
            onClick={handlePrint}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              background: 'hsl(var(--brand))',
              border: '1px solid hsl(var(--brand))',
              fontSize: 12,
              fontWeight: 800,
              color: '#fff',
              cursor: 'pointer',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              boxShadow: '0 4px 15px -4px hsl(var(--brand) / 0.5)',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.9'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
          >
            <Printer size={14} />
            Imprimir Relatório
          </button>
        </div>
      </div>

      <style>{`
        @keyframes rast-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rast-slide-up {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
      `}</style>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};
