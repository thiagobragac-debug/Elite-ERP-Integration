import React, { useState, useEffect } from 'react';
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
  History
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { ReconciliationForm } from '../../components/Forms/ReconciliationForm';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';

export const BankReconciliation: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeBank, setActiveBank] = useState('Banco do Brasil');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bankRecords, setBankRecords] = useState<any[]>([]);
  const [internalRecords, setInternalRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReconciliation, setSelectedReconciliation] = useState<any>(null);
  const [stats, setStats] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (!activeFarm) return;
    fetchRecords();
  }, [activeFarm]);

  const fetchRecords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('conciliacoes')
      .select('*')
      .eq('fazenda_id', activeFarm.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      const concluidas = data.filter(r => r.status === 'completed').length;
      const pendentes = data.filter(r => r.status === 'pending').length;
      
      setStats([
        { 
          label: 'Registros Pendentes', 
          value: pendentes, 
          icon: HelpCircle, 
          color: '#f59e0b', 
          progress: 40,
          change: `${pendentes} aguardando`,
          periodLabel: 'Fila de Trabalho',
          sparkline: [
            { value: 20, label: '2' }, { value: 30, label: '3' }, { value: 25, label: '2' }, 
            { value: 50, label: '5' }, { value: 40, label: '4' }, { value: 45, label: '4' }, 
            { value: 35, label: '3' }, { value: 30, label: pendentes.toString() }
          ]
        },
        { 
          label: 'Fluxo Conciliado', 
          value: concluidas, 
          icon: CheckCircle2, 
          color: '#10b981', 
          progress: 100,
          change: 'Conformidade 100%',
          periodLabel: 'Ciclo Mensal',
          sparkline: [
            { value: 60, label: '12' }, { value: 65, label: '13' }, { value: 70, label: '14' }, 
            { value: 80, label: '16' }, { value: 85, label: '17' }, { value: 90, label: '18' }, 
            { value: 95, label: '19' }, { value: 100, label: concluidas.toString() }
          ]
        },
        { 
          label: 'Volume Auditado', 
          value: data.length, 
          icon: FileText, 
          color: '#3b82f6', 
          progress: 85,
          change: 'Histórico 30d',
          periodLabel: 'Movimentação Geral',
          sparkline: [
            { value: 40, label: '40' }, { value: 45, label: '45' }, { value: 50, label: '50' }, 
            { value: 60, label: '60' }, { value: 55, label: '55' }, { value: 70, label: '70' }, 
            { value: 80, label: '80' }, { value: 85, label: data.length.toString() }
          ]
        },
        { 
          label: 'Divergência Saldo', 
          value: 'R$ 0,00', 
          icon: AlertCircle, 
          color: '#ef4444', 
          progress: 100,
          change: 'Diferença Zero',
          periodLabel: 'Ajustes Finais',
          sparkline: [
            { value: 10, label: 'R$ 50' }, { value: 5, label: 'R$ 10' }, { value: 15, label: 'R$ 80' }, 
            { value: 0, label: 'R$ 0' }, { value: 8, label: 'R$ 40' }, { value: 5, label: 'R$ 20' }, 
            { value: 2, label: 'R$ 5' }, { value: 0, label: 'R$ 0' }
          ]
        },
      ]);
    }

    // Mock records for demonstration
    setBankRecords([
      { id: 'b1', date: '2024-05-02', description: 'PIX RECEBIDO - JBS S.A.', amount: 350000.00 },
      { id: 'b2', date: '2024-05-01', description: 'PAGTO BOLETO - FERT SUL', amount: -45200.00 },
      { id: 'b3', date: '2024-04-30', description: 'TARIFA BANCARIA CESTA', amount: -45.00 },
    ]);
    setInternalRecords([
      { id: 'i1', date: '2024-05-02', description: 'Venda Gado Lote A1', amount: 350000.00 },
      { id: 'i2', date: '2024-05-01', description: 'Compra NPK 04-14', amount: -45200.00 },
    ]);
    setLoading(false);
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

  const handleOpenCreate = () => {
    setSelectedReconciliation(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (formData: any) => {
    if (!activeFarm) return;
    
    const payload = {
      conta_id: formData.account_id,
      periodo: formData.period,
      saldo_inicial: parseFloat(formData.initial_balance),
      saldo_final: parseFloat(formData.final_balance),
      status: 'pending',
      data_importacao: new Date().toISOString(),
      fazenda_id: activeFarm.id,
      tenant_id: activeFarm.tenantId
    };

    if (selectedReconciliation) {
      const { error } = await supabase.from('conciliacoes').update(payload).eq('id', selectedReconciliation.id);
      if (!error) { setIsModalOpen(false); fetchRecords(); }
    } else {
      const { error } = await supabase.from('conciliacoes').insert([payload]);
      if (!error) { setIsModalOpen(false); fetchRecords(); }
    }
  };

  return (
    <div className="recon-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <RefreshCw size={14} fill="currentColor" />
            <span>ELITE RECON v5.0</span>
          </div>
          <h1 className="page-title">Conciliação Bancária</h1>
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
            <p>Mapeando lançamentos com IA Inteligente Elite...</p>
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <span className="progress-txt">{uploadProgress}% Concluído</span>
          </div>
        </div>
      )}

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={CheckCircle2} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
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

      <div className="elite-controls-row">
        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Buscar por lote, valor ou histórico..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="elite-filter-group">
          <label className="glass-btn primary cursor-pointer">
            <Upload size={18} />
            <span>IMPORTAR EXTRATO (OFX/CSV)</span>
            <input type="file" className="hidden" accept=".ofx,.csv" onChange={handleFileUpload} />
          </label>
        </div>
      </div>

      <div className="recon-workspace">
        <div className="recon-column">
          <div className="column-header-elite">
            <div className="h-group">
              <Banknote size={20} className="text-brand" />
              <h3>Extrato Bancário</h3>
            </div>
            <span className="bank-tag">{activeBank}</span>
          </div>

          <div className="records-grid-elite">
            {bankRecords.map((rec) => {
              const isMatched = internalRecords.some(ir => Math.abs(ir.amount) === Math.abs(rec.amount));
              return (
                <motion.div 
                  key={rec.id} 
                  className={`elite-report-card mini ${isMatched ? 'success' : 'warning'}`}
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
                  <div className="rec-footer-elite">
                    {isMatched ? (
                      <div className="status-pill active">
                        <CheckCircle2 size={12} />
                        SUGESTÃO ENCONTRADA
                      </div>
                    ) : (
                      <div className="status-pill warning">
                        <AlertCircle size={12} />
                        PENDENTE
                      </div>
                    )}
                    <button className="f-action-btn primary mini">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <div className="recon-divider">
          <ArrowRightLeft size={24} className="text-muted" />
        </div>

        <div className="recon-column">
          <div className="column-header-elite">
            <div className="h-group">
              <FileText size={20} className="text-brand" />
              <h3>Lançamentos Internos</h3>
            </div>
            <span className="bank-tag">ELITE ERP</span>
          </div>

          <div className="records-grid-elite">
            {internalRecords.map((rec) => (
              <motion.div 
                key={rec.id} 
                className="elite-report-card mini success"
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
                <div className="rec-footer-elite">
                  <div className="status-pill active">
                    <CheckCircle2 size={12} />
                    CONCILIADO
                  </div>
                  <button className="f-action-btn primary mini">
                    <History size={16} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <ReconciliationForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedReconciliation}
      />

      <style>{`
        .recon-page { display: flex; flex-direction: column; gap: 16px; }
        .recon-workspace { display: grid; grid-template-columns: 1fr 40px 1fr; gap: 16px; align-items: start; }
        .recon-column { display: flex; flex-direction: column; gap: 20px; }
        .column-header-elite { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0.25rem; }
        .h-group { display: flex; align-items: center; gap: 12px; }
        .h-group h3 { font-size: 1.125rem; font-weight: 900; letter-spacing: -0.02em; color: var(--text-main); }
        .bank-tag { font-size: 0.7rem; font-weight: 900; color: var(--brand); background: var(--brand-alpha); padding: 4px 10px; border-radius: 6px; letter-spacing: 0.05em; }
        .records-grid-elite { display: flex; flex-direction: column; gap: 16px; }
        .elite-report-card.mini { padding: 1.25rem; border-left: 4px solid var(--border); }
        .elite-report-card.mini.success { border-left-color: #10b981; }
        .elite-report-card.mini.warning { border-left-color: #f59e0b; }
        .rec-row-main { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.25rem; }
        .rec-info { display: flex; flex-direction: column; gap: 4px; }
        .rec-date { font-size: 0.75rem; font-weight: 700; color: var(--text-muted); }
        .rec-desc { font-size: 0.9375rem; font-weight: 800; color: var(--text-main); line-height: 1.4; }
        .rec-amount { font-size: 1.125rem; font-weight: 900; letter-spacing: -0.01em; }
        .rec-amount.pos { color: #10b981; }
        .rec-amount.neg { color: var(--text-main); }
        .rec-footer-elite { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid var(--border); }
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
          background: white;
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
          background: #f1f5f9;
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
      `}</style>
    </div>
  );
};
