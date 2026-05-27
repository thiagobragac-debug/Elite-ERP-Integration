import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { X, Search, Package, DollarSign, ArrowDownRight, ArrowUpRight, Calendar, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';

interface WarehouseStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  warehouseId: string | null;
  warehouseName: string | null;
}

export const WarehouseStockModal: React.FC<WarehouseStockModalProps> = ({
  isOpen,
  onClose,
  warehouseId,
  warehouseName
}) => {
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'stock' | 'history'>('stock');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && warehouseId) {
      fetchData();
    }
  }, [isOpen, warehouseId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: mData } = await supabase
        .from('movimentacoes_estoque')
        .select(`
          *,
          produtos (
            id,
            nome,
            categoria_id,
            custo_medio,
            unidade_medida
          )
        `)
        .eq('deposito_id', warehouseId)
        .order('created_at', { ascending: false });

      if (mData) {
        setHistory(mData);

        const stockMap = new Map<string, any>();

        mData.forEach((mov: any) => {
          const prodId = mov.produto_id;
          const prod = mov.produtos;
          if (!prod) return;

          if (!stockMap.has(prodId)) {
            stockMap.set(prodId, {
              produto_id: prodId,
              nome: prod.nome,
              categoria: prod.categoria_id,
              unidade: prod.unidade_medida || 'un',
              custo_medio: Number(prod.custo_medio || 0),
              saldo: 0
            });
          }

          const item = stockMap.get(prodId);
          const qty = Number(mov.quantidade || 0);
          
          if (mov.tipo === 'IN' || mov.tipo === 'in') {
            item.saldo += qty;
          } else {
            item.saldo -= qty;
          }
        });

        const currentStock = Array.from(stockMap.values())
          .filter(item => item.saldo > 0)
          .map(item => ({
            ...item,
            valor_total: item.saldo * item.custo_medio
          }))
          .sort((a, b) => b.valor_total - a.valor_total);

        setStockItems(currentStock);
      }
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredStock = stockItems.filter(item => 
    item.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHistory = history.filter(item => 
    item.produtos?.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stockColumns = [
    {
      header: 'Insumo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'left' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>{item.categoria || 'Geral'}</span>
        </div>
      )
    },
    {
      header: 'Saldo',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontSize: '14px', fontWeight: 900, color: '#0f172a' }}>{Number(item.saldo).toLocaleString('pt-BR')}</span>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>{item.unidade}</span>
        </div>
      )
    },
    {
      header: 'Custo Un.',
      accessor: (item: any) => (
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
          {item.custo_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    },
    {
      header: 'Total Retido',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontWeight: 800, fontSize: '14px' }}>
          <DollarSign size={14} />
          {item.valor_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      )
    }
  ];

  const historyColumns = [
    {
      header: 'Data',
      accessor: (item: any) => {
        const d = new Date(item.created_at || new Date());
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#1e293b', fontSize: '12px' }}>{d.toLocaleDateString('pt-BR')}</span>
            <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        );
      }
    },
    {
      header: 'Tipo',
      accessor: (item: any) => {
        const isEntry = item.tipo === 'IN' || item.tipo === 'in';
        return (
          <span className={`status-pill ${isEntry ? 'active' : 'danger'}`} style={{ display: 'inline-flex', gap: '4px', alignItems: 'center', padding: '4px 8px', fontSize: '9px' }}>
            {isEntry ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {isEntry ? 'ENTRADA' : 'SAÍDA'}
          </span>
        );
      }
    },
    {
      header: 'Insumo',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700, color: '#334155', fontSize: '12px' }}>{item.produtos?.nome || 'Item Desconhecido'}</span>
      )
    },
    {
      header: 'Qtd.',
      accessor: (item: any) => {
        const isEntry = item.tipo === 'IN' || item.tipo === 'in';
        return (
          <span style={{ fontWeight: 800, color: isEntry ? '#10b981' : '#ef4444', fontSize: '13px' }}>
            {isEntry ? '+' : '-'}{Number(item.quantidade).toLocaleString('pt-BR')}
          </span>
        );
      }
    }
  ];

  return createPortal(
    <div className="tauze-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="tauze-modal-container large"
        style={{ maxWidth: '900px', width: '95%' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="tauze-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ 
              background: 'rgba(255,255,255,0.1)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#38bdf8'
            }}>
              <Package size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{warehouseName || 'Detalhes do Depósito'}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Posição de Estoque & Movimentações</p>
            </div>
          </div>
          <button className="icon-btn-secondary" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="tauze-modal-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, overflow: 'hidden' }}>
          
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div className="tauze-tab-group" style={{ margin: 0, flex: 1 }}>
              <button 
                className={`tauze-tab-item ${activeTab === 'stock' ? 'active' : ''}`} 
                onClick={() => setActiveTab('stock')}
                style={{ flex: 1 }}
              >
                Saldo Atual
              </button>
              <button 
                className={`tauze-tab-item ${activeTab === 'history' ? 'active' : ''}`} 
                onClick={() => setActiveTab('history')}
                style={{ flex: 1 }}
              >
                Extrato (Histórico)
              </button>
            </div>

            <div className="tauze-search-wrapper" style={{ width: '280px', margin: 0, background: '#f8fafc' }}>
              <Search size={18} className="s-icon" />
              <input 
                type="text" 
                className="tauze-search-input"
                placeholder="Filtrar insumo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ background: 'transparent' }}
              />
            </div>
          </div>

          <div style={{ flex: 1, minHeight: '400px', overflowY: 'auto', background: 'white', border: '1px solid #f1f5f9', borderRadius: '16px' }}>
            {activeTab === 'stock' ? (
              <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
                data={filteredStock}
                columns={stockColumns}
                loading={loading}
                hideHeader={true}
              />
            ) : (
              <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          } 
                data={filteredHistory}
                columns={historyColumns}
                loading={loading}
                hideHeader={true}
              />
            )}
            
            {!loading && activeTab === 'stock' && filteredStock.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '13px' }}>Nenhum insumo encontrado neste depósito.</p>
              </div>
            )}

            {!loading && activeTab === 'history' && filteredHistory.length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                <p style={{ fontWeight: 600, fontSize: '13px' }}>Nenhuma movimentação registrada.</p>
              </div>
            )}
          </div>

        </div>
        
        <div className="tauze-modal-footer">
          <button type="button" className="glass-btn secondary" onClick={onClose}>
            Fechar
          </button>
        </div>

      </motion.div>
    </div>,
    document.body
  );
};
