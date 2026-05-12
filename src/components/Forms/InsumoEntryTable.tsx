import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Trash2, 
  Search, 
  Layers, 
  DollarSign,
  ShoppingCart,
  Warehouse,
  Tag
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface InsumoItem {
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
}

interface InsumoEntryTableProps {
  items: InsumoItem[];
  onChange: (items: InsumoItem[]) => void;
  isReadOnly?: boolean;
}

export const InsumoEntryTable: React.FC<InsumoEntryTableProps> = ({ items, onChange, isReadOnly = false }) => {
  const { activeTenantId } = useTenant();
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (activeTenantId) {
      fetchProducts();
      fetchDepositos();
    }
  }, [activeTenantId]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, unidade_medida, preco_custo')
      .eq('tenant_id', activeTenantId)
      .order('nome');
    if (data) setAvailableProducts(data);
  };

  const fetchDepositos = async () => {
    const { data } = await supabase
      .from('depositos')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .order('nome');
    if (data) setDepositos(data);
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
      total: 0
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
    handleUpdateItem(itemId, {
      produto_id: product.id,
      nome: product.nome,
      unidade: product.unidade_medida || 'UN',
      preco_unitario: product.preco_custo || 0
    });
    setIsSearching(null);
  };

  const filteredProducts = availableProducts.filter(p => 
    p.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="insumo-entry-container">
      <div className="insumo-header-row">
        <div className="h-left">
          <ShoppingCart size={16} />
          <span>Itens e Insumos</span>
        </div>
        {!isReadOnly && (
          <button type="button" className="add-insumo-btn" onClick={handleAddItem}>
            <Plus size={14} />
            ADICIONAR ITEM
          </button>
        )}
      </div>

      <div className="insumo-table-wrapper">
        <table className="insumo-batch-table">
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>Produto / Insumo</th>
              <th style={{ width: '130px' }}>Entrada</th>
              <th style={{ width: '80px' }}>Qtd</th>
              <th style={{ width: '60px' }}>Unid</th>
              <th style={{ width: '140px' }}>Preço Unit.</th>
              <th style={{ width: '140px' }}>Desp. Adic.</th>
              <th style={{ width: '140px' }}>Desconto</th>
              <th style={{ width: '140px' }}>Total</th>
              {!isReadOnly && <th style={{ width: '40px' }}></th>}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ zIndex: isSearching === item.id ? 101 : 1, position: 'relative' }}>
                <td style={{ position: 'relative' }}>
                  {isReadOnly ? (
                    <span className="read-only-text">{item.nome}</span>
                  ) : (
                    <>
                      <div className="insumo-search-input-wrapper">
                        <input 
                          type="text"
                          className="elite-table-input"
                          placeholder="Buscar produto..."
                          value={isSearching === item.id ? searchTerm : item.nome}
                          onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsSearching(item.id);
                          }}
                          onFocus={() => {
                            setSearchTerm(item.nome);
                            setIsSearching(item.id);
                          }}
                          onBlur={() => {
                            // Small delay to allow clicking on an option
                            setTimeout(() => setIsSearching(null), 200);
                          }}
                        />
                        <Search size={14} className="s-icon-mini" />
                      </div>
                      
                      {isSearching === item.id && (
                        <div className="insumo-dropdown-portal">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.map(p => (
                              <div 
                                key={p.id} 
                                className="insumo-option"
                                onClick={() => handleSelectProduct(item.id, p)}
                              >
                                <Package size={14} />
                                <div className="opt-info">
                                  <span className="opt-name">{p.nome}</span>
                                  <span className="opt-meta">{p.unidade_medida} • Ref: {p.id.slice(0,6)}</span>
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
                <td>
                  <select 
                    className="elite-table-input"
                    value={item.deposito_id}
                    onChange={(e) => handleUpdateItem(item.id, { deposito_id: e.target.value })}
                    disabled={isReadOnly}
                    style={{ fontSize: '11px' }}
                  >
                    <option value="">Selecione...</option>
                    {depositos.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input 
                    type="number"
                    className="elite-table-input centered"
                    value={item.quantidade || ''}
                    onChange={(e) => handleUpdateItem(item.id, { quantidade: parseFloat(e.target.value) || 0 })}
                    disabled={isReadOnly}
                    placeholder="0"
                  />
                </td>
                <td>
                  <input 
                    type="text"
                    className="elite-table-input centered uppercase"
                    value={item.unidade}
                    readOnly
                    disabled
                    style={{ fontSize: '10px', background: 'transparent', border: 'none' }}
                  />
                </td>
                <td>
                  <div className="price-input-wrapper">
                    <span className="currency-prefix">R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="elite-table-input"
                      value={item.preco_unitario || ''}
                      onChange={(e) => handleUpdateItem(item.id, { preco_unitario: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      placeholder="0.00"
                    />
                  </div>
                </td>
                <td>
                  <div className="price-input-wrapper">
                    <span className="currency-prefix" style={{ color: 'hsl(var(--brand))' }}>+R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="elite-table-input"
                      style={{ color: 'hsl(var(--brand))' }}
                      value={item.despesa_adicional || ''}
                      onChange={(e) => handleUpdateItem(item.id, { despesa_adicional: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      placeholder="0.00"
                    />
                  </div>
                </td>
                <td>
                  <div className="price-input-wrapper">
                    <span className="currency-prefix" style={{ color: '#ef4444' }}>-R$</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="elite-table-input"
                      style={{ color: '#ef4444' }}
                      value={item.desconto || ''}
                      onChange={(e) => handleUpdateItem(item.id, { desconto: parseFloat(e.target.value) || 0 })}
                      disabled={isReadOnly}
                      placeholder="0.00"
                    />
                  </div>
                </td>
                <td className="total-cell">
                  {item.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </td>
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
            ))}
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
        .insumo-table-wrapper {
          overflow: visible;
        }
        .insumo-batch-table {
          width: 100%;
          min-width: 1000px;
          border-collapse: collapse;
        }
        .insumo-batch-table th {
          text-align: left;
          padding: 14px 20px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main)/0.2);
        }
        .insumo-batch-table td {
          padding: 12px 20px;
          border-bottom: 1px solid hsl(var(--border)/0.5);
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
        .elite-table-input {
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
        .elite-table-input.centered { text-align: center; padding: 8px 4px; }
        .elite-table-input:focus {
          border-color: hsl(var(--brand));
          outline: none;
          background: white;
          box-shadow: 0 0 0 4px hsl(var(--brand)/0.1);
        }
        .price-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
        }
        .price-input-wrapper .elite-table-input {
          padding-left: 35px;
          text-align: left;
        }
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
          background: white;
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
        .insumo-option:hover {
          background: hsl(var(--bg-main));
        }
        .opt-info {
          display: flex;
          flex-direction: column;
        }
        .opt-name {
          font-size: 13px;
          font-weight: 700;
          color: hsl(var(--text-main));
        }
        .opt-meta {
          font-size: 10px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }
        .empty-insumos {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 40px;
          text-align: center;
          color: hsl(var(--text-muted));
        }
        .empty-insumos p {
          font-size: 14px;
          font-weight: 600;
          margin: 16px 0;
        }
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
