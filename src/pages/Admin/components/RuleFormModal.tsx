import React, { useState, useEffect } from 'react';
import { Shield, Layers, Plus, Minus, Trash2, ArrowRight, User, Briefcase } from 'lucide-react';
import { FormModal } from '../../../components/Forms/FormModal';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';

interface RuleCondition {
  id: string;
  min: string;
  max: string;
}

interface RuleApprover {
  level: number;
  profile: string;
}

interface RuleFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}


export const RuleFormModal: React.FC<RuleFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData
}) => {
  const { activeTenantId } = useTenant();
  const [formData, setFormData] = useState({
    module: '',
    stages: 1,
    active: true
  });
  
  const [conditions, setConditions] = useState<RuleCondition[]>([
    { id: '1', min: '', max: '' }
  ]);
  
  const [approvers, setApprovers] = useState<RuleApprover[]>([
    { level: 1, profile: '' }
  ]);
  
  const [cargos, setCargos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        module: initialData.module || '',
        stages: initialData.stages || 1,
        active: initialData.active ?? true
      });
      // Parse conditions and approvers if they existed, for now mock:
      setConditions([{ id: '1', min: '0', max: '10000' }]);
      const initApprovers = Array.from({ length: initialData.stages || 1 }).map((_, i) => ({
        level: i + 1,
        profile: ''
      }));
      setApprovers(initApprovers);
    } else {
      setFormData({
        module: '',
        stages: 1,
        active: true
      });
      setConditions([{ id: '1', min: '', max: '' }]);
      setApprovers([{ level: 1, profile: '' }]);
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchApproverOptions();
    }
  }, [isOpen, activeTenantId]);

  const fetchApproverOptions = async () => {
    try {
      const [cargosRes, usersRes] = await Promise.all([
        supabase.from('cargos').select('id, nome').eq('tenant_id', activeTenantId).eq('is_active', true).order('nome'),
        supabase.from('profiles_view').select('id, name, email').eq('tenant_id', activeTenantId).order('name')
      ]);

      if (cargosRes.data) setCargos(cargosRes.data);
      if (usersRes.data) setUsuarios(usersRes.data);
    } catch (err) {
      console.error('Error fetching approver options', err);
    }
  };

  const handleStageChange = (newStages: number) => {
    setFormData(p => ({ ...p, stages: newStages }));
    
    // Adjust approvers array
    setApprovers(prev => {
      const newApprovers = [...prev];
      if (newStages > prev.length) {
        for (let i = prev.length; i < newStages; i++) {
          newApprovers.push({ level: i + 1, profile: '' });
        }
      } else if (newStages < prev.length) {
        newApprovers.splice(newStages);
      }
      return newApprovers;
    });
  };

  const addCondition = () => {
    setConditions(prev => [...prev, { id: Math.random().toString(), min: '', max: '' }]);
  };

  const removeCondition = (id: string) => {
    if (conditions.length > 1) {
      setConditions(prev => prev.filter(c => c.id !== id));
    }
  };

  const updateCondition = (id: string, field: 'min' | 'max', value: string) => {
    setConditions(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const updateApprover = (level: number, profile: string) => {
    setApprovers(prev => prev.map(a => a.level === level ? { ...a, profile } : a));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Build a readable condition string for the UI demo based on the first condition
    let conditionStr = 'Sem condição';
    if (conditions[0]) {
      if (conditions[0].min && conditions[0].max) {
        conditionStr = `R$ ${conditions[0].min} até R$ ${conditions[0].max}`;
      } else if (conditions[0].min) {
        conditionStr = `Valor > R$ ${conditions[0].min}`;
      } else if (conditions[0].max) {
        conditionStr = `Valor < R$ ${conditions[0].max}`;
      } else {
        conditionStr = 'Qualquer Valor';
      }
    }
    
    if (conditions.length > 1) {
      conditionStr += ` (+${conditions.length - 1})`;
    }

    onSubmit({
      ...formData,
      condition: conditionStr,
      conditions,
      approvers
    });
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Regra' : 'Nova Regra de Aprovação'}
      subtitle="Configure os gatilhos e níveis de hierarquia"
      icon={Shield}
      submitLabel={initialData ? 'Salvar Alterações' : 'Criar Regra'}
      size="large"
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', gridColumn: 'span 4' }}>
        
        {/* Lado Esquerdo: Módulo e Condições */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="section-title">1. Gatilho da Regra</div>
          
          <div className="form-group">
            <label>Módulo / Documento *</label>
            <select 
              className="tauze-input"
              value={formData.module}
              onChange={(e) => setFormData({...formData, module: e.target.value})}
              required
              style={{ width: '100%' }}
            >
              <option value="">Selecione o módulo...</option>
              <option value="Contas a Pagar">Contas a Pagar</option>
              <option value="Pedidos de Compra">Pedidos de Compra</option>
              <option value="Contratos de Venda">Contratos de Venda</option>
              <option value="Adiantamentos">Adiantamentos</option>
            </select>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0 }}>Condições de Valores (R$)</label>
              <button type="button" onClick={addCondition} className="add-cond-btn">
                <Plus size={12} /> Adicionar
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {conditions.map((cond, idx) => (
                <div key={cond.id} className="condition-row">
                  <div className="cond-inputs">
                    <div className="input-with-prefix">
                      <span className="prefix">De</span>
                      <input 
                        type="number" 
                        className="tauze-input small" 
                        placeholder="0,00"
                        value={cond.min}
                        onChange={e => updateCondition(cond.id, 'min', e.target.value)}
                      />
                    </div>
                    <ArrowRight size={14} style={{ color: '#94a3b8' }} />
                    <div className="input-with-prefix">
                      <span className="prefix">Até</span>
                      <input 
                        type="number" 
                        className="tauze-input small" 
                        placeholder="Ilimitado"
                        value={cond.max}
                        onChange={e => updateCondition(cond.id, 'max', e.target.value)}
                      />
                    </div>
                  </div>
                  {conditions.length > 1 && (
                    <button type="button" className="remove-cond-btn" onClick={() => removeCondition(cond.id)}>
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <span className="input-hint" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '8px', display: 'block' }}>
              Deixe "Até" vazio para valor ilimitado.
            </span>
          </div>

          <div className="form-group" style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid hsl(var(--border))' }}>
            <label className="toggle-label" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
              <div className={`tauze-switch ${formData.active ? 'active' : ''}`} onClick={() => setFormData({...formData, active: !formData.active})}>
                <div className="switch-handle" />
              </div>
              <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '13px' }}>Regra Ativa no Sistema</span>
            </label>
          </div>
        </div>

        {/* Lado Direito: Hierarquia e Responsáveis */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingLeft: '24px', borderLeft: '1px solid hsl(var(--border))' }}>
          <div className="section-title">2. Hierarquia de Aprovação</div>
          
          <div className="form-group">
            <label>Níveis em Cadeia</label>
            <div className="hierarchy-selector">
              <div className="level-control">
                <button 
                  type="button" 
                  className="lvl-btn"
                  onClick={() => handleStageChange(Math.max(1, formData.stages - 1))}
                >
                  <Minus size={16} />
                </button>
                <div className="lvl-display">
                  <Layers size={16} className="lvl-icon" />
                  <span>{formData.stages} {formData.stages === 1 ? 'Nível' : 'Níveis'}</span>
                </div>
                <button 
                  type="button" 
                  className="lvl-btn"
                  onClick={() => handleStageChange(Math.min(3, formData.stages + 1))}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="approvers-list">
            <label style={{ marginBottom: '12px', display: 'block' }}>Responsáveis por Etapa</label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {approvers.map((app) => (
                <div key={app.level} className="approver-card">
                  <div className="app-level-badge">Etapa {app.level}</div>
                  <div style={{ flex: 1 }}>
                    <select 
                      className="tauze-input small"
                      value={app.profile}
                      onChange={e => updateApprover(app.level, e.target.value)}
                      required
                      style={{ width: '100%', background: 'white' }}
                    >
                      <option value="">Selecionar Perfil/Cargo ou Usuário...</option>
                      <optgroup label="🏢 Cargos Corporativos">
                        {cargos.map(c => (
                          <option key={`cargo_${c.id}`} value={`cargo_${c.id}`}>{c.nome}</option>
                        ))}
                      </optgroup>
                      <optgroup label="👤 Usuários Específicos">
                        {usuarios.map(u => (
                          <option key={`user_${u.id}`} value={`user_${u.id}`}>{u.name} ({u.email})</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>
              ))}
            </div>
            <span className="input-hint" style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '12px', display: 'block' }}>
              A solicitação só passará para a próxima etapa se aprovada na etapa anterior.
            </span>
          </div>
        </div>

      </div>

      <style>{`
        .section-title {
          font-size: 13px;
          font-weight: 800;
          color: hsl(var(--brand));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 4px;
        }

        .add-cond-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 700;
          color: #3b82f6;
          background: #eff6ff;
          border: 1px solid #dbeafe;
          padding: 4px 10px;
          border-radius: 6px;
          cursor: pointer;
        }
        .add-cond-btn:hover {
          background: #dbeafe;
        }

        .condition-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cond-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          background: hsl(var(--bg-main)/0.5);
          padding: 8px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
        }

        .input-with-prefix {
          display: flex;
          align-items: center;
          background: white;
          border: 1px solid hsl(var(--border));
          border-radius: 8px;
          padding-left: 10px;
          flex: 1;
        }
        
        .input-with-prefix .prefix {
          font-size: 11px;
          font-weight: 700;
          color: #94a3b8;
          margin-right: 4px;
        }

        .input-with-prefix input {
          border: none !important;
          background: transparent;
          padding-left: 4px !important;
          box-shadow: none !important;
          width: 100%;
        }

        .remove-cond-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: 1px solid #fee2e2;
          background: #fef2f2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .remove-cond-btn:hover {
          background: #fee2e2;
        }

        .hierarchy-selector {
          background: hsl(var(--bg-card));
          border: 1px solid hsl(var(--border));
          border-radius: 12px;
          padding: 12px;
        }

        .level-control {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .lvl-btn {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main));
          color: hsl(var(--text-secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
        }

        .lvl-btn:hover {
          background: hsl(var(--brand));
          color: white;
          border-color: hsl(var(--brand));
        }

        .lvl-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          font-weight: 800;
          color: hsl(var(--brand));
          font-size: 14px;
        }

        .lvl-icon {
          color: hsl(var(--brand) / 0.5);
        }

        .approver-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: hsl(var(--bg-main)/0.4);
          padding: 12px;
          border-radius: 12px;
          border: 1px solid hsl(var(--border));
        }

        .app-level-badge {
          font-size: 10px;
          font-weight: 800;
          color: white;
          background: hsl(var(--brand));
          padding: 4px 8px;
          border-radius: 6px;
          text-transform: uppercase;
        }

        .tauze-switch {
          width: 44px;
          height: 24px;
          background: hsl(var(--border));
          border-radius: 12px;
          position: relative;
          transition: 0.3s;
        }

        .tauze-switch.active {
          background: #10b981;
        }

        .switch-handle {
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          position: absolute;
          top: 2px;
          left: 2px;
          transition: 0.3s;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .tauze-switch.active .switch-handle {
          transform: translateX(20px);
        }
      `}</style>
    </FormModal>
  );
};
