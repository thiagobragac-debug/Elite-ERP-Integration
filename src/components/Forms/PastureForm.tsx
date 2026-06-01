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
  Flame
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
        area: initialData.area?.toString() || '',
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
      <div className="form-group">
        <label><Map size={14} /> Selecionar Fazenda / Unidade</label>
        <SearchableSelect 
          value={formData.fazenda_id}
          onChange={(val: any) => setFormData({...formData, fazenda_id: val})}
          options={[
            { value: '', label: 'Selecione uma fazenda...' },
            ...farms.map(f => ({ value: String(f.id), label: f.nome }))
          ]}
        />
      </div>

      <div className="form-group">
        <label><Map size={14} /> Nome do Pasto</label>
        <input 
          type="text" 
          placeholder="Ex: P-01 (Maternidade), Piquete 05..." 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Maximize size={14} /> Área (ha)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.area}
          onChange={(e) => setFormData({...formData, area: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Capacidade (UA/ha)</label>
        <input 
          type="number" 
          step="0.1"
          placeholder="2.5" 
          value={formData.capacidade_ua}
          onChange={(e) => setFormData({...formData, capacidade_ua: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Trees size={14} /> Tipo de Capim</label>
        <input 
          type="text" 
          placeholder="Ex: Brachiaria, Mombaça..." 
          value={formData.tipo_capim}
          onChange={(e) => setFormData({...formData, tipo_capim: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data da Última Fertilização</label>
        <input 
          type="date" 
          value={formData.data_ultima_fertilizacao}
          onChange={(e) => setFormData({...formData, data_ultima_fertilizacao: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Tag size={14} /> Status da Área</label>
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
      </div>

      <div className="form-group">
        <label><Map size={14} /> Topografia</label>
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

      <div className="form-group">
        <label><Trees size={14} /> Tipo de Solo</label>
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

      <div className="form-group">
        <label><Activity size={14} /> Recurso Hídrico</label>
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

      <div className="form-group">
        <label><Shield size={14} /> Estado da Cerca</label>
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

      <div className="form-group">
        <label><Sun size={14} /> Sombreamento</label>
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

      <div className="form-group">
        <label><Flame size={14} /> Plantas Daninhas / Invasoras</label>
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

      <div className="form-group full-width">
        <label><Tag size={14} /> Observações Técnicas</label>
        <textarea 
          placeholder="Notas sobre degradação, pragas, ou histórico da área..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>
    </SidePanel>
  );
};
