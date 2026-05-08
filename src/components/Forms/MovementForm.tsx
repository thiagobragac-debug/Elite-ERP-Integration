import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Package,
  Calendar,
  Building2,
  Users,
  ArrowDownLeft,
  ArrowUpRight,
  Hash,
  Settings,
  DollarSign
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface MovementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  defaultType?: 'in' | 'out';
  initialData?: any;
}

export const MovementForm: React.FC<MovementFormProps> = ({ isOpen, onClose, onSubmit, defaultType = 'in', initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    produto_id: '',
    deposito_id: '',
    tipo: defaultType as 'in' | 'out' | 'adjust',
    quantidade: '',
    valor_unitario: '',
    data_movimentacao: new Date().toISOString().split('T')[0],
    origem_destino: '',
    responsavel: ''
  });

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        produto_id: initialData.produto_id || '',
        tipo: initialData.tipo || defaultType,
        quantidade: initialData.quantidade?.toString() || '',
        data_movimentacao: initialData.data_movimentacao || new Date().toISOString().split('T')[0],
        origem_destino: initialData.origem_destino || '',
        responsavel: initialData.responsavel || ''
      });
    } else {
      setFormData({
        produto_id: '',
        deposito_id: '',
        tipo: defaultType as any,
        quantidade: '',
        valor_unitario: '',
        data_movimentacao: new Date().toISOString().split('T')[0],
        origem_destino: '',
        responsavel: ''
      });
    }
  }, [initialData, isOpen, defaultType]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchProducts();
      fetchWarehouses();
    }
  }, [isOpen, activeFarm]);

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('produtos')
      .select('id, nome, unidade')
      .eq('fazenda_id', activeFarm?.id);
    if (data) setProducts(data);
  };

  const fetchWarehouses = async () => {
    const { data } = await supabase
      .from('depositos')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id)
      .eq('status', 'ativo');
    if (data) setWarehouses(data);
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
      title={initialData ? "Editar Movimentação" : (formData.tipo === 'in' ? "Lançar Entrada" : "Lançar Saída")}
      subtitle="Registre a movimentação física de um insumo."
      icon={formData.tipo === 'in' ? ArrowDownLeft : ArrowUpRight}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Confirmar Movimentação"}
    >
      <div className="form-group full-width">
        <label><Package size={14} /> Selecionar Produto</label>
        <select 
          value={formData.produto_id}
          onChange={(e) => setFormData({...formData, produto_id: e.target.value})}
          required
        >
          <option value="">Selecione um item do estoque...</option>
          {products.map(p => (
            <option key={p.id} value={p.id}>{p.nome} ({p.unidade})</option>
          ))}
        </select>
      </div>

      <div className="form-group full-width">
        <label><Building2 size={14} /> Depósito / Almoxarifado</label>
        <select 
          value={formData.deposito_id}
          onChange={(e) => setFormData({...formData, deposito_id: e.target.value})}
          required
        >
          <option value="">Selecione o local de armazenagem...</option>
          {warehouses.map(w => (
            <option key={w.id} value={w.id}>{w.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group full-width">
        <label><ArrowRightLeft size={14} /> Tipo de Movimento</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'in' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'in'})}
          >
            <ArrowDownLeft size={16} />
            <span>Entrada (+)</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'out' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'out'})}
          >
            <ArrowUpRight size={16} />
            <span>Saída (-)</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'adjust' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'adjust'})}
          >
            <Settings size={16} />
            <span>Ajuste</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Quantidade</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.quantidade}
          onChange={(e) => setFormData({...formData, quantidade: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data</label>
        <input 
          type="date" 
          value={formData.data_movimentacao}
          onChange={(e) => setFormData({...formData, data_movimentacao: e.target.value})}
          required
        />
      </div>

      {formData.tipo === 'in' && (
        <div className="form-group">
          <label><DollarSign size={14} /> Valor Unitário (R$)</label>
          <input 
            type="number" 
            step="0.01"
            placeholder="0.00" 
            value={formData.valor_unitario}
            onChange={(e) => setFormData({...formData, valor_unitario: e.target.value})}
            required
          />
        </div>
      )}

      <div className="form-group">
        <label><Users size={14} /> Responsável</label>
        <input 
          type="text" 
          placeholder="Nome de quem realizou..." 
          value={formData.responsavel}
          onChange={(e) => setFormData({...formData, responsavel: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> Origem / Destino</label>
        <input 
          type="text" 
          placeholder="Ex: Fornecedor X, Lote Engorda A1..." 
          value={formData.origem_destino}
          onChange={(e) => setFormData({...formData, origem_destino: e.target.value})}
          required
        />
      </div>
    </FormModal>
  );
};
