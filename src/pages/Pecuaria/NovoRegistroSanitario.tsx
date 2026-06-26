import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Syringe,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Plus,
  Edit3,
  Trash2,
  Package,
  Droplets,
  FlaskConical,
  Warehouse,
  Hash,
  RefreshCw,
  Clock,
  Users,
  Activity,
  ArrowLeft,
  ArrowRight,
  Save,
  X,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useTenantFarm, useTenantCore } from '../../contexts/TenantContext';
import { SearchableSelect } from '../../components/Forms/SearchableSelect';
import './NovoRegistroSanitario.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FarmacoItem {
  id: string;
  produto_id: string;
  produto: string;
  dose: string;
  unidade: string;
  via: string;
  deposito_id: string;
  deposito: string;
  lote: string;
  frequencia: string;
}

type Etapa = 0 | 1 | 2;

// ─── Stepper Config ───────────────────────────────────────────────────────────

const ETAPAS = [
  {
    id: 0,
    icon: Users,
    nome: 'Contexto e Alvos',
    descricao: 'Dados da operação e seleção dos animais',
  },
  {
    id: 1,
    icon: Syringe,
    nome: 'Fármacos e Procedimento',
    descricao: 'Medicamentos, vacinas e dosagens',
  },
  {
    id: 2,
    icon: AlertTriangle,
    nome: 'Carência e Alertas',
    descricao: 'Restrições de abate e observações',
  },
];

const VIA_OPTIONS = [
  'Subcutânea (SC)',
  'Intramuscular (IM)',
  'Intravenosa (IV)',
  'Oral',
  'Tópica',
  'Intramamária',
  'Intranasal',
];

const UNIDADE_OPTIONS = ['mL', 'mg', 'g', 'UI', 'dose', 'comprimido'];

const FREQUENCIA_OPTIONS = [
  'Dose única',
  'A cada 24h',
  'A cada 48h',
  'A cada 72h',
  'Semanal',
  'Quinzenal',
  'Mensal',
];

// ─── Componentes de Etapa ─────────────────────────────────────────────────────

