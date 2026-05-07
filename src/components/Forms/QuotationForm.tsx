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
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

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
    const { data: sData } = await supabase.from('fornecedores').select('id, nome').eq('tenant_id', activeFarm.tenantId);
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Mapa de Cotação" : "Novo Mapa de Cotação"}
      subtitle="Compare preços de diferentes fornecedores para o mesmo item."
      icon={BarChart2}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Iniciar Comparativo"}
    >
      <div className="form-group">
        <label><Package size={14} /> Item para Cotação</label>
        <select 
          value={formData.item_id}
          onChange={(e) => setFormData({...formData, item_id: e.target.value})}
          required
        >
          <option value="">Selecione o produto...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Quantidade & Unidade</label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input 
            type="number" 
            placeholder="0" 
            style={{ flex: 1 }}
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            required
          />
          <select 
            style={{ width: '120px' }}
            value={formData.unit}
            onChange={(e) => setFormData({...formData, unit: e.target.value})}
          >
            <option>Unidades</option>
            <option>Toneladas</option>
            <option>Sacos</option>
            <option>Litros</option>
            <option>Frascos</option>
          </select>
        </div>
      </div>

      <div className="form-group full-width">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <label style={{ margin: 0 }}><Building2 size={14} /> Comparativo de Fornecedores</label>
          <button type="button" className="text-btn-primary" onClick={addSupplier} style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> Adicionar Fornecedor
          </button>
        </div>
        
        <div className="suppliers-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {formData.suppliers.map((sup, idx) => (
            <div key={idx} className="elite-form-info-box" style={{ 
              display: 'grid', 
              gridTemplateColumns: '2fr 1fr 1fr 40px', 
              gap: '12px', 
              padding: '12px', 
              alignItems: 'center'
            }}>
              <select 
                value={sup.supplier_id}
                onChange={(e) => updateSupplier(idx, 'supplier_id', e.target.value)}
                required
              >
                <option value="">Fornecedor...</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>R$</span>
                <input 
                  type="number" 
                  placeholder="Preço" 
                  style={{ paddingLeft: '30px' }}
                  value={sup.price}
                  onChange={(e) => updateSupplier(idx, 'price', e.target.value)}
                  required
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  placeholder="Entrega" 
                  style={{ paddingRight: '35px' }}
                  value={sup.delivery_days}
                  onChange={(e) => updateSupplier(idx, 'delivery_days', e.target.value)}
                  required
                />
                <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.65rem', color: 'var(--text-muted)', pointerEvents: 'none' }}>DIAS</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => removeSupplier(idx)} style={{ color: 'hsl(var(--destructive))', background: 'transparent', border: 'none' }}>
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </FormModal>
  );
};
