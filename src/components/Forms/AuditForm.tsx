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
  RefreshCcw,
  Building2,
  FileText,
  EyeOff
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { SearchableSelect } from './SearchableSelect';

interface AuditFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const AuditForm: React.FC<AuditFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const { applyFarmFilter } = useFarmFilter();
  
  const [warehouses, setWarehouses] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    responsible: '',
    category: 'Insumos (Sementes/Adubos)',
    description: '',
    deposito_id: '',
    motivo: 'Rotina Mensal',
    ajuste_automatico: true,
    contagem_cega: false
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchWarehouses();
    }
  }, [isOpen, activeFarm]);

  const fetchWarehouses = async () => {
    let query = supabase
      .from('depositos')
      .select('id, nome')
      .neq('status', 'inativo');
    query = applyFarmFilter(query);
    const { data } = await query;
    if (data) setWarehouses(data);
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.titulo || '',
        date: initialData.data_contagem || new Date().toISOString().split('T')[0],
        responsible: initialData.responsavel || '',
        category: initialData.categoria || 'Insumos (Sementes/Adubos)',
        description: initialData.descricao || '',
        deposito_id: initialData.deposito_id || '',
        motivo: initialData.motivo || 'Rotina Mensal',
        ajuste_automatico: initialData.ajuste_automatico !== false,
        contagem_cega: !!initialData.contagem_cega
      });
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        responsible: '',
        category: 'Insumos (Sementes/Adubos)',
        description: '',
        deposito_id: '',
        motivo: 'Rotina Mensal',
        ajuste_automatico: true,
        contagem_cega: false
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
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
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
          
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Depósito Alvo</label>
            <SearchableSelect
              value={formData.deposito_id}
              onChange={(val) => setFormData({...formData, deposito_id: val})}
              options={warehouses.map(w => ({ value: w.id, label: w.nome }))}
              placeholder="Selecione onde será a contagem..."
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Motivo da Auditoria</label>
            <select 
              className="tauze-input"
              value={formData.motivo}
              onChange={(e) => setFormData({...formData, motivo: e.target.value})}
            >
              <option value="Rotina Mensal">Rotina Mensal / Cíclico</option>
              <option value="Fechamento de Safra">Fechamento de Safra</option>
              <option value="Suspeita de Desvio">Suspeita de Desvio / Perda</option>
              <option value="Troca de Gestão">Troca de Gestão</option>
            </select>
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
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><ArrowRight size={14} /> Tipo de Ajuste Automático</label>
            <div className="tauze-form-radio-group" style={{ flexDirection: 'column', gap: '8px' }}>
              <div 
                className={`tauze-form-radio-item ${formData.ajuste_automatico ? 'active' : ''}`}
                onClick={() => setFormData({...formData, ajuste_automatico: true})} 
              >
                <RefreshCcw size={16} />
                <span>Ajustar Saldo</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${!formData.ajuste_automatico ? 'active' : ''}`}
                onClick={() => setFormData({...formData, ajuste_automatico: false})}
              >
                <ClipboardCheck size={16} />
                <span>Apenas Conferência</span>
              </div>
            </div>
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ color: '#0f172a' }}><EyeOff size={14} /> Modalidade de Contagem</label>
            <div 
              className="tauze-form-radio-item"
              style={{
                marginTop: '8px',
                background: formData.contagem_cega ? '#f8fafc' : 'white',
                border: formData.contagem_cega ? '1px solid #475569' : '1px solid hsl(var(--border))',
                cursor: 'pointer'
              }}
              onClick={() => setFormData({...formData, contagem_cega: !formData.contagem_cega})}
            >
              <input type="checkbox" checked={formData.contagem_cega} readOnly style={{ width: '18px', height: '18px', accentColor: '#334155' }} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 800, color: '#334155', fontSize: '13px' }}>Contagem Cega</span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Oculta o saldo esperado do aplicativo.</span>
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
