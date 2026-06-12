import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Trees, 
  Map, 
  Calendar,
  Activity,
  Droplets,
  Zap,
  Target
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../utils/audit';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';


interface PastureManejoFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialPastureId?: string;
  actionId?: number;
}

export const PastureManejoForm: React.FC<PastureManejoFormProps> = ({isOpen, onClose, onSubmit, initialPastureId, actionId }) => {
  const { activeFarm, activeTenantId } = useTenant();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [pastures, setPastures] = useState<any[]>([]);
  
  const [formData, setFormData] = usePersistentState('PastureManejoForm_formData', {
    pasto_id: initialPastureId || '',
    tipo_manejo: 'Adubação',
    data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    novo_status: 'resting',
    observacoes: ''
  });

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchPastures();
    }
  }, [isOpen, activeFarm]);

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        pasto_id: initialPastureId || '',
        tipo_manejo: 'Adubação',
        data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        novo_status: 'resting',
        observacoes: ''
      }));
    }
  }, [initialPastureId, isOpen]);

  const fetchPastures = async () => {
    const { data } = await supabase
      .from('pastos')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id);
    if (data) setPastures(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('pastos')
        .update({ 
          status: formData.novo_status,
          data_ultima_fertilizacao: formData.tipo_manejo === 'Adubação' ? formData.data_manejo : undefined
        })
        .eq('id', formData.pasto_id);

      if (!error) {
        if (activeTenantId) {
          const selectedPastureName = pastures.find(p => p.id === formData.pasto_id)?.nome || 'Pastagem';
          await logAudit({
            tenant_id: activeTenantId,
            user_id: user?.id,
            action: 'MANEJO',
            entity: 'pastos',
            entity_id: formData.pasto_id,
            description: `Manejo de Pastagem: ${formData.tipo_manejo} realizado em ${new Date(formData.data_manejo).toLocaleDateString('pt-BR')} no pasto "${selectedPastureName}". Status da área: ${formData.novo_status === 'resting' ? 'Descanso' : formData.novo_status === 'grazing' ? 'Pastejo' : 'Degradado'}. Obs: ${formData.observacoes || 'Nenhuma'}`,
            new_data: { 
              status: formData.novo_status,
              tipo_manejo: formData.tipo_manejo,
              data_manejo: formData.data_manejo,
              observacoes: formData.observacoes
            }
          });
        }
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
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Lançar Manejo de Pastagem"
      subtitle="Registre intervenções técnicas e controle o ciclo de descanso das áreas."
      icon={Target}
      loading={loading}
      submitLabel="Confirmar Manejo"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Intervenção</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Map size={14} /> Selecionar Pasto / Piquete</label>
            <SearchableSelect 
              value={formData.pasto_id}
              onChange={(val: any) => setFormData({...formData, pasto_id: val})}
              options={[
                { value: ``, label: `Selecione a área alvo...` },
                ...(pastures || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Zap size={14} /> Tipo de Manejo</label>
            <SearchableSelect 
              value={formData.tipo_manejo}
              onChange={(val: any) => setFormData({...formData, tipo_manejo: val})}
              options={[
                { value: `Adubação`, label: `Adubação` },
                { value: `Calagem`, label: `Calagem` },
                { value: `Roçada`, label: `Roçada` },
                { value: `Herbicida`, label: `Herbicida` },
                { value: `Troca de Lotação`, label: `Troca de Lotação` },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data da Intervenção</label>
            <DateInput 
              type="date" 
              className="tauze-input"
              value={formData.data_manejo}
              onChange={(e) => setFormData({...formData, data_manejo: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Activity size={14} /> Novo Status da Área</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.novo_status === 'grazing' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, novo_status: 'grazing'})}
              >
                <Trees size={16} />
                <span>Pastejo</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.novo_status === 'resting' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, novo_status: 'resting'})}
              >
                <Calendar size={16} />
                <span>Descanso</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.novo_status === 'degraded' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, novo_status: 'degraded'})}
              >
                <Droplets size={16} />
                <span>Degradado</span>
              </div>
            </div>
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Activity size={14} /> Observações de Manejo</label>
            <textarea className="tauze-input tauze-textarea"
              placeholder="Ex: Utilizado 200kg/ha de ureia, praga identificada: cigarrinha..." 
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              style={{ minHeight: '80px', padding: '12px' }}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
