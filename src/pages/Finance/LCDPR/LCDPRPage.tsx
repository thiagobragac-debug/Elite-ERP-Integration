import React, { useState, useEffect, useMemo } from 'react';
import { usePersistentState } from '../../../hooks/usePersistentState';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useSearchParams } from 'react-router-dom';
import { Search,
  BookOpen, Plus, Download, RefreshCw, FileText,
  ChevronDown, ChevronUp, Trash2, Edit3, CheckCircle,
  AlertCircle, Filter, BarChart3, ArrowUpRight, ArrowDownRight,
  Calendar, Building2, Hash, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { useTenant } from '../../../contexts/TenantContext';
import { NATUREZAS_LCDPR, NATUREZAS_RECEITA, NATUREZAS_DESPESA } from './utils/lcdprNaturezas';
import { buildLCDPRFile, downloadLCDPRFile } from './utils/lcdprFileBuilder';
import { TauzeStatCard } from '../../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../../components/DataTable/ModernTable';
import { EmptyState } from '../../../components/Feedback/EmptyState';
import { SidePanel } from '../../../components/Layout/SidePanel';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../../components/Navigation/Breadcrumb';

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const ANO_ATUAL = new Date().getFullYear();

export const LCDPRPage: React.FC = () => {
  const { tenant, activeFarm } = useTenant();
  const [anoCalendario, setAnoCalendario] = useState(ANO_ATUAL);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as 'lancamentos'|'resumo'|'gerar') || 'lancamentos';
  const setActiveTab = (tab: string) => {
    setSearchParams(prev => { const n = new URLSearchParams(prev); n.set('tab', tab); return n; }, { replace: true });
  };
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = usePersistentState('LCDPRPage_isModalOpen', false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [filterTipo, setFilterTipo] = useState<'TODOS'|'R'|'D'>('TODOS');
  const [generatingFile, setGeneratingFile] = useState(false);

  // Form state
  const [form, setForm] = useState({
    fazenda_id: '',
    data_lancamento: new Date().toISOString().split('T')[0],
    cod_imovel: '',
    cod_conta_bancaria: '',
    tipo: 'R',
    cod_natureza: '01',
    descricao: '',
    cpf_cnpj_participante: '',
    nome_participante: '',
    tipo_documento: '1',
    num_documento: '',
    valor: ''
  });

  const { data: lancamentos = [], isLoading: loadingLancamentos, error: errorLancamentos } = useQuery({
    queryKey: ['lcdpr_lancamentos', tenant?.id, anoCalendario],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('lcdpr_lancamentos')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('ano_calendario', anoCalendario)
        .order('data_lancamento', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const { data: fazendas = [], isLoading: loadingFazendas } = useQuery({
    queryKey: ['fazendas', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('fazendas')
        .select('*')
        .eq('tenant_id', tenant.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const { data: unidadeMatriz = null, isLoading: loadingUnidade } = useQuery({
    queryKey: ['unidade_matriz', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return null;
      const { data, error } = await supabase
        .from('unidades')
        .select('*')
        .eq('tenant_id', tenant.id)
        .ilike('tipo', 'matriz')
        .limit(1);
      if (error) throw error;
      return data?.[0] || null;
    },
    enabled: !!tenant?.id,
  });

  const { data: contas = [], isLoading: loadingContas } = useQuery({
    queryKey: ['contas_bancarias', tenant?.id],
    queryFn: async () => {
      if (!tenant?.id) return [];
      const { data, error } = await supabase
        .from('contas_bancarias')
        .select('*')
        .eq('tenant_id', tenant.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!tenant?.id,
  });

  const loading = loadingLancamentos || loadingFazendas || loadingUnidade || loadingContas;

  if (errorLancamentos) {
    console.error("[LCDPR] Error loading data:", errorLancamentos);
  }

  // ─── KPIs Resumo ──────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const filtered = activeFarm?.id
      ? lancamentos.filter(l => l.fazenda_id === activeFarm.id)
      : lancamentos;
    const receitas = filtered.filter(l => l.tipo === 'R').reduce((a, l) => a + Number(l.valor), 0);
    const despesas = filtered.filter(l => l.tipo === 'D').reduce((a, l) => a + Number(l.valor), 0);
    return { receitas, despesas, saldo: receitas - despesas, total: filtered.length };
  }, [lancamentos, activeFarm]);

  // ─── Resumo Mensal ────────────────────────────────────────────────────────
  const resumoMensal = useMemo(() => {
    let saldoAcum = 0;
    return MESES.map((mes, idx) => {
      const mm = idx + 1;
      const lancMes = lancamentos.filter(l => new Date(l.data_lancamento).getMonth() + 1 === mm);
      const rec = lancMes.filter(l => l.tipo === 'R').reduce((a, l) => a + Number(l.valor), 0);
      const desp = lancMes.filter(l => l.tipo === 'D').reduce((a, l) => a + Number(l.valor), 0);
      const saldoInicio = saldoAcum;
      saldoAcum = saldoInicio + rec - desp;
      return { mes, rec, desp, saldoInicio, saldoFim: saldoAcum, count: lancMes.length };
    });
  }, [lancamentos]);

  // ─── CRUD ─────────────────────────────────────────────────────────────────
  const openNew = () => {
    setEditingItem(null);
    setForm({
      fazenda_id: activeFarm?.id || fazendas[0]?.id || '',
      data_lancamento: new Date().toISOString().split('T')[0],
      cod_imovel: '', cod_conta_bancaria: contas[0]?.id || '999', tipo: 'R', cod_natureza: '01',
      descricao: '', cpf_cnpj_participante: '', nome_participante: '', tipo_documento: '1', num_documento: '', valor: ''
    });
    setIsModalOpen(true);
  };

  const openEdit = (item: any) => {
    setEditingItem(item);
    setForm({
      fazenda_id: item.fazenda_id || '',
      data_lancamento: item.data_lancamento,
      cod_imovel: item.cod_imovel || '',
      cod_conta_bancaria: item.cod_conta_bancaria || '999',
      tipo: item.tipo,
      cod_natureza: item.cod_natureza,
      descricao: item.descricao || '',
      cpf_cnpj_participante: item.cpf_cnpj_participante || '',
      nome_participante: item.nome_participante || '',
      tipo_documento: item.tipo_documento || '1',
      num_documento: item.num_documento || '',
      valor: String(item.valor)
    });
    setIsModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingItem) {
        const { error } = await supabase.from('lcdpr_lancamentos').update(payload).eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('lcdpr_lancamentos').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lcdpr_lancamentos', tenant?.id, anoCalendario] });
      setIsModalOpen(false);
      toast.success(editingItem ? 'Lançamento atualizado com sucesso!' : 'Lançamento adicionado com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao salvar lançamento: ' + err.message);
    }
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;
    const fazenda = fazendas.find(f => f.id === form.fazenda_id);
    const payload = {
      tenant_id: tenant.id,
      fazenda_id: form.fazenda_id || null,
      unidade_id: fazenda?.unidade_id || null,
      ano_calendario: anoCalendario,
      data_lancamento: form.data_lancamento,
      cod_imovel: form.cod_imovel || (fazenda?.nirf ? `FAZ${fazendas.indexOf(fazenda)+1}` : 'IMP001'),
      cod_conta_bancaria: form.cod_conta_bancaria || '999',
      tipo: form.tipo,
      cod_natureza: form.cod_natureza,
      descricao: form.descricao,
      cpf_cnpj_participante: form.cpf_cnpj_participante.replace(/\D/g,'') || null,
      nome_participante: form.nome_participante || null,
      tipo_documento: form.tipo_documento || null,
      num_documento: form.num_documento || null,
      valor: parseFloat(form.valor) || 0,
      origem: 'MANUAL'
    };
    saveMutation.mutate(payload);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('lcdpr_lancamentos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lcdpr_lancamentos', tenant?.id, anoCalendario] });
      toast.success('Lançamento excluído com sucesso!');
    },
    onError: (err: any) => {
      toast.error('❌ Erro ao excluir lançamento: ' + err.message);
    }
  });

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este lançamento?')) return;
    deleteMutation.mutate(id);
  };

  const importFinanceiroMutation = useMutation({
    mutationFn: async () => {
      if (!tenant?.id) return 0;
      const startDate = `${anoCalendario}-01-01`;
      const endDate = `${anoCalendario}-12-31`;
      const [{ data: receber }, { data: pagar }] = await Promise.all([
        supabase.from('contas_receber').select('*')
          .eq('tenant_id', tenant.id).eq('status', 'PAGO')
          .gte('data_vencimento', startDate).lte('data_vencimento', endDate),
        supabase.from('contas_pagar').select('*')
          .eq('tenant_id', tenant.id).eq('status', 'PAGO')
          .gte('data_vencimento', startDate).lte('data_vencimento', endDate)
      ]);
      const toInsert: any[] = [];
      (receber || []).forEach(r => {
        toInsert.push({
          tenant_id: tenant.id, fazenda_id: r.fazenda_id || null,
          ano_calendario: anoCalendario,
          data_lancamento: r.data_vencimento,
          cod_imovel: 'IMP001', cod_conta_bancaria: '999',
          tipo: 'R', cod_natureza: '01',
          descricao: r.descricao || r.categoria || 'Receita Importada',
          cpf_cnpj_participante: (r.cpf_cnpj || '').replace(/\D/g,'') || null,
          nome_participante: r.parceiro || null,
          num_documento: r.numero_documento || null,
          valor: Number(r.valor_total) || 0,
          origem: 'CONTAS_RECEBER', origem_id: r.id
        });
      });
      (pagar || []).forEach(p => {
        toInsert.push({
          tenant_id: tenant.id, fazenda_id: p.fazenda_id || null,
          ano_calendario: anoCalendario,
          data_lancamento: p.data_vencimento,
          cod_imovel: 'IMP001', cod_conta_bancaria: '999',
          tipo: 'D', cod_natureza: '29',
          descricao: p.descricao || p.categoria || 'Despesa Importada',
          cpf_cnpj_participante: (p.cpf_cnpj || '').replace(/\D/g,'') || null,
          nome_participante: p.parceiro || null,
          num_documento: p.numero_documento || null,
          valor: Number(p.valor_total) || 0,
          origem: 'CONTAS_PAGAR', origem_id: p.id
        });
      });
      if (toInsert.length > 0) {
        const { error } = await supabase.from('lcdpr_lancamentos').insert(toInsert);
        if (error) throw error;
      }
      return toInsert.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['lcdpr_lancamentos', tenant?.id, anoCalendario] });
      toast.success(`✅ ${count} lançamentos importados do Financeiro!`);
    },
    onError: (err: any) => {
      console.error(err);
      toast.error('Erro ao importar. Tente novamente: ' + err.message);
    }
  });

  // ─── Importar de Financeiro ───────────────────────────────────────────────
  const handleImportFinanceiro = async () => {
    if (!tenant?.id) return;
    if (!confirm(`Importar contas PAGAS de ${anoCalendario} do módulo Financeiro para o LCDPR?`)) return;
    importFinanceiroMutation.mutate();
  };

  // ─── Gerar Arquivo ────────────────────────────────────────────────────────
  const handleGerarArquivo = async () => {
    if (!unidadeMatriz) {
      toast.error('Configure uma empresa Matriz com CPF/Sócio antes de gerar o arquivo.');
      return;
    }
    if (lancamentos.length === 0) {
      toast.error('Não há lançamentos para o ano selecionado.');
      return;
    }
    setGeneratingFile(true);
    try {
      // Determinar CPF do produtor (sócio se CNPJ, próprio documento se CPF)
      const docDigits = (unidadeMatriz.cnpj || unidadeMatriz.documento || '').replace(/\D/g,'');
      const cpfProdutor = docDigits.length === 14
        ? (unidadeMatriz.socio_cpf || '').replace(/\D/g,'')
        : docDigits;
      const nomeProdutor = docDigits.length === 14
        ? (unidadeMatriz.socio_nome || unidadeMatriz.razao_social || unidadeMatriz.nome)
        : (unidadeMatriz.razao_social || unidadeMatriz.nome);

      if (!cpfProdutor || cpfProdutor.length !== 11) {
        toast.error('CPF do produtor não encontrado. Preencha os dados do sócio no cadastro da empresa Matriz.');
        return;
      }

      const config = {
        anoCalendario,
        cpfProdutor,
        nomeProdutor,
        indSitEsp: unidadeMatriz.socio_ind_sit_esp ?? 0,
        cpfContador: (unidadeMatriz.contador_cpf || '').replace(/\D/g,''),
        nomeContador: unidadeMatriz.contador_nome,
        crcContador: unidadeMatriz.contador_crc
      };

      // Montar imóveis a partir das fazendas
      const imoveisList = fazendas.map((f, idx) => ({
        codImovel: f.nirf ? `FAZ${String(idx+1).padStart(3,'0')}` : 'IMP001',
        nomeImovel: f.nome,
        nirf: f.nirf,
        municipio: f.municipio || f.localizacao,
        uf: f.uf,
        areaHa: Number(f.area_total || f.area_ha || 0)
      }));

      // Se não há fazendas com NIRF, adiciona imóvel genérico
      if (imoveisList.length === 0) {
        imoveisList.push({ codImovel: 'IMP001', nomeImovel: 'ATIVIDADE RURAL', nirf: '', municipio: '', uf: '', areaHa: 0 });
      }

      const contasList = [{ codConta: '999', descricao: 'Numerário em Trânsito / Espécie' }];

      const lancsFormatted = lancamentos.map(l => ({
        dataLancamento: l.data_lancamento,
        codImovel: l.cod_imovel || 'IMP001',
        codContaBancaria: l.cod_conta_bancaria || '999',
        tipo: l.tipo as 'R'|'D',
        codNatureza: l.cod_natureza,
        descricao: l.descricao,
        cpfCnpjParticipante: l.cpf_cnpj_participante,
        nomeParticipante: l.nome_participante,
        numDocumento: l.num_documento,
        valor: Number(l.valor)
      }));

      const conteudo = buildLCDPRFile(config, imoveisList, contasList, lancsFormatted);
      downloadLCDPRFile(conteudo, anoCalendario, cpfProdutor);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar arquivo.');
    } finally { setGeneratingFile(false); }
  };

  const filteredLancs = lancamentos.filter(l =>
    filterTipo === 'TODOS' ? true : l.tipo === filterTipo
  );

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const columns = [
    {
      header: 'Data',
      accessor: (l: any) => (
        <div style={{ fontWeight: 600, fontSize: 13, color: 'hsl(var(--text-main))' }}>
          {new Date(l.data_lancamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Fazenda',
      accessor: (l: any) => {
        const faz = fazendas.find(f => f.id === l.fazenda_id);
        return <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>{faz?.nome || '—'}</div>;
      },
      align: 'left' as const
    },
    {
      header: 'Tipo',
      accessor: (l: any) => (
        <div style={{ display: 'flex' }}>
          <span style={{ padding: '3px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, background: l.tipo==='R'?'#10b98118':'#ef444418', color: l.tipo==='R'?'#10b981':'#ef4444' }}>
            {l.tipo==='R' ? '↑ RECEITA' : '↓ DESPESA'}
          </span>
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Natureza',
      accessor: (l: any) => {
        const nat = NATUREZAS_LCDPR.find(n => n.codigo === l.cod_natureza);
        return (
          <div style={{ fontSize: 12 }}>
            <span style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>{l.cod_natureza}</span>
            <span style={{ color: 'hsl(var(--text-muted))', marginLeft: 6, fontSize: 11 }}>{nat?.descricao.slice(0,28)}...</span>
          </div>
        );
      },
      align: 'left' as const
    },
    {
      header: 'Descrição',
      accessor: (l: any) => (
        <div style={{ fontSize: 13, maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'hsl(var(--text-main))' }}>
          {l.descricao || '—'}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Participante',
      accessor: (l: any) => (
        <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>
          {l.nome_participante || '—'}
        </div>
      ),
      align: 'left' as const
    },
    {
      header: 'Valor Líquido',
      accessor: (l: any) => (
        <div style={{ fontSize: 14, fontWeight: 800, color: l.tipo==='R'?'#10b981':'#ef4444', display: 'flex', justifyContent: 'flex-end' }}>
          {l.tipo==='R' ? '+' : '-'} {fmtBRL(Number(l.valor))}
        </div>
      ),
      align: 'right' as const
    }
  ];

  return (
    <div className="admin-page animate-slide-up">
      {/* Header */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Financeiro & Banco', href: '/financeiro' }, { label: 'LCDPR' }]} />

          <h1 className="page-title">Livro Caixa Digital do Produtor Rural</h1>
          <p className="page-subtitle">Escrituração fiscal da atividade rural · Geração do arquivo para entrega à Receita Federal</p>
        </div>
        <div className="page-actions" style={{ gap: 10 }}>
          <button className="glass-btn secondary sm" onClick={handleImportFinanceiro} disabled={generatingFile}>
            <RefreshCw size={15} /> Importar Financeiro
          </button>
          <button className="primary-btn" onClick={openNew}>
            <Plus size={16} /> Novo Lançamento
          </button>
        </div>
      </header>

      {/* KPI Cards */}
      <div className="next-gen-kpi-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Receitas', value: fmtBRL(kpis.receitas), color: '#10b981', Icon: ArrowUpRight, sub: `${lancamentos.filter(l=>l.tipo==='R').length} lançamentos`, sparkline: resumoMensal.map(m => ({ value: m.rec, label: m.mes })) },
          { label: 'Total Despesas', value: fmtBRL(kpis.despesas), color: '#ef4444', Icon: ArrowDownRight, sub: `${lancamentos.filter(l=>l.tipo==='D').length} lançamentos`, sparkline: resumoMensal.map(m => ({ value: m.desp, label: m.mes })) },
          { label: 'Resultado Líquido', value: fmtBRL(kpis.saldo), color: kpis.saldo >= 0 ? '#10b981' : '#ef4444', Icon: BarChart3, sub: kpis.saldo >= 0 ? 'Superávit' : 'Déficit', sparkline: resumoMensal.map(m => ({ value: m.rec - m.desp, label: m.mes })) },
          { label: 'Total Lançamentos', value: String(kpis.total), color: '#6366f1', Icon: FileText, sub: `Ano ${anoCalendario}`, sparkline: resumoMensal.map(m => ({ value: m.count, label: m.mes })) },
        ].map(({ label, value, color, Icon, sub, sparkline }) => (
          <TauzeStatCard 
            key={label}
            label={label}
            value={value}
            color={color}
            icon={Icon}
            periodLabel={sub}
            sparkline={sparkline}
          />
        ))}
      </div>

      {/* Tabs */}
      <div className="tauze-controls-row" style={{ marginBottom: 20 }}>
        <div className="tauze-tab-group">
          {([['lancamentos','Lançamentos (Q100)'],['resumo','Resumo Mensal (Q200)'],['gerar','Gerar Arquivo']] as const).map(([id,label]) => (
            <button key={id} className={`tauze-tab-item ${activeTab===id?'active':''}`} onClick={() => setActiveTab(id)}>{label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', marginLeft: activeTab !== 'lancamentos' ? 'auto' : 16 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--text-muted))', marginRight: 8, textTransform: 'uppercase' }}>Ano Base:</span>
          <select
            value={anoCalendario}
            onChange={e => setAnoCalendario(Number(e.target.value))}
            style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))', color: 'hsl(var(--text-main))', fontWeight: 700, fontSize: 13, outline: 'none' }}
          >
            {[ANO_ATUAL, ANO_ATUAL-1, ANO_ATUAL-2].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        {activeTab === 'lancamentos' && (
          <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
            {(['TODOS','R','D'] as const).map(t => (
              <button key={t}
                onClick={() => setFilterTipo(t)}
                style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${filterTipo===t ? (t==='R'?'#10b981':t==='D'?'#ef4444':'hsl(var(--brand))'):'hsl(var(--border))'}`, background: filterTipo===t ? (t==='R'?'#10b98115':t==='D'?'#ef444415':'hsl(var(--brand)/0.1)'):'transparent', color: filterTipo===t ? (t==='R'?'#10b981':t==='D'?'#ef4444':'hsl(var(--brand))'):'hsl(var(--text-muted))', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
              >{t === 'R' ? '📈 Receitas' : t === 'D' ? '📉 Despesas' : 'Todos'}</button>
            ))}
          </div>
        )}
      </div>

      {/* Tab: Lançamentos */}
      {activeTab === 'lancamentos' && (
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 20, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'hsl(var(--text-muted))' }}>Carregando lançamentos...</div>
          ) : filteredLancs.length === 0 ? (
            <EmptyState
              title={`Nenhum lançamento em ${anoCalendario}`}
              description="Use &quot;Importar Financeiro&quot; ou adicione manualmente"
              icon={BookOpen}
            />
          ) : (
            <ModernTable 
          emptyState={
            <EmptyState
              title="Nenhum registro encontrado"
              description="Sua busca não retornou resultados."
              icon={Search}
            />
          }
              data={filteredLancs}
              columns={columns}
              loading={loading}
              actions={(l) => (
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <button onClick={() => openEdit(l)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--brand))' }}><Edit3 size={14} /></button>
                  <button onClick={() => handleDelete(l.id)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #ef444430', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}><Trash2 size={14} /></button>
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* Tab: Resumo Mensal Q200 */}
      {activeTab === 'resumo' && (
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 20, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid hsl(var(--border))', background: 'hsl(var(--bg-main))' }}>
                {['Mês','Saldo Inicial','(+) Receitas','(-) Despesas','Resultado','Saldo Final','Lançamentos'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {resumoMensal.map((m, i) => {
                const resultado = m.rec - m.desp;
                return (
                  <tr key={m.mes} style={{ borderBottom: '1px solid hsl(var(--border))', background: i%2===0?'transparent':'hsl(var(--bg-main)/0.3)', opacity: m.count===0?0.4:1 }}>
                    <td style={{ padding: '12px 16px', fontWeight: 800, fontSize: 13 }}>{m.mes}/{anoCalendario}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'hsl(var(--text-muted))' }}>{fmtBRL(m.saldoInicio)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#10b981' }}>+ {fmtBRL(m.rec)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 700, color: '#ef4444' }}>- {fmtBRL(m.desp)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 800, color: resultado>=0?'#10b981':'#ef4444' }}>{resultado>=0?'+':''}{fmtBRL(resultado)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 800 }}>{fmtBRL(m.saldoFim)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'hsl(var(--text-muted))' }}>{m.count}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab: Gerar Arquivo */}
      {activeTab === 'gerar' && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Gerar Arquivo LCDPR</h2>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              O arquivo <strong>.txt</strong> gerado segue o leiaute oficial da Receita Federal (Blocos 0, Q e 9). Após o download, assine digitalmente com certificado <strong>ICP-Brasil</strong> e envie via programa ReceitaNet.
            </p>

            {/* Status da configuração */}
            {[
              { label: 'Empresa Matriz cadastrada', ok: !!unidadeMatriz },
              { label: 'CPF do produtor / sócio preenchido', ok: !!(unidadeMatriz?.socio_cpf || (unidadeMatriz?.cnpj||'').replace(/\D/g,'').length===11) },
              { label: 'Contador informado', ok: !!(unidadeMatriz?.contador_cpf && unidadeMatriz?.contador_nome) },
              { label: `Lançamentos em ${anoCalendario}`, ok: lancamentos.length > 0 },
              { label: 'Fazendas com NIRF', ok: fazendas.some(f => f.nirf) },
            ].map(({ label, ok }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid hsl(var(--border)/0.5)' }}>
                {ok
                  ? <CheckCircle size={18} color="#10b981" />
                  : <AlertCircle size={18} color="#f59e0b" />}
                <span style={{ fontSize: 13, fontWeight: 600, color: ok ? 'hsl(var(--text-main))' : '#f59e0b' }}>{label}</span>
                {!ok && <span style={{ marginLeft: 'auto', fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>PENDENTE</span>}
              </div>
            ))}

            <div style={{ marginTop: 28, display: 'flex', gap: 12 }}>
              <button
                className="primary-btn"
                style={{ flex: 1, justifyContent: 'center', fontSize: 15, padding: '14px 0' }}
                onClick={handleGerarArquivo}
                disabled={generatingFile || lancamentos.length === 0}
              >
                {generatingFile ? <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Download size={18} />}
                {generatingFile ? 'Gerando...' : `Baixar LCDPR_${anoCalendario}.txt`}
              </button>
            </div>
            <p style={{ marginTop: 12, fontSize: 11, color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
              ⚠️ O arquivo gerado não possui assinatura digital. Assine com certificado ICP-Brasil antes de enviar à Receita Federal.
            </p>
          </div>
        </div>
      )}

      {/* Modal Lançamento */}
      <SidePanel
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSave}
        title={editingItem ? 'Editar Lançamento' : 'Novo Lançamento Q100'}
        subtitle="Registro Q100 · Livro Caixa Digital"
        icon={BookOpen}
        size="medium"
        submitLabel={editingItem ? 'Salvar Alterações' : 'Adicionar Lançamento'}
        iconSubmit={CheckCircle}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Natureza (R/D) */}
          <div style={{ display: 'flex', gap: 12 }}>
            {(['R','D'] as const).map(t => (
              <button type="button" key={t} onClick={() => setForm(f => ({...f, tipo: t, cod_natureza: t==='R'?'01':'11'}))}
                style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: `2px solid ${form.tipo===t?(t==='R'?'#10b981':'#ef4444'):'hsl(var(--border))'}`, background: form.tipo===t?(t==='R'?'#10b98112':'#ef444412'):'transparent', fontWeight: 800, fontSize: 14, cursor: 'pointer', color: form.tipo===t?(t==='R'?'#10b981':'#ef4444'):'hsl(var(--text-muted))' }}>
                {t==='R' ? '↑ RECEITA' : '↓ DESPESA'}
              </button>
            ))}
          </div>

          {/* 1. Identificação */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8 }}>1. Identificação</h3>
            <div className="tauze-input-grid">
              <div className="form-group">
                <label>Data da Operação</label>
                <input type="date" required value={form.data_lancamento} onChange={e => setForm(f=>({...f,data_lancamento:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Fazenda Origem</label>
                <select value={form.fazenda_id} onChange={e => setForm(f=>({...f,fazenda_id:e.target.value}))}>
                  <option value="">Selecione...</option>
                  {fazendas.map(fz => <option key={fz.id} value={fz.id}>{fz.nome}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Conta Bancária (Cód. Q050) *Obrigatório</label>
                <select required value={form.cod_conta_bancaria} onChange={e => setForm(f=>({...f,cod_conta_bancaria:e.target.value}))}>
                  <option value="">Selecione a conta...</option>
                  <option value="999">999 — Numerário em Trânsito / Espécie</option>
                  {contas.map(c => <option key={c.id} value={c.id}>{c.nome_banco} — Ag {c.agencia} / CC {c.conta}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* 2. Natureza e Valores */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8 }}>2. Natureza e Valores</h3>
            <div className="tauze-input-grid">
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Código da Natureza da {form.tipo === 'R' ? 'Receita' : 'Despesa'}</label>
                <select required value={form.cod_natureza} onChange={e => setForm(f=>({...f,cod_natureza:e.target.value}))}>
                  {(form.tipo==='R' ? NATUREZAS_RECEITA : NATUREZAS_DESPESA).map(n => <option key={n.codigo} value={n.codigo}>{n.codigo} — {n.descricao}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Histórico (Descrição)</label>
                <input type="text" placeholder="Histórico resumido do lançamento..." value={form.descricao} onChange={e => setForm(f=>({...f,descricao:e.target.value}))} />
              </div>
              <div className="form-group" style={{ gridColumn: '1/-1' }}>
                <label>Valor Bruto (R$)</label>
                <input type="number" step="0.01" min="0" required placeholder="0,00" value={form.valor} onChange={e => setForm(f=>({...f,valor:e.target.value}))} />
              </div>
            </div>
          </div>

          {/* 3. Lastro Fiscal */}
          <div>
            <h3 style={{ fontSize: 11, fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12, borderBottom: '1px solid hsl(var(--border))', paddingBottom: 8 }}>3. Lastro Fiscal / Participante</h3>
            <div className="tauze-input-grid">
              <div className="form-group">
                <label>Tipo de Documento</label>
                <select required value={form.tipo_documento} onChange={e => setForm(f=>({...f,tipo_documento:e.target.value}))}>
                  <option value="1">1 - Nota Fiscal</option>
                  <option value="2">2 - Fatura</option>
                  <option value="3">3 - Recibo</option>
                  <option value="4">4 - Contrato</option>
                  <option value="5">5 - Folha de Pagamento</option>
                  <option value="6">6 - Outros</option>
                </select>
              </div>
              <div className="form-group">
                <label>Número do Documento</label>
                <input type="text" placeholder="Ex: 12345" value={form.num_documento} onChange={e => setForm(f=>({...f,num_documento:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>CPF/CNPJ do Participante</label>
                <input type="text" placeholder="Apenas números..." value={form.cpf_cnpj_participante} onChange={e => setForm(f=>({...f,cpf_cnpj_participante:e.target.value}))} />
              </div>
              <div className="form-group">
                <label>Nome do Participante</label>
                <input type="text" placeholder="Razão Social ou Nome Físico..." value={form.nome_participante} onChange={e => setForm(f=>({...f,nome_participante:e.target.value}))} />
              </div>
            </div>
          </div>
        </div>
      </SidePanel>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LCDPRPage;
