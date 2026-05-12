import React, { useState, useEffect } from 'react';
import { 
  Building, 
  Users,
  Clock,
  Beef,
  Scale,
  DollarSign,
  Calendar,
  Layers,
  FileText
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface ConfinementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
}

export const ConfinementForm: React.FC<ConfinementFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();
  const [lots, setLots] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome_curral: '',
    capacidade_animais: '100',
    dof_alvo: '90',
    data_inicio: new Date().toISOString().split('T')[0],
    peso_entrada: '420',
    lote_id: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchLots();
    }
  }, [isOpen, activeFarm]);

  const fetchLots = async () => {
    const { data } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm.id)
      .eq('tenant_id', activeFarm.tenantId)
      .eq('status', 'ATIVO');
    
    if (data) setLots(data);
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
      title="Novo Curral de Confinamento"
      subtitle="Inicie um novo ciclo de terminação intensiva."
      icon={Building}
      loading={loading}
      submitLabel="Iniciar Ciclo"
    >
      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><Building size={14} /> Nome do Curral / Piquete</label>
        <input 
          className="elite-input"
          type="text" 
          placeholder="Ex: CURRAL-01, Terminação A..." 
          value={formData.nome_curral}
          onChange={(e) => setFormData({...formData, nome_curral: e.target.value})}
          required 
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Users size={14} /> Capacidade (Animais)</label>
        <input 
          className="elite-input"
          type="number" 
          placeholder="100" 
          value={formData.capacidade_animais}
          onChange={(e) => setFormData({...formData, capacidade_animais: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Scale size={14} /> Peso Médio Entrada (kg)</label>
        <input 
          className="elite-input"
          type="number" 
          placeholder="420.0" 
          value={formData.peso_entrada}
          onChange={(e) => setFormData({...formData, peso_entrada: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Clock size={14} /> DOF Alvo (Dias)</label>
        <input 
          className="elite-input"
          type="number" 
          placeholder="90" 
          value={formData.dof_alvo}
          onChange={(e) => setFormData({...formData, dof_alvo: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Calendar size={14} /> Data de Início</label>
        <input 
          className="elite-input"
          type="date" 
          value={formData.data_inicio}
          onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
          required
        />
      </div>

      <div className="elite-field-group">
        <label className="elite-label"><Layers size={14} /> Lote Vinculado</label>
        <select 
          className="elite-input elite-select"
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
        >
          <option value="">Selecionar Lote...</option>
          {lots.map(lot => (
            <option key={lot.id} value={lot.id}>{lot.nome}</option>
          ))}
        </select>
      </div>

      <div className="elite-field-group" style={{ gridColumn: 'span 2' }}>
        <label className="elite-label"><FileText size={14} /> Observações do Check-in</label>
        <textarea 
          className="elite-input elite-textarea"
          placeholder="Notas sobre o estado dos animais na entrada..." 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
