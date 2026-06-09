import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

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
  Gauge
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = usePersistentState('MaintenanceForm_formData', {
    maquina_id: '',
    tipo: 'preventive',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    custo_pecas: '0',
    custo_mao_obra: '0',
    responsavel: '',
    status: 'open',
    meter_value: '',
    materiais: [] as any[] // itemized materials from inventory
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMachine, setSelectedMachine] = useState<any>(null);

  // Accordions state
  const [openSections, setOpenSections] = useState({
    materials: false,
    costs: false
  });

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (initialData) { setFormData({
        maquina_id: initialData.maquina_id || '',
        tipo: initialData.tipo || 'preventive',
        descricao: initialData.descricao || '',
        data_inicio: initialData.data_inicio || new Date().toISOString().split('T')[0],
        custo_pecas: initialData.custo_pecas?.toString() || '0',
        custo_mao_obra: initialData.custo_mao_obra?.toString() || '0',
        responsavel: initialData.responsavel || '',
        status: initialData.status || 'open',
        meter_value: initialData.valor_medidor?.toString() || '',
        materiais: initialData.materiais || []
      });
    } else {
      setFormData({
        maquina_id: '',
        tipo: 'preventive',
        descricao: '',
        data_inicio: new Date().toISOString().split('T')[0],
        custo_pecas: '0',
        custo_mao_obra: '0',
        responsavel: '',
        status: 'open',
        meter_value: '',
        materiais: []
      });
    }
  }, [initialData, isOpen, actionId]);

  useEffect(() => {
    if (formData.maquina_id) {
      const machine = machines.find(m => String(m.id) === String(formData.maquina_id));
      setSelectedMachine(machine);
      if (machine && !initialData) {
        setFormData(prev => ({ 
          ...prev, 
          meter_value: machine.horimetro_atual?.toString() || '' 
        }));
      }
    }
  }, [formData.maquina_id, machines]);

  // Totalizer Engine
  const totalCost = useMemo(() => {
    let total = 0;
    total += parseFloat(formData.custo_pecas || '0');
    total += parseFloat(formData.custo_mao_obra || '0');
    
    formData.materiais.forEach(mat => {
      if (mat.id && mat.qtd) {
        const item = inventory.find(inv => String(inv.id) === String(mat.id));
        if (item && item.preco_venda) {
          total += parseFloat(mat.qtd) * parseFloat(item.preco_venda);
        }
      }
    });
    return total;
  }, [formData.custo_pecas, formData.custo_mao_obra, formData.materiais, inventory]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    // Fetch Machines
    const { data: mData } = await supabase
      .from('maquinas')
      .select('*')
      .eq('fazenda_id', activeFarm?.id);
    if (mData) {
      const transformed = mData.map(m => ({ 
        ...m, 
        horimetro_atual: m.horimetro_atual || 0,
        unidade_medida: m.unidade_medida || 'horas'
      }));
      setMachines(transformed);
    }

    // Fetch Inventory (Lubricants, Filters, Spare Parts)
    const { data: pData } = await supabase
      .from('produtos')
      .select('id, nome, categoria, preco_custo')
      .in('categoria', ['LUBRIFICANTES', 'PECAS', 'PNEUS', 'FILTROS']);
    if (pData) {
      const transformed = pData.map(p => ({ ...p, preco_venda: p.preco_custo || 0 }));
      setInventory(transformed);
    }
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
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Ordem de Serviço" : "Nova Ordem de Serviço"}
      subtitle={initialData ? "Atualize os dados da manutenção realizada." : "Registre uma manutenção em um ativo da frota."}
      icon={Wrench}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Abrir Ordem"}
    >
      {/* OS Dashboard Banner */}
      <div style={{ marginBottom: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Custo Total Previsto (OS)</span>
          <span style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>{totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>Status Atual</span>
          <span style={{ fontSize: '14px', fontWeight: 800, color: formData.status === 'open' ? '#f59e0b' : formData.status === 'completed' ? '#10b981' : '#1e293b' }}>
            {formData.status === 'open' ? 'Em Aberto' : formData.status === 'scheduled' ? 'Na Oficina' : formData.status === 'completed' ? 'Concluída' : 'Cancelada'}
          </span>
        </div>
      </div>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação Básica</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Truck size={14} /> Selecionar Máquina</label>
            <SearchableSelect 
              value={formData.maquina_id}
              onChange={(val: any) => setFormData({...formData, maquina_id: val})}
              options={[
                { value: '', label: 'Selecione um ativo...' },
                ...(machines || []).map(m => ({ value: String(m.id), label: String(m.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Tipo de Manutenção</label>
            <SearchableSelect 
              value={formData.tipo}
              onChange={(val: any) => setFormData({...formData, tipo: val})}
              options={[
                { value: 'preventive', label: 'Preventiva' },
                { value: 'corrective', label: 'Corretiva' },
                { value: 'scheduled', label: 'Agendada' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              {selectedMachine?.unidade_medida === 'km' ? <><Gauge size={14} /> Hodômetro na Parada (km)</> : <><Clock size={14} /> Horímetro na Parada (h)</>}
            </label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 4520" 
              value={formData.meter_value}
              onChange={(e) => setFormData({...formData, meter_value: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Início</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_inicio}
              onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Users size={14} /> Responsável / Oficina</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Mecânica Silva, João..." 
              value={formData.responsavel}
              onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Descrição e Status</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status da Ordem</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'open', label: 'Em Aberto (Pendente)' },
                { value: 'scheduled', label: 'Agendada (Oficina)' },
                { value: 'completed', label: 'Concluída (Finalizada)' },
                { value: 'cancelled', label: 'Cancelada' },
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Descrição do Problema / Serviço</label>
            <textarea className="tauze-input tauze-textarea"
              placeholder="Detalhe o que será realizado..." 
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
              rows={3}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div 
          className="tauze-section-header" 
          style={{ cursor: 'pointer', padding: '12px', background: 'hsl(var(--bg-main))', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={() => setOpenSections(prev => ({ ...prev, materials: !prev.materials }))}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="tauze-section-badge">PASSO 03</div>
            <h4 className="tauze-section-title" style={{ margin: 0 }}>Materiais e Peças (Estoque)</h4>
          </div>
          {openSections.materials ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
        </div>
        
        {openSections.materials && (
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'hsl(var(--bg-main)/0.5)', padding: '16px', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
              {formData.materiais.map((mat, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <SearchableSelect 
                    value={mat.id}
                    onChange={(val: any) => {
                      const newMats = [...formData.materiais];
                      newMats[i].id = val;
                      setFormData({...formData, materiais: newMats});
                    }}
                    options={[
                      { value: '', label: 'Selecione a peça...' },
                      ...(inventory || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
                    ]}
                  />
                  <input 
                    className="tauze-input"
                    type="number" 
                    placeholder="Qtd" 
                    style={{ flex: 1, height: '40px' }}
                    value={mat.qtd}
                    onChange={(e) => {
                      const newMats = [...formData.materiais];
                      newMats[i].qtd = e.target.value;
                      setFormData({...formData, materiais: newMats});
                    }}
                  />
                  <button 
                    type="button" 
                    className="action-dot delete"
                    onClick={() => setFormData({...formData, materiais: formData.materiais.filter((_, idx) => idx !== i)})}
                  >
                    <Plus size={14} style={{ transform: 'rotate(45deg)' }} />
                  </button>
                </div>
              ))}
              <button 
                type="button" 
                className="text-btn" 
                style={{ alignSelf: 'flex-start', fontSize: '11px', marginTop: formData.materiais.length > 0 ? '8px' : '0' }}
                onClick={() => setFormData({...formData, materiais: [...formData.materiais, { id: '', qtd: 1 }]})}
              >
                + ADICIONAR ITEM DO ESTOQUE
              </button>
            </div>
          </div>
        </div>
        )}
      </section>

      <section className="tauze-form-section">
        <div 
          className="tauze-section-header" 
          style={{ cursor: 'pointer', padding: '12px', background: 'hsl(var(--bg-main))', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
          onClick={() => setOpenSections(prev => ({ ...prev, costs: !prev.costs }))}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="tauze-section-badge">PASSO 04</div>
            <h4 className="tauze-section-title" style={{ margin: 0 }}>Custos Adicionais</h4>
          </div>
          {openSections.costs ? <ChevronUp size={20} className="text-muted" /> : <ChevronDown size={20} className="text-muted" />}
        </div>

        {openSections.costs && (
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Peças Compradas Fora (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.custo_pecas}
              onChange={(e) => setFormData({...formData, custo_pecas: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Mão de Obra (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.custo_mao_obra}
              onChange={(e) => setFormData({...formData, custo_mao_obra: e.target.value})}
            />
          </div>
        </div>
        )}
      </section>
    </SidePanel>
  );
};
