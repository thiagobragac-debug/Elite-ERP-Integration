import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

import {
  Wrench,
  Settings,
  Calendar,
  Users,
  DollarSign,
  Truck,
  Plus,
  Activity,
  FileText,
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  Gauge,
  ChevronRight,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { SearchableSelect } from './SearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();

  const INITIAL_MAINTENANCE_FORM = {
    maquina_id: '',
    tipo: 'preventive',
    descricao: '',
    data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0],
    custo_pecas: '0',
    custo_mao_obra: '0',
    responsavel: '',
    status: 'open',
    meter_value: '',
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `maintenance_form_${activeTenantId}`,
    initialState: INITIAL_MAINTENANCE_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [items, setItems] = useState<any[]>([]);

  const [machines, setMachines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  const [activeEtapa, setActiveEtapa] = useState('contexto');

  useEffect(() => {
    if (!actionId) return;
    setActiveEtapa('contexto');
  }, [actionId]);

  useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData({
      maquina_id: initialData.maquina_id || '',
      tipo: initialData.tipo || 'preventive',
      descricao: initialData.descricao || '',
      data_inicio:
        initialData.data_inicio ||
        new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
      custo_pecas: initialData.custo_pecas?.toString() || '0',
      custo_mao_obra: initialData.custo_mao_obra?.toString() || '0',
      responsavel: initialData.responsavel || '',
      status: initialData.status || 'open',
      meter_value: initialData.valor_medidor?.toString() || '',
    });
    if (initialData.materiais) {
      setItems(initialData.materiais);
    }
  }, [initialData, isOpen, actionId]);

  useEffect(() => {
    if (formData.maquina_id) {
      const machine = machines.find((m) => String(m.id) === String(formData.maquina_id));
      setSelectedMachine(machine);
      if (machine && !initialData) {
        setFormData((prev) => ({
          ...prev,
          meter_value: machine.horimetro_atual?.toString() || '',
        }));
      }
    }
  }, [formData.maquina_id, machines]);

  // Totalizer Engine
  const totalCost = useMemo(() => {
    let total = 0;
    total += parseFloat(formData.custo_pecas || '0');
    total += parseFloat(formData.custo_mao_obra || '0');

    items.forEach((mat) => {
      const qty = parseFloat(mat.quantidade) || 0;
      const unitPrice = parseFloat(mat.valor_unitario) || 0;
      total += qty * unitPrice;
    });
    return total;
  }, [formData.custo_pecas, formData.custo_mao_obra, items]);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    // Fetch Machines
    const { data: mData } = await applyFarmFilter(
      supabase.from('maquinas').select('*').eq('tenant_id', activeTenantId)
    );
    if (mData) {
      const transformed = mData.map((m) => ({
        ...m,
        horimetro_atual: m.horimetro_atual || 0,
        unidade_medida: m.unidade_medida || 'horas',
      }));
      setMachines(transformed);
    }

    // Fetch Inventory (Lubricants, Filters, Spare Parts)
    const { data: pData } = await applyFarmFilter(
      supabase
        .from('produtos')
        .select('id, nome, categoria, preco_custo').eq('tenant_id', activeTenantId)
        .in('categoria', ['LUBRIFICANTES', 'PECAS', 'PNEUS', 'FILTROS'])
    );
    if (pData) {
      const transformed = pData.map((p) => ({ ...p, preco_venda: p.preco_custo || 0 }));
      setInventory(transformed);
    }
  };

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

  const isContextoDone = !!formData.maquina_id && !!formData.tipo && !!formData.data_inicio && !!formData.meter_value && !!formData.responsavel;
  const isDescricaoDone = !!formData.status && !!formData.descricao;
  const isCustosDone = true; // Materiais e custos são opcionais

  const ETAPAS_CONFIG = [
    { id: 'contexto', label: '1. Contexto & Ativo', icon: Truck, color: '#3b82f6' },
    { id: 'descricao', label: '2. Diagnóstico & Status', icon: Activity, color: '#f59e0b' },
    { id: 'custos', label: '3. Materiais & Custos', icon: DollarSign, color: '#10b981' },
  ];

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}
      subtitle={
        initialData
          ? 'Atualize os dados da manutenção realizada.'
          : 'Registre uma manutenção em um ativo da frota.'
      }
      icon={Wrench}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Abrir Ordem'}
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
            if (et.id === 'descricao') isCompleted = isDescricaoDone;
            if (et.id === 'custos') isCompleted = isCustosDone;

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
                  <Icon size={16} />
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
          {/* OS Dashboard Banner - FIXO NO TOPO */}
          <div
            style={{
              marginBottom: '24px',
              padding: '16px',
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Custo Total Previsto (OS)
              </span>
              <span style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>
                {totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Status Atual
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 800,
                  color:
                    formData.status === 'open'
                      ? '#3b82f6'
                      : formData.status === 'scheduled'
                        ? '#8b5cf6'
                        : formData.status === 'waiting_parts'
                          ? '#f59e0b'
                          : formData.status === 'completed'
                            ? '#10b981'
                            : '#ef4444',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  background: 
                    formData.status === 'open' ? 'rgba(59, 130, 246, 0.1)'
                    : formData.status === 'scheduled' ? 'rgba(139, 92, 246, 0.1)'
                    : formData.status === 'waiting_parts' ? 'rgba(245, 158, 11, 0.1)'
                    : formData.status === 'completed' ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                }}
              >
                {formData.status === 'open'
                  ? 'Em Aberto'
                  : formData.status === 'scheduled'
                    ? 'Na Oficina'
                    : formData.status === 'waiting_parts'
                      ? 'Aguardando Peças'
                      : formData.status === 'completed'
                        ? 'Concluída'
                        : 'Cancelada'}
              </span>
            </div>
          </div>

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
              {activeEtapa === 'contexto' && 'Identifique a máquina e defina o tipo de manutenção.'}
              {activeEtapa === 'descricao' &&
                'Defina o status e detalhe os serviços que serão realizados.'}
              {activeEtapa === 'custos' &&
                'Lance as peças do estoque e adicione os custos de mão de obra.'}
            </p>
          </div>

          {activeEtapa === 'contexto' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Truck size={14} /> Selecionar Máquina
                  </label>
                  <SearchableSelect
                    value={formData.maquina_id}
                    onChange={(val: any) => setFormData({ ...formData, maquina_id: val })}
                    options={[
                      { value: '', label: 'Selecione um ativo...' },
                      ...(machines || []).map((m) => ({ value: String(m.id), label: String(m.nome) })),
                    ]}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Settings size={14} /> Tipo de Manutenção
                  </label>
                  <SearchableSelect
                    value={formData.tipo}
                    onChange={(val: any) => setFormData({ ...formData, tipo: val })}
                    options={[
                      { value: 'preventive', label: 'Preventiva' },
                      { value: 'corrective', label: 'Corretiva' },
                      { value: 'scheduled', label: 'Agendada' },
                    ]}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    {selectedMachine?.unidade_medida === 'km' ? (
                      <>
                        <Gauge size={14} /> Hodômetro na Parada (km)
                      </>
                    ) : (
                      <>
                        <Clock size={14} /> Horímetro na Parada (h)
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
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Calendar size={14} /> Data de Início
                  </label>
                  <input
                    className="tauze-input"
                    type="date"
                    value={formData.data_inicio}
                    onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                    required
                  />
                </div>

                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">
                    <Users size={14} /> Responsável / Oficina
                  </label>
                  <input
                    className="tauze-input"
                    type="text"
                    placeholder="Ex: Mecânica Silva, João..."
                    value={formData.responsavel}
                    onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeEtapa === 'descricao' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Activity size={14} /> Status da Ordem
                  </label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(val: any) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: 'open', label: 'Em Aberto (Pendente)' },
                      { value: 'scheduled', label: 'Na Oficina' },
                      { value: 'waiting_parts', label: 'Aguardando Peças' },
                      { value: 'completed', label: 'Concluída (Finalizada)' },
                      { value: 'cancelled', label: 'Cancelada' },
                    ]}
                  />
                </div>
              </div>
              <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <FileText size={14} /> Descrição do Problema / Serviço
                  </label>
                  <textarea
                    className="tauze-input tauze-textarea"
                    placeholder="Detalhe o que será realizado..."
                    value={formData.descricao}
                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                    rows={6}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {activeEtapa === 'custos' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div style={{ marginBottom: '12px' }}>
                <ConsumptionCart items={items} onChange={setItems} mode="consumption" />
              </div>

              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <DollarSign size={14} /> Peças Compradas Fora (R$)
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.custo_pecas}
                    onChange={(e) => setFormData({ ...formData, custo_pecas: e.target.value })}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <DollarSign size={14} /> Mão de Obra (R$)
                  </label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.custo_mao_obra}
                    onChange={(e) => setFormData({ ...formData, custo_mao_obra: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
