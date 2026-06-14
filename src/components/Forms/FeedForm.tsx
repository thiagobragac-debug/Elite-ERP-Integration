import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SidePanel } from '../Layout/SidePanel';
import { ConsumptionCart } from './ConsumptionCart';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { Wheat, Calendar, Layers, Activity, FileText, CheckCircle, ChevronRight, CheckSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { DateInput } from '../../components/Form/DateInput';


interface FeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  actionId?: number;
}

export const FeedForm: React.FC<FeedFormProps> = ({ isOpen, onClose, onSubmit, actionId }) => {
  const { activeFarm } = useTenant();
  const [formData, setFormData] = usePersistentState('FeedForm_formData', {
    lote_id: '',
    dieta_id: '',
    data_trato: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    observacoes: ''
  });
  
  const [cartItems, setCartItems] = usePersistentState<any[]>('FeedForm_cartItems', []);
  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);
  const [dietas, setDietas] = useState<any[]>([]);

  const [activeEtapa, setActiveEtapa] = useState('dados');

  const isDadosDone = !!formData.lote_id && !!formData.data_trato;
  const isInsumosDone = cartItems.length > 0 && cartItems.every((i: any) => !!i.produto_id && !!i.quantidade);

  const ETAPAS_CONFIG = [
    { id: 'dados', label: '1. Dados e Dieta', icon: FileText, color: '#3b82f6' },
    { id: 'insumos', label: '2. Insumos Consumidos', icon: Wheat, color: '#f59e0b' },
  ];

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    // Buscar lotes
    const { data: lotesData } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'ATIVO');
    if (lotesData) setLotes(lotesData);

    // Buscar dietas
    const { data: dietasData } = await supabase
      .from('dietas')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'active');
    if (dietasData) setDietas(dietasData);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, insumos: cartItems });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Registro de Trato (Fornecimento)"
      subtitle="Lance o consumo diário de ração, sal ou suplementos para os lotes."
      icon={Wheat}
      loading={loading}
      submitLabel="Salvar Trato"
      hideSubmit={!isDadosDone || !isInsumosDone}
    >
      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'dados') isCompleted = isDadosDone;
            if (et.id === 'insumos') isCompleted = isInsumosDone;

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;
            
            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', padding: '12px',
                  borderRadius: '12px', border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer', textAlign: 'left', fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none'
                }}
              >
                <div style={{ 
                  width: '32px', height: '32px', borderRadius: '8px', 
                  background: isCompleted ? et.color : isActive ? `${et.color}30` : 'hsl(var(--bg-main))',
                  color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {isCompleted && !isActive ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            )
          })}
        </div>

        {/* Right Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>
            <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {ETAPAS_CONFIG.find(e => e.id === activeEtapa)?.label}
              </h3>
              <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                {activeEtapa === 'dados' && "Informações básicas sobre o lote e a dieta fornecida."}
                {activeEtapa === 'insumos' && "Informe as quantidades fornecidas e os depósitos de onde sairão os insumos."}
              </p>
            </div>

            {activeEtapa === 'dados' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="tauze-input-grid grid-col-2">
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Layers size={14} /> Lote / Curral</label>
                    <SearchableSelect 
                      value={formData.lote_id}
                      onChange={(val: any) => setFormData({...formData, lote_id: val})}
                      options={lotes.map(l => ({ value: l.id, label: l.nome }))}
                      placeholder="Selecione o Lote..."
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label"><Activity size={14} /> Dieta / Formulação</label>
                    <SearchableSelect 
                      value={formData.dieta_id}
                      onChange={(val: any) => setFormData({...formData, dieta_id: val})}
                      options={dietas.map(d => ({ value: d.id, label: d.nome }))}
                      placeholder="Selecione a Dieta..."
                    />
                  </div>

                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label"><Calendar size={14} /> Data do Trato</label>
                    <DateInput 
                      className="tauze-input"
                      value={formData.data_trato}
                      onChange={(e) => setFormData({...formData, data_trato: e.target.value})}
                      required
                    />
                  </div>
                  
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label"><FileText size={14} /> Observações</label>
                    <textarea 
                      className="tauze-input tauze-textarea"
                      placeholder="Notas sobre o fornecimento..." 
                      value={formData.observacoes}
                      onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                      rows={2}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeEtapa === 'insumos' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <ConsumptionCart 
                  items={cartItems} 
                  onChange={setCartItems} 
                  title="Insumos Consumidos"
                  subtitle="Itens serão deduzidos do estoque selecionado."
                  filterModule="pecuaria_nutricao"
                  hideDeposit={false}
                />
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </SidePanel>
  );
};
