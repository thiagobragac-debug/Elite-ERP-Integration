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
  FileText,
  Package
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
}

export const MaintenanceForm: React.FC<MaintenanceFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    maquina_id: '',
    tipo: 'preventive',
    descricao: '',
    data_inicio: new Date().toISOString().split('T')[0],
    custo_pecas: '0',
    custo_mao_obra: '0',
    responsavel: '',
    status: 'open',
    materiais: [] as any[] // itemized materials from inventory
  });

  const [machines, setMachines] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        maquina_id: initialData.maquina_id || '',
        tipo: initialData.tipo || 'preventive',
        descricao: initialData.descricao || '',
        data_inicio: initialData.data_inicio || new Date().toISOString().split('T')[0],
        custo_pecas: initialData.custo_pecas?.toString() || '0',
        custo_mao_obra: initialData.custo_mao_obra?.toString() || '0',
        responsavel: initialData.responsavel || '',
        status: initialData.status || 'open',
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
        materiais: []
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    // Fetch Machines
    const { data: mData } = await supabase
      .from('maquinas')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id);
    if (mData) {
      const transformed = mData.map(m => ({ ...m, horimetro_atual: 0 }));
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
      <div className="form-group full-width">
        <label><Truck size={14} /> Selecionar Máquina</label>
                <SearchableSelect 
          value={formData.maquina_id}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione um ativo...` },
            { value: `{m.nome}`, label: `{m.nome}` },
            ...(machines || []).map(m => ({ value: String(m.id), label: String(m.nome) })),
          ]}
        />
      </div>

      <div className="form-group">
        <label><Settings size={14} /> Tipo de Manutenção</label>
                <SearchableSelect 
          value={formData.tipo}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: `preventive`, label: `Preventiva` },
            { value: `corrective`, label: `Corretiva` },
            { value: `scheduled`, label: `Agendada` },
          ]}
        />
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
        <label><DollarSign size={14} /> Peças (Estoque) (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo_pecas}
          onChange={(e) => setFormData({...formData, custo_pecas: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Mão de Obra (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.custo_mao_obra}
          onChange={(e) => setFormData({...formData, custo_mao_obra: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><Package size={14} /> Materiais e Peças Aplicadas</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'hsl(var(--bg-main)/0.5)', padding: '16px', borderRadius: '16px', border: '1px solid hsl(var(--border))' }}>
          {formData.materiais.map((mat, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <SearchableSelect 
          value={mat.id}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione a peça...` },
            { value: `{p.nome}`, label: `{p.nome}` },
            ...(inventory || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
          ]}
        />
              <input 
                type="number" 
                placeholder="Qtd" 
                style={{ flex: 1 }}
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
            style={{ alignSelf: 'flex-start', fontSize: '11px' }}
            onClick={() => setFormData({...formData, materiais: [...formData.materiais, { id: '', qtd: 1 }]})}
          >
            + ADICIONAR ITEM DO ESTOQUE
          </button>
        </div>
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
        <label><Activity size={14} /> Status da Ordem</label>
                <SearchableSelect 
          value={formData.status}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: `open`, label: `Em Aberto (Pendente)` },
            { value: `scheduled`, label: `Agendada (Oficina)` },
            { value: `completed`, label: `Concluída (Finalizada)` },
            { value: `cancelled`, label: `Cancelada` },
          ]}
        />
      </div>
    </SidePanel>
  );
};
