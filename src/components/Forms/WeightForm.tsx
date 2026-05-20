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
  Activity,
  AlertTriangle,
  Award
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface WeightFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export const WeightForm: React.FC<WeightFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [animals, setAnimals] = useState<any[]>([]);
  const [lastWeighing, setLastWeighing] = useState<any>(null);
  const [formData, setFormData] = useState({
    animal_id: '',
    data_pesagem: new Date().toISOString().split('T')[0],
    peso: '',
    lote_id: '',
    observacao: ''
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchAnimals();
    }
  }, [isOpen, activeFarm, activeTenantId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        data_pesagem: initialData.data_pesagem || new Date().toISOString().split('T')[0],
        peso: initialData.peso?.toString() || '',
        lote_id: initialData.lote_id || '',
        observacao: initialData.observacao || ''
      });
      if (initialData.animal_id && animals.length > 0) {
        const animal = animals.find(a => a.id === initialData.animal_id);
        if (animal) setSearchQuery(animal.brinco);
      }
    } else {
      setFormData({
        animal_id: '',
        data_pesagem: new Date().toISOString().split('T')[0],
        peso: '',
        lote_id: '',
        observacao: ''
      });
      setSearchQuery('');
      setLastWeighing(null);
    }
  }, [initialData, isOpen, animals]);

  const fetchAnimals = async () => {
    try {
      if (!activeTenantId) return;

      let query = supabase
        .from('animais')
        .select('id, brinco, peso_inicial')
        .eq('tenant_id', activeTenantId)
        .ilike('status', 'ativo');

      if (!isGlobalMode && activeFarm?.id) {
        query = query.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }

      const { data } = await query;
      if (data) {
        setAnimals(data);
        if (formData.animal_id) {
          const animal = data.find(a => a.id === formData.animal_id);
          if (animal) setSearchQuery(animal.brinco);
        }
      }
    } catch (err) {
      console.error('Error fetching animals:', err);
    }
  };

  const fetchLastWeight = async (animalId: string) => {
    try {
      const { data } = await supabase
        .from('pesagens')
        .select('*')
        .eq('animal_id', animalId)
        .order('data_pesagem', { ascending: false })
        .limit(1);
      
      if (data && data[0]) {
        setLastWeighing(data[0]);
      } else {
        const animal = animals.find(a => a.id === animalId);
        if (animal) {
          setLastWeighing({ peso: animal.peso_inicial, data_pesagem: null, isInitial: true });
        }
      }
    } catch (err) {
      console.error('Error fetching last weight:', err);
    }
  };

  const handleAnimalChange = (id: string) => {
    setFormData({ ...formData, animal_id: id });
    if (id) fetchLastWeight(id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.animal_id) {
      alert('⚠️ Por favor, selecione um animal válido usando o campo de busca.');
      return;
    }
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
      setSearchQuery('');
      setLastWeighing(null);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnimals = animals.filter(a => 
    a.brinco?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="form-group full-width" style={{ position: 'relative' }}>
        <label><Hash size={14} /> Selecionar Animal (Brinco)</label>
        <div className="autocomplete-wrapper" style={{ position: 'relative', width: '100%' }}>
          <div className="search-input-container" style={{ position: 'relative', width: '100%' }}>
            <input 
              type="text" 
              placeholder="Digite para filtrar pelo brinco..." 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
                if (formData.animal_id) {
                  setFormData({ ...formData, animal_id: '' });
                  setLastWeighing(null);
                }
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => {
                // Delay closing to allow onClick events inside option elements to process
                setTimeout(() => setShowDropdown(false), 200);
              }}
              required={!formData.animal_id}
              style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
            />
            <Search 
              size={16} 
              style={{ 
                position: 'absolute', 
                right: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)', 
                color: 'var(--text-muted)',
                pointerEvents: 'none'
              }} 
            />
          </div>

          {showDropdown && (
            <div className="autocomplete-dropdown animate-fade-in" style={{
              position: 'absolute',
              top: 'calc(100% + 4px)',
              left: 0,
              width: '100%',
              maxHeight: '180px',
              overflowY: 'auto',
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px',
              zIndex: 999,
              boxShadow: 'var(--shadow-lg)'
            }}>
              {filteredAnimals.length === 0 ? (
                <div style={{ padding: '12px', color: 'hsl(var(--text-muted))', fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>
                  Nenhum animal cadastrado ou ativo com este brinco
                </div>
              ) : (
                filteredAnimals.map(a => (
                  <div 
                    key={a.id} 
                    className="autocomplete-option"
                    onMouseDown={() => {
                      setSearchQuery(a.brinco);
                      handleAnimalChange(a.id);
                      setShowDropdown(false);
                    }}
                    style={{
                      padding: '10px 16px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'hsl(var(--text-main))',
                      borderBottom: '1px solid hsl(var(--border))'
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Hash size={12} color="hsl(var(--brand))" />
                      Brinco {a.brinco}
                    </span>
                    {a.peso_inicial && (
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                        Peso Inicial: {a.peso_inicial} kg
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {lastWeighing && (() => {
        const lastWeightVal = Number(lastWeighing.peso);
        const newWeightVal = Number(formData.peso);
        const hasWeight = !!formData.peso && !isNaN(newWeightVal);
        const diff = hasWeight ? newWeightVal - lastWeightVal : 0;
        const percentChange = hasWeight ? (diff / lastWeightVal) * 100 : 0;
        const isTypoWarning = hasWeight && Math.abs(percentChange) > 15;
        const isSlaughterTargetReached = hasWeight && newWeightVal >= 450;
        
        return (
          <div className="performance-preview-card full-width animate-fade-in" style={{
            background: 'linear-gradient(135deg, hsl(var(--brand) / 0.08) 0%, hsl(var(--brand) / 0.02) 100%)',
            border: isTypoWarning ? '1.5px dashed hsl(38 92% 50%)' : '1.5px dashed hsl(var(--brand) / 0.3)',
            borderRadius: '20px',
            padding: '20px',
            marginBottom: '24px',
            gridColumn: 'span 4',
            boxShadow: 'inset 0 0 12px hsl(var(--brand) / 0.05)'
          }}>
            <div className="preview-header" style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
              borderBottom: '1px solid hsl(var(--border) / 0.5)',
              paddingBottom: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isTypoWarning ? 'hsl(38 92% 50%)' : 'hsl(var(--brand))', fontWeight: 800, fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Activity size={16} className="pulse-active" />
                <span>Painel de Performance Individual</span>
              </div>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, background: 'hsl(var(--bg-main))', padding: '4px 10px', borderRadius: '20px', border: '1px solid hsl(var(--border))' }}>
                Intervalo: {(() => {
                  const lastDate = new Date(lastWeighing.data_pesagem || lastWeighing.created_at);
                  const currDate = new Date(formData.data_pesagem);
                  const diffTime = currDate.getTime() - lastDate.getTime();
                  const diffDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                  return `${diffDays} ${diffDays === 1 ? 'dia' : 'dias'}`;
                })()}
              </span>
            </div>

            <div className="preview-grid" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '20px'
            }}>
              {/* Peso Anterior */}
              <div className="preview-stat" style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}>
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Peso Anterior</span>
                <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>{Number(lastWeighing.peso).toFixed(2)} kg</span>
                <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>
                  {lastWeighing.isInitial ? 'Peso Inicial' : new Date(lastWeighing.data_pesagem).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {/* Diferença de Peso */}
              <div className="preview-stat" style={{ borderRight: '1px solid hsl(var(--border) / 0.5)', paddingRight: '12px' }}>
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>Evolução</span>
                {hasWeight ? (
                  (() => {
                    const isPositive = diff >= 0;
                    return (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)', margin: '4px 0' }}>
                            {isPositive ? `+${diff.toFixed(2)}` : diff.toFixed(2)} kg
                          </span>
                          {isSlaughterTargetReached && (
                            <span style={{ 
                              fontSize: '9px', 
                              fontWeight: 900, 
                              color: 'hsl(142 71% 45%)', 
                              background: 'hsl(142 71% 45% / 0.1)', 
                              padding: '2px 6px', 
                              borderRadius: '6px', 
                              textTransform: 'uppercase',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px'
                            }}>
                              <Award size={10} />
                              🏆 Abate
                            </span>
                          )}
                        </div>
                        <span className="p-meta" style={{ fontSize: '11px', fontWeight: 700, color: isPositive ? 'hsl(142 71% 45%)' : 'hsl(0 84% 60%)' }}>
                          {isPositive ? 'Ganho de Peso' : 'Perda de Peso'}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span className="p-value" style={{ fontSize: '22px', fontWeight: 800, color: 'hsl(var(--text-muted) / 0.6)', margin: '6px 0', display: 'block' }}>-- kg</span>
                    <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Aguardando peso...</span>
                  </>
                )}
              </div>

              {/* GMD Projetado */}
              <div className="preview-stat">
                <span className="p-label" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontWeight: 700, textTransform: 'uppercase' }}>GMD Projetado</span>
                {hasWeight ? (
                  (() => {
                    const lastDate = new Date(lastWeighing.data_pesagem || lastWeighing.created_at);
                    const currDate = new Date(formData.data_pesagem);
                    const diffTime = currDate.getTime() - lastDate.getTime();
                    const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
                    const gmd = diff / diffDays;
                    
                    let badgeColor = 'hsl(38 92% 50%)'; // orange
                    let badgeBg = 'hsl(38 92% 50% / 0.1)';
                    let rating = 'Regular';

                    if (gmd >= 0.8) {
                      badgeColor = 'hsl(142 71% 45%)'; // green
                      badgeBg = 'hsl(142 71% 45% / 0.1)';
                      rating = 'Excelente';
                    } else if (gmd < 0) {
                      badgeColor = 'hsl(0 84% 60%)'; // red
                      badgeBg = 'hsl(0 84% 60% / 0.1)';
                      rating = 'Perda Crítica';
                    } else if (gmd < 0.3) {
                      badgeColor = 'hsl(38 92% 50%)'; // yellow/orange
                      badgeBg = 'hsl(38 92% 50% / 0.1)';
                      rating = 'Baixo Ganho';
                    }

                    return (
                      <>
                        <span className="p-value" style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))', margin: '4px 0', display: 'block' }}>
                          {gmd.toFixed(2)} <span style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>kg/dia</span>
                        </span>
                        <span style={{ 
                          fontSize: '9px', 
                          fontWeight: 900, 
                          color: badgeColor, 
                          background: badgeBg, 
                          padding: '2px 8px', 
                          borderRadius: '6px', 
                          textTransform: 'uppercase', 
                          display: 'inline-block',
                          marginTop: '2px'
                        }}>
                          {rating}
                        </span>
                      </>
                    );
                  })()
                ) : (
                  <>
                    <span className="p-value" style={{ fontSize: '22px', fontWeight: 800, color: 'hsl(var(--text-muted) / 0.6)', margin: '6px 0', display: 'block' }}>-- kg/dia</span>
                    <span className="p-meta" style={{ fontSize: '11px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Informe o peso acima</span>
                  </>
                )}
              </div>
            </div>

            {/* Smart Typo Guard Warning Alert Box */}
            {isTypoWarning && (
              <div className="animate-fade-in" style={{
                marginTop: '16px',
                padding: '10px 14px',
                background: 'hsl(38 92% 50% / 0.1)',
                border: '1.5px solid hsl(38 92% 50% / 0.3)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'hsl(38 92% 50%)',
                fontSize: '11.5px',
                fontWeight: 700,
                lineHeight: 1.4
              }}>
                <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                <span>
                  <strong>Atenção:</strong> Variação de peso muito acentuada ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%). Recomendamos verificar a pesagem antes de salvar para evitar erros de registro no rebanho!
                </span>
              </div>
            )}
          </div>
        );
      })()}

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
        .autocomplete-option:hover {
          background: hsl(var(--brand) / 0.1) !important;
          color: hsl(var(--brand)) !important;
        }
        .autocomplete-dropdown::-webkit-scrollbar {
          width: 6px;
        }
        .autocomplete-dropdown::-webkit-scrollbar-thumb {
          background: var(--border);
          border-radius: 4px;
        }
        .performance-preview-card {
          background: hsl(var(--brand) / 0.05);
          border: 1px solid hsl(var(--brand) / 0.2);
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 20px;
          grid-column: span 4;
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
