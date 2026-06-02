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
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
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
    
    // Fetch Machines with specs, only active
    const { data: mData } = await supabase
      .from('maquinas')
      .select('id, nome, tipo, placa')
      .eq('fazenda_id', activeFarm.id)
      .eq('status', 'active');
    if (mData) {
      // Add mock fields for UI compatibility
      const transformed = mData.map(m => ({
        ...m,
        horimetro_atual: 0,
        capacidade_tanque: 0,
        consumo_estimado: 0
      }));
      setMachines(transformed);
    }

    // Fetch Inventory Locations (Tanks), active and type Tanque
    const { data: lData } = await supabase
      .from('depositos')
      .select('id, nome')
      .eq('fazenda_id', activeFarm.id)
      .eq('status', 'ativo')
      .eq('tipo', 'Tanque');
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
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Abastecimento" : "Novo Registro de Abastecimento"}
      subtitle="Controle o consumo de combustível da sua frota."
      icon={Fuel}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Registro"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Abastecimento</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Máquina / Veículo</label>
            <SearchableSelect 
              value={formData.machine_id}
              onChange={(val: any) => setFormData({...formData, machine_id: val})}
              placeholder="Selecione a máquina..."
              options={machines.map(m => ({ value: m.id, label: m.nome }))}
            />
            {selectedMachine && (
              <div className="tauze-field-hint" style={{ color: 'hsl(var(--brand))', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
                Último Horímetro: {selectedMachine.horimetro_atual}h | Cap. Tanque: {selectedMachine.capacidade_tanque}L
              </div>
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Package size={14} /> Local de Saída (Estoque)</label>
            <SearchableSelect 
              value={formData.estoque_id}
              onChange={(val: any) => setFormData({...formData, estoque_id: val})}
              placeholder="Selecione o tanque de diesel..."
              options={locations.map(l => ({ value: l.id, label: l.nome }))}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><User size={14} /> Responsável / Operador</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Nome do operador..." 
              value={formData.responsible}
              onChange={(e) => setFormData({...formData, responsible: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Medição e Combustível</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Droplets size={14} /> Tipo de Combustível</label>
            <SearchableSelect 
              value={formData.fuel_type}
              onChange={(val: any) => setFormData({...formData, fuel_type: val})}
              options={[
                { value: 'Diesel S10', label: 'Diesel S10' },
                { value: 'Diesel S500', label: 'Diesel S500' },
                { value: 'Gasolina', label: 'Gasolina' },
                { value: 'Etanol', label: 'Etanol' },
                { value: 'Arla 32', label: 'Arla 32' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Clock size={14} /> Horímetro / KM Atual</label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 4520" 
              value={formData.meter_value}
              onChange={(e) => setFormData({...formData, meter_value: e.target.value})}
              required
            />
            {selectedMachine && Number(formData.meter_value) < selectedMachine.horimetro_atual && (
              <div className="tauze-field-error" style={{ color: '#ef4444', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
                <Activity size={10} /> Valor menor que o último registro!
              </div>
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Droplets size={14} /> Quantidade (Litros)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.liters}
              onChange={(e) => setFormData({...formData, liters: e.target.value})}
              required
            />
            {selectedMachine && Number(formData.liters) > selectedMachine.capacidade_tanque && (
              <div className="tauze-field-error" style={{ color: '#f59e0b', fontSize: '10px', fontWeight: 700, marginTop: '4px' }}>
                <Activity size={10} /> Volume acima da cap. do tanque!
              </div>
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor Total (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.total_cost}
              onChange={(e) => setFormData({...formData, total_cost: e.target.value})}
              required
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
