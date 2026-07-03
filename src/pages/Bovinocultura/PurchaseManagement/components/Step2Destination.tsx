import React from 'react';
import { MapPin, Target, Layers } from 'lucide-react';

export const Step2Destination: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="tauze-input-grid grid-col-2">
        <div className="tauze-field-group">
          <label className="tauze-label">
            <MapPin size={14} /> Fazenda de Destino
          </label>
          <select className="tauze-input">
            <option value="">Selecione a fazenda...</option>
            <option value="fazenda-1">Fazenda Santa Cruz</option>
            <option value="fazenda-2">Fazenda Bela Vista</option>
          </select>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Layers size={14} /> Pasto / Lote de Destino
          </label>
          <select className="tauze-input">
            <option value="">Selecione o pasto...</option>
            <option value="pasto-1">Pasto Fundo (Maternidade)</option>
            <option value="pasto-2">Pasto da Sede (Recria)</option>
          </select>
        </div>
      </div>

      <div className="tauze-input-grid grid-col-3">
        <div className="tauze-field-group">
          <label className="tauze-label">
            <Target size={14} /> Categoria Predominante
          </label>
          <select className="tauze-input">
            <option value="">Selecione...</option>
            <option value="Bezerro">Bezerro (0-12m)</option>
            <option value="Novilha">Novilha (13-24m)</option>
            <option value="Garrote">Garrote (13-24m)</option>
            <option value="Vaca">Vaca ({'>'}36m)</option>
            <option value="Touro">Touro ({'>'}36m)</option>
          </select>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Layers size={14} /> Raça Predominante
          </label>
          <select className="tauze-input">
            <option value="">Selecione a raça...</option>
            <option value="Nelore">Nelore</option>
            <option value="Angus">Angus</option>
            <option value="Cruzamento Industrial">Cruzamento Industrial</option>
            <option value="Brahman">Brahman</option>
          </select>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Target size={14} /> Finalidade / Aptidão
          </label>
          <select className="tauze-input">
            <option value="">Selecione...</option>
            <option value="Corte (Engorda)">Corte (Engorda)</option>
            <option value="Corte (Cria)">Corte (Cria)</option>
            <option value="Leite">Leite</option>
            <option value="Genética">Genética</option>
          </select>
        </div>
      </div>
    </div>
  );
};
