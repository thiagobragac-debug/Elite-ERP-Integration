import React, { useState, useEffect } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

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
  CheckCircle2,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';

interface FuelFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const FuelForm: React.FC<FuelFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();

  const INITIAL_FUEL_FORM = {
    machine_id: '',
    date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    meter_value: '',
    responsible: '',
    is_interno: true,
    fornecedor_id: '',
    numero_recibo: '',
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `fuel_form_${activeTenantId}`,
    initialState: INITIAL_FUEL_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [activeEtapa, setActiveEtapa] = useState('contexto');

  const [items, setItems] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [lastMeterValue, setLastMeterValue] = useState<number | null>(null);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialData) return;
    setActiveEtapa('contexto');
    setFormData({
      machine_id: initialData.maquina_id || '',
      date:
        initialData.data_abastecimento ||
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      meter_value: initialData.valor_medidor?.toString() || '',
      responsible: initialData.responsavel || '',
      is_interno: initialData.is_interno ?? true,
      fornecedor_id: initialData.fornecedor_id || '',
      numero_recibo: initialData.numero_recibo || '',
    });
  }, [initialData, isOpen, actionId]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {

    // Fetch Machines with specs, only active
    const { data: mData } = await applyFarmFilter(
      supabase.from('maquinas').select('*').eq('tenant_id', activeTenantId)
    ).eq('status', 'active');
    if (mData) {
      // Add mock fields for UI compatibility based on what DB has or fallback
      const transformed = mData.map((m) => ({
        ...m,
        unidade_medida: m.unidade_medida || 'horas',
        horimetro_atual: m.horimetro_atual || 0,
        capacidade_tanque: m.capacidade_tanque || 0,
        consumo_estimado: m.consumo_estimado || 0,
      }));
      setMachines(transformed);
    }

    // Fetch Inventory Locations (Tanks), active and type Tanque
    const { data: lData } = await applyFarmFilter(
      supabase.from('depositos').select('id, nome').eq('tenant_id', activeTenantId)
    ).eq('status', 'ativo').eq('tipo', 'Tanque');
    if (lData) {
      setLocations(lData);
    }
    
    // Fetch Profiles
    const { data: profData } = await supabase.from('profiles').select('id, full_name').eq('tenant_id', activeTenantId);
    if (profData) setProfiles(profData);

    // Fetch Fornecedores
    const { data: fornData } = await supabase.from('parceiros').select('id, fantasia, contato').eq('tenant_id', activeTenantId).eq('is_supplier', true);
    if (fornData) setFornecedores(fornData);
  };

  useEffect(() => {
    const fetchLastMeter = async (machineId: string) => {
      const { data } = await supabase
        .from('abastecimentos')
        .select('valor_medidor')
        .eq('maquina_id', machineId)
        .order('data', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (data && data.length > 0) {
        setLastMeterValue(data[0].valor_medidor);
      } else {
        const machine = machines.find((m) => m.id === machineId);
        setLastMeterValue(machine?.horimetro_atual || 0);
      }
    };

    if (formData.machine_id) {
      const machine = machines.find((m) => m.id === formData.machine_id);
      setSelectedMachine(machine);
      fetchLastMeter(formData.machine_id);
    } else {
      setLastMeterValue(null);
    }
  }, [formData.machine_id, machines]);

  // Calcula consumo em tempo real
  const currentConsumption = React.useMemo(() => {
    const totalLiters = items.reduce((acc, item) => acc + (parseFloat(item.quantidade) || 0), 0);
    if (!selectedMachine || !formData.meter_value || totalLiters <= 0) {
      return null;
    }
    const diff = Number(formData.meter_value) - Number(lastMeterValue || 0);
    if (diff <= 0) {
      return null;
    }

    // (L/h) or (km/L)
    if (selectedMachine.unidade_medida === 'horas') {
      return totalLiters / diff; // L/h (maior = pior)
    }
    return diff / totalLiters; // km/L (menor = pior)
  }, [selectedMachine, formData.meter_value, items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, items });
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const ETAPAS_CONFIG = [
    { id: 'contexto', label: '1. Dados Gerais', icon: Truck, color: '#3b82f6' },
    { id: 'combustivel', label: '2. Combustível & Análise', icon: Droplets, color: '#f59e0b' },
  ];

  const isContextoDone = !!formData.machine_id && !!formData.meter_value && !!formData.date && !!formData.responsible;
  const isCombustivelDone = items.length > 0 && items.some(i => i.produto_id);

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Abastecimento' : 'Novo Registro de Abastecimento'}
      subtitle="Controle o consumo de combustível da sua frota."
      icon={Fuel}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Registro'}
    >


      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'contexto') isCompleted = isContextoDone;
            if (et.id === 'combustivel') isCompleted = isCombustivelDone;

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted
                      ? et.color
                      : isActive
                        ? `${et.color}30`
                        : 'hsl(var(--bg-main))',
                    color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content - Form Fields */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {ETAPAS_CONFIG.find((e) => e.id === activeEtapa)?.label}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {activeEtapa === 'contexto' && 'Defina os dados da máquina, data e posto de abastecimento.'}
              {activeEtapa === 'combustivel' && 'Lance os insumos consumidos.'}
            </p>
          </div>

          {activeEtapa === 'contexto' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label" style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <MapPin size={14} /> Origem do Abastecimento
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_interno: true })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: formData.is_interno ? '2px solid #3b82f6' : '1px solid hsl(var(--border))',
                        background: formData.is_interno ? 'rgba(59, 130, 246, 0.1)' : 'hsl(var(--bg-card))',
                        color: formData.is_interno ? '#3b82f6' : 'hsl(var(--text-secondary))',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Droplets size={18} /> Bomba Interna (Estoque)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_interno: false })}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        borderRadius: '8px',
                        border: !formData.is_interno ? '2px solid #f59e0b' : '1px solid hsl(var(--border))',
                        background: !formData.is_interno ? 'rgba(245, 158, 11, 0.1)' : 'hsl(var(--bg-card))',
                        color: !formData.is_interno ? '#f59e0b' : 'hsl(var(--text-secondary))',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <Fuel size={18} /> Posto Terceirizado
                    </button>
                  </div>
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Truck size={14} /> Máquina / Veículo
                  </label>
                  <SearchableSelect
                    value={formData.machine_id}
                    onChange={(val: any) => setFormData({ ...formData, machine_id: val })}
                    placeholder="Selecione a máquina..."
                    options={machines.map((m) => ({ value: m.id, label: m.nome }))}
                  />
                  {selectedMachine && (
                    <div
                      className="tauze-field-hint"
                      style={{
                        color: 'hsl(var(--brand))',
                        fontSize: '11px',
                        fontWeight: 600,
                        marginTop: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Activity size={12} /> Último Reg: {lastMeterValue ?? selectedMachine.horimetro_atual}
                      {selectedMachine.unidade_medida === 'horas' ? 'h' : 'km'} | Cap. Tanque:{' '}
                      {selectedMachine.capacidade_tanque}L
                    </div>
                  )}
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    {selectedMachine?.unidade_medida === 'km' ? (
                      <>
                        <Gauge size={14} /> Hodômetro Atual (km)
                      </>
                    ) : (
                      <>
                        <Clock size={14} /> Horímetro Atual (h)
                      </>
                    )}
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    placeholder="Ex: 4520"
                    value={formData.meter_value}
                    onChange={(e) => setFormData({ ...formData, meter_value: e.target.value })}
                    required
                  />
                  {selectedMachine && lastMeterValue !== null &&
                    Number(formData.meter_value) <= lastMeterValue &&
                    formData.meter_value !== '' && (
                      <div
                        className="tauze-field-error"
                        style={{
                          color: '#ef4444',
                          fontSize: '11px',
                          fontWeight: 600,
                          marginTop: '6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <AlertCircle size={12} /> Valor deve ser maior que {lastMeterValue}!
                      </div>
                    )}
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Calendar size={14} /> Data
                  </label>
                  <input
                    className="tauze-input"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <User size={14} /> Responsável / Operador
                  </label>
                  <SearchableSelect
                    value={formData.responsible}
                    onChange={(val: any) => setFormData({ ...formData, responsible: val })}
                    placeholder="Selecione o operador..."
                    options={profiles.map((p) => ({ value: p.full_name || p.id, label: p.full_name || p.id }))}
                  />
                </div>

                {!formData.is_interno && (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label">Fornecedor / Posto</label>
                      <SearchableSelect
                        value={formData.fornecedor_id}
                        onChange={(val: any) => setFormData({ ...formData, fornecedor_id: val })}
                        placeholder="Selecione o posto..."
                        options={fornecedores.map((f) => ({ value: f.id, label: f.fantasia || f.contato || 'Sem nome' }))}
                      />
                    </div>
                    <div className="tauze-field-group">
                      <label className="tauze-label">Nº Recibo / NF</label>
                      <input
                        className="tauze-input"
                        type="text"
                        placeholder="Opcional"
                        value={formData.numero_recibo}
                        onChange={(e) => setFormData({ ...formData, numero_recibo: e.target.value })}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeEtapa === 'combustivel' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <ConsumptionCart
                items={items}
                onChange={setItems}
                mode="consumption"
                filterModule="frota_abastecimento"
                hideDeposit={!formData.is_interno}
              />

              {/* Termômetro de Consumo */}
              {currentConsumption !== null && selectedMachine?.consumo_estimado > 0 && (
                <div
                  style={{
                    marginTop: '24px',
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'hsl(var(--bg-main))',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <h5
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    Análise de Consumo (Viagem)
                  </h5>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontSize: '24px', fontWeight: 800 }}>
                        {currentConsumption.toFixed(2)}
                      </span>
                      <span
                        style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', marginLeft: '4px' }}
                      >
                        {selectedMachine.unidade_medida === 'horas' ? 'L/h' : 'km/L'}
                      </span>
                    </div>

                    {selectedMachine.unidade_medida === 'horas' ? (
                      currentConsumption > selectedMachine.consumo_estimado * 1.1 ? (
                        <div
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(239,68,68,0.1)',
                            color: '#ef4444',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <TrendingUp size={14} /> Alto Consumo (Meta: {selectedMachine.consumo_estimado}
                          L/h)
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            background: 'rgba(16,185,129,0.1)',
                            color: '#10b981',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <CheckCircle2 size={14} /> Dentro do Padrão
                        </div>
                      )
                    ) : currentConsumption < selectedMachine.consumo_estimado * 0.9 ? (
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(239,68,68,0.1)',
                          color: '#ef4444',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <TrendingDown size={14} /> Baixo Rendimento (Meta:{' '}
                        {selectedMachine.consumo_estimado}km/L)
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: '6px 12px',
                          borderRadius: '20px',
                          background: 'rgba(16,185,129,0.1)',
                          color: '#10b981',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <CheckCircle2 size={14} /> Dentro do Padrão
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
