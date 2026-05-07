import React, { useState, useEffect } from 'react';
import { 
  Wrench, 
  Settings,
  Calendar,
  Users,
  DollarSign,
  Truck,
  Plus,
  Activity,
  FileText
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    maquina_id: '',
    tipo: 'preventive',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    custo: '0',
    responsavel: '',
    status: 'open'
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        maquina_id: initialData.maquina_id || '',
        tipo: initialData.tipo || 'preventive',
        descricao: initialData.descricao || '',
        data_inicio: initialData.data_inicio || new Date().toISOString().split('T')[0],
        custo: initialData.custo?.toString() || '0',
        responsavel: initialData.responsavel || '',
        status: initialData.status || 'open'
      });
    } else {
      setFormData({
        maquina_id: '',
        tipo: 'preventive',
        descricao: '',
        data_inicio: new Date().toISOString().split('T')[0],
        custo: '0',
        responsavel: '',
        status: 'open'
      });
    }
  }, [initialData, isOpen]);

  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchMachines();
    }
  }, [isOpen, activeFarm]);

  const fetchMachines = async () => {
    const { data } = await supabase
      .from('maquinas')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id);
    if (data) setMachines(data);
  };

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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
      subtitle={initialData ? "Atualize os dados da manutenção realizada." : "Registre uma manutenção em um ativo da frota."}
      icon={Wrench}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Abrir Ordem"}
    >
      <div className="form-group full-width">
        <label><Truck size={14} /> Selecionar Máquina</label>
        <select 
          value={formData.maquina_id}
          onChange={(e) => setFormData({...formData, maquina_id: e.target.value})}
          required
        >
          <option value="">Selecione um ativo...</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Settings size={14} /> Tipo de Manutenção</label>
        <select 
          value={formData.tipo}
          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
          required
        >
          <option value="preventive">Preventiva</option>
          <option value="corrective">Corretiva</option>
          <option value="scheduled">Agendada</option>
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data de Início</label>
        <input 
          type="date" 
          value={formData.data_inicio}
          onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Users size={14} /> Responsável / Oficina</label>
        <input 
          type="text" 
          placeholder="Ex: Mecânica Silva, João..." 
          value={formData.responsavel}
          onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Custo Estimado (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo}
          onChange={(e) => setFormData({...formData, custo: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Descrição do Problema / Serviço</label>
        <textarea 
          placeholder="Detalhe o que será realizado..." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          rows={3}
          required
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status Inicial</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="open">Em Aberto</option>
          <option value="scheduled">Agendada</option>
          <option value="completed">Finalizada</option>
        </select>
      </div>
    </FormModal>
  );
};
