import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Fuel, 
  Truck,
  Calendar,
  Droplets,
  DollarSign,
  Activity,
  User,
  Clock,
  Package,
  Calculator,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Gauge,
  CheckCircle2
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
  actionId?: number;
}

export const FuelForm: React.FC<FuelFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = usePersistentState('FuelForm_formData', {
    machine_id: '',
    estoque_id: '',
    date: new Date().toISOString().split('T')[0],
    liters: '',
    unit_price: '',
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
    if (!actionId) return; // Ignore on initial mount / refresh

    if (initialData) { setFormData({
        machine_id: initialData.maquina_id || '',
        estoque_id: initialData.estoque_id || '',
        date: initialData.data || new Date().toISOString().split('T')[0],
        liters: initialData.litros?.toString() || '',
        unit_price: initialData.preco_unitario?.toString() || '',
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
        unit_price: '',
        total_cost: '',
        meter_value: '',
        fuel_type: 'Diesel S10',
        responsible: ''
      });
    }
  }, [initialData, isOpen, actionId]);

  // Calculadora Inteligente de Bomba
  useEffect(() => {
    if (formData.liters && formData.unit_price) {
      const total = parseFloat(formData.liters) * parseFloat(formData.unit_price);
      if (!isNaN(total)) {
        setFormData(prev => ({ ...prev, total_cost: total.toFixed(2) }));
      }
    }
  }, [formData.liters, formData.unit_price]);

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
      .select('*')
      .eq('fazenda_id', activeFarm.id)
      .eq('status', 'active');
    if (mData) {
      // Add mock fields for UI compatibility based on what DB has or fallback
      const transformed = mData.map(m => ({
        ...m,
        unidade_medida: m.unidade_medida || 'horas',
        horimetro_atual: m.horimetro_atual || 0,
        capacidade_tanque: m.capacidade_tanque || 0,
        consumo_estimado: m.consumo_estimado || 0
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
        setFormData(prev => ({ 
          ...prev, 
          meter_value: machine.horimetro_atual?.toString() || '' 
        }));
      }
    }
  }, [formData.machine_id, machines]);

  // Calcula consumo em tempo real
  const currentConsumption = React.useMemo(() => {
    if (!selectedMachine || !formData.meter_value || !formData.liters) return null;
    const diff = Number(formData.meter_value) - Number(selectedMachine.horimetro_atual);
    if (diff <= 0) return null;
    
    // (L/h) or (km/L)
    if (selectedMachine.unidade_medida === 'horas') {
      return Number(formData.liters) / diff; // L/h (maior = pior)
    } else {
      return diff / Number(formData.liters); // km/L (menor = pior)
    }
  }, [selectedMachine, formData.meter_value, formData.liters]);

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
              <div className="tauze-field-hint" style={{ color: 'hsl(var(--brand))', fontSize: '11px', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={12} /> Último Reg: {selectedMachine.horimetro_atual}{selectedMachine.unidade_medida === 'horas' ? 'h' : 'km'} | Cap. Tanque: {selectedMachine.capacidade_tanque}L
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
            <label className="tauze-label">
              {selectedMachine?.unidade_medida === 'km' ? <><Gauge size={14} /> Hodômetro Atual (km)</> : <><Clock size={14} /> Horímetro Atual (h)</>}
            </label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 4520" 
              value={formData.meter_value}
              onChange={(e) => setFormData({...formData, meter_value: e.target.value})}
              required
            />
            {selectedMachine && Number(formData.meter_value) <= selectedMachine.horimetro_atual && formData.meter_value !== '' && (
              <div className="tauze-field-error" style={{ color: '#ef4444', fontSize: '11px', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> Valor deve ser maior que {selectedMachine.horimetro_atual}!
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
            {selectedMachine && Number(formData.liters) > selectedMachine.capacidade_tanque && selectedMachine.capacidade_tanque > 0 && (
              <div className="tauze-field-error" style={{ color: '#f59e0b', fontSize: '11px', fontWeight: 600, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={12} /> Volume excede cap. do tanque ({selectedMachine.capacidade_tanque}L)
              </div>
            )}
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calculator size={14} /> Preço Unitário (R$/L)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.unit_price}
              onChange={(e) => setFormData({...formData, unit_price: e.target.value})}
              required
            />
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
        
        {/* Termômetro de Consumo */}
        {currentConsumption !== null && selectedMachine?.consumo_estimado > 0 && (
          <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))' }}>
            <h5 style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: '8px', textTransform: 'uppercase' }}>Análise de Consumo (Viagem)</h5>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '24px', fontWeight: 800 }}>{currentConsumption.toFixed(2)}</span>
                <span style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginLeft: '4px' }}>{selectedMachine.unidade_medida === 'horas' ? 'L/h' : 'km/L'}</span>
              </div>
              
              {selectedMachine.unidade_medida === 'horas' ? (
                currentConsumption > selectedMachine.consumo_estimado * 1.1 ? (
                  <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingUp size={14} /> Alto Consumo (Meta: {selectedMachine.consumo_estimado}L/h)
                  </div>
                ) : (
                  <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Dentro do Padrão
                  </div>
                )
              ) : (
                currentConsumption < selectedMachine.consumo_estimado * 0.9 ? (
                  <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <TrendingDown size={14} /> Baixo Rendimento (Meta: {selectedMachine.consumo_estimado}km/L)
                  </div>
                ) : (
                  <div style={{ padding: '6px 12px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', color: '#10b981', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle2 size={14} /> Dentro do Padrão
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </section>
    </SidePanel>
  );
};
