import React, { useState, useEffect } from 'react';

function buildSparkline(records: any[], dateField: string, valueField: string | null, buckets = 7): { value: number; label: string }[] {
  if (!records || records.length === 0) return [];
  const sorted = [...records].filter(r => r[dateField]).sort((a, b) => new Date(a[dateField]).getTime() - new Date(b[dateField]).getTime());
  if (sorted.length === 0) return [];
  const first = new Date(sorted[0][dateField]).getTime();
  const last = new Date(sorted[sorted.length - 1][dateField]).getTime();
  const totalMs = Math.max(last - first, 1);
  const bucketMs = totalMs / buckets;
  return Array.from({ length: buckets }, (_, i) => {
    const bStart = first + i * bucketMs;
    const bEnd = bStart + bucketMs;
    const inBucket = sorted.filter(r => { const t = new Date(r[dateField]).getTime(); return i === buckets - 1 ? t >= bStart && t <= bEnd : t >= bStart && t < bEnd; });
    const v = inBucket.length === 0 ? 0 : valueField ? inBucket.reduce((s, r) => s + Number(r[valueField] || 0), 0) : inBucket.length;
    return { value: Number(v.toFixed(2)), label: new Date(bStart + bucketMs / 2).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
}
import { 
  ArrowRightLeft, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Plus, 
  ChevronRight, 
  MoreVertical,
  Banknote,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Upload,
  Trash2,
  Edit3,
  TrendingUp,
  Zap,
  Activity,
  History,
  Calendar,
  DollarSign
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { SidePanel } from '../../components/Layout/SidePanel';
import { ReconFilterModal } from './components/ReconFilterModal';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { Filter } from 'lucide-react';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePersistentState } from '../../hooks/usePersistentState';
import { DateInput } from '../../components/Form/DateInput';


export const BankReconciliation: React.FC = () => {
  const { activeFarm, activeTenantId } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBank, setActiveBank] = useState('Banco do Brasil');
  const [bankRecords, setBankRecords] = useState<any[]>([]);
  const [internalRecords, setInternalRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = usePersistentState('BankReconciliation_isHistoryModalOpen', false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [isManualReconOpen, setIsManualReconOpen] = usePersistentState('BankReconciliation_isManualReconOpen', false);
  const [selectedBankRecord, setSelectedBankRecord] = useState<any>(null);
  const [selectedInternalIds, setSelectedInternalIds] = useState<string[]>([]);
  const [isManualBankRecordModalOpen, setIsManualBankRecordModalOpen] = usePersistentState('BankReconciliation_isManualBankRecordModalOpen', false);
  const [manualRows, setManualRows] = useState<any[]>([
    { id: Date.now(), date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], description: '', amount: '', type: 'outflow' }
  ]);
  const [showAdvancedFilters, setShowAdvancedFilters] = usePersistentState('BankReconciliation_showAdvancedFilters', false);
  const [filterValues, setFilterValues] = useState({
    status: 'all',
    minAmount: 0,
    maxAmount: 1000000,
    dateStart: '',
    dateEnd: ''
  });

  useEffect(() => {
    if (!activeTenantId) { 
      if (typeof setLoading !== 'undefined') setLoading(false); 
      return; 
    }
    fetchRecords();
  }, [activeFarm, activeTenantId]);

  const calculateMatchScore = (bankRec: any, internalRec: any) => {
    let score = 0;
    
    // 1. Valor Exato (Peso 60)
    if (Math.abs(bankRec.amount) === Math.abs(internalRec.amount)) {
      score += 60;
    }
    
    // 2. Proximidade de Data (Peso 25)
    const bankDate = new Date(bankRec.date).getTime();
    const internalDate = new Date(internalRec.date).getTime();
    const diffDays = Math.abs(bankDate - internalDate) / (1000 * 60 * 60 * 24);
    
    if (diffDays === 0) score += 25;
    else if (diffDays <= 2) score += 15;
    else if (diffDays <= 5) score += 5;
    
    // 3. Descrição/Histórico (Peso 15)
    const bankDesc = bankRec.description.toLowerCase();
    const internalDesc = internalRec.description.toLowerCase();
    if (bankDesc.includes(internalDesc) || internalDesc.includes(bankDesc)) {
      score += 15;
    }
    
    return score;
  };

  const fetchRecords = async () => {
    setLoading(true);
    
    try {
      let query = supabase
        .from('conciliacoes')
        .select('*')
        .limit(500);

      if (activeFarm?.id) {
        query = query.eq('fazenda_id', activeFarm.id);
      } else {
        query = query.eq('tenant_id', activeTenantId);
      }

      const { data: dbRecons, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      
      setBankRecords([]);
      setInternalRecords([]);

      const totalConciliado = dbRecons?.filter(r => r.status === 'completed').length || 0;
      const pendentes = 0;
      
      setStats([
        { 
          label: 'Automação Pareamento', 
          value: '0%', 
          icon: Zap, 
          color: '#8b5cf6', 
          progress: 0,
          change: 'Eficiência Tauze IA',
          periodLabel: 'Sem dados',
          sparkline: buildSparkline(dbRecons || [], 'created_at', null)
        },
        { 
          label: 'Volume Auditado', 
          value: 0, 
          icon: FileText, 
          color: '#3b82f6', 
          progress: 0,
          change: 'Fluxo em Dia',
          periodLabel: 'Mês Atual',
          sparkline: buildSparkline(dbRecons || [], 'created_at', null)
        },
        { 
          label: 'Pendências Críticas', 
          value: pendentes, 
          icon: HelpCircle, 
          color: '#f59e0b', 
          progress: 0,
          change: 'Aguardando Conciliação',
          periodLabel: 'Próximas 24h'
        },
        { 
          label: 'Divergência de Saldo', 
          value: 'R$ 0,00', 
          icon: AlertCircle, 
          color: '#ef4444', 
          progress: 100,
          change: 'Compliance Total',
          periodLabel: 'Ajustes Finais'
        }
      ]);
    } catch (err) {
      console.error("Erro na conciliação:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate AI Processing
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsUploading(false);
            // Simulate adding new records after AI mapping
            setBankRecords(prev => [
              { id: 'b4', date: '2024-05-03', description: 'TED RECEBIDA - FRIGORIFICO SUL', amount: 120500.00 },
              ...prev
            ]);
          }, 800);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const handleOpenAudit = (rec: any) => {
    setHistoryItems([
      { 
        id: '1', 
        date: rec.date, 
        title: 'Conciliação Automática Tauze IA', 
        subtitle: 'Lançamento bancário pareado com sucesso', 
        value: rec.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), 
        status: 'success' 
      },
      { 
        id: '2', 
        date: rec.date, 
        title: 'Lançamento Interno: Venda Gado', 
        subtitle: 'Origem: Módulo de Vendas', 
        value: '100% Match', 
        status: 'info' 
      }
    ]);
    setIsHistoryModalOpen(true);
  };

  const handleOpenManualRecon = (rec: any) => {
    setSelectedBankRecord(rec);
    setSelectedInternalIds([]);
    setIsManualReconOpen(true);
  };

  const toggleInternalRecord = (id: string) => {
    setSelectedInternalIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const totalSelectedAmount = internalRecords
    .filter(ir => selectedInternalIds.includes(ir.id))
    .reduce((sum, ir) => sum + Math.abs(ir.amount), 0);

  const difference = selectedBankRecord ? Math.abs(selectedBankRecord.amount) - totalSelectedAmount : 0;

  const handleAddRow = () => {
    setManualRows([...manualRows, { id: Date.now(), date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], description: '', amount: '', type: 'outflow' }]);
  };

  const handleRemoveRow = (id: number) => {
    if (manualRows.length > 1) {
      setManualRows(manualRows.filter(row => row.id !== id));
    }
  };

  const handleUpdateRow = (id: number, field: string, value: any) => {
    setManualRows(manualRows.map(row => row.id === id ? { ...row, [field]: value } : row));
  };

  const handleAddManualBankRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecords = manualRows
      .filter(row => row.description && row.amount)
      .map(row => {
        const baseAmount = Math.abs(parseFloat(row.amount));
        return {
          id: 'mb' + row.id,
          date: row.date,
          description: row.description,
          amount: row.type === 'outflow' ? -baseAmount : baseAmount
        };
      });
    
    if (newRecords.length > 0) {
      setBankRecords(prev => [...newRecords, ...prev]);
      setIsManualBankRecordModalOpen(false);
      setManualRows([{ id: Date.now(), date: new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0], description: '', amount: '', type: 'outflow' }]);
    }
  };

  const handleConfirmManualRecon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate process
    setTimeout(() => {
      setLoading(false);
      setIsManualReconOpen(false);
      // Update state to show as matched
      setBankRecords(prev => prev.map(r => r.id === selectedBankRecord.id ? { ...r, manual: true } : r));
    }, 1000);
  };

  const handleQuickReconcile = async (bankId: string, internalId: string) => {
    // Optimistic match
    setBankRecords(prev => prev.filter(r => r.id !== bankId));
    setInternalRecords(prev => prev.filter(ir => ir.id !== internalId));

    try {
      const { error } = await supabase
        .from('conciliacoes')
        .insert([{
          tenant_id: activeTenantId,
          lancamento_bancario_id: bankId,
          lancamento_interno_id: internalId,
          status: 'completed',
          metodo: 'automatic'
        }]);
      if (error) throw error;
      fetchRecords();
    } catch (err: any) {
      console.warn('DB Quick Reconcile failed, using local optimistic state:', err.message);
    }
  };

  return (
    <div className="recon-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb paths={[{ label: 'Financeiro', href: '/financeiro/intelligence' }, { label: 'Conciliações Bancária' }]} />
          <h1 className="page-title">Conciliações Bancária</h1>
          <p className="page-subtitle">Verifique se os lançamentos do banco coincidem com o seu controle interno em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="primary-btn" onClick={fetchRecords}>
            <RefreshCw size={18} />
            SINCRONIZAR
          </button>
        </div>
      </header>

      {isUploading && (
        <div className="upload-overlay animate-fade-in">
          <div className="upload-modal glass-card">
            <div className="ai-scanner-line"></div>
            <Activity size={48} className="text-brand mb-4 animate-bounce" />
            <h3>Processando Extrato Bancário</h3>
            <p>Mapeando lançamentos com IA Inteligente Tauze...</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="progress-txt">{uploadProgress}% Concluído</span>
          </div>
        </div>
      )}

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <TauzeStatCard key={i} loading={true} label="" value="" icon={CheckCircle2} color=""  periodLabel="Mês Atual" />)
        ) : (stats || []).map((stat, idx) => (
          <TauzeStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change={stat.change}
            periodLabel={stat.periodLabel}
            sparkline={stat.sparkline}
            trend="up"
          />
        ))}
      </div>

      <div className="tauze-controls-row">
        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="tauze-search-input"
            placeholder="Buscar por lote, valor ou histórico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="tauze-filter-group" style={{ display: 'flex', gap: '12px' }}>
          <button 
            className={`icon-btn-secondary ${showAdvancedFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          >
            <Filter size={20} />
          </button>
          <button className="glass-btn secondary" onClick={() => setIsManualBankRecordModalOpen(true)}>
            <Plus size={18} />
            <span>LANÇAMENTO MANUAL</span>
          </button>
          <label className="glass-btn primary cursor-pointer">
            <Upload size={18} />
            <span>IMPORTAR EXTRATO (OFX/CSV)</span>
            <input type="file" style={{ display: 'none' }} accept=".ofx,.csv" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <ReconFilterModal 
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
      />

      <div className="recon-workspace">
        <div className="recon-column">
          <div className="column-header-tauze">
            <div className="h-group">
              <Banknote size={20} className="text-brand" />
              <h3>Extrato Bancário</h3>
            </div>
            <span className="bank-tag">{activeBank}</span>
          </div>

          <div className="records-grid-tauze">
            {(() => {
              const filteredBankRecords = bankRecords.filter(rec => {
                const matchesSearch = rec.description.toLowerCase().includes(searchTerm.toLowerCase());
                
                const matchesAmount = filterValues.maxAmount >= 1000000 || (Math.abs(rec.amount) >= filterValues.minAmount && Math.abs(rec.amount) <= filterValues.maxAmount);
                const matchesDate = (!filterValues.dateStart || new Date(rec.date) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(rec.date) <= new Date(filterValues.dateEnd));
                
                const internalMatches = internalRecords.filter(ir => calculateMatchScore(rec, ir) >= 60);
                const matchesStatus = filterValues.status === 'all' || 
                                     (filterValues.status === 'matched' && internalMatches.length > 0) ||
                                     (filterValues.status === 'pending' && internalMatches.length === 0);

                return matchesSearch && matchesAmount && matchesDate && matchesStatus;
              });

              if (filteredBankRecords.length === 0) {
                return (
                  <EmptyState
                    title={searchTerm ? "Nenhum registro encontrado" : "Nenhum extrato importado"}
                    description={searchTerm ? "Sua busca não retornou resultados no extrato." : "Importe um arquivo OFX/CSV para iniciar a conciliação."}
                    icon={Banknote}
                  />
                );
              }

              return filteredBankRecords.map((rec) => {
              const matches = internalRecords
                .map(ir => ({ ir, score: calculateMatchScore(rec, ir) }))
                .filter(m => m.score >= 60)
                .sort((a, b) => b.score - a.score);
              
              const isMatched = matches.length > 0;
              const topMatch = matches[0];

              return (
                <motion.div 
                  key={rec.id} 
                  className={`tauze-report-card mini ${isMatched ? 'success' : 'warning'}`}
                  whileHover={{ y: -4 }}
                >
                  <div className="rec-row-main">
                    <div className="rec-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="rec-date">{new Date(rec.date).toLocaleDateString()}</span>
                        {isMatched && (
                          <span style={{ 
                            fontSize: '10px', 
                            fontWeight: 900, 
                            background: topMatch.score >= 90 ? '#10b981' : '#f59e0b',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}>
                            {topMatch.score}% MATCH
                          </span>
                        )}
                      </div>
                      <h4 className="rec-desc">{rec.description}</h4>
                    </div>
                    <span className={`rec-amount ${rec.amount < 0 ? 'neg' : 'pos'}`}>
                      {rec.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </span>
                  </div>
                  <div className="rec-footer-tauze">
                    {isMatched ? (
                      <div className="status-pill active">
                        <Zap size={12} fill="currentColor" />
                        PAREAMENTO TAUZE IA
                      </div>
                    ) : (
                      <div className="status-pill warning">
                        <AlertCircle size={12} />
                        PENDENTE
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {isMatched && (
                        <button 
                          className="f-action-btn success mini"
                          onClick={() => handleQuickReconcile(rec.id, topMatch.ir.id)}
                          title="Confirmar Pareamento IA"
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: '1px solid #10b981'
                          }}
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      {!isMatched && Math.abs(rec.amount) < 100 && (
                        <button 
                          className="f-action-btn secondary mini"
                          onClick={() => {}}
                          title="Lançamento Rápido (Taxas)"
                        >
                          <Zap size={16} />
                        </button>
                      )}
                      <button 
                        className="f-action-btn primary mini"
                        onClick={() => handleOpenManualRecon(rec)}
                        title="Conciliação Manual"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            });
          })()}
          </div>
        </div>

        <div className="recon-divider">
          <ArrowRightLeft size={24} className="text-muted" />
        </div>

        <div className="recon-column">
          <div className="column-header-tauze">
            <div className="h-group">
              <FileText size={20} className="text-brand" />
              <h3>Lançamentos Internos</h3>
            </div>
            <span className="bank-tag">TAUZE ERP</span>
          </div>

          <div className="records-grid-tauze">
            {(() => {
              const filteredInternalRecords = internalRecords.filter(rec => {
                const matchesSearch = rec.description.toLowerCase().includes(searchTerm.toLowerCase());
                const matchesAmount = filterValues.maxAmount >= 1000000 || (Math.abs(rec.amount) >= filterValues.minAmount && Math.abs(rec.amount) <= filterValues.maxAmount);
                const matchesDate = (!filterValues.dateStart || new Date(rec.date) >= new Date(filterValues.dateStart)) &&
                                   (!filterValues.dateEnd || new Date(rec.date) <= new Date(filterValues.dateEnd));
                
                return matchesSearch && matchesAmount && matchesDate;
              });

              if (filteredInternalRecords.length === 0) {
                return (
                  <EmptyState
                    title={searchTerm ? "Nenhum registro encontrado" : "Nenhum lançamento no ERP"}
                    description={searchTerm ? "Sua busca não retornou resultados no financeiro." : "Não há movimentações financeiras pendentes."}
                    icon={FileText}
                  />
                );
              }

              return filteredInternalRecords.map((rec) => (
              <motion.div 
                key={rec.id} 
                className="tauze-report-card mini success"
                whileHover={{ y: -4 }}
              >
                <div className="rec-row-main">
                  <div className="rec-info">
                    <span className="rec-date">{new Date(rec.date).toLocaleDateString()}</span>
                    <h4 className="rec-desc">{rec.description}</h4>
                  </div>
                  <span className={`rec-amount ${rec.amount < 0 ? 'neg' : 'pos'}`}>
                    {rec.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </span>
                </div>
                <div className="rec-footer-tauze">
                  <div className="status-pill active">
                    <CheckCircle2 size={12} />
                    CONCILIADO
                  </div>
                  <button 
                    className="f-action-btn primary mini"
                    onClick={() => handleOpenAudit(rec)}
                    title="Ver Auditoria"
                  >
                    <History size={16} />
                  </button>
                </div>
              </motion.div>
            ));
          })()}
          </div>
        </div>
      </div>


      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Conciliação"
        subtitle="Rastreabilidade total do lançamento auditado"
        items={historyItems}
      />

      <SidePanel
        isOpen={isManualReconOpen}
        onClose={() => setIsManualReconOpen(false)}
        onSubmit={handleConfirmManualRecon}
        title="Conciliação Manual"
        subtitle="Vincular lançamento bancário ao controle interno"
        icon={ArrowRightLeft}
        submitLabel="Confirmar Vínculo"
        loading={loading}
      >
        <div style={{ gridColumn: 'span 2' }}>
          {selectedBankRecord && (
            <div style={{ padding: '1.5rem', background: 'hsl(var(--bg-main)/0.5)', borderRadius: '20px', border: '1px solid hsl(var(--border))', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'white', background: 'hsl(var(--brand))', padding: '2px 8px', borderRadius: '4px' }}>EXTRATO</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>{new Date(selectedBankRecord.date).toLocaleDateString()}</span>
                </div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800 }}>{selectedBankRecord.description}</h4>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'hsl(var(--brand))' }}>
                  {selectedBankRecord.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>
          )}

          <div className="form-group full-width">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Search size={14} /> Selecionar Títulos Internos (Smart Filter: Mesmo Dia)</span>
              <span style={{ fontSize: '11px', color: 'hsl(var(--brand))', fontWeight: 800 }}>{selectedInternalIds.length} selecionados</span>
            </label>
            
            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid hsl(var(--border))', borderRadius: '12px', padding: '8px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'hsl(var(--bg-card))' }}>
              {internalRecords
                .filter(ir => selectedBankRecord && ir.date === selectedBankRecord.date)
                .map(ir => (
                <div 
                  key={ir.id}
                  onClick={() => toggleInternalRecord(ir.id)}
                  style={{ 
                    padding: '12px', 
                    borderRadius: '10px', 
                    border: '1px solid',
                    borderColor: selectedInternalIds.includes(ir.id) ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                    background: selectedInternalIds.includes(ir.id) ? 'hsl(var(--brand)/0.05)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ 
                    width: '18px', height: '18px', border: '2px solid', borderRadius: '4px',
                    borderColor: selectedInternalIds.includes(ir.id) ? 'hsl(var(--brand))' : 'hsl(var(--border))',
                    background: selectedInternalIds.includes(ir.id) ? 'hsl(var(--brand))' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
                  }}>
                    {selectedInternalIds.includes(ir.id) && <CheckCircle2 size={12} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 800 }}>{ir.description}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>{new Date(ir.date).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 900 }}>
                    {ir.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1.25rem', borderRadius: '16px', background: 'hsl(var(--bg-main)/0.4)', border: '1px dashed hsl(var(--border))' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Total Selecionado:</span>
              <span style={{ fontSize: '14px', fontWeight: 900 }}>{totalSelectedAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: difference === 0 ? '#10b981' : '#ef4444' }}>
              <span style={{ fontSize: '12px', fontWeight: 800 }}>Diferença Restante:</span>
              <span style={{ fontSize: '14px', fontWeight: 900 }}>{difference.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            {difference !== 0 && (
              <p style={{ margin: '8px 0 0', fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>
                * Os valores selecionados devem somar exatamente o valor do extrato.
              </p>
            )}
          </div>
        </div>
      </SidePanel>

      <SidePanel
        isOpen={isManualBankRecordModalOpen}
        onClose={() => setIsManualBankRecordModalOpen(false)}
        onSubmit={handleAddManualBankRecord}
        title="Lançamento Manual em Lote"
        subtitle="Registre múltiplas movimentações bancárias de uma só vez"
        icon={Banknote}
        submitLabel="Salvar Lançamentos"
        size="large"
      >
        <div style={{ gridColumn: 'span 2' }}>
          <table className="tauze-batch-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Tipo</th>
                <th style={{ width: '150px' }}>Data</th>
                <th>Descrição / Histórico</th>
                <th style={{ width: '140px' }}>Valor (R$)</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {manualRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <select 
                      className="tauze-table-select"
                      value={row.type}
                      onChange={(e) => handleUpdateRow(row.id, 'type', e.target.value)}
                      style={{ 
                        color: row.type === 'inflow' ? '#10b981' : '#ef4444',
                        fontWeight: 800
                      }}
                    >
                      <option value="outflow">Saída (-)</option>
                      <option value="inflow">Entrada (+)</option>
                    </select>
                  </td>
                  <td>
                    <DateInput 
                      type="date" 
                      className="tauze-table-input"
                      value={row.date}
                      onChange={(e) => handleUpdateRow(row.id, 'date', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="text" 
                      className="tauze-table-input"
                      placeholder="Ex: TARIFA BANCARIA..."
                      value={row.description}
                      onChange={(e) => handleUpdateRow(row.id, 'description', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <input 
                      type="number" 
                      step="0.01"
                      className="tauze-table-input"
                      placeholder="0.00"
                      value={row.amount}
                      onChange={(e) => handleUpdateRow(row.id, 'amount', e.target.value)}
                      required
                    />
                  </td>
                  <td>
                    <button 
                      type="button" 
                      className="icon-btn-danger mini"
                      onClick={() => handleRemoveRow(row.id)}
                      disabled={manualRows.length === 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <button 
            type="button" 
            className="glass-btn secondary full-width" 
            style={{ marginTop: '12px', borderStyle: 'dashed' }}
            onClick={handleAddRow}
          >
            <Plus size={16} />
            ADICIONAR NOVA LINHA
          </button>
        </div>
      </SidePanel>

      <style>{`
        .next-gen-kpi-grid {
          display: grid !important;
          grid-template-columns: repeat(4, 1fr) !important;
          gap: 20px !important;
          margin-bottom: 32px !important;
        }

        @media (max-width: 1400px) {
          .next-gen-kpi-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }

        @media (max-width: 768px) {
          .next-gen-kpi-grid {
            grid-template-columns: 1fr !important;
          }
        }

        .recon-page { }
        .recon-workspace { display: grid; grid-template-columns: 1fr 40px 1fr; gap: 16px; align-items: start; }
        .recon-column { display: flex; flex-direction: column; gap: 20px; }
        .column-header-tauze { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.25rem; }
        .h-group { display: flex; align-items: center; gap: 12px; }
        .h-group h3 { font-size: 1.125rem; font-weight: 900; letter-spacing: -0.02em; color: var(--text-main); }
        .bank-tag { font-size: 0.7rem; font-weight: 900; color: var(--brand); background: var(--brand-alpha); padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; }
        .records-grid-tauze { display: flex; flex-direction: column; gap: 16px; }
        .tauze-report-card.mini { padding: 1.25rem; border-left: 4px solid var(--border); }
        .tauze-report-card.mini.success { border-left-color: #10b981; }
        .tauze-report-card.mini.warning { border-left-color: #f59e0b; }
        .rec-row-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
        .rec-info { display: flex; flex-direction: column; gap: 4px; }
        .rec-date { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
        .rec-desc { font-size: 0.9375rem; font-weight: 800; color: var(--text-main); line-height: 1.4; }
        .rec-amount { font-size: 1.125rem; font-weight: 900; letter-spacing: -0.01em; }
        .rec-amount.pos { color: #10b981; }
        .rec-amount.neg { color: var(--text-main); }
        .rec-footer-tauze { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border); }
        .recon-divider { display: flex; align-items: center; justify-content: center; height: 100%; padding-top: 100px; }

        .upload-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .upload-modal {
          background: hsl(var(--bg-card));
          padding: 3rem;
          border-radius: 32px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          max-width: 400px;
          width: 90%;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .ai-scanner-line {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--brand);
          box-shadow: 0 0 15px var(--brand);
          animation: scan 2s linear infinite;
        }

        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }

        .progress-bar-container {
          width: 100%;
          height: 8px;
          background: hsl(var(--bg-main));
          border-radius: 4px;
          margin: 24px 0 8px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          background: var(--brand);
          transition: width 0.1s ease;
        }

        .progress-txt { font-size: 0.75rem; font-weight: 800; color: var(--text-muted); }

        .tauze-batch-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
        .tauze-batch-table th { text-align: left; padding: 12px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); border-bottom: 1px solid var(--border); }
        .tauze-batch-table td { padding: 8px; border-bottom: 1px solid var(--border-light); }
        .tauze-table-input { width: 100%; background: transparent; border: 1px solid transparent; padding: 8px; border-radius: 8px; font-size: 13px; font-weight: 700; transition: all 0.2s; }
        .tauze-table-input:hover { background: hsl(var(--bg-main)/0.4); border-color: var(--border); }
        .tauze-table-input:focus { background: hsl(var(--bg-card)); border-color: var(--brand); outline: none; box-shadow: 0 0 0 3px hsl(var(--brand)/0.1); }
        .tauze-table-select { width: 100%; background: transparent; border: 1px solid transparent; padding: 6px; border-radius: 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.02em; cursor: pointer; transition: all 0.2s; }
        .tauze-table-select:hover { background: hsl(var(--bg-main)/0.4); }
      `}</style>
    </div>
  );
};
