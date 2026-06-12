import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Wheat, 
  Tag,
  DollarSign,
  Layers,
  Utensils,
  Plus,
  Trash2,
  FileText,
  Activity,
  Flame,
  Zap,
  Droplets,
  BarChart,
  Scale,
  CheckCircle,
  ChevronRight,
  Calendar
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { ConsumptionCart } from './ConsumptionCart';
import type { ConsumptionItem } from './ConsumptionCart';

interface DietFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

const ETAPAS_CONFIG = [
  { id: 'identificacao', label: '1. Identificação', icon: Tag, color: '#3b82f6' },
  { id: 'composicao', label: '2. Composição & Custos', icon: Layers, color: '#f59e0b' },
  { id: 'parametros', label: '3. Parâmetros & Notas', icon: FileText, color: '#10b981' },
];

export const DietForm: React.FC<DietFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const [activeEtapa, setActiveEtapa] = useState('identificacao');
  const [formData, setFormData] = usePersistentState('DietForm_formData', {
    nome: '',
    tipo: 'Concentrado',
    descricao: '',
    custo_por_kg: '0',
    percentual_ms: '88',
    pb: '',
    ndt: '',
    consumo_esperado: '',
    status: 'active',
    data_registro: new Date().toISOString().split('T')[0]
  });

  const [ingredients, setIngredients] = useState<ConsumptionItem[]>([]);

  React.useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh
    setActiveEtapa('identificacao');

    if (initialData) { 
      setFormData({
        nome: initialData.nome || '',
        tipo: initialData.tipo || 'Concentrado',
        descricao: initialData.descricao || '',
        custo_por_kg: initialData.custo_por_kg ? initialData.custo_por_kg.toString().replace(/[^\d.-]/g, '') : '0',
        percentual_ms: initialData.percentual_ms ? initialData.percentual_ms.toString().replace(/[^\d.-]/g, '') : '88',
        pb: initialData.pb?.toString() || '',
        ndt: initialData.ndt?.toString() || '',
        consumo_esperado: initialData.consumo_esperado?.toString() || '',
        status: initialData.status || 'active',
        data_registro: initialData.data_registro || new Date().toISOString().split('T')[0]
      });
      // Backward compatibility: Convert string array to objects if necessary
      const rawIngredients = initialData.ingredientes || [];
      const parsedIngredients = rawIngredients.map((ing: any) => {
        if (typeof ing === 'string') {
          return { id: Math.random().toString(36).substring(7), produto_id: '', nome: ing, quantidade: 0, unidade: 'UN', custo_medio: 0, deposito_id: '' };
        }
        return ing;
      });
      setIngredients(parsedIngredients);
    } else {
      setFormData({
        nome: '',
        tipo: 'Concentrado',
        descricao: '',
        custo_por_kg: '0',
        percentual_ms: '88',
        pb: '',
        ndt: '',
        consumo_esperado: '',
        status: 'active',
        data_registro: new Date().toISOString().split('T')[0]
      });
      setIngredients([]);
    }
  }, [initialData, isOpen, actionId]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ingredients.length > 0) {
      const totalCost = ingredients.reduce((sum, item) => sum + ((item.custo_medio || 0) * (item.quantidade || 0)), 0);
      const totalQty = ingredients.reduce((sum, item) => sum + (Number(item.quantidade) || 0), 0);
      if (totalQty > 0) {
        setFormData(prev => ({ ...prev, custo_por_kg: (totalCost / totalQty).toFixed(2) }));
      }
    }
  }, [ingredients]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ ...formData, ingredientes: ingredients });
    } finally {
      setLoading(false);
    }
  };

  // --- NUTRITION ENGINE ---
  const dietStats = useMemo(() => {
    const custo = parseFloat(formData.custo_por_kg) || 0;
    const ms = parseFloat(formData.percentual_ms) || 0;
    const pb = parseFloat(formData.pb) || 0;
    const ndt = parseFloat(formData.ndt) || 0;

    // Custo real da Matéria Seca
    let custoMS = 0;
    if (ms > 0) {
      custoMS = custo / (ms / 100);
    }

    // Smart Badges
    const badges = [];
    if (pb > 25) badges.push({ icon: Flame, text: 'Alto Teor Proteico', color: '#eab308', bg: '#fef08a' });
    if (ndt > 75) badges.push({ icon: Zap, text: 'Super Energética', color: '#8b5cf6', bg: '#ede9fe' });
    if (ms < 35) badges.push({ icon: Droplets, text: 'Alta Umidade', color: '#3b82f6', bg: '#dbeafe' });

    return { custoMS, badges };
  }, [formData.custo_por_kg, formData.percentual_ms, formData.pb, formData.ndt]);

  // Determine stage completion for menu
  const isIdentificacaoDone = formData.nome.trim().length > 0;
  const isComposicaoDone = ingredients.length > 0 || parseFloat(formData.custo_por_kg) > 0;
  const isParametrosDone = !!formData.consumo_esperado;

  return (
    <SidePanel size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Dieta" : "Nova Dieta / Formulação"}
      subtitle={initialData ? "Atualize as informações da dieta." : "Defina os ingredientes e parâmetros nutricionais."}
      icon={Utensils}
      loading={loading}
      submitLabel={initialData ? "Atualizar Dieta" : "Salvar Dieta"}
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '250px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--brand))', textTransform: 'uppercase', marginBottom: '4px' }}>Custo Real (Matéria Seca)</span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              {dietStats.custoMS.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} <span style={{fontSize: '14px', fontWeight: 600, color: 'hsl(var(--text-muted))'}}>/ Kg</span>
            </span>
            <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Custo MN: R$ {parseFloat(formData.custo_por_kg || '0').toFixed(2)}/Kg</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <BarChart size={24} style={{ color: 'hsl(var(--brand))' }} />
          </div>
        </div>
        
        <div style={{ flex: 1, minWidth: '200px', padding: '16px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}>
          <span style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '12px' }}>Qualidade Nutricional</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {dietStats.badges.length > 0 ? (
              dietStats.badges.map((b, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', background: b.bg, color: b.color, borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                  <b.icon size={12} />
                  {b.text}
                </div>
              ))
            ) : (
              <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>Preencha os parâmetros bromatológicos para ver as métricas.</span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div style={{ width: '220px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'identificacao') isCompleted = isIdentificacaoDone;
            if (et.id === 'composicao') isCompleted = isComposicaoDone;
            if (et.id === 'parametros') isCompleted = isParametrosDone;

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
                  {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            )
          })}
        </div>

        {/* Right Content - Form Fields */}
        <div style={{ flex: 1, background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '16px', padding: '24px' }}>
          
          <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {ETAPAS_CONFIG.find(e => e.id === activeEtapa)?.label}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {activeEtapa === 'identificacao' && "Defina o nome e tipo principal da dieta."}
              {activeEtapa === 'composicao' && "Adicione os ingredientes para cálculo automático de custos."}
              {activeEtapa === 'parametros' && "Preencha a análise bromatológica para ativar as inteligências nutricionais."}
            </p>
          </div>

          {activeEtapa === 'identificacao' && (
            <div className="tauze-input-grid grid-col-1 animate-slide-up">
              <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
                <div className="tauze-field-group">
                  <label className="tauze-label"><Utensils size={14} /> Nome da Dieta</label>
                  <input 
                    className="tauze-input"
                    type="text" 
                    placeholder="Ex: Ração Engorda 18%, Suplemento Seca..." 
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                    required 
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label"><Calendar size={14} /> Data do Lançamento</label>
                  <input 
                    type="date" 
                    className="tauze-input"
                    value={formData.data_registro}
                    onChange={(e) => setFormData({...formData, data_registro: e.target.value})}
                    required 
                  />
                </div>
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label"><Wheat size={14} /> Tipo de Formulação</label>
                <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                  <div 
                    className={`tauze-form-radio-item ${formData.tipo === 'Concentrado' ? 'active-concentrado' : ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setFormData({...formData, tipo: 'Concentrado'})}
                  >
                    <Layers size={16} />
                    <span>Concentrado</span>
                  </div>
                  <div 
                    className={`tauze-form-radio-item ${formData.tipo === 'Sal Mineral' ? 'active-sal' : ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setFormData({...formData, tipo: 'Sal Mineral'})}
                  >
                    <Activity size={16} />
                    <span>Sal Mineral</span>
                  </div>
                  <div 
                    className={`tauze-form-radio-item ${formData.tipo === 'Total Mix' ? 'active-mix' : ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setFormData({...formData, tipo: 'Total Mix'})}
                  >
                    <Utensils size={16} />
                    <span>Total Mix</span>
                  </div>
                  <div 
                    className={`tauze-form-radio-item ${formData.tipo === 'Volumoso' ? 'active-volumoso' : ''}`}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setFormData({...formData, tipo: 'Volumoso'})}
                  >
                    <Wheat size={16} />
                    <span>Volumoso</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeEtapa === 'composicao' && (
            <div className="animate-slide-up">
              <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '24px' }}>
                {formData.tipo === 'Sal Mineral' ? (
                   <div className="tauze-field-group">
                     <label className="tauze-label"><DollarSign size={14} /> Custo por Kg (R$) - Automático</label>
                     <input 
                       className="tauze-input"
                       type="number" step="0.01" placeholder="0.00" 
                       value={formData.custo_por_kg}
                       onChange={(e) => setFormData({...formData, custo_por_kg: e.target.value})}
                       required
                       disabled={ingredients.length > 0}
                     />
                   </div>
                ) : (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label"><DollarSign size={14} /> Custo Matéria Natural (R$/Kg) - Auto</label>
                      <input 
                        className="tauze-input"
                        type="number" step="0.01" placeholder="0.00" 
                        value={formData.custo_por_kg}
                        onChange={(e) => setFormData({...formData, custo_por_kg: e.target.value})}
                        required
                        disabled={ingredients.length > 0}
                      />
                    </div>

                    <div className="tauze-field-group">
                      <label className="tauze-label"><Activity size={14} /> Matéria Seca (% MS)</label>
                      <input 
                        className="tauze-input"
                        type="number" step="1" placeholder="88" 
                        value={formData.percentual_ms}
                        onChange={(e) => setFormData({...formData, percentual_ms: e.target.value})}
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              <ConsumptionCart 
                items={ingredients} 
                onChange={setIngredients} 
                mode="formulation" 
                title="Composição da Dieta" 
                subtitle={`Adicione os ingredientes e suas proporções (${formData.tipo === 'Sal Mineral' ? 'kg' : '%'})`} 
              />
            </div>
          )}

          {activeEtapa === 'parametros' && (
            <div className="animate-slide-up">
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label"><Flame size={14} /> Proteína Bruta (PB %)</label>
                  <input 
                    className="tauze-input"
                    type="number" step="0.1" placeholder="Ex: 18" 
                    value={formData.pb}
                    onChange={(e) => setFormData({...formData, pb: e.target.value})}
                  />
                </div>

                {formData.tipo !== 'Sal Mineral' && (
                  <div className="tauze-field-group">
                    <label className="tauze-label"><Zap size={14} /> NDT (Energia %)</label>
                    <input 
                      className="tauze-input"
                      type="number" step="0.1" placeholder="Ex: 78" 
                      value={formData.ndt}
                      onChange={(e) => setFormData({...formData, ndt: e.target.value})}
                    />
                  </div>
                )}

                <div className="tauze-field-group" style={{ gridColumn: formData.tipo === 'Sal Mineral' ? 'span 1' : 'span 2' }}>
                  <label className="tauze-label"><Scale size={14} /> Consumo Esperado ({formData.tipo === 'Sal Mineral' ? 'g/dia' : '% do Peso Vivo'})</label>
                  <input 
                    className="tauze-input"
                    type="number" step="0.1" placeholder={formData.tipo === 'Sal Mineral' ? "Ex: 120" : "Ex: 2.2"} 
                    value={formData.consumo_esperado}
                    onChange={(e) => setFormData({...formData, consumo_esperado: e.target.value})}
                  />
                </div>
              </div>

              <div className="tauze-input-grid grid-col-1" style={{ marginTop: '24px' }}>
                <div className="tauze-field-group">
                  <label className="tauze-label"><FileText size={14} /> Descrição / Observações</label>
                  <textarea className="tauze-input tauze-textarea"
                    placeholder="Notas sobre a formulação..." 
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </SidePanel>
  );
};
