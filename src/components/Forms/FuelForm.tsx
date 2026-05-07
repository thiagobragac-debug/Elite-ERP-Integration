import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Truck,
  Calendar,
  Droplets,
  DollarSign,
  Activity,
  User,
  Clock
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface FuelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const FuelForm: React.FC<FuelFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    machine_id: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    total_cost: '',
    meter_value: '', // current hours or km
    fuel_type: 'Diesel S10',
    responsible: ''
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        machine_id: initialData.maquina_id || '',
        date: initialData.data || new Date().toISOString().split('T')[0],
        liters: initialData.litros?.toString() || '',
        total_cost: initialData.valor_total?.toString() || '',
        meter_value: initialData.valor_medidor?.toString() || '',
        fuel_type: initialData.tipo_combustivel || 'Diesel S10',
        responsible: initialData.responsavel || ''
      });
    } else {
      setFormData({
        machine_id: '',
        date: new Date().toISOString().split('T')[0],
        liters: '',
        total_cost: '',
        meter_value: '',
        fuel_type: 'Diesel S10',
        responsible: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchMachines();
    }
  }, [isOpen, activeFarm]);

  const fetchMachines = async () => {
    const { data } = await supabase
      .from('maquinas')
      .select('id, nome, tipo_medidor')
      .eq('fazenda_id', activeFarm.id);
    if (data) setMachines(data);
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
      title={initialData ? "Editar Abastecimento" : "Novo Registro de Abastecimento"}
      subtitle="Controle o consumo de combustível da sua frota."
      icon={Fuel}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Registro"}
    >
      <div className="form-group">
        <label><Truck size={14} /> Máquina / Veículo</label>
        <select 
          value={formData.machine_id}
          onChange={(e) => setFormData({...formData, machine_id: e.target.value})}
          required
        >
          <option value="">Selecione a máquina...</option>
          {machines.map(m => (
            <option key={m.id} value={m.id}>{m.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data</label>
        <input 
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Droplets size={14} /> Quantidade (Litros)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.liters}
          onChange={(e) => setFormData({...formData, liters: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Valor Total (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.total_cost}
          onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Clock size={14} /> Horímetro / KM Atual</label>
        <input 
          type="number" 
          placeholder="Ex: 4520" 
          value={formData.meter_value}
          onChange={(e) => setFormData({...formData, meter_value: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Droplets size={14} /> Tipo de Combustível</label>
        <select 
          value={formData.fuel_type}
          onChange={(e) => setFormData({...formData, fuel_type: e.target.value})}
          required
        >
          <option>Diesel S10</option>
          <option>Diesel S500</option>
          <option>Gasolina</option>
          <option>Etanol</option>
          <option>Arla 32</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><User size={14} /> Responsável / Operador</label>
        <input 
          type="text" 
          placeholder="Nome do operador..." 
          value={formData.responsible}
          onChange={(e) => setFormData({...formData, responsible: e.target.value})}
          required
        />
      </div>
    </FormModal>
  );
};
