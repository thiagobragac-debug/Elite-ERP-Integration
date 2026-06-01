import React, { useState, useEffect } from 'react';
import { 
  RefreshCcw, 
  CreditCard,
  Calendar,
  FileText,
  DollarSign,
  Search,
  CheckCircle2,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface ReconciliationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const ReconciliationForm: React.FC<ReconciliationFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = useState({
    account_id: '',
    period: 'Mês Atual',
    file: null as any,
    initial_balance: '',
    final_balance: '',
    data_inicio: '',
    data_fim: '',
    observacoes: ''
  });

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        account_id: initialData.conta_id || '',
        period: initialData.periodo || 'Mês Atual',
        file: null,
        initial_balance: initialData.saldo_inicial?.toString() || '',
        final_balance: initialData.saldo_final?.toString() || '',
        data_inicio: initialData.data_inicio || '',
        data_fim: initialData.data_fim || '',
        observacoes: initialData.observacoes || ''
      });
    } else {
      setFormData({
        account_id: '',
        period: 'Mês Atual',
        file: null,
        initial_balance: '',
        final_balance: '',
        data_inicio: '',
        data_fim: '',
        observacoes: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchAccounts();
    }
  }, [isOpen, activeFarm]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('contas_bancarias').select('id, banco').eq('tenant_id', activeFarm?.tenantId || '');
    if (data) setAccounts(data);
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
      title={initialData ? "Editar Conciliação" : "Nova Conciliação Bancária"}
      subtitle="Importe o extrato OFX/CSV e concilie com o seu financeiro."
      icon={RefreshCcw}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Processar Extrato"}
    >
      <div className="form-group">
        <label><CreditCard size={14} /> Conta Bancária</label>
                <SearchableSelect 
          value={formData.account_id}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: ``, label: `Selecione a conta...` },
            { value: `{a.banco}`, label: `{a.banco}` },
            ...(accounts || []).map(a => ({ value: String(a.id), label: String(a.banco) })),
          ]}
        />
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Período do Extrato</label>
                <SearchableSelect 
          value={formData.period}
          onChange={(val: any) => { /* TODO: adjust */ }}
          options={[
            { value: `Mês Atual`, label: `Mês Atual` },
            { value: `Mês Anterior`, label: `Mês Anterior` },
            { value: `Personalizado`, label: `Personalizado` },
          ]}
        />
      </div>

      {formData.period === 'Personalizado' && (
        <>
          <div className="form-group">
            <label><Calendar size={14} /> Data Início</label>
            <input 
              type="date" 
              value={formData.data_inicio}
              onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
              required 
            />
          </div>
          <div className="form-group">
            <label><Calendar size={14} /> Data Fim</label>
            <input 
              type="date" 
              value={formData.data_fim}
              onChange={(e) => setFormData({...formData, data_fim: e.target.value})}
              required 
            />
          </div>
        </>
      )}

      <div className="form-group full-width">
        <label><FileText size={14} /> Importar Arquivo (OFX, CSV ou Excel)</label>
        <div className="tauze-form-info-box" style={{ justifyContent: 'center', flexDirection: 'column', padding: '32px', borderStyle: 'dashed', cursor: 'pointer' }}>
          <p style={{ textAlign: 'center' }}>
            Clique ou arraste o arquivo aqui para upload.
          </p>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Formatos aceitos: .ofx, .csv, .xlsx</span>
        </div>
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Saldo Inicial do Período</label>
        <input 
          type="number" 
          step="0.01" 
          placeholder="R$ 0,00"
          value={formData.initial_balance}
          onChange={(e) => setFormData({...formData, initial_balance: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><DollarSign size={14} /> Saldo Final do Período</label>
        <input 
          type="number" 
          step="0.01" 
          placeholder="R$ 0,00"
          value={formData.final_balance}
          onChange={(e) => setFormData({...formData, final_balance: e.target.value})}
          required 
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações do Fechamento</label>
        <textarea 
          placeholder="Notas sobre divergências aceitáveis ou justificativas de ajuste..." 
          value={formData.observacoes}
          onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
          style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>

      <div className="form-group full-width tauze-form-info-box">
        <CheckCircle2 size={24} style={{ color: 'hsl(var(--brand))' }} />
        <p>
          <strong>IA Automática:</strong> Nosso motor de IA tentará identificar e sugerir conciliações baseadas no histórico de transações.
        </p>
      </div>
    </SidePanel>
  );
};
