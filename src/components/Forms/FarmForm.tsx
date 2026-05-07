import React, { useState, useEffect } from 'react';
import { 
  Map, 
  Maximize,
  MapPin,
  Building2,
  FileText,
  Trees
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
    totalArea: '',
    location: '',
    companyId: '',
    description: ''
  });

  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        registrationNumber: initialData.registrationNumber || '',
        totalArea: initialData.totalArea?.toString() || '',
        location: initialData.location || '',
        companyId: initialData.companyId || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '',
        registrationNumber: '',
        totalArea: '',
        location: '',
        companyId: '',
        description: ''
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Submitting farm data:', formData);
      await onSubmit(formData);
      console.log('Submission complete');
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
      title={initialData ? "Editar Fazenda" : "Cadastrar Nova Fazenda"}
      subtitle={initialData ? "Atualize os dados da sua unidade produtiva." : "Adicione uma unidade produtiva e vincule a uma empresa."}
      icon={Map}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Fazenda"}
    >
      <div className="form-group full-width">
        <label><Map size={14} /> Nome da Fazenda / Unidade</label>
        <input 
          type="text" 
          placeholder="Ex: Fazenda Santa Maria, Unidade Sul..." 
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Building2 size={14} /> Empresa Responsável</label>
        <select 
          value={formData.companyId}
          onChange={(e) => setFormData({...formData, companyId: e.target.value})}
          required
        >
          <option value="">Selecione a empresa...</option>
          {companies.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><FileText size={14} /> Inscrição Estadual</label>
        <input 
          type="text" 
          placeholder="Número da IE..." 
          value={formData.registrationNumber}
          onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><Maximize size={14} /> Área Total (ha)</label>
        <input 
          type="number" 
          step="0.01"
          placeholder="0.00" 
          value={formData.totalArea}
          onChange={(e) => setFormData({...formData, totalArea: e.target.value})}
          required
        />
      </div>

      <div className="form-group">
        <label><MapPin size={14} /> Localização (Cidade/UF)</label>
        <input 
          type="text" 
          placeholder="Ex: Jataí - GO" 
          value={formData.location}
          onChange={(e) => setFormData({...formData, location: e.target.value})}
          required
        />
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações / Descrição</label>
        <textarea 
          placeholder="Breve descrição da atividade principal da unidade..." 
          value={formData.description}
          onChange={(e) => setFormData({...formData, description: e.target.value})}
          rows={3}
        />
      </div>
    </FormModal>
  );
};
