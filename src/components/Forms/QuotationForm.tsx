import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Package,
  Plus,
  Trash2,
  Building2,
  DollarSign,
  Clock,
  ArrowRight,
  Hash
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface QuotationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const QuotationForm: React.FC<QuotationFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    item_id: '',
    quantity: '',
    unit: 'Unidades',
    suppliers: [{ supplier_id: '', price: '', delivery_days: '' }]
  });

  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        item_id: initialData.produto_id || '',
        quantity: initialData.quantidade?.toString() || '',
        unit: initialData.unidade || 'Unidades',
        suppliers: initialData.dados_fornecedores || [{ supplier_id: '', price: '', delivery_days: '' }]
      });
    } else {
      setFormData({
        item_id: '',
        quantity: '',
        unit: 'Unidades',
        suppliers: [{ supplier_id: '', price: '', delivery_days: '' }]
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    if (!activeFarm) return;
    const { data: pData } = await supabase.from('produtos').select('id, nome').eq('tenant_id', activeFarm.tenantId);
    const { data: sData } = await supabase.from('parceiros').select('id, nome').eq('tenant_id', activeFarm.tenantId).eq('is_supplier', true);
    if (pData) setProducts(pData);
    if (sData) setSuppliers(sData);
  };

  const addSupplier = () => {
    setFormData({
      ...formData,
      suppliers: [...formData.suppliers, { supplier_id: '', price: '', delivery_days: '' }]
    });
  };

  const removeSupplier = (index: number) => {
    setFormData({
      ...formData,
      suppliers: formData.suppliers.filter((_, i) => i !== index)
    });
  };

  const updateSupplier = (index: number, field: string, value: string) => {
    const newSuppliers = [...formData.suppliers];
    newSuppliers[index] = { ...newSuppliers[index], [field]: value };
    setFormData({ ...formData, suppliers: newSuppliers });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Mapa de Cotação" : "Novo Mapa de Cotação"}
      subtitle="Compare preços de diferentes fornecedores para o mesmo item."
      icon={BarChart2}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Iniciar Comparativo"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação do Item</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Package size={14} /> Item para Cotação</label>
            <SearchableSelect 
              value={formData.item_id}
              onChange={(val: any) => setFormData({...formData, item_id: val})}
              options={[
                { value: '', label: 'Selecione o produto...' },
                ...(products || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Quantidade & Unidade</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="tauze-input"
                type="number" 
                placeholder="0" 
                style={{ flex: 1 }}
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                required
              />
              <div style={{ flex: 1 }}>
                <SearchableSelect 
                  value={formData.unit}
                  onChange={(val: any) => setFormData({...formData, unit: val})}
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
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Comparativo de Fornecedores</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group full-width">
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '12px' }}>
              <button type="button" className="text-btn-primary" onClick={addSupplier} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Plus size={14} /> Adicionar Fornecedor
              </button>
            </div>
            
            <div className="suppliers-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {formData.suppliers.map((sup, idx) => (
                <div key={idx} style={{ 
                  display: 'grid', 
                  gridTemplateColumns: '2fr 1fr 1fr 40px', 
                  gap: '12px', 
                  padding: '16px', 
                  alignItems: 'center',
                  background: 'hsl(var(--bg-main)/0.5)',
                  borderRadius: '12px',
                  border: '1px solid hsl(var(--border))'
                }}>
                  <SearchableSelect 
                    value={sup.supplier_id}
                    onChange={(val: any) => updateSupplier(idx, 'supplier_id', val)}
                    options={[
                      { value: '', label: 'Fornecedor...' },
                      ...(suppliers || []).map(s => ({ value: String(s.id), label: String(s.nome) })),
                    ]}
                  />
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>R$</span>
                    <input 
                      className="tauze-input"
                      type="number" 
                      placeholder="Preço" 
                      style={{ paddingLeft: '32px' }}
                      value={sup.price}
                      onChange={(e) => updateSupplier(idx, 'price', e.target.value)}
                      required
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input 
                      className="tauze-input"
                      type="number" 
                      placeholder="Entrega" 
                      style={{ paddingRight: '40px' }}
                      value={sup.delivery_days}
                      onChange={(e) => updateSupplier(idx, 'delivery_days', e.target.value)}
                      required
                    />
                    <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: 'hsl(var(--text-muted))', fontWeight: 700, pointerEvents: 'none' }}>DIAS</span>
                  </div>
                  <button type="button" className="icon-btn" onClick={() => removeSupplier(idx)} style={{ color: 'hsl(var(--destructive))', background: 'transparent', border: 'none' }}>
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
