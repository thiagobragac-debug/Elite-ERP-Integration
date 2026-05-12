import React, { useState, useEffect } from 'react';
import { 
  Scale, 
  Calendar,
  Layers,
  Search,
  CheckCircle2,
  FileText,
  Hash,
  TrendingUp,
  Activity
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface WeightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export const WeightForm: React.FC<WeightFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm } = useTenant();
  const [animals, setAnimals] = useState<any[]>([]);
  const [lastWeighing, setLastWeighing] = useState<any>(null);
  const [formData, setFormData] = useState({
    animal_id: '',
    data_pesagem: new Date().toISOString().split('T')[0],
    peso: '',
    lote_id: '',
    observacao: ''
  });

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchAnimals();
    }
  }, [isOpen, activeFarm]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        data_pesagem: initialData.data_pesagem || new Date().toISOString().split('T')[0],
        peso: initialData.peso?.toString() || '',
        lote_id: initialData.lote_id || '',
        observacao: initialData.observacao || ''
      });
    }
  }, [initialData, isOpen]);

  const fetchAnimals = async () => {
    const { data } = await supabase
      .from('animais')
      .select('id, brinco, peso_inicial')
      .eq('fazenda_id', activeFarm?.id)
      .eq('status', 'Ativo');
    if (data) setAnimals(data);
  };

  const fetchLastWeight = async (animalId: string) => {
    const { data } = await supabase
      .from('pesagens')
      .select('*')
      .eq('animal_id', animalId)
      .order('data_pesagem', { ascending: false })
      .limit(1);
    
    if (data && data[0]) {
      setLastWeighing(data[0]);
    } else {
      // Se não houver pesagem, pegamos o peso inicial do animal
      const animal = animals.find(a => a.id === animalId);
      if (animal) {
        setLastWeighing({ peso: animal.peso_inicial, data_pesagem: null, isInitial: true });
      }
    }
  };

  const handleAnimalChange = (id: string) => {
    setFormData({ ...formData, animal_id: id });
    if (id) fetchLastWeight(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      setFormData({
        animal_id: '',
        data_pesagem: new Date().toISOString().split('T')[0],
        peso: '',
        lote_id: '',
        observacao: ''
      });
      setLastWeighing(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Pesagem" : "Nova Pesagem"}
      subtitle="Registre o peso individual de um animal."
      icon={Scale}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Pesagem"}
    >
      <div className="form-group full-width">
        <label><Hash size={14} /> Selecionar Animal (Brinco)</label>
        <select 
          value={formData.animal_id}
          onChange={(e) => handleAnimalChange(e.target.value)}
          required
        >
          <option value="">Selecione o animal...</option>
          {animals.map(a => (
            <option key={a.id} value={a.id}>{a.brinco}</option>
          ))}
        </select>
      </div>

      {lastWeighing && (
        <div className="performance-preview-card full-width animate-fade-in">
          <div className="preview-header">
            <Activity size={14} />
            <span>Resumo de Performance</span>
          </div>
          <div className="preview-grid">
            <div className="preview-stat">
              <span className="p-label">Peso Anterior</span>
              <span className="p-value">{lastWeighing.peso} kg</span>
              <span className="p-meta">{lastWeighing.isInitial ? 'Inicial' : new Date(lastWeighing.data_pesagem).toLocaleDateString()}</span>
            </div>
            {formData.peso && (
              <div className="preview-stat">
                <span className="p-label">GMD Projetado</span>
                <span className="p-value">
                  {(() => {
                    const days = (new Date(formData.data_pesagem).getTime() - new Date(lastWeighing.data_pesagem || lastWeighing.created_at).getTime()) / (1000 * 60 * 60 * 24);
                    const gmd = days > 0 ? (Number(formData.peso) - Number(lastWeighing.peso)) / days : 0;
                    return gmd.toFixed(3);
                  })()} kg/dia
                </span>
                <span className={`p-meta ${(Number(formData.peso) - Number(lastWeighing.peso)) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {(Number(formData.peso) - Number(lastWeighing.peso)).toFixed(1)} kg total
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
        <div className="form-group">
          <label><Scale size={14} /> Novo Peso (kg)</label>
          <input 
            type="number" 
            step="0.1"
            placeholder="0.0" 
            value={formData.peso}
            onChange={(e) => setFormData({...formData, peso: e.target.value})}
            required
          />
        </div>

        <div className="form-group">
          <label><Calendar size={14} /> Data da Pesagem</label>
          <input 
            type="date" 
            value={formData.data_pesagem}
            onChange={(e) => setFormData({...formData, data_pesagem: e.target.value})}
            required
          />
        </div>
      </div>

      <div className="form-group full-width">
        <label><Layers size={14} /> Lote (Opcional)</label>
        <select 
          value={formData.lote_id}
          onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
        >
          <option value="">Selecione um lote</option>
          <option value="1">LOTE-A1 (Engorda)</option>
          <option value="2">LOTE-B2 (Recria)</option>
        </select>
      </div>

      <div className="form-group full-width">
        <label><FileText size={14} /> Observações</label>
        <textarea 
          placeholder="Notas sobre a condição do animal, etc." 
          value={formData.observacao}
          onChange={(e) => setFormData({...formData, observacao: e.target.value})}
          rows={3}
          style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-input)' }}
        />
      </div>

      <style>{`
        .performance-preview-card {
          background: hsl(var(--brand) / 0.05);
          border: 1px solid hsl(var(--brand) / 0.2);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
        }
        .preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 10px;
          font-weight: 800;
          color: hsl(var(--brand));
          text-transform: uppercase;
          margin-bottom: 12px;
        }
        .preview-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .preview-stat {
          display: flex;
          flex-direction: column;
        }
        .p-label {
          font-size: 11px;
          color: hsl(var(--text-muted));
          font-weight: 600;
        }
        .p-value {
          font-size: 18px;
          font-weight: 900;
          color: hsl(var(--text-main));
        }
        .p-meta {
          font-size: 10px;
          font-weight: 700;
          color: hsl(var(--text-muted));
        }
      `}</style>
    </FormModal>
  );
};
