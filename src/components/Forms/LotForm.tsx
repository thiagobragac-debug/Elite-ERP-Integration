import React, { useState, useEffect } from 'react';
import { 
  Layers,
  Tag,
  Users,
  FileText,
  MapPin,
  TrendingUp,
  Activity,
  CheckCircle2,
  Palette
} from 'lucide-react';
import { FormModal } from './FormModal';
import { supabase } from '../../lib/supabase';

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
    pasto_id: '',
    cor: '#6366f1'
  });

  const [pastures, setPastures] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchPastures();
    }
  }, [isOpen]);

  const fetchPastures = async () => {
    try {
      const { data } = await supabase
        .from('pastos')
        .select('id, nome, fazendas(nome)');
      if (data) setPastures(data);
    } catch (err) {
      console.error('Error fetching pastures:', err);
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
        pasto_id: initialData.pasto_id || '',
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
        pasto_id: '',
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
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? "Editar Lote" : "Novo Lote de Animais"}
      subtitle="Organize seu rebanho em lotes para melhor gestão."
      icon={Layers}
      loading={loading}
      submitLabel={initialData ? "Salvar Alterações" : "Salvar Lote"}
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
        <select
          value={formData.finalidade}
          onChange={(e) => setFormData({...formData, finalidade: e.target.value})}
          required
        >
          <option value="">Selecione a finalidade...</option>
          <option value="Recria">Recria</option>
          <option value="Engorda">Engorda</option>
          <option value="Cria">Cria</option>
          <option value="Cria e Recria">Cria e Recria</option>
          <option value="Confinamento">Confinamento</option>
          <option value="Pastejo Rotacionado">Pastejo Rotacionado</option>
          <option value="Reprodução">Reprodução</option>
          <option value="Descarte">Descarte</option>
          <option value="Manejo Geral">Manejo Geral</option>
        </select>
      </div>

      {/* Data Início + Previsão Término + Pasto — mesma linha */}
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
            <MapPin size={14} /> Pasto / Piquete
          </label>
          <select 
            value={formData.pasto_id}
            onChange={(e) => setFormData({...formData, pasto_id: e.target.value})}
          >
            <option value="">Sem pasto (Livre)</option>
            {pastures.map(p => (
              <option key={p.id} value={p.id}>
                {p.nome} {p.fazendas?.nome ? `(${p.fazendas.nome})` : ''}
              </option>
            ))}
          </select>
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
        <select 
          value={formData.status}
          onChange={(e) => setFormData({...formData, status: e.target.value})}
        >
          <option value="ATIVO">Ativo</option>
          <option value="FINALIZADO">Finalizado / Encerrado</option>
        </select>
      </div>
    </FormModal>
  );
};
