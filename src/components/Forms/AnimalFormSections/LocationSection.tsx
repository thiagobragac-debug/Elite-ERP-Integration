import React from 'react';
import { Building2, Award, MapPin } from 'lucide-react';
import { SearchableSelect } from '../SearchableSelect';

interface LocationSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  fazendas: any[];
  lotes: any[];
  pastos: any[];
  loadingFazendas: boolean;
  loadingLotes: boolean;
  loadingPastos: boolean;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  formData,
  setFormData,
  fazendas,
  lotes,
  pastos,
  loadingFazendas,
  loadingLotes,
  loadingPastos,
}) => {
  return (
    <div className="tauze-input-grid grid-col-3">
      <div className="tauze-field-group">
        <label className="tauze-label">
          <Building2 size={14} /> Fazenda de Destino
        </label>
        <SearchableSelect
          value={formData.fazenda_id}
          onChange={(val: any) =>
            setFormData({ ...formData, fazenda_id: val, pasto_id: '', lote_id: '' })
          }
          disabled={loadingFazendas}
          options={[
            {
              value: '',
              label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...',
            },
            ...fazendas.map((f) => ({ value: String(f.id), label: f.nome })),
          ]}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label">
          <Award size={14} /> Lote de Destino (Opcional)
        </label>
        <SearchableSelect
          value={formData.lote_id}
          onChange={(val: any) => {
            const selectedLote = lotes.find((l) => String(l.id) === String(val));
            setFormData({
              ...formData,
              lote_id: val,
              pasto_id: selectedLote?.pasto_id ? String(selectedLote.pasto_id) : formData.pasto_id,
            });
          }}
          disabled={!formData.fazenda_id || loadingLotes}
          options={[
            {
              value: '',
              label: !formData.fazenda_id
                ? 'Selecione a fazenda'
                : loadingLotes
                  ? 'Carregando lotes...'
                  : 'Sem lote definido',
            },
            ...lotes.map((l) => ({ value: String(l.id), label: l.nome })),
          ]}
        />
      </div>

      <div className="tauze-field-group">
        <label className="tauze-label">
          <MapPin size={14} /> Pasto (Opcional)
        </label>
        <SearchableSelect
          value={formData.pasto_id}
          onChange={(val: any) => setFormData({ ...formData, pasto_id: val })}
          disabled={!formData.fazenda_id || loadingPastos}
          options={[
            {
              value: '',
              label: !formData.fazenda_id
                ? 'Selecione a fazenda'
                : loadingPastos
                  ? 'Carregando pastos...'
                  : 'Sem pasto definido',
            },
            ...pastos.map((p) => ({ value: String(p.id), label: p.nome })),
          ]}
        />
      </div>
    </div>
  );
};
