import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  HeartPulse, 
  Calendar,
  Search,
  FlaskConical,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  FileText,
  Hash,
  AlertCircle,
  ShieldAlert,
  BellRing,
  UserCheck
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';

interface HealthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const HealthForm: React.FC<HealthFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const [formData, setFormData] = usePersistentState('HealthForm_formData', {
    tipo: 'vacina',
    titulo: '',
    animal_id: '',
    lote_id: '',
    data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    produto: '',
    dose: '',
    via_aplicacao: 'IM',
    local_aplicacao: '',
    carencia_dias: '',
    reforco_dias: '',
    veterinario: '',
    observacao: '',
    status: 'REALIZADO'
  });

  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (initialData) { setFormData({
        tipo: initialData.tipo || 'vacina',
        titulo: initialData.titulo || '',
        animal_id: initialData.animal_id || '',
        lote_id: initialData.lote_id || '',
        data_manejo: initialData.data_manejo || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        produto: initialData.produto || '',
        dose: initialData.dose || '',
        via_aplicacao: initialData.via_aplicacao || 'IM',
        local_aplicacao: initialData.local_aplicacao || '',
        carencia_dias: initialData.carencia_dias?.toString() || '',
        reforco_dias: initialData.reforco_dias?.toString() || '',
        veterinario: initialData.veterinario || '',
        observacao: initialData.observacao || '',
        status: initialData.status || 'REALIZADO'
      });
    } else {
      setFormData({
        tipo: 'vacina',
        titulo: '',
        animal_id: '',
        lote_id: '',
        data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        produto: '',
        dose: '',
        via_aplicacao: 'IM',
        local_aplicacao: '',
        carencia_dias: '',
        reforco_dias: '',
        veterinario: '',
        observacao: '',
        status: 'REALIZADO'
      });
    }
  }, [initialData, isOpen, actionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  // --- HEALTH ENGINE ---
  const healthStats = useMemo(() => {
    let bloqueioAbate = null;
    let dataReforco = null;

    if (formData.data_manejo) {
      const baseDate = new Date(formData.data_manejo);
      // Se não for uma data válida, cai fora
      if (!isNaN(baseDate.getTime())) {
        
        // Regra 1: Carência Abate/Leite
        const carencia = parseInt(formData.carencia_dias);
        if (carencia > 0 && formData.tipo !== 'vacina') {
          const dLiberacao = new Date(baseDate);
          dLiberacao.setDate(dLiberacao.getDate() + carencia);
          bloqueioAbate = dLiberacao.toLocaleDateString('pt-BR');
        }

        // Regra 2: Reforço Vacinal
        const reforco = parseInt(formData.reforco_dias);
        if (reforco > 0 && formData.tipo === 'vacina') {
          const dReforco = new Date(baseDate);
          dReforco.setDate(dReforco.getDate() + reforco);
          dataReforco = dReforco.toLocaleDateString('pt-BR');
        }
      }
    }

    return { bloqueioAbate, dataReforco };
  }, [formData.data_manejo, formData.carencia_dias, formData.reforco_dias, formData.tipo]);

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Registro Sanitário" : "Novo Registro Sanitário"}
      subtitle="Registre vacinas, medicamentos ou tratamentos."
      icon={HeartPulse}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Registro"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados Gerais</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Título / Descrição</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: Vacinação contra Aftosa" 
              value={formData.titulo}
              onChange={(e) => setFormData({...formData, titulo: e.target.value})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Stethoscope size={14} /> Tipo de Manejo</label>
            <SearchableSelect 
              value={formData.tipo}
              onChange={(val: any) => setFormData({...formData, tipo: val})}
              options={[
                { value: `vacina`, label: `Vacina` },
                { value: `medicamento`, label: `Medicamento / Vermífugo` },
                { value: `cirurgia`, label: `Cirurgia / Procedimento` },
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Clock size={14} /> Data do Manejo</label>
            <input 
              className="tauze-input"
              type="date" 
              value={formData.data_manejo}
              onChange={(e) => setFormData({...formData, data_manejo: e.target.value})}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Search size={14} /> Animal (Foco Individual)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="ID do animal" 
              value={formData.animal_id}
              onChange={(e) => setFormData({...formData, animal_id: e.target.value})}
              disabled={!!formData.lote_id}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Lote (Foco Coletivo)</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="ID do lote" 
              value={formData.lote_id}
              onChange={(e) => setFormData({...formData, lote_id: e.target.value})}
              disabled={!!formData.animal_id}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Protocolo e Aplicação</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          {/* CAMPOS MUTANTES DE ACORDO COM O TIPO */}
          
          <div className="tauze-field-group" style={{ gridColumn: formData.tipo === 'cirurgia' ? 'span 2' : 'span 1' }}>
            <label className="tauze-label"><FlaskConical size={14} /> Produto / Descrição do Procedimento</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder={formData.tipo === 'cirurgia' ? "Ex: Castração Inguinal" : "Ex: Aftovax 2ml"} 
              value={formData.produto}
              onChange={(e) => setFormData({...formData, produto: e.target.value})}
            />
          </div>

          {formData.tipo !== 'cirurgia' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><Hash size={14} /> Dose / Quantidade</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Ex: 2ml" 
                value={formData.dose}
                onChange={(e) => setFormData({...formData, dose: e.target.value})}
              />
            </div>
          )}

          {formData.tipo !== 'cirurgia' && (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><Activity size={14} /> Via de Aplicação</label>
                <SearchableSelect 
                  value={formData.via_aplicacao}
                  onChange={(val: any) => setFormData({...formData, via_aplicacao: val})}
                  options={[
                    { value: `IM`, label: `Intramuscular (IM)` },
                    { value: `SC`, label: `Subcutânea (SC)` },
                    { value: `ORAL`, label: `Oral` },
                    { value: `TOPICO`, label: `Tópico` },
                    { value: `IV`, label: `Intravenosa (IV)` },
                  ]}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Hash size={14} /> Local de Aplicação</label>
                <input 
                  className="tauze-input"
                  type="text" 
                  placeholder="Ex: Tábua do Pescoço, Garupa..." 
                  value={formData.local_aplicacao}
                  onChange={(e) => setFormData({...formData, local_aplicacao: e.target.value})}
                />
              </div>
            </>
          )}

          {formData.tipo === 'cirurgia' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><UserCheck size={14} /> Veterinário Responsável</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Nome do Médico Veterinário" 
                value={formData.veterinario}
                onChange={(e) => setFormData({...formData, veterinario: e.target.value})}
              />
            </div>
          )}

          {formData.tipo === 'vacina' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><BellRing size={14} /> Reforço Agendado (Dias)</label>
              <input 
                className="tauze-input"
                type="number" 
                placeholder="Ex: 21 (Opcional)" 
                value={formData.reforco_dias}
                onChange={(e) => setFormData({...formData, reforco_dias: e.target.value})}
              />
            </div>
          )}

          {formData.tipo === 'medicamento' && (
            <div className="tauze-field-group">
              <label className="tauze-label"><AlertCircle size={14} /> Carência Abate/Leite (Dias)</label>
              <input 
                className="tauze-input"
                type="number" 
                placeholder="Ex: 30" 
                value={formData.carencia_dias}
                onChange={(e) => setFormData({...formData, carencia_dias: e.target.value})}
              />
            </div>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: `REALIZADO`, label: `Realizado` },
                { value: `PENDENTE`, label: `Pendente` },
              ]}
            />
          </div>

          <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
            <label className="tauze-label"><FileText size={14} /> Observações</label>
            <textarea 
              className="tauze-input tauze-textarea"
              placeholder="Notas adicionais..." 
              value={formData.observacao}
              onChange={(e) => setFormData({...formData, observacao: e.target.value})}
              rows={2}
            />
          </div>

          {/* PAINÃ‰IS ORÁCULOS DE SANIDADE (RISCO E PREDIÃ‡ÃƒO) */}
          {healthStats.bloqueioAbate && (
            <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '16px', background: 'hsl(0 84% 60% / 0.1)', border: '1.5px dashed hsl(0 84% 60% / 0.4)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(0 84% 45%)', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                <ShieldAlert size={18} /> ANIMAL/LOTE BLOQUEADO PARA ABATE E LEITE
              </div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: '1.5', marginTop: '8px' }}>
                Aviso Legal: Respeitando a carência farmacológica informada, a liberação sanitária oficial só ocorrerá no dia <strong style={{ color: 'hsl(0 84% 45%)', fontWeight: 900 }}>{healthStats.bloqueioAbate}</strong>.
              </div>
            </div>
          )}

          {healthStats.dataReforco && (
            <div style={{ gridColumn: 'span 2', marginTop: '12px', padding: '16px', background: 'hsl(217 91% 60% / 0.1)', border: '1.5px dashed hsl(217 91% 60% / 0.4)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'hsl(217 91% 50%)', fontWeight: 800, fontSize: '13px', marginBottom: '4px' }}>
                <Calendar size={18} /> REFORÃ‡O VACINAL AGENDADO
              </div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', lineHeight: '1.5', marginTop: '8px' }}>
                Uma revacinação será cobrada na agenda sanitária da fazenda para o dia <strong style={{ color: 'hsl(217 91% 50%)', fontWeight: 900 }}>{healthStats.dataReforco}</strong>.
              </div>
            </div>
          )}
        </div>
      </section>
    </SidePanel>
  );
};
