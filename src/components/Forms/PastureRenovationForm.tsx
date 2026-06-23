import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import {
  Sprout,
  Settings,
  Calendar,
  Users,
  DollarSign,
  Truck,
  Plus,
  Activity,
  FileText,
  Map,
  CheckCircle,
  AlertTriangle,
  Camera,
  Layers,
  ChevronRight,
  TrendingUp,
  FlaskConical,
  Tractor,
  Bug,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';

interface PastureRenovationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  pastoId?: string;
  initialData?: any; // Existing reforma data
  actionId?: number;
}

const ETAPAS_CONFIG = [
  { id: 'planejamento', label: '1. Análise de Solo', icon: FlaskConical, color: '#3b82f6' },
  { id: 'correcao', label: '2. Correção (Calagem)', icon: Layers, color: '#8b5cf6' },
  { id: 'preparo', label: '3. Preparo e Plantio', icon: Tractor, color: '#f59e0b' },
  { id: 'controle', label: '4. Controle (Pragas/Ervas)', icon: Bug, color: '#ef4444' },
  { id: 'estabelecimento', label: '5. Estabelecimento', icon: ShieldCheck, color: '#10b981' },
];

export const PastureRenovationForm: React.FC<PastureRenovationFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  pastoId,
  initialData,
  actionId,
}) => {
  const { activeFarm } = useTenant();

  // Master Reforma State
  const [reforma, setReforma] = usePersistentState('PastureRenovationForm_reforma', {
    objetivo: 'Reforma Total',
    data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0],
    status: 'em_andamento',
    analise_v_percent: '',
    analise_p_mgdm3: '',
    analise_ca_cmolc: '',
    observacoes: '',
    foto_antes_url: '',
    foto_depois_url: '',
  });

  // New Etapa State
  const [activeEtapa, setActiveEtapa] = useState('planejamento');
  const [etapaData, setEtapaData] = useState({
    data_registro: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .split('T')[0],
    maquina_id: '',
    horas_trabalhadas: '',
    custo_hora: '',
    observacoes: '',
  });
  const [items, setItems] = useState<any[]>([]);

  // Existing Etapas (from DB if editing)
  const [etapasSalvas, setEtapasSalvas] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchMachines();
    }
  }, [isOpen, activeFarm]);

  useEffect(() => {
    if (initialData) {
      setReforma({
        objetivo: initialData.objetivo || 'Reforma Total',
        data_inicio:
          initialData.data_inicio ||
          new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        status: initialData.status || 'em_andamento',
        analise_v_percent: initialData.analise_v_percent?.toString() || '',
        analise_p_mgdm3: initialData.analise_p_mgdm3?.toString() || '',
        analise_ca_cmolc: initialData.analise_ca_cmolc?.toString() || '',
        observacoes: initialData.observacoes || '',
        foto_antes_url: initialData.foto_antes_url || '',
        foto_depois_url: initialData.foto_depois_url || '',
      });
      if (initialData.etapas) {
        setEtapasSalvas(initialData.etapas);
      }
    } else {
      setReforma({
        objetivo: 'Reforma Total',
        data_inicio: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0],
        status: 'em_andamento',
        analise_v_percent: '',
        analise_p_mgdm3: '',
        analise_ca_cmolc: '',
        observacoes: '',
        foto_antes_url: '',
        foto_depois_url: '',
      });
      setEtapasSalvas([]);
      setItems([]);
      setActiveEtapa('planejamento');
    }
  }, [initialData, isOpen, actionId]);

  const fetchMachines = async () => {
    const { data } = await supabase
      .from('maquinas')
      .select('id, nome, custo_hora')
      .eq('fazenda_id', activeFarm?.id);
    if (data) {
      setMachines(data);
    }
  };

  const handleMachineChange = (machineId: string) => {
    const machine = machines.find((m) => String(m.id) === String(machineId));
    setEtapaData({
      ...etapaData,
      maquina_id: machineId,
      custo_hora: machine?.custo_hora?.toString() || '0',
    });
  };

  const custoInsumosCurrentEtapa = useMemo(() => {
    return items.reduce((acc, mat) => {
      const qty = parseFloat(mat.quantidade) || 0;
      const price = parseFloat(mat.valor_unitario) || 0;
      return acc + qty * price;
    }, 0);
  }, [items]);

  const custoMaquinaCurrentEtapa = useMemo(() => {
    const hs = parseFloat(etapaData.horas_trabalhadas) || 0;
    const custo = parseFloat(etapaData.custo_hora) || 0;
    return hs * custo;
  }, [etapaData.horas_trabalhadas, etapaData.custo_hora]);

  const custoTotalReforma = useMemo(() => {
    const total = etapasSalvas.reduce((acc, et) => acc + (parseFloat(et.custo_etapa) || 0), 0);
    return total + custoInsumosCurrentEtapa + custoMaquinaCurrentEtapa;
  }, [etapasSalvas, custoInsumosCurrentEtapa, custoMaquinaCurrentEtapa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Build the payload
      const payload = {
        reforma: {
          ...reforma,
          pasto_id: pastoId,
        },
        nova_etapa: {
          tipo_etapa: activeEtapa,
          ...etapaData,
          itens_consumidos: items,
          custo_etapa: custoInsumosCurrentEtapa + custoMaquinaCurrentEtapa,
        },
      };
      await onSubmit(payload);

      // Reset current stage after saving
      setItems([]);
      setEtapaData({
        data_registro: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0],
        maquina_id: '',
        horas_trabalhadas: '',
        custo_hora: '',
        observacoes: '',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title={initialData ? 'Gerenciar Reforma' : 'Iniciar Reforma de Pasto'}
      subtitle="Controle todas as etapas agronômicas, consumo de insumos e maquinário."
      icon={Sprout}
      loading={loading}
      submitLabel={initialData ? 'Registrar Etapa' : 'Iniciar e Registrar 1ª Etapa'}
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: 'rgba(59, 130, 246, 0.05)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Custo Total Acumulado
            </span>
            <span style={{ fontSize: '24px', fontWeight: 900, color: '#3b82f6' }}>
              {custoTotalReforma.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </span>
          </div>
          <DollarSign size={32} color="#3b82f6" opacity={0.2} />
        </div>

        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            Linha do Tempo da Reforma
          </span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {ETAPAS_CONFIG.map((et, idx) => {
              const isCompleted = etapasSalvas.some((s) => s.tipo_etapa === et.id);
              const isActive = activeEtapa === et.id;
              return (
                <div
                  key={et.id}
                  style={{
                    flex: 1,
                    height: '6px',
                    borderRadius: '3px',
                    background: isCompleted
                      ? et.color
                      : isActive
                        ? `${et.color}80`
                        : 'hsl(var(--border))',
                    transition: 'all 0.3s',
                  }}
                  title={et.label}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {ETAPAS_CONFIG.map((et) => {
            const isCompleted = etapasSalvas.some((s) => s.tipo_etapa === et.id);
            const isActive = activeEtapa === et.id;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted
                      ? et.color
                      : isActive
                        ? `${et.color}30`
                        : 'hsl(var(--bg-main))',
                    color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? <CheckCircle size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content - Form Fields */}
        <div
          style={{
            flex: 1,
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          {/* Header of Active Phase */}
          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {ETAPAS_CONFIG.find((e) => e.id === activeEtapa)?.label}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              Preencha os dados e os insumos consumidos nesta etapa.
            </p>
          </div>

          <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '24px' }}>
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Calendar size={14} /> Data da Operação
              </label>
              <input
                className="tauze-input"
                type="date"
                value={etapaData.data_registro}
                onChange={(e) => setEtapaData({ ...etapaData, data_registro: e.target.value })}
                required
              />
            </div>

            {activeEtapa === 'planejamento' && (
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Target size={14} /> Objetivo
                </label>
                <select
                  className="tauze-input"
                  value={reforma.objetivo}
                  onChange={(e) => setReforma({ ...reforma, objetivo: e.target.value })}
                >
                  <option value="Reforma Total">Reforma Total</option>
                  <option value="Recuperação Direta">Recuperação Direta</option>
                  <option value="Integração Lavoura-Pecuária">Integração (ILP)</option>
                </select>
              </div>
            )}

            {activeEtapa === 'estabelecimento' && (
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Activity size={14} /> Status da Reforma
                </label>
                <select
                  className="tauze-input"
                  value={reforma.status}
                  onChange={(e) => setReforma({ ...reforma, status: e.target.value })}
                >
                  <option value="em_andamento">Continuar em Reforma</option>
                  <option value="concluida">Concluir e Liberar Pasto (Pastejo)</option>
                </select>
              </div>
            )}
          </div>

          {/* Specific Phase Fields */}
          {activeEtapa === 'planejamento' && (
            <div
              style={{
                background: 'hsl(var(--bg-main))',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: 'hsl(var(--text-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <FlaskConical size={16} /> Resultados da Análise de Solo
              </h4>
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label">V% (Saturação Base)</label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 45.5"
                    value={reforma.analise_v_percent}
                    onChange={(e) => setReforma({ ...reforma, analise_v_percent: e.target.value })}
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">Fósforo (mg/dm³)</label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 5.2"
                    value={reforma.analise_p_mgdm3}
                    onChange={(e) => setReforma({ ...reforma, analise_p_mgdm3: e.target.value })}
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">Cálcio (cmol/dm³)</label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.1"
                    placeholder="Ex: 2.1"
                    value={reforma.analise_ca_cmolc}
                    onChange={(e) => setReforma({ ...reforma, analise_ca_cmolc: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Photographic Laudo */}
          {(activeEtapa === 'planejamento' || activeEtapa === 'estabelecimento') && (
            <div
              style={{
                background: 'hsl(var(--bg-main))',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
              }}
            >
              <h4
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: 'hsl(var(--text-secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Camera size={16} /> Laudo Fotográfico
              </h4>
              <div className="tauze-input-grid grid-col-2">
                <div className="tauze-field-group">
                  <label className="tauze-label">URL Foto Antes (Planejamento)</label>
                  <input
                    className="tauze-input"
                    type="url"
                    placeholder="https://..."
                    value={reforma.foto_antes_url}
                    onChange={(e) => setReforma({ ...reforma, foto_antes_url: e.target.value })}
                  />
                </div>
                {activeEtapa === 'estabelecimento' && (
                  <div className="tauze-field-group">
                    <label className="tauze-label">URL Foto Depois (Conclusão)</label>
                    <input
                      className="tauze-input"
                      type="url"
                      placeholder="https://..."
                      value={reforma.foto_depois_url}
                      onChange={(e) => setReforma({ ...reforma, foto_depois_url: e.target.value })}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Machinery Cost Tracking (Optional for all operational phases) */}
          {['correcao', 'preparo', 'controle'].includes(activeEtapa) && (
            <div
              style={{
                background: 'hsl(var(--bg-main))',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '24px',
                borderLeft: '3px solid #f59e0b',
              }}
            >
              <h4
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '13px',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Tractor size={16} /> Custos de Maquinário (Hora-Máquina)
              </h4>
              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">Selecionar Máquina</label>
                  <SearchableSelect
                    value={etapaData.maquina_id}
                    onChange={handleMachineChange}
                    options={[
                      { value: '', label: 'Sem maquinário na operação' },
                      ...machines.map((m) => ({ value: m.id, label: m.nome })),
                    ]}
                  />
                </div>
                <div className="tauze-field-group">
                  <label className="tauze-label">Horas Trabalhadas</label>
                  <input
                    className="tauze-input"
                    type="number"
                    step="0.5"
                    placeholder="Ex: 4.5"
                    value={etapaData.horas_trabalhadas}
                    onChange={(e) =>
                      setEtapaData({ ...etapaData, horas_trabalhadas: e.target.value })
                    }
                    disabled={!etapaData.maquina_id}
                  />
                </div>
              </div>
              {custoMaquinaCurrentEtapa > 0 && (
                <div
                  style={{
                    marginTop: '12px',
                    fontSize: '12px',
                    color: 'hsl(var(--text-muted))',
                    textAlign: 'right',
                  }}
                >
                  Custo Maquinário:{' '}
                  <strong style={{ color: 'hsl(var(--text-main))' }}>
                    {custoMaquinaCurrentEtapa.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                  </strong>
                </div>
              )}
            </div>
          )}

          {/* Consumption Cart (Insumos) */}
          <div style={{ marginBottom: '24px' }}>
            <h4
              style={{
                margin: '0 0 8px 0',
                fontSize: '13px',
                color: 'hsl(var(--text-secondary))',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Layers size={16} /> Baixa de Insumos (Sementes, Adubos, Defensivos)
            </h4>
            <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginBottom: '16px' }}>
              Os insumos adicionados aqui serão descontados do Estoque e somados ao custo da
              Reforma.
            </p>
            <ConsumptionCart items={items} onChange={setItems} mode="consumption" />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Observações da Etapa
            </label>
            <textarea
              className="tauze-input tauze-textarea"
              placeholder="Detalhes sobre a aplicação, clima, fornecedores..."
              value={etapaData.observacoes}
              onChange={(e) => setEtapaData({ ...etapaData, observacoes: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      </div>
    </SidePanel>
  );
};
