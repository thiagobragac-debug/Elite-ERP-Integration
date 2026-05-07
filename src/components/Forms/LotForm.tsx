import React, { useState } from 'react';
import { 
  Layers,
  FileText,
  MapPin,
  TrendingUp,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { FormModal } from './FormModal';

interface LotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const LotForm: React.FC<LotFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    status: 'ATIVO',
    capacidade: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim_prevista: '',
    gmd_alvo: '',
    peso_alvo: ''
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        descricao: initialData.descricao || '',
        status: initialData.status || 'ATIVO',
        capacidade: initialData.capacidade?.toString() || '',
        data_inicio: initialData.data_inicio || new Date().toISOString().split('T')[0],
        data_fim_prevista: initialData.data_fim_prevista || '',
        gmd_alvo: initialData.gmd_alvo?.toString() || '',
        peso_alvo: initialData.peso_alvo?.toString() || ''
      });
    }
  }, [initialData, isOpen]);

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
      title={initialData ? "Editar Lote" : "Novo Lote de Animais"}
      subtitle="Organize seu rebanho em lotes para melhor gestão."
      icon={Layers}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Lote"}
    >
      <div className="form-group full-width">
        <label><Layers size={14} /> Nome do Lote</label>
        <input 
          type="text" 
          placeholder="Ex: LOTE-ENGORDA-01" 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Data de Início</label>
        <input 
          type="date" 
          value={formData.data_inicio}
          onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Previsão de Término</label>
        <input 
          type="date" 
          value={formData.data_fim_prevista}
          onChange={(e) => setFormData({...formData, data_fim_prevista: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><TrendingUp size={14} /> GMD Alvo (kg/dia)</label>
        <input 
          type="number" 
          step="0.001"
          placeholder="Ex: 1.200" 
          value={formData.gmd_alvo}
          onChange={(e) => setFormData({...formData, gmd_alvo: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><TrendingUp size={14} /> Peso de Saída Alvo (kg)</label>
        <input 
          type="number" 
          placeholder="Ex: 550" 
          value={formData.peso_alvo}
          onChange={(e) => setFormData({...formData, peso_alvo: e.target.value})}
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Descrição / Observação</label>
        <textarea 
          placeholder="Detalhes sobre a finalidade deste lote..." 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
          rows={3}
        />
      </div>

      <div className="form-group">
        <label><TrendingUp size={14} /> Capacidade (Cab.)</label>
        <input 
          type="number" 
          placeholder="Quantidade máxima" 
          value={formData.capacidade}
          onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
        />
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status Inicial</label>
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="ATIVO">Ativo</option>
          <option value="FINALIZADO">Finalizado / Encerrado</option>
        </select>
      </div>
    </FormModal>
  );
};
