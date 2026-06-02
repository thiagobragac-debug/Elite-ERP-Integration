import { SearchableSelect } from './SearchableSelect';
import React, { useState } from 'react';
import { 
  Building2, 
  CreditCard,
  Hash,
  Info,
  Activity,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { useTenant } from '../../contexts/TenantContext';

interface BankAccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const BankAccountForm: React.FC<BankAccountFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { companies, activeCompany } = useTenant();
  
  const [formData, setFormData] = useState({
    banco: '',
    agencia: '',
    conta: '',
    tipo: 'CORRENTE',
    saldo_inicial: '0',
    limite_credito: '0',
    benchmark_rendimento: '',
    descricao: '',
    unidade_id: activeCompany?.id || null as string | null,
    is_global: false
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
        limite_credito: initialData.limite_credito?.toString() || '0',
        benchmark_rendimento: initialData.benchmark_rendimento || '',
        descricao: initialData.descricao || '',
        unidade_id: initialData.is_global ? null : (initialData.unidade_id || activeCompany?.id || null),
        is_global: initialData.is_global || false
      });
    } else {
      setFormData({
        banco: '',
        agencia: '',
        conta: '',
        tipo: 'CORRENTE',
        saldo_inicial: '0',
        limite_credito: '0',
        benchmark_rendimento: '',
        descricao: '',
        unidade_id: activeCompany?.id || null,
        is_global: false
      });
    }
  }, [initialData, isOpen, activeCompany]);

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
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Conta" : "Nova Conta Bancária"}
      subtitle="Cadastre suas contas para conciliação e fluxo de caixa."
      icon={Building2}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Conta"}
      size="medium"
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Conta</h4>
        </div>
        
        <div className="tauze-field-group full-width">
          <label className="tauze-label"><Building2 size={14} /> Vinculação (CNPJ / Empresa)</label>
          <SearchableSelect 
            value={formData.is_global ? 'GLOBAL' : (formData.unidade_id || '')}
            onChange={(val: any) => {
              if (val === 'GLOBAL') {
                setFormData({...formData, is_global: true, unidade_id: null});
              } else {
                setFormData({...formData, is_global: false, unidade_id: val});
              }
            }}
            options={[
              { value: 'GLOBAL', label: 'Uso Global (Todos os CNPJs do Grupo)' },
              ...companies.map((c: any) => ({ value: String(c.id), label: `${c.name} - ${c.document}` }))
            ]}
          />
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Banco / Instituição</label>
            <input 
              type="text" 
              className="tauze-input"
              placeholder="Ex: Banco do Brasil, Itaú..." 
              value={formData.banco}
              onChange={(e) => setFormData({...formData, banco: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Agência</label>
            <input 
              type="text" 
              className="tauze-input"
              placeholder="0000" 
              value={formData.agencia}
              onChange={(e) => setFormData({...formData, agencia: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Número da Conta</label>
            <input 
              type="text" 
              className="tauze-input"
              placeholder="00000-0" 
              value={formData.conta}
              onChange={(e) => setFormData({...formData, conta: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Info size={14} /> Descrição / Apelido</label>
            <input 
              type="text" 
              className="tauze-input"
              placeholder="Ex: Conta Principal" 
              value={formData.descricao}
              onChange={(e) => setFormData({...formData, descricao: e.target.value})}
            />
          </div>
        </div>

        <div className="tauze-field-group full-width">
          <label className="tauze-label"><Activity size={14} /> Tipo de Conta</label>
          <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            <div 
              className={`tauze-form-radio-item ${formData.tipo === 'CORRENTE' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, tipo: 'CORRENTE'})}
            >
              <CreditCard size={16} />
              <span>Corrente</span>
            </div>
            <div 
              className={`tauze-form-radio-item ${formData.tipo === 'POUPANCA' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, tipo: 'POUPANCA'})}
            >
              <Building2 size={16} />
              <span>Poupança</span>
            </div>
            <div 
              className={`tauze-form-radio-item ${formData.tipo === 'INVESTIMENTO' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, tipo: 'INVESTIMENTO'})}
            >
              <Activity size={16} />
              <span>Invest.</span>
            </div>
            <div 
              className={`tauze-form-radio-item ${formData.tipo === 'CAIXA' ? 'active' : ''}`}
              onClick={() => setFormData({...formData, tipo: 'CAIXA'})}
            >
              <Hash size={16} />
              <span>Caixa</span>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Configurações Financeiras</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><CreditCard size={14} /> Saldo Inicial (R$)</label>
            <input 
              type="number" 
              step="0.01"
              className="tauze-input"
              placeholder="0,00" 
              value={formData.saldo_inicial}
              onChange={(e) => setFormData({...formData, saldo_inicial: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><ShieldCheck size={14} /> Limite de Crédito (R$)</label>
            <input 
              type="number" 
              step="0.01"
              className="tauze-input"
              placeholder="0,00" 
              value={formData.limite_credito}
              onChange={(e) => setFormData({...formData, limite_credito: e.target.value})}
            />
          </div>

          <div className="tauze-field-group full-width">
            <label className="tauze-label"><TrendingUp size={14} /> Benchmark Rendimento</label>
            <select 
              className="tauze-input"
              value={formData.benchmark_rendimento}
              onChange={(e) => setFormData({...formData, benchmark_rendimento: e.target.value})}
            >
              <option value="">Nenhum</option>
              <option value="100% CDI">100% CDI</option>
              <option value="95% CDI">95% CDI</option>
              <option value="Poupança">Poupança</option>
              <option value="IPCA+">IPCA+</option>
            </select>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
