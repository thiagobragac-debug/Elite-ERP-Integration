import React from 'react';
import { Hash, Info, CircleDot, User2, Calendar, Activity, Tag, Scale } from 'lucide-react';
import { DateInput } from '../../Form/DateInput';
import { SearchableSelect } from '../SearchableSelect';

interface BasicInfoSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  duplicateBrinco: boolean;
  setDuplicateBrinco: (val: boolean) => void;
  handleBrincoBlur: () => void;
  formatRFID: (val: string) => string;
  handleDataNascimentoChange: (val: string) => void;
  handleIdadeChange: (val: string) => void;
  racas: any[];
  handleRacaChange: (val: string) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  formData,
  setFormData,
  duplicateBrinco,
  setDuplicateBrinco,
  handleBrincoBlur,
  formatRFID,
  handleDataNascimentoChange,
  handleIdadeChange,
  racas,
  handleRacaChange,
}) => {
  return (
    <>
      <div className="tauze-input-grid grid-col-3">
        <div className="tauze-field-group">
          <label className="tauze-label">
            <Hash size={14} /> Brinco Visual (Manejo)
          </label>
          <input
            className={`tauze-input${duplicateBrinco ? ' tauze-input-error' : ''}`}
            type="text"
            placeholder="Ex: 1234-A"
            value={formData.brinco}
            onChange={(e) => {
              setFormData({ ...formData, brinco: e.target.value.toUpperCase() });
              if (duplicateBrinco) setDuplicateBrinco(false);
            }}
            onBlur={handleBrincoBlur}
            required
          />
          {duplicateBrinco && (
            <span className="tauze-field-error">
              ⚠ Brinco já cadastrado — verifique o número
            </span>
          )}
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Info size={14} /> Nome do Animal
            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 500 }}>
              (Opcional)
            </span>
          </label>
          <input
            className="tauze-input"
            type="text"
            placeholder="Ex: Maverick, Estrela..."
            value={formData.nome}
            onChange={(e) =>
              setFormData({ ...formData, nome: e.target.value })
            }
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <CircleDot size={14} /> Brinco Eletrônico (RFID)
          </label>
          <div
            className="tauze-input"
            style={{ display: 'flex', alignItems: 'center', padding: '0 14px', position: 'relative' }}
          >
            {formData.brinco_eletronico.length <= 3 && (
              <span
                style={{
                  color:
                    formData.brinco_eletronico.length > 0
                      ? 'inherit'
                      : 'hsl(var(--text-muted))',
                  opacity: formData.brinco_eletronico.length > 0 ? 1 : 0.6,
                  marginRight: '4px',
                  transition: 'all 0.2s',
                }}
              >
                Ex:
              </span>
            )}
            <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={formData.brinco_eletronico}
                onChange={(e) =>
                  setFormData({ ...formData, brinco_eletronico: formatRFID(e.target.value) })
                }
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  width: '100%',
                  position: 'relative',
                  zIndex: 2,
                  color: 'inherit',
                  padding: '9px 0',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  fontWeight: 'inherit',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1,
                  color: 'hsl(var(--text-muted))',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  whiteSpace: 'pre',
                  opacity: 0.6,
                  fontWeight: 'inherit',
                }}
              >
                <span style={{ color: 'transparent' }}>{formData.brinco_eletronico}</span>
                <span>{'076 0000 1234 5678'.substring(formData.brinco_eletronico.length)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="tauze-input-grid grid-col-3">
        <div
          className="tauze-field-group"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
        >
          <label className="tauze-label">
            <User2 size={14} /> Sexo
          </label>
          <div className="tauze-form-radio-group" style={{ height: '48px', marginTop: 0 }}>
            <div
              className={`tauze-form-radio-item ${formData.sexo === 'M' ? 'active-macho' : ''}`}
              style={{
                height: '48px',
                padding: 0,
                boxSizing: 'border-box',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onClick={() => setFormData({ ...formData, sexo: 'M' })}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>♂</span>
              <span>Macho</span>
            </div>
            <div
              className={`tauze-form-radio-item ${formData.sexo === 'F' ? 'active-femea' : ''}`}
              style={{
                height: '48px',
                padding: 0,
                boxSizing: 'border-box',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
              onClick={() => setFormData({ ...formData, sexo: 'F' })}
            >
              <span style={{ fontSize: '15px', lineHeight: 1 }}>♀</span>
              <span>Fêmea</span>
            </div>
          </div>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Calendar size={14} /> Nascimento / Idade
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <DateInput
              className="tauze-input"
              style={{ flex: '2', minWidth: 0 }}
              type="date"
              title="Data de Nascimento"
              value={formData.data_nascimento}
              onChange={(e) => handleDataNascimentoChange(e.target.value)}
            />
            <div style={{ position: 'relative', flex: '0.8', minWidth: 0 }}>
              <input
                className="tauze-input"
                style={{ width: '100%', paddingRight: '52px' }}
                type="number"
                min="0"
                placeholder="0"
                title="Idade em Meses"
                value={formData.idade_meses}
                onChange={(e) => handleIdadeChange(e.target.value)}
              />
              <span
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  pointerEvents: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                meses
              </span>
            </div>
          </div>
        </div>

        <div
          className="tauze-field-group"
          style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}
        >
          <label className="tauze-label">
            <Activity size={14} /> Status de Entrada
          </label>
          <div className="tauze-form-radio-group" style={{ height: '48px', marginTop: 0 }}>
            {(
              [
                { value: 'Ativo', cls: 'active' },
                { value: 'Quarentena', cls: 'active-manutencao' },
              ] as const
            ).map(({ value, cls }) => (
              <div
                key={value}
                className={`tauze-form-radio-item ${formData.status === value ? cls : ''}`}
                style={{
                  height: '48px',
                  padding: 0,
                  boxSizing: 'border-box',
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                }}
                onClick={() => setFormData({ ...formData, status: value })}
              >
                {value}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="tauze-input-grid grid-col-3">
        <div className="tauze-field-group">
          <label className="tauze-label">
            <Tag size={14} /> Raça
          </label>
          <SearchableSelect
            value={formData.raca}
            onChange={handleRacaChange}
            options={[
              { value: '', label: 'Selecionar Raça...' },
              ...racas.map((r) => ({ value: r.nome, label: r.nome })),
            ]}
            creatable={true}
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Info size={14} /> Pelagem
          </label>
          <input
            className="tauze-input"
            type="text"
            placeholder="Ex: Branco, Manchado"
            value={formData.pelagem}
            onChange={(e) => setFormData({ ...formData, pelagem: e.target.value })}
          />
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">
            <Scale size={14} /> Peso de Entrada (kg)
          </label>
          <input
            className="tauze-input"
            type="number"
            min="0"
            step="0.1"
            placeholder="0.0"
            value={formData.peso_inicial}
            onChange={(e) => setFormData({ ...formData, peso_inicial: e.target.value })}
          />
        </div>
      </div>
    </>
  );
};
