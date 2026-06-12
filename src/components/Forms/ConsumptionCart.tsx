import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from './SearchableSelect';
import { Plus, Trash2, Package, Layers, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ConsumptionItem {
  id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custo_medio: number;
  deposito_id: string;
  
  // Specific for Health/Sanidade
  via_aplicacao?: string;
  local_aplicacao?: string;
  carencia_dias?: number;

  // Specific for Movement/Inventory
  valor_unitario?: number;
  lote?: string;
  data_validade?: string;
}

interface ConsumptionCartProps {
  items: ConsumptionItem[];
  onChange: (items: ConsumptionItem[]) => void;
  title?: string;
  subtitle?: string;
  
  // Feature flags for specific modules
  showHealthFields?: boolean;
  filterCategories?: string[]; // e.g. ['medicamento', 'vacina'] ou ['combustível']
  mode?: 'consumption' | 'formulation' | 'movement';
  isEntry?: boolean; // For movement mode: is it an IN operation?
  hideDeposit?: boolean;
}

export const ConsumptionCart: React.FC<ConsumptionCartProps> = ({ 
  items, 
  onChange, 
  title = "Insumos Consumidos", 
  subtitle = "Informe os produtos, quantidades e depósitos de saída.",
  showHealthFields = false,
  filterCategories = [],
  mode = 'consumption',
  isEntry = false,
  hideDeposit = false
}) => {
  const { activeTenantId, activeFarm } = useTenant();
  const [products, setProducts] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTenantId && activeFarm?.id) {
      fetchData();
    }
  }, [activeTenantId, activeFarm]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Deposits
      const { data: depData } = await supabase
        .from('depositos')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .eq('fazenda_id', activeFarm.id)
        .eq('status', 'ativo')
        .order('nome');
      if (depData) setDeposits(depData);

      // 2. Fetch Products
      let pQuery = supabase
        .from('produtos')
        .select(`
          id, nome, unidade, custo_medio, categoria_id,
          categorias_sistema(nome)
        `)
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true);
      
      if (filterCategories.length > 0) {
        // Simple logic to fetch categories based on partial matching name (e.g. 'medicamento')
        const { data: catData } = await supabase
          .from('categorias_sistema')
          .select('id, nome')
          .eq('modulo', 'estoque');
          
        if (catData) {
          const matchedIds = catData
            .filter((c: any) => filterCategories.some(fc => c.nome.toLowerCase().includes(fc.toLowerCase())))
            .map((c: any) => c.id);
            
          if (matchedIds.length > 0) {
            pQuery = pQuery.in('categoria_id', matchedIds);
          }
        }
      }

      const { data: prodData } = await pQuery.order('nome');
      if (prodData) setProducts(prodData);
    } catch (err) {
      console.error('Error fetching data for StockConsumptionCart', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    const newItem: ConsumptionItem = {
      id: Math.random().toString(36).substr(2, 9),
      produto_id: '',
      nome: '',
      quantidade: 0,
      unidade: 'UN',
      custo_medio: 0,
      deposito_id: deposits.length > 0 ? deposits[0].id : '',
      via_aplicacao: showHealthFields ? 'IM' : undefined,
      local_aplicacao: showHealthFields ? '' : undefined,
      carencia_dias: showHealthFields ? 0 : undefined,
      valor_unitario: mode === 'movement' && isEntry ? 0 : undefined,
      lote: mode === 'movement' ? '' : undefined,
      data_validade: mode === 'movement' ? '' : undefined
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ConsumptionItem>) => {
    onChange(items.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleSelectProduct = (itemId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    handleUpdateItem(itemId, {
      produto_id: product.id,
      nome: product.nome,
      unidade: product.unidade || 'UN',
      custo_medio: product.custo_medio || 0
    });
  };

  return (
    <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', overflow: 'hidden', marginTop: '16px' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'hsl(var(--bg-main) / 0.3)' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} /> {title}
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{subtitle}</p>
        </div>
        <button 
          type="button"
          onClick={handleAddItem}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'hsl(var(--brand))', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '10px', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}
        >
          <Plus size={14} /> Adicionar Item
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: showHealthFields ? '900px' : '600px' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: mode === 'formulation' ? 'auto' : '250px' }}>Insumo / Produto</th>
              {!hideDeposit && (mode === 'consumption' || mode === 'movement') && (
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '200px' }}>{mode === 'movement' && isEntry ? 'Depósito de Destino' : mode === 'movement' ? 'Depósito' : 'Depósito de Saída'}</th>
              )}
              <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '100px' }}>Qtd</th>
              
              {showHealthFields && (
                <>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '120px' }}>Via</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '120px' }}>Local</th>
                  <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '90px' }}>Carência</th>
                </>
              )}
              
              {mode === 'movement' && (
                <>
                  {isEntry && <th style={{ textAlign: 'center', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '100px' }}>V. Unitário</th>}
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '120px' }}>Lote</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '120px' }}>Validade</th>
                </>
              )}

              {mode !== 'movement' && <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', borderBottom: '1px solid hsl(var(--border))', width: '100px' }}>Custo (Est)</th>}
              <th style={{ borderBottom: '1px solid hsl(var(--border))', width: '50px' }}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                  <SearchableSelect
                    value={item.produto_id}
                    onChange={(val: any) => handleSelectProduct(item.id, val)}
                    options={products.map(p => ({ value: p.id, label: `${p.nome} (${p.unidade || 'UN'})` }))}
                    placeholder="Selecione o produto..."
                    height="36px"
                  />
                </td>
                {!hideDeposit && (mode === 'consumption' || mode === 'movement') && (
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                    <SearchableSelect
                      value={item.deposito_id}
                      onChange={(val: any) => handleUpdateItem(item.id, { deposito_id: val })}
                      options={deposits.map(d => ({ value: d.id, label: d.nome }))}
                      placeholder="Selecione..."
                      height="36px"
                    />
                  </td>
                )}
                <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input 
                      type="number"
                      step="0.01"
                      className="tauze-input"
                      style={{ padding: '0 8px', height: '36px', textAlign: 'center', width: '100%' }}
                      value={item.quantidade || ''}
                      onChange={(e) => handleUpdateItem(item.id, { quantidade: parseFloat(e.target.value) || 0 })}
                      placeholder="0"
                    />
                    <span style={{ position: 'absolute', right: '8px', fontSize: '10px', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }}>
                      {item.unidade}
                    </span>
                  </div>
                </td>
                
                {showHealthFields && (
                  <>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <select 
                        className="tauze-input" 
                        style={{ height: '36px' }}
                        value={item.via_aplicacao || ''}
                        onChange={(e) => handleUpdateItem(item.id, { via_aplicacao: e.target.value })}
                      >
                        <option value="IM">Intramuscular (IM)</option>
                        <option value="SC">Subcutânea (SC)</option>
                        <option value="IV">Intravenosa (IV)</option>
                        <option value="ORAL">Via Oral</option>
                        <option value="TOPICO">Tópico/Pour-on</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <input 
                        type="text"
                        className="tauze-input"
                        style={{ height: '36px' }}
                        value={item.local_aplicacao || ''}
                        onChange={(e) => handleUpdateItem(item.id, { local_aplicacao: e.target.value })}
                        placeholder="Ex: Tábua pescoço"
                      />
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                       <input 
                        type="number"
                        className="tauze-input"
                        style={{ height: '36px', textAlign: 'center' }}
                        value={item.carencia_dias || ''}
                        onChange={(e) => handleUpdateItem(item.id, { carencia_dias: parseInt(e.target.value) || 0 })}
                        placeholder="Dias"
                      />
                    </td>
                  </>
                )}

                {mode === 'movement' && (
                  <>
                    {isEntry && (
                      <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <span style={{ position: 'absolute', left: '8px', fontSize: '10px', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }}>R$</span>
                          <input 
                            type="number"
                            step="0.01"
                            className="tauze-input"
                            style={{ padding: '0 8px 0 24px', height: '36px', textAlign: 'center', width: '100%' }}
                            value={item.valor_unitario || ''}
                            onChange={(e) => handleUpdateItem(item.id, { valor_unitario: parseFloat(e.target.value) || 0 })}
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                    )}
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                      <input 
                        type="text"
                        className="tauze-input"
                        style={{ height: '36px' }}
                        value={item.lote || ''}
                        onChange={(e) => handleUpdateItem(item.id, { lote: e.target.value })}
                        placeholder="Ex: L123"
                      />
                    </td>
                    <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}>
                       <input 
                        type="date"
                        className="tauze-input"
                        style={{ height: '36px' }}
                        value={item.data_validade || ''}
                        onChange={(e) => handleUpdateItem(item.id, { data_validade: e.target.value })}
                      />
                    </td>
                  </>
                )}

                {mode !== 'movement' && (
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)', textAlign: 'right', fontWeight: 700, fontSize: '12px', color: 'hsl(var(--text-main))' }}>
                    {((item.custo_medio || 0) * (item.quantidade || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                )}
                <td style={{ padding: '10px 16px', borderBottom: '1px solid hsl(var(--border) / 0.5)', textAlign: 'center' }}>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveItem(item.id)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Remover"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {items.length === 0 && (
          <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            <Package size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
            <div style={{ fontSize: '12px', fontWeight: 600 }}>Nenhum insumo lançado.</div>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>Clique em "Adicionar Item" para informar o consumo.</div>
          </div>
        )}
      </div>
      
      {items.length > 0 && (
        <div style={{ padding: '12px 20px', background: 'hsl(var(--bg-main)/0.3)', borderTop: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
           <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>
             Custo Total Estimado
           </div>
           <div style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
             {items.reduce((acc, curr) => acc + ((curr.custo_medio || 0) * (curr.quantidade || 0)), 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
           </div>
        </div>
      )}
    </div>
  );
};
