import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { 
  Truck, 
  Calendar,
  Layers,
  Settings,
  Hash,
  Activity,
  Tag,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Gauge,
  MapPin,
  Clock,
  FileText
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface MachineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const MachineForm: React.FC<MachineFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const [formData, setFormData] = usePersistentState('MachineForm_formData', {
    nome: '',
    patrimonio: '',
    marca: '',
    modelo: '',
    categoria: '',
    horimetro_inicial: '0',
    quilometragem_inicial: '0',
    placa: '',
    ano: new Date().getFullYear().toString(),
    status: 'active',
    chassi: '',
    combustivel: 'Diesel',
    capacidade_tanque: '',
    valor_compra: '',
    potencia: '',
    peso_operacional: '',
    intervalo_revisao: '250',
    consumo_estimado: '',
    data_proxima_revisao: '',
    observacoes: '',
    unidade_medida: 'horas',
    unidade_id: ''
  });

  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(1);

  const steps = [
    { number: 1, label: 'Identificação & Custo' },
    { number: 2, label: 'Ficha Técnica & Medição' },
    { number: 3, label: 'Docs, Finanças & Revisão' },
  ];

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
    }
  }, [isOpen, actionId]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTenantId) {
      fetchCategories();
    }
  }, [isOpen, activeTenantId, actionId]);

  const fetchCategories = async () => {
    if (!activeTenantId) return;
    const [catRes, farmsRes] = await Promise.all([
      supabase
        .from('categorias_sistema')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .eq('modulo', 'frota')
        .eq('is_active', true)
        .order('nome'),
      supabase
        .from('unidades_produtivas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .order('nome')
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (farmsRes.data) setFarms(farmsRes.data);
  };

  const handleCategoriaChange = async (val: string) => {
    setFormData({ ...formData, categoria: val });
    if (val && !categories.find(c => String(c.nome) === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'frota',
          nome: val,
          is_active: true
        });
        fetchCategories();
      } catch (err) {
        console.error('[MachineForm] Erro ao criar categoria:', err);
      }
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        patrimonio: initialData.patrimonio || '',
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        categoria: initialData.categoria || '',
        horimetro_inicial: initialData.horimetro_atual?.toString() || '0',
        quilometragem_inicial: initialData.quilometragem_atual?.toString() || '0',
        placa: initialData.placa || '',
        ano: initialData.ano?.toString() || new Date().getFullYear().toString(),
        status: initialData.status || 'active',
        chassi: initialData.chassi || '',
        combustivel: initialData.combustivel || 'Diesel',
        capacidade_tanque: initialData.capacidade_tanque?.toString() || '',
        valor_compra: initialData.valor_compra?.toString() || '',
        potencia: initialData.potencia?.toString() || '',
        peso_operacional: initialData.peso_operacional?.toString() || '',
        intervalo_revisao: initialData.intervalo_revisao?.toString() || '250',
        consumo_estimado: initialData.consumo_estimado?.toString() || '',
        data_proxima_revisao: initialData.data_proxima_revisao || '',
        observacoes: initialData.observacoes || '',
        unidade_medida: initialData.unidade_medida || 'horas',
        unidade_id: initialData.unidade_id || ''
      });
    } else if (!isOpen) {
      setFormData({
        nome: '',
        patrimonio: '',
        marca: '',
        modelo: '',
        categoria: '',
        horimetro_inicial: '0',
        quilometragem_inicial: '0',
        placa: '',
        ano: new Date().getFullYear().toString(),
        status: 'active',
        chassi: '',
        combustivel: 'Diesel',
        capacidade_tanque: '',
        valor_compra: '',
        potencia: '',
        peso_operacional: '',
        intervalo_revisao: '250',
        consumo_estimado: '',
        data_proxima_revisao: '',
        observacoes: '',
        unidade_medida: 'horas',
        unidade_id: ''
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

  return (
    <SidePanel 
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Máquina" : "Nova Máquina / Veículo"}
      subtitle="Cadastre um novo ativo na sua frota."
      icon={Truck}
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
                  if (currentStep === 1 && (!formData.nome.trim() || !formData.marca.trim() || !formData.modelo.trim())) return;
                  setTimeout(() => {
                    setCurrentStep(prev => Math.min(prev + 1, 3));
                  }, 0);
                }}
                disabled={currentStep === 1 && (!formData.nome.trim() || !formData.marca.trim() || !formData.modelo.trim())}
                style={{ opacity: (currentStep === 1 && (!formData.nome.trim() || !formData.marca.trim() || !formData.modelo.trim())) ? 0.5 : 1 }}
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
                {loading ? 'Processando...' : initialData ? "Salvar Alterações" : "Salvar Ativo"}
              </button>
            )}
          </div>
        </div>
      }
    >
      {/* Wizard Step Progress Indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', padding: '0 4px' }}>
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
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 01</div>
              <h4 className="tauze-section-title">Identificação Básica e Medição</h4>
            </div>
            <div className="tauze-input-grid grid-col-3" style={{ alignItems: 'flex-end' }}>
              <div className="tauze-field-group">
                <label className="tauze-label"><Truck size={14} /> Nome do Ativo</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ex: Trator 01..." 
                  value={formData.nome}
                  onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  required 
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label"><FileText size={14} /> Patrimônio / Frota</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ex: TR-01" 
                  value={formData.patrimonio}
                  onChange={(e) => setFormData({...formData, patrimonio: e.target.value})}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label"><Gauge size={14} /> Unidade de Medida Padrão</label>
                <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(2, 1fr)', height: '48px' }}>
                  {['horas', 'km'].map(t => (
                    <div key={t} className={`tauze-form-radio-item ${formData.unidade_medida === t ? 'active' : ''}`}
                      onClick={() => setFormData({...formData, unidade_medida: t})}
                      style={{ height: '100%', padding: '0', boxSizing: 'border-box' }}>
                      <span style={{textTransform: 'uppercase'}}>{t === 'horas' ? 'Horímetro' : 'Hodômetro'}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px', alignItems: 'flex-end' }}>
              <div className="tauze-field-group">
                <label className="tauze-label"><Tag size={14} /> Marca</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ex: John Deere..." 
                  value={formData.marca}
                  onChange={(e) => setFormData({...formData, marca: e.target.value})}
                  required
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Layers size={14} /> Modelo</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ex: 6125J, SRX..." 
                  value={formData.modelo}
                  onChange={(e) => setFormData({...formData, modelo: e.target.value})}
                  required
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Calendar size={14} /> Ano</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="2024" 
                  value={formData.ano}
                  onChange={(e) => setFormData({...formData, ano: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 02</div>
              <h4 className="tauze-section-title">Especificações e Centro de Custo</h4>
            </div>
            <div className="tauze-input-grid grid-col-3">
              <div className="tauze-field-group">
                <label className="tauze-label"><Settings size={14} /> Categoria</label>
                <SearchableSelect 
                  value={formData.categoria}
                  onChange={handleCategoriaChange}
                  options={[
                    { value: '', label: 'Selecionar...' },
                    ...(categories || []).map(cat => ({ value: String(cat.nome), label: String(cat.nome) })),
                  ]}
                  creatable={true}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Potência (cv)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="Ex: 125" 
                  value={formData.potencia}
                  onChange={(e) => setFormData({...formData, potencia: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><MapPin size={14} /> Centro de Custo (Fazenda)</label>
                <SearchableSelect 
                  value={formData.unidade_id}
                  onChange={(val: any) => setFormData({...formData, unidade_id: val})}
                  options={[
                    { value: '', label: 'Selecionar...' },
                    ...(farms || []).map(f => ({ value: String(f.id), label: String(f.nome) })),
                  ]}
                />
              </div>
            </div>
          </section>

          {/* HEADER DE STATUS (Business Rule) */}
          <section style={{ padding: 0 }}>
            <h4 className="tauze-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> Status Atual da Máquina
            </h4>
            <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginTop: 0 }}>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'active' ? 'active-operacional' : ''}`}
                onClick={() => setFormData({...formData, status: 'active'})}
              >
                Operacional
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'maintenance' ? 'active-manutencao' : ''}`}
                onClick={() => setFormData({...formData, status: 'maintenance'})}
              >
                Em Manutenção
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'stopped' ? 'active-parado' : ''}`}
                onClick={() => setFormData({...formData, status: 'stopped'})}
              >
                Parado (Crítico)
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'inactive' ? 'active-inativa' : ''}`}
                onClick={() => setFormData({...formData, status: 'inactive'})}
              >
                Baixado (Inativo)
              </div>
            </div>
          </section>
        </div>
      )}

      {currentStep === 2 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="tauze-form-section" style={{ margin: 0 }}>
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 01</div>
              <h4 className="tauze-section-title">Ficha Técnica e Medições</h4>
            </div>
            <div className="tauze-input-grid grid-col-3">
              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Cap. Tanque (L)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="0" 
                  value={formData.capacidade_tanque}
                  onChange={(e) => setFormData({...formData, capacidade_tanque: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Settings size={14} /> Combustível</label>
                <SearchableSelect 
                  value={formData.combustivel}
                  onChange={(val: any) => setFormData({...formData, combustivel: val})}
                  options={[
                    { value: 'Diesel', label: 'Diesel' },
                    { value: 'Diesel S10', label: 'Diesel S10' },
                    { value: 'Gasolina', label: 'Gasolina' },
                    { value: 'Etanol', label: 'Etanol' },
                    { value: 'Arla 32', label: 'Arla 32' },
                  ]}
                />
              </div>

              {formData.unidade_medida === 'horas' ? (
                <div className="tauze-field-group">
                  <label className="tauze-label"><Clock size={14} /> Horímetro Inicial (h)</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    placeholder="0" 
                    value={formData.horimetro_inicial}
                    onChange={(e) => setFormData({...formData, horimetro_inicial: e.target.value})}
                  />
                </div>
              ) : (
                <div className="tauze-field-group">
                  <label className="tauze-label"><Gauge size={14} /> KM Inicial</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    placeholder="0" 
                    value={formData.quilometragem_inicial}
                    onChange={(e) => setFormData({...formData, quilometragem_inicial: e.target.value})}
                  />
                </div>
              )}

              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Peso Op. (kg)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder="Ex: 5800" 
                  value={formData.peso_operacional}
                  onChange={(e) => setFormData({...formData, peso_operacional: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Meta Consumo ({formData.unidade_medida === 'horas' ? 'L/h' : 'km/L'})</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  step="0.1"
                  placeholder={formData.unidade_medida === 'horas' ? "Ex: 14.5" : "Ex: 8.5"} 
                  value={formData.consumo_estimado}
                  onChange={(e) => setFormData({...formData, consumo_estimado: e.target.value})}
                />
              </div>
            </div>
          </section>
        </div>
      )}

      {currentStep === 3 && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="tauze-form-section" style={{ margin: 0 }}>
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 01</div>
              <h4 className="tauze-section-title">Documentação Técnica</h4>
            </div>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label"><Hash size={14} /> Placa / Registro</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="ABC-1234" 
                  value={formData.placa}
                  onChange={(e) => setFormData({...formData, placa: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Hash size={14} /> Chassi / Série</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Número de série..." 
                  value={formData.chassi}
                  onChange={(e) => setFormData({...formData, chassi: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 02</div>
              <h4 className="tauze-section-title">Indicadores Financeiros e Manutenção</h4>
            </div>
            <div className="tauze-input-grid grid-col-3">
              <div className="tauze-field-group">
                <label className="tauze-label"><DollarSign size={14} /> Valor Compra (R$)</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  step="0.01"
                  placeholder="0.00" 
                  value={formData.valor_compra}
                  onChange={(e) => setFormData({...formData, valor_compra: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Settings size={14} /> Int. Revisão ({formData.unidade_medida === 'horas' ? 'h' : 'km'})</label>
                <input 
                  className="tauze-input"
                  type="number" 
                  placeholder={formData.unidade_medida === 'horas' ? "Ex: 250" : "Ex: 10000"} 
                  value={formData.intervalo_revisao}
                  onChange={(e) => setFormData({...formData, intervalo_revisao: e.target.value})}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Calendar size={14} /> Data Próx. Revisão</label>
                <input 
                  className="tauze-input"
                  type="date" 
                  value={formData.data_proxima_revisao}
                  onChange={(e) => setFormData({...formData, data_proxima_revisao: e.target.value})}
                />
              </div>
            </div>
          </section>

          <section className="tauze-form-section" style={{ margin: 0 }}>
            <div className="tauze-section-header">
              <div className="tauze-section-badge">PASSO 03</div>
              <h4 className="tauze-section-title">Informações Adicionais</h4>
            </div>
            <div className="tauze-input-grid grid-col-1">
              <div className="tauze-field-group">
                <label className="tauze-label"><FileText size={14} /> Observações Gerais</label>
                <textarea className="tauze-input tauze-textarea"
                  placeholder="Histórico de avarias, notas sobre garantia ou especificações extras..." 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </section>
        </div>
      )}
    </SidePanel>
  );
};
