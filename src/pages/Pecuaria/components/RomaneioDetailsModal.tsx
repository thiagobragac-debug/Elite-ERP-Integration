import React from 'react';
import {
  FileText,
  Truck,
  Calendar,
  User,
  DollarSign,
  CheckCircle2,
  Activity,
  XCircle,
  Tag,
  MapPin,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';

interface RomaneioDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  romaneio: any;
  onDownloadPDF: (row: any) => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <CheckCircle2 size={16} color="hsl(142 71% 45%)" />;
    case 'Em Trânsito':
      return <Truck size={16} color="hsl(217 91% 60%)" />;
    case 'Pendente':
      return <Activity size={16} color="hsl(38 92% 50%)" />;
    case 'Cancelado':
      return <XCircle size={16} color="hsl(348 83% 47%)" />;
    default:
      return null;
  }
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case 'Concluído':
      return { bg: 'hsl(142 71% 45% / 0.1)', text: 'hsl(142 71% 45%)' };
    case 'Em Trânsito':
      return { bg: 'hsl(217 91% 60% / 0.1)', text: 'hsl(217 91% 60%)' };
    case 'Pendente':
      return { bg: 'hsl(38 92% 50% / 0.1)', text: 'hsl(38 92% 50%)' };
    case 'Cancelado':
      return { bg: 'hsl(348 83% 47% / 0.1)', text: 'hsl(348 83% 47%)' };
    default:
      return { bg: 'hsl(var(--text-muted) / 0.1)', text: 'hsl(var(--text-muted))' };
  }
};

export const RomaneioDetailsModal: React.FC<RomaneioDetailsModalProps> = ({
  isOpen,
  onClose,
  romaneio,
  onDownloadPDF,
}) => {
  if (!isOpen || !romaneio) {
    return null;
  }

  const colors = getStatusStyle(romaneio.status);

  const columns = [
    {
      header: 'Categoria',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700 }}>
          {item.categoria} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>({item.raca})</span>
        </span>
      ),
      align: 'left' as const,
    },
    {
      header: 'Qtd',
      accessor: (item: any) => <span style={{ fontWeight: 700 }}>{item.qtd} cbç</span>,
      align: 'center' as const,
    },
    {
      header: 'Peso Médio',
      accessor: (item: any) => <span style={{ fontWeight: 700 }}>{item.peso_medio?.toFixed(1)} kg</span>,
      align: 'right' as const,
    },
  ];

  const tableData =
    romaneio.composicao_carga && Array.isArray(romaneio.composicao_carga) && romaneio.composicao_carga.length > 0
      ? romaneio.composicao_carga
      : [{ id: 'misto', categoria: 'Misto / Não Especificado', raca: '---', qtd: romaneio.animais_qtd, peso_medio: 0 }];

  const footer = (
    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', width: '100%' }}>
      <button
        type="button"
        className="glass-btn secondary"
        onClick={onClose}
        style={{ textTransform: 'none', fontWeight: 700 }}
      >
        Fechar
      </button>
      <button
        type="button"
        className="primary-btn"
        onClick={() => onDownloadPDF(romaneio)}
        style={{
          textTransform: 'none',
          fontWeight: 700,
          padding: '10px 20px',
          borderRadius: '12px',
        }}
      >
        <FileText size={16} />
        Baixar PDF
      </button>
    </div>
  );

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={`Romaneio ${romaneio.id}`}
      subtitle={`Criado em ${romaneio.data}`}
      icon={Truck}
      size="medium"
      customFooter={footer}
    >
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              padding: '6px 12px',
              borderRadius: '12px',
              background: colors.bg,
              color: colors.text,
              fontSize: '12px',
              fontWeight: 800,
              gap: '6px',
            }}
          >
            {getStatusIcon(romaneio.status)}
            {romaneio.status}
          </span>
        </div>

        {/* Informações Gerais */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div
            style={{
              background: 'hsl(var(--bg-main)/0.4)',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                display: 'block',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Comprador
            </label>
            <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))', fontSize: '14px' }}>
              {romaneio.comprador}
            </span>
          </div>
          <div
            style={{
              background: 'hsl(var(--bg-main)/0.4)',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <label
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                display: 'block',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Destino
            </label>
            <span
              style={{
                fontWeight: 700,
                color: 'hsl(var(--text-main))',
                fontSize: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <MapPin size={14} style={{ color: 'hsl(var(--text-muted))' }} />
              {romaneio.destino}
            </span>
          </div>
        </div>

        {/* Dados de Transporte */}
        <div
          style={{
            background: 'hsl(var(--bg-main)/0.4)',
            padding: '16px',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <h4
            style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'hsl(var(--text-muted))',
              borderBottom: '1px solid hsl(var(--border))',
              paddingBottom: '6px',
            }}
          >
            Dados Logísticos
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                Motorista
              </label>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                {romaneio.motorista}
              </span>
            </div>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                Veículo (Placa)
              </label>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-main))',
                  fontFamily: 'monospace',
                }}
              >
                {romaneio.placa}
              </span>
            </div>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  display: 'block',
                  marginBottom: '2px',
                }}
              >
                GTA / NF-e
              </label>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-main))',
                  fontFamily: 'monospace',
                }}
              >
                {romaneio.nfe}
              </span>
            </div>
          </div>
        </div>

        {/* Valores e Cargas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div
            style={{
              background: 'hsl(var(--bg-main)/0.4)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '10px',
                background: 'hsl(var(--brand)/0.1)',
                color: 'hsl(var(--brand))',
                borderRadius: '12px',
              }}
            >
              <Tag size={18} />
            </div>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'block',
                  textTransform: 'uppercase',
                }}
              >
                Volume Total
              </label>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                {romaneio.animais_qtd} cabeças
              </span>
            </div>
          </div>

          <div
            style={{
              background: 'hsl(var(--bg-main)/0.4)',
              padding: '16px',
              borderRadius: '16px',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                padding: '10px',
                background: 'hsl(142 71% 45%/0.1)',
                color: 'hsl(142 71% 45%)',
                borderRadius: '12px',
              }}
            >
              <DollarSign size={18} />
            </div>
            <div>
              <label
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  display: 'block',
                  textTransform: 'uppercase',
                }}
              >
                Faturamento Est.
              </label>
              <span style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(142 71% 45%)' }}>
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  romaneio.valor_estimado
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Animais Carregados */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <h4
            style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 900,
              textTransform: 'uppercase',
              color: 'hsl(var(--text-muted))',
            }}
          >
            Composição da Carga (Lote)
          </h4>
          <div
            style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: '14px',
              overflow: 'hidden',
            }}
          >
            <ModernTable
              columns={columns}
              data={tableData}
              loading={false}
              hideHeader={true}
              emptyState={
                <EmptyState
                  icon={Tag}
                  title="Sem Composição"
                  description="Nenhuma composição de carga detalhada encontrada."
                />
              }
            />
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
