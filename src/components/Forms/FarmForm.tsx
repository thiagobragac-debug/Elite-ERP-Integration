import React from 'react';
import {
  Map,
  Maximize,
  MapPin,
  Building2,
  FileText,
  Hash
} from 'lucide-react';
import { FormModal } from './FormModal';
import { useTenant } from '../../contexts/TenantContext';

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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Fazenda' : 'Cadastrar Nova Fazenda'}
      subtitle={initialData ? 'Atualize os dados da sua unidade produtiva.' : 'Adicione uma unidade produtiva e vincule a uma empresa.'}
      icon={Map}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Fazenda'}
    >
      <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>
        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label><Map size={14} /> Nome da Fazenda / Unidade</label>
          <input type="text" placeholder="Ex: Fazenda Santa Maria, Unidade Sul..."
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
        </div>

        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label><Building2 size={14} /> Empresa Responsável</label>
          <select value={formData.companyId}
            onChange={(e) => setFormData({...formData, companyId: e.target.value})} required>
            <option value="">Selecione a empresa...</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>
        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label><FileText size={14} /> Inscrição Estadual (IE)</label>
          <input type="text" placeholder="Número da IE..."
            value={formData.registrationNumber}
            onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})} />
        </div>

        {/* NIRF — Número do Imóvel na Receita Federal */}
        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label>
            <Hash size={14} /> NIRF
            <span className="nirf-badge">Receita Federal</span>
          </label>
          <input type="text" placeholder="Ex: 1234567-8"
            value={formData.nirf}
            onChange={(e) => setFormData({...formData, nirf: e.target.value})} />
          <small className="field-hint">Obrigatório para o LCDPR</small>
        </div>

        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label><Maximize size={14} /> Área Total (ha)</label>
          <input type="number" step="0.01" placeholder="0.00"
            value={formData.totalArea}
            onChange={(e) => setFormData({...formData, totalArea: e.target.value})} required />
        </div>
      </div>

      {/* Localização detalhada */}
      <div className="form-section-title full-width">
        <MapPin size={16} /><span>Localização</span>
      </div>

      <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.5fr 2fr', gap: '16px', border: 'none', padding: 0, background: 'transparent' }}>
        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label>Município</label>
          <input type="text" placeholder="Ex: Jataí" value={formData.municipio}
            onChange={(e) => setFormData({...formData, municipio: e.target.value})} />
        </div>

        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label>UF</label>
          <input type="text" placeholder="GO" maxLength={2} value={formData.uf}
            onChange={(e) => setFormData({...formData, uf: e.target.value.toUpperCase()})} />
        </div>

        <div className="form-group" style={{ margin: 0, padding: 0, border: 'none', background: 'transparent', gridColumn: 'span 1' }}>
          <label><MapPin size={14} /> Localização (Cidade/UF — exibição)</label>
          <input type="text" placeholder="Ex: Jataí - GO" value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})} />
        </div>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações / Descrição</label>
        <textarea placeholder="Breve descrição da atividade principal da unidade..."
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
      </div>

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
    </FormModal>
  );
};
