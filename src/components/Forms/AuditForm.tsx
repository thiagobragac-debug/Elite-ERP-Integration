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
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

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
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Inventário" : "Novo Inventário / Auditoria"}
      subtitle="Inicie um processo de contagem física para ajuste de saldo de estoque."
      icon={ClipboardCheck}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Iniciar Contagem"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação da Auditoria</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><ClipboardCheck size={14} /> Título do Inventário</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Inventário Geral - Almoxarifado Central..." 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data da Contagem</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><User size={14} /> Responsável</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Nome do conferente..." 
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
          <h4 className="tauze-section-title">Escopo e Regras</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Categoria de Itens</label>
            <SearchableSelect 
              value={formData.category}
              onChange={(val: any) => setFormData({...formData, category: val})}
              options={[
                { value: 'Insumos (Sementes/Adubos)', label: 'Insumos (Sementes/Adubos)' },
                { value: 'Veterinária (Medicamentos)', label: 'Veterinária (Medicamentos)' },
                { value: 'Nutrição (Rações/Suplementos)', label: 'Nutrição (Rações/Suplementos)' },
                { value: 'Peças & Oficina', label: 'Peças & Oficina' },
                { value: 'Combustíveis', label: 'Combustíveis' },
                { value: 'Todos os Itens', label: 'Todos os Itens' },
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><ArrowRight size={14} /> Tipo de Ajuste Automático</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.category !== 'conf' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, category: 'Insumos'})} 
              >
                <RefreshCcw size={16} />
                <span>Ajustar Saldo</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.category === 'conf' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, category: 'conf'})}
              >
                <ClipboardCheck size={16} />
                <span>Apenas Conferência</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Detalhes e Instruções</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><Search size={14} /> Instruções para a Equipe</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Ex: Contar todas as sacarias fechadas. Verificar lotes de vacinas no refrigerador..." 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
        
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #ffedd5' }}>
            <AlertTriangle size={24} style={{ color: '#ea580c', flexShrink: 0 }} />
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: '#9a3412' }}>
              <strong>Atenção:</strong> Ao iniciar, o estoque atual será "congelado" para fins de comparativo até a finalização do inventário.
            </p>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
