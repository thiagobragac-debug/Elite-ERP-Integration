import React, { useState, useEffect, useRef, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  ArrowRightLeft, 
  Package,
  Calendar,
  Building2,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Settings,
  DollarSign,
  Plus,
  Trash2,
  AlertTriangle,
  FileText,
  Lock,
  Barcode,
  Receipt,
  Tractor,
  Map
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import toast from 'react-hot-toast';

interface MovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultType?: 'in' | 'out' | 'transfer';
  initialData?: any;
  actionId?: number;
}

export const MovementForm: React.FC<MovementFormProps> = ({isOpen, onClose, onSubmit, defaultType = 'in', initialData, actionId }) => {
  const { activeFarm } = useTenant();
  const { applyFarmFilter, applyTenantFilter } = useFarmFilter();
  
  // Base Transaction Data
  const [formData, setFormData] = usePersistentState('MovementForm_formData', {
    destino_deposito_id: '',
    tipo: defaultType as 'in' | 'out' | 'transfer' | 'adjust',
    data_movimentacao: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    origem_destino: '', // Text for In/Transfer
    centro_custo: '',   // Select for Out
    responsavel: '',
    deposito_origem_id: '', // Used only for transfers now
    receituario_agronomico: '', // For agrochemicals
    numero_nfe: '',
    chave_nfe: '',
    despesas_acessorias: '',
    sub_centro_custo: ''
  });

  // Cart of Items
  const [items, setItems] = useState<any[]>([]);

  // Current Item Input State
  const [currentItem, setCurrentItem] = useState({
    produto_id: '',
    quantidade: '',
    valor_unitario: '',
    lote: '',
    data_validade: '',
    deposito_id: ''
  });

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Product Autocomplete Search State
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const productSearchRef = useRef<HTMLDivElement>(null);

  // Click Outside detector to close search dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtered Products for Autocomplete
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery) return products;
    return products.filter(p => 
      p.nome?.toLowerCase().includes(productSearchQuery.toLowerCase()) ||
      (p.categoria && p.categoria.toLowerCase().includes(productSearchQuery.toLowerCase()))
    );
  }, [products, productSearchQuery]);

  useEffect(() => {
    if (!isOpen) return;

    // Reset search query
    setProductSearchQuery('');
    setShowProductDropdown(false);

    if (initialData) { setFormData(prev => ({
        ...prev,
        destino_deposito_id: initialData.destino_deposito_id || '',
        tipo: initialData.tipo || defaultType,
        data_movimentacao: initialData.data_movimentacao ? new Date(initialData.data_movimentacao).toISOString().split('T')[0] : new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        origem_destino: initialData.origem_destino || '',
        responsavel: initialData.responsavel || '',
        deposito_origem_id: initialData.deposito_id || ''
      }));

      setItems([{
        id: initialData.id, // Keep ID for update
        produto_id: initialData.produto_id || '',
        quantidade: initialData.quantidade?.toString() || '',
        valor_unitario: initialData.valor_unitario?.toString() || '',
        lote: initialData.lote || '',
        data_validade: initialData.data_validade || '',
        deposito_id: initialData.deposito_id || ''
      }]);
    } else {
      setFormData({
        destino_deposito_id: '',
        tipo: defaultType as any,
        data_movimentacao: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        origem_destino: '',
        centro_custo: '',
        responsavel: '',
        deposito_origem_id: '',
        receituario_agronomico: '',
        numero_nfe: '',
        chave_nfe: '',
        despesas_acessorias: '',
        sub_centro_custo: ''
      });
      setItems([]);
      setCurrentItem({
        produto_id: '',
        quantidade: '',
        valor_unitario: '',
        lote: '',
        data_validade: '',
        deposito_id: ''
      });
    }
  }, [initialData, isOpen, defaultType, actionId]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchProducts();
      fetchWarehouses();
    }
  }, [isOpen, activeFarm]);

  const fetchProducts = async () => {
    let query = supabase
      .from('produtos')
      .select(`
        id, nome, unidade, custo_medio, categoria_id,
        categorias_sistema (
          nome
        )
      `);
    query = applyTenantFilter(query);
    const { data, error } = await query;
      
    if (error) console.error('fetchProducts ERROR:', error);
    if (data) {
      const mapped = data.map((p: any) => ({
        ...p,
        categoria: p.categorias_sistema?.nome || 'Geral'
      }));
      setProducts(mapped);
    }
  };

  const fetchWarehouses = async () => {
    let query = supabase
      .from('depositos')
      .select('id, nome')
      .neq('status', 'inativo');
    query = applyFarmFilter(query);
    const { data, error } = await query;
      
    if (error) console.error('fetchWarehouses ERROR:', error);
    if (data) setWarehouses(data);
  };

  const isMedicament = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod || !prod.categoria) return false;
    const cat = prod.categoria.toLowerCase();
    return cat.includes('medicamento') || cat.includes('saúde') || cat.includes('saude') || cat.includes('vacina') || cat.includes('veterinário');
  };

  const isAgroDefensive = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod || !prod.categoria) return false;
    const cat = prod.categoria.toLowerCase();
    return cat.includes('defensivo') || cat.includes('agrotóxico') || cat.includes('herbicida') || cat.includes('fungicida') || cat.includes('inseticida');
  };

  const isSeedOrFertilizer = (prodId: string) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod || !prod.categoria) return false;
    const cat = prod.categoria.toLowerCase();
    return cat.includes('semente') || cat.includes('adubo') || cat.includes('nutrição') || cat.includes('fertilizante');
  };

  const requiresReceipt = items.some(item => isAgroDefensive(item.produto_id));
  
  // Expanded Lot Tracking for Agri (Medicines, Seeds, Fertilizers, Defensives)
  const requiresLot = isMedicament(currentItem.produto_id) || isAgroDefensive(currentItem.produto_id) || isSeedOrFertilizer(currentItem.produto_id);
  
  const isOutOrTransfer = formData.tipo === 'out' || formData.tipo === 'transfer';
  const activeDepotForStock = formData.tipo === 'transfer' ? formData.deposito_origem_id : currentItem.deposito_id;
  
  // Mocked available stock for UI demonstration. In production, this would fetch from 'estoque_saldos' table.
  const availableStock = currentItem.produto_id && activeDepotForStock ? 150 : 0; 
  
  const totalItemsValue = items.reduce((sum, item) => sum + (parseFloat(item.quantidade || '0') * parseFloat(item.valor_unitario || '0')), 0);
  const totalMovementValue = totalItemsValue + (formData.tipo === 'in' ? parseFloat(formData.despesas_acessorias || '0') : 0);

  useEffect(() => {
    if (formData.tipo === 'out' && currentItem.produto_id) {
      const prod = products.find(p => p.id === currentItem.produto_id);
      if (prod) {
        setCurrentItem(prev => ({ ...prev, valor_unitario: (prod.custo_medio || 0).toString() }));
      }
    }
  }, [currentItem.produto_id, formData.tipo, products]);

  const handleAddItem = () => {
    if (!currentItem.produto_id || !currentItem.quantidade) {
      toast.error("Selecione o produto e informe a quantidade.");
      return;
    }
    
    // Validate if it's an IN operation
    if (formData.tipo === 'in' && !currentItem.valor_unitario) {
      toast.error("Preencha o Valor Unitário para entrada.");
      return;
    }

    if (formData.tipo !== 'transfer' && !currentItem.deposito_id) {
      toast.error("Selecione o Depósito para o item.");
      return;
    }

    if (isOutOrTransfer && parseFloat(currentItem.quantidade) > availableStock) {
      toast.error("Quantidade solicitada é maior que o saldo disponível em estoque!");
      return;
    }

    setItems([...items, { ...currentItem }]);
    
    // Reset current item but keep the warehouse to save clicks!
    setCurrentItem({
      produto_id: '',
      quantidade: '',
      valor_unitario: '',
      lote: '',
      data_validade: '',
      deposito_id: currentItem.deposito_id 
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error("Adicione pelo menos um insumo à lista.");
      return;
    }
    if (formData.tipo === 'transfer' && (!formData.deposito_origem_id || !formData.destino_deposito_id)) {
      toast.error("Para transferência, informe a origem e destino.");
      return;
    }
    if (requiresReceipt && !formData.receituario_agronomico) {
      toast.error("O Receituário Agronômico é obrigatório para defensivos.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({ ...formData, items });
    } finally {
      setLoading(false);
    }
  };

  const selectedProductObj = products.find(p => p.id === currentItem.produto_id);

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      size="large"
      title={initialData ? "Editar Movimentação" : (formData.tipo === 'in' ? "Lançar Entrada" : formData.tipo === 'transfer' ? "Transferência de Estoque" : "Lançar Saída")}
      subtitle={formData.tipo === 'transfer' ? "Mova insumos entre depósitos da mesma unidade." : "Registre a movimentação física (Multi-itens)."}
      icon={formData.tipo === 'in' ? ArrowDownLeft : formData.tipo === 'transfer' ? ArrowRightLeft : ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : (formData.tipo === 'transfer' ? "Confirmar Transferência" : "Confirmar Movimentação")}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Movimentação</h4>
        </div>

        <div className="tauze-input-grid grid-col-2">
          {/* If Transfer, we keep the Origin Depot at the top level */}
          {formData.tipo === 'transfer' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><Building2 size={14} /> Depósito de Origem</label>
              <SearchableSelect
                value={formData.deposito_origem_id}
                onChange={(val) => setFormData({...formData, deposito_origem_id: val})}
                options={warehouses.map(w => ({ value: w.id, label: w.nome }))}
                placeholder="Selecione o local de saída..."
              />
            </div>
          )}

          {/* If Transfer, we keep Destination Depot at the top level */}
          {formData.tipo === 'transfer' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><ArrowRightLeft size={14} /> Depósito de Destino</label>
                <SearchableSelect
                  value={formData.destino_deposito_id}
                  onChange={(val) => setFormData({...formData, destino_deposito_id: val})}
                  options={warehouses.filter(w => w.id !== formData.deposito_origem_id).map(w => ({ value: w.id, label: w.nome }))}
                  placeholder="Selecione o local de destino..."
                />
              </div>
              <div className="tauze-field-group" style={{ gridColumn: 'span 2', background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                <label className="tauze-label" style={{ color: '#0f172a' }}><FileText size={14} /> Motivo da Transferência (Justificativa)</label>
                <input 
                  type="text" 
                  className="tauze-input"
                  placeholder="Ex: Remanejamento para plantio no Talhão 02..."
                  value={formData.origem_destino}
                  onChange={(e) => setFormData({...formData, origem_destino: e.target.value})}
                  required
                />
              </div>
            </>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Lançamento</label>
            <input 
              type="date" 
              value={formData.data_movimentacao}
              onChange={(e) => setFormData({...formData, data_movimentacao: e.target.value})}
              required
              className="tauze-input"
            />
          </div>

          {formData.tipo === 'in' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Building2 size={14} /> Origem (Fornecedor)</label>
                <input 
                  type="text" 
                  className="tauze-input"
                  placeholder="Ex: Fornecedor XYZ..."
                  value={formData.origem_destino}
                  onChange={(e) => setFormData({...formData, origem_destino: e.target.value})}
                  required
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ color: '#0369a1' }}><Receipt size={14} /> Nota Fiscal (NF-e)</label>
                <input 
                  type="text" 
                  className="tauze-input"
                  placeholder="Nº da Nota..."
                  style={{ borderColor: '#bae6fd' }}
                  value={formData.numero_nfe}
                  onChange={(e) => setFormData({...formData, numero_nfe: e.target.value})}
                />
              </div>
              <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                <label className="tauze-label" style={{ color: '#0369a1' }}><Barcode size={14} /> Chave de Acesso (NF-e)</label>
                <input 
                  type="text" 
                  className="tauze-input"
                  placeholder="0000 0000 0000 0000 0000 0000 0000 0000 0000 0000 0000"
                  maxLength={44}
                  style={{ borderColor: '#bae6fd' }}
                  value={formData.chave_nfe}
                  onChange={(e) => setFormData({...formData, chave_nfe: e.target.value})}
                />
              </div>
            </>
          )}

          {formData.tipo === 'out' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Building2 size={14} /> Centro de Custo (Destinação)</label>
                <SearchableSelect
                  value={formData.centro_custo}
                  onChange={(val) => setFormData({...formData, centro_custo: val, sub_centro_custo: ''})}
                  options={[
                    { value: 'frota', label: 'Frota (Tratores / Máquinas)' },
                    { value: 'lavoura', label: 'Lavoura (Talhões / Glebas)' },
                    { value: 'pecuaria', label: 'Pecuária (Lotes / Animais)' },
                    { value: 'infra', label: 'Infraestrutura / Manutenção Geral' }
                  ]}
                  placeholder="Para onde vai essa despesa?"
                />
              </div>
              
              {formData.centro_custo === 'frota' && (
                <div className="tauze-field-group" style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px dashed #cbd5e1' }}>
                  <label className="tauze-label" style={{ color: '#0f172a' }}><Tractor size={14} /> Máquina / Placa / Frota</label>
                  <input 
                    type="text" 
                    className="tauze-input"
                    placeholder="Ex: Trator John Deere 1..."
                    value={formData.sub_centro_custo}
                    onChange={(e) => setFormData({...formData, sub_centro_custo: e.target.value})}
                    required
                  />
                </div>
              )}

              {formData.centro_custo === 'lavoura' && (
                <div className="tauze-field-group" style={{ background: '#f0fdf4', padding: '12px', borderRadius: '8px', border: '1px dashed #bbf7d0' }}>
                  <label className="tauze-label" style={{ color: '#166534' }}><Map size={14} /> Talhão / Gleba / Safra</label>
                  <input 
                    type="text" 
                    className="tauze-input"
                    placeholder="Ex: Talhão 04 - Soja 2026..."
                    value={formData.sub_centro_custo}
                    onChange={(e) => setFormData({...formData, sub_centro_custo: e.target.value})}
                    required
                  />
                </div>
              )}

              {formData.centro_custo === 'pecuaria' && (
                <div className="tauze-field-group" style={{ background: '#fffbeb', padding: '12px', borderRadius: '8px', border: '1px dashed #fde68a' }}>
                  <label className="tauze-label" style={{ color: '#92400e' }}><Hash size={14} /> Lote de Animais / Pasto</label>
                  <input 
                    type="text" 
                    className="tauze-input"
                    placeholder="Ex: Lote Bezerros Nelore..."
                    value={formData.sub_centro_custo}
                    onChange={(e) => setFormData({...formData, sub_centro_custo: e.target.value})}
                    required
                  />
                </div>
              )}
            </>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label"><Users size={14} /> Responsável</label>
            <input 
              type="text" 
              className="tauze-input"
              placeholder="Nome de quem realizou..."
              value={formData.responsavel}
              onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">{initialData ? 'Item da Movimentação' : 'Adicionar Insumos'}</h4>
        </div>

        {!initialData && (
          <div className="tauze-input-grid" style={{ gridTemplateColumns: formData.tipo === 'transfer' ? '2fr 1fr auto' : '2fr 1.5fr 1fr 1fr auto', alignItems: 'end' }}>
            <div className="tauze-field-group" style={{ position: 'relative' }}>
              <label className="tauze-label"><Package size={14} /> Selecionar Produto</label>
              {currentItem.produto_id ? (
                /* CHIP */
                <div className="product-chip animate-fade-in" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  background: 'hsl(var(--brand) / 0.08)',
                  border: '1.5px solid hsl(var(--brand) / 0.3)',
                  borderRadius: '12px', padding: '8px 12px',
                  height: '38px', boxSizing: 'border-box'
                }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '6px',
                    background: 'hsl(var(--brand))', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', flexShrink: 0
                  }}>
                    <Package size={12} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {selectedProductObj?.nome}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentItem(prev => ({ ...prev, produto_id: '', valor_unitario: '' }));
                      setProductSearchQuery('');
                    }}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'hsl(var(--text-muted))', padding: '2px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}
                    title="Remover produto"
                  >
                    <Trash2 size={14} style={{ color: '#ef4444' }} />
                  </button>
                </div>
              ) : (
                /* SEARCH INPUT */
                <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }} ref={productSearchRef}>
                  <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Buscar por nome ou categoria..."
                      value={productSearchQuery}
                      onChange={(e) => { setProductSearchQuery(e.target.value); setShowProductDropdown(true); }}
                      onFocus={() => setShowProductDropdown(true)}
                      style={{ paddingRight: '30px', width: '100%', boxSizing: 'border-box', height: '38px' }}
                      autoComplete="off"
                    />
                  </div>

                  {showProductDropdown && (
                    <div className="autocomplete-dropdown animate-fade-in" style={{
                      position: 'absolute', top: 'calc(100% + 4px)', left: 0, width: '100%',
                      maxHeight: '220px', overflowY: 'auto',
                      background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                      borderRadius: '12px', zIndex: 999, boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
                      display: 'flex', flexDirection: 'column'
                    }}>
                      {filteredProducts.length === 0 ? (
                        <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '13px', fontWeight: 600, textAlign: 'center' }}>
                          Nenhum insumo encontrado
                        </div>
                      ) : (
                        filteredProducts.map((p: any, idx: number) => (
                          <div
                            key={p.id}
                            onClick={() => {
                              setCurrentItem(prev => ({ 
                                ...prev, 
                                produto_id: p.id,
                                valor_unitario: formData.tipo === 'out' ? (p.custo_medio || 0).toString() : prev.valor_unitario
                              }));
                              setProductSearchQuery(p.nome);
                              setShowProductDropdown(false);
                            }}
                            style={{
                              padding: '10px 12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: idx < filteredProducts.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                              transition: 'background 0.15s'
                            }}
                            className="autocomplete-option"
                          >
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontSize: '13px', fontWeight: 700, color: 'hsl(var(--text-main))', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {p.nome}
                              </span>
                              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                                {p.categoria || 'Sem Categoria'} · {p.unidade}
                              </span>
                            </div>
                            {formData.tipo === 'out' && (
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                                Custo: R$ {parseFloat(p.custo_medio || '0').toFixed(2)}
                              </span>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {formData.tipo !== 'transfer' && (
              <div className="tauze-field-group">
                <label className="tauze-label"><Building2 size={14} /> Depósito</label>
                <SearchableSelect
                  value={currentItem.deposito_id}
                  onChange={(val) => setCurrentItem({...currentItem, deposito_id: val})}
                  options={warehouses.map(w => ({ value: w.id, label: w.nome }))}
                  placeholder={warehouses.length === 0 ? (loading ? "Carregando..." : "Nenhum depósito...") : "Selecione um depósito..."}
                />
              </div>
            )}

            <div className="tauze-field-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="tauze-label"><Hash size={14} /> Qtd</label>
                {isOutOrTransfer && currentItem.produto_id && activeDepotForStock && (
                  <span style={{ fontSize: '10px', color: parseFloat(currentItem.quantidade || '0') > availableStock ? '#ef4444' : '#10b981', fontWeight: 800 }}>
                    SALDO: {availableStock}
                  </span>
                )}
              </div>
              <input 
                type="number" 
                step="0.01"
                placeholder="0.00" 
                className="tauze-input"
                value={currentItem.quantidade}
                onChange={(e) => setCurrentItem({...currentItem, quantidade: e.target.value})}
                style={{ borderColor: isOutOrTransfer && parseFloat(currentItem.quantidade || '0') > availableStock ? '#ef4444' : 'hsl(var(--border))' }}
              />
            </div>

            {formData.tipo !== 'transfer' && (
              <div className="tauze-field-group">
                <label className="tauze-label"><DollarSign size={14} /> {formData.tipo === 'out' ? 'Custo (Un)' : 'Valor (Un)'}</label>
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  className="tauze-input"
                  value={currentItem.valor_unitario}
                  onChange={(e) => setCurrentItem({...currentItem, valor_unitario: e.target.value})}
                  disabled={formData.tipo === 'out'}
                  style={{ background: formData.tipo === 'out' ? 'hsl(var(--bg-muted))' : 'white', cursor: formData.tipo === 'out' ? 'not-allowed' : 'text' }}
                  title={formData.tipo === 'out' ? "Custo médio calculado automaticamente" : ""}
                />
              </div>
            )}

            <button type="button" className="primary-btn" style={{ height: '38px', padding: '0 16px', borderRadius: '8px' }} onClick={handleAddItem}>
              <Plus size={16} />
            </button>
          </div>
        )}

        {/* Conditional Lot/Validity Input for Current Item (Medicaments, Defensives, Seeds, Fertilizers) */}
        {!initialData && requiresLot && (formData.tipo === 'in' || formData.tipo === 'transfer') && (
          <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px', background: 'hsl(38 92% 50% / 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(38 92% 50% / 0.3)' }}>
            <div className="tauze-field-group">
              <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}><Hash size={14} /> Lote do Produto</label>
              <input 
                type="text" 
                placeholder="Ex: LOT-2024-01" 
                className="tauze-input"
                style={{ borderColor: 'hsl(38 92% 50% / 0.4)' }}
                value={currentItem.lote}
                onChange={(e) => setCurrentItem({...currentItem, lote: e.target.value})}
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}><Calendar size={14} /> Data de Validade</label>
              <input 
                type="date" 
                className="tauze-input"
                style={{ borderColor: 'hsl(38 92% 50% / 0.4)' }}
                value={currentItem.data_validade}
                onChange={(e) => setCurrentItem({...currentItem, data_validade: e.target.value})}
              />
            </div>
          </div>
        )}

        {/* Edit mode: Render the single item editable fields directly instead of a cart */}
        {initialData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
             <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Package size={14} /> Produto</label>
                  <SearchableSelect
                    value={items[0]?.produto_id}
                    onChange={(val) => {
                      const newItems = [...items];
                      newItems[0].produto_id = val;
                      setItems(newItems);
                    }}
                    options={products.map(p => ({ value: p.id, label: `${p.nome} (${p.unidade})` }))}
                    placeholder={products.length === 0 ? (loading ? "Carregando..." : "Nenhum produto...") : "Selecione um item..."}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Building2 size={14} /> Depósito</label>
                  <SearchableSelect
                    value={items[0]?.deposito_id}
                    onChange={(val) => {
                      const newItems = [...items];
                      newItems[0].deposito_id = val;
                      setItems(newItems);
                    }}
                    options={warehouses.map(w => ({ value: w.id, label: w.nome }))}
                    placeholder={warehouses.length === 0 ? (loading ? "Carregando..." : "Nenhum depósito...") : "Selecione um depósito..."}
                  />
                </div>
              </div>

              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> Quantidade</label>
                  <input 
                    type="number" 
                    step="0.01"
                    className="tauze-input"
                    value={items[0]?.quantidade}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[0].quantidade = e.target.value;
                      setItems(newItems);
                    }}
                    required
                  />
                </div>
                {formData.tipo !== 'transfer' && (
                  <div className="tauze-field-group">
                    <label className="tauze-label"><DollarSign size={14} /> {formData.tipo === 'out' ? 'Custo Médio (Un)' : 'Valor Unitário'}</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className="tauze-input"
                      value={items[0]?.valor_unitario}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[0].valor_unitario = e.target.value;
                        setItems(newItems);
                      }}
                      disabled={formData.tipo === 'out'}
                      style={{ background: formData.tipo === 'out' ? 'hsl(var(--bg-muted))' : 'white', cursor: formData.tipo === 'out' ? 'not-allowed' : 'text' }}
                      required
                    />
                  </div>
                )}
              </div>

              {isMedicament(items[0]?.produto_id) && formData.tipo === 'in' && (
                 <div className="tauze-input-grid grid-col-2" style={{ background: 'hsl(38 92% 50% / 0.1)', padding: '16px', borderRadius: '12px', border: '1px solid hsl(38 92% 50% / 0.3)' }}>
                  <div className="tauze-field-group">
                    <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}><Hash size={14} /> Lote</label>
                    <input 
                      type="text" 
                      className="tauze-input"
                      style={{ borderColor: 'hsl(38 92% 50% / 0.4)' }}
                      value={items[0]?.lote}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[0].lote = e.target.value;
                        setItems(newItems);
                      }}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}><Calendar size={14} /> Data de Validade</label>
                    <input 
                      type="date" 
                      className="tauze-input"
                      style={{ borderColor: 'hsl(38 92% 50% / 0.4)' }}
                      value={items[0]?.data_validade}
                      onChange={(e) => {
                        const newItems = [...items];
                        newItems[0].data_validade = e.target.value;
                        setItems(newItems);
                      }}
                    />
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Render Cart List for New Mode */}
        {!initialData && items.length > 0 && (
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Itens Prontos para Lançamento ({items.length})</h5>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => {
                const p = products.find(prod => prod.id === item.produto_id);
                const w = warehouses.find(wh => wh.id === item.deposito_id);
                return (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', padding: '12px 16px', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'hsl(var(--bg-main))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                        <Package size={16} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: '#1e293b' }}>{p?.nome || 'Insumo'}</span>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                          <span>Qtd: {item.quantidade} {p?.unidade}</span>
                          {formData.tipo !== 'transfer' && <span>Depósito: {w?.nome || '-'}</span>}
                          {formData.tipo !== 'transfer' && <span>Custo: R$ {item.valor_unitario}</span>}
                          {item.lote && <span style={{ color: '#d97706' }}>Lote: {item.lote}</span>}
                        </div>
                      </div>
                    </div>
                    <button type="button" style={{ color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px' }} onClick={() => handleRemoveItem(idx)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Value and Compliance Footer */}
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {requiresReceipt && formData.tipo === 'out' && (
                <div style={{ padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#991b1b', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase' }}>
                    <AlertTriangle size={16} /> Compliance Ambiental (Defensivos)
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label" style={{ color: '#991b1b' }}><FileText size={14} /> Nº Receituário Agronômico</label>
                    <input 
                      type="text" 
                      className="tauze-input"
                      placeholder="Digite o número da receita..."
                      value={formData.receituario_agronomico}
                      onChange={(e) => setFormData({...formData, receituario_agronomico: e.target.value})}
                      style={{ borderColor: '#fca5a5' }}
                    />
                  </div>
                </div>
              )}

              {formData.tipo === 'in' && (
                <div style={{ padding: '16px', background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#475569' }}>Despesas Acessórias (Frete / Impostos)</span>
                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>Será rateado no Custo Médio dos produtos acima</span>
                  </div>
                  <div className="tauze-field-group" style={{ margin: 0, width: '150px' }}>
                    <input 
                      type="number" 
                      step="0.01"
                      className="tauze-input"
                      placeholder="0.00"
                      value={formData.despesas_acessorias}
                      onChange={(e) => setFormData({...formData, despesas_acessorias: e.target.value})}
                      style={{ background: 'white' }}
                    />
                  </div>
                </div>
              )}

              <div style={{ background: 'hsl(var(--bg-main))', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid hsl(var(--border))' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>Valor Total da {formData.tipo === 'out' ? 'Despesa' : 'Movimentação'}:</span>
                <span style={{ fontSize: '24px', fontWeight: 900, color: formData.tipo === 'out' ? '#ef4444' : '#10b981' }}>
                  {totalMovementValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

    </SidePanel>
  );
};
