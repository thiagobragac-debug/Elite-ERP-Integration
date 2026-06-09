import React, { useState } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  DollarSign, 
  Calendar, 
  Building2, 
  FileText,
  CreditCard,
  Target,
  Activity,
  CheckCircle2,
  Receipt,
  MapPin,
  Barcode
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { useEffect } from 'react';
import { SearchableSelect } from './SearchableSelect';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'payable' | 'receivable';
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({isOpen, onClose, type, onSubmit, initialData, actionId }) => {
  const { activeFarm, activeTenantId } = useTenant();
  const [formData, setFormData] = usePersistentState('TransactionForm_formData', {
    description: '',
    value: '',
    dueDate: '',
    issueDate: '',
    documentNumber: '',
    category: '',
    costCenter: '',
    entityId: '', 
    paymentMethod: 'Boleto',
    status: 'PENDENTE'
  });

  const [entities, setEntities] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (isOpen && activeTenantId) {
      fetchEntities();
      fetchCategories();
    }
  }, [isOpen, activeTenantId]);

  const fetchEntities = async () => {
    let query = supabase.from('parceiros').select('id, nome').eq('tenant_id', activeTenantId);
    if (type === 'payable') {
      query = query.eq('is_supplier', true);
    } else {
      query = query.eq('is_customer', true);
    }
    const { data } = await query;
    if (data) setEntities(data);
  };

  const fetchCategories = async () => {
    if (!activeTenantId) return;
    const { data } = await supabase
      .from('categorias_sistema')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .eq('modulo', 'financeiro')
      .eq('is_active', true)
      .order('nome');
    if (data) setCategories(data);
  };

  const handleCategoriaChange = async (val: string) => {
    setFormData({ ...formData, category: val });
    if (val && val.trim().length > 0 && !categories.find(c => String(c.nome) === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'financeiro',
          nome: val.trim(),
          is_active: true
        });
        fetchCategories();
      } catch (err) {
        console.error('[TransactionForm] Erro ao criar categoria:', err);
      }
    }
  };

  React.useEffect(() => {
    if (initialData) { setFormData({
        description: initialData.descricao || '',
        value: initialData.valor_total?.toString() || '',
        dueDate: initialData.data_vencimento || '',
        issueDate: initialData.data_emissao || '',
        documentNumber: initialData.documento || '',
        category: initialData.categoria || '',
        costCenter: initialData.centro_custo || '',
        entityId: initialData.parceiro_id || initialData.parceiro_id || '',
        paymentMethod: initialData.metodo_pagamento || initialData.metodo_recebimento || 'Boleto',
        status: initialData.status || 'PENDENTE'
      });
    } else {
      setFormData({
        description: '',
        value: '',
        dueDate: '',
        issueDate: '',
        documentNumber: '',
        category: '',
        costCenter: '',
        entityId: '',
        paymentMethod: 'Boleto',
        status: 'PENDENTE'
      });
    }
  }, [initialData, isOpen, actionId]);

  const title = initialData 
    ? (type === 'payable' ? 'Editar Conta a Pagar' : 'Editar Conta a Receber')
    : (type === 'payable' ? 'Nova Conta a Pagar' : 'Nova Conta a Receber');
    
  const subtitle = type === 'payable' ? 'Registre uma saída de caixa para fornecedores.' : 'Registre uma entrada de caixa de parceiros.';
  const entityLabel = type === 'payable' ? 'Parceiro' : 'Parceiro';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, type: type === 'receivable' ? 'inflow' : 'outflow' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={title}
      subtitle={subtitle}
      icon={DollarSign}
      loading={loading}
      submitLabel={`Registrar ${type === 'payable' ? 'Despesa' : 'Receita'}`}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação do Lançamento</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Descrição da Transação</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder={type === 'payable' ? "Ex: Compra de Farelo de Soja" : "Ex: Venda de 1000 sc de Soja"} 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required 
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><DollarSign size={14} /> Valor (R$)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01" 
              placeholder="0.00" 
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Competência (Emissão)</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.issueDate}
              onChange={(e) => setFormData({...formData, issueDate: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data de Vencimento</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              required 
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Receipt size={14} /> Documento Fiscal / Contrato (NF-e, CPR, Boleto)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: NF 123456 / Linha Digitável" 
              value={formData.documentNumber}
              onChange={(e) => setFormData({...formData, documentNumber: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Classificação e Origem</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> {entityLabel}</label>
            <SearchableSelect 
              value={formData.entityId}
              onChange={(val: any) => setFormData({...formData, entityId: val})}
              options={[
                { value: '', label: `Selecionar ${entityLabel.toLowerCase()}...` },
                ...(entities || []).map(e => ({ value: String(e.id), label: String(e.nome) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Target size={14} /> Plano de Contas (Categoria)</label>
            <SearchableSelect 
              value={formData.category}
              onChange={handleCategoriaChange}
              options={[
                { value: '', label: 'Selecionar...' },
                ...(categories || []).map(cat => ({ value: String(cat.nome), label: String(cat.nome) })),
              ]}
              creatable={true}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Centro de Custo (Local)</label>
            <SearchableSelect 
              value={formData.costCenter}
              onChange={(val: any) => setFormData({...formData, costCenter: val})}
              options={[
                { value: '', label: 'Nenhum / Global' },
                { value: 'Fazenda Santa Clara', label: 'Fazenda Santa Clara' },
                { value: 'Silo Central', label: 'Silo Central' },
                { value: 'Frota Pesada', label: 'Frota Pesada' },
                { value: 'Talhão 01', label: 'Talhão 01' },
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Pagamento e Status</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><CreditCard size={14} /> Forma de Pagamento</label>
            <SearchableSelect 
              value={formData.paymentMethod}
              onChange={(val: any) => setFormData({...formData, paymentMethod: val})}
              options={[
                { value: 'Boleto', label: 'Boleto' },
                { value: 'PIX', label: 'PIX' },
                { value: 'Transferência', label: 'Transferência' },
                { value: 'Cartão', label: 'Cartão' },
                { value: 'Dinheiro', label: 'Dinheiro' },
              ]}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Situação do Lançamento</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.status === 'PENDENTE' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'PENDENTE'})}
              >
                <Calendar size={16} />
                <span>Pendente</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'PAGO' || formData.status === 'RECEBIDO' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: type === 'payable' ? 'PAGO' : 'RECEBIDO'})}
              >
                <CheckCircle2 size={16} />
                <span>{type === 'payable' ? 'Pago' : 'Recebido'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
