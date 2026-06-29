import React, { useState, useEffect } from 'react';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { supabase } from '../../lib/supabase';
import { SearchableSelect } from './SearchableSelect';
import { Plus, Trash2, Package, Layers, Activity, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

export interface ConsumptionItem {
  id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  custo_medio: number;
  custo_padrao?: number; // referência do cadastro do insumo
  deposito_id: string;

  // Specific for Health/Sanidade
  via_aplicacao?: string;
  local_aplicacao?: string;
  carencia_abate_dias?: number;
  carencia_leite_dias?: number;

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
  filterModule?: string;
  mode?: 'consumption' | 'formulation' | 'movement';
  isEntry?: boolean; // For movement mode: is it an IN operation?
  hideDeposit?: boolean;
}

export const ConsumptionCart: React.FC<ConsumptionCartProps> = ({
  items,
  onChange,
  title = 'Insumos Consumidos',
  subtitle = 'Informe os produtos, quantidades e depósitos de saída.',
  showHealthFields = false,
  filterModule,
  mode = 'consumption',
  isEntry = false,
  hideDeposit = false,
}) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();
  const [products, setProducts] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTenantId) {
      fetchData();
    }
  }, [activeTenantId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Deposits
      const { data: depData } = await applyFarmFilter(
        supabase.from('depositos').select('id, nome').eq('tenant_id', activeTenantId)
      ).eq('status', 'ativo').order('nome');
      if (depData) {
        setDeposits(depData);
      }

      // 2. Fetch Products
      let pQuery = supabase
        .from('produtos')
        .select(
          `
          id, nome, unidade, custo_medio, custo_padrao, custo_ultima_compra, is_storable, categoria_id, carencia_abate_dias, carencia_leite_dias,
          categorias_sistema(nome).eq('tenant_id', activeTenantId)
        `
        )
        .eq('tenant_id', activeTenantId)
        .eq('is_active', true);

      if (filterModule) {
        const allowedModules = ['geral', filterModule];
        if (filterModule.startsWith('bovinocultura_')) {
          allowedModules.push('bovinocultura_geral');
        }
        if (filterModule.startsWith('frota_')) {
          allowedModules.push('frota_geral');
        }

        const { data: catData } = await supabase
          .from('categorias_sistema')
          .select('id')
          .eq('tenant_id', activeTenantId)
          .eq('modulo', 'estoque')
          .in('modulo_vinculado', allowedModules);

        if (catData && catData.length > 0) {
          pQuery = pQuery.in(
            'categoria_id',
            catData.map((c: any) => c.id)
          );
        }
      }

      const { data: prodData } = await pQuery.order('nome');
      if (prodData) {
        setProducts(prodData);
      }
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
      carencia_abate_dias: showHealthFields ? 0 : undefined,
      carencia_leite_dias: showHealthFields ? 0 : undefined,
      valor_unitario: mode === 'movement' && isEntry ? 0 : undefined,
      lote: mode === 'movement' ? '' : undefined,
      data_validade: mode === 'movement' ? '' : undefined,
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter((item) => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<ConsumptionItem>) => {
    onChange(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const handleSelectProduct = (itemId: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) {
      return;
    }

    // Hierarquia de custo:
    // 1. is_storable=true  → custo_medio (calculado pelas NFs)
    // 2. is_storable=false → custo_ultima_compra (último preço da NF)
    // 3. Fallback          → custo_padrao (informado manualmente no cadastro)
    let custoRef = 0;
    if (product.is_storable) {
      custoRef = product.custo_medio || product.custo_padrao || 0;
    } else {
      custoRef = product.custo_ultima_compra || product.custo_padrao || 0;
    }

    handleUpdateItem(itemId, {
      produto_id: product.id,
      nome: product.nome,
      unidade: product.unidade || 'UN',
      custo_medio: custoRef,
      custo_padrao: product.custo_padrao || 0,
      // Carência preenchida automaticamente do cadastro do insumo
      ...(showHealthFields && {
        carencia_abate_dias: product.carencia_abate_dias || 0,
        carencia_leite_dias: product.carencia_leite_dias || 0,
      }),
    });
  };

  return (
    <div
      style={{
        background: 'hsl(var(--bg-card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: '16px',
        overflow: 'hidden',
        marginTop: '16px',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid hsl(var(--border))',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'hsl(var(--bg-main) / 0.3)',
        }}
      >
        <div>
          <h4
            style={{
              margin: 0,
              fontSize: '13px',
              fontWeight: 800,
              color: 'hsl(var(--text-main))',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={16} /> {title}
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            {subtitle}
          </p>
        </div>
        <button
          type="button"
          onClick={handleAddItem}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'hsl(var(--brand))',
            color: '#fff',
            border: 'none',
            padding: '8px 14px',
            borderRadius: '10px',
            fontSize: '11px',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> Adicionar Item
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed',
            minWidth: mode === 'formulation' ? '100%' : '0',
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid hsl(var(--border))',
                  width: '200px',
                }}
              >
                Insumo / Produto
              </th>
              {!hideDeposit && (mode === 'consumption' || mode === 'movement') && (
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid hsl(var(--border))',
                    width: '115px',
                  }}
                >
                  {mode === 'movement' && isEntry
                    ? 'Depósito de Destino'
                    : mode === 'movement'
                      ? 'Depósito'
                      : 'Depósito de Saída'}
                </th>
              )}
              <th
                style={{
                  textAlign: 'left',
                  padding: '12px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  borderBottom: '1px solid hsl(var(--border))',
                  width: mode === 'formulation' ? '70px' : '80px',
                }}
              >
                Qtd
              </th>

              {showHealthFields && (
                <>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid hsl(var(--border))',
                      width: '75px',
                    }}
                  >
                    Via
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid hsl(var(--border))',
                      width: '90px',
                    }}
                  >
                    Lote (Fab.)
                  </th>
                </>
              )}

              {mode === 'movement' && (
                <>
                  {isEntry && (
                    <th
                      style={{
                        textAlign: 'left',
                        padding: '12px 8px',
                        fontSize: '10px',
                        fontWeight: 800,
                        color: 'hsl(var(--text-muted))',
                        textTransform: 'uppercase',
                        borderBottom: '1px solid hsl(var(--border))',
                        width: '100px',
                      }}
                    >
                      V. Unitário
                    </th>
                  )}
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid hsl(var(--border))',
                      width: '120px',
                    }}
                  >
                    Lote
                  </th>
                  <th
                    style={{
                      textAlign: 'left',
                      padding: '12px 8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid hsl(var(--border))',
                      width: '120px',
                    }}
                  >
                    Validade
                  </th>
                </>
              )}

              {mode !== 'movement' && (
                <th
                  style={{
                    textAlign: 'left',
                    padding: '12px 8px',
                    fontSize: '10px',
                    fontWeight: 800,
                    color: 'hsl(var(--text-muted))',
                    textTransform: 'uppercase',
                    borderBottom: '1px solid hsl(var(--border))',
                    width: '90px',
                  }}
                >
                  Custo (Est)
                </th>
              )}
              <th style={{ borderBottom: '1px solid hsl(var(--border))', width: '45px' }} />
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td
                  style={{ padding: '8px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}
                >
                  <SearchableSelect
                    value={item.produto_id}
                    onChange={(val: any) => handleSelectProduct(item.id, val)}
                    options={products.map((p) => ({
                      value: p.id,
                      label: `${p.nome} (${p.unidade || 'UN'})`,
                    }))}
                    placeholder="Selecione o produto..."
                    height="36px"
                  />
                </td>
                {!hideDeposit && (mode === 'consumption' || mode === 'movement') && (
                  <td
                    style={{
                      padding: '8px 8px',
                      borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    }}
                  >
                    <SearchableSelect
                      value={item.deposito_id}
                      onChange={(val: any) => handleUpdateItem(item.id, { deposito_id: val })}
                      options={deposits.map((d) => ({ value: d.id, label: d.nome }))}
                      placeholder="Selecione..."
                      height="36px"
                    />
                  </td>
                )}
                <td
                  style={{ padding: '8px 8px', borderBottom: '1px solid hsl(var(--border) / 0.5)' }}
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type="number"
                      step="0.01"
                      className="tauze-input"
                      style={{
                        padding: '0 8px',
                        height: '36px',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      value={item.quantidade || ''}
                      onChange={(e) =>
                        handleUpdateItem(item.id, { quantidade: parseFloat(e.target.value) || 0 })
                      }
                      placeholder="0"
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '8px',
                        fontSize: '10px',
                        color: 'hsl(var(--text-muted))',
                        pointerEvents: 'none',
                      }}
                    >
                      {item.unidade}
                    </span>
                  </div>
                </td>

                {showHealthFields && (
                  <>
                    <td
                      style={{
                        padding: '8px 8px',
                        borderBottom: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <select
                        className="tauze-input"
                        style={{ height: '36px', fontSize: '12px' }}
                        value={item.via_aplicacao || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { via_aplicacao: e.target.value })
                        }
                      >
                        <option value="IM">IM</option>
                        <option value="SC">SC</option>
                        <option value="IV">IV</option>
                        <option value="ORAL">Oral</option>
                        <option value="TOPICO">Tópico</option>
                      </select>
                    </td>
                    <td
                      style={{
                        padding: '8px 8px',
                        borderBottom: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <input
                        type="text"
                        className="tauze-input"
                        style={{ height: '36px', fontSize: '12px' }}
                        value={item.lote || ''}
                        onChange={(e) => handleUpdateItem(item.id, { lote: e.target.value })}
                        placeholder="Lote Fab."
                      />
                    </td>
                  </>
                )}

                {mode === 'movement' && (
                  <>
                    {isEntry && (
                      <td
                        style={{
                          padding: '8px 8px',
                          borderBottom: '1px solid hsl(var(--border) / 0.5)',
                        }}
                      >
                        <div
                          style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              left: '8px',
                              fontSize: '10px',
                              color: 'hsl(var(--text-muted))',
                              pointerEvents: 'none',
                            }}
                          >
                            R$
                          </span>
                          <input
                            type="number"
                            step="0.01"
                            className="tauze-input"
                            style={{
                              padding: '0 8px 0 24px',
                              height: '36px',
                              textAlign: 'left',
                              width: '100%',
                            }}
                            value={item.valor_unitario || ''}
                            onChange={(e) =>
                              handleUpdateItem(item.id, {
                                valor_unitario: parseFloat(e.target.value) || 0,
                              })
                            }
                            placeholder="0.00"
                          />
                        </div>
                      </td>
                    )}
                    <td
                      style={{
                        padding: '8px 8px',
                        borderBottom: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <input
                        type="text"
                        className="tauze-input"
                        style={{ height: '36px' }}
                        value={item.lote || ''}
                        onChange={(e) => handleUpdateItem(item.id, { lote: e.target.value })}
                        placeholder="Ex: L123"
                      />
                    </td>
                    <td
                      style={{
                        padding: '8px 8px',
                        borderBottom: '1px solid hsl(var(--border) / 0.5)',
                      }}
                    >
                      <input
                        type="date"
                        className="tauze-input"
                        style={{ height: '36px' }}
                        value={item.data_validade || ''}
                        onChange={(e) =>
                          handleUpdateItem(item.id, { data_validade: e.target.value })
                        }
                      />
                    </td>
                  </>
                )}

                {mode !== 'movement' && (
                  <td
                    style={{
                      padding: '8px 8px',
                      borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          flex: 1,
                        }}
                      >
                        <span
                          style={{
                            position: 'absolute',
                            left: '8px',
                            fontSize: '10px',
                            color: 'hsl(var(--text-muted))',
                            pointerEvents: 'none',
                          }}
                        >
                          R$
                        </span>
                        <input
                          type="number"
                          step="0.01"
                          className="tauze-input"
                          style={{
                            padding: '0 8px 0 26px',
                            height: '36px',
                            textAlign: 'left',
                            width: '100%',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                          value={item.custo_medio || ''}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              custo_medio: parseFloat(e.target.value) || 0,
                            })
                          }
                          placeholder="0.00"
                        />
                      </div>
                      {item.custo_padrao &&
                        item.custo_padrao > 0 &&
                        Math.abs((item.custo_medio || 0) - item.custo_padrao) > 0.01 && (
                          <span
                            title={`Custo padrão cadastrado: R$ ${item.custo_padrao.toFixed(2)}`}
                            style={{ color: '#f59e0b', cursor: 'help', flexShrink: 0 }}
                          >
                            <AlertTriangle size={14} />
                          </span>
                        )}
                    </div>
                  </td>
                )}
                <td
                  style={{
                    padding: '8px 8px',
                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                    textAlign: 'center',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ef4444',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              Clique em "Adicionar Item" para informar o consumo.
            </div>
          </div>
        )}
      </div>

      {items.length > 0 && (
        <div
          style={{
            padding: '12px 20px',
            background: 'hsl(var(--bg-main)/0.3)',
            borderTop: '1px solid hsl(var(--border))',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {/* ── Barra de proporção — apenas modo formulation ── */}
          {mode === 'formulation' && (() => {
            const totalPct = items.reduce((acc, curr) => acc + (Number(curr.quantidade) || 0), 0);
            const isOk = totalPct >= 95 && totalPct <= 105;
            const isOver = totalPct > 105;
            const barColor = isOk ? '#10b981' : isOver ? '#ef4444' : '#f59e0b';
            const barWidth = Math.min(totalPct, 110);

            return (
              <div>
                {/* Label + valor */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Proporção Total da Formulação
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 900, color: barColor }}>
                    {totalPct.toFixed(1)}%
                  </span>
                </div>

                {/* Barra de progresso */}
                <div
                  style={{
                    height: '6px',
                    borderRadius: '4px',
                    background: 'hsl(var(--border))',
                    overflow: 'hidden',
                    marginBottom: '6px',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barWidth}%`,
                      background: barColor,
                      borderRadius: '4px',
                      transition: 'width 0.3s ease, background 0.3s ease',
                    }}
                  />
                </div>

                {/* Aviso se fora da faixa */}
                {!isOk && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      borderRadius: '7px',
                      background: isOver ? '#fef2f2' : '#fffbeb',
                      border: `1px solid ${isOver ? '#fecaca' : '#fde68a'}`,
                      color: isOver ? '#b91c1c' : '#92400e',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    <AlertTriangle size={13} />
                    {isOver
                      ? `Formulação acima de 100% (${totalPct.toFixed(1)}%) — revise as proporções.`
                      : `Formulação incompleta (${totalPct.toFixed(1)}%) — adicione mais ingredientes para atingir 100%.`}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Custo Total ── */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
              }}
            >
              Custo Total Estimado
            </div>
            <div style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(var(--brand))' }}>
              {items
                .reduce((acc, curr) => acc + (curr.custo_medio || 0) * (curr.quantidade || 0), 0)
                .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
