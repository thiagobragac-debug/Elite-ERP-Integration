import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

import {
  BarChart2,
  Package,
  Plus,
  Trash2,
  DollarSign,
  Truck,
  Calendar,
  CreditCard,
  Hash,
  Trophy,
  ClipboardList,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { motion } from 'framer-motion';
import { DateInput } from '../../components/Form/DateInput';

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeFarm, activeTenantId } = useTenant();
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `quotation_form_${activeTenantId}`,
    initialState: {
      request_id: '',
      item_id: '',
      quantity: '',
      unit: 'Unidades',
      suppliers: [
        {
          supplier_id: '',
          price: '',
          freight: '',
          delivery_days: '',
          payment_terms: '',
          validity: '',
        },
      ],
    },
    isOpen,
    isEditMode: !!initialData,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [suppliersList, setSuppliersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actionId) {
      return;
    } // Ignore on initial mount / refresh

    if (initialData) {
      setFormData({
        request_id: initialData.request_id || '',
        item_id: initialData.produto_id || '',
        quantity: initialData.quantidade?.toString() || '',
        unit: initialData.unidade || 'Unidades',
        suppliers: initialData.dados_fornecedores || [
          {
            supplier_id: '',
            price: '',
            freight: '',
            delivery_days: '',
            payment_terms: '',
            validity: '',
          },
        ],
      });
    }
  }, [initialData, isOpen, actionId]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    if (!activeFarm) {
      return;
    }
    const { data: pData } = await supabase
      .from('produtos')
      .select('id, nome')
      .eq('tenant_id', activeFarm.tenantId);
    const { data: sData } = await supabase
      .from('parceiros')
      .select('id, nome')
      .eq('tenant_id', activeFarm.tenantId)
      .eq('is_supplier', true);
    if (pData) {
      setProducts(pData);
    }
    if (sData) {
      setSuppliersList(sData);
    }
  };

  const addSupplier = () => {
    setFormData({
      ...formData,
      suppliers: [
        ...formData.suppliers,
        {
          supplier_id: '',
          price: '',
          freight: '',
          delivery_days: '',
          payment_terms: '',
          validity: '',
        },
      ],
    });
  };

  const removeSupplier = (index: number) => {
    setFormData({
      ...formData,
      suppliers: formData.suppliers.filter((_, i) => i !== index),
    });
  };

  const updateSupplier = (index: number, field: string, value: string) => {
    const newSuppliers = [...formData.suppliers];
    newSuppliers[index] = { ...newSuppliers[index], [field]: value };
    setFormData({ ...formData, suppliers: newSuppliers });
  };

  const quantityNum = Number(formData.quantity) || 0;

  const calculateTCO = (sup: any) => {
    const price = Number(sup.price) || 0;
    const freight = Number(sup.freight) || 0;
    if (price === 0) {
      return null;
    }
    return price * quantityNum + freight;
  };

  // Algoritmo em tempo real para encontrar o menor Custo Total
  const bestSupplierIndex = useMemo(() => {
    if (quantityNum <= 0) {
      return -1;
    }
    let minTCO = Infinity;
    let bestIdx = -1;
    formData.suppliers.forEach((sup, idx) => {
      if (sup.supplier_id && sup.price) {
        const tco = calculateTCO(sup);
        if (tco !== null && tco < minTCO) {
          minTCO = tco;
          bestIdx = idx;
        }
      }
    });
    return bestIdx;
  }, [formData.suppliers, quantityNum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Mapa de Cotação' : 'Novo Mapa de Cotação'}
      subtitle="Equalização financeira: Compare TCO (Custo Total) e prazos para tomada de decisão."
      icon={BarChart2}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Concluir Equalização'}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação do Item e Demanda</h4>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <ClipboardList size={14} /> Vincular à Solicitação de Compra (Origem)
            </label>
            <SearchableSelect
              value={formData.request_id}
              onChange={(val: any) => setFormData({ ...formData, request_id: val })}
              options={[
                { value: '', label: 'Cotação Avulsa (Sem vínculo)' },
                { value: 'REQ-001', label: 'REQ-001 - Fertilizantes Safra' },
                { value: 'REQ-002', label: 'REQ-002 - Peças Trator JD' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Package size={14} /> Item para Cotação
            </label>
            <SearchableSelect
              value={formData.item_id}
              onChange={(val: any) => setFormData({ ...formData, item_id: val })}
              options={[
                { value: '', label: 'Selecione o produto...' },
                ...(products || []).map((p) => ({ value: String(p.id), label: String(p.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> Quantidade (Base de Cálculo) & Unidade
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                className="tauze-input"
                type="number"
                placeholder="Ex: 100"
                style={{ flex: 1, border: quantityNum > 0 ? '1px solid hsl(var(--brand))' : '' }}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
              <div style={{ flex: 1 }}>
                <SearchableSelect
                  value={formData.unit}
                  onChange={(val: any) => setFormData({ ...formData, unit: val })}
                  options={[
                    { value: 'Unidades', label: 'Unidades' },
                    { value: 'Toneladas', label: 'Toneladas' },
                    { value: 'Sacos', label: 'Sacos' },
                    { value: 'Litros', label: 'Litros' },
                    { value: 'Frascos', label: 'Frascos' },
                  ]}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div
          className="tauze-section-header"
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Comparativo de Fornecedores (TCO)</h4>
          </div>
          <button
            type="button"
            className="glass-btn primary"
            onClick={addSupplier}
            style={{ fontSize: '11px', height: '32px' }}
          >
            <Plus size={14} /> NOVO FORNECEDOR
          </button>
        </div>

        <div className="tauze-input-grid grid-col-1">
          <div
            className="suppliers-list"
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {formData.suppliers.map((sup, idx) => {
              const tco = calculateTCO(sup);
              const isWinner = idx === bestSupplierIndex && tco !== null;

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={idx}
                  style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '20px',
                    background: isWinner ? 'hsl(142 71% 45% / 0.05)' : 'hsl(var(--bg-card))',
                    borderRadius: '16px',
                    border: isWinner ? '2px solid #10b981' : '1px solid hsl(var(--border))',
                    boxShadow: isWinner ? '0 8px 32px rgba(16, 185, 129, 0.15)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {isWinner && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '20px',
                        background: '#10b981',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '20px',
                        fontSize: '10px',
                        fontWeight: 900,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        letterSpacing: '0.05em',
                      }}
                    >
                      <Trophy size={12} />
                      MENOR CUSTO TCO
                    </div>
                  )}

                  {/* Top Row: Supplier & Remove btn */}
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1 }}>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        Fornecedor
                      </label>
                      <SearchableSelect
                        value={sup.supplier_id}
                        onChange={(val: any) => updateSupplier(idx, 'supplier_id', val)}
                        options={[
                          { value: '', label: 'Selecione o Fornecedor...' },
                          ...(suppliersList || []).map((s) => ({
                            value: String(s.id),
                            label: String(s.nome),
                          })),
                        ]}
                      />
                    </div>
                    {formData.suppliers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSupplier(idx)}
                        style={{
                          height: '42px',
                          width: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'hsl(var(--destructive)/0.1)',
                          color: 'hsl(var(--destructive))',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Middle Row: Price, Freight, Delivery */}
                  <div
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}
                  >
                    <div>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        <DollarSign size={12} /> Preço Unitário
                      </label>
                      <input
                        className="tauze-input"
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00"
                        value={sup.price}
                        onChange={(e) => updateSupplier(idx, 'price', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        <Truck size={12} /> Custo Frete Total
                      </label>
                      <input
                        className="tauze-input"
                        type="number"
                        step="0.01"
                        placeholder="R$ 0,00 (0 se CIF)"
                        value={sup.freight}
                        onChange={(e) => updateSupplier(idx, 'freight', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        <Calendar size={12} /> Prazo Entrega (Dias)
                      </label>
                      <input
                        className="tauze-input"
                        type="number"
                        placeholder="0"
                        value={sup.delivery_days}
                        onChange={(e) => updateSupplier(idx, 'delivery_days', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Bottom Row: Payment, Validity and Auto TCO */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1fr 1.5fr',
                      gap: '12px',
                      alignItems: 'center',
                      borderTop: '1px dashed hsl(var(--border))',
                      paddingTop: '12px',
                      marginTop: '4px',
                    }}
                  >
                    <div>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        <CreditCard size={12} /> Condição de Pagamento
                      </label>
                      <SearchableSelect
                        value={sup.payment_terms}
                        onChange={(val: any) => updateSupplier(idx, 'payment_terms', val)}
                        options={[
                          { value: '', label: 'Selecione...' },
                          { value: 'À Vista', label: 'À Vista' },
                          { value: '15 Dias', label: '15 Dias' },
                          { value: '30 Dias', label: '30 Dias' },
                          { value: '30/60/90', label: '30/60/90' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="tauze-label" style={{ fontSize: '10px' }}>
                        Validade (Proposta)
                      </label>
                      <DateInput
                        className="tauze-input"
                        type="date"
                        value={sup.validity}
                        onChange={(e) => updateSupplier(idx, 'validity', e.target.value)}
                      />
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        justifyContent: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'hsl(var(--text-muted))',
                          textTransform: 'uppercase',
                        }}
                      >
                        CUSTO TOTAL (TCO)
                      </span>
                      <span
                        style={{
                          fontSize: '18px',
                          fontWeight: 900,
                          color: isWinner ? '#10b981' : 'hsl(var(--text-main))',
                        }}
                      >
                        {tco !== null
                          ? `R$ ${tco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'R$ 0,00'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
