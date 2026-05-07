import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, 
  Layers, 
  MapPin,
  Search,
  CheckCircle2,
  Users,
  Beef,
  ChevronRight
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface RelocateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialSourceLotId?: string;
}

export const RelocateForm: React.FC<RelocateFormProps> = ({ isOpen, onClose, onSubmit, initialSourceLotId }) => {
  const { activeFarm } = useTenant();
  const [loading, setLoading] = useState(false);
  const [lots, setLots] = useState<any[]>([]);
  const [animals, setAnimals] = useState<any[]>([]);
  const [selectedAnimals, setSelectedAnimals] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    sourceLotId: initialSourceLotId || '',
    targetLotId: '',
    date: new Date().toISOString().split('T')[0],
    reason: ''
  });

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchLots();
    }
  }, [isOpen, activeFarm]);

  useEffect(() => {
    if (formData.sourceLotId) {
      fetchAnimals(formData.sourceLotId);
    } else {
      setAnimals([]);
    }
  }, [formData.sourceLotId, isOpen]);

  const fetchLots = async () => {
    const { data } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id);
    if (data) setLots(data);
  };

  const fetchAnimals = async (lotId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('animais')
      .select('id, brinco, raca, categoria')
      .eq('lote_id', lotId)
      .eq('status', 'Ativo');
    if (data) setAnimals(data);
    setLoading(false);
  };

  const toggleAnimal = (id: string) => {
    setSelectedAnimals(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAnimals.length === animals.length && animals.length > 0) {
      setSelectedAnimals([]);
    } else {
      setSelectedAnimals(animals.map(a => a.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAnimals.length === 0) {
      alert('Selecione ao menos um animal para remanejar.');
      return;
    }
    if (!formData.targetLotId) {
      alert('Selecione o lote de destino.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('animais')
        .update({ lote_id: formData.targetLotId })
        .in('id', selectedAnimals);

      if (!error) {
        onSubmit({
          count: selectedAnimals.length,
          source: formData.sourceLotId,
          target: formData.targetLotId
        });
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Remanejamento de Lote"
      subtitle="Transfira animais entre grupos e pastagens com rastreabilidade total."
      icon={ArrowRightLeft}
      loading={loading}
      submitLabel={`Remanejar ${selectedAnimals.length} Animais`}
    >
      <div className="form-group">
        <label><Layers size={14} /> Lote de Origem</label>
        <select 
          value={formData.sourceLotId}
          onChange={(e) => setFormData({...formData, sourceLotId: e.target.value})}
          required
        >
          <option value="">Selecione o lote atual...</option>
          {lots.map(l => (
            <option key={l.id} value={l.id}>{l.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label><MapPin size={14} /> Lote / Pasto de Destino</label>
        <select 
          value={formData.targetLotId}
          onChange={(e) => setFormData({...formData, targetLotId: e.target.value})}
          required
        >
          <option value="">Selecione para onde vão...</option>
          {lots.filter(l => l.id !== formData.sourceLotId).map(l => (
            <option key={l.id} value={l.id}>{l.nome}</option>
          ))}
        </select>
      </div>

      <div className="form-group full-width">
        <div className="elite-selection-header">
          <label><Users size={14} /> Selecionar Animais ({selectedAnimals.length}/{animals.length})</label>
          <button type="button" className="text-btn-sm" onClick={selectAll}>
            {selectedAnimals.length === animals.length && animals.length > 0 ? 'DESMARCAR TODOS' : 'MARCAR TODOS'}
          </button>
        </div>
        
        <div className="search-glass-box small mb-4">
          <Search size={14} className="s-icon" />
          <input 
            type="text" 
            placeholder="Filtrar por brinco..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-animal-picker">
          {loading ? (
            <div className="picker-loading">Buscando efetivo...</div>
          ) : animals.length === 0 ? (
            <div className="picker-empty">Selecione um lote de origem com animais ativos.</div>
          ) : (
            <div className="picker-grid">
              {animals.filter(a => a.brinco.includes(searchTerm)).map(animal => (
                <div 
                  key={animal.id} 
                  className={`picker-item ${selectedAnimals.includes(animal.id) ? 'active' : ''}`}
                  onClick={() => toggleAnimal(animal.id)}
                >
                  <div className="p-check">
                    {selectedAnimals.includes(animal.id) && <CheckCircle2 size={16} />}
                  </div>
                  <div className="p-info">
                    <span className="p-brinco">#{animal.brinco}</span>
                    <span className="p-meta">{animal.raca} | {animal.categoria}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .elite-selection-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
        .text-btn-sm { background: none; border: none; font-size: 10px; font-weight: 800; color: hsl(var(--brand)); cursor: pointer; letter-spacing: 0.05em; text-transform: uppercase; }
        .elite-animal-picker { max-height: 240px; overflow-y: auto; background: hsl(var(--bg-main)); border: 1px solid hsl(var(--border)); border-radius: 12px; padding: 12px; }
        .picker-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
        .picker-item { display: flex; align-items: center; gap: 10px; padding: 10px; background: white; border: 1px solid hsl(var(--border)); border-radius: 8px; cursor: pointer; transition: all 0.2s; }
        .picker-item:hover { border-color: hsl(var(--brand)); transform: translateY(-1px); }
        .picker-item.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); }
        .p-check { width: 18px; height: 18px; border: 2px solid hsl(var(--border)); border-radius: 4px; display: flex; align-items: center; justify-content: center; color: hsl(var(--brand)); }
        .active .p-check { border-color: hsl(var(--brand)); }
        .p-info { display: flex; flex-direction: column; gap: 2px; }
        .p-brinco { font-size: 12px; font-weight: 800; color: hsl(var(--text-main)); }
        .p-meta { font-size: 9px; font-weight: 600; color: hsl(var(--text-muted)); text-transform: uppercase; }
        .picker-loading, .picker-empty { padding: 24px; text-align: center; font-size: 12px; font-weight: 600; color: hsl(var(--text-muted)); }
      `}</style>
    </FormModal>
  );
};
