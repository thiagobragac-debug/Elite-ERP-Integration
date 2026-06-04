import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Maximize,
  Tag,
  Trees,
  Activity,
  Calendar,
  Sprout,
  Shield,
  Sun,
  Flame,
  AlertTriangle,
  Lightbulb
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';

interface PastureFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PastureForm: React.FC<PastureFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    area: '',
    capacidade_ua: '2.5',
    tipo_capim: 'Brachiaria',
    status: 'grazing',
    data_ultima_fertilizacao: '',
    topografia: 'Plano',
    tipo_solo: 'Argiloso',
    agua: 'Natural (Rios/Nascentes)',
    observacoes: '',
    fazenda_id: '',
    estado_cerca: 'Bom',
    sombreamento: 'Natural',
    plantas_daninhas: 'Baixa'
  });

  const [farms, setFarms] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchFarms();
    }
  }, [isOpen]);

  const fetchFarms = async () => {
    try {
      const { data } = await supabase
        .from('fazendas')
        .select('id, nome');
      if (data) setFarms(data);
    } catch (err) {
      console.error('Error fetching farms:', err);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        area: initialData.area ? initialData.area.toString().replace(/[^\d.-]/g, '') : '',
        capacidade_ua: initialData.capacidade_ua?.toString() || '2.5',
        tipo_capim: initialData.tipo_capim || 'Brachiaria',
        status: initialData.status || 'grazing',
        data_ultima_fertilizacao: initialData.data_ultima_fertilizacao || '',
        topografia: initialData.topografia || 'Plano',
        tipo_solo: initialData.tipo_solo || 'Argiloso',
        agua: initialData.agua || 'Natural (Rios/Nascentes)',
        observacoes: initialData.observacoes || '',
        fazenda_id: initialData.fazenda_id || '',
        estado_cerca: initialData.estado_cerca || 'Bom',
        sombreamento: initialData.sombreamento || 'Natural',
        plantas_daninhas: initialData.plantas_daninhas || 'Baixa'
      });
    } else {
      setFormData({
        nome: '',
        area: '',
        capacidade_ua: '2.5',
        tipo_capim: 'Brachiaria',
        status: 'grazing',
        data_ultima_fertilizacao: '',
        topografia: 'Plano',
        tipo_solo: 'Argiloso',
        agua: 'Natural (Rios/Nascentes)',
        observacoes: '',
        fazenda_id: '',
        estado_cerca: 'Bom',
        sombreamento: 'Natural',
        plantas_daninhas: 'Baixa'
      });
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);

  const totalCapacity = React.useMemo(() => {
    const a = parseFloat(formData.area);
    const cap = parseFloat(formData.capacidade_ua);
    if (!isNaN(a) && !isNaN(cap) && a > 0) return (a * cap).toFixed(1);
    return null;
  }, [formData.area, formData.capacidade_ua]);

  const daysSinceFertilization = React.useMemo(() => {
    if (!formData.data_ultima_fertilizacao) return null;
    const diff = Date.now() - new Date(formData.data_ultima_fertilizacao).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }, [formData.data_ultima_fertilizacao]);

  const needsAttention = formData.plantas_daninhas === 'Alta Infestação' || formData.estado_cerca === 'Ruim' || formData.estado_cerca === 'Necessita Reparo';

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
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pasto" : "Novo Pasto"}
      subtitle="Cadastre e gerencie as áreas de pastagem."
      icon={Map}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pasto"}
      size="large"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados Principais</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Map size={14} /> Selecionar Fazenda / Unidade</label>
            <SearchableSelect 
              value={formData.fazenda_id}
              onChange={(val: any) => setFormData({...formData, fazenda_id: val})}
              options={[
                { value: '', label: 'Selecione uma fazenda...' },
                ...farms.map(f => ({ value: String(f.id), label: f.nome }))
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Map size={14} /> Nome do Pasto</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: P-01 (Maternidade), Piquete 05..." 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Maximize size={14} /> Área (ha)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.area}
              onChange={(e) => setFormData({...formData, area: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Activity size={14} /> Capacidade (UA/ha)</span>
              {totalCapacity && (
                <span className="carencia-badge" style={{ padding: '2px 8px', fontSize: '10px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', borderRadius: '4px' }}>
                  Total: {totalCapacity} UA
                </span>
              )}
            </label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.1"
              placeholder="2.5" 
              value={formData.capacidade_ua}
              onChange={(e) => setFormData({...formData, capacidade_ua: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Condições da Pastagem</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">

          <div className="tauze-field-group">
            <label className="tauze-label"><Trees size={14} /> Tipo de Capim</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Brachiaria, Mombaça..." 
              value={formData.tipo_capim}
              onChange={(e) => setFormData({...formData, tipo_capim: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data da Última Fertilização</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_ultima_fertilizacao}
              onChange={(e) => setFormData({...formData, data_ultima_fertilizacao: e.target.value})}
            />
            {daysSinceFertilization !== null && daysSinceFertilization < 30 && daysSinceFertilization >= 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#fef2f2', color: '#ef4444', border: '1px solid #fee2e2', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                <AlertTriangle size={14} /> Atenção: Área em provável período de carência química ({daysSinceFertilization} dias).
              </div>
            )}
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Tag size={14} /> Status da Área</label>
            <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'grazing' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'grazing'})}
              >
                <Trees size={16} />
                <span>Pastejo</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'resting' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'resting'})}
              >
                <Calendar size={16} />
                <span>Descanso</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'degraded' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'degraded'})}
              >
                <Activity size={16} />
                <span>Degradado</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'renovation' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'renovation'})}
              >
                <Sprout size={16} />
                <span>Reforma</span>
              </div>
            </div>
            {needsAttention && formData.status === 'grazing' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px', background: '#fffbeb', color: '#d97706', border: '1px solid #fef3c7', borderRadius: '8px', fontSize: '11px', fontWeight: 600, marginTop: '8px' }}>
                <AlertTriangle size={14} /> Sugestão: Devido às condições sanitárias ou de estrutura, considere alterar para "Descanso" ou "Reforma".
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Características da Área</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-3">

          <div className="tauze-field-group">
            <label className="tauze-label"><Map size={14} /> Topografia</label>
            <SearchableSelect 
              value={formData.topografia}
              onChange={(val: any) => setFormData({...formData, topografia: val})}
              options={[
                { value: 'Plano', label: 'Plano' },
                { value: 'Levemente Ondulado', label: 'Levemente Ondulado' },
                { value: 'Ondulado', label: 'Ondulado' },
                { value: 'Montanhoso', label: 'Montanhoso' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Trees size={14} /> Tipo de Solo</label>
            <SearchableSelect 
              value={formData.tipo_solo}
              onChange={(val: any) => setFormData({...formData, tipo_solo: val})}
              options={[
                { value: 'Argiloso', label: 'Argiloso' },
                { value: 'Arenoso', label: 'Arenoso' },
                { value: 'Misto', label: 'Misto' },
                { value: 'Latossolo', label: 'Latossolo' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Recurso Hídrico</label>
            <SearchableSelect 
              value={formData.agua}
              onChange={(val: any) => setFormData({...formData, agua: val})}
              options={[
                { value: 'Natural (Rios/Nascentes)', label: 'Natural (Rios/Nascentes)' },
                { value: 'Bebedouro Australiano', label: 'Bebedouro Australiano' },
                { value: 'Represa', label: 'Represa' },
                { value: 'Poço Artesiano', label: 'Poço Artesiano' }
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Infraestrutura & Saúde</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">

          <div className="tauze-field-group">
            <label className="tauze-label"><Shield size={14} /> Estado da Cerca</label>
            <SearchableSelect 
              value={formData.estado_cerca}
              onChange={(val: any) => setFormData({...formData, estado_cerca: val})}
              options={[
                { value: 'Bom', label: 'Bom' },
                { value: 'Regular', label: 'Regular' },
                { value: 'Ruim', label: 'Ruim' },
                { value: 'Necessita Reparo', label: 'Necessita Reparo' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Sun size={14} /> Sombreamento</label>
            <SearchableSelect 
              value={formData.sombreamento}
              onChange={(val: any) => setFormData({...formData, sombreamento: val})}
              options={[
                { value: 'Natural (Árvores)', label: 'Natural (Árvores)' },
                { value: 'Artificial (Coberturas)', label: 'Artificial (Coberturas)' },
                { value: 'Misto', label: 'Misto' },
                { value: 'Inexistente', label: 'Inexistente' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Flame size={14} /> Plantas Daninhas / Invasoras</label>
            <SearchableSelect 
              value={formData.plantas_daninhas}
              onChange={(val: any) => setFormData({...formData, plantas_daninhas: val})}
              options={[
                { value: 'Baixa Infestação', label: 'Baixa Infestação' },
                { value: 'Média Infestação', label: 'Média Infestação' },
                { value: 'Alta Infestação', label: 'Alta Infestação' },
                { value: 'Livre', label: 'Livre' }
              ]}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Tag size={14} /> Observações Técnicas</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Notas sobre degradação, pragas, ou histórico da área..." 
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* Smart Card Resumo Forrageiro */}
      {formData.area && formData.capacidade_ua && (
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(var(--brand)/0.08) 0%, hsl(var(--brand)/0.02) 100%)', border: '1px solid hsl(var(--brand)/0.15)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '10px', color: 'hsl(var(--brand))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Lightbulb size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Resumo Agronômico da Área
            </h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'hsl(var(--text-main))' }}>
              O pasto <strong style={{ color: 'hsl(var(--text-main))' }}>{formData.nome || '___'}</strong> possui <strong style={{ color: 'hsl(var(--text-main))' }}>{formData.area} hectares</strong>. 
              Com uma lotação estipulada de {formData.capacidade_ua} UA/ha, a área pode suportar fisicamente até <strong style={{ color: '#10b981' }}>{totalCapacity} Unidades Animais</strong> no total.
              O status atual de manejo está definido como <strong style={{ textTransform: 'uppercase' }}>{formData.status === 'grazing' ? 'Em Pastejo' : formData.status === 'resting' ? 'Em Descanso' : formData.status === 'degraded' ? 'Degradado' : 'Em Reforma'}</strong>.
            </p>
          </div>
        </div>
      )}
    </SidePanel>
  );
};
