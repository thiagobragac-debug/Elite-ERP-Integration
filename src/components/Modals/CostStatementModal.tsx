import React from 'react';
import { X, DollarSign, Wheat, HeartPulse, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from '../../utils/format';
import { ModernTable } from '../DataTable/ModernTable';

interface CostStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: any;
  financialData: {
    costs: any[];
    health: any[];
  } | null;
}

export const CostStatementModal: React.FC<CostStatementModalProps> = ({
  isOpen,
  onClose,
  animal,
  financialData
}) => {
  if (!isOpen) return null;

  // Combine and sort the data
  const combinedData = React.useMemo(() => {
    if (!financialData) return [];
    
    const costs = financialData.costs.map(c => ({
      ...c,
      category: 'Nutrição / Trato',
      type: 'cost',
      icon: <Wheat size={16} color="#fbbf24" />,
      date: c.data_consumo || c.created_at,
      productName: c.produtos?.nome || 'Dieta / Insumo'
    }));

    const health = financialData.health.map(h => ({
      ...h,
      category: 'Sanidade / Manejo',
      type: 'health',
      icon: <HeartPulse size={16} color="#f87171" />,
      date: h.data_aplicacao || h.created_at,
      productName: h.produtos?.nome || 'Fármaco / Vacina'
    }));

    return [...costs, ...health].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [financialData]);

  const columns = [
    {
      header: 'Data',
      accessor: (item: any) => (
        <span style={{ fontWeight: 600, color: '#64748b', fontSize: '12px' }}>
          {item.date ? new Date(item.date).toLocaleDateString() : 'N/I'}
        </span>
      ),
      align: 'left' as const
    },
    {
      header: 'Categoria',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {item.icon}
          <span style={{ fontWeight: 700, color: '#334155', fontSize: '12px' }}>{item.category}</span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Produto / Lançamento',
      accessor: (item: any) => (
        <span style={{ fontWeight: 600, color: '#1e293b' }}>
          {item.productName}
        </span>
      ),
      align: 'left' as const
    },
    {
      header: 'Valor Cobrado',
      accessor: (item: any) => (
        <span style={{ fontWeight: 800, color: '#ef4444', fontSize: '14px' }}>
          {formatCurrency(item.valor_total_aplicado || 0)}
        </span>
      ),
      align: 'right' as const
    }
  ];

  return (
    <AnimatePresence>
      <motion.div 
        className="modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <motion.div 
          className="modal-content"
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          style={{ 
            background: '#fff', 
            borderRadius: '24px', 
            width: '100%', 
            maxWidth: '850px', 
            maxHeight: '85vh', 
            display: 'flex', 
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            overflow: 'hidden'
          }}
        >
          <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#10b98115', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                <FileText size={24} />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#1e293b' }}>Extrato Financeiro</h2>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px', fontWeight: 500 }}>
                  Detalhamento de custos do animal #{animal?.brinco}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}
            >
              <X size={18} />
            </button>
          </div>

          <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
              <div style={{ background: '#f1f5f9', padding: '16px', borderRadius: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>Aquisição</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#334155' }}>{formatCurrency(animal?.valor_compra || 0)}</span>
              </div>
              <div style={{ background: '#fef3c7', padding: '16px', borderRadius: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#d97706', textTransform: 'uppercase', marginBottom: '4px' }}>Nutrição Acumulada</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#b45309' }}>
                  {formatCurrency(financialData?.costs.reduce((acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0), 0) || 0)}
                </span>
              </div>
              <div style={{ background: '#fee2e2', padding: '16px', borderRadius: '16px' }}>
                <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', marginBottom: '4px' }}>Sanidade Acumulada</span>
                <span style={{ fontSize: '18px', fontWeight: 800, color: '#b91c1c' }}>
                  {formatCurrency(financialData?.health.reduce((acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0), 0) || 0)}
                </span>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#1e293b', marginBottom: '16px' }}>Histórico de Lançamentos</h3>
            
            {combinedData.length > 0 ? (
              <ModernTable 
                data={combinedData}
                columns={columns}
              />
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', background: '#f8fafc', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                <DollarSign size={32} color="#94a3b8" style={{ margin: '0 auto 16px auto', opacity: 0.5 }} />
                <h4 style={{ margin: '0 0 8px 0', color: '#475569', fontSize: '16px', fontWeight: 700 }}>Nenhum lançamento no extrato</h4>
                <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>Este animal ainda não consumiu tratos ou vacinas mapeadas com custo.</p>
              </div>
            )}
          </div>
          
          <div style={{ padding: '24px', borderTop: '1px solid #e2e8f0', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>Custo Total (Aquisição + Variáveis)</span>
            <span style={{ fontSize: '28px', fontWeight: 900, color: '#10b981' }}>
              {formatCurrency(
                (animal?.valor_compra || 0) + 
                (financialData?.costs.reduce((acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0), 0) || 0) + 
                (financialData?.health.reduce((acc: number, curr: any) => acc + Number(curr.valor_total_aplicado || 0), 0) || 0)
              )}
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
