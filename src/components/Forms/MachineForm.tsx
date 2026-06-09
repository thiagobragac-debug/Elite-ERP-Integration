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
  Clock
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

  const [docOpen, setDocOpen] = useState(false);
  const [finOpen, setFinOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (isOpen && activeTenantId) {
      fetchCategories();
    }
  }, [isOpen, activeTenantId]);

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
    if (initialData) { setFormData({
        nome: initialData.nome || '',
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
    } else {
      setFormData({
        nome: '',
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
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Máquina" : "Nova Máquina / Veículo"}
      subtitle="Cadastre um novo ativo na sua frota."
      icon={Truck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Ativo"}
    >
      {/* HEADER DE STATUS (Business Rule) */}
      <section style={{ padding: '0 24px 24px', borderBottom: '1px solid hsl(var(--border))', marginBottom: '24px' }}>
        <h4 className="tauze-label" style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Activity size={14} /> Status Atual da Máquina
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          <div 
            style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${formData.status === 'active' ? '#10b981' : 'transparent'}`, background: formData.status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'hsl(var(--bg-main))', cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: formData.status === 'active' ? '#10b981' : 'hsl(var(--text-muted))', transition: '0.2s' }}
            onClick={() => setFormData({...formData, status: 'active'})}
          >
            Operacional
          </div>
          <div 
            style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${formData.status === 'maintenance' ? '#f59e0b' : 'transparent'}`, background: formData.status === 'maintenance' ? 'rgba(245, 158, 11, 0.1)' : 'hsl(var(--bg-main))', cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: formData.status === 'maintenance' ? '#f59e0b' : 'hsl(var(--text-muted))', transition: '0.2s' }}
            onClick={() => setFormData({...formData, status: 'maintenance'})}
          >
            Em Manutenção
          </div>
          <div 
            style={{ padding: '12px', borderRadius: '8px', border: `2px solid ${formData.status === 'stopped' ? '#ef4444' : 'transparent'}`, background: formData.status === 'stopped' ? 'rgba(239, 68, 68, 0.1)' : 'hsl(var(--bg-main))', cursor: 'pointer', textAlign: 'center', fontWeight: 700, color: formData.status === 'stopped' ? '#ef4444' : 'hsl(var(--text-muted))', transition: '0.2s' }}
            onClick={() => setFormData({...formData, status: 'stopped'})}
          >
            Parado (Crítico)
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação Básica e Medição</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
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
            <label className="tauze-label"><Gauge size={14} /> Unidade de Medida Padrão</label>
            <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              {['horas', 'km'].map(t => (
                <div key={t} className={`tauze-form-radio-item ${formData.unidade_medida === t ? 'active' : ''}`}
                  onClick={() => setFormData({...formData, unidade_medida: t})}>
                  <span style={{textTransform: 'uppercase'}}>{t === 'horas' ? 'Horímetro (h)' : 'Hodômetro (KM)'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>

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
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Especificações Técnicas</h4>
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
            <label className="tauze-label"><Calendar size={14} /> Ano</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="2024" 
              value={formData.ano}
              onChange={(e) => setFormData({...formData, ano: e.target.value})}
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

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <div 
          className="tauze-section-header" 
          style={{ padding: '24px', cursor: 'pointer', borderBottom: docOpen ? '1px solid hsl(var(--border))' : 'none', margin: 0, background: docOpen ? 'hsl(var(--bg-main)/0.2)' : 'transparent' }}
          onClick={() => setDocOpen(!docOpen)}
        >
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title" style={{ flex: 1 }}>Documentação Técnica</h4>
          <div style={{ color: 'hsl(var(--text-muted))' }}>
            {docOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {docOpen && (
          <div style={{ padding: '24px' }}>
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
          </div>
        )}
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Medições Iniciais e Controle</h4>
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
        </div>
      </section>

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <div 
          className="tauze-section-header" 
          style={{ padding: '24px', cursor: 'pointer', borderBottom: finOpen ? '1px solid hsl(var(--border))' : 'none', margin: 0, background: finOpen ? 'hsl(var(--bg-main)/0.2)' : 'transparent' }}
          onClick={() => setFinOpen(!finOpen)}
        >
          <div className="tauze-section-badge">PASSO 05</div>
          <h4 className="tauze-section-title" style={{ flex: 1 }}>Indicadores Operacionais e Financeiros</h4>
          <div style={{ color: 'hsl(var(--text-muted))' }}>
            {finOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {finOpen && (
          <div style={{ padding: '24px' }}>
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
          </div>
        )}
      </section>

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <div 
          className="tauze-section-header" 
          style={{ padding: '24px', cursor: 'pointer', borderBottom: obsOpen ? '1px solid hsl(var(--border))' : 'none', margin: 0, background: obsOpen ? 'hsl(var(--bg-main)/0.2)' : 'transparent' }}
          onClick={() => setObsOpen(!obsOpen)}
        >
          <div className="tauze-section-badge">PASSO 06</div>
          <h4 className="tauze-section-title" style={{ flex: 1 }}>Informações Adicionais</h4>
          <div style={{ color: 'hsl(var(--text-muted))' }}>
            {obsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        
        {obsOpen && (
          <div style={{ padding: '24px' }}>
            <div className="tauze-input-grid grid-col-1">
              <div className="tauze-field-group">
                <label className="tauze-label"><Tag size={14} /> Observações Gerais</label>
                <textarea className="tauze-input tauze-textarea"
                  placeholder="Histórico de avarias, notas sobre garantia ou especificações extras..." 
                  value={formData.observacoes}
                  onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </SidePanel>
  );
};
