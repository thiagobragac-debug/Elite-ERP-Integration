import React, { useState, useEffect, useMemo } from 'react';
import { SidePanel } from '../Layout/SidePanel';
import { ClipboardCheck, Search, Plus, AlertTriangle, CheckSquare, Square, Save } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';

interface AuditExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  audit: any | null;
}

export const AuditExecutionModal: React.FC<AuditExecutionModalProps> = ({
  isOpen,
  onClose,
  audit,
}) => {
  const { activeTenantId } = useTenant();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  // State to hold user input
  // key: "produto_id|lote"
  const [counts, setCounts] = useState<Record<string, { quantidade: string; confirmado_zero: boolean; is_extra: boolean }>>({});
  
  // State for extra items added by the user
  const [extraItems, setExtraItems] = useState<any[]>([]);

  // Fetch Expected Items
  const { data: expectedItems = [], isLoading: isLoadingExpected } = useQuery({
    queryKey: ['audit_expected_items', audit?.id, activeTenantId],
    queryFn: async () => {
      if (!audit || !audit.deposito_id) return [];
      
      let query = supabase
        .from('saldos_estoque')
        .select(`
          produto_id,
          lote,
          data_validade,
          quantidade,
          produtos (
            id,
            nome,
            unidade,
            categorias_sistema (nome)
          )
        `)
        .eq('tenant_id', activeTenantId)
        .eq('deposito_id', audit.deposito_id)
        .gt('quantidade', 0);
        
      const { data, error } = await query;
      if (error) throw error;
      
      // Filter by category if not 'Todos os Itens'
      let filtered = data || [];
      if (audit.categoria && audit.categoria !== 'Todos os Itens') {
        filtered = filtered.filter((row: any) => {
          const catNome = row.produtos?.categorias_sistema?.nome;
          return catNome === audit.categoria;
        });
      }
      return filtered;
    },
    enabled: isOpen && !!audit && !!activeTenantId,
  });

  useEffect(() => {
    if (isOpen) {
      setCounts({});
      setExtraItems([]);
      setSearchTerm('');
    }
  }, [isOpen, audit]);

  const allItems = useMemo(() => {
    const list = expectedItems.map((e: any) => ({
      key: `${e.produto_id}|${e.lote || 'GERAL'}`,
      produto_id: e.produto_id,
      nome: e.produtos?.nome || 'Desconhecido',
      unidade: e.produtos?.unidade || 'UN',
      lote: e.lote || 'GERAL',
      data_validade: e.data_validade,
      is_extra: false
    }));
    
    extraItems.forEach(e => {
      list.push({
        key: `${e.produto_id}|${e.lote || 'GERAL'}`,
        produto_id: e.produto_id,
        nome: e.nome,
        unidade: e.unidade,
        lote: e.lote || 'GERAL',
        data_validade: e.data_validade,
        is_extra: true
      });
    });
    
    return list.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [expectedItems, extraItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return allItems;
    return allItems.filter(item => 
      item.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.lote.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allItems, searchTerm]);

  const updateCount = (key: string, field: 'quantidade' | 'confirmado_zero', value: any) => {
    setCounts(prev => {
      const curr = prev[key] || { quantidade: '', confirmado_zero: false, is_extra: false };
      return {
        ...prev,
        [key]: { ...curr, [field]: value }
      };
    });
  };

  const handleAddExtra = () => {
    toast("Para adicionar item extra, o fluxo de busca de produto seria aberto aqui. (Omitido para brevidade)");
  };

  const executeAuditMutation = useMutation({
    mutationFn: async (payload: any[]) => {
      const { data, error } = await supabase.rpc('execute_audit_count', {
        p_auditoria_id: audit.id,
        p_tenant_id: activeTenantId,
        p_itens: payload
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
      toast.success('Auditoria concluída com sucesso!');
      onClose();
    },
    onError: (err: any) => {
      toast.error(`Erro ao finalizar: ${err.message}`);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that all expected items have been accounted for
    const missing = expectedItems.filter((item: any) => {
      const key = `${item.produto_id}|${item.lote || 'GERAL'}`;
      const state = counts[key];
      if (!state) return true; // not touched
      if (state.quantidade === '' && !state.confirmado_zero) return true; // not filled and not marked as zero
      return false;
    });

    if (missing.length > 0) {
      toast.error(`Você possui ${missing.length} item(ns) pendentes. Preencha a quantidade ou marque "Confirmar Zero".`);
      return;
    }

    const payload = allItems.map(item => {
      const state = counts[item.key] || { quantidade: '0', confirmado_zero: true };
      const qty = state.quantidade === '' ? 0 : parseFloat(state.quantidade);
      return {
        produto_id: item.produto_id,
        lote: item.lote === 'GERAL' ? null : item.lote,
        data_validade: item.data_validade,
        quantidade_encontrada: qty
      };
    });

    setLoading(true);
    executeAuditMutation.mutate(payload, {
      onSettled: () => setLoading(false)
    });
  };

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={onClose}
      onSubmit={handleSubmit}
      title={`Executar: ${audit?.titulo}`}
      subtitle={`Depósito: ${audit?.deposito_id} | ${audit?.contagem_cega ? 'Modo Cego Ativo' : 'Conferência Padrão'}`}
      icon={ClipboardCheck}
      loading={loading}
      submitLabel="Finalizar e Aplicar Ajustes"
    >
      <div className="tauze-controls-row" style={{ padding: 0, border: 'none', marginBottom: '16px' }}>
        <div className="tauze-search-wrapper" style={{ flex: 1 }}>
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por produto ou lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button type="button" className="icon-btn-secondary" onClick={handleAddExtra} title="Adicionar Item Extra">
          <Plus size={20} />
        </button>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        padding: '12px',
        borderRadius: '8px',
        background: '#fff7ed',
        border: '1px solid #ffedd5',
        marginBottom: '16px'
      }}>
        <AlertTriangle size={20} style={{ color: '#ea580c', flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: '12px', lineHeight: 1.5, color: '#9a3412' }}>
          <strong>Atenção:</strong> Você deve preencher a quantidade física real encontrada para todos os itens. Se um item não for encontrado, marque a caixa "Confirmar Zero". Não deixe itens em branco.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={{ padding: '12px 8px', fontSize: '10px', color: 'hsl(var(--text-muted))', borderBottom: '1px solid hsl(var(--border))' }}>PRODUTO</th>
              <th style={{ padding: '12px 8px', fontSize: '10px', color: 'hsl(var(--text-muted))', borderBottom: '1px solid hsl(var(--border))' }}>LOTE / VAL.</th>
              <th style={{ padding: '12px 8px', fontSize: '10px', color: 'hsl(var(--text-muted))', borderBottom: '1px solid hsl(var(--border))' }}>QTD FÍSICA</th>
              <th style={{ padding: '12px 8px', fontSize: '10px', color: 'hsl(var(--text-muted))', borderBottom: '1px solid hsl(var(--border))', width: '110px' }}>ESTOQUE ZERO?</th>
            </tr>
          </thead>
          <tbody>
            {isLoadingExpected ? (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Carregando itens esperados...</td></tr>
            ) : filteredItems.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>Nenhum item encontrado.</td></tr>
            ) : (
              filteredItems.map(item => {
                const state = counts[item.key] || { quantidade: '', confirmado_zero: false };
                const isZeroed = state.confirmado_zero;
                return (
                  <tr key={item.key} style={{ background: isZeroed ? '#f8fafc' : 'transparent', opacity: isZeroed ? 0.7 : 1 }}>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: 'hsl(var(--text-main))' }}>{item.nome}</div>
                      {item.is_extra && <span style={{ fontSize: '10px', color: '#3b82f6', background: '#eff6ff', padding: '2px 6px', borderRadius: '4px' }}>Extra</span>}
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <div style={{ fontSize: '12px', color: 'hsl(var(--text-main))' }}>{item.lote}</div>
                      <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>{item.data_validade ? new Date(item.data_validade).toLocaleDateString() : 'Sem Validade'}</div>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="number"
                          step="0.01"
                          disabled={isZeroed}
                          value={state.quantidade}
                          onChange={(e) => updateCount(item.key, 'quantidade', e.target.value)}
                          className="tauze-input"
                          style={{ width: '100px', margin: 0, padding: '4px 8px', background: isZeroed ? '#f1f5f9' : 'white' }}
                          placeholder="Qtd..."
                        />
                        <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 800 }}>{item.unidade}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)', textAlign: 'center' }}>
                      <div 
                        style={{ cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                        onClick={() => {
                          updateCount(item.key, 'confirmado_zero', !isZeroed);
                          if (!isZeroed) {
                            updateCount(item.key, 'quantidade', ''); // clear input when marked as zero
                          }
                        }}
                      >
                        {isZeroed ? <CheckSquare size={20} color="#10b981" /> : <Square size={20} color="#cbd5e1" />}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </SidePanel>
  );
};
