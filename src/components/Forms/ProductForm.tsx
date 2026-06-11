import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { 
  Package, 
  Tag,
  Hash,
  DollarSign,
  AlertTriangle,
  Layers,
  FileText,
  AlertCircle,
  Lock
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { FormSection } from './UI/FormSection';
import { useTenant } from '../../contexts/TenantContext';
import { supabase } from '../../lib/supabase';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  hasHistory?: boolean;
  actionId?: number;
}

export const ProductForm: React.FC<ProductFormProps> = ({isOpen, onClose, onSubmit, initialData, hasHistory = false, actionId }) => {
  const { tenant } = useTenant();
  const [categories, setCategories] = useState<{id: string, nome: string, tipo_item?: string}[]>([]);
  const [ncms, setNcms] = useState<{value: string, label: string}[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = usePersistentState('ProductForm_formData', {
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
    is_active: true,
    tipo: 'produto',
    codigo_servico_lc116: '',
    codigo_tributacao_nacional: '',
    cnae_associado: ''
  });

  const [loading, setLoading] = useState(false);

  // Derived State (Capital Imobilizado)
  const totalValue = useMemo(() => {
    return parseFloat(formData.estoque_atual || '0') * parseFloat(formData.custo_medio || '0');
  }, [formData.estoque_atual, formData.custo_medio]);

  // Derived State (Defensive Alert)
  const isDefensive = useMemo(() => {
    const term = (formData.categoria || formData.nome).toLowerCase();
    return term.includes('defensivo') || term.includes('agrotóxico') || term.includes('inseticida') || term.includes('herbicida') || term.includes('fungicida');
  }, [formData.categoria, formData.nome]);

  // Filtered Categories based on item type
  const filteredCategories = useMemo(() => {
    return categories
      .filter(c => !c.tipo_item || c.tipo_item === 'ambos' || c.tipo_item === formData.tipo)
      .map(c => ({ value: c.id, label: c.nome }));
  }, [categories, formData.tipo]);

  const fetchCategories = async () => {
    if (!tenant) return;
    try {
      const fetchPromise = supabase
        .from('categorias_sistema')
        .select('id, nome, tipo_item')
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
        setCategories(data);
      } else {
        throw new Error('No data');
      }
    } catch (error) {
      console.warn('[ProductForm] Category fetch fallback:', error);
      setCategories([
        { id: "Semente", nome: "Semente", tipo_item: "produto" },
        { id: "Adubo", nome: "Adubo", tipo_item: "produto" },
        { id: "Medicamento", nome: "Medicamento", tipo_item: "produto" },
        { id: "Suplemento", nome: "Suplemento / Sal", tipo_item: "produto" },
        { id: "Combustível", nome: "Combustível", tipo_item: "produto" },
        { id: "Serviços Gerais", nome: "Serviços Gerais", tipo_item: "servico" },
        { id: "Mão de Obra", nome: "Mão de Obra", tipo_item: "servico" },
        { id: "Outros", nome: "Outros", tipo_item: "ambos" }
      ]);
    }
  };

  const handleCategoriaChange = async (val: string) => {
    const isKnown = categories.find(c => c.id === val || c.nome === val);
    if (isKnown) {
      setFormData({...formData, categoria_id: isKnown.id, categoria: isKnown.nome});
    } else if (val && val.trim().length > 0) {
      setFormData({...formData, categoria_id: '', categoria: val});
      if (tenant) {
        try {
          const { data, error } = await supabase.from('categorias_sistema').insert({
            tenant_id: tenant.id,
            modulo: 'estoque',
            nome: val.trim(),
            is_active: true,
            tipo_item: formData.tipo
          }).select().single();
          if (data) {
            fetchCategories();
            setFormData(prev => ({...prev, categoria_id: String(data.id)}));
          }
        } catch (e) {
          console.error('[ProductForm] Erro ao criar categoria', e);
        }
      }
    } else {
      setFormData({...formData, categoria_id: '', categoria: ''});
    }
  };

  useEffect(() => {
    if (!isOpen) return;

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

    setCurrentStep(1);
    fetchCategories();
    fetchNcms();
  }, [tenant, isOpen, actionId]);

  useEffect(() => {
    if (initialData) { setFormData({
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
        is_active: initialData.is_active !== undefined ? initialData.is_active : true,
        tipo: initialData.tipo || 'produto',
        codigo_servico_lc116: initialData.codigo_servico_lc116 || '',
        codigo_tributacao_nacional: initialData.codigo_tributacao_nacional || '',
        cnae_associado: initialData.cnae_associado || ''
      });
    } else if (!isOpen) {
      setFormData({
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
        is_active: true,
        tipo: 'produto',
        codigo_servico_lc116: '',
        codigo_tributacao_nacional: '',
        cnae_associado: ''
      });
    }
  }, [initialData, isOpen, actionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { number: 1, label: 'Identificação & Logística' },
    { number: 2, label: 'Estoque & Custos' },
    { number: 3, label: 'Regras ERP & Notas' },
  ];

  return (
    <SidePanel size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Produto" : "Novo Insumo / Produto"}
      subtitle="Cadastre um item no seu estoque."
      icon={Package}
      loading={loading}
      customFooter={
        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {currentStep > 1 && (
              <button type="button" className="glass-btn secondary" onClick={() => setCurrentStep(prev => Math.max(prev - 1, 1))}>
                Voltar
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" className="glass-btn secondary" onClick={onClose}>
              Cancelar
            </button>
            {currentStep < 3 ? (
              <button 
                key="next-btn"
                type="button" 
                className="primary-btn" 
                onClick={() => {
                  if (currentStep === 1 && !formData.nome.trim()) return;
                  setTimeout(() => {
                    setCurrentStep(prev => Math.min(prev + 1, 3));
                  }, 0);
                }}
                disabled={currentStep === 1 && !formData.nome.trim()}
                style={{ opacity: (currentStep === 1 && !formData.nome.trim()) ? 0.5 : 1 }}
              >
                Avançar
              </button>
            ) : (
              <button 
                key="submit-btn"
                type="submit" 
                className="primary-btn" 
                disabled={loading}
              >
                {loading ? 'Processando...' : initialData ? "Salvar Alterações" : "Salvar Item"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard Step Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '0 4px' }}>
        {steps.map((s, idx) => (
          <React.Fragment key={s.number}>
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: s.number < currentStep ? 'pointer' : 'default' }}
              onClick={() => s.number < currentStep && setCurrentStep(s.number)}
            >
              <div style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 900,
                background: currentStep === s.number ? 'hsl(var(--brand))' : currentStep > s.number ? '#10b981' : '#f1f5f9',
                color: currentStep >= s.number ? 'white' : '#64748b',
                border: `2px solid ${currentStep === s.number ? 'hsl(var(--brand))' : currentStep > s.number ? '#10b981' : '#cbd5e1'}`,
                transition: 'all 0.3s'
              }}>
                {currentStep > s.number ? '✓' : s.number}
              </div>
              <span style={{ fontSize: '12px', fontWeight: currentStep === s.number ? 800 : 600, color: currentStep === s.number ? 'hsl(var(--text-main))' : '#94a3b8' }}>
                {s.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: currentStep > s.number ? '#10b981' : '#e2e8f0', margin: '0 12px' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {currentStep === 1 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="tauze-form-section" style={{ margin: 0 }}>
            <FormSection title="Identificação Básica" badge="PASSO 01" marginTop={0} />
            
            <div style={{ marginBottom: '20px' }}>
              <label className="tauze-label" style={{ display: 'block', marginBottom: '8px', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>Tipo do Item</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 18px', background: formData.tipo === 'produto' ? 'rgba(16, 185, 129, 0.08)' : 'hsl(var(--bg-main)/0.5)', borderRadius: '12px', border: `1.5px solid ${formData.tipo === 'produto' ? '#10b981' : 'hsl(var(--border))'}`, transition: 'all 0.2s', flex: 1 }}>
                  <input 
                    type="radio" 
                    name="tipo_item"
                    checked={formData.tipo === 'produto'}
                    onChange={() => setFormData({...formData, tipo: 'produto', is_storable: true})}
                    style={{ accentColor: '#10b981', width: '16px', height: '16px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Insumo / Produto</span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Itens físicos e estocáveis</span>
                  </div>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '12px 18px', background: formData.tipo === 'servico' ? 'rgba(99, 102, 241, 0.08)' : 'hsl(var(--bg-main)/0.5)', borderRadius: '12px', border: `1.5px solid ${formData.tipo === 'servico' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`, transition: 'all 0.2s', flex: 1 }}>
                  <input 
                    type="radio" 
                    name="tipo_item"
                    checked={formData.tipo === 'servico'}
                    onChange={() => setFormData({...formData, tipo: 'servico', is_storable: false})}
                    style={{ accentColor: 'hsl(var(--brand))', width: '16px', height: '16px' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Serviço</span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Mão de obra, fretes, etc.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className={`tauze-input-grid ${formData.tipo === 'produto' ? 'grid-col-3' : 'grid-col-2'}`}>
              <div className="tauze-field-group">
                <label className="tauze-label"><Package size={14} /> {formData.tipo === 'servico' ? 'Nome do Serviço' : 'Nome do Item'}</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder={formData.tipo === 'servico' ? "Ex: Mão de Obra, Consultoria, Frete..." : "Ex: Milho, NPK, Ivermectina..."}
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required 
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Tag size={14} /> Categoria</label>
                <SearchableSelect
                  value={formData.categoria_id || formData.categoria}
                  onChange={handleCategoriaChange}
                  creatable={true}
                  placeholder="Selecione ou digite nova..."
                  options={filteredCategories}
                />
              </div>

              {formData.tipo === 'produto' && (
                <div className="tauze-field-group animate-slide-up">
                  <label className="tauze-label"><Tag size={14} /> Marca / Fabricante</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: Bunge, Syngenta..." 
                    value={formData.marca}
                    onChange={(e) => setFormData({...formData, marca: e.target.value})}
                  />
                </div>
              )}
            </div>
          </section>

          {formData.tipo === 'produto' && (
            <section className="tauze-form-section animate-slide-up" style={{ margin: 0 }}>
              <FormSection title="Logística e Fiscal" badge="PASSO 02" marginTop={0} />
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Layers size={14} /> Localização (Almoxarifado)</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Prateleira A, Galpão 01..." 
                    value={formData.localizacao}
                    onChange={(e) => setFormData({...formData, localizacao: e.target.value})}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> Código de Barras</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="789..." 
                    value={formData.ean}
                    onChange={(e) => setFormData({...formData, ean: e.target.value})}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> NCM</label>
                  <SearchableSelect
                    options={ncms}
                    value={formData.ncm}
                    onChange={(val: any) => setFormData({...formData, ncm: val})}
                    placeholder="Selecione um NCM..."
                  />
                </div>
              </div>
            </section>
          )}

          {formData.tipo === 'servico' && (
            <section className="tauze-form-section animate-slide-up" style={{ margin: 0 }}>
              <FormSection title="Informações Fiscais" badge="PASSO 02" marginTop={0} />
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> Código de Serviço (LC 116)</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: 07.02, 17.05..." 
                    value={formData.codigo_servico_lc116}
                    onChange={(e) => setFormData({...formData, codigo_servico_lc116: e.target.value})}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> Código de Tributação Nacional</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: 07.02.01..." 
                    value={formData.codigo_tributacao_nacional}
                    onChange={(e) => setFormData({...formData, codigo_tributacao_nacional: e.target.value})}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Hash size={14} /> CNAE Associado</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: 0161-0/03..." 
                    value={formData.cnae_associado}
                    onChange={(e) => setFormData({...formData, cnae_associado: e.target.value})}
                  />
                </div>
              </div>
            </section>
          )}
        </div>
      )}

      {currentStep === 2 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {formData.tipo === 'produto' ? (
            <section className="tauze-form-section" style={{ margin: 0 }}>
              <FormSection title="Controle de Estoque" badge="PASSO 01" marginTop={0} />
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label className="tauze-label"><Hash size={14} /> Est. Atual</label>
                    {hasHistory && <span style={{ fontSize: '9px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 800 }}><Lock size={10}/> BLOQUEADO PELO KARDEX</span>}
                  </div>
                  <input 
                    className="tauze-input"
                    type="number" 
                    step="0.01"
                    placeholder="0.00" 
                    value={formData.estoque_atual}
                    onChange={(e) => setFormData({...formData, estoque_atual: e.target.value})}
                    required
                    disabled={hasHistory}
                    style={{ cursor: hasHistory ? 'not-allowed' : 'text', opacity: hasHistory ? 0.7 : 1, background: hasHistory ? 'hsl(var(--bg-main))' : 'white' }}
                  />
                </div>

                <div className="tauze-field-group">
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

                <div className="tauze-field-group">
                  <label className="tauze-label"><Layers size={14} /> Unidade</label>
                  <SearchableSelect 
                    value={formData.unidade}
                    onChange={(val: any) => setFormData({...formData, unidade: val})}
                    options={[
                      { value: 'un', label: 'un' },
                      { value: 'kg', label: 'kg' },
                      { value: 'ton', label: 'ton' },
                      { value: 'L', label: 'L' },
                      { value: 'dose', label: 'dose' },
                      { value: 'saco', label: 'saco' },
                    ]}
                  />
                </div>
              </div>
            </section>
          ) : (
            <section className="tauze-form-section" style={{ margin: 0 }}>
              <FormSection title="Configuração do Serviço" badge="PASSO 01" marginTop={0} />
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Layers size={14} /> Unidade de Cobrança</label>
                  <SearchableSelect 
                    value={formData.unidade}
                    onChange={(val: any) => setFormData({...formData, unidade: val})}
                    options={[
                      { value: 'un', label: 'un (Unidade)' },
                      { value: 'hr', label: 'hr (Hora)' },
                      { value: 'dia', label: 'dia (Diária)' },
                      { value: 'ha', label: 'ha (Hectare)' },
                      { value: 'km', label: 'km (Quilômetro)' },
                    ]}
                  />
                </div>
              </div>
            </section>
          )}

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <FormSection title="Valores e Custos" badge="PASSO 02" marginTop={0} />

            <div className={`tauze-input-grid ${formData.tipo === 'produto' ? 'grid-col-3' : 'grid-col-2'}`}>
              <div className="tauze-field-group">
                <label className="tauze-label"><DollarSign size={14} /> {formData.tipo === 'servico' ? 'Valor / Custo do Serviço (R$)' : 'Preço de Custo (R$)'}</label>
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

              {formData.tipo === 'produto' && (
                <div className="tauze-field-group">
                  <label className="tauze-label"><DollarSign size={14} /> Capital Imobilizado (R$)</label>
                  <div 
                    className="tauze-input"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: 'rgba(16, 185, 129, 0.05)',
                      color: '#10b981',
                      fontWeight: 700,
                      cursor: 'not-allowed',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      height: '42px'
                    }}
                  >
                    {totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              )}

              <div className="tauze-field-group">
                <label className="tauze-label"><Tag size={14} /> {formData.tipo === 'servico' ? 'Status do Serviço' : 'Status do Insumo'}</label>
                <SearchableSelect 
                  value={formData.is_active ? 'ativo' : 'inativo'}
                  onChange={(val: any) => setFormData({...formData, is_active: val === 'ativo'})}
                  options={[
                    { value: 'ativo', label: 'Ativo (Visível no sistema)' },
                    { value: 'inativo', label: 'Inativo (Oculto)' },
                  ]}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {currentStep === 3 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {isDefensive && (
            <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '12px', color: '#991b1b' }}>
              <AlertCircle size={20} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 800, margin: '0 0 4px 0' }}>Alerta de Defensivo Agrícola</h4>
                <p style={{ fontSize: '11.5px', margin: 0, fontWeight: 500, lineHeight: 1.4, opacity: 0.9 }}>Este item é classificado como defensivo. O consumo deste produto na lavoura exigirá o registro do Receituário Agronômico, e seu descarte obedecerá as regras da logística reversa.</p>
              </div>
            </div>
          )}

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <FormSection title="Regras de ERP (Comportamento do Item)" badge="PASSO 01" marginTop={0} />
            <div className="tauze-input-grid grid-col-3">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_purchasable}
                  onChange={(e) => setFormData({...formData, is_purchasable: e.target.checked})}
                  style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Item de Compra</span>
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Mód. Compras</span>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '12px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
                <input 
                  type="checkbox" 
                  checked={formData.is_sellable}
                  onChange={(e) => setFormData({...formData, is_sellable: e.target.checked})}
                  style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0 }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Item de Venda</span>
                  <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Mód. Vendas</span>
                </div>
              </label>

              {formData.tipo === 'produto' ? (
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: hasHistory ? 'not-allowed' : 'pointer', padding: '12px', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '12px', border: '1px solid hsl(var(--border))', opacity: hasHistory ? 0.6 : 1 }}>
                  <input 
                    type="checkbox" 
                    checked={formData.is_storable}
                    onChange={(e) => setFormData({...formData, is_storable: e.target.checked})}
                    disabled={hasHistory}
                    style={{ width: '16px', height: '16px', accentColor: 'hsl(var(--brand))', flexShrink: 0, cursor: hasHistory ? 'not-allowed' : 'pointer' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-main))' }}>Estoque Físico</span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Gera Kardex</span>
                  </div>
                </label>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px', background: 'hsl(var(--bg-main)/0.3)', borderRadius: '12px', border: '1px dashed hsl(var(--border))', opacity: 0.6 }}>
                  <Lock size={16} style={{ color: 'hsl(var(--text-muted))' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Estoque Físico (Desabilitado)</span>
                    <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 400 }}>Serviço não estocável</span>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <FormSection title="Informações Adicionais" badge="PASSO 02" marginTop={0} />
            <div className="tauze-input-grid grid-col-1">
              <div className="tauze-field-group">
                <label className="tauze-label"><FileText size={14} /> Descrição / Notas</label>
                <textarea className="tauze-input tauze-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder={formData.tipo === 'servico' ? "Informações adicionais sobre o serviço..." : "Informações adicionais sobre o produto..."} 
                  value={formData.descricao}
                  onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                  rows={2}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </SidePanel>
  );
};
