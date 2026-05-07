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
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

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
        final_balance: initialData.saldo_final?.toString() || ''
      });
    } else {
      setFormData({
        account_id: '',
        period: 'Mês Atual',
        file: null,
        initial_balance: '',
        final_balance: ''
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchAccounts();
    }
  }, [isOpen, activeFarm]);

  const fetchAccounts = async () => {
    const { data } = await supabase.from('contas_bancarias').select('id, nome').eq('fazenda_id', activeFarm.id);
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
    <FormModal
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
        <select 
          value={formData.account_id}
          onChange={(e) => setFormData({...formData, account_id: e.target.value})}
          required
        >
          <option value="">Selecione a conta...</option>
          {accounts.map(a => (
            <option key={a.id} value={a.id}>{a.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><Calendar size={14} /> Período do Extrato</label>
        <select 
          value={formData.period}
          onChange={(e) => setFormData({...formData, period: e.target.value})}
          required
        >
          <option>Mês Atual</option>
          <option>Mês Anterior</option>
          <option>Personalizado</option>
        </select>
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
        <div className="elite-form-info-box" style={{ justifyContent: 'center', flexDirection: 'column', padding: '32px', borderStyle: 'dashed', cursor: 'pointer' }}>
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

      <div className="form-group full-width elite-form-info-box">
        <CheckCircle2 size={24} style={{ color: 'hsl(var(--brand))' }} />
        <p>
          <strong>IA Automática:</strong> Nosso motor de IA tentará identificar e sugerir conciliações baseadas no histórico de transações.
        </p>
      </div>
    </FormModal>
  );
};
