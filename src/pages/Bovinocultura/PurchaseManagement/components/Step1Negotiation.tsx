import React from 'react';
import { Calendar, User, FileText, FileDigit, DollarSign, ListOrdered, ShieldCheck } from 'lucide-react';

export const Step1Negotiation: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="tauze-input-grid grid-col-2">
        <div className="tauze-field-group">
          <label className="tauze-label">
            <User size={14} /> Fornecedor (Vendedor)
          </label>
          <input 
            type="text" 
            className="tauze-input" 
            placeholder="Buscar fornecedor..."
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Calendar size={14} /> Data da Chegada
          </label>
          <input 
            type="date" 
            className="tauze-input" 
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <FileDigit size={14} /> Nota Fiscal
          </label>
          <input 
            type="text" 
            className="tauze-input" 
            placeholder="Número da NF-e"
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <ShieldCheck size={14} /> GTA
          </label>
          <input 
            type="text" 
            className="tauze-input" 
            placeholder="Número / Série"
          />
        </div>

        <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
          <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={14} /> Integração Financeira
            </span>
            <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>Obrigatório</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '4px', padding: '16px', background: 'hsl(var(--bg-main))', borderRadius: '12px', border: '1px solid hsl(var(--border))' }}>
            <label className="tauze-checkbox-container" style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '13px', alignItems: 'center' }}>
              <input type="radio" name="fin_integration" value="new" defaultChecked style={{ accentColor: 'hsl(var(--brand))', width: '16px', height: '16px' }} />
              Gerar nova fatura no Contas a Pagar
            </label>
            <label className="tauze-checkbox-container" style={{ display: 'flex', gap: '8px', cursor: 'pointer', fontSize: '13px', alignItems: 'center' }}>
              <input type="radio" name="fin_integration" value="existing" style={{ accentColor: 'hsl(var(--brand))', width: '16px', height: '16px' }} />
              NF já lançada pelo administrativo (Não gerar duplicata)
            </label>
          </div>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <ListOrdered size={14} /> Quantidade de Cabeças
          </label>
          <input 
            type="number" 
            className="tauze-input" 
            placeholder="Ex: 120"
            min="1"
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <DollarSign size={14} /> Valor Total do Lote (R$)
          </label>
          <input 
            type="number" 
            className="tauze-input" 
            placeholder="0,00"
            min="0"
            step="0.01"
          />
        </div>
      </div>
    </div>
  );
};
