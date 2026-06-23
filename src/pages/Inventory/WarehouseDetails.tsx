import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import {
  Search,
  ArrowLeft,
  Layout,
  Boxes,
  DollarSign,
  Activity,
  Package,
  Calendar,
  ArrowDownRight,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { useServerPagination } from '../../hooks/useServerPagination';

export const WarehouseDetails: React.FC = () => {
  const { page, pageSize, totalCount, setTotalCount, setPage, getRange } = useServerPagination(20);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [warehouse, setWarehouse] = useState<any>(null);
  const [stockItems, setStockItems] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'stock' | 'history') || 'stock';
  const setActiveTab = (tab: string) => {
    setSearchParams(
      (prev) => {
        const n = new URLSearchParams(prev);
        n.set('tab', tab);
        return n;
      },
      { replace: true }
    );
  };

  useEffect(() => {
    if (id) {
      fetchData();
    }
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Warehouse Info
      const { data: wData } = await supabase
        .from('depositos')
        .select('*', { count: 'exact' })
        .eq('id', id)
        .single();

      if (wData) {
        setWarehouse(wData);
      }

      // 2. Fetch Movements with Products
      const { data: mData } = await supabase
        .from('movimentacoes_estoque')
        .select(
          `
          *,
          produtos (
            id,
            nome,
            categoria_id,
            custo_medio,
            unidade_medida
          )
        `
        )
        .eq('deposito_id', id)
        .order('created_at', { ascending: false });

      if (mData) {
        // Build History
        setHistory(mData);

        // Calculate Stock per Product
        const stockMap = new Map<string, any>();

        mData.forEach((mov: any) => {
          const prodId = mov.produto_id;
          const prod = mov.produtos;
          if (!prod) {
            return;
          }

          if (!stockMap.has(prodId)) {
            stockMap.set(prodId, {
              produto_id: prodId,
              nome: prod.nome,
              categoria: prod.categoria_id,
              unidade: prod.unidade_medida || 'un',
              custo_medio: Number(prod.custo_medio || 0),
              saldo: 0,
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

        // Filter out zero balance
        const currentStock = Array.from(stockMap.values())
          .filter((item) => item.saldo > 0)
          .map((item) => ({
            ...item,
            valor_total: item.saldo * item.custo_medio,
          }))
          .sort((a, b) => b.valor_total - a.valor_total);

        setStockItems(currentStock);
      }
    } catch (error) {
      console.error('Error fetching warehouse details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!warehouse && !loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Depósito não encontrado.</h2>
        <button
          className="primary-btn"
          onClick={() => navigate('/estoque/deposito')}
          style={{ marginTop: '20px' }}
        >
          Voltar
        </button>
      </div>
    );
  }

  const totalValue = stockItems.reduce((acc, curr) => acc + curr.valor_total, 0);
  const totalItems = stockItems.length;
  const totalQuantity = stockItems.reduce((acc, curr) => acc + curr.saldo, 0);

  const stockColumns = [
    {
      header: 'Insumo / Produto',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'hsl(var(--bg-main))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
            }}
          >
            <Package size={20} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{item.nome}</span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#94a3b8',
                textTransform: 'uppercase',
              }}
            >
              {item.categoria || 'Geral'}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Saldo Atual',
      accessor: (item: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>
            {Number(item.saldo).toLocaleString('pt-BR')}
          </span>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b' }}>
            {item.unidade}
          </span>
        </div>
      ),
    },
    {
      header: 'Custo Médio (Un)',
      accessor: (item: any) => (
        <span style={{ fontSize: '14px', fontWeight: 700, color: '#475569' }}>
          {item.custo_medio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: '#10b981',
            fontWeight: 800,
            fontSize: '15px',
          }}
        >
          <DollarSign size={16} />
          {item.valor_total.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      ),
    },
  ];

  const historyColumns = [
    {
      header: 'Data / Hora',
      accessor: (item: any) => {
        const d = new Date(item.created_at || new Date());
        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: '#1e293b' }}>
              {d.toLocaleDateString('pt-BR')}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
              {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        );
      },
    },
    {
      header: 'Tipo',
      accessor: (item: any) => {
        const isEntry = item.tipo === 'IN' || item.tipo === 'in';
        return (
          <span
            className={`status-pill ${isEntry ? 'active' : 'danger'}`}
            style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}
          >
            {isEntry ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
            {isEntry ? 'ENTRADA' : 'SAÍDA'}
          </span>
        );
      },
    },
    {
      header: 'Insumo',
      accessor: (item: any) => (
        <span style={{ fontWeight: 700, color: '#334155' }}>
          {item.produtos?.nome || 'Item Desconhecido'}
        </span>
      ),
    },
    {
      header: 'Quantidade',
      accessor: (item: any) => {
        const isEntry = item.tipo === 'IN' || item.tipo === 'in';
        return (
          <span style={{ fontWeight: 800, color: isEntry ? '#10b981' : '#ef4444' }}>
            {isEntry ? '+' : '-'}
            {Number(item.quantidade).toLocaleString('pt-BR')}{' '}
            {item.produtos?.unidade_medida || 'un'}
          </span>
        );
      },
    },
    {
      header: 'Custo Transação',
      accessor: (item: any) => {
        const cost = Number(item.produtos?.custo_medio || 0) * Number(item.quantidade);
        return (
          <span style={{ fontWeight: 700, color: '#64748b' }}>
            {cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        );
      },
    },
  ];

  return (
    <div className="inventory-page animate-slide-up" style={{ paddingBottom: '40px' }}>
      <header className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            className="icon-btn-secondary"
            onClick={() => navigate('/estoque/deposito')}
            title="Voltar para Depósitos"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="header-brand-group" style={{ margin: 0 }}>
            <Breadcrumb
              paths={[
                { label: 'Estoque & Insumos', href: '/estoque/dashboard' },
                { label: warehouse?.nome || 'Carregando...' },
              ]}
            />
            <h1 className="page-title">{warehouse?.nome || 'Carregando...'}</h1>
            <p className="page-subtitle">
              {warehouse?.tipo || 'Depósito'} • {warehouse?.localizacao_tecnica || 'Sede'}
            </p>
          </div>
        </div>
      </header>

      <div className="next-gen-kpi-grid" style={{ marginBottom: '32px' }}>
        <TauzeStatCard
          label="Total de Insumos (Variedades)"
          value={totalItems}
          icon={Boxes}
          color="#3b82f6"
          progress={100}
          change="Mix de Produtos"
          periodLabel="Armazenados"
        />
        <TauzeStatCard
          label="Quantidade Física Total"
          value={totalQuantity.toLocaleString('pt-BR')}
          icon={Package}
          color="#f59e0b"
          progress={
            warehouse?.capacidade_maxima > 0
              ? (totalQuantity / warehouse.capacidade_maxima) * 100
              : 0
          }
          change={
            warehouse?.capacidade_maxima > 0
              ? `${Math.round((totalQuantity / warehouse.capacidade_maxima) * 100)}% de Ocupação`
              : 'Capacidade N/A'
          }
          periodLabel="Itens/Unidades"
        />
        <TauzeStatCard
          label="Patrimônio Armazenado"
          value={totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          icon={DollarSign}
          color="#10b981"
          progress={totalValue > 0 ? 100 : 0}
          change="Valor em Custo Médio"
          periodLabel="Neste Depósito"
        />
        <TauzeStatCard
          label="Status do Local"
          value={warehouse?.status === 'ativo' ? 'Operacional' : 'Inativo'}
          icon={Activity}
          color={warehouse?.status === 'ativo' ? '#10b981' : '#ef4444'}
          progress={warehouse?.status === 'ativo' ? 100 : 0}
          change="Estrutura"
          periodLabel="Disponível"
        />
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          <button
            className={`tauze-tab-item ${activeTab === 'stock' ? 'active' : ''}`}
            onClick={() => setActiveTab('stock')}
          >
            Posição de Estoque
          </button>
          <button
            className={`tauze-tab-item ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            Histórico de Movimentações
          </button>
        </div>
      </div>

      <div
        className="details-content"
        style={{
          background: 'hsl(var(--bg-card))',
          borderRadius: '24px',
          border: '1px solid hsl(var(--border))',
          padding: '24px',
        }}
      >
        {activeTab === 'stock' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Saldo por Insumo
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Posição consolidada das entradas e saídas neste local.
                </p>
              </div>
            </div>
            <ModernTable
              emptyState={
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              }
              data={stockItems}
              columns={stockColumns}
              loading={loading}
              hideHeader={true}
            />
            {stockItems.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>Nenhum insumo armazenado neste depósito.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
              }}
            >
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Últimas Movimentações
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b' }}>
                  Histórico de transações exclusivas deste depósito.
                </p>
              </div>
            </div>
            <ModernTable
              emptyState={
                <EmptyState
                  title="Nenhum registro encontrado"
                  description="Sua busca não retornou resultados."
                  icon={Search}
                />
              }
              data={history}
              columns={historyColumns}
              loading={loading}
              hideHeader={true}
            />
            {history.length === 0 && !loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                <Calendar size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontWeight: 600 }}>Nenhuma movimentação registrada.</p>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};
