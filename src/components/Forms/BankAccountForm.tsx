import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard,
  Hash,
  Info,
  Activity
} from 'lucide-react';
import { FormModal } from './FormModal';

interface BankAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo: 'CORRENTE',
    saldo_inicial: '0',
    descricao: ''
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        banco: initialData.banco || '',
        agencia: initialData.agencia || '',
        conta: initialData.conta || '',
        tipo: initialData.tipo || 'CORRENTE',
        saldo_inicial: initialData.saldo_atual?.toString() || '0',
        descricao: initialData.descricao || ''
      });
    } else {
      setFormData({
        banco: '',
        agencia: '',
        conta: '',
        tipo: 'CORRENTE',
        saldo_inicial: '0',
        descricao: ''
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
      title={initialData ? "Editar Conta" : "Nova Conta Bancária"}
      subtitle="Cadastre suas contas para conciliação e fluxo de caixa."
      icon={Building2}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Conta"}
    >
      <div className="form-group full-width">
        <label><Building2 size={14} /> Banco / Instituição</label>
        <input 
          type="text" 
          placeholder="Ex: Banco do Brasil, Itaú, Sicredi..." 
          value={formData.banco}
          onChange={(e) => setFormData({...formData, banco: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Agência</label>
        <input 
          type="text" 
          placeholder="0000" 
          value={formData.agencia}
          onChange={(e) => setFormData({...formData, agencia: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Hash size={14} /> Número da Conta</label>
        <input 
          type="text" 
          placeholder="00000-0" 
          value={formData.conta}
          onChange={(e) => setFormData({...formData, conta: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Activity size={14} /> Tipo de Conta</label>
        <div className="elite-form-radio-group">
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'CORRENTE' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'CORRENTE'})}
          >
            <CreditCard size={16} />
            <span>Corrente</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'POUPANCA' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'POUPANCA'})}
          >
            <Building2 size={16} />
            <span>Poupança</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'INVESTIMENTO' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'INVESTIMENTO'})}
          >
            <Activity size={16} />
            <span>Invest.</span>
          </div>
          <div 
            className={`elite-form-radio-item ${formData.tipo === 'CAIXA' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'CAIXA'})}
          >
            <Hash size={16} />
            <span>Caixa</span>
          </div>
        </div>
      </div>

      <div className="form-group">
        <label><CreditCard size={14} /> Saldo Inicial (R$)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0,00" 
          value={formData.saldo_inicial}
          onChange={(e) => setFormData({...formData, saldo_inicial: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><Info size={14} /> Descrição / Apelido</label>
        <input 
          type="text" 
          placeholder="Ex: Conta Principal - Movimentação Agro" 
          value={formData.descricao}
          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
        />
      </div>
    </FormModal>
  );
};
