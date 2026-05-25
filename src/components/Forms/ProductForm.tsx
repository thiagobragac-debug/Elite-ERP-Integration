import React, { useState } from 'react';
import { 
  Package, 
  Tag,
  Hash,
  DollarSign,
  AlertTriangle,
  Layers,
  FileText
} from 'lucide-react';
import { FormModal } from './FormModal';
import { SearchableSelect } from './SearchableSelect';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  hasHistory?: boolean;
}

export const ProductForm: React.FC<ProductFormProps> = ({ isOpen, onClose, onSubmit, initialData, hasHistory = false }) => {
  const { tenant } = useTenant();
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);
  const [ncms, setNcms] = useState<{value: string, label: string}[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    categoria: '',
    categoria_id: '',
    unidade: 'un',
    estoque_minimo: '0',
    estoque_atual: '0',
    custo_medio: '0',
    descricao: '',
    ean: '',
    ncm: '',
    marca: '',
    localizacao: '',
    is_purchasable: true,
    is_sellable: false,
    is_storable: true,
    is_active: true
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const fetchCategories = async () => {
      if (!tenant) return;
      try {
        const fetchPromise = supabase
          .from('categorias_sistema')
          .select('id, nome')
          .eq('tenant_id', tenant.id)
          .eq('modulo', 'estoque')
          .eq('is_active', true)
          .order('nome');
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const { data, error } = result;
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          setCategories(data.map((d: any) => ({ value: d.id, label: d.nome })));
        } else {
          throw new Error('No data');
        }
      } catch (error) {
        console.warn('[ProductForm] Category fetch fallback:', error);
        setCategories([
          { value: "Semente", label: "Semente" },
          { value: "Adubo", label: "Adubo" },
          { value: "Medicamento", label: "Medicamento" },
          { value: "Suplemento", label: "Suplemento / Sal" },
          { value: "Combustível", label: "Combustível" },
          { value: "Outros", label: "Outros" }
        ]);
      }
    };

    const fetchNcms = async () => {
      if (!tenant) return;
      try {
        const fetchPromise = supabase
          .from('estoque_ncms')
          .select('codigo, descricao')
          .eq('tenant_id', tenant.id)
          .eq('is_active', true)
          .order('codigo');
          
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );

        const result = await Promise.race([fetchPromise, timeoutPromise]) as any;
        const { data, error } = result;
        
        if (error) throw error;
          
        if (data && data.length > 0) {
          setNcms(data.map((d: any) => ({ value: d.codigo, label: `${d.codigo} - ${d.descricao}` })));
        } else {
          throw new Error('No data');
        }
      } catch (error) {
        console.warn('[ProductForm] NCM fetch fallback:', error);
        setNcms([
          { value: "3105.20.00", label: "3105.20.00 - Adubos ou Fertilizantes" },
          { value: "3808.91.19", label: "3808.91.19 - Inseticidas" },
          { value: "1005.90.10", label: "1005.90.10 - Milho em Grão" }
        ]);
      }
    };

    if (isOpen) {
      fetchCategories();
      fetchNcms();
    }
  }, [tenant, isOpen]);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        categoria_id: initialData.categoria_id || '',
        categoria: initialData.categoria || '',
        unidade: initialData.unidade || 'un',
        estoque_minimo: initialData.estoque_minimo?.toString() || '0',
        estoque_atual: initialData.estoque_atual?.toString() || '0',
        custo_medio: initialData.custo_medio?.toString() || '0',
        descricao: initialData.descricao || '',
        ean: initialData.ean || '',
        ncm: initialData.ncm || '',
        marca: initialData.marca || '',
        localizacao: initialData.localizacao || '',
        is_purchasable: initialData.is_purchasable !== undefined ? initialData.is_purchasable : true,
        is_sellable: initialData.is_sellable !== undefined ? initialData.is_sellable : false,
        is_storable: initialData.is_storable !== undefined ? initialData.is_storable : true,
        is_active: initialData.is_active !== undefined ? initialData.is_active : true
      });
    }
  }, [initialData, isOpen]);

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
      title={initialData ? "Editar Produto" : "Novo Insumo / Produto"}
      subtitle="Cadastre um item no seu estoque."
      icon={Package}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Item"}
    >
      <div className="tauze-field-group full-width" style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1.5fr', gap: '16px', padding: 0, background: 'transparent', border: 'none' }}>
        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Package size={14} /> Nome do Item</label>
          <input 
            className="tauze-input"
            type="text" 
            placeholder="Ex: Milho, NPK 04-14-08, Ivermectina..." 
            value={formData.nome}
            onChange={(e) => setFormData({...formData, nome: e.target.value})}
            required 
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Tag size={14} /> Categoria</label>
          <SearchableSelect
            value={formData.categoria_id || formData.categoria}
            onChange={(val) => {
              // Find if val is a known ID
              const isKnown = categories.find(c => c.value === val);
              if (isKnown) {
                setFormData({...formData, categoria_id: val, categoria: isKnown.label});
              } else {
                setFormData({...formData, categoria_id: '', categoria: val}); // Free text if creatable
              }
            }}
            creatable={true}
            placeholder="Selecione ou digite nova..."
            options={categories}
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Tag size={14} /> Marca / Fabricante</label>
          <input 
            className="tauze-input"
            type="text" 
            placeholder="Ex: Bunge, Syngenta..." 
            value={formData.marca}
            onChange={(e) => setFormData({...formData, marca: e.target.value})}
          />
        </div>
      </div>

      <div className="tauze-field-group full-width" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px', padding: 0, background: 'transparent', border: 'none' }}>
        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Layers size={14} /> Localização (Almoxarifado)</label>
          <input 
            className="tauze-input"
            type="text" 
            placeholder="Prateleira A, Galpão 01..." 
            value={formData.localizacao}
            onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Hash size={14} /> Código de Barras</label>
          <input 
            className="tauze-input"
            type="text" 
            placeholder="789..." 
            value={formData.ean}
            onChange={(e) => setFormData({...formData, ean: e.target.value})}
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Hash size={14} /> NCM</label>
          <SearchableSelect
            options={ncms}
            value={formData.ncm}
            onChange={(val) => setFormData({...formData, ncm: val})}
            placeholder="Selecione um NCM..."
          />
        </div>
      </div>

      <div className="tauze-field-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: 0, background: 'transparent', border: 'none' }}>
        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Hash size={14} /> Est. Atual</label>
          <input 
            className="tauze-input"
            type="number" 
            step="0.01"
            placeholder="0.00" 
            value={formData.estoque_atual}
            onChange={(e) => setFormData({...formData, estoque_atual: e.target.value})}
            required
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><AlertTriangle size={14} /> Est. Mínimo</label>
          <input 
            className="tauze-input"
            type="number" 
            step="0.01"
            placeholder="0.00" 
            value={formData.estoque_minimo}
            onChange={(e) => setFormData({...formData, estoque_minimo: e.target.value})}
            required
          />
        </div>

        <div className="tauze-field-group" style={{ margin: 0, gridColumn: 'span 1' }}>
          <label className="tauze-label"><Layers size={14} /> Unidade</label>
          <select 
            className="tauze-input tauze-select"
            value={formData.unidade}
            onChange={(e) => setFormData({...formData, unidade: e.target.value})}
            required
          >
            <option value="un">un</option>
            <option value="kg">kg</option>
            <option value="ton">ton</option>
            <option value="L">L</option>
            <option value="dose">dose</option>
            <option value="saco">saco</option>
          </select>
        </div>
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><DollarSign size={14} /> Custo (R$)</label>
        <input 
          className="tauze-input"
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo_medio}
          onChange={(e) => setFormData({...formData, custo_medio: e.target.value})}
          required
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label"><Tag size={14} /> Status do Insumo</label>
        <select 
          className="tauze-input tauze-select"
          value={formData.is_active ? 'ativo' : 'inativo'}
          onChange={(e) => setFormData({...formData, is_active: e.target.value === 'ativo'})}
          required
        >
          <option value="ativo">Ativo (Visível no sistema)</option>
          <option value="inativo">Inativo (Oculto)</option>
        </select>
      </div>

      <div className="tauze-field-group full-width">
        <label className="tauze-label"><FileText size={14} /> Descrição / Notas</label>
        <textarea 
          className="tauze-input"
          style={{ height: 'auto', minHeight: '80px', padding: '12px 16px', borderRadius: '14px' }}
          placeholder="Informações adicionais sobre o produto..." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          rows={2}
        />
      </div>

      {/* NEW SECTION: Item Classification Flags */}
      <div className="tauze-field-group full-width" style={{ marginTop: '16px', marginBottom: '16px', background: 'hsl(var(--bg-body))', padding: '16px', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
        <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'hsl(var(--text-main))' }}>Comportamento do Item (Regras de ERP)</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
            <input 
              type="checkbox" 
              checked={formData.is_purchasable}
              onChange={(e) => setFormData({...formData, is_purchasable: e.target.checked})}
              style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>Item de Compra</span>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Mód. Compras</span>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
            <input 
              type="checkbox" 
              checked={formData.is_sellable}
              onChange={(e) => setFormData({...formData, is_sellable: e.target.checked})}
              style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>Item de Venda</span>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Mód. Vendas</span>
            </div>
          </label>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: hasHistory ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))', opacity: hasHistory ? 0.6 : 1 }}>
            <input 
              type="checkbox" 
              checked={formData.is_storable}
              onChange={(e) => setFormData({...formData, is_storable: e.target.checked})}
              disabled={hasHistory}
              style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0, cursor: hasHistory ? 'not-allowed' : 'pointer' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <span>Estoque Físico</span>
              <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Gera Kardex</span>
            </div>
          </label>

        </div>
      </div>
    </FormModal>
  );
};
