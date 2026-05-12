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
      .select('id, nome, horimetro_atual')
      .eq('fazenda_id', activeFarm?.id);
    if (mData) setMachines(mData);

    // Fetch Inventory (Lubricants, Filters, Spare Parts)
    const { data: pData } = await supabase
      .from('produtos')
      .select('id, nome, categoria, preco_venda')
      .in('categoria', ['LUBRIFICANTES', 'PECAS', 'PNEUS', 'FILTROS']);
    if (pData) setInventory(pData);
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
              <select 
                style={{ flex: 2 }}
                value={mat.id}
                onChange={(e) => {
                  const prod = inventory.find(p => p.id === e.target.value);
                  const newMats = [...formData.materiais];
                  newMats[i] = { ...newMats[i], id: e.target.value, nome: prod?.nome, preco: prod?.preco_venda || 0 };
                  setFormData({...formData, materiais: newMats});
                }}
              >
                <option value="">Selecione a peça...</option>
                {inventory.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
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
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="open">Em Aberto (Pendente)</option>
          <option value="scheduled">Agendada (Oficina)</option>
          <option value="completed">Concluída (Finalizada)</option>
          <option value="cancelled">Cancelada</option>
        </select>
      </div>
    </FormModal>
  );
};
