import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity,
  Plus, 
  Search, 
  Filter,
  FileText,
  Building2,
  Calendar,
  DollarSign,
  MoreVertical,
  CheckCircle2,
  Barcode,
  ArrowDownLeft,
  Trash2,
  Edit3,
  History,
  Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { EntryInvoiceForm } from '../../components/Forms/EntryInvoiceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';

export const EntryInvoice: React.FC = () => {
  const { activeFarm } = useTenant();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'FISCAL'>('INVOICES');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [stats, setStats] = useState<any[]>([]);

  useEffect(() => {
    if (!activeFarm) return;
    fetchInvoices();
  }, [activeFarm]);

  const fetchInvoices = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notas_entrada')
      .select('*, fornecedores(nome)')
      .eq('fazenda_id', activeFarm.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setInvoices(data);
      const totalValor = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
      
      setStats([
        { label: 'Notas Processadas', value: data.length, icon: FileText, color: '#10b981', progress: 100 },
        { label: 'Entradas (Mês)', value: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#3b82f6', progress: 85, trend: 'up' },
        { label: 'Conferência Física', value: '100%', icon: CheckCircle2, color: '#166534', progress: 100 },
        { label: 'Ajuste de Custo', value: '+1.2%', icon: Barcode, color: '#f59e0b', progress: 15, trend: 'up' },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
    const payload = {
      numero_nota: data.invoice_number,
      serie: data.series,
      fornecedor_id: data.supplier_id,
      data_emissao: data.issue_date,
      data_entrada: data.entry_date,
      valor_total: parseFloat(data.total_value),
      chave_xml: data.xml_key,
      observacoes: data.description
    };

    if (selectedInvoice) {
      const { error } = await supabase.from('notas_entrada').update(payload).eq('id', selectedInvoice.id);
      if (!error) { setIsModalOpen(false); fetchInvoices(); }
    } else {
      const { error } = await supabase.from('notas_entrada').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchInvoices(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta nota fiscal?')) return;
    const { error } = await supabase.from('notas_entrada').delete().eq('id', id);
    if (!error) fetchInvoices();
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: inv.data_emissao, title: 'Nota Fiscal: ' + inv.numero_nota, subtitle: 'Série: ' + inv.serie, value: Number(inv.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: 'success' },
      { id: '2', date: inv.data_entrada, title: 'Entrada no Estoque', subtitle: 'Mercadoria conferida e lote gerado', value: 'CONCLUÍDO', status: 'success' },
      { id: '3', date: inv.created_at, title: 'Chave de Acesso', subtitle: inv.chave_xml || 'Não informada', value: 'XML', status: 'info' },
    ]);
  };

  const tableColumns = [
    {
      header: 'Nota / Série',
      accessor: (item: any) => (
        <div className="table-cell-title">
          <span className="main-text">NF {item.numero_nota}</span>
          <div className="sub-meta uppercase font-bold text-[10px] tracking-wider">
            Série {item.serie}
          </div>
        </div>
      )
    },
    {
      header: 'Fornecedor',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Building2 size={14} />
          <span>{item.fornecedores?.nome || 'FORNECEDOR N/A'}</span>
        </div>
      )
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <span className="main-text font-bold" style={{ color: 'hsl(var(--brand))' }}>
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      ),
      align: 'right' as const
    },
    {
      header: 'Data Entrada',
      accessor: (item: any) => (
        <span className="sub-meta font-bold">
          {item.data_entrada ? new Date(item.data_entrada).toLocaleDateString() : 'N/A'}
        </span>
      )
    }
  ];

  return (
    <div className="entry-invoice-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ArrowDownLeft size={14} fill="currentColor" />
            <span>ELITE PROCUREMENT v5.0</span>
          </div>
          <h1 className="page-title">Notas Fiscais de Entrada</h1>
          <p className="page-subtitle">Recebimento de mercadorias, conferência física/fiscal e alimentação automática do estoque em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" onClick={() => navigate('/compras/nota-entrada')}>
            <Activity size={18} />
            DIVERGÊNCIAS
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            LANÇAR NOTA
          </button>
        </div>
      </header>

      <div className="next-gen-kpi-grid">
        {loading ? (
          Array(4).fill(0).map((_, i) => <EliteStatCard key={i} loading={true} label="" value="" icon={FileText} color="" />)
        ) : stats.map((stat, idx) => (
          <EliteStatCard 
            key={idx}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            progress={stat.progress}
            change="+1.5%"
            trend={stat.trend}
          />
        ))}
      </div>

      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className={`elite-tab-item ${activeTab === 'INVOICES' ? 'active' : ''}`}
            onClick={() => setActiveTab('INVOICES')}
          >
            Notas de Entrada
          </button>
          <button 
            className={`elite-tab-item ${activeTab === 'FISCAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('FISCAL')}
          >
            Processamento Fiscal
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Filtrar por número da nota ou fornecedor..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar Log">
            <FileText size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={invoices.filter(inv => {
            const matchesSearch = inv.numero_nota.toLowerCase().includes(searchTerm.toLowerCase()) || (inv.fornecedores?.nome || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTab = activeTab === 'INVOICES' ? true : inv.status === 'fiscal';
            return matchesSearch && matchesTab;
          })}
          columns={tableColumns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Dossiê">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <EntryInvoiceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedInvoice}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê de Entrada"
        subtitle="Rastreabilidade completa do documento e conferência de almoxarifado"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
