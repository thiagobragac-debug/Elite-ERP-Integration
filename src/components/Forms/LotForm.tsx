import React, { useState, useEffect } from 'react';
import { 
  Layers,
  Tag,
  Users,
  FileText,
  Building2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';

interface LotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
}

const LOT_COLORS = [
  { value: '#6366f1', label: 'Indigo' },
  { value: '#10b981', label: 'Verde' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#64748b', label: 'Cinza' }
];

export const LotForm: React.FC<LotFormProps> = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    nome: '',
    finalidade: '',
    descricao: '',
    status: 'ATIVO',
    capacidade: '',
    data_inicio: new Date().toISOString().split('T')[0],
    data_fim_prevista: '',
    gmd_alvo: '',
    peso_alvo: '',
    fazenda_id: '',
    cor: '#6366f1'
  });

  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchFazendas();
    }
  }, [isOpen, activeTenantId]);

  const fetchFazendas = async () => {
    if (!activeTenantId) return;
    setLoadingFazendas(true);
    try {
      const { data, error } = await supabase
        .from('fazendas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .order('nome');
      if (error) throw error;
      setFazendas(data || []);
    } catch (err) {
      console.error('Error fetching fazendas:', err);
    } finally {
      setLoadingFazendas(false);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        finalidade: initialData.finalidade || '',
        descricao: initialData.descricao || '',
        status: initialData.status || 'ATIVO',
        capacidade: initialData.capacidade?.toString() || '',
        data_inicio: initialData.data_inicio || new Date().toISOString().split('T')[0],
        data_fim_prevista: initialData.data_fim_prevista || '',
        gmd_alvo: initialData.gmd_alvo?.toString() || '',
        peso_alvo: initialData.peso_alvo?.toString() || '',
        fazenda_id: initialData.fazenda_id || '',
        cor: initialData.cor || '#6366f1'
      });
    } else {
      setFormData({
        nome: '',
        finalidade: '',
        descricao: '',
        status: 'ATIVO',
        capacidade: '',
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim_prevista: '',
        gmd_alvo: '',
        peso_alvo: '',
        fazenda_id: '',
        cor: '#6366f1'
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Lote" : "Novo Lote"}
      subtitle="Organize seus animais em lotes para melhor gestão."
      icon={Layers}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Criar Lote"}
      size="large"
    >
      <div className="form-group">
        <label><Layers size={14} /> Nome do Lote</label>
        <input 
          type="text" 
          placeholder="Ex: LOTE-ENGORDA-01" 
          value={formData.nome}
          onChange={(e) => setFormData({...formData, nome: e.target.value})}
          required 
        />
      </div>

      <div className="form-group">
        <label><Tag size={14} /> Finalidade do Lote</label>
        <SearchableSelect
          value={formData.finalidade}
          onChange={(val: any) => setFormData({...formData, finalidade: val})}
          options={[
            { value: '', label: 'Selecione a finalidade...' },
            { value: 'Recria', label: 'Recria' },
            { value: 'Engorda', label: 'Engorda' },
            { value: 'Cria', label: 'Cria' },
            { value: 'Cria e Recria', label: 'Cria e Recria' },
            { value: 'Confinamento', label: 'Confinamento' },
            { value: 'Pastejo Rotacionado', label: 'Pastejo Rotacionado' },
            { value: 'Reprodução', label: 'Reprodução' },
            { value: 'Descarte', label: 'Descarte' },
            { value: 'Manejo Geral', label: 'Manejo Geral' }
          ]}
        />
      </div>

      {/* Data Início + Previsão Término + Fazenda — mesma linha */}
      <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <Activity size={14} /> Data de Início
          </label>
          <input 
            type="date" 
            value={formData.data_inicio}
            onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
            required 
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <Activity size={14} /> Previsão de Término
          </label>
          <input 
            type="date" 
            value={formData.data_fim_prevista}
            onChange={(e) => setFormData({...formData, data_fim_prevista: e.target.value})}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <Building2 size={14} /> Fazenda de Destino
          </label>
          <SearchableSelect 
            value={formData.fazenda_id}
            onChange={(val: any) => setFormData({...formData, fazenda_id: val})}
            disabled={loadingFazendas}
            options={[
              { value: '', label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...' },
              ...fazendas.map(f => ({ value: String(f.id), label: f.nome }))
            ]}
          />
        </div>
      </div>

      {/* GMD + Peso Alvo + Capacidade — mesma linha */}
      <div className="form-group full-width" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <TrendingUp size={14} /> GMD Alvo (kg/dia)
          </label>
          <input 
            type="number" 
            step="0.001"
            placeholder="Ex: 1.200" 
            value={formData.gmd_alvo}
            onChange={(e) => setFormData({...formData, gmd_alvo: e.target.value})}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <TrendingUp size={14} /> Peso Saída Alvo (kg)
          </label>
          <input 
            type="number" 
            placeholder="Ex: 550" 
            value={formData.peso_alvo}
            onChange={(e) => setFormData({...formData, peso_alvo: e.target.value})}
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--brand))' }}>
            <Users size={14} /> Capacidade (Cab.)
          </label>
          <input 
            type="number" 
            placeholder="Qtd. máxima" 
            value={formData.capacidade}
            onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
          />
        </div>
      </div>

      <div className="form-group">
        <label><Palette size={14} /> Cor de Identificação</label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px', minHeight: '38px' }}>
          {LOT_COLORS.map(color => (
            <button
              key={color.value}
              type="button"
              onClick={() => setFormData({ ...formData, cor: color.value })}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: color.value,
                border: formData.cor === color.value ? '2px solid white' : '2px solid transparent',
                boxShadow: formData.cor === color.value 
                  ? `0 0 0 2px ${color.value}, 0 4px 10px rgba(0,0,0,0.15)` 
                  : '0 2px 4px rgba(0,0,0,0.05)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: formData.cor === color.value ? 'scale(1.15)' : 'scale(1)',
                padding: 0
              }}
              title={color.label}
            />
          ))}
        </div>
      </div>

      <div className="form-group">
        <label><Activity size={14} /> Status Inicial</label>
        <SearchableSelect 
          value={formData.status}
          onChange={(val: any) => setFormData({...formData, status: val})}
          options={[
            { value: 'ATIVO', label: 'Ativo' },
            { value: 'FINALIZADO', label: 'Finalizado / Encerrado' }
          ]}
        />
      </div>
    </SidePanel>
  );
};
