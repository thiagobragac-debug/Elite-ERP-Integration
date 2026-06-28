import React from 'react';
import { Users, Home, ShoppingCart, Gift, FileText, DollarSign } from 'lucide-react';

interface OriginSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  custoArroba: string | null;
}

export const OriginSection: React.FC<OriginSectionProps> = ({
  formData,
  setFormData,
  custoArroba,
}) => {
  return (
    <>
      <div className="tauze-field-group">
        <label className="tauze-label">
          <Users size={14} /> Origem do Animal
        </label>
        <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div
            className={`tauze-form-radio-item ${formData.origem === 'Nascido' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, origem: 'Nascido' })}
          >
            <Home size={14} />
            <span>Nascido na Fazenda</span>
          </div>
          <div
            className={`tauze-form-radio-item ${formData.origem === 'Comprado' ? 'active-comprado' : ''}`}
            onClick={() => setFormData({ ...formData, origem: 'Comprado' })}
          >
            <ShoppingCart size={14} />
            <span>Comprado (Entrada)</span>
          </div>
          <div
            className={`tauze-form-radio-item ${formData.origem === 'Doação' ? 'active-doacao' : ''}`}
            onClick={() => setFormData({ ...formData, origem: 'Doação' })}
          >
            <Gift size={14} />
            <span>Doação</span>
          </div>
        </div>
      </div>

      {formData.origem === 'Nascido' && (
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Users size={14} /> Brinco da Mãe
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Brinco da Matriz"
              value={formData.mae_brinco}
              onChange={(e) =>
                setFormData({ ...formData, mae_brinco: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Users size={14} /> Brinco do Pai
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Brinco do Reprodutor"
              value={formData.pai_brinco}
              onChange={(e) =>
                setFormData({ ...formData, pai_brinco: e.target.value.toUpperCase() })
              }
            />
          </div>
        </div>
      )}

      {formData.origem === 'Comprado' && (
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Fornecedor / Vendedor
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Nome do fornecedor"
              value={formData.fornecedor}
              onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Nota Fiscal (NF)
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Nº da Nota Fiscal"
              value={formData.nota_fiscal}
              onChange={(e) => setFormData({ ...formData, nota_fiscal: e.target.value })}
            />
          </div>
          <div className="tauze-field-group">
            <label
              className="tauze-label"
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <span>
                <DollarSign size={14} /> Valor de Compra (R$)
              </span>
              {custoArroba && (
                <span
                  style={{
                    padding: '2px 8px',
                    fontSize: '10px',
                    background: 'hsl(var(--brand)/0.1)',
                    color: 'hsl(var(--brand))',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  {custoArroba} / @
                </span>
              )}
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.valor_compra}
              onChange={(e) => setFormData({ ...formData, valor_compra: e.target.value })}
            />
          </div>
        </div>
      )}

      {formData.origem === 'Doação' && (
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Gift size={14} /> Doador
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Nome do doador"
              value={formData.doador}
              onChange={(e) => setFormData({ ...formData, doador: e.target.value })}
            />
          </div>
        </div>
      )}
    </>
  );
};
