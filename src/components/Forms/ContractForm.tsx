import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User,
  Calendar,
  DollarSign,
  Briefcase,
  ShieldCheck,
  Building2,
  FileDigit,
  Maximize,
  Hash,
  Settings,
  Users
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface ContractFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ContractForm: React.FC<ContractFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    contract_number: '',
    type: 'Venda de Gado (Futuro)',
    party_id: '', 
    party_type: 'client', 
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    total_value: '',
    status: 'active',
    description: ''
  });

  const [parties, setParties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contract_number: initialData.numero_contrato || '',
        type: initialData.tipo || 'Venda de Gado (Futuro)',
        party_id: initialData.participante_id || '',
        party_type: initialData.tipo_participante || 'client',
        start_date: initialData.data_inicio || new Date().toISOString().split('T')[0],
        end_date: initialData.data_fim || '',
        total_value: initialData.valor_total?.toString() || '',
        status: initialData.status || 'active',
        description: initialData.descricao || ''
      });
    } else {
      setFormData({
        contract_number: '',
        type: 'Venda de Gado (Futuro)',
        party_id: '',
        party_type: 'client',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        total_value: '',
        status: 'active',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchParties();
    }
  }, [isOpen, activeFarm, formData.party_type]);

  const fetchParties = async () => {
    const table = 'parceiros';
    const { data } = await supabase.from(table).select('id, nome').eq('fazenda_id', activeFarm?.id || '');
    if (data) setParties(data);
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
      title={initialData ? "Editar Contrato" : "Novo Contrato / Hedge"}
      subtitle="Formalize contratos de compra, venda ou proteção de preços (Hedge)."
      icon={FileText}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Registrar Contrato"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados Gerais do Contrato</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número do Contrato</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: CNT-2024-088..." 
              value={formData.contract_number}
              onChange={(e) => setFormData({...formData, contract_number: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Settings size={14} /> Tipo de Contrato</label>
            <SearchableSelect 
              value={formData.type}
              onChange={(val: any) => setFormData({...formData, type: val})}
              options={[
                { value: 'Venda de Gado (Futuro)', label: 'Venda de Gado (Futuro)' },
                { value: 'Compra de Grãos (Barter)', label: 'Compra de Grãos (Barter)' },
                { value: 'Arrendamento de Terras', label: 'Arrendamento de Terras' },
                { value: 'Hedge / Derivativos', label: 'Hedge / Derivativos' },
                { value: 'Prestação de Serviço', label: 'Prestação de Serviço' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Users size={14} /> Tipo de Participante</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.party_type === 'client' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, party_type: 'client'})}
              >
                <User size={16} />
                <span>Parceiro (Cliente)</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.party_type === 'supplier' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, party_type: 'supplier'})}
              >
                <Building2 size={16} />
                <span>Parceiro (Fornecedor)</span>
              </div>
            </div>
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Participante</label>
            <SearchableSelect 
              value={formData.party_id}
              onChange={(val: any) => setFormData({...formData, party_id: val})}
              options={[
                { value: '', label: 'Selecione...' },
                ...(parties || []).map(p => ({ value: String(p.id), label: String(p.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor Total do Contrato (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="0.00" 
              value={formData.total_value}
              onChange={(e) => setFormData({...formData, total_value: e.target.value})}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Prazos e Quantidades</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data Início</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.start_date}
              onChange={(e) => setFormData({...formData, start_date: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data Término / Vencimento</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.end_date}
              onChange={(e) => setFormData({...formData, end_date: e.target.value})}
              required
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Maximize size={14} /> Volume / Quantidade</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: 500 cabeças, 10.000 sacas..." 
              onChange={(e) => setFormData({...formData, description: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Detalhes do Contrato</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Cláusulas Principais / Detalhes</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Descreva as condições de entrega, multas e garantias..." 
              rows={3}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
