import React, { useState, useEffect, useMemo } from 'react';
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
  Scale
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';

interface DietFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

export const DietForm: React.FC<DietFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'Concentrado',
    descricao: '',
    custo_por_kg: '0',
    percentual_ms: '88',
    pb: '',
    ndt: '',
    consumo_esperado: '',
    status: 'active'
  });

  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');

  React.useEffect(() => {
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
        status: initialData.status || 'active'
      });
      setIngredients(initialData.ingredientes || []);
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
        status: 'active'
      });
    }
  }, [initialData, isOpen]);

  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

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

  return (
    <SidePanel size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Dieta" : "Nova Dieta / Formulação"}
      subtitle={initialData ? "Atualize as informações da dieta." : "Defina os ingredientes e custos da nutrição."}
      icon={Utensils}
      loading={loading}
      submitLabel={initialData ? "Atualizar Dieta" : "Salvar Dieta"}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados da Dieta</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-1">
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
            <label className="tauze-label"><Wheat size={14} /> Tipo de Formulação</label>
            <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <div 
                className={`tauze-form-radio-item ${formData.tipo === 'Concentrado' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo: 'Concentrado'})}
              >
                <Layers size={16} />
                <span>Concentrado</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.tipo === 'Sal Mineral' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo: 'Sal Mineral'})}
              >
                <Activity size={16} />
                <span>Sal Mineral</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.tipo === 'Total Mix' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, tipo: 'Total Mix'})}
              >
                <Utensils size={16} />
                <span>Total Mix</span>
              </div>
              <div 
                className={`tauze-form-radio-item ${formData.tipo === 'Volumoso' ? 'active' : ''}`}
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
        
        {/* DASHBOARD FINANCEIRO NUTRICIONAL */}
        <div style={{ marginBottom: '20px', padding: '16px', background: 'linear-gradient(135deg, hsl(var(--brand)/0.1) 0%, hsl(var(--brand)/0.02) 100%)', borderRadius: '14px', border: '1px solid hsl(var(--brand)/0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Custo Real (Por Kg de MS)</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'hsl(var(--text-main))' }}>
              R$ {dietStats.custoMS.toFixed(2)}
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>Este é o valor financeiro do que o boi realmente aproveita.</div>
          </div>
          <div style={{ background: 'white', padding: '12px', borderRadius: '50%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <BarChart size={24} style={{ color: 'hsl(var(--brand))' }} />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          {formData.tipo === 'Sal Mineral' ? (
             <div className="tauze-field-group">
               <label className="tauze-label"><DollarSign size={14} /> Custo por Kg (R$)</label>
               <input 
                 className="tauze-input"
                 type="number" step="0.01" placeholder="0.00" 
                 value={formData.custo_por_kg}
                 onChange={(e) => setFormData({...formData, custo_por_kg: e.target.value})}
                 required
               />
             </div>
          ) : (
            <>
              <div className="tauze-field-group">
                <label className="tauze-label"><DollarSign size={14} /> Custo Matéria Natural (R$/Kg)</label>
                <input 
                  className="tauze-input"
                  type="number" step="0.01" placeholder="0.00" 
                  value={formData.custo_por_kg}
                  onChange={(e) => setFormData({...formData, custo_por_kg: e.target.value})}
                  required
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

          {/* PARÂMETROS BROMATOLÓGICOS (OPCIONAIS MAS RECOMENDADOS) */}
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

        {/* RENDER DAS SMART BADGES */}
        {dietStats.badges.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '16px' }}>
            {dietStats.badges.map((b, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: b.bg, color: b.color, borderRadius: '8px', fontSize: '11px', fontWeight: 800 }}>
                <b.icon size={14} />
                {b.text}
              </div>
            ))}
          </div>
        )}

        <div className="tauze-input-grid grid-col-1" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Ingredientes</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input 
                className="tauze-input"
                type="text" 
                placeholder="Adicionar ingrediente..." 
                value={newIngredient}
                onChange={(e) => setNewIngredient(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <button type="button" className="secondary-btn" onClick={addIngredient} style={{ padding: '0 12px' }}>
                <Plus size={18} />
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {ingredients.map((ing, idx) => (
                <span key={idx} className="tag" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {ing}
                  <Trash2 size={12} style={{ cursor: 'pointer' }} onClick={() => removeIngredient(idx)} />
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Informações Adicionais</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-1">
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
