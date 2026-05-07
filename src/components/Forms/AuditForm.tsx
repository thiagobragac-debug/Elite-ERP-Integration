import React, { useState, useEffect } from 'react';
import { 
  Package, 
  ClipboardCheck,
  Calendar,
  User,
  Layers,
  Search,
  AlertTriangle,
  ArrowRight,
  RefreshCcw
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface AuditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const AuditForm: React.FC<AuditFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    responsible: '',
    category: 'Insumos',
    description: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.titulo || '',
        date: initialData.data_contagem || new Date().toISOString().split('T')[0],
        responsible: initialData.responsavel || '',
        category: initialData.categoria || 'Insumos',
        description: initialData.descricao || ''
      });
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        category: 'Insumos',
        description: ''
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
      title={initialData ? "Editar Inventário" : "Novo Inventário / Auditoria"}
      subtitle="Inicie um processo de contagem física para ajuste de saldo de estoque."
      icon={ClipboardCheck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Iniciar Contagem"}
    >
      <div className="form-group full-width">
        <label><ClipboardCheck size={14} /> Título do Inventário</label>
        <input 
          type="text" 
          placeholder="Ex: Inventário Geral - Almoxarifado Central..." 
          value={formData.title}
          onChange={(e) => setFormData({...formData, title: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Data da Contagem</label>
        <input 
          type="date" 
          value={formData.date}
          onChange={(e) => setFormData({...formData, date: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><User size={14} /> Responsável</label>
        <input 
          type="text" 
          placeholder="Nome do conferente..." 
          value={formData.responsible}
          onChange={(e) => setFormData({...formData, responsible: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Layers size={14} /> Categoria de Itens</label>
        <select 
          value={formData.category}
          onChange={(e) => setFormData({...formData, category: e.target.value})}
          required
        >
          <option>Insumos (Sementes/Adubos)</option>
          <option>Veterinária (Medicamentos)</option>
          <option>Nutrição (Rações/Suplementos)</option>
          <option>Peças & Oficina</option>
          <option>Combustíveis</option>
          <option>Todos os Itens</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><ArrowRight size={14} /> Tipo de Ajuste Automático</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.category !== 'conf' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, category: 'Insumos'})} 
          >
            <RefreshCcw size={16} />
            <span>Ajustar Saldo</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.category === 'conf' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, category: 'conf'})}
          >
            <ClipboardCheck size={16} />
            <span>Apenas Conferência</span>
          </div>
        </div>
      </div>

      <div className="form-group full-width">
        <label><Search size={14} /> Instruções para a Equipe</label>
        <textarea 
          placeholder="Ex: Contar todas as sacarias fechadas. Verificar lotes de vacinas no refrigerador..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>

      <div className="form-group full-width elite-form-info-box">
        <AlertTriangle size={24} style={{ color: '#ed6c02' }} />
        <p>
          <strong>Atenção:</strong> Ao iniciar, o estoque atual será "congelado" para fins de comparativo até a finalização do inventário.
        </p>
      </div>
    </FormModal>
  );
};
