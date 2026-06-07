import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  DollarSign,
  ShoppingCart,
  Warehouse,
  Tag,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Loader2,
  Link2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { 
  findBestMatches, 
  getMatchStatus, 
  MATCH_STATUS_CONFIG,
  type MatchStatus 
} from '../../utils/fuzzyMatch';

export interface InsumoItem {
  id: string;
  produto_id: string;
  nome: string;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  despesa_adicional: number;
  desconto: number;
  deposito_id: string;
  total: number;
  // Campos de XML e matching
  xml_product_code?: string;
  xml_product_name?: string;
  xml_ncm?: string;
  match_status: MatchStatus;
  match_score?: number;
  match_source?: 'de_para' | 'fuzzy';
}

interface InsumoEntryTableProps {
  items: InsumoItem[];
  onChange: (items: InsumoItem[]) => void;
  isReadOnly?: boolean;
  companyId?: string;
  supplierId?: string;
  onPendingMatchesChange?: (count: number) => void;
}

export const InsumoEntryTable: React.FC<InsumoEntryTableProps> = ({ 
  items, onChange, isReadOnly = false, companyId, supplierId,
  onPendingMatchesChange
}) => {
  const { activeTenantId } = useTenant();
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [matchingItemIds, setMatchingItemIds] = useState<Set<string>>(new Set());

  // Rastreia quais IDs já passaram pelo auto-match para evitar loop infinito
  const processedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (activeTenantId) {
      fetchProducts();
      fetchDepositos();
    }
  }, [activeTenantId, companyId]);

  // Quando items chegam do XML OU produtos ficam disponíveis, dispara o matching
  // Usa processedIds ref para garantir que cada item é processado apenas UMA vez
  useEffect(() => {
    if (availableProducts.length === 0) return;

    const unprocessed = items.filter(
      item =>
        item.xml_product_name &&
        item.match_status === 'unmatched' &&
        !processedIds.current.has(item.id)
    );

    if (unprocessed.length === 0) return;

    // Marca imediatamente para evitar re-entradas antes do async completar
    unprocessed.forEach(item => processedIds.current.add(item.id));
    runAutoMatch(unprocessed, items);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, availableProducts]);

  // Notifica o pai sobre itens pendentes
  useEffect(() => {
    const pendingCount = items.filter(
      item => item.xml_product_name && (item.match_status === 'unmatched' || item.match_status === 'weak')
    ).length;
    onPendingMatchesChange?.(pendingCount);
  }, [items]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, unidade_medida, preco_custo, ean, ncm')
      .eq('tenant_id', activeTenantId)
      .order('nome');
    if (data) setAvailableProducts(data);
  };

  const fetchDepositos = async () => {
    let query = supabase
      .from('depositos')
      .select('id, nome')
      .eq('tenant_id', activeTenantId);
    if (companyId) query = query.eq('fazenda_id', companyId);
    const { data } = await query.order('nome');
    if (data) setDepositos(data);
  };

  /**
   * Roda o matching automático para itens novos do XML:
   * 1. Primeiro verifica tabela De-Para no banco
   * 2. Se não encontrar, roda fuzzy match local
   */
  const runAutoMatch = useCallback(async (xmlItems: InsumoItem[], currentItems: InsumoItem[]) => {
    if (!activeTenantId || availableProducts.length === 0) return;

    setMatchingItemIds(prev => new Set([...prev, ...xmlItems.map(i => i.id)]));

    const updatedItems = [...currentItems];

    for (const xmlItem of xmlItems) {
      const itemIndex = updatedItems.findIndex(i => i.id === xmlItem.id);
      if (itemIndex === -1) continue;

      let matched = false;

      // 0. Busca por NCM (100% de exatidão fiscal)
      if (xmlItem.xml_ncm) {
        // Encontra produto no catálogo interno que tenha o mesmo NCM
        // OBS: Tira pontuação do NCM para comparar limpo
        const cleanXmlNcm = xmlItem.xml_ncm.replace(/\D/g, '');
        const internalProduct = availableProducts.find(p => p.ncm && p.ncm.replace(/\D/g, '') === cleanXmlNcm);
        
        if (internalProduct) {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            produto_id: internalProduct.id,
            nome: internalProduct.nome,
            unidade: internalProduct.unidade_medida || updatedItems[itemIndex].unidade,
            match_status: 'confirmed',
            match_score: 100,
            match_source: 'ncm' as any, // Cast temporário
          };
          matched = true;
        }
      }

      // 1. Busca De-Para no banco (código do produto do fornecedor)
      if (!matched && xmlItem.xml_product_code && supplierId) {
        const { data: deParaData } = await supabase
          .from('produto_fornecedor_de_para')
          .select('internal_product_id')
          .eq('tenant_id', activeTenantId)
          .eq('supplier_id', supplierId)
          .eq('supplier_product_code', xmlItem.xml_product_code)
          .maybeSingle();

        if (deParaData?.internal_product_id) {
          const internalProduct = availableProducts.find(p => p.id === deParaData.internal_product_id);
          if (internalProduct) {
            updatedItems[itemIndex] = {
              ...updatedItems[itemIndex],
              produto_id: internalProduct.id,
              nome: internalProduct.nome,
              unidade: internalProduct.unidade_medida || updatedItems[itemIndex].unidade,
              match_status: 'confirmed',
              match_score: 100,
              match_source: 'de_para',
            };
            matched = true;
          }
        }
      }

      // 2. Fuzzy match se não encontrou De-Para
      if (!matched && xmlItem.xml_product_name) {
        const results = findBestMatches(xmlItem.xml_product_name, availableProducts, 30);
        if (results.length > 0) {
          const best = results[0];
          const status = getMatchStatus(best.score, false);
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            produto_id: status !== 'unmatched' ? best.product.id : '',
            nome: status !== 'unmatched' ? best.product.nome : updatedItems[itemIndex].nome,
            unidade: status !== 'unmatched' ? (best.product.unidade_medida || updatedItems[itemIndex].unidade) : updatedItems[itemIndex].unidade,
            match_status: status,
            match_score: best.score,
            match_source: 'fuzzy',
          };
        } else {
          updatedItems[itemIndex] = {
            ...updatedItems[itemIndex],
            match_status: 'unmatched',
            match_score: undefined,
          };
        }
      }
    }

    onChange(updatedItems);
    setMatchingItemIds(new Set());
  }, [activeTenantId, availableProducts, supplierId, onChange]);

  /**
   * Confirma o vínculo manual ou sugerido, salvando no De-Para
   */
  const handleConfirmMatch = async (item: InsumoItem) => {
    if (!item.produto_id || !activeTenantId) return;

    // Salva no De-Para para aprendizado futuro
    if (item.xml_product_name) {
      const deParaRecord = {
        tenant_id: activeTenantId,
        supplier_id: supplierId || null,
        supplier_product_code: item.xml_product_code || null,
        supplier_product_name: item.xml_product_name,
        internal_product_id: item.produto_id,
      };

      const { data: existing } = await supabase
        .from('produto_fornecedor_de_para')
        .select('id, match_count')
        .eq('tenant_id', activeTenantId)
        .eq('supplier_product_name', item.xml_product_name)
        .eq('internal_product_id', item.produto_id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('produto_fornecedor_de_para')
          .update({ match_count: (existing.match_count || 1) + 1, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('produto_fornecedor_de_para')
          .insert(deParaRecord);
      }
    }

    onChange(items.map(i => i.id === item.id 
      ? { ...i, match_status: 'confirmed', match_source: i.match_source ?? 'fuzzy' }
      : i
    ));
  };

  const handleAddItem = () => {
    const newItem: InsumoItem = {
      id: Math.random().toString(36).substr(2, 9),
      produto_id: '',
      nome: '',
      quantidade: 1,
      unidade: 'UN',
      preco_unitario: 0,
      despesa_adicional: 0,
      desconto: 0,
      deposito_id: depositos[0]?.id || '',
      total: 0,
      match_status: 'manual',
    };
    onChange([...items, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    onChange(items.filter(item => item.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<InsumoItem>) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, ...updates };
        const qty = updatedItem.quantidade || 0;
        const price = updatedItem.preco_unitario || 0;
        const extra = updatedItem.despesa_adicional || 0;
        const disc = updatedItem.desconto || 0;
        updatedItem.total = Math.max(0, (qty * price) + extra - disc);
        return updatedItem;
      }
      return item;
    });
    onChange(newItems);
  };

  const handleSelectProduct = (itemId: string, product: any) => {
    const item = items.find(i => i.id === itemId);
    handleUpdateItem(itemId, {
      produto_id: product.id,
      nome: product.nome,
      unidade: product.unidade_medida || 'UN',
      preco_unitario: product.preco_custo || 0,
      // Se era XML, marca como suggested aguardando confirmação
      match_status: item?.xml_product_name ? 'suggested' : 'manual',
      match_score: undefined,
      match_source: 'fuzzy',
    });
    setIsSearching(null);
  };

  const filteredProducts = availableProducts.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estatísticas para o header
  const xmlItemCount = items.filter(i => i.xml_product_name).length;
  const confirmedCount = items.filter(i => i.match_status === 'confirmed').length;
  const suggestedCount = items.filter(i => i.match_status === 'suggested').length;
  const weakCount = items.filter(i => i.match_status === 'weak').length;
  const unmatchedCount = items.filter(i => i.match_status === 'unmatched').length;
  const pendingCount = suggestedCount + weakCount + unmatchedCount;

  return (
    <div className="insumo-entry-container">
      <div className="insumo-header-row">
        <div className="h-left">
          <ShoppingCart size={16} />
          <span>Itens e Insumos</span>
          {xmlItemCount > 0 && (
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginLeft: '4px' }}>
              ({xmlItemCount} do XML)
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Badges de status */}
          {xmlItemCount > 0 && (
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              {confirmedCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 800, color: '#059669', background: 'rgba(5,150,105,0.1)', padding: '3px 8px', borderRadius: '20px' }}>
                  <CheckCircle size={10} /> {confirmedCount} vinculado{confirmedCount > 1 ? 's' : ''}
                </span>
              )}
              {pendingCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 800, color: '#d97706', background: 'rgba(217,119,6,0.1)', padding: '3px 8px', borderRadius: '20px' }}>
                  <AlertTriangle size={10} /> {pendingCount} aguardando validação
                </span>
              )}
              {unmatchedCount > 0 && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', fontWeight: 800, color: '#dc2626', background: 'rgba(220,38,38,0.1)', padding: '3px 8px', borderRadius: '20px' }}>
                  <XCircle size={10} /> {unmatchedCount} sem vínculo
                </span>
              )}
            </div>
          )}

          {!isReadOnly && (
            <button type="button" className="add-insumo-btn" onClick={handleAddItem}>
              <Plus size={14} />
              ADICIONAR ITEM
            </button>
          )}
        </div>
      </div>

      <div className="insumo-table-wrapper">
        <table className="insumo-batch-table">
          <thead>
            <tr>
              <th style={{ minWidth: '260px' }}>Produto / Insumo (Catálogo Interno)</th>
              {xmlItemCount > 0 && <th style={{ minWidth: '180px' }}>Nome Original (XML)</th>}
              <th style={{ width: '160px' }}>Depósito</th>
              <th style={{ width: '80px' }}>Qtd</th>
              <th style={{ width: '50px' }}>Unid</th>
              <th style={{ width: '120px' }}>Preço Unit.</th>
              <th style={{ width: '120px' }}>Desp. Adic.</th>
              <th style={{ width: '120px' }}>Desconto</th>
              <th style={{ width: '120px' }}>Total</th>
              {!isReadOnly && <th style={{ width: '40px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const isXmlItem = !!item.xml_product_name;
              const isLoading = matchingItemIds.has(item.id);
              const statusCfg = MATCH_STATUS_CONFIG[item.match_status] || MATCH_STATUS_CONFIG.manual;
              const needsConfirmation = item.match_status === 'suggested' || item.match_status === 'weak';
              const isUnmatched = item.match_status === 'unmatched';

              return (
                <tr 
                  key={item.id} 
                  style={{ 
                    zIndex: isSearching === item.id ? 101 : 1, 
                    position: 'relative',
                    background: isXmlItem ? statusCfg.bg : 'transparent',
                    transition: 'background 0.3s',
                  }}
                >
                  {/* COLUNA PRODUTO */}
                  <td style={{ position: 'relative' }}>
                    {isLoading ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', color: 'hsl(var(--text-muted))' }}>
                        <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>Analisando...</span>
                      </div>
                    ) : isReadOnly ? (
                      <span className="read-only-text">{item.nome}</span>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {/* Badge de status para itens XML */}
                          {isXmlItem && (
                            <span 
                              title={`${statusCfg.label}${item.match_score ? ` — Score: ${item.match_score}%` : ''}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                background: statusCfg.bg,
                                color: statusCfg.color,
                                fontSize: '10px',
                                fontWeight: 900,
                                flexShrink: 0,
                                border: `1px solid ${statusCfg.color}40`,
                                cursor: 'default',
                              }}
                            >
                              {statusCfg.icon}
                            </span>
                          )}
                          
                          <div className="insumo-search-input-wrapper" style={{ flex: 1 }}>
                            <input 
                              type="text"
                              className="tauze-table-input"
                              placeholder={isUnmatched ? '⚠ Buscar produto manualmente...' : 'Buscar produto...'}
                              value={isSearching === item.id ? searchTerm : item.nome}
                              style={{
                                borderColor: isUnmatched 
                                  ? '#dc2626' 
                                  : needsConfirmation 
                                    ? '#d97706' 
                                    : undefined,
                                paddingRight: '30px',
                              }}
                              onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsSearching(item.id);
                              }}
                              onFocus={() => {
                                setSearchTerm(item.nome);
                                setIsSearching(item.id);
                              }}
                              onBlur={() => {
                                setTimeout(() => setIsSearching(null), 200);
                              }}
                            />
                            <Search size={14} className="s-icon-mini" />
                          </div>

                          {/* Botão Confirmar para sugestões */}
                          {needsConfirmation && (
                            <button
                              type="button"
                              title={`Confirmar vínculo com "${item.nome}" (Score: ${item.match_score}%)`}
                              onClick={() => handleConfirmMatch(item)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '4px 8px',
                                borderRadius: '6px',
                                border: '1px solid #059669',
                                background: 'rgba(5,150,105,0.08)',
                                color: '#059669',
                                fontSize: '10px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <Link2 size={10} /> Confirmar
                            </button>
                          )}
                        </div>

                        {/* Score chip para itens fuzzy */}
                        {isXmlItem && item.match_score !== undefined && item.match_status !== 'confirmed' && (
                          <div style={{ 
                            marginTop: '4px', 
                            fontSize: '9px', 
                            fontWeight: 700, 
                            color: statusCfg.color,
                            paddingLeft: item.xml_product_name ? '26px' : '0',
                          }}>
                            {item.match_source === 'de_para' ? '🗄 De-Para' : `🔍 Fuzzy ${item.match_score}%`}
                            {item.match_status === 'suggested' && ' · Clique "Confirmar" para salvar'}
                            {item.match_status === 'weak' && ' · Sugestão fraca — verifique'}
                          </div>
                        )}
                        {isXmlItem && item.match_status === 'confirmed' && item.match_source && (
                          <div style={{ marginTop: '4px', fontSize: '9px', fontWeight: 700, color: '#059669', paddingLeft: '26px' }}>
                            {item.match_source === 'de_para' ? '🗄 Vínculo salvo (De-Para)' : `✓ Vínculo confirmado`}
                          </div>
                        )}

                        {isSearching === item.id && (
                          <div className="insumo-dropdown-portal">
                            {filteredProducts.length > 0 ? (
                              filteredProducts.slice(0, 8).map(p => (
                                <div 
                                  key={p.id} 
                                  className="insumo-option"
                                  onClick={() => handleSelectProduct(item.id, p)}
                                >
                                  <Package size={14} />
                                  <div className="opt-info">
                                    <span className="opt-name">{p.nome}</span>
                                    <span className="opt-meta">{p.unidade_medida} • {p.ncm ? `NCM ${p.ncm}` : `Ref: ${p.id.slice(0,6)}`}</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-results">Nenhum produto encontrado</div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </td>

                  {/* COLUNA NOME ORIGINAL XML */}
                  {xmlItemCount > 0 && (
                    <td>
                      {item.xml_product_name ? (
                        <div style={{ 
                          fontSize: '11px', 
                          color: 'hsl(var(--text-muted))', 
                          fontStyle: 'italic',
                          lineHeight: 1.3,
                          maxWidth: '180px',
                        }}>
                          <div style={{ fontSize: '9px', fontWeight: 800, color: 'hsl(var(--text-muted))', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px', fontStyle: 'normal' }}>
                            XML
                          </div>
                          {item.xml_product_name}
                          {item.xml_product_code && (
                            <div style={{ fontSize: '9px', fontStyle: 'normal', marginTop: '2px', opacity: 0.7 }}>
                              cProd: {item.xml_product_code}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontStyle: 'italic' }}>—</span>
                      )}
                    </td>
                  )}

                  {/* DEPÓSITO */}
                  <td>
                    <SearchableSelect 
                      value={item.deposito_id}
                      onChange={(val: any) => handleUpdateItem(item.id, { deposito_id: val })}
                      options={[
                        { value: '', label: 'Depósito...' },
                        ...(depositos || []).map(d => ({ value: String(d.id), label: String(d.nome) })),
                      ]}
                    />
                  </td>

                  {/* QUANTIDADE */}
                  <td>
                    <input 
                      type="number"
                      className="tauze-table-input centered"
                      value={item.quantidade || ''}
                      onChange={(e) => handleUpdateItem(item.id, { quantidade: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      placeholder="0"
                    />
                  </td>

                  {/* UNIDADE */}
                  <td>
                    <input 
                      type="text"
                      className="tauze-table-input centered uppercase"
                      value={item.unidade}
                      readOnly
                      disabled
                      style={{ fontSize: '10px', background: 'transparent', border: 'none' }}
                    />
                  </td>

                  {/* PREÇO UNITÁRIO */}
                  <td>
                    <div className="price-input-wrapper">
                      <span className="currency-prefix">R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="tauze-table-input"
                        value={item.preco_unitario || ''}
                        onChange={(e) => handleUpdateItem(item.id, { preco_unitario: parseFloat(e.target.value) || 0 })}
                        disabled={isReadOnly}
                        placeholder="0.00"
                      />
                    </div>
                  </td>

                  {/* DESP ADICIONAL */}
                  <td>
                    <div className="price-input-wrapper">
                      <span className="currency-prefix" style={{ color: 'hsl(var(--brand))' }}>+R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="tauze-table-input"
                        style={{ color: 'hsl(var(--brand))' }}
                        value={item.despesa_adicional || ''}
                        onChange={(e) => handleUpdateItem(item.id, { despesa_adicional: parseFloat(e.target.value) || 0 })}
                        disabled={isReadOnly}
                        placeholder="0.00"
                      />
                    </div>
                  </td>

                  {/* DESCONTO */}
                  <td>
                    <div className="price-input-wrapper">
                      <span className="currency-prefix" style={{ color: '#ef4444' }}>-R$</span>
                      <input 
                        type="number"
                        step="0.01"
                        className="tauze-table-input"
                        style={{ color: '#ef4444' }}
                        value={item.desconto || ''}
                        onChange={(e) => handleUpdateItem(item.id, { desconto: parseFloat(e.target.value) || 0 })}
                        disabled={isReadOnly}
                        placeholder="0.00"
                      />
                    </div>
                  </td>

                  {/* TOTAL */}
                  <td className="total-cell">
                    {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>

                  {/* REMOVER */}
                  {!isReadOnly && (
                    <td>
                      <button 
                        type="button" 
                        className="remove-row-btn"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="empty-insumos">
          <Layers size={24} />
          <p>Nenhum item adicionado ao documento.</p>
          {!isReadOnly && (
            <button type="button" onClick={handleAddItem}>Clique para começar</button>
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        .insumo-entry-container {
          grid-column: span 4;
          background: hsl(var(--bg-card));
          border-radius: 16px;
          border: 1px solid hsl(var(--border));
          overflow: visible;
          margin-top: 8px;
          box-shadow: var(--shadow-sm);
          position: relative;
          z-index: 5;
        }
        .insumo-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          background: hsl(var(--bg-main)/0.5);
          border-bottom: 1px solid hsl(var(--border));
          border-radius: 16px 16px 0 0;
          flex-wrap: wrap;
          gap: 8px;
        }
        .h-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--text-main));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .add-insumo-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: hsl(var(--brand));
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 800;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 12px hsl(var(--brand) / 0.2);
        }
        .add-insumo-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 6px 16px hsl(var(--brand) / 0.3);
        }
        .insumo-table-wrapper { overflow-x: auto; overflow-y: visible; }
        .insumo-batch-table {
          width: 100%;
          min-width: 1000px;
          border-collapse: collapse;
        }
        .insumo-batch-table th {
          text-align: left;
          padding: 12px 8px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main)/0.2);
          white-space: nowrap;
        }
        .insumo-batch-table td {
          padding: 10px 8px;
          border-bottom: 1px solid hsl(var(--border)/0.5);
          vertical-align: top;
        }
        .insumo-search-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .s-icon-mini {
          position: absolute;
          right: 12px;
          color: hsl(var(--text-muted));
          pointer-events: none;
        }
        .tauze-table-input {
          width: 100%;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          padding: 8px 10px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 600;
          color: hsl(var(--text-main));
          transition: all 0.2s;
        }
        .tauze-table-input.centered { text-align: center; padding: 8px 4px; }
        .tauze-table-input:focus {
          border-color: hsl(var(--brand));
          outline: none;
          background: hsl(var(--bg-card));
          box-shadow: 0 0 0 4px hsl(var(--brand)/0.1);
        }
        .price-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .price-input-wrapper .tauze-table-input { padding-left: 35px; text-align: left; }
        .currency-prefix {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          pointer-events: none;
          white-space: nowrap;
        }
        .total-cell {
          font-size: 14px;
          font-weight: 800;
          color: hsl(var(--brand));
          white-space: nowrap;
        }
        .remove-row-btn {
          color: #ef4444;
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          cursor: pointer;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.2s;
        }
        .remove-row-btn:hover {
          background: #fef2f2;
          border-color: #fca5a5;
          transform: scale(1.1);
        }
        .insumo-dropdown-portal {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 14px;
          box-shadow: 0 15px 35px -5px rgba(0,0,0,0.15);
          z-index: 100;
          max-height: 250px;
          overflow-y: auto;
          margin-top: 6px;
          padding: 6px;
        }
        .insumo-option {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          cursor: pointer;
          transition: all 0.2s;
          border-radius: 10px;
        }
        .insumo-option:hover { background: hsl(var(--bg-main)); }
        .opt-info { display: flex; flex-direction: column; }
        .opt-name { font-size: 13px; font-weight: 700; color: hsl(var(--text-main)); }
        .opt-meta { font-size: 10px; color: hsl(var(--text-muted)); font-weight: 600; }
        .read-only-text { font-size: 13px; font-weight: 600; color: hsl(var(--text-main)); }
        .empty-insumos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          text-align: center;
          color: hsl(var(--text-muted));
        }
        .empty-insumos p { font-size: 14px; font-weight: 600; margin: 16px 0; }
        .empty-insumos button {
          background: transparent;
          border: 2px dashed hsl(var(--border));
          padding: 10px 24px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 700;
          color: hsl(var(--brand));
          cursor: pointer;
          transition: all 0.2s;
        }
        .empty-insumos button:hover {
          border-color: hsl(var(--brand));
          background: hsl(var(--brand)/0.05);
        }
      `}</style>
    </div>
  );
};
