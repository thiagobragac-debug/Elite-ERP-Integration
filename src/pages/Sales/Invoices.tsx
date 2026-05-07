import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Search, 
  Download, 
  Printer, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock,
  Building2,
  Calendar,
  DollarSign,
  ChevronRight,
  MoreVertical,
  ShieldCheck,
  Trash2,
  Edit3,
  History,
  Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { OutputInvoiceForm } from '../../components/Forms/OutputInvoiceForm';
import { HistoryModal } from '../../components/Modals/HistoryModal';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { EliteStatCard } from '../../components/Cards/EliteStatCard';

export const Invoices: React.FC = () => {
  const { activeFarm } = useTenant();
  const [searchTerm, setSearchTerm] = useState('');
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      .from('notas_saida')
      .select('*, clientes(nome)')
      .eq('fazenda_id', activeFarm.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      setInvoices(data);
      const totalValor = data.reduce((acc, curr) => acc + Number(curr.valor_total || 0), 0);
      const autorizadas = data.filter(i => i.status === 'authorized').length;
      const pendentes = data.filter(i => i.status === 'pending').length;
      
      setStats([
        { label: 'Documentos Emitidos', value: data.length, icon: FileText, color: '#10b981', progress: 100 },
        { label: 'Faturamento Bruto', value: totalValor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), icon: DollarSign, color: '#3b82f6', progress: 85, trend: 'up' },
        { label: 'Notas Autorizadas', value: autorizadas, icon: CheckCircle2, color: '#166534', progress: (autorizadas / (data.length || 1)) * 100 },
        { label: 'Transmissão Pendente', value: pendentes, icon: Clock, color: '#ed6c02', progress: (pendentes / (data.length || 1)) * 100, trend: 'up' },
      ]);
    }
    setLoading(false);
  };

  const handleOpenCreate = () => {
    setSelectedInvoice(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inv: any) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const handleSubmit = async (data: any) => {
    if (!activeFarm) return;
    const payload = {
      numero_nota: data.invoice_number,
      serie: data.series,
      cliente_id: data.client_id,
      natureza_operacao: data.nature_of_operation,
      data_emissao: data.date,
      valor_total: parseFloat(data.total_value),
      transportadora: data.transport_company,
      observacoes: data.description,
      status: selectedInvoice?.status || 'authorized'
    };

    if (selectedInvoice) {
      const { error } = await supabase.from('notas_saida').update(payload).eq('id', selectedInvoice.id);
      if (!error) { setIsModalOpen(false); fetchInvoices(); }
    } else {
      const { error } = await supabase.from('notas_saida').insert([{ ...payload, fazenda_id: activeFarm.id, tenant_id: activeFarm.tenantId }]);
      if (!error) { setIsModalOpen(false); fetchInvoices(); }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir esta nota fiscal?')) return;
    const { error } = await supabase.from('notas_saida').delete().eq('id', id);
    if (!error) fetchInvoices();
  };

  const handleViewDetails = (inv: any) => {
    setIsHistoryModalOpen(true);
    setHistoryItems([
      { id: '1', date: inv.data_emissao, title: 'Nota Fiscal: ' + inv.numero_nota, subtitle: 'Cliente: ' + (inv.clientes?.nome || 'N/A'), value: Number(inv.valor_total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }), status: inv.status === 'CONCLUIDA' ? 'success' : 'pending' },
      { id: '2', date: inv.data_emissao, title: 'Natureza da Operação', subtitle: inv.natureza_operacao || 'Venda de Produção', value: 'OK', status: 'info' },
      { id: '3', date: inv.data_emissao, title: 'Protocolo SEFAZ', subtitle: 'Transmissão autorizada', value: 'Ver XML', status: 'success' },
    ]);
  };

  const columns = [
    {
      header: 'Status',
      accessor: (item: any) => (
        <span className={`status-pill ${item.status === 'CONCLUIDA' ? 'success' : 'pending'}`}>
          {item.status === 'CONCLUIDA' ? 'Autorizada' : 'Pendente'}
        </span>
      ),
      align: 'center' as const
    },
    {
      header: 'Número / Série',
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
      header: 'Cliente',
      accessor: (item: any) => (
        <div className="table-cell-meta">
          <Building2 size={14} />
          <span>{item.clientes?.nome || 'N/A'}</span>
        </div>
      )
    },
    {
      header: 'Valor Total',
      accessor: (item: any) => (
        <span className="font-bold text-slate-900">
          {Number(item.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </span>
      )
    }
  ];

  return (
    <div className="invoice-page animate-slide-up">
      <header className="page-header">
        <div className="header-brand-group">
          <div className="brand-badge">
            <ShieldCheck size={14} fill="currentColor" />
            <span>ELITE FISCAL v5.0</span>
          </div>
          <h1 className="page-title">Nota Fiscal de Saída</h1>
          <p className="page-subtitle">Emissão, monitoramento de protocolos SEFAZ e gestão de obrigações fiscais eletrônicas em tempo real.</p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary">
            <Printer size={18} />
            LOTE PDF
          </button>
          <button className="primary-btn" onClick={handleOpenCreate}>
            <Plus size={18} />
            EMITIR NOVA NF-E
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
            change="+2.4%"
            trend={stat.trend}
          />
        ))}
      </div>
      <div className="elite-controls-row">
        <div className="elite-tab-group">
          <button 
            className="elite-tab-item active"
            onClick={() => {}}
          >
            Emitidas
          </button>
          <button 
            className="elite-tab-item"
            onClick={() => {}}
          >
            Canceladas
          </button>
        </div>

        <div className="elite-search-wrapper">
          <Search size={18} className="s-icon" />
          <input 
            type="text" 
            className="elite-search-input"
            placeholder="Pesquisar por número, cliente ou série..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="elite-filter-group">
          <button className="icon-btn-secondary" title="Filtros Avançados">
            <Filter size={20} />
          </button>
          <button className="icon-btn-secondary" title="Exportar XML/PDF">
            <Download size={20} />
          </button>
        </div>
      </div>

      <div className="management-content">
        <ModernTable 
          data={invoices.filter(inv => 
            (inv.numero_nota || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
            (inv.clientes?.nome || '').toLowerCase().includes(searchTerm.toLowerCase())
          )}
          columns={columns}
          loading={loading}
          hideHeader={true}
          actions={(item) => (
            <div className="modern-actions">
              <button className="action-dot info" onClick={() => handleViewDetails(item)} title="Detalhes">
                <History size={18} />
              </button>
              <button className="action-dot edit" onClick={() => handleOpenEdit(item)} title="Editar">
                <Edit3 size={18} />
              </button>
              <button className="action-dot delete" onClick={() => handleDelete(item.id)} title="Excluir">
                <Trash2 size={18} />
              </button>
              <button className="action-dot" onClick={() => {}} title="Imprimir">
                <Printer size={18} />
              </button>
            </div>
          )}
        />
      </div>

      <OutputInvoiceForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit}
        initialData={selectedInvoice}
      />

      <HistoryModal 
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        title="Dossiê Fiscal"
        subtitle="Rastreabilidade completa do documento e autorização SEFAZ"
        items={historyItems}
        loading={historyLoading}
      />
    </div>
  );
};
