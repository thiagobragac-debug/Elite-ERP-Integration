import React from 'react';
import {
  Map,
  Maximize,
  MapPin,
  Building2,
  FileText,
  Hash
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';

interface FarmFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const FarmForm: React.FC<FarmFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { companies } = useTenant();
  const [formData, setFormData] = React.useState({
    name: '',
    registrationNumber: '',
    nirf: '',
    totalArea: '',
    location: '',
    municipio: '',
    uf: '',
    companyId: '',
    description: ''
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.nome || initialData.name || '',
        registrationNumber: initialData.ie_produtor || initialData.registrationNumber || '',
        nirf: initialData.nirf || '',
        totalArea: (initialData.area_total || initialData.totalArea)?.toString() || '',
        location: initialData.localizacao || initialData.location || '',
        municipio: initialData.municipio || '',
        uf: initialData.uf || '',
        companyId: initialData.unidade_id || initialData.companyId || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '', registrationNumber: '', nirf: '', totalArea: '',
        location: '', municipio: '', uf: '', companyId: '', description: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Error in FarmForm handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Fazenda' : 'Cadastrar Nova Fazenda'}
      subtitle={initialData ? 'Atualize os dados da sua unidade produtiva.' : 'Adicione uma unidade produtiva e vincule a uma empresa.'}
      icon={Map}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Fazenda'}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação Básica</h4>
        </div>
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Map size={14} /> Nome da Fazenda / Unidade</label>
            <input type="text" className="tauze-input" placeholder="Ex: Fazenda Santa Maria, Unidade Sul..."
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})} required />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Building2 size={14} /> Empresa Responsável</label>
            <SearchableSelect 
              value={formData.companyId}
              onChange={(val: any) => setFormData({...formData, companyId: val})}
              options={[
                { value: ``, label: `Selecione a empresa...` },
                ...(companies || []).map(c => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Detalhes Cadastrais</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Inscrição Estadual (IE)</label>
            <input type="text" className="tauze-input" placeholder="Número da IE..."
              value={formData.registrationNumber}
              onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> NIRF
              <span className="nirf-badge">Receita Federal</span>
            </label>
            <input type="text" className="tauze-input" placeholder="Ex: 1234567-8"
              value={formData.nirf}
              onChange={(e) => setFormData({...formData, nirf: e.target.value})} />
            <small className="field-hint">Obrigatório para o LCDPR</small>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Maximize size={14} /> Área Total (ha)</label>
            <input type="number" className="tauze-input" step="0.01" placeholder="0.00"
              value={formData.totalArea}
              onChange={(e) => setFormData({...formData, totalArea: e.target.value})} required />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Localização</h4>
        </div>
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">Município</label>
            <input type="text" className="tauze-input" placeholder="Ex: Jataí" value={formData.municipio}
              onChange={(e) => setFormData({...formData, municipio: e.target.value})} />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">UF</label>
            <input type="text" className="tauze-input" placeholder="GO" maxLength={2} value={formData.uf}
              onChange={(e) => setFormData({...formData, uf: e.target.value.toUpperCase()})} />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Exibição da Cidade/UF</label>
            <input type="text" className="tauze-input" placeholder="Ex: Jataí - GO" value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})} />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Detalhes Finais</h4>
        </div>
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label"><FileText size={14} /> Observações / Descrição</label>
            <textarea className="tauze-input" placeholder="Breve descrição da atividade principal da unidade..."
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
          </div>
        </div>
      </section>

      <style>{`
        .nirf-badge {
          margin-left: 6px; font-size: 9px; font-weight: 800;
          padding: 1px 6px; border-radius: 5px;
          background: hsl(var(--brand) / 0.12); color: hsl(var(--brand));
          border: 1px solid hsl(var(--brand) / 0.25);
          letter-spacing: 0.06em; text-transform: uppercase; vertical-align: middle;
        }
        .field-hint {
          display: block; margin-top: 4px; font-size: 11px;
          color: hsl(var(--text-muted)); font-style: italic;
        }
      `}</style>
    </SidePanel>
  );
};
