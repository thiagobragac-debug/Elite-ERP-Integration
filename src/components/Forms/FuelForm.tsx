import React, { useState, useEffect } from 'react';
import { 
  Fuel, 
  Truck,
  Calendar,
  Droplets,
  DollarSign,
  Activity,
  User,
  Clock,
  Package
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
    estoque_id: '', // linked to inventory
    date: new Date().toISOString().split('T')[0],
    liters: '',
    total_cost: '',
    meter_value: '', 
    fuel_type: 'Diesel S10',
    responsible: ''
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        machine_id: initialData.maquina_id || '',
        estoque_id: initialData.estoque_id || '',
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
        estoque_id: '',
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
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    if (!activeFarm?.id) return;
    
    // Fetch Machines with specs
    const { data: mData } = await supabase
      .from('maquinas')
      .select('id, nome, horimetro_atual, capacidade_tanque, consumo_estimado')
      .eq('fazenda_id', activeFarm.id);
    if (mData) setMachines(mData);

    // Fetch Inventory Locations (Tanks)
    const { data: lData } = await supabase
      .from('depositos')
      .select('id, nome')
      .eq('fazenda_id', activeFarm.id);
    if (lData) setLocations(lData);
  };

  useEffect(() => {
    if (formData.machine_id) {
      const machine = machines.find(m => m.id === formData.machine_id);
      setSelectedMachine(machine);
      if (machine && !initialData) {
        setFormData(prev => ({ ...prev, meter_value: machine.horimetro_atual?.toString() || '' }));
      }
    }
  }, [formData.machine_id, machines]);

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
      <div className="form-group full-width">
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
        {selectedMachine && (
          <div className="elite-field-hint" style={{ color: 'hsl(var(--brand))', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
            Último Horímetro: {selectedMachine.horimetro_atual}h | Cap. Tanque: {selectedMachine.capacidade_tanque}L
          </div>
        )}
      </div>

      <div className="form-group full-width">
        <label><Package size={14} /> Local de Saída (Estoque)</label>
        <select 
          value={formData.estoque_id}
          onChange={(e) => setFormData({...formData, estoque_id: e.target.value})}
          required
        >
          <option value="">Selecione o tanque de diesel...</option>
          {locations.map(l => (
            <option key={l.id} value={l.id}>{l.nome}</option>
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
        <label><Clock size={14} /> Horímetro / KM Atual</label>
        <input 
          type="number" 
          placeholder="Ex: 4520" 
          value={formData.meter_value}
          onChange={(e) => setFormData({...formData, meter_value: e.target.value})}
          required
        />
        {selectedMachine && Number(formData.meter_value) < selectedMachine.horimetro_atual && (
          <div className="elite-field-error" style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
            <Activity size={10} /> Valor menor que o último registro!
          </div>
        )}
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
        {selectedMachine && Number(formData.liters) > selectedMachine.capacidade_tanque && (
          <div className="elite-field-error" style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
            <Activity size={10} /> Volume acima da cap. do tanque!
          </div>
        )}
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
