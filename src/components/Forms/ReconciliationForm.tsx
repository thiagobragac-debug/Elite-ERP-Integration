import React, { useState, useEffect } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

import {
  RefreshCcw,
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';

interface ReconciliationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const ReconciliationForm: React.FC<ReconciliationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeFarm, activeTenantId } = useTenant();

  const INITIAL_RECONCILIATION_FORM = {
    account_id: '',
    period: 'Mês Atual',
    file: null as any,
    initial_balance: '',
    final_balance: '',
    data_inicio: '',
    data_fim: '',
    observacoes: '',
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `reconciliation_form_${activeTenantId}`,
    initialState: INITIAL_RECONCILIATION_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData({
      account_id: initialData.conta_id || '',
      period: initialData.periodo || 'Mês Atual',
      file: null,
      initial_balance: initialData.saldo_inicial?.toString() || '',
      final_balance: initialData.saldo_final?.toString() || '',
      data_inicio: initialData.data_inicio || '',
      data_fim: initialData.data_fim || '',
      observacoes: initialData.observacoes || '',
    });
  }, [initialData, isOpen, actionId]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchAccounts();
    }
  }, [isOpen, activeFarm]);

  const fetchAccounts = async () => {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, banco')
      .eq('tenant_id', activeFarm?.tenantId || '');
    if (data) {
      setAccounts(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Conciliação' : 'Nova Conciliação Bancária'}
      subtitle="Importe o extrato OFX/CSV e concilie com o seu financeiro."
      icon={RefreshCcw}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Processar Extrato'}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação e Período</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <CreditCard size={14} /> Conta Bancária
            </label>
            <SearchableSelect
              value={formData.account_id}
              onChange={(val: any) => setFormData({ ...formData, account_id: val })}
              options={[
                { value: '', label: 'Selecione a conta...' },
                ...(accounts || []).map((a) => ({ value: String(a.id), label: String(a.banco) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Período do Extrato
            </label>
            <SearchableSelect
              value={formData.period}
              onChange={(val: any) => setFormData({ ...formData, period: val })}
              options={[
                { value: 'Mês Atual', label: 'Mês Atual' },
                { value: 'Mês Anterior', label: 'Mês Anterior' },
                { value: 'Personalizado', label: 'Personalizado' },
              ]}
            />
          </div>
        </div>

        {formData.period === 'Personalizado' && (
          <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Calendar size={14} /> Data Início
              </label>
              <DateInput
                className="tauze-input"
                type="date"
                value={formData.data_inicio}
                onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                required
              />
            </div>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Calendar size={14} /> Data Fim
              </label>
              <DateInput
                className="tauze-input"
                type="date"
                value={formData.data_fim}
                onChange={(e) => setFormData({ ...formData, data_fim: e.target.value })}
                required
              />
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Importação e Saldos</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Importar Arquivo (OFX, CSV ou Excel)
            </label>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '32px',
                border: '1px dashed hsl(var(--border))',
                borderRadius: '12px',
                background: 'hsl(var(--bg-main)/0.5)',
                cursor: 'pointer',
              }}
            >
              <p style={{ textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                Clique ou arraste o arquivo aqui para upload.
              </p>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px' }}>
                Formatos aceitos: .ofx, .csv, .xlsx
              </span>
            </div>
          </div>
        </div>
        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <DollarSign size={14} /> Saldo Inicial do Período
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={formData.initial_balance}
              onChange={(e) => setFormData({ ...formData, initial_balance: e.target.value })}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <DollarSign size={14} /> Saldo Final do Período
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              placeholder="R$ 0,00"
              value={formData.final_balance}
              onChange={(e) => setFormData({ ...formData, final_balance: e.target.value })}
              required
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Informações Adicionais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Observações do Fechamento
            </label>
            <textarea
              className="tauze-input tauze-textarea"
              placeholder="Notas sobre divergências aceitáveis ou justificativas de ajuste..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              style={{ minHeight: '80px' }}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '16px',
              borderRadius: '12px',
              background: 'hsl(var(--brand)/0.05)',
              border: '1px solid hsl(var(--brand)/0.2)',
            }}
          >
            <CheckCircle2 size={24} style={{ color: 'hsl(var(--brand))', flexShrink: 0 }} />
            <p
              style={{
                margin: 0,
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'hsl(var(--text-main))',
              }}
            >
              <strong style={{ color: 'hsl(var(--brand))' }}>IA Automática:</strong> Nosso motor de
              IA tentará identificar e sugerir conciliações baseadas no histórico de transações.
            </p>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
