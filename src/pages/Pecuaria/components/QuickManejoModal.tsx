import React, { useState, useEffect } from 'react';
import { Scale, HeartPulse, Calendar, FileText, Hash, Stethoscope, Activity, AlertCircle, Sparkles } from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { supabase } from '../../../lib/supabase';
import { SearchableSelect } from '../../../components/Forms/SearchableSelect';

interface QuickManejoModalProps {
  isOpen: boolean;
  onClose: () => void;
  animal: any;
  activeTenantId: string;
  activeFarmId: string;
  insertPayload: any;
  onSuccess: () => void;
}

export const QuickManejoModal: React.FC<QuickManejoModalProps> = ({
  isOpen,
  onClose,
  animal,
  activeTenantId,
  activeFarmId,
  insertPayload,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'PESO' | 'SANIDADE'>('PESO');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for Weighing (Pesagem)
  const [weightData, setWeightData] = useState({
    peso: '',
    data_pesagem: new Date().toISOString().split('T')[0],
    observacao: ''
  });

  // States for Sanitary (Sanidade)
  const [healthData, setHealthData] = useState({
    tipo: 'VACINA',
    data_manejo: new Date().toISOString().split('T')[0],
    titulo: '',
    produto: '',
    dose: '',
    via_aplicacao: 'IM',
    local_aplicacao: '',
    carencia_dias: '0',
    observacao: '',
    status: 'REALIZADO'
  });

  // Reset forms on open/change animal
  useEffect(() => {
    if (isOpen && animal) {
      setErrorMsg(null);
      setWeightData({
        peso: animal.peso_atual?.toString() || '',
        data_pesagem: new Date().toISOString().split('T')[0],
        observacao: ''
      });
      setHealthData({
        tipo: 'VACINA',
        data_manejo: new Date().toISOString().split('T')[0],
        titulo: '',
        produto: '',
        dose: '',
        via_aplicacao: 'IM',
        local_aplicacao: '',
        carencia_dias: '0',
        observacao: '',
        status: 'REALIZADO'
      });
    }
  }, [isOpen, animal]);

  if (!isOpen || !animal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'PESO') {
      await handleWeightSubmit();
    } else {
      await handleHealthSubmit();
    }
  };

  const handleWeightSubmit = async () => {
    if (!weightData.peso || parseFloat(weightData.peso) <= 0) {
      setErrorMsg('Por favor, insira um peso válido maior que zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        animal_id: animal.id,
        peso: parseFloat(weightData.peso),
        data_pesagem: weightData.data_pesagem,
        observacao: weightData.observacao || 'Registrado via Manejo Rápido',
        ...insertPayload
      };

      const { error } = await supabase.from('pesagens').insert([payload]);
      if (error) throw error;

      // Update animal's current weight as well (best practice to keep animal record synchronized)
      await supabase.from('animais').update({
        peso_atual: parseFloat(weightData.peso)
      }).eq('id', animal.id);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar pesagem rápida:', err);
      setErrorMsg(err.message || 'Erro inesperado ao registrar pesagem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleHealthSubmit = async () => {
    if (!healthData.titulo) {
      setErrorMsg('Por favor, informe o título/descrição do manejo.');
      return;
    }
    if (!healthData.produto) {
      setErrorMsg('Por favor, informe o produto utilizado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const payload = {
        animal_id: animal.id,
        lote_id: animal.lote_id || null,
        tipo: healthData.tipo,
        titulo: healthData.titulo,
        data_manejo: healthData.data_manejo,
        produto: healthData.produto,
        dose: healthData.dose || null,
        via_aplicacao: healthData.via_aplicacao || null,
        local_aplicacao: healthData.local_aplicacao || null,
        carencia_dias: parseInt(healthData.carencia_dias) || 0,
        observacao: healthData.observacao || 'Registrado via Manejo Rápido',
        status: healthData.status,
        ...insertPayload
      };

      const { error } = await supabase.from('sanidade').insert([payload]);
      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao salvar manejo sanitário rápido:', err);
      setErrorMsg(err.message || 'Erro inesperado ao registrar manejo sanitário.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Manejo Rápido"
      subtitle={`Registrar evento zootécnico para o animal de brinco #${animal.brinco}`}
      icon={Activity}
      loading={isSubmitting}
      submitLabel={activeTab === 'PESO' ? 'Registrar Pesagem' : 'Registrar Manejo Sanitário'}
      size="medium"
    >
      {/* Segmented Control wrapper that spans full width */}
      <div className="tauze-field-group" style={{ gridColumn: 'span 2', marginBottom: '8px' }}>
        <div className="tauze-segmented-control">
          <button 
            type="button"
            className={`segment-item ${activeTab === 'PESO' ? 'active' : ''}`}
            onClick={() => { setActiveTab('PESO'); setErrorMsg(null); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <Scale size={16} />
            Pesagem
          </button>
          <button 
            type="button"
            className={`segment-item ${activeTab === 'SANIDADE' ? 'active' : ''}`}
            onClick={() => { setActiveTab('SANIDADE'); setErrorMsg(null); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <HeartPulse size={16} />
            Sanitário
          </button>
        </div>
      </div>

      {errorMsg && (
        <div style={{
          gridColumn: 'span 2',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: 600,
          marginBottom: '8px'
        }}>
          <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {activeTab === 'PESO' ? (
        <div className="form-grid">
          <div className="tauze-field-group">
            <label className="tauze-label"><Scale size={14} /> Peso Atual (kg)</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                className="tauze-input"
                type="number" 
                step="0.01"
                placeholder="0.00" 
                value={weightData.peso}
                onChange={e => setWeightData({ ...weightData, peso: e.target.value })}
                required
                disabled={isSubmitting}
                style={{ paddingRight: '48px', fontSize: '16px', fontWeight: 800 }}
                autoFocus
              />
              <span style={{
                position: 'absolute',
                right: '16px',
                fontSize: '12px',
                fontWeight: 800,
                color: 'hsl(var(--text-muted))',
                background: 'rgba(0, 0, 0, 0.05)',
                padding: '4px 8px',
                borderRadius: '6px',
                pointerEvents: 'none'
              }}>kg</span>
            </div>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data da Pesagem</label>
            <input 
              className="tauze-input"
              type="date" 
              value={weightData.data_pesagem}
              onChange={e => setWeightData({ ...weightData, data_pesagem: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observação</label>
            <textarea 
              className="tauze-input"
              placeholder="Ex: Animal calmo, pesagem de rotina..." 
              value={weightData.observacao}
              onChange={e => setWeightData({ ...weightData, observacao: e.target.value })}
              disabled={isSubmitting}
              rows={3}
            />
          </div>
        </div>
      ) : (
        <div className="form-grid">
          <div className="tauze-field-group">
            <label className="tauze-label"><Stethoscope size={14} /> Tipo de Manejo</label>
            <SearchableSelect
              value={healthData.tipo}
              onChange={val => setHealthData({ ...healthData, tipo: val })}
              disabled={isSubmitting}
              options={[
                { value: 'VACINA', label: 'Vacina' },
                { value: 'VERMIFUGO', label: 'Vermífugo' },
                { value: 'MEDICAMENTO', label: 'Medicamento' },
                { value: 'TRATAMENTO', label: 'Tratamento' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Manejo</label>
            <input 
              className="tauze-input"
              type="date" 
              value={healthData.data_manejo}
              onChange={e => setHealthData({ ...healthData, data_manejo: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Título / Descrição</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Vacinação contra Febre Aftosa" 
              value={healthData.titulo}
              onChange={e => setHealthData({ ...healthData, titulo: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Sparkles size={14} /> Fármaco / Produto</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Aftovax" 
              value={healthData.produto}
              onChange={e => setHealthData({ ...healthData, produto: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Dose</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: 2 ml" 
              value={healthData.dose}
              onChange={e => setHealthData({ ...healthData, dose: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Via de Aplicação</label>
            <SearchableSelect
              value={healthData.via_aplicacao}
              onChange={val => setHealthData({ ...healthData, via_aplicacao: val })}
              disabled={isSubmitting}
              options={[
                { value: 'IM', label: 'Intramuscular (IM)' },
                { value: 'SC', label: 'Subcutânea (SC)' },
                { value: 'ORAL', label: 'Oral' },
                { value: 'TOPICO', label: 'Tópico' },
                { value: 'IV', label: 'Intravenosa (IV)' }
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><AlertCircle size={14} /> Carência (Dias)</label>
            <input 
              className="tauze-input"
              type="number" 
              min="0"
              placeholder="0" 
              value={healthData.carencia_dias}
              onChange={e => setHealthData({ ...healthData, carencia_dias: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Hash size={14} /> Local de Aplicação</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Tábua do pescoço" 
              value={healthData.local_aplicacao}
              onChange={e => setHealthData({ ...healthData, local_aplicacao: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <SearchableSelect
              value={healthData.status}
              onChange={val => setHealthData({ ...healthData, status: val })}
              disabled={isSubmitting}
              options={[
                { value: 'REALIZADO', label: 'Realizado' },
                { value: 'PENDENTE', label: 'Pendente' }
              ]}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observações</label>
            <textarea 
              className="tauze-input"
              placeholder="Ex: Aplicação tranquila..." 
              value={healthData.observacao}
              onChange={e => setHealthData({ ...healthData, observacao: e.target.value })}
              disabled={isSubmitting}
              rows={2}
            />
          </div>
        </div>
      )}

      <style>{`
        .tauze-segmented-control {
          display: flex;
          background: hsl(var(--bg-main));
          padding: 6px;
          border-radius: 16px;
          gap: 6px;
          border: 1px solid hsl(var(--border));
          width: 100%;
        }

        .segment-item {
          flex: 1;
          padding: 12px;
          font-size: 12px;
          font-weight: 800;
          color: hsl(var(--text-muted));
          border-radius: 12px;
          transition: all 0.2s;
          background: transparent;
          border: none;
          cursor: pointer;
        }

        .segment-item.active {
          background: white;
          color: hsl(var(--brand));
          box-shadow: var(--shadow-md);
        }

        [data-theme='dark'] .segment-item.active {
          background: hsl(var(--bg-card));
          color: hsl(var(--brand));
        }
      `}</style>
    </SidePanel>
  );
};
