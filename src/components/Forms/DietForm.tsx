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
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Identificação</h4>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          Defina o nome e tipo principal da dieta.
        </p>

        <div className="tauze-input-grid grid-col-1">
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label"><Utensils size={14} /> Nome da Dieta</label>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Ex: Ração Engorda 18%, Suplemento Seca..." 
                value={formData.nome}
                onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})}
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
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Composição & Custos</h4>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          Adicione os ingredientes para cálculo automático de custos.
        </p>

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
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Parâmetros & Notas</h4>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          Preencha a análise bromatológica para ativar as inteligências nutricionais.
        </p>

        <div className="tauze-input-grid grid-col-3">
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

          <div className="tauze-field-group">
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
      </section>
    </SidePanel>
  );
};