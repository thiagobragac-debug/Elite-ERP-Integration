import React, { useState, useEffect } from 'react';
import { 
  Trees, 
  Map, 
  Calendar,
  Activity,
  Droplets,
  Zap,
  Target
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface PastureManejoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const PastureManejoForm: React.FC<PastureManejoFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(false);
  const [pastures, setPastures] = useState<any[]>([]);
  
  const [formData, setFormData] = useState({
    pasto_id: '',
    tipo_manejo: 'Adubação',
    data_manejo: new Date().toISOString().split('T')[0],
    novo_status: 'resting',
    observacoes: ''
  });

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchPastures();
    }
  }, [isOpen, activeFarm]);

  const fetchPastures = async () => {
    const { data } = await supabase
      .from('pastagens')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id);
    if (data) setPastures(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Registrar no histórico (simulado ou em tabela de eventos se existir)
      // E atualizar o status do pasto na tabela pastagens
      const { error } = await supabase
        .from('pastagens')
        .update({ 
          status: formData.novo_status,
          data_ultima_fertilizacao: formData.tipo_manejo === 'Adubação' ? formData.data_manejo : undefined
        })
        .eq('id', formData.pasto_id);

      if (!error) {
        onSubmit(formData);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Lançar Manejo de Pastagem"
      subtitle="Registre intervenções técnicas e controle o ciclo de descanso das áreas."
      icon={Target}
      loading={loading}
      submitLabel="Confirmar Manejo"
    >
      <div className="form-group full-width">
        <label><Map size={14} /> Selecionar Pasto / Piquete</label>
        <select 
          value={formData.pasto_id}
          onChange={(e) => setFormData({...formData, pasto_id: e.target.value})}
          required
        >
          <option value="">Selecione a área alvo...</option>
          {pastures.map(p => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Zap size={14} /> Tipo de Manejo</label>
        <select 
          value={formData.tipo_manejo}
          onChange={(e) => setFormData({...formData, tipo_manejo: e.target.value})}
          required
        >
          <option>Adubação</option>
          <option>Calagem</option>
          <option>Roçada</option>
          <option>Herbicida</option>
          <option>Troca de Lotação</option>
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data da Intervenção</label>
        <input 
          type="date" 
          value={formData.data_manejo}
          onChange={(e) => setFormData({...formData, data_manejo: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Novo Status da Área</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.novo_status === 'grazing' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, novo_status: 'grazing'})}
          >
            <Trees size={16} />
            <span>Pastejo</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.novo_status === 'resting' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, novo_status: 'resting'})}
          >
            <Calendar size={16} />
            <span>Descanso</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.novo_status === 'degraded' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, novo_status: 'degraded'})}
          >
            <Droplets size={16} />
            <span>Degradado</span>
          </div>
        </div>
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Observações de Manejo</label>
        <textarea 
          placeholder="Ex: Utilizado 200kg/ha de ureia, praga identificada: cigarrinha..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>
    </FormModal>
  );
};
