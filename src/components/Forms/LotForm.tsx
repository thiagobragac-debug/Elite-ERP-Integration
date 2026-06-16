import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';

import { 
  Layers,
  Tag,
  Users,
  FileText,
  Building2,
  TrendingUp,
  Activity,
  CheckCircle2,
  Palette,
  MapPin,
  Clock,
  Calendar,
  ShieldCheck,
  Scale,
  DollarSign,
  Fingerprint,
  Lightbulb
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { ColorPicker } from './ColorPicker';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { DateInput } from '../../components/Form/DateInput';


interface LotFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}



export const LotForm: React.FC<LotFormProps> = ({isOpen, onClose, onSubmit, initialData, actionId }) => {
  const [formData, setFormData] = usePersistentState('LotForm_formData', {
    nome: '',
    finalidade: '',
    descricao: '',
    status: 'ATIVO',
    capacidade: '',
    data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    data_fim_prevista: '',
    dias_ciclo: '',
    peso_entrada: '',
    gmd_alvo: '',
    peso_alvo: '',
    fazenda_id: '',
    pasto_id: '',
    sexo_permitido: 'MISTO',
    regime_alimentar: '',
    custo_diario: '',
    exige_rastreabilidade: false,
    cor: '#6366f1',
    programa_bonificacao: '',
    meta_rendimento_carcaca: '',
    peso_carcaca_alvo: ''
  });

  const { activeTenantId } = useTenant();
  const [fazendas, setFazendas] = useState<any[]>([]);
  const [pastos, setPastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingFazendas, setLoadingFazendas] = useState(false);
  const [loadingPastos, setLoadingPastos] = useState(false);

  useEffect(() => {
    if (!actionId) return; // Ignore on initial mount / refresh

    if (isOpen && activeTenantId) {
      fetchFazendas();
    }
  }, [isOpen, activeTenantId]);

  useEffect(() => {
    if (formData.fazenda_id) {
      fetchPastos(formData.fazenda_id);
    } else {
      setPastos([]);
    }
  }, [formData.fazenda_id]);

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
    if (initialData) { setFormData({
        nome: initialData.nome || '',
        finalidade: initialData.finalidade || '',
        descricao: initialData.descricao || '',
        status: initialData.status || 'ATIVO',
        capacidade: initialData.capacidade ? initialData.capacidade.toString().replace(/[^\d.-]/g, '') : '',
        data_inicio: initialData.data_inicio || new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        data_fim_prevista: initialData.data_fim_prevista || '',
        dias_ciclo: initialData.dias_ciclo ? initialData.dias_ciclo.toString().replace(/[^\d.-]/g, '') : '',
        peso_entrada: initialData.peso_entrada ? initialData.peso_entrada.toString().replace(/[^\d.-]/g, '') : '',
        gmd_alvo: initialData.gmd_alvo ? initialData.gmd_alvo.toString().replace(/[^\d.-]/g, '') : '',
        peso_alvo: initialData.peso_alvo ? initialData.peso_alvo.toString().replace(/[^\d.-]/g, '') : '',
        fazenda_id: initialData.fazenda_id || '',
        pasto_id: initialData.pasto_id || '',
        sexo_permitido: initialData.sexo_permitido || 'MISTO',
        regime_alimentar: initialData.regime_alimentar || '',
        custo_diario: initialData.custo_diario ? initialData.custo_diario.toString().replace(/[^\d.-]/g, '') : '',
        exige_rastreabilidade: initialData.exige_rastreabilidade || false,
        cor: initialData.cor || '#6366f1',
        programa_bonificacao: initialData.programa_bonificacao || '',
        meta_rendimento_carcaca: initialData.meta_rendimento_carcaca ? initialData.meta_rendimento_carcaca.toString().replace(/[^\d.-]/g, '') : '',
        peso_carcaca_alvo: initialData.peso_carcaca_alvo ? initialData.peso_carcaca_alvo.toString().replace(/[^\d.-]/g, '') : ''
      });
    } else {
      setFormData({
        nome: '',
        finalidade: '',
        descricao: '',
        status: 'ATIVO',
        capacidade: '',
        data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        data_fim_prevista: '',
        dias_ciclo: '',
        peso_entrada: '',
        gmd_alvo: '',
        peso_alvo: '',
        fazenda_id: '',
        pasto_id: '',
        sexo_permitido: 'MISTO',
        regime_alimentar: '',
        custo_diario: '',
        exige_rastreabilidade: false,
        cor: '#6366f1',
        programa_bonificacao: '',
        meta_rendimento_carcaca: '',
        peso_carcaca_alvo: ''
      });
    }
  }, [initialData, isOpen, actionId]);

  const fetchPastos = async (fazendaId: string) => {
    setLoadingPastos(true);
    try {
      const { data } = await supabase
        .from('pastos')
        .select('id, nome')
        .eq('fazenda_id', fazendaId)
        .order('nome');
      setPastos(data || []);
    } finally {
      setLoadingPastos(false);
    }
  };

  const handleDiasCicloChange = (dias: string) => {
    setFormData(prev => {
      if (!dias) return { ...prev, dias_ciclo: '', data_fim_prevista: '' };
      const d = parseInt(dias);
      if (isNaN(d)) return prev;
      const dataInicio = new Date(prev.data_inicio);
      dataInicio.setDate(dataInicio.getDate() + d);
      return { ...prev, dias_ciclo: dias, data_fim_prevista: dataInicio.toISOString().split('T')[0] };
    });
  };

  const handleDataFimChange = (dataStr: string) => {
    setFormData(prev => {
      if (!dataStr) return { ...prev, data_fim_prevista: '', dias_ciclo: '' };
      const dataFim = new Date(dataStr);
      const dataInicio = new Date(prev.data_inicio);
      const diffTime = dataFim.getTime() - dataInicio.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return { ...prev, data_fim_prevista: dataStr, dias_ciclo: diffDays > 0 ? diffDays.toString() : '' };
    });
  };

  useEffect(() => {
    const d = parseInt(formData.dias_ciclo);
    const gmd = parseFloat(formData.gmd_alvo);
    const pesoEntrada = parseFloat(formData.peso_entrada);
    if (!isNaN(d) && !isNaN(gmd) && !isNaN(pesoEntrada)) {
      const ganhoTotal = d * gmd;
      const pesoAlvoProjetado = (pesoEntrada + ganhoTotal).toFixed(0);
      if (pesoAlvoProjetado !== formData.peso_alvo) {
        setFormData(prev => ({ ...prev, peso_alvo: pesoAlvoProjetado }));
      }
    }
  }, [formData.dias_ciclo, formData.gmd_alvo, formData.peso_entrada]);

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
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Informações Básicas</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label"><Layers size={14} /> Nome do Lote</label>
            <input 
              className="tauze-input"
              type="text" 
              placeholder="Ex: LOTE-ENGORDA-01" 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value.toUpperCase()})}
              required 
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label"><Tag size={14} /> Finalidade do Lote</label>
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


        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Planejamento & Destino</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Building2 size={14} /> Fazenda de Destino
            </label>
            <SearchableSelect 
              value={formData.fazenda_id}
              onChange={(val: any) => setFormData({...formData, fazenda_id: val, pasto_id: ''})}
              disabled={loadingFazendas}
              options={[
                { value: '', label: loadingFazendas ? 'Carregando fazendas...' : 'Selecionar Fazenda...' },
                ...fazendas.map(f => ({ value: String(f.id), label: f.nome }))
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><MapPin size={14} /> Pasto Inicial (Opcional)</label>
            <SearchableSelect 
              value={formData.pasto_id}
              onChange={(val: any) => setFormData({...formData, pasto_id: val})}
              disabled={!formData.fazenda_id || loadingPastos}
              options={[
                { value: '', label: !formData.fazenda_id ? 'Selecione a fazenda' : loadingPastos ? 'Carregando pastos...' : 'Lote de Confinamento / Sem Pasto' },
                ...pastos.map(p => ({ value: String(p.id), label: p.nome }))
              ]}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data de Início
            </label>
            <DateInput 
              className="tauze-input"
              type="date" 
              value={formData.data_inicio}
              onChange={(e) => setFormData({...formData, data_inicio: e.target.value})}
              required 
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Clock size={14} /> Ciclo Estimado
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '8px' }}>
              <input 
                className="tauze-input"
                type="number" 
                placeholder="Dias" 
                title="Duração em Dias"
                value={formData.dias_ciclo}
                onChange={(e) => handleDiasCicloChange(e.target.value)}
              />
              <DateInput 
                className="tauze-input"
                type="date" 
                title="Data de Término"
                value={formData.data_fim_prevista}
                onChange={(e) => handleDataFimChange(e.target.value)}
              />
            </div>
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><CheckCircle2 size={14} /> Prog. de Qualidade</label>
            <SearchableSelect 
              value={formData.programa_bonificacao}
              onChange={(val: any) => setFormData({...formData, programa_bonificacao: val})}
              options={[
                { value: '', label: 'Nenhum / Padrão' },
                { value: 'COTA_HILTON', label: 'Cota Hilton' },
                { value: 'ANGUS_CERTIFICADO', label: 'Carne Angus Certificada' },
                { value: 'PRECOCE_MS', label: 'Precoce MS' },
                { value: 'BOI_EUROPA', label: 'Boi Europa (Trace)' }
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label"><TrendingUp size={14} /> Meta de Rendimento (%)</label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.1"
              placeholder="Ex: 54.5" 
              value={formData.meta_rendimento_carcaca}
              onChange={(e) => setFormData({...formData, meta_rendimento_carcaca: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 03</div>
          <h4 className="tauze-section-title">Regras e Restrições</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <ShieldCheck size={14} /> Sexo Permitido
            </label>
            <SearchableSelect 
              value={formData.sexo_permitido}
              onChange={(val: any) => setFormData({...formData, sexo_permitido: val})}
              options={[
                { value: 'MISTO', label: 'Misto (Qualquer Sexo)' },
                { value: 'MACHO', label: 'Apenas Machos' },
                { value: 'FEMEA', label: 'Apenas Fêmeas' }
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Activity size={14} /> Regime Alimentar
            </label>
            <SearchableSelect 
              value={formData.regime_alimentar}
              onChange={(val: any) => setFormData({...formData, regime_alimentar: val})}
              options={[
                { value: '', label: 'Não especificado' },
                { value: 'PASTO', label: 'A Pasto' },
                { value: 'SEMI-CONFINAMENTO', label: 'Semi-confinamento / Suplementado' },
                { value: 'CONFINAMENTO', label: 'Confinamento (Intensivo)' },
                { value: 'CREEP-FEEDING', label: 'Creep-feeding (Bezerros)' }
              ]}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span><Fingerprint size={14} /> Rastreabilidade</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 12px', background: formData.exige_rastreabilidade ? 'hsl(var(--brand)/0.08)' : 'hsl(var(--bg-main))', border: `1px solid ${formData.exige_rastreabilidade ? 'hsl(var(--brand)/0.3)' : 'hsl(var(--border))'}`, borderRadius: '10px', cursor: 'pointer', transition: 'all 0.2s', marginTop: '2px' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: formData.exige_rastreabilidade ? 'hsl(var(--brand))' : 'hsl(var(--text-main))' }}>Exigir SISBOV / Eletrônico</span>
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>Bloqueia animais sem brinco eletrônico</span>
              </div>
              <div style={{ width: '36px', height: '20px', borderRadius: '20px', background: formData.exige_rastreabilidade ? 'hsl(var(--brand))' : 'hsl(var(--border))', position: 'relative', transition: 'all 0.2s' }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', top: '2px', left: formData.exige_rastreabilidade ? '18px' : '2px', transition: 'all 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
              </div>
              <input type="checkbox" style={{ display: 'none' }} checked={formData.exige_rastreabilidade} onChange={e => setFormData({ ...formData, exige_rastreabilidade: e.target.checked })} />
            </label>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 04</div>
          <h4 className="tauze-section-title">Metas Zootécnicas & Capacidade</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Scale size={14} /> Peso de Entrada (kg)
            </label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 300" 
              value={formData.peso_entrada}
              onChange={(e) => setFormData({...formData, peso_entrada: e.target.value})}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <TrendingUp size={14} /> GMD Alvo (kg/dia)
            </label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.001"
              placeholder="Ex: 1.200" 
              value={formData.gmd_alvo}
              onChange={(e) => setFormData({...formData, gmd_alvo: e.target.value})}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><TrendingUp size={14} /> Peso Saída Alvo (kg)</span>
              {formData.dias_ciclo && formData.gmd_alvo && formData.peso_entrada && (
                <span className="carencia-badge" style={{ padding: '2px 8px', fontSize: '10px', background: 'hsl(var(--brand)/0.1)', color: 'hsl(var(--brand))', borderRadius: '4px' }}>
                  Auto-Calculado
                </span>
              )}
            </label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Ex: 420" 
              value={formData.peso_alvo}
              onChange={(e) => setFormData({...formData, peso_alvo: e.target.value})}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label">
              <DollarSign size={14} /> Custo Diário Est. (R$/cab)
            </label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.01"
              placeholder="Ex: 15.50" 
              value={formData.custo_diario}
              onChange={(e) => setFormData({...formData, custo_diario: e.target.value})}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Users size={14} /> Capacidade (Cab.)
            </label>
            <input 
              className="tauze-input"
              type="number" 
              placeholder="Qtd. máxima" 
              value={formData.capacidade}
              onChange={(e) => setFormData({...formData, capacidade: e.target.value})}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Scale size={14} /> Peso de Carcaça Alvo (@)
            </label>
            <input 
              className="tauze-input"
              type="number" 
              step="0.1"
              placeholder="Ex: 21" 
              value={formData.peso_carcaca_alvo}
              onChange={(e) => setFormData({...formData, peso_carcaca_alvo: e.target.value})}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 05</div>
          <h4 className="tauze-section-title">Status e Configuração</h4>
        </div>
        
        <div className="tauze-input-grid grid-col-2">
          <ColorPicker
            value={formData.cor}
            onChange={(val) => setFormData({ ...formData, cor: val })}
          />
          <div className="tauze-field-group">
            <label className="tauze-label"><Activity size={14} /> Status Inicial</label>
            <SearchableSelect 
              value={formData.status}
              onChange={(val: any) => setFormData({...formData, status: val})}
              options={[
                { value: 'ATIVO', label: 'Ativo' },
                { value: 'FINALIZADO', label: 'Finalizado / Encerrado' }
              ]}
            />
          </div>
        </div>
      </section>

      {/* Smart Card Resumo da Estratégia */}
      {(formData.peso_entrada || formData.dias_ciclo || formData.custo_diario) && (
        <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, hsl(var(--brand)/0.08) 0%, hsl(var(--brand)/0.02) 100%)', border: '1px solid hsl(var(--brand)/0.15)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
          <div style={{ background: 'white', padding: '8px', borderRadius: '10px', color: 'hsl(var(--brand))', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
            <Lightbulb size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 800, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Estratégia do Lote
            </h4>
            <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.5, color: 'hsl(var(--text-main))' }}>
              O animal entrará com <strong style={{ color: 'hsl(var(--text-main))' }}>{formData.peso_entrada ? `${formData.peso_entrada}kg` : '___kg'}</strong>, 
              ficará <strong style={{ color: 'hsl(var(--text-main))' }}>{formData.dias_ciclo ? `${formData.dias_ciclo} dias` : '___ dias'}</strong> no ciclo 
              {formData.gmd_alvo ? ` ganhando ${formData.gmd_alvo}kg/dia` : ''}, e sairá com <strong style={{ color: 'hsl(var(--brand))' }}>{formData.peso_alvo ? `${formData.peso_alvo}kg` : '___kg'}</strong>. 
              {formData.dias_ciclo && formData.custo_diario ? (
                <> Ao custo projetado de <strong style={{ color: '#10b981' }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(formData.dias_ciclo) * parseFloat(formData.custo_diario))} por animal</strong>.</>
              ) : ''}
            </p>
          </div>
        </div>
      )}
    </SidePanel>
  );
};
