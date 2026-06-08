import React, { useState, useMemo, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  FileText, 
  User, 
  Building2, 
  Calendar, 
  AlertCircle, 
  DollarSign,
  ClipboardList,
  UploadCloud,
  Layers,
  Target
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { InsumoEntryTable } from './InsumoEntryTable';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import toast from 'react-hot-toast';

interface PurchaseRequestFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const PurchaseRequestForm: React.FC<PurchaseRequestFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeCompany, companies } = useTenant();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(initialData?.items || []);

  const [formData, setFormData] = usePersistentState('PurchaseRequestForm_formData', {
    company_id: initialData?.company_id || activeCompany?.id || '',
    title: initialData?.title || '',
    requester: initialData?.requester || '',
    cost_center: initialData?.cost_center || '',
    project: initialData?.project || '',
    deadline: initialData?.deadline || new Date().toISOString().split('T')[0],
    priority: initialData?.priority || 'medium',
    justification: initialData?.justification || ''
  });

  // Reseta todo o estado ao fechar o painel (evita dados do último lançamento persistirem)
  useEffect(() => {
    if (!isOpen && !initialData) {
      setItems([]);
      setFormData({
        company_id: activeCompany?.id || '',
        title: '',
        requester: '',
        cost_center: '',
        project: '',
        deadline: new Date().toISOString().split('T')[0],
        priority: 'medium',
        justification: ''
      });
    }
  }, [isOpen]);

  // Cálculo automático do valor total baseado nos itens (Regra de Negócio de Compras)
  const totalEstimatedValue = useMemo(() => {
    return items.reduce((acc, item) => {
      // Considerando que o InsumoEntryTable tem os campos quantidade e preco_unitario ou similares
      const qty = Number(item.quantidade || item.quantity || 0);
      const price = Number(item.preco_unitario || item.valor_unitario || item.unit_price || 0);
      return acc + (qty * price);
    }, 0);
  }, [items]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Regra de Negócio Avançada: Bloqueio de pedidos urgentes sem justificativa
    if ((formData.priority === 'high' || formData.priority === 'urgent') && !formData.justification.trim()) {
      toast.error("Obrigatório informar a justificativa para prioridades Alta ou Urgente.");
      return;
    }

    if (items.length === 0) {
      toast.error("A solicitação precisa ter pelo menos um item adicionado.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ 
        ...formData, 
        estimated_value: totalEstimatedValue,
        items 
      });
      toast.success("Solicitação salva com sucesso!");
      onClose();
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error("Erro ao salvar a solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Solicitação de Compra" : "Nova Solicitação de Compra"}
      subtitle="Crie uma nova requisição detalhada para envio à Controladoria."
      icon={ClipboardList}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Enviar Solicitação"}
      size="large"
    >
      {/* PASSO 01: CLASSIFICAÇÃO E JUSTIFICATIVA */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Classificação e Motivo</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa / Unidade Solicitante</label>
            <SearchableSelect 
              value={formData.company_id}
              onChange={(val: any) => setFormData({...formData, company_id: val})}
              options={[
                { value: '', label: 'Selecione a empresa...' },
                ...(companies || []).map(c => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Título da Solicitação</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Compra de Defensivos Safra 2026..." 
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required 
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><User size={14} /> Requerente</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Nome do Solicitante"
              value={formData.requester}
              onChange={(e) => setFormData({...formData, requester: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Centro de Custo</label>
            <SearchableSelect 
              value={formData.cost_center}
              onChange={(val: any) => setFormData({...formData, cost_center: val})}
              options={[
                { value: '', label: 'Selecione o centro...' },
                { value: 'Manutenção Frota', label: 'Manutenção Frota' },
                { value: 'Lavoura/Plantio', label: 'Lavoura/Plantio' },
                { value: 'Administrativo', label: 'Administrativo' },
                { value: 'Infraestrutura', label: 'Infraestrutura' },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Target size={14} /> Safra / Projeto</label>
            <SearchableSelect 
              value={formData.project}
              onChange={(val: any) => setFormData({...formData, project: val})}
              options={[
                { value: '', label: 'Opcional (Sem rateio)' },
                { value: 'Safra Soja 2025/26', label: 'Safra Soja 2025/26' },
                { value: 'Safra Milho Inverno', label: 'Safra Milho Inverno' },
                { value: 'Projeto Irrigação', label: 'Projeto Irrigação' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data Limite (Necessidade / SLA)</label>
            <input 
              className="tauze-input"
              type="date" 
              title="Até quando o Suprimentos precisa entregar este pedido na fazenda?"
              value={formData.deadline}
              min={new Date().toISOString().split('T')[0]} // Não permite retroativo
              onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><AlertCircle size={14} /> Prioridade</label>
            <SearchableSelect 
              value={formData.priority}
              onChange={(val: any) => setFormData({...formData, priority: val})}
              options={[
                { value: 'low', label: 'Baixa (Planejada)' },
                { value: 'medium', label: 'Média (Rotina)' },
                { value: 'high', label: 'Alta (Impacta Operação)' },
                { value: 'urgent', label: 'Urgente (Máquina Parada)' },
              ]}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Justificativa do Pedido
              {(formData.priority === 'high' || formData.priority === 'urgent') && (
                <span style={{color: '#ef4444', fontSize: '10px', marginLeft: '6px', fontWeight: 800}}>* OBRIGATÓRIO PARA ESTA PRIORIDADE</span>
              )}
            </label>
            <textarea className="tauze-input tauze-textarea"
              style={{ minHeight: '80px', resize: 'vertical' }}
              placeholder="Explique detalhadamente o porquê desta compra para o aprovador financeiro..." 
              value={formData.justification}
              onChange={(e) => setFormData({...formData, justification: e.target.value})}
              required={formData.priority === 'high' || formData.priority === 'urgent'}
            />
          </div>
        </div>
      </section>

      {/* PASSO 02: ITENS DA SOLICITAÇÃO (CARRINHO) */}
      <section className="tauze-form-section">
        <div className="tauze-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="tauze-section-badge">PASSO 02</div>
            <h4 className="tauze-section-title">Carrinho de Itens</h4>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'hsl(var(--brand) / 0.1)', padding: '6px 12px', borderRadius: '12px' }}>
            <DollarSign size={14} style={{ color: 'hsl(var(--brand))' }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--brand))' }}>VALOR ESTIMADO:</span>
            <span style={{ fontSize: '14px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              R$ {totalEstimatedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="tauze-input-grid grid-col-1">
          <div style={{ border: '1px solid hsl(var(--border))', borderRadius: '16px', overflow: 'hidden' }}>
            <InsumoEntryTable 
              items={items}
              onChange={setItems}
              companyId={formData.company_id}
            />
          </div>
        </div>
      </section>

      {/* PASSO 03: EVIDÊNCIAS E ANEXOS */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Evidências e Orçamentos (Opcional)</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div style={{ 
            border: '2px dashed hsl(var(--border))', 
            borderRadius: '16px', 
            padding: '32px', 
            textAlign: 'center',
            background: 'hsl(var(--bg-main))',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'hsl(var(--brand))'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'hsl(var(--border))'}
          >
            <UploadCloud size={32} style={{ color: 'hsl(var(--text-muted))', margin: '0 auto 12px' }} />
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))', margin: '0 0 4px' }}>
              Arraste e solte seus arquivos aqui
            </h4>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', margin: 0 }}>
              Anexe orçamentos prévios (PDF) ou fotos da máquina quebrada (JPG, PNG) para agilizar a aprovação.
            </p>
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
