import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

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
  Map,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { DateInput } from '../../components/Form/DateInput';
import { ConsumptionCart } from './ConsumptionCart';
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

export const MovementForm: React.FC<MovementFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultType = 'in',
  initialData,
  actionId,
}) => {
  const { activeFarm, activeTenantId } = useTenant();
  const { applyFarmFilter, applyTenantFilter } = useFarmFilter();

  // Base Transaction Data
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `movement_form_${activeTenantId}`,
    initialState: {
      destino_deposito_id: '',
      tipo: defaultType as 'in' | 'out' | 'transfer' | 'adjust',
      data_movimentacao: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0],
      origem_destino: '', // Text for In/Transfer
      centro_custo: '', // Select for Out
      responsavel: '',
      deposito_origem_id: '', // Used only for transfers now
      receituario_agronomico: '', // For agrochemicals
      numero_nfe: '',
      chave_nfe: '',
      despesas_acessorias: '',
      sub_centro_custo: '',
      apropriar_custo: false,
      apropriar_tipo: 'animal' as 'animal' | 'lote',
      animal_id: '',
      lote_pecuario_id: '',
    },
    isOpen,
    isEditMode: !!initialData,
  });

  // Cart of Items
  const [items, setItems] = useState<any[]>([]);

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (initialData) {
      setFormData((prev) => ({
        ...prev,
        destino_deposito_id: initialData.destino_deposito_id || '',
        tipo: initialData.tipo || defaultType,
        data_movimentacao: initialData.data_movimentacao
          ? new Date(initialData.data_movimentacao).toISOString().split('T')[0]
          : new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
              .toISOString()
              .split('T')[0],
        origem_destino: initialData.origem_destino || '',
        responsavel: initialData.responsavel || '',
        deposito_origem_id: initialData.deposito_id || '',
      }));

      setItems([
        {
          id: initialData.id, // Keep ID for update
          produto_id: initialData.produto_id || '',
          quantidade: initialData.quantidade?.toString() || '',
          valor_unitario: initialData.valor_unitario?.toString() || '',
          lote: initialData.lote || '',
          data_validade: initialData.data_validade || '',
          deposito_id: initialData.deposito_id || '',
        },
      ]);
    } else {
      setItems([]);
    }
  }, [initialData, isOpen, defaultType, actionId]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchProducts();
      fetchWarehouses();
      fetchAnimais();
      fetchLotes();
    }
  }, [isOpen, activeFarm]);

  const fetchProducts = async () => {
    let query = supabase.from('produtos').select(`
        id, nome, unidade, custo_medio, categoria_id,
        categorias_sistema (
          nome
        ).eq('tenant_id', activeTenantId)
      `);
    query = applyTenantFilter(query);
    const { data, error } = await query;

    if (error) {
      console.error('fetchProducts ERROR:', error);
    }
    if (data) {
      const mapped = data.map((p: any) => ({
        ...p,
        categoria: p.categorias_sistema?.nome || 'Geral',
      }));
      setProducts(mapped);
    }
  };

  const fetchWarehouses = async () => {
    let query = supabase.from('depositos').select('id, nome').eq('tenant_id', activeTenantId).neq('status', 'inativo');
    query = applyFarmFilter(query);
    const { data, error } = await query;

    if (error) {
      console.error('fetchWarehouses ERROR:', error);
    }
    if (data) {
      setWarehouses(data);
    }
  };

  const fetchAnimais = async () => {
    let query = supabase
      .from('animais')
      .select('id, brinco, nome, raca').eq('tenant_id', activeTenantId)
      .neq('status', 'vendido')
      .neq('status', 'morto');
    query = applyFarmFilter(query);
    const { data } = await query.limit(500);
    if (data) {
      setAnimais(
        data.map((a) => ({ value: a.id, label: `${a.brinco} - ${a.nome || a.raca || 'Sem Nome'}` }))
      );
    }
  };

  const fetchLotes = async () => {
    let query = supabase.from('lotes').select('id, nome').eq('tenant_id', activeTenantId).eq('status', 'ativo');
    query = applyFarmFilter(query);
    const { data } = await query;
    if (data) {
      setLotes(data.map((l) => ({ value: l.id, label: l.nome })));
    }
  };

  const isMedicament = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod || !prod.categoria) {
      return false;
    }
    const cat = prod.categoria.toLowerCase();
    return (
      cat.includes('medicamento') ||
      cat.includes('saúde') ||
      cat.includes('saude') ||
      cat.includes('vacina') ||
      cat.includes('veterinário')
    );
  };

  const isAgroDefensive = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod || !prod.categoria) {
      return false;
    }
    const cat = prod.categoria.toLowerCase();
    return (
      cat.includes('defensivo') ||
      cat.includes('agrotóxico') ||
      cat.includes('herbicida') ||
      cat.includes('fungicida') ||
      cat.includes('inseticida')
    );
  };

  const isSeedOrFertilizer = (prodId: string) => {
    const prod = products.find((p) => p.id === prodId);
    if (!prod || !prod.categoria) {
      return false;
    }
    const cat = prod.categoria.toLowerCase();
    return (
      cat.includes('semente') ||
      cat.includes('adubo') ||
      cat.includes('nutrição') ||
      cat.includes('fertilizante')
    );
  };

  const requiresReceipt = items.some((item) => isAgroDefensive(item.produto_id));

  const totalItemsValue = items.reduce(
    (sum, item) =>
      sum + parseFloat(item.quantidade || '0') * parseFloat(item.valor_unitario || '0'),
    0
  );
  const totalMovementValue =
    totalItemsValue +
    (formData.tipo === 'in' ? parseFloat(formData.despesas_acessorias || '0') : 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Adicione pelo menos um insumo à lista.');
      return;
    }
    if (
      formData.tipo === 'transfer' &&
      (!formData.deposito_origem_id || !formData.destino_deposito_id)
    ) {
      toast.error('Para transferência, informe a origem e destino.');
      return;
    }
    if (requiresReceipt && !formData.receituario_agronomico) {
      toast.error('O Receituário Agronômico é obrigatório para defensivos.');
      return;
    }

    // Validate IN values
    if (formData.tipo === 'in') {
      const missingValue = items.some(
        (item) => !item.valor_unitario || parseFloat(item.valor_unitario) <= 0
      );
      if (missingValue) {
        toast.error('Preencha o Valor Unitário para entrada de todos os itens.');
        return;
      }
    }

    // Validate Depots
    if (formData.tipo !== 'transfer') {
      const missingDepot = items.some((item) => !item.deposito_id);
      if (missingDepot) {
        toast.error('Selecione o Depósito para todos os itens.');
        return;
      }
    }

    // Validate stock for out/transfer
    if (formData.tipo === 'out' || formData.tipo === 'transfer') {
      // Assuming mock available stock = 150 for all items right now.
      for (const item of items) {
        if (parseFloat(item.quantidade || '0') > 150) {
          const prodName = products.find((p) => p.id === item.produto_id)?.nome || 'Produto';
          toast.error(`Quantidade de "${prodName}" é maior que o saldo disponível em estoque!`);
          return;
        }
      }
    }

    setLoading(true);
    try {
      await onSubmit({ ...formData, items });
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      size="large"
      title={
        initialData
          ? 'Editar Movimentação'
          : formData.tipo === 'in'
            ? 'Lançar Entrada'
            : formData.tipo === 'transfer'
              ? 'Transferência de Estoque'
              : 'Lançar Saída'
      }
      subtitle={
        formData.tipo === 'transfer'
          ? 'Mova insumos entre depósitos da mesma unidade.'
          : 'Registre a movimentação física (Multi-itens).'
      }
      icon={
        formData.tipo === 'in'
          ? ArrowDownLeft
          : formData.tipo === 'transfer'
            ? ArrowRightLeft
            : ArrowUpRight
      }
      loading={loading}
      submitLabel={
        initialData
          ? 'Salvar Alterações'
          : formData.tipo === 'transfer'
            ? 'Confirmar Transferência'
            : 'Confirmar Movimentação'
      }
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
              <label className="tauze-label">
                <Building2 size={14} /> Depósito de Origem
              </label>
              <SearchableSelect
                value={formData.deposito_origem_id}
                onChange={(val) => setFormData({ ...formData, deposito_origem_id: val })}
                options={warehouses.map((w) => ({ value: w.id, label: w.nome }))}
                placeholder="Selecione o local de saída..."
              />
            </div>
          )}

          {/* If Transfer, we keep Destination Depot at the top level */}
          {formData.tipo === 'transfer' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <ArrowRightLeft size={14} /> Depósito de Destino
                </label>
                <SearchableSelect
                  value={formData.destino_deposito_id}
                  onChange={(val) => setFormData({ ...formData, destino_deposito_id: val })}
                  options={warehouses
                    .filter((w) => w.id !== formData.deposito_origem_id)
                    .map((w) => ({ value: w.id, label: w.nome }))}
                  placeholder="Selecione o local de destino..."
                />
              </div>
              <div
                className="tauze-field-group"
                style={{
                  gridColumn: 'span 2',
                  background: '#f8fafc',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px dashed #cbd5e1',
                }}
              >
                <label className="tauze-label" style={{ color: '#0f172a' }}>
                  <FileText size={14} /> Motivo da Transferência (Justificativa)
                </label>
                <input
                  type="text"
                  className="tauze-input"
                  placeholder="Ex: Remanejamento para plantio no Talhão 02..."
                  value={formData.origem_destino}
                  onChange={(e) => setFormData({ ...formData, origem_destino: e.target.value })}
                  required
                />
              </div>
            </>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data do Lançamento
            </label>
            <input
              type="date"
              value={formData.data_movimentacao}
              onChange={(e) => setFormData({ ...formData, data_movimentacao: e.target.value })}
              required
              className="tauze-input"
            />
          </div>

          {formData.tipo === 'in' && (
            <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
              <label className="tauze-label">
                <FileText size={14} /> Motivo / Observação
              </label>
              <input
                type="text"
                className="tauze-input"
                placeholder="Ex: Entrada manual de estoque, ajuste, doação..."
                value={formData.origem_destino}
                onChange={(e) => setFormData({ ...formData, origem_destino: e.target.value })}
                required
              />
            </div>
          )}

          {formData.tipo === 'out' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Building2 size={14} /> Centro de Custo (Destinação)
                </label>
                <SearchableSelect
                  value={formData.centro_custo}
                  onChange={(val) =>
                    setFormData({ ...formData, centro_custo: val, sub_centro_custo: '' })
                  }
                  options={[
                    { value: 'frota', label: 'Frota (Tratores / Máquinas)' },
                    { value: 'lavoura', label: 'Lavoura (Talhões / Glebas)' },
                    { value: 'bovinocultura', label: 'Bovinocultura (Lotes / Animais)' },
                    { value: 'infra', label: 'Infraestrutura / Manutenção Geral' },
                  ]}
                  placeholder="Para onde vai essa despesa?"
                />
              </div>

              {formData.centro_custo === 'frota' && (
                <div
                  className="tauze-field-group"
                  style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <label className="tauze-label" style={{ color: '#0f172a' }}>
                    <Tractor size={14} /> Máquina / Placa / Frota
                  </label>
                  <input
                    type="text"
                    className="tauze-input"
                    placeholder="Ex: Trator John Deere 1..."
                    value={formData.sub_centro_custo}
                    onChange={(e) => setFormData({ ...formData, sub_centro_custo: e.target.value })}
                    required
                  />
                </div>
              )}

              {formData.centro_custo === 'lavoura' && (
                <div
                  className="tauze-field-group"
                  style={{
                    background: '#f0fdf4',
                    padding: '12px',
                    borderRadius: '8px',
                    border: '1px dashed #bbf7d0',
                  }}
                >
                  <label className="tauze-label" style={{ color: '#166534' }}>
                    <Map size={14} /> Talhão / Gleba / Safra
                  </label>
                  <input
                    type="text"
                    className="tauze-input"
                    placeholder="Ex: Talhão 04 - Soja 2026..."
                    value={formData.sub_centro_custo}
                    onChange={(e) => setFormData({ ...formData, sub_centro_custo: e.target.value })}
                    required
                  />
                </div>
              )}

              {formData.centro_custo === 'bovinocultura' && (
                <div
                  className="tauze-field-group"
                  style={{
                    background: '#fffbeb',
                    padding: '16px',
                    borderRadius: '8px',
                    border: '1px dashed #fde68a',
                    gridColumn: 'span 2',
                  }}
                >
                  <label className="tauze-label" style={{ color: '#92400e', marginBottom: '8px' }}>
                    <Hash size={14} /> Destinação na Bovinocultura (Busca Inteligente)
                  </label>
                  <SearchableSelect
                    value={
                      formData.apropriar_custo
                        ? formData.apropriar_tipo === 'lote'
                          ? `LOTE_${formData.lote_pecuario_id}`
                          : `ANIMAL_${formData.animal_id}`
                        : formData.sub_centro_custo
                    }
                    onChange={(val) => {
                      const allOptions = [
                        ...lotes.map((l) => ({
                          value: `LOTE_${l.value}`,
                          label: `Lote: ${l.label}`,
                        })),
                        ...animais.map((a) => ({
                          value: `ANIMAL_${a.value}`,
                          label: `Animal: ${a.label}`,
                        })),
                      ];

                      if (val.startsWith('LOTE_')) {
                        const id = val.replace('LOTE_', '');
                        const label = allOptions.find((o) => o.value === val)?.label || val;
                        setFormData({
                          ...formData,
                          apropriar_custo: true,
                          apropriar_tipo: 'lote',
                          lote_pecuario_id: id,
                          animal_id: '',
                          sub_centro_custo: label,
                        });
                      } else if (val.startsWith('ANIMAL_')) {
                        const id = val.replace('ANIMAL_', '');
                        const label = allOptions.find((o) => o.value === val)?.label || val;
                        setFormData({
                          ...formData,
                          apropriar_custo: true,
                          apropriar_tipo: 'animal',
                          animal_id: id,
                          lote_pecuario_id: '',
                          sub_centro_custo: label,
                        });
                      } else {
                        setFormData({
                          ...formData,
                          apropriar_custo: false,
                          animal_id: '',
                          lote_pecuario_id: '',
                          sub_centro_custo: val,
                        });
                      }
                    }}
                    options={[
                      ...lotes.map((l) => ({
                        value: `LOTE_${l.value}`,
                        label: `Lote: ${l.label}`,
                      })),
                      ...animais.map((a) => ({
                        value: `ANIMAL_${a.value}`,
                        label: `Animal: ${a.label}`,
                      })),
                    ]}
                    placeholder="Digite um lote, animal, ou texto livre..."
                    creatable={true}
                  />
                  <div
                    style={{
                      marginTop: '8px',
                      fontSize: '12px',
                      color: formData.apropriar_custo ? '#10b981' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: formData.apropriar_custo ? '#10b981' : '#cbd5e1',
                      }}
                    />
                    {formData.apropriar_custo
                      ? `Apropriação automática ativada para ${formData.apropriar_tipo === 'lote' ? 'Lote (Rateio)' : 'Animal (Direto)'}.`
                      : 'Texto livre. Custo não será rateado automaticamente.'}
                  </div>
                </div>
              )}
            </>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Users size={14} /> Responsável
            </label>
            <input
              type="text"
              className="tauze-input"
              placeholder="Nome de quem realizou..."
              value={formData.responsavel}
              onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">
            {initialData ? 'Item da Movimentação' : 'Adicionar Insumos'}
          </h4>
        </div>

        {!initialData ? (
          <ConsumptionCart
            items={items}
            onChange={setItems}
            mode="movement"
            isEntry={formData.tipo === 'in'}
            hideDeposit={formData.tipo === 'transfer'}
            title={
              formData.tipo === 'in'
                ? 'Insumos de Entrada'
                : formData.tipo === 'transfer'
                  ? 'Insumos para Transferência'
                  : 'Insumos de Saída'
            }
            subtitle={
              formData.tipo === 'in'
                ? 'Lance os itens da NFe'
                : 'Selecione os produtos para movimentar'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Package size={14} /> Produto
                </label>
                <SearchableSelect
                  value={items[0]?.produto_id}
                  onChange={(val) => {
                    const newItems = [...items];
                    newItems[0].produto_id = val;
                    setItems(newItems);
                  }}
                  options={products.map((p) => ({
                    value: p.id,
                    label: `${p.nome} (${p.unidade})`,
                  }))}
                  placeholder={
                    products.length === 0
                      ? loading
                        ? 'Carregando...'
                        : 'Nenhum produto...'
                      : 'Selecione um item...'
                  }
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Building2 size={14} /> Depósito
                </label>
                <SearchableSelect
                  value={items[0]?.deposito_id}
                  onChange={(val) => {
                    const newItems = [...items];
                    newItems[0].deposito_id = val;
                    setItems(newItems);
                  }}
                  options={warehouses.map((w) => ({ value: w.id, label: w.nome }))}
                  placeholder={
                    warehouses.length === 0
                      ? loading
                        ? 'Carregando...'
                        : 'Nenhum depósito...'
                      : 'Selecione um depósito...'
                  }
                />
              </div>
            </div>

            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Hash size={14} /> Quantidade
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="tauze-input"
                  value={items[0]?.quantidade}
                  onChange={(e) => {
                    const newItems = [...items];
                    newItems[0].quantidade = parseFloat(e.target.value) || 0;
                    setItems(newItems);
                  }}
                  required
                />
              </div>
              {formData.tipo !== 'transfer' && (
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <DollarSign size={14} />{' '}
                    {formData.tipo === 'out' ? 'Custo Médio (Un)' : 'Valor Unitário'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    className="tauze-input"
                    value={items[0]?.valor_unitario}
                    onChange={(e) => {
                      const newItems = [...items];
                      newItems[0].valor_unitario = parseFloat(e.target.value) || 0;
                      setItems(newItems);
                    }}
                    disabled={formData.tipo === 'out'}
                    style={{
                      background: formData.tipo === 'out' ? 'hsl(var(--bg-muted))' : 'white',
                      cursor: formData.tipo === 'out' ? 'not-allowed' : 'text',
                    }}
                    required
                  />
                </div>
              )}
            </div>

            {isMedicament(items[0]?.produto_id) && formData.tipo === 'in' && (
              <div
                className="tauze-input-grid grid-col-2"
                style={{
                  background: 'hsl(38 92% 50% / 0.1)',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid hsl(38 92% 50% / 0.3)',
                }}
              >
                <div className="tauze-field-group">
                  <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}>
                    <Hash size={14} /> Lote
                  </label>
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
                  <label className="tauze-label" style={{ color: 'hsl(38 92% 40%)' }}>
                    <Calendar size={14} /> Data de Validade
                  </label>
                  <DateInput
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

        {/* Value and Compliance Footer */}
        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {requiresReceipt && formData.tipo === 'out' && (
            <div
              style={{
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#991b1b',
                  fontWeight: 800,
                  fontSize: '12px',
                  textTransform: 'uppercase',
                }}
              >
                <AlertTriangle size={16} /> Compliance Ambiental (Defensivos)
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ color: '#991b1b' }}>
                  <FileText size={14} /> Nº Receituário Agronômico
                </label>
                <input
                  type="text"
                  className="tauze-input"
                  placeholder="Digite o número da receita..."
                  value={formData.receituario_agronomico}
                  onChange={(e) =>
                    setFormData({ ...formData, receituario_agronomico: e.target.value })
                  }
                  style={{ borderColor: '#fca5a5' }}
                />
              </div>
            </div>
          )}

          <div
            style={{
              background: 'hsl(var(--bg-main))',
              padding: '16px',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-muted))' }}>
              Valor Total da {formData.tipo === 'out' ? 'Despesa' : 'Movimentação'}:
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: formData.tipo === 'out' ? '#ef4444' : '#10b981',
              }}
            >
              {totalMovementValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
