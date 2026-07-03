import React from 'react';
import { Users, Home, ShoppingCart, Gift, FileText, DollarSign } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';

interface OriginSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  custoArroba: string | null;
  fornecedores: any[];
}

export const OriginSection: React.FC<OriginSectionProps> = ({
  formData,
  setFormData,
  custoArroba,
  fornecedores,
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

      {formData.origem === 'Nascido na Fazenda' && (
        <div className="tauze-input-grid grid-col-4">
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
          <div className="tauze-field-group">
            <label className="tauze-label">Tipo de Parto</label>
            <select
              className="tauze-input"
              value={formData.tipo_parto || ''}
              onChange={(e) => setFormData({ ...formData, tipo_parto: e.target.value })}
            >
              <option value="">Selecionar...</option>
              <option value="Normal">Normal</option>
              <option value="Distócico">Distócico (Com Ajuda)</option>
              <option value="Cesárea">Cesárea</option>
            </select>
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">Tipo de Concepção</label>
            <select
              className="tauze-input"
              value={formData.tipo_concepcao || ''}
              onChange={(e) => setFormData({ ...formData, tipo_concepcao: e.target.value })}
            >
              <option value="">Selecionar...</option>
              <option value="Monta Natural">Monta Natural</option>
              <option value="IATF">IATF (Inseminação)</option>
              <option value="FIV/TE">FIV / TE</option>
            </select>
          </div>
        </div>
      )}

      {formData.origem === 'Comprado' && (
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Fornecedor / Vendedor
            </label>
            <SearchableSelect
              value={formData.fornecedor}
              onChange={(val) => setFormData({ ...formData, fornecedor: val })}
              options={[
                { value: '', label: 'Selecionar ou digitar fornecedor...' },
                ...fornecedores.map((f) => ({ value: f.nome, label: f.nome })),
              ]}
              creatable={true}
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
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Gift size={14} /> Doador
            </label>
            <SearchableSelect
              value={formData.doador}
              onChange={(val) => setFormData({ ...formData, doador: val })}
              options={[
                { value: '', label: 'Selecionar ou digitar doador...' },
                ...fornecedores.map((f) => ({ value: f.nome, label: f.nome })),
              ]}
              creatable={true}
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
            <label className="tauze-label">
              <DollarSign size={14} /> Valor Estimado (R$)
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
    </>
  );
};
