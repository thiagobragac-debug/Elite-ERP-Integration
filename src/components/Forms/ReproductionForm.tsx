import React, { useState, useEffect, useMemo } from 'react';
import { 
  Heart, 
  Baby,
  Thermometer,
  Activity,
  Calendar,
  Layers,
  Beef,
  FileText,
  Hash,
  AlertTriangle,
  CalendarDays,
  Target,
  ChevronDown
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';

interface ReproductionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export const ReproductionForm: React.FC<ReproductionFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    animal_id: '',
    tipo_evento: 'IATF',
    data_evento: new Date().toISOString().split('T')[0],
    resultado: '',
    resultado_diagnostico: 'Prenha',
    dias_gestacao: '',
    sexo_cria: 'Macho',
    id_cria: '',
    touro: '',
    ecc: '3',
    observacoes: '',
    status: 'pending'
  });

  React.useEffect(() => {
    if (initialData) {
      setFormData({
        animal_id: initialData.animal_id || '',
        tipo_evento: initialData.tipo_evento || 'IATF',
        data_evento: initialData.data_evento || new Date().toISOString().split('T')[0],
        resultado: initialData.resultado || '',
        resultado_diagnostico: initialData.resultado_diagnostico || 'Prenha',
        dias_gestacao: initialData.dias_gestacao || '',
        sexo_cria: initialData.sexo_cria || 'Macho',
        id_cria: initialData.id_cria || '',
        touro: initialData.touro || '',
        ecc: initialData.ecc?.toString() || '3',
        observacoes: initialData.observacoes || '',
        status: initialData.status || 'pending'
      });
    } else {
      setFormData({
        animal_id: '',
        tipo_evento: 'IATF',
        data_evento: new Date().toISOString().split('T')[0],
        resultado: '',
        resultado_diagnostico: 'Prenha',
        dias_gestacao: '',
        sexo_cria: 'Macho',
        id_cria: '',
        touro: '',
        ecc: '3',
        observacoes: '',
        status: 'pending'
      });
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  // --- REPRODUCTION ENGINE ---
  const reproductionStats = useMemo(() => {
    const dataEvento = new Date(formData.data_evento);
    let prevDataStr = '';
    let prevLabel = '';
    let warningMsg = '';

    if (formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta') {
      const prevToque = new Date(dataEvento);
      prevToque.setDate(prevToque.getDate() + 30);
      prevDataStr = prevToque.toLocaleDateString('pt-BR');
      prevLabel = 'Previsão de Toque';
    } else if (formData.tipo_evento === 'Palpação' && formData.resultado_diagnostico === 'Prenha') {
      const diasG = parseInt(formData.dias_gestacao) || 0;
      if (diasG > 0) {
        const prevParto = new Date();
        // Assume gestação média de 285 dias
        const diasFaltantes = 285 - diasG;
        prevParto.setDate(prevParto.getDate() + diasFaltantes);
        prevDataStr = prevParto.toLocaleDateString('pt-BR');
        prevLabel = 'Previsão de Parto';
      }
    }

    const eccNum = parseFloat(formData.ecc);
    if (eccNum > 0 && eccNum < 2.5 && (formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta')) {
      warningMsg = 'Atenção: Matriz com ECC muito baixo. Alto risco de falha na concepção.';
    } else if (eccNum > 0 && eccNum > 4.5 && formData.tipo_evento === 'Parto') {
      warningMsg = 'Matriz excessivamente gorda. Fique alerta para possível distocia (dificuldade de parto).';
    }

    return { prevDataStr, prevLabel, warningMsg, eccNum };
  }, [formData.data_evento, formData.tipo_evento, formData.resultado_diagnostico, formData.dias_gestacao, formData.ecc]);

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Evento Reprodutivo" : "Novo Evento Reprodutivo"}
      subtitle={initialData ? "Atualize as informações do evento." : "Lance inseminações, toques ou partos."}
      icon={Heart}
      loading={loading}
      submitLabel={initialData ? "Atualizar Evento" : "Salvar Evento"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Evento</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Beef size={14} /> Animal / Matriz</label>
            <div style={{ position: 'relative' }}>
              <Hash size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Brinco ou ID da Matriz..." 
                style={{ paddingLeft: '32px' }}
                value={formData.animal_id}
                onChange={(e) => setFormData({...formData, animal_id: e.target.value})}
                required 
              />
            </div>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Tipo de Evento</label>
            <SearchableSelect 
              value={formData.tipo_evento}
              onChange={(val: any) => setFormData({...formData, tipo_evento: val})}
              options={[
                { value: `IATF`, label: `IATF / Inseminação` },
                { value: `Palpação`, label: `Toque / Palpação` },
                { value: `Parto`, label: `Parto` },
                { value: `Monta`, label: `Monta Natural` },
                { value: `Secagem`, label: `Secagem` },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Calendar size={14} /> Data do Evento</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_evento}
              onChange={(e) => setFormData({...formData, data_evento: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <div className="tauze-form-radio-group">
              <div 
                className={`tauze-form-radio-item ${formData.status === 'pending' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'pending'})}
              >
                <Calendar size={16} />
                <span>Agendado</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.status === 'completed' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, status: 'completed'})}
              >
                <Activity size={16} />
                <span>Concluído</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Resultados e Informações</h4>
        </div>

        {/* ALERTA ZOOTÉCNICO (ECC) */}
        {reproductionStats.warningMsg && (
          <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'hsl(38 92% 50% / 0.1)', border: '1px solid hsl(38 92% 50% / 0.3)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'hsl(38 92% 40%)' }}>
            <AlertTriangle size={18} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '13px', fontWeight: 700 }}>{reproductionStats.warningMsg}</span>
          </div>
        )}

        <div className="tauze-input-grid grid-col-2">
          
          {/* ----- FORMULÁRIO MUTANTE: IATF / MONTA ----- */}
          {(formData.tipo_evento === 'IATF' || formData.tipo_evento === 'Monta') && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Protocolo Hormonal</label>
                <SearchableSelect 
                  value={formData.resultado}
                  onChange={(val: any) => setFormData({...formData, resultado: val})}
                  options={[
                    { value: `Ovsynch`, label: `Ovsynch` },
                    { value: `J-Synch`, label: `J-Synch` },
                    { value: `Presynch`, label: `Presynch` },
                    { value: `Outro`, label: `Outro Protocolo` }
                  ]}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label"><Hash size={14} /> Touro / Partida de Sêmen</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Nome do Touro ou Lote..." 
                  value={formData.touro}
                  onChange={(e) => setFormData({...formData, touro: e.target.value})}
                />
              </div>
            </>
          )}

          {/* ----- FORMULÁRIO MUTANTE: TOQUE / PALPAÇÃO ----- */}
          {formData.tipo_evento === 'Palpação' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Target size={14} /> Diagnóstico</label>
                <SearchableSelect 
                  value={formData.resultado_diagnostico}
                  onChange={(val: any) => setFormData({...formData, resultado_diagnostico: val})}
                  options={[
                    { value: `Prenha`, label: `Prenha (Positivo)` },
                    { value: `Vazia`, label: `Vazia (Negativo)` },
                    { value: `Duvidosa`, label: `Duvidosa (Re-Toque)` }
                  ]}
                />
              </div>
              {formData.resultado_diagnostico === 'Prenha' && (
                <div className="tauze-field-group">
                  <label className="tauze-label"><CalendarDays size={14} /> Dias de Gestação</label>
                  <input 
                    className="tauze-input"
                    type="number" 
                    placeholder="Ex: 45" 
                    value={formData.dias_gestacao}
                    onChange={(e) => setFormData({...formData, dias_gestacao: e.target.value})}
                  />
                </div>
              )}
            </>
          )}

          {/* ----- FORMULÁRIO MUTANTE: PARTO ----- */}
          {formData.tipo_evento === 'Parto' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Condição do Parto</label>
                <SearchableSelect 
                  value={formData.resultado}
                  onChange={(val: any) => setFormData({...formData, resultado: val})}
                  options={[
                    { value: `Normal`, label: `Normal (Eutócico)` },
                    { value: `Distocia`, label: `Complicado (Distocia)` },
                    { value: `Aborto`, label: `Aborto / Natimorto` }
                  ]}
                />
              </div>
              {formData.resultado !== 'Aborto' && (
                <>
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Baby size={14} /> Sexo da Cria</label>
                    <SearchableSelect 
                      value={formData.sexo_cria}
                      onChange={(val: any) => setFormData({...formData, sexo_cria: val})}
                      options={[
                        { value: `Macho`, label: `Macho` },
                        { value: `Fêmea`, label: `Fêmea` }
                      ]}
                    />
                  </div>
                  <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                    <label className="tauze-label"><Hash size={14} /> ID / Brinco da Cria (Opcional)</label>
                    <input 
                      className="tauze-input"
                      type="text" 
                      placeholder="Identificação do novo bezerro..." 
                      value={formData.id_cria}
                      onChange={(e) => setFormData({...formData, id_cria: e.target.value})}
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* ----- CAMPOS COMPARTILHADOS ----- */}
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Activity size={14} /> ECC (Escore de Condição Corporal)</span>
              <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>1 (Muito Magra) a 5 (Obesa)</span>
            </label>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              {[1, 2, 3, 4, 5].map(score => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setFormData({...formData, ecc: score.toString()})}
                  style={{
                    flex: 1, padding: '12px 0', borderRadius: '10px', fontWeight: 800, fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s',
                    background: formData.ecc === score.toString() ? 'hsl(var(--brand))' : 'hsl(var(--bg-main))',
                    color: formData.ecc === score.toString() ? 'white' : 'hsl(var(--text-main))',
                    border: `1.5px solid ${formData.ecc === score.toString() ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`
                  }}
                >
                  {score}
                </button>
              ))}
            </div>
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observações</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Notas adicionais sobre o procedimento..." 
              value={formData.observacoes}
              onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
              rows={3}
            />
          </div>
        </div>
      </section>

      {/* DASHBOARD PREDITIVO (SMART BADGE) */}
      {reproductionStats.prevDataStr && (
        <section style={{ 
          marginTop: '8px', 
          padding: '18px 24px', 
          borderRadius: '14px', 
          background: 'linear-gradient(145deg, hsl(var(--brand) / 0.08) 0%, hsl(var(--brand) / 0.02) 100%)',
          border: '1.5px dashed hsl(var(--brand) / 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'hsl(var(--bg-card))', padding: '10px', borderRadius: '10px', color: 'hsl(var(--brand))', boxShadow: '0 4px 10px rgba(0,0,0,0.03)' }}>
              <CalendarDays size={20} />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {reproductionStats.prevLabel}
              </div>
              <div style={{ fontSize: '16px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
                {reproductionStats.prevDataStr}
              </div>
            </div>
          </div>
        </section>
      )}
    </SidePanel>
  );
};