const EtapaContexto = ({
  contexto,
  setContexto,
  activeTenantId,
  activeFarmId,
  loteAnimaisCount,
  setLoteAnimaisCount
}: any) => {
  const [searchBrinco, setSearchBrinco] = useState('');
  const fazendaId = contexto.fazenda_id || activeFarmId;

  // Busca Fazendas
  const { data: fazendas } = useQuery({
    queryKey: ['fazendas', activeTenantId],
    queryFn: () => supabase.from('fazendas').select('id, nome').eq('tenant_id', activeTenantId).then(r => r.data ?? [])
  });

  // Busca Lotes
  const { data: lotes } = useQuery({
    queryKey: ['lotes', fazendaId],
    enabled: !!fazendaId,
    queryFn: () => supabase.from('lotes')
      .select('id, nome, total_animais')
      .eq('fazenda_id', fazendaId)
      .eq('status', 'ATIVO')
      .then(r => r.data ?? [])
  });

  // Busca Animais (Individual)
  const { data: animaisBusca } = useQuery({
    queryKey: ['animais', fazendaId, searchBrinco],
    enabled: !!fazendaId && searchBrinco.length >= 2,
    queryFn: () => supabase.from('animais')
      .select('id, brinco, nome, lote_id')
      .eq('tenant_id', activeTenantId)
      .eq('fazenda_id', fazendaId)
      .eq('status', 'ATIVO')
      .ilike('brinco', `%${searchBrinco}%`)
      .limit(20)
      .then(r => r.data ?? [])
  });

  // Atualiza quantidade de animais do lote
  useEffect(() => {
    if (contexto.lote_id && lotes) {
      const loteObj = lotes.find(l => l.id === contexto.lote_id);
      if (loteObj) setLoteAnimaisCount(loteObj.total_animais || 0);
    } else {
      setLoteAnimaisCount(0);
    }
  }, [contexto.lote_id, lotes, setLoteAnimaisCount]);

  const handleAddAnimal = (animal: any) => {
    if (!contexto.animais_ids.includes(animal.id)) {
      setContexto({
        ...contexto,
        animais_ids: [...contexto.animais_ids, animal.id],
        animais_selecionados: [...contexto.animais_selecionados, animal]
      });
    }
    setSearchBrinco('');
  };

  const handleRemoveAnimal = (id: string) => {
    setContexto({
      ...contexto,
      animais_ids: contexto.animais_ids.filter((aid: string) => aid !== id),
      animais_selecionados: contexto.animais_selecionados.filter((a: any) => a.id !== id)
    });
  };

  return (
    <motion.div
      key="etapa-0"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="nrs-step-content"
    >
      <div className="nrs-step-header">
        <h2 className="nrs-step-title">Contexto e Alvos</h2>
        <p className="nrs-step-subtitle">
          Defina os dados da operação sanitária e selecione os animais ou lotes envolvidos.
        </p>
      </div>

      <div className="nrs-form-grid nrs-form-grid-3">
        <div className="nrs-field">
          <label className="nrs-label">Tipo de Manejo <span style={{color:'red'}}>*</span></label>
          <div className="nrs-select-wrapper">
            <select 
              className="nrs-select" 
              value={contexto.tipo} 
              onChange={e => setContexto({...contexto, tipo: e.target.value})}
            >
              <option value="">Selecione...</option>
              <option value="Vacinação">Vacinação</option>
              <option value="Medicamento">Medicamento</option>
              <option value="Tratamento">Tratamento</option>
              <option value="Exame / Diagnóstico">Exame / Diagnóstico</option>
            </select>
            <ChevronDown size={14} className="nrs-select-icon" />
          </div>
        </div>

        <div className="nrs-field">
          <label className="nrs-label">Data do Manejo <span style={{color:'red'}}>*</span></label>
          <input
            type="date"
            className="nrs-input"
            value={contexto.data_manejo}
            onChange={e => setContexto({...contexto, data_manejo: e.target.value})}
          />
        </div>

        <div className="nrs-field">
          <label className="nrs-label">Status</label>
          <div className="nrs-select-wrapper">
            <select 
              className="nrs-select"
              value={contexto.status}
              onChange={e => setContexto({...contexto, status: e.target.value})}
            >
              <option value="REALIZADO">Realizado</option>
              <option value="AGENDADO">Agendado</option>
              <option value="EM ANDAMENTO">Em andamento</option>
            </select>
            <ChevronDown size={14} className="nrs-select-icon" />
          </div>
        </div>
      </div>

      <div className="nrs-form-grid nrs-form-grid-2">
        <div className="nrs-field">
          <label className="nrs-label">Título / Descrição Curta</label>
          <input 
            type="text" 
            className="nrs-input" 
            placeholder="Ex: Vacinação Aftosa Lote A" 
            value={contexto.titulo}
            onChange={e => setContexto({...contexto, titulo: e.target.value})}
          />
        </div>
        <div className="nrs-field">
          <label className="nrs-label">Responsável Técnico</label>
          <input 
            type="text" 
            className="nrs-input" 
            placeholder="Nome do veterinário ou responsável"
            value={contexto.veterinario}
            onChange={e => setContexto({...contexto, veterinario: e.target.value})}
          />
        </div>
      </div>

      <div className="nrs-form-grid nrs-form-grid-2">
        <div className="nrs-field" style={{ gridColumn: 'span 2' }}>
          <label className="nrs-label">Fazenda <span style={{color:'red'}}>*</span></label>
          <div className="nrs-select-wrapper">
            <select 
              className="nrs-select"
              value={contexto.fazenda_id}
              onChange={e => setContexto({...contexto, fazenda_id: e.target.value})}
            >
              <option value="">Selecione a fazenda...</option>
              {fazendas?.map((f: any) => (
                <option key={f.id} value={f.id}>{f.nome}</option>
              ))}
            </select>
            <ChevronDown size={14} className="nrs-select-icon" />
          </div>
        </div>
      </div>

      <div className="nrs-divider" />

      <div className="nrs-section-label">
        <Users size={14} />
        <span>Alvos do Manejo <span style={{color:'red', fontWeight:'normal'}}>(Selecione Lote, Animais individuais ou ambos)</span></span>
      </div>

      <div className="nrs-form-grid nrs-form-grid-2">
        <div className="nrs-field">
          <label className="nrs-label">Adicionar por Lote</label>
          <div className="nrs-select-wrapper">
            <select 
              className="nrs-select"
              value={contexto.lote_id}
              onChange={e => setContexto({...contexto, lote_id: e.target.value})}
            >
              <option value="">Nenhum lote selecionado</option>
              {lotes?.map((l: any) => (
                <option key={l.id} value={l.id}>{l.nome} — {l.total_animais || 0} animais</option>
              ))}
            </select>
            <ChevronDown size={14} className="nrs-select-icon" />
          </div>
        </div>

        <div className="nrs-field">
          <label className="nrs-label">Adicionar Animais Individuais (Buscar por Brinco)</label>
          <div style={{ position: 'relative' }}>
            <input 
              type="text" 
              className="nrs-input" 
              placeholder="Digite o brinco..." 
              value={searchBrinco}
              onChange={e => setSearchBrinco(e.target.value)}
            />
            {animaisBusca && animaisBusca.length > 0 && searchBrinco.length >= 2 && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, 
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                zIndex: 10, borderRadius: '8px', maxHeight: '200px', overflowY: 'auto'
              }}>
                {animaisBusca.map((a: any) => (
                  <div 
                    key={a.id} 
                    style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                    onClick={() => handleAddAnimal(a)}
                  >
                    {a.brinco} {a.nome ? `- ${a.nome}` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {contexto.animais_selecionados.length > 0 && (
        <div className="nrs-field">
          <label className="nrs-label">Animais Individuais Selecionados ({contexto.animais_selecionados.length})</label>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {contexto.animais_selecionados.map((a: any) => (
              <div key={a.id} style={{
                background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', padding: '4px 10px', 
                borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px'
              }}>
                {a.brinco}
                <X size={12} style={{cursor:'pointer'}} onClick={() => handleRemoveAnimal(a.id)} />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="nrs-field">
        <label className="nrs-label">Observação Geral</label>
        <textarea
          className="nrs-input"
          placeholder="Notas adicionais sobre a operação..."
          rows={3}
          style={{ resize: 'vertical' }}
          value={contexto.observacao}
          onChange={e => setContexto({...contexto, observacao: e.target.value})}
        />
      </div>
    </motion.div>
  );
};

const EtapaFarmacos = ({ farmacos, setFarmacos, contexto, onCarenciaHint, activeTenantId, activeFarmId }: any) => {
  const [produtoBusca, setProdutoBusca] = useState('');
  const [novoItem, setNovoItem] = useState<Partial<FarmacoItem>>({
    via: 'Intramuscular (IM)',
    unidade: 'mL',
    frequencia: 'Dose única',
  });
  
  const fazendaId = contexto.fazenda_id || activeFarmId;
  const isExame = contexto.tipo === 'Exame / Diagnóstico';

  const { data: produtosCat } = useQuery({
    queryKey: ['produtos_vet', activeTenantId, produtoBusca],
    queryFn: () => supabase.from('produtos')
      .select('id, nome, unidade_medida, custo_medio, carencia_dias, is_storable')
      .eq('tenant_id', activeTenantId)
      .ilike('nome', `%${produtoBusca}%`)
      .order('nome')
      .limit(30)
      .then(r => r.data ?? [])
  });

  const { data: depositos } = useQuery({
    queryKey: ['depositos', fazendaId],
    enabled: !!fazendaId,
    queryFn: () => supabase.from('depositos')
      .select('id, nome')
      .eq('tenant_id', activeTenantId)
      .or(`fazenda_id.eq.${fazendaId},fazenda_id.is.null`)
      .neq('status', 'inativo')
      .then(r => r.data ?? [])
  });

  const { data: lotesProd } = useQuery({
    queryKey: ['lotes_estoque', novoItem.produto_id, novoItem.deposito_id],
    enabled: !!novoItem.produto_id && !!novoItem.deposito_id,
    queryFn: () => supabase.from('movimentacoes_estoque')
      .select('lote, data_validade')
      .eq('produto_id', novoItem.produto_id)
      .eq('deposito_id', novoItem.deposito_id)
      .eq('tipo', 'ENTRADA')
      .not('lote', 'is', null)
      .order('data_validade', { ascending: true })
      .then(r => [...new Map((r.data??[]).map(i => [i.lote, i])).values()])
  });

  const handleAdd = () => {
    if (!novoItem.produto_id || !novoItem.dose) {
      toast.error('Preencha Produto/Exame e Dose/Resultado.');
      return;
    }
    setFarmacos([...farmacos, { ...novoItem, id: Math.random().toString(36).substr(2, 9) }]);
    setNovoItem({ via: 'Intramuscular (IM)', unidade: 'mL', frequencia: 'Dose única' });
    setProdutoBusca('');
  };

  const removeFarmaco = (id: string) => {
    setFarmacos(farmacos.filter((f: any) => f.id !== id));
  };

  return (
    <motion.div
      key="etapa-1"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="nrs-step-content"
    >
      <div className="nrs-step-header">
        <h2 className="nrs-step-title">{isExame ? 'Achados e Resultados' : 'Fármacos e Procedimento'}</h2>
        <p className="nrs-step-subtitle">
          {isExame ? 'Registre os exames realizados e seus resultados.' : 'Adicione os medicamentos e defina as dosagens do tratamento.'}
        </p>
      </div>

      <div className="nrs-add-farmaco-box">
        <div className="nrs-box-header">
          <Package size={16} />
          <span>{isExame ? 'Novo Exame' : 'Novo Fármaco'}</span>
        </div>
        
        <div className="nrs-form-grid nrs-form-grid-2">
          <div className="nrs-field" style={{ gridColumn: 'span 2' }}>
            <label className="nrs-label">{isExame ? 'Exame Realizado' : 'Produto / Vacina'}</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="nrs-input"
                placeholder="Busque o item..."
                value={produtoBusca}
                onChange={e => setProdutoBusca(e.target.value)}
              />
              {produtosCat && produtosCat.length > 0 && produtoBusca.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0, 
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  zIndex: 10, borderRadius: '8px', maxHeight: '200px', overflowY: 'auto'
                }}>
                  {produtosCat.map((p: any) => (
                    <div 
                      key={p.id} 
                      style={{ padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      onClick={() => {
                        setNovoItem({...novoItem, produto: p.nome, produto_id: p.id, unidade: p.unidade_medida || 'UN'});
                        setProdutoBusca(p.nome);
                        if (p.carencia_dias) onCarenciaHint(p.carencia_dias);
                      }}
                    >
                      {p.nome}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="nrs-field">
            <label className="nrs-label">{isExame ? 'Resultado' : 'Dose (por animal)'}</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="nrs-input"
                placeholder={isExame ? 'Ex: Positivo' : '0.00'}
                value={novoItem.dose || ''}
                onChange={e => setNovoItem({...novoItem, dose: e.target.value})}
                style={{ flex: 2 }}
              />
              {!isExame && (
                <div className="nrs-select-wrapper" style={{ flex: 1 }}>
                  <select 
                    className="nrs-select"
                    value={novoItem.unidade}
                    onChange={e => setNovoItem({...novoItem, unidade: e.target.value})}
                  >
                    {UNIDADE_OPTIONS.map(u => <option key={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={14} className="nrs-select-icon" />
                </div>
              )}
            </div>
          </div>

          {!isExame && (
            <div className="nrs-field">
              <label className="nrs-label">Via de Aplicação</label>
              <div className="nrs-select-wrapper">
                <select 
                  className="nrs-select"
                  value={novoItem.via}
                  onChange={e => setNovoItem({...novoItem, via: e.target.value})}
                >
                  {VIA_OPTIONS.map(v => <option key={v}>{v}</option>)}
                </select>
                <ChevronDown size={14} className="nrs-select-icon" />
              </div>
            </div>
          )}

          {!isExame && (
            <>
              <div className="nrs-field">
                <label className="nrs-label">Depósito de Saída (Estoque)</label>
                <div className="nrs-select-wrapper">
                  <select 
                    className="nrs-select"
                    value={novoItem.deposito_id || ''}
                    onChange={e => setNovoItem({
                      ...novoItem, 
                      deposito_id: e.target.value,
                      deposito: e.target.options[e.target.selectedIndex].text
                    })}
                  >
                    <option value="">Selecione o depósito...</option>
                    {depositos?.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                  </select>
                  <ChevronDown size={14} className="nrs-select-icon" />
                </div>
              </div>

              <div className="nrs-field">
                <label className="nrs-label">Lote do Produto</label>
                <div className="nrs-select-wrapper">
                  <select 
                    className="nrs-select"
                    value={novoItem.lote || ''}
                    onChange={e => setNovoItem({...novoItem, lote: e.target.value})}
                    disabled={!novoItem.deposito_id}
                  >
                    <option value="">Automático (PEPS)</option>
                    {lotesProd?.map((l: any) => <option key={l.lote} value={l.lote}>{l.lote}</option>)}
                  </select>
                  <ChevronDown size={14} className="nrs-select-icon" />
                </div>
              </div>
            </>
          )}
        </div>

        <button className="nrs-add-btn" onClick={handleAdd}>
          <Plus size={16} />
          {isExame ? 'REGISTRAR ACHADO' : 'ADICIONAR ITEM'}
        </button>
      </div>

      <div className="nrs-items-list">
        {farmacos.length === 0 ? (
          <div className="nrs-empty-state">
            <Droplets size={32} opacity={0.5} />
            <p>Nenhum item adicionado à prescrição.</p>
          </div>
        ) : (
          farmacos.map((item: any) => (
            <div key={item.id} className="nrs-farmaco-card">
              <div className="nrs-fc-icon">
                {isExame ? <FlaskConical size={20} /> : <Syringe size={20} />}
              </div>
              <div className="nrs-fc-info">
                <h4>{item.produto}</h4>
                <div className="nrs-fc-meta">
                  <span className="nrs-badge"><Hash size={12} /> {item.dose} {isExame ? '' : item.unidade}</span>
                  {!isExame && <span className="nrs-badge"><Activity size={12} /> {item.via}</span>}
                  {item.deposito && <span className="nrs-badge"><Warehouse size={12} /> {item.deposito}</span>}
                </div>
              </div>
              <div className="nrs-fc-actions">
                <button className="nrs-action-btn delete" onClick={() => removeFarmaco(item.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

const EtapaCarencia = ({ carencia, setCarencia, contexto }: any) => {
  const isExame = contexto.tipo === 'Exame / Diagnóstico';

  const dataLiberacao = useMemo(() => {
    if (carencia.carencia_abate_dias > 0 && contexto.data_manejo) {
      const d = new Date(contexto.data_manejo);
      d.setDate(d.getDate() + parseInt(carencia.carencia_abate_dias));
      return d.toISOString().split('T')[0];
    }
    return '';
  }, [contexto.data_manejo, carencia.carencia_abate_dias]);

  useEffect(() => {
    if (dataLiberacao !== carencia.data_liberacao) {
      setCarencia((c: any) => ({ ...c, data_liberacao: dataLiberacao }));
    }
    if (carencia.carencia_abate_dias > 0 && !carencia.bloquear_romaneio) {
      setCarencia((c: any) => ({ ...c, bloquear_romaneio: true }));
    }
  }, [dataLiberacao, carencia.carencia_abate_dias, carencia.bloquear_romaneio, setCarencia, carencia.data_liberacao]);

  return (
    <motion.div
      key="etapa-2"
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="nrs-step-content"
    >
      <div className="nrs-step-header">
        <h2 className="nrs-step-title">{isExame ? 'Conduta e Alertas' : 'Carência e Alertas'}</h2>
        <p className="nrs-step-subtitle">
          Configurações de restrição de abate e controle do sistema.
        </p>
      </div>

      {!isExame && (
        <>
          <div className="nrs-alert-box info">
            <AlertTriangle size={20} />
            <div>
              <strong>Controle de Carência</strong>
              <p>O bloqueio no romaneio evita abate de animais com resíduo de medicamentos.</p>
            </div>
          </div>

          <div className="nrs-form-grid nrs-form-grid-2">
            <div className="nrs-field">
              <label className="nrs-label">Dias de Carência (Abate)</label>
              <input
                type="number"
                className="nrs-input"
                placeholder="Ex: 30"
                min="0"
                value={carencia.carencia_abate_dias}
                onChange={e => setCarencia({...carencia, carencia_abate_dias: Number(e.target.value)})}
              />
            </div>
            
            <div className="nrs-field">
              <label className="nrs-label">Dias de Carência (Leite)</label>
              <input
                type="number"
                className="nrs-input"
                placeholder="Ex: 5"
                min="0"
                value={carencia.carencia_leite_dias}
                onChange={e => setCarencia({...carencia, carencia_leite_dias: Number(e.target.value)})}
              />
            </div>

            <div className="nrs-field">
              <label className="nrs-label">Data de Liberação Prevista</label>
              <input
                type="date"
                className="nrs-input"
                readOnly
                value={carencia.data_liberacao}
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div className="nrs-divider" />
        </>
      )}

      <div className="nrs-section-label">
        <ShieldCheck size={14} />
        <span>Ações Automáticas</span>
      </div>

      <div className="nrs-toggle-group">
        {!isExame && (
          <label className={`nrs-toggle-item ${carencia.bloquear_romaneio ? 'active' : ''}`}>
            <div className="nrs-toggle-info">
              <span className="nrs-toggle-title">Bloquear no Romaneio</span>
              <span className="nrs-toggle-desc">Impede expedição de animais no período de carência</span>
            </div>
            <div className="tauze-switch">
              <input type="checkbox" checked={carencia.bloquear_romaneio} onChange={e => setCarencia({...carencia, bloquear_romaneio: e.target.checked})} disabled={carencia.carencia_abate_dias > 0} />
              <span className="slider round"></span>
            </div>
          </label>
        )}

        <label className={`nrs-toggle-item ${carencia.notificar_fim ? 'active' : ''}`}>
          <div className="nrs-toggle-info">
            <span className="nrs-toggle-title">Notificar Liberação</span>
            <span className="nrs-toggle-desc">Cria um alerta quando a carência terminar</span>
          </div>
          <div className="tauze-switch">
            <input type="checkbox" checked={carencia.notificar_fim} onChange={e => setCarencia({...carencia, notificar_fim: e.target.checked})} />
            <span className="slider round"></span>
          </div>
        </label>
      </div>

      <div className="nrs-field" style={{ marginTop: '24px' }}>
        <label className="nrs-label">Observações Técnicas Privadas</label>
        <textarea
          className="nrs-input"
          placeholder="Anotações apenas para a equipe técnica..."
          rows={3}
          style={{ resize: 'vertical' }}
          value={carencia.observacoes_tecnicas}
          onChange={e => setCarencia({...carencia, observacoes_tecnicas: e.target.value})}
        />
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const NovoRegistroSanitario: React.FC = () => {
  const navigate = useNavigate();
  const { activeTenantId } = useTenantCore();
  const { activeFarmId } = useTenantFarm();
  
  const [etapaAtual, setEtapaAtual] = useState<Etapa>(0);
  const [salvando, setSalvando] = useState(false);
  const [loteAnimaisCount, setLoteAnimaisCount] = useState(0);

  // States
  const [contexto, setContexto] = useState({
    titulo: '',
    tipo: '',
    data_manejo: new Date().toISOString().split('T')[0],
    status: 'REALIZADO',
    veterinario: '',
    fazenda_id: activeFarmId || '',
    lote_id: '',
    animais_ids: [] as string[],
    animais_selecionados: [] as any[],
    observacao: ''
  });

  const [farmacos, setFarmacos] = useState<FarmacoItem[]>([]);

  const [carencia, setCarencia] = useState({
    carencia_abate_dias: 0,
    carencia_leite_dias: 0,
    data_liberacao: '',
    bloquear_romaneio: true,
    notificar_fim: true,
    gerar_documento: false,
    observacoes_tecnicas: ''
  });

  const handleCarenciaHint = (dias: number) => {
    if (dias > carencia.carencia_abate_dias) {
      setCarencia(c => ({ ...c, carencia_abate_dias: dias, bloquear_romaneio: true }));
    }
  };

  const totalAnimais = contexto.animais_ids.length + loteAnimaisCount;

  const validarEtapa = (e: Etapa): boolean => {
    if (e === 0) return !!contexto.tipo && !!contexto.data_manejo && !!contexto.fazenda_id && (contexto.animais_ids.length > 0 || !!contexto.lote_id);
    if (e === 1) return farmacos.length > 0;
    return true;
  };

  const etapaCompleta = (idx: Etapa): boolean => {
    for (let i = 0; i <= idx; i++) {
      if (!validarEtapa(i as Etapa)) return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validarEtapa(etapaAtual)) {
      toast.error('Preencha os campos obrigatórios antes de continuar.');
      return;
    }
    setEtapaAtual((e) => (e + 1) as Etapa);
  };

  const handlePrev = () => {
    setEtapaAtual((e) => (e - 1) as Etapa);
  };

  const handleSave = async () => {
    if (!validarEtapa(0) || !validarEtapa(1)) {
      toast.error('Preencha os campos obrigatórios.');
      return;
    }

    setSalvando(true);
    try {
      // 1. Insert em sanidade (mestre)
      const { data: san, error: sanError } = await supabase
        .from('sanidade')
        .insert({
          tenant_id: activeTenantId,
          fazenda_id: contexto.fazenda_id,
          lote_id: contexto.lote_id || null,
          animal_id: contexto.animais_ids[0] || null, // apenas ref. compatibilidade
          titulo: contexto.titulo || contexto.tipo,
          tipo: contexto.tipo,
          data_manejo: contexto.data_manejo,
          status: contexto.status,
          carencia_dias: carencia.carencia_abate_dias,
          carencia_leite_dias: carencia.carencia_leite_dias,
          bloquear_romaneio: carencia.bloquear_romaneio,
          notificar_fim_carencia: carencia.notificar_fim,
          veterinario: contexto.veterinario,
          data_liberacao: carencia.data_liberacao || null,
          observacao: contexto.observacao + (carencia.observacoes_tecnicas ? `\nNotas Téc: ${carencia.observacoes_tecnicas}` : '')
        })
        .select()
        .single();
      
      if (sanError) throw sanError;

      // 2. Resolver animais alvo
      let animaisAlvo = [...contexto.animais_ids];
      if (contexto.lote_id) {
        const { data: animaisLote } = await supabase
          .from('animais')
          .select('id')
          .eq('lote_id', contexto.lote_id)
          .eq('status', 'ATIVO');
        if (animaisLote) {
          animaisAlvo = [...new Set([...animaisAlvo, ...animaisLote.map((a:any) => a.id)])];
        }
      }

      // 3. Insert sanidade_animais + controle estoque igual no HealthManagement.tsx
      for (const farmaco of farmacos) {
        let custoMedio = 0;
        let controleEstoque = false;
        
        if (farmaco.produto_id) {
          const { data: prod } = await supabase
            .from('produtos')
            .select('custo_medio, is_storable')
            .eq('id', farmaco.produto_id)
            .maybeSingle();
          if (prod) {
            custoMedio = Number(prod.custo_medio || 0);
            controleEstoque = prod.is_storable;
          }
        }

        const parsedDose = Number(String(farmaco.dose || '0').replace(/[^0-9.]/g, '')) || 1;
        const totalDoseCost = parsedDose * custoMedio;

        if (animaisAlvo.length > 0) {
          const sanidadeAnimaisInserts = animaisAlvo.map(aid => ({
            tenant_id: activeTenantId,
            fazenda_id: contexto.fazenda_id,
            sanidade_id: san.id,
            animal_id: aid,
            produto_id: farmaco.produto_id || null,
            quantidade_dose: parsedDose,
            valor_unitario_aplicado: custoMedio,
            valor_total_aplicado: totalDoseCost,
            data_aplicacao: contexto.data_manejo,
            fase: 'RECRIA' // Pode ser aprimorado para buscar a fase real depois
          }));

          const { error: saError } = await supabase
            .from('sanidade_animais')
            .insert(sanidadeAnimaisInserts);
          
          if (saError) console.error('Erro em sanidade_animais', saError);

          if (controleEstoque && farmaco.produto_id && farmaco.deposito_id) {
            const totalUsed = animaisAlvo.length * parsedDose;
            await supabase.from('movimentacoes_estoque').insert({
              produto_id: farmaco.produto_id,
              tipo: 'SAIDA',
              quantidade: totalUsed,
              custo_unitario: custoMedio,
              data_movimentacao: contexto.data_manejo,
              origem_destino: `Manejo Sanitário [REF:${san.id}]`,
              responsavel: contexto.veterinario || 'Sistema Pecuária',
              fazenda_id: contexto.fazenda_id,
              tenant_id: activeTenantId,
              deposito_id: farmaco.deposito_id,
              lote: farmaco.lote || null
            });
          }
        }
      }

      toast.success('Registro sanitário salvo com sucesso!');
      navigate('/pecuaria/sanidade');
    } catch (err: any) {
      console.error(err);
      toast.error(`Erro ao salvar: ${err.message}`);
    } finally {
      setSalvando(false);
    }
  };

  const progressPct = Math.round(((etapaAtual + 1) / ETAPAS.length) * 100);

  return (
    <div className="nrs-page-container">
      <div className="nrs-header-bar">
        <Breadcrumb
          paths={[
            { label: 'Pecuária', href: '/pecuaria/dashboard' },
            { label: 'Sanidade', href: '/pecuaria/sanidade' },
            { label: 'Novo Registro' },
          ]}
        />
        <div className="nrs-header-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/pecuaria/sanidade')}>
            <X size={18} /> Cancelar
          </button>
        </div>
      </div>

      <div className="nrs-main-content">
        <div className="nrs-stepper-sidebar">
          <div className="nrs-stepper-header">
            <h3>Fluxo de Manejo</h3>
            <p>Siga as etapas para concluir</p>
            
            <div className="nrs-progress-track">
              <div 
                className="nrs-progress-fill" 
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="nrs-progress-text">{progressPct}% Completo</div>
          </div>

          <div className="nrs-steps-list">
            {ETAPAS.map((etp, idx) => {
              const Icon = etp.icon;
              const isActive = idx === etapaAtual;
              const isDone = idx < etapaAtual;
              const isLocked = idx > etapaAtual && !etapaCompleta(idx as Etapa);

              return (
                <button
                  key={etp.id}
                  disabled={isLocked}
                  onClick={() => (!isLocked) ? setEtapaAtual(idx as Etapa) : undefined}
                  className={`nrs-step-item ${isActive ? 'nrs-step-active' : ''} ${isDone ? 'nrs-step-done' : ''} ${isLocked ? 'nrs-step-locked' : ''}`}
                >
                  <div className="nrs-step-icon">
                    {isDone ? <CheckCircle2 size={18} /> : <Icon size={18} />}
                  </div>
                  <div className="nrs-step-info">
                    <h4>{etp.nome}</h4>
                    <span>{etp.descricao}</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="nrs-context-summary">
            <h4>Resumo da Operação</h4>
            <div className="nrs-context-cards">
              <div className="nrs-context-card">
                <span className="nrs-context-card-label">Animais Alvo</span>
                <span className="nrs-context-card-value">{totalAnimais} cabeças</span>
              </div>
              <div className="nrs-context-card">
                <span className="nrs-context-card-label">Produtos</span>
                <span className="nrs-context-card-value">{farmacos.length} itens</span>
              </div>
              <div className="nrs-context-card">
                <span className="nrs-context-card-label">Carência</span>
                <span className="nrs-context-card-value">{carencia.carencia_abate_dias > 0 ? `${carencia.carencia_abate_dias} dias` : 'Nenhuma'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="nrs-form-area">
          <div className="nrs-form-viewport">
            <AnimatePresence mode="wait">
              {etapaAtual === 0 && (
                <EtapaContexto contexto={contexto} setContexto={setContexto} activeTenantId={activeTenantId} activeFarmId={activeFarmId} loteAnimaisCount={loteAnimaisCount} setLoteAnimaisCount={setLoteAnimaisCount} />
              )}
              {etapaAtual === 1 && (
                <EtapaFarmacos farmacos={farmacos} setFarmacos={setFarmacos} contexto={contexto} onCarenciaHint={handleCarenciaHint} activeTenantId={activeTenantId} activeFarmId={activeFarmId} />
              )}
              {etapaAtual === 2 && (
                <EtapaCarencia carencia={carencia} setCarencia={setCarencia} contexto={contexto} />
              )}
            </AnimatePresence>
          </div>

          <div className="nrs-form-footer">
            <div className="nrs-footer-left">
              {etapaAtual > 0 && (
                <button className="glass-btn secondary" onClick={handlePrev}>
                  <ArrowLeft size={18} />
                  Voltar Etapa
                </button>
              )}
            </div>
            <div className="nrs-footer-right">
              {etapaAtual < 2 ? (
                <button className="primary-btn" onClick={handleNext}>
                  Próxima Etapa
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button className="primary-btn nrs-save-btn" onClick={handleSave} disabled={salvando}>
                  <Save size={18} />
                  {salvando ? 'Processando...' : 'Concluir e Salvar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NovoRegistroSanitario;
