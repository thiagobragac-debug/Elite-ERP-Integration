import React from 'react';
import { Beef } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';

interface ZootecnicaSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  categorias: any[];
  categoriaEditadaManualmente: boolean;
  handleCategoriaChange: (val: string) => void;
}

export const ZootecnicaSection: React.FC<ZootecnicaSectionProps> = ({
  formData,
  setFormData,
  categorias,
  categoriaEditadaManualmente,
  handleCategoriaChange,
}) => {
  return (
    <div className="tauze-input-grid grid-col-2">
      <div className="tauze-field-group">
        <label className="tauze-label" style={{ gap: '6px' }}>
          <Beef size={14} /> Categoria
          {!categoriaEditadaManualmente && formData.idade_meses ? (
            <span
              style={{
                fontSize: '10px',
                color: 'hsl(var(--brand))',
                background: 'hsl(var(--brand)/0.1)',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              Auto-Sugerida
            </span>
          ) : categoriaEditadaManualmente ? (
            <span
              style={{
                fontSize: '10px',
                color: '#10b981',
                background: 'rgba(16,185,129,0.1)',
                padding: '1px 6px',
                borderRadius: '10px',
              }}
            >
              Manual
            </span>
          ) : null}
        </label>
        <SearchableSelect
          value={formData.categoria}
          onChange={handleCategoriaChange}
          options={[
            { value: '', label: 'Selecionar Categoria...' },
            ...categorias.map((c) => ({ value: c.nome, label: c.nome })),
          ]}
          creatable={true}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label">
          <Beef size={14} /> Finalidade
        </label>
        <SearchableSelect
          value={formData.finalidade}
          onChange={(val: any) => setFormData({ ...formData, finalidade: val })}
          options={[
            { value: '', label: 'Selecionar...' },
            { value: 'Corte', label: 'Corte' },
            { value: 'Leite', label: 'Leite' },
            { value: 'Reprodução', label: 'Reprodução' },
            { value: 'Trabalho', label: 'Trabalho / Tração' },
            { value: 'Exposição', label: 'Exposição / Show' },
            { value: 'Descarte', label: 'Descarte' },
          ]}
        />
      </div>
    </div>
  );
};
