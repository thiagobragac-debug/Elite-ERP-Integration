/**
 * AuditLog Component - Refactored
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 *
 * This component has been refactored to extract:
 * - Timeline component (AuditTimeline)
 * - Filter components (AuditFilterModal)
 * - Hooks for log data fetching (useAuditLogs)
 * - Types for audit log entries (types.ts)
 */

import React, { useState } from 'react';
import {
  RefreshCw,
  Search,
  Filter,
  FileSpreadsheet,
  ExternalLink,
  Shield,
  AlertCircle,
  Database,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useDebounce } from '../../hooks/useDebounce';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { exportToCSV, exportToExcel, exportToPDF } from '../../utils/export';
import { TauzeStatCard } from '../../components/Cards/TauzeStatCard';
import { ModernTable } from '../../components/DataTable/ModernTable';
import { KPISkeleton } from '../../components/Feedback/Skeleton';
import { EmptyState } from '../../components/Feedback/EmptyState';
import { SidePanel } from '../../components/Layout/SidePanel';
import { SupplierForm } from '../../components/Forms/SupplierForm';
import { AnimalForm } from '../../components/Forms/AnimalForm';
import { TransactionForm } from '../../components/Forms/TransactionForm';
import { ClientForm } from '../../components/Forms/ClientForm';
import { MachineForm } from '../../components/Forms/MachineForm';
import { PastureForm } from '../../components/Forms/PastureForm';
import { LotForm } from '../../components/Forms/LotForm';
import { WeightForm } from '../../components/Forms/WeightForm';
import { HealthForm } from '../../components/Forms/HealthForm';
import { PurchaseOrderForm } from '../../components/Forms/PurchaseOrderForm';
import { SalesOrderForm } from '../../components/Forms/SalesOrderForm';
import toast from 'react-hot-toast';
import { Breadcrumb } from '../../components/Navigation/Breadcrumb';
import { usePersistentState } from '../../hooks/usePersistentState';

// Import refactored components
import {
  AuditTimeline,
  AuditFilterModal,
  useAuditLogs,
  MODULE_LABELS,
  ACTION_CONFIG,
  ENTITY_ROUTES,
  FIELD_TRANSLATIONS,
  type LogEntry,
  type AuditFilterValues,
} from './components/AuditLog';

export const AuditLog: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = usePersistentState('AuditLog_showFilters', false);
  const [filterValues, setFilterValues] = useState<AuditFilterValues>({
    action: 'ALL',
    module: 'ALL',
    user: '',
    dateStart: '',
    dateEnd: '',
    severity: 'all',
  });
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [dossierViewMode, setDossierViewMode] = useState<'visual' | 'json'>('visual');
  const [showOnlyChanges, setShowOnlyChanges] = usePersistentState(
    'AuditLog_showOnlyChanges',
    true
  );

  // Form states
  const [isSupplierFormOpen, setIsSupplierFormOpen] = usePersistentState(
    'AuditLog_isSupplierFormOpen',
    false
  );
  const [isAnimalFormOpen, setIsAnimalFormOpen] = usePersistentState(
    'AuditLog_isAnimalFormOpen',
    false
  );
  const [isTransactionFormOpen, setIsTransactionFormOpen] = usePersistentState(
    'AuditLog_isTransactionFormOpen',
    false
  );
  const [isClientFormOpen, setIsClientFormOpen] = usePersistentState(
    'AuditLog_isClientFormOpen',
    false
  );
  const [isMachineFormOpen, setIsMachineFormOpen] = usePersistentState(
    'AuditLog_isMachineFormOpen',
    false
  );
  const [isPastureFormOpen, setIsPastureFormOpen] = usePersistentState(
    'AuditLog_isPastureFormOpen',
    false
  );
  const [isLotFormOpen, setIsLotFormOpen] = usePersistentState('AuditLog_isLotFormOpen', false);
  const [isWeightFormOpen, setIsWeightFormOpen] = usePersistentState(
    'AuditLog_isWeightFormOpen',
    false
  );
  const [isHealthFormOpen, setIsHealthFormOpen] = usePersistentState(
    'AuditLog_isHealthFormOpen',
    false
  );
  const [isPurchaseOrderFormOpen, setIsPurchaseOrderFormOpen] = usePersistentState(
    'AuditLog_isPurchaseOrderFormOpen',
    false
  );
  const [isSalesOrderFormOpen, setIsSalesOrderFormOpen] = usePersistentState(
    'AuditLog_isSalesOrderFormOpen',
    false
  );
  const [transactionFormType, setTransactionFormType] = useState<'payable' | 'receivable'>(
    'payable'
  );
  const [formInitialData, setFormInitialData] = useState<any>(null);
  const [isFetchingRecord, setIsFetchingRecord] = useState(false);
  const [isDynamicFormOpen, setIsDynamicFormOpen] = usePersistentState(
    'AuditLog_isDynamicFormOpen',
    false
  );
  const [dynamicFormTableName, setDynamicFormTableName] = useState('');
  const [isSavingDynamic, setIsSavingDynamic] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 25;

  // Use refactored hook for data fetching
  const debouncedSearch = useDebounce(searchTerm, 500);
  const { logs, stats, totalCount, loading, error } = useAuditLogs({
    page,
    pageSize,
    filters: {
      ...filterValues,
      search: debouncedSearch,
    },
  });

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    const exportData = (logs || []).map((item) => ({
      Módulo: MODULE_LABELS[item.table_name] || item.table_name,
      Ação: ACTION_CONFIG[item.action]?.label || item.action,
      Usuário: item.user_name,
      Descrição: item.description,
      Subrótulo: item.sublabel || '-',
      Data: new Date(item.timestamp).toLocaleString('pt-BR'),
    }));

    const filename = 'historico_auditoria';
    const title = 'Relatório de Rastreabilidade e Auditoria';

    if (format === 'csv') {
      exportToCSV(exportData, filename);
    } else if (format === 'excel') {
      exportToExcel(exportData, filename);
    } else if (format === 'pdf') {
      exportToPDF(exportData, filename, title);
    }
  };

  if (error) {
    console.error('[AuditLog] Error:', error);
  }

  const updateSupplierMutation = useMutation({
    mutationFn: async (formData: any) => {
      const payload = {
        nome: formData.nome,
        cnpj_cpf: formData.cnpj,
        contato: formData.contato,
        email: formData.email,
        categoria: formData.categoria,
        cep: formData.cep,
        tipo_logradouro: formData.tipo_logradouro,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        pais: formData.pais,
        status: formData.status,
      };

      const { error } = await supabase
        .from('parceiros')
        .update({
          ...payload,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsSupplierFormOpen(false);
      toast.success('Parceiro atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar parceiro:', err);
      toast.error(`Erro ao atualizar parceiro: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateAnimalMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('animais')
        .update({
          brinco: formData.brinco,
          raca: formData.raca,
          sexo: formData.sexo,
          data_nascimento: formData.data_nascimento,
          lote_id: formData.lote_id,
          status: formData.status,
          peso_inicial: formData.peso_inicial,
          pelagem: formData.pelagem,
          origem: formData.origem,
          mae_brinco: formData.mae_brinco,
          pai_brinco: formData.pai_brinco,
          valor_compra: formData.valor_compra,
          categoria: formData.categoria,
          finalidade: formData.finalidade,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsAnimalFormOpen(false);
      toast.success('Animal atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar animal:', err);
      toast.error(`Erro ao atualizar animal: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async (formData: any) => {
      const tableName = transactionFormType === 'payable' ? 'contas_pagar' : 'contas_receber';
      const payload = {
        descricao: formData.description,
        valor_total: formData.value,
        data_vencimento: formData.dueDate,
        categoria: formData.category,
        status: formData.status,
        metodo_pagamento: formData.paymentMethod,
      };

      const { error } = await supabase.from(tableName).update(payload).eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsTransactionFormOpen(false);
      toast.success('Lançamento financeiro atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar transação:', err);
      toast.error(`Erro ao atualizar lançamento: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('parceiros')
        .update({
          nome: formData.name,
          documento: formData.cnpj,
          tipo: formData.type,
          email: formData.email,
          telefone: formData.phone,
          cep: formData.cep,
          tipo_logradouro: formData.tipo_logradouro,
          logradouro: formData.logradouro,
          numero: formData.numero,
          complemento: formData.complemento,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
          pais: formData.pais,
          limite_credito: formData.creditLimit ? parseFloat(formData.creditLimit) || null : null,
          status: formData.status,
          segmento: formData.segment,
          is_global: formData.is_global,
          fazendas_vinculadas: formData.fazendas_vinculadas,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsClientFormOpen(false);
      toast.success('Parceiro atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar parceiro:', err);
      toast.error(`Erro ao atualizar parceiro: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateMachineMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('maquinas')
        .update({
          nome: formData.nome,
          marca: formData.marca,
          modelo: formData.modelo,
          categoria: formData.categoria,
          horimetro_atual: parseFloat(formData.horimetro_inicial) || 0,
          quilometragem_atual: parseFloat(formData.quilometragem_inicial) || 0,
          placa: formData.placa,
          ano: parseInt(formData.ano) || null,
          status: formData.status,
          chassi: formData.chassi,
          combustivel: formData.combustivel,
          capacidade_tanque: parseFloat(formData.capacidade_tanque) || null,
          valor_compra: parseFloat(formData.valor_compra) || null,
          potencia: parseFloat(formData.potencia) || null,
          peso_operacional: parseFloat(formData.peso_operacional) || null,
          intervalo_revisao: parseFloat(formData.intervalo_revisao) || 250,
          consumo_estimado: parseFloat(formData.consumo_estimado) || null,
          data_proxima_revisao: formData.data_proxima_revisao || null,
          observacoes: formData.observacoes,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsMachineFormOpen(false);
      toast.success('Máquina/Veículo atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar máquina:', err);
      toast.error(`Erro ao atualizar máquina: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updatePastureMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('pastos')
        .update({
          nome: formData.nome,
          area: parseFloat(formData.area) || 0,
          capacidade_ua: parseFloat(formData.capacidade_ua) || 2.5,
          tipo_capim: formData.tipo_capim,
          status: formData.status,
          data_ultima_fertilizacao: formData.data_ultima_fertilizacao || null,
          topografia: formData.topografia,
          tipo_solo: formData.tipo_solo,
          agua: formData.agua,
          observacoes: formData.observacoes,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsPastureFormOpen(false);
      toast.success('Pasto/Piquete atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar pasto:', err);
      toast.error(`Erro ao atualizar pasto: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateLotMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('lotes')
        .update({
          nome: formData.nome,
          descricao: formData.descricao,
          status: formData.status,
          capacidade: parseInt(formData.capacidade) || null,
          data_inicio: formData.data_inicio,
          data_fim_prevista: formData.data_fim_prevista || null,
          gmd_alvo: parseFloat(formData.gmd_alvo) || null,
          peso_alvo: parseFloat(formData.peso_alvo) || null,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsLotFormOpen(false);
      toast.success('Lote atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar lote:', err);
      toast.error(`Erro ao atualizar lote: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateWeightMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('pesagens')
        .update({
          animal_id: formData.animal_id,
          peso: parseFloat(formData.peso) || 0,
          data_pesagem: formData.data_pesagem,
          lote_id: formData.lote_id || null,
          observacoes: formData.observacoes || null,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsWeightFormOpen(false);
      toast.success('Pesagem atualizada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar pesagem:', err);
      toast.error(`Erro ao atualizar pesagem: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateHealthMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('sanidade')
        .update({
          animal_id: formData.animal_id,
          medicamento: formData.medicamento,
          dose: formData.dose || null,
          data_aplicacao: formData.data_aplicacao,
          proxima_dose: formData.proxima_dose || null,
          veterinario: formData.veterinario || null,
          observacoes: formData.observacoes || null,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsHealthFormOpen(false);
      toast.success('Registro de sanidade atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar registro de sanidade:', err);
      toast.error(`Erro ao atualizar registro de sanidade: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updatePurchaseOrderMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('pedidos_compra')
        .update({
          numero: formData.numero,
          fornecedor_id: formData.fornecedor_id || formData.parceiro_id,
          data_pedido: formData.data_pedido,
          data_entrega_prevista: formData.data_entrega_prevista || null,
          valor_total: parseFloat(formData.valor_total) || 0,
          status: formData.status,
          observacoes: formData.observacoes || null,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsPurchaseOrderFormOpen(false);
      toast.success('Pedido de compra atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar pedido de compra:', err);
      toast.error(`Erro ao atualizar pedido de compra: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateSalesOrderMutation = useMutation({
    mutationFn: async (formData: any) => {
      const { error } = await supabase
        .from('pedidos_venda')
        .update({
          numero: formData.numero,
          cliente_id: formData.cliente_id || formData.parceiro_id,
          data_pedido: formData.data_pedido,
          data_entrega_prevista: formData.data_entrega_prevista || null,
          valor_total: parseFloat(formData.valor_total) || 0,
          status: formData.status,
          observacoes: formData.observacoes || null,
        })
        .eq('id', formInitialData.id);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsSalesOrderFormOpen(false);
      toast.success('Pedido de venda atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar pedido de venda:', err);
      toast.error(`Erro ao atualizar pedido de venda: ${err.message || 'Erro desconhecido'}`);
    },
  });

  const updateDynamicMutation = useMutation({
    mutationFn: async () => {
      setIsSavingDynamic(true);
      const { error } = await supabase.from(dynamicFormTableName).upsert(formInitialData);
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      setIsDynamicFormOpen(false);
      toast.success('Registro original atualizado com sucesso no banco de dados!');
      queryClient.invalidateQueries({ queryKey: ['report', 'audit-logs'] });
    },
    onError: (err: any) => {
      console.error('[AuditLog] Erro ao salvar registro dinâmico:', err);
      toast.error(`Erro ao atualizar registro: ${err.message || 'Erro desconhecido'}`);
    },
    onSettled: () => {
      setIsSavingDynamic(false);
    },
  });

  const dossierRoute = selectedLog ? ENTITY_ROUTES[selectedLog.table_name] : null;
  const canOpenRecord = !!(selectedLog && dossierRoute && selectedLog.action !== 'DELETE');

  const openFormForTable = (tableName: string, data: any, entityId: any) => {
    setFormInitialData({ ...data, id: entityId });
    setSelectedLog(null);

    if (tableName === 'fornecedores') {
      setIsSupplierFormOpen(true);
    } else if (tableName === 'animais') {
      setIsAnimalFormOpen(true);
    } else if (tableName === 'contas_pagar' || tableName === 'contas_receber') {
      setTransactionFormType(tableName === 'contas_pagar' ? 'payable' : 'receivable');
      setIsTransactionFormOpen(true);
    } else if (tableName === 'parceiros') {
      setIsClientFormOpen(true);
    } else if (tableName === 'maquinas') {
      setIsMachineFormOpen(true);
    } else if (tableName === 'pastos') {
      setIsPastureFormOpen(true);
    } else if (tableName === 'lotes') {
      setIsLotFormOpen(true);
    } else if (tableName === 'pesagens') {
      setIsWeightFormOpen(true);
    } else if (tableName === 'sanidade') {
      setIsHealthFormOpen(true);
    } else if (tableName === 'pedidos_compra') {
      setIsPurchaseOrderFormOpen(true);
    } else if (tableName === 'pedidos_venda') {
      setIsSalesOrderFormOpen(true);
    } else {
      setDynamicFormTableName(tableName);
      setIsDynamicFormOpen(true);
    }
  };

  const handleOpenRecordModal = async () => {
    if (!selectedLog) {
      return;
    }

    const tableName = selectedLog.table_name;
    const entityId = selectedLog.entity_id;
    const logData = selectedLog.new_data || selectedLog.old_data;

    (window as any).__lastAuditLog = selectedLog;

    if (logData && Object.keys(logData).length > 0) {
      openFormForTable(tableName, logData, entityId);
    } else if (entityId) {
      setIsFetchingRecord(true);
      try {
        // Usando consulta direta pontual resiliente
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', entityId)
          .maybeSingle();
        if (error) {
          throw error;
        }
        if (data) {
          openFormForTable(tableName, data, entityId);
        } else {
          toast.error('Este registro não foi encontrado no banco de dados ativo.');
        }
      } catch (err) {
        console.error(`[AuditLog] Erro ao buscar ${tableName}:`, err);
        toast.error('Não foi possível carregar o formulário original.');
      } finally {
        setIsFetchingRecord(false);
      }
    } else if (dossierRoute && entityId) {
      let finalPath = dossierRoute;
      if (selectedLog.table_name === 'animais') {
        finalPath = `/pecuaria/animal/${entityId}`;
      } else {
        finalPath = `${dossierRoute}?id=${entityId}`;
      }
      setSelectedLog(null);
      navigate(finalPath);
    }
  };

  /* ─── Render ─── */
  return (
    <div className="audit-log-page">
      {/* ── Cabeçalho padrão ── */}
      <header className="page-header">
        <div className="header-brand-group">
          <Breadcrumb
            paths={[
              { label: 'Administração', href: '/admin/intelligence' },
              { label: 'Rastreabilidade & Auditoria' },
            ]}
          />
          <h1 className="page-title">Rastreabilidade & Auditoria</h1>
          <p className="page-subtitle">
            Monitoramento técnico e operacional de todas as transações e alterações de dados em
            tempo real.
          </p>
        </div>
        <div className="page-actions">
          <button className="glass-btn secondary" disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
            SINCRONIZAR LOGS
          </button>
        </div>
      </header>

      {/* ── KPI Grid padrão ── */}
      <div className="next-gen-kpi-grid">
        {loading
          ? Array(4)
              .fill(0)
              .map((_, i) => <KPISkeleton key={i} />)
          : stats.map((s: any, i) => (
              <TauzeStatCard
                key={i}
                label={s.label}
                value={s.value}
                icon={s.icon}
                color={s.color}
                progress={s.progress}
                change={s.change}
                periodLabel={s.periodLabel}
                sparkline={s.sparkline}
                trend={s.trend}
              />
            ))}
      </div>

      {/* ── Controls Row padrão ── */}
      <div className="tauze-controls-row">
        <div className="tauze-tab-group">
          {(['ALL', 'INSERT', 'UPDATE', 'DELETE'] as const).map((f) => (
            <button
              key={f}
              className={`tauze-tab-item ${filterValues.action === f ? 'active' : ''}`}
              onClick={() => setFilterValues((prev) => ({ ...prev, action: f }))}
            >
              {f === 'ALL' ? 'Todos os Eventos' : `${ACTION_CONFIG[f].label}s`}
            </button>
          ))}
        </div>

        <div className="tauze-search-wrapper">
          <Search size={18} className="s-icon" />
          <input
            type="text"
            className="tauze-search-input"
            placeholder="Buscar por módulo, usuário ou descrição..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="tauze-filter-group">
          <button
            className={`icon-btn-secondary ${showFilters ? 'active' : ''}`}
            title="Filtros Avançados"
            onClick={() => setShowFilters((p) => !p)}
          >
            <Filter size={20} />
          </button>
          <div className="export-dropdown-container">
            <button
              className="icon-btn-secondary"
              title="Exportar"
              onClick={() => {
                const menu = document.getElementById('export-menu-audit');
                if (menu) {
                  menu.classList.toggle('active');
                }
              }}
            >
              <FileSpreadsheet size={20} />
            </button>
            <div id="export-menu-audit" className="export-menu">
              <button
                onClick={() => {
                  handleExport('csv');
                  document.getElementById('export-menu-audit')?.classList.remove('active');
                }}
              >
                Excel (.CSV)
              </button>
              <button
                onClick={() => {
                  handleExport('excel');
                  document.getElementById('export-menu-audit')?.classList.remove('active');
                }}
              >
                Excel (.xlsx)
              </button>
              <button
                onClick={() => {
                  handleExport('pdf');
                  document.getElementById('export-menu-audit')?.classList.remove('active');
                }}
              >
                PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <AuditFilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filterValues}
        setFilters={setFilterValues}
        modules={MODULE_LABELS}
      />

      {/* ── Timeline (Refactored Component) ── */}
      <div className="management-content">
        <AuditTimeline
          logs={logs}
          loading={loading}
          onLogClick={(log) => {
            const tableName = log.table_name;
            const entityId = log.entity_id;
            const logData = log.new_data || log.old_data;

            (window as any).__lastAuditLog = log;

            if (logData && Object.keys(logData).length > 0) {
              openFormForTable(tableName, logData, entityId);
            } else {
              setSelectedLog(log);
            }
          }}
        />

        {!loading && logs.length > 0 && (
          <div className="premium-card" style={{ padding: '0', marginTop: '0' }}>
            <div
              className="pagination-wrapper"
              style={{ padding: '12px 14px', borderTop: '1px solid hsl(var(--border))' }}
            >
              <ModernTable
                emptyState={
                  <EmptyState
                    title="Nenhum registro encontrado"
                    description="Sua busca não retornou resultados."
                    icon={Search}
                  />
                }
                data={[]}
                columns={[]}
                loading={false}
                totalCount={totalCount}
                currentPage={page}
                onPageChange={setPage}
                itemsPerPage={pageSize}
                hideHeader={true}
                onlyPagination={true}
              />
            </div>
          </div>
        )}
      </div>

      <SidePanel
        isOpen={!!selectedLog}
        onClose={() => {
          setSelectedLog(null);
          setDossierViewMode('visual');
        }}
        onSubmit={(e) => {
          e.preventDefault();
          handleOpenRecordModal();
        }}
        title="Dossiê de Auditoria"
        subtitle={selectedLog?.description || 'Rastreabilidade técnica de dados'}
        icon={Shield}
        submitLabel={canOpenRecord ? 'Abrir Registro' : 'Fechar'}
        iconSubmit={canOpenRecord ? ExternalLink : Shield}
        hideSubmit={!canOpenRecord}
        loading={isFetchingRecord}
      >
        {selectedLog && (
          <div
            style={{
              gridColumn: '1 / -1',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              width: '100%',
            }}
          >
            {/* Abas de Visualização */}
            <div className="dossier-tab-header">
              <button
                type="button"
                className={`dossier-tab-btn ${dossierViewMode === 'visual' ? 'active' : ''}`}
                onClick={() => setDossierViewMode('visual')}
              >
                Ficha do Lançamento
              </button>
              <button
                type="button"
                className={`dossier-tab-btn ${dossierViewMode === 'json' ? 'active' : ''}`}
                onClick={() => setDossierViewMode('json')}
              >
                Dados Técnicos (JSON)
              </button>
            </div>

            {dossierViewMode === 'visual' ? (
              <>
                {/* 1. Alertas de Status */}
                {selectedLog.action === 'DELETE' && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'hsl(var(--destructive) / 0.08)',
                      border: '1px solid hsl(var(--destructive) / 0.2)',
                      color: 'hsl(var(--destructive))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>
                      Este registro foi excluído do banco de dados e não está mais disponível para
                      visualização.
                    </span>
                  </div>
                )}

                {selectedLog.action !== 'DELETE' && !dossierRoute && (
                  <div
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: 'hsl(var(--text-muted) / 0.08)',
                      border: '1px solid hsl(var(--border))',
                      color: 'hsl(var(--text-muted))',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      marginBottom: '12px',
                    }}
                  >
                    <AlertCircle size={14} />
                    <span>
                      Não há uma tela direta de gerenciamento associada para a tabela "
                      {selectedLog.table_name}".
                    </span>
                  </div>
                )}

                {/* 2. Ficha Visual do Registro */}
                {(() => {
                  const data = selectedLog.new_data || selectedLog.old_data || {};
                  const isFinancial =
                    selectedLog.table_name === 'contas_pagar' ||
                    selectedLog.table_name === 'contas_receber';
                  const isAnimal = selectedLog.table_name === 'animais';

                  if (isFinancial) {
                    const amount = data.valor_total || data.valor || 0;
                    const desc = data.descricao || 'Sem descrição';
                    const status = data.status || 'PENDENTE';
                    const date = data.data_vencimento || data.data || '';

                    return (
                      <div className="dossier-slip">
                        <div className="dossier-slip-header">
                          <span className="dossier-slip-category">{data.categoria || 'Geral'}</span>
                          <span
                            className={`status-pill ${status === 'PAGO' ? 'active' : 'warning'}`}
                          >
                            {status}
                          </span>
                        </div>
                        <div className="dossier-slip-amount">
                          <span className="currency">R$</span>
                          <span className="value">
                            {Number(amount).toLocaleString('pt-BR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="dossier-slip-desc">{desc}</div>
                        <div className="dossier-slip-footer">
                          {data.parceiro || data.parceiro ? (
                            <div className="dossier-slip-meta-item">
                              <span className="meta-label">Parceiro / Parceiro:</span>
                              <span className="meta-val">{data.parceiro || data.parceiro}</span>
                            </div>
                          ) : null}
                          {date && (
                            <div className="dossier-slip-meta-item">
                              <span className="meta-label">Vencimento:</span>
                              <span className="meta-val">
                                {new Date(date).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  if (isAnimal) {
                    const ident = data.identificador || data.brinco || 'Sem ID';
                    const raca = data.raca || 'N/A';
                    const peso = data.peso || data.peso_inicial || '';

                    return (
                      <div className="dossier-slip">
                        <div className="dossier-slip-header">
                          <span className="dossier-slip-category">Gado de Corte</span>
                          <span className="status-pill active">{data.status || 'ATIVO'}</span>
                        </div>
                        <div className="dossier-slip-amount">
                          <span className="value">{ident}</span>
                        </div>
                        <div className="dossier-slip-desc">
                          {raca} • {data.sexo === 'M' ? 'Macho' : 'Fêmea'}
                        </div>
                        <div className="dossier-slip-footer">
                          {peso && (
                            <div className="dossier-slip-meta-item">
                              <span className="meta-label">Peso:</span>
                              <span className="meta-val">{peso} kg</span>
                            </div>
                          )}
                          {data.lote && (
                            <div className="dossier-slip-meta-item">
                              <span className="meta-label">Lote:</span>
                              <span className="meta-val">{data.lote}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Genérico
                  const mainTitle = data.nome || data.descricao || 'Detalhes do Registro';
                  const subTitle = data.cnpj_cpf || data.email || data.identificador || '';

                  return (
                    <div className="dossier-slip">
                      <div className="dossier-slip-header">
                        <span className="dossier-slip-category">
                          Tabela: {selectedLog.table_name}
                        </span>
                        {data.status && <span className="status-pill active">{data.status}</span>}
                      </div>
                      <div className="dossier-slip-amount">
                        <span className="value" style={{ fontSize: '1.6rem', padding: '10px 0' }}>
                          {mainTitle}
                        </span>
                      </div>
                      {subTitle && <div className="dossier-slip-desc">{subTitle}</div>}
                      <div className="dossier-slip-footer">
                        <div className="dossier-slip-meta-item">
                          <span className="meta-label">ID do Registro:</span>
                          <span className="meta-val">{selectedLog.entity_id || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Tabela Comparativa de Campos */}
                {(() => {
                  const oldData = selectedLog.old_data || {};
                  const newData = selectedLog.new_data || {};

                  const FIELD_TRANSLATIONS: Record<string, string> = {
                    nome: 'Nome / Razão Social',
                    descricao: 'Descrição',
                    valor_total: 'Valor Total',
                    valor: 'Valor',
                    status: 'Situação',
                    data_vencimento: 'Vencimento',
                    data_pagamento: 'Data de Pagamento',
                    data: 'Data',
                    categoria: 'Categoria',
                    cnpj_cpf: 'CNPJ / CPF',
                    cep: 'CEP',
                    cidade: 'Cidade',
                    estado: 'UF',
                    bairro: 'Bairro',
                    logradouro: 'Logradouro',
                    numero: 'Número',
                    complemento: 'Complemento',
                    telefone: 'Telefone',
                    email: 'E-mail',
                    identificador: 'Identificador',
                    brinco: 'Brinco',
                    raca: 'Raça',
                    sexo: 'Sexo',
                    peso: 'Peso (kg)',
                    peso_inicial: 'Peso Inicial (kg)',
                    observacoes: 'Observações',
                    metodo_pagamento: 'Forma de Pagamento',
                    created_at: 'Criado em',
                    updated_at: 'Atualizado em',
                  };

                  const formatVal = (key: string, value: any) => {
                    if (value === null || value === undefined || value === '') {
                      return '—';
                    }
                    if (typeof value === 'boolean') {
                      return value ? 'Sim' : 'Não';
                    }
                    if (key.includes('valor') || key === 'preco') {
                      return Number(value).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      });
                    }
                    if (key.includes('data') || key === 'timestamp') {
                      try {
                        const d = new Date(value);
                        if (!isNaN(d.getTime())) {
                          return d.toLocaleDateString('pt-BR');
                        }
                      } catch (_) {}
                    }
                    if (Array.isArray(value)) {
                      return `[${value.length} itens]`;
                    }
                    if (typeof value === 'object') {
                      return JSON.stringify(value);
                    }
                    return String(value);
                  };

                  const allKeys = Array.from(
                    new Set([...Object.keys(oldData), ...Object.keys(newData)])
                  )
                    .filter(
                      (k) =>
                        k !== 'tenant_id' &&
                        k !== 'fazenda_id' &&
                        k !== 'id' &&
                        k !== 'created_at' &&
                        k !== 'updated_at' &&
                        k !== 'fazendas_vinculadas'
                    )
                    .sort();

                  const displayedKeys = showOnlyChanges
                    ? allKeys.filter(
                        (k) => JSON.stringify(oldData[k]) !== JSON.stringify(newData[k])
                      )
                    : allKeys;

                  return (
                    <>
                      <div className="diff-grid-header">
                        <span className="diff-grid-title">Histórico de Alterações</span>
                        <button
                          type="button"
                          className={`dossier-tab-btn ${showOnlyChanges ? 'active' : ''}`}
                          onClick={() => setShowOnlyChanges(!showOnlyChanges)}
                          style={{ fontSize: '0.65rem', padding: '4px 8px' }}
                        >
                          {showOnlyChanges
                            ? 'Mostrar Todos os Campos'
                            : 'Mostrar Apenas Alterações'}
                        </button>
                      </div>

                      <table className="diff-table">
                        <thead>
                          <tr>
                            <th style={{ width: '30%' }}>Campo</th>
                            <th style={{ width: '35%' }}>Anterior</th>
                            <th style={{ width: '35%' }}>Atualizado</th>
                          </tr>
                        </thead>
                        <tbody>
                          {displayedKeys.length === 0 ? (
                            <tr>
                              <td
                                colSpan={3}
                                style={{
                                  textAlign: 'center',
                                  color: 'hsl(var(--text-muted))',
                                  padding: '20px',
                                }}
                              >
                                Nenhuma alteração de valor encontrada nestes campos.
                              </td>
                            </tr>
                          ) : (
                            displayedKeys.map((key) => {
                              const oldVal = oldData[key];
                              const newVal = newData[key];
                              const isChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);

                              return (
                                <tr key={key} className={isChanged ? 'diff-row-changed' : ''}>
                                  <td style={{ fontWeight: 700, color: 'hsl(var(--text-main))' }}>
                                    {FIELD_TRANSLATIONS[key] || key}
                                  </td>
                                  <td>
                                    {isChanged && oldVal !== undefined ? (
                                      <span className="diff-badge old">
                                        {formatVal(key, oldVal)}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'hsl(var(--text-muted))' }}>
                                        {formatVal(key, oldVal)}
                                      </span>
                                    )}
                                  </td>
                                  <td>
                                    {isChanged ? (
                                      <span className="diff-badge new" style={{ fontWeight: 800 }}>
                                        {formatVal(key, newVal)}
                                      </span>
                                    ) : (
                                      <span style={{ color: 'hsl(var(--text-muted))' }}>
                                        {formatVal(key, newVal)}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </>
                  );
                })()}
              </>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '24px',
                  width: '100%',
                }}
              >
                {selectedLog.old_data && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      Estado Anterior
                    </div>
                    <pre
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'hsl(var(--bg-main)/0.5)',
                        border: '1px solid hsl(var(--border))',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '400px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}
                {selectedLog.new_data && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div
                      style={{
                        fontSize: '10px',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: 'hsl(var(--text-muted))',
                      }}
                    >
                      Novo Estado
                    </div>
                    <pre
                      style={{
                        padding: '20px',
                        borderRadius: '16px',
                        background: 'hsl(161 64% 39% / 0.05)',
                        border: '1px solid hsl(161 64% 39% / 0.3)',
                        color: 'hsl(161 64% 39%)',
                        fontSize: '12px',
                        overflow: 'auto',
                        maxHeight: '400px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    >
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                marginTop: '12px',
                paddingTop: '12px',
                borderTop: '1px solid hsl(var(--border))',
                width: '100%',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  fontSize: '10px',
                  fontWeight: 700,
                  color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase',
                }}
              >
                <span>ID: {selectedLog.id}</span>
                <span>•</span>
                <span>Tabela: {selectedLog.table_name}</span>
              </div>
            </div>
          </div>
        )}
      </SidePanel>

      <SupplierForm
        isOpen={isSupplierFormOpen}
        onClose={() => setIsSupplierFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const payload = {
              nome: formData.nome,
              cnpj_cpf: formData.cnpj,
              contato: formData.contato,
              email: formData.email,
              categoria: formData.categoria,
              cep: formData.cep,
              tipo_logradouro: formData.tipo_logradouro,
              logradouro: formData.logradouro,
              numero: formData.numero,
              complemento: formData.complemento,
              bairro: formData.bairro,
              cidade: formData.cidade,
              estado: formData.estado,
              pais: formData.pais,
              status: formData.status,
            };

            const { error } = await supabase
              .from('parceiros')
              .update({
                ...payload,
                is_global: formData.is_global,
                fazendas_vinculadas: formData.fazendas_vinculadas,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsSupplierFormOpen(false);
            toast.success('Parceiro atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar parceiro:', err);
            toast.error(`Erro ao atualizar parceiro: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <AnimalForm
        isOpen={isAnimalFormOpen}
        onClose={() => setIsAnimalFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('animais')
              .update({
                brinco: formData.brinco,
                raca: formData.raca,
                sexo: formData.sexo,
                data_nascimento: formData.data_nascimento,
                lote_id: formData.lote_id,
                status: formData.status,
                peso_inicial: formData.peso_inicial,
                pelagem: formData.pelagem,
                origem: formData.origem,
                mae_brinco: formData.mae_brinco,
                pai_brinco: formData.pai_brinco,
                valor_compra: formData.valor_compra,
                categoria: formData.categoria,
                finalidade: formData.finalidade,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsAnimalFormOpen(false);
            toast.success('Animal atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar animal:', err);
            toast.error(`Erro ao atualizar animal: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <TransactionForm
        isOpen={isTransactionFormOpen}
        onClose={() => setIsTransactionFormOpen(false)}
        type={transactionFormType}
        onSubmit={async (formData) => {
          try {
            const tableName = transactionFormType === 'payable' ? 'contas_pagar' : 'contas_receber';
            const payload = {
              descricao: formData.description,
              valor_total: formData.value,
              data_vencimento: formData.dueDate,
              categoria: formData.category,
              status: formData.status,
              metodo_pagamento: formData.paymentMethod,
            };

            const { error } = await supabase
              .from(tableName)
              .update(payload)
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsTransactionFormOpen(false);
            toast.success('Lançamento financeiro atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar transação:', err);
            toast.error(`Erro ao atualizar lançamento: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <ClientForm
        isOpen={isClientFormOpen}
        onClose={() => setIsClientFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('parceiros')
              .update({
                nome: formData.name,
                documento: formData.cnpj,
                tipo: formData.type,
                email: formData.email,
                telefone: formData.phone,
                cep: formData.cep,
                tipo_logradouro: formData.tipo_logradouro,
                logradouro: formData.logradouro,
                numero: formData.numero,
                complemento: formData.complemento,
                bairro: formData.bairro,
                cidade: formData.cidade,
                estado: formData.estado,
                pais: formData.pais,
                limite_credito: formData.creditLimit
                  ? parseFloat(formData.creditLimit) || null
                  : null,
                status: formData.status,
                segmento: formData.segment,
                is_global: formData.is_global,
                fazendas_vinculadas: formData.fazendas_vinculadas,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsClientFormOpen(false);
            toast.success('Parceiro atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar parceiro:', err);
            toast.error(`Erro ao atualizar parceiro: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <MachineForm
        isOpen={isMachineFormOpen}
        onClose={() => setIsMachineFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('maquinas')
              .update({
                nome: formData.nome,
                marca: formData.marca,
                modelo: formData.modelo,
                categoria: formData.categoria,
                horimetro_atual: parseFloat(formData.horimetro_inicial) || 0,
                quilometragem_atual: parseFloat(formData.quilometragem_inicial) || 0,
                placa: formData.placa,
                ano: parseInt(formData.ano) || null,
                status: formData.status,
                chassi: formData.chassi,
                combustivel: formData.combustivel,
                capacidade_tanque: parseFloat(formData.capacidade_tanque) || null,
                valor_compra: parseFloat(formData.valor_compra) || null,
                potencia: parseFloat(formData.potencia) || null,
                peso_operacional: parseFloat(formData.peso_operacional) || null,
                intervalo_revisao: parseFloat(formData.intervalo_revisao) || 250,
                consumo_estimado: parseFloat(formData.consumo_estimado) || null,
                data_proxima_revisao: formData.data_proxima_revisao || null,
                observacoes: formData.observacoes,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsMachineFormOpen(false);
            toast.success('Máquina/Veículo atualizada com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar máquina:', err);
            toast.error(`Erro ao atualizar máquina: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <PastureForm
        isOpen={isPastureFormOpen}
        onClose={() => setIsPastureFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('pastos')
              .update({
                nome: formData.nome,
                area: parseFloat(formData.area) || 0,
                capacidade_ua: parseFloat(formData.capacidade_ua) || 2.5,
                tipo_capim: formData.tipo_capim,
                status: formData.status,
                data_ultima_fertilizacao: formData.data_ultima_fertilizacao || null,
                topografia: formData.topografia,
                tipo_solo: formData.tipo_solo,
                agua: formData.agua,
                observacoes: formData.observacoes,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsPastureFormOpen(false);
            toast.success('Pasto/Piquete atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar pasto:', err);
            toast.error(`Erro ao atualizar pasto: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <LotForm
        isOpen={isLotFormOpen}
        onClose={() => setIsLotFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('lotes')
              .update({
                nome: formData.nome,
                descricao: formData.descricao,
                status: formData.status,
                capacidade: parseInt(formData.capacidade) || null,
                data_inicio: formData.data_inicio,
                data_fim_prevista: formData.data_fim_prevista || null,
                gmd_alvo: parseFloat(formData.gmd_alvo) || null,
                peso_alvo: parseFloat(formData.peso_alvo) || null,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsLotFormOpen(false);
            toast.success('Lote atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar lote:', err);
            toast.error(`Erro ao atualizar lote: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <WeightForm
        isOpen={isWeightFormOpen}
        onClose={() => setIsWeightFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('pesagens')
              .update({
                animal_id: formData.animal_id,
                peso: parseFloat(formData.peso) || 0,
                data_pesagem: formData.data_pesagem,
                lote_id: formData.lote_id || null,
                observacoes: formData.observacoes || null,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsWeightFormOpen(false);
            toast.success('Pesagem atualizada com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar pesagem:', err);
            toast.error(`Erro ao atualizar pesagem: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <HealthForm
        isOpen={isHealthFormOpen}
        onClose={() => setIsHealthFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('sanidade')
              .update({
                animal_id: formData.animal_id,
                medicamento: formData.medicamento,
                dose: formData.dose || null,
                data_aplicacao: formData.data_aplicacao,
                proxima_dose: formData.proxima_dose || null,
                veterinario: formData.veterinario || null,
                observacoes: formData.observacoes || null,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsHealthFormOpen(false);
            toast.success('Registro de sanidade atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar registro de sanidade:', err);
            toast.error(
              `Erro ao atualizar registro de sanidade: ${err.message || 'Erro desconhecido'}`
            );
          }
        }}
        initialData={formInitialData}
      />

      <PurchaseOrderForm
        isOpen={isPurchaseOrderFormOpen}
        onClose={() => setIsPurchaseOrderFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('pedidos_compra')
              .update({
                numero: formData.numero,
                fornecedor_id: formData.fornecedor_id || formData.parceiro_id,
                data_pedido: formData.data_pedido,
                data_entrega_prevista: formData.data_entrega_prevista || null,
                valor_total: parseFloat(formData.valor_total) || 0,
                status: formData.status,
                observacoes: formData.observacoes || null,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsPurchaseOrderFormOpen(false);
            toast.success('Pedido de compra atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar pedido de compra:', err);
            toast.error(
              `Erro ao atualizar pedido de compra: ${err.message || 'Erro desconhecido'}`
            );
          }
        }}
        initialData={formInitialData}
      />

      <SalesOrderForm
        isOpen={isSalesOrderFormOpen}
        onClose={() => setIsSalesOrderFormOpen(false)}
        onSubmit={async (formData) => {
          try {
            const { error } = await supabase
              .from('pedidos_venda')
              .update({
                numero: formData.numero,
                cliente_id: formData.cliente_id || formData.parceiro_id,
                data_pedido: formData.data_pedido,
                data_entrega_prevista: formData.data_entrega_prevista || null,
                valor_total: parseFloat(formData.valor_total) || 0,
                status: formData.status,
                observacoes: formData.observacoes || null,
              })
              .eq('id', formInitialData.id);
            if (error) {
              throw error;
            }
            setIsSalesOrderFormOpen(false);
            toast.success('Pedido de venda atualizado com sucesso!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar pedido de venda:', err);
            toast.error(`Erro ao atualizar pedido de venda: ${err.message || 'Erro desconhecido'}`);
          }
        }}
        initialData={formInitialData}
      />

      <SidePanel
        isOpen={isDynamicFormOpen}
        onClose={() => setIsDynamicFormOpen(false)}
        title={`Editar Registro: ${MODULE_LABELS[dynamicFormTableName] || dynamicFormTableName}`}
        subtitle="Visualização e alteração direta dos campos salvos no log"
        icon={Database}
        submitLabel="Salvar Alterações"
        loading={isSavingDynamic}
        size="large"
        onSubmit={async (e) => {
          e.preventDefault();
          setIsSavingDynamic(true);
          try {
            const { error } = await supabase.from(dynamicFormTableName).upsert(formInitialData);
            if (error) {
              throw error;
            }
            setIsDynamicFormOpen(false);
            toast.success('Registro original atualizado com sucesso no banco de dados!');
          } catch (err: any) {
            console.error('[AuditLog] Erro ao salvar registro dinâmico:', err);
            toast.error(`Erro ao atualizar registro: ${err.message || 'Erro desconhecido'}`);
          } finally {
            setIsSavingDynamic(false);
          }
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px',
            width: '100%',
          }}
        >
          {formInitialData &&
            Object.keys(formInitialData)
              .filter(
                (key) =>
                  key !== 'id' &&
                  key !== 'tenant_id' &&
                  key !== 'created_at' &&
                  key !== 'updated_at' &&
                  typeof formInitialData[key] !== 'object'
              )
              .map((key) => {
                const FIELD_LABELS: Record<string, string> = {
                  id: 'ID do Registro',
                  tenant_id: 'ID do Tenant',
                  farm_id: 'ID da Fazenda',
                  created_at: 'Criado em',
                  updated_at: 'Atualizado em',
                  nome: 'Nome',
                  descricao: 'Descrição',
                  status: 'Status',
                  codigo: 'Código',
                  observacoes: 'Observações',
                  brinco: 'Brinco',
                  raca: 'Raça',
                  sexo: 'Sexo',
                  data_nascimento: 'Data de Nascimento',
                  peso_inicial: 'Peso Inicial (kg)',
                  lote_id: 'ID do Lote',
                  pelagem: 'Pelagem',
                  origem: 'Origem',
                  mae_brinco: 'Brinco da Mãe',
                  pai_brinco: 'Brinco do Pai',
                  valor_compra: 'Valor de Compra',
                  categoria: 'Categoria',
                  finalidade: 'Finalidade',
                  area: 'Área (ha)',
                  capacidade: 'Capacidade (U.A.)',
                  tipo_pasto: 'Tipo de Pasto',
                  valor_total: 'Valor Total',
                  data_vencimento: 'Data de Vencimento',
                  data_pagamento: 'Data de Pagamento',
                  metodo_pagamento: 'Método de Pagamento',
                  conta_bancaria_id: 'ID da Conta Bancária',
                  parceiro_id: 'ID do Parceiro',
                  marca: 'Marca',
                  modelo: 'Modelo',
                  placa: 'Placa',
                  ano: 'Ano de Fabricação',
                  horimetro_inicial: 'Horímetro Inicial',
                  km_inicial: 'KM Inicial',
                  cnpj_cpf: 'CNPJ / CPF',
                  cnpj: 'CNPJ',
                  cpf: 'CPF',
                  email: 'E-mail',
                  telefone: 'Telefone',
                  contato: 'Pessoa de Contato',
                  cep: 'CEP',
                  logradouro: 'Logradouro',
                  numero: 'Número',
                  complemento: 'Complemento',
                  bairro: 'Bairro',
                  cidade: 'Cidade',
                  estado: 'Estado',
                };

                const label =
                  FIELD_LABELS[key] ||
                  key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                const val = formInitialData[key];

                if (typeof val === 'boolean') {
                  return (
                    <div
                      key={key}
                      className="tauze-input-group"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        gridColumn: 'span 1',
                      }}
                    >
                      <input
                        type="checkbox"
                        id={`dyn-${key}`}
                        checked={val}
                        onChange={(e) =>
                          setFormInitialData({ ...formInitialData, [key]: e.target.checked })
                        }
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                      />
                      <label
                        htmlFor={`dyn-${key}`}
                        style={{ margin: 0, cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}
                      >
                        {label}
                      </label>
                    </div>
                  );
                }

                const isDate =
                  key.includes('data') || key.includes('vencimento') || key.includes('nascimento');

                return (
                  <div key={key} className="tauze-input-group">
                    <label
                      style={{
                        fontWeight: 600,
                        fontSize: '12px',
                        color: 'hsl(var(--text-muted))',
                        marginBottom: '6px',
                        display: 'block',
                      }}
                    >
                      {label}
                    </label>
                    <input
                      type={isDate ? 'date' : typeof val === 'number' ? 'number' : 'text'}
                      value={
                        val !== null && val !== undefined
                          ? isDate
                            ? val.toString().substring(0, 10)
                            : val.toString()
                          : ''
                      }
                      onChange={(e) => {
                        const inputVal = e.target.value;
                        setFormInitialData({
                          ...formInitialData,
                          [key]: typeof val === 'number' ? parseFloat(inputVal) || 0 : inputVal,
                        });
                      }}
                      className="tauze-input"
                      style={{ width: '100%' }}
                    />
                  </div>
                );
              })}

          {formInitialData && (
            <div
              style={{
                gridColumn: '1 / -1',
                marginTop: '20px',
                padding: '14px',
                borderRadius: '12px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                fontSize: '11px',
                color: '#64748b',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '8px',
              }}
            >
              {formInitialData.id && (
                <div>
                  <strong>ID do Registro:</strong> {formInitialData.id}
                </div>
              )}
              {formInitialData.created_at && (
                <div>
                  <strong>Criado em:</strong>{' '}
                  {new Date(formInitialData.created_at).toLocaleString('pt-BR')}
                </div>
              )}
              {formInitialData.updated_at && (
                <div>
                  <strong>Atualizado em:</strong>{' '}
                  {new Date(formInitialData.updated_at).toLocaleString('pt-BR')}
                </div>
              )}
            </div>
          )}
        </div>
      </SidePanel>

      <style>{`
        .premium-card.audit-card {
          transition: none !important;
        }
        .premium-card.audit-card:hover {
          transform: none !important;
          box-shadow: none !important;
          border-color: hsl(var(--border)) !important;
        }

        .audit-entry {
          display: flex; align-items: center; gap: 12px;
          padding: 10px 14px; border-radius: 12px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); cursor: default;
        }
        .audit-entry.interactive { cursor: pointer; }
        .audit-entry.interactive:hover { 
          background: hsl(var(--bg-main)); 
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
        }

        .audit-entry.interactive:hover .audit-jump-action {
          opacity: 1;
        }

        .audit-jump-action {
          opacity: 0;
          transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: white; background: hsl(var(--brand));
          padding: 4px 10px; border-radius: 8px;
          display: flex; align-items: center; gap: 4px;
          font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em;
          flex-shrink: 0; margin-left: 12px;
        }

        .audit-entry-icon {
          width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
        }

        .audit-entry-body { flex: 1; min-width: 0; }

        .audit-entry-row {
          display: flex; align-items: center; gap: 6px;
          margin-bottom: 2px; overflow: hidden;
        }

        .audit-module-name {
          font-size: 0.7rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: hsl(var(--text-main)); white-space: nowrap;
        }

        .audit-action-pill {
          display: flex; align-items: center; gap: 3px; flex-shrink: 0;
          font-size: 0.6rem; font-weight: 900;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 2px 7px; border-radius: 20px;
        }

        .audit-dot {
          color: hsl(var(--text-muted)); font-size: 0.7rem; flex-shrink: 0;
        }

        .audit-user-tag {
          display: flex; align-items: center; gap: 3px; flex-shrink: 0;
          font-size: 0.67rem; font-weight: 700;
          color: hsl(var(--brand));
        }

        .audit-timestamp {
          margin-left: auto; flex-shrink: 0;
          display: flex; align-items: center; gap: 3px;
          font-size: 0.67rem; font-weight: 600;
          color: hsl(var(--text-muted)); white-space: nowrap;
        }

        .audit-details-indicator {
          display: flex; align-items: center; gap: 4px;
          padding: 2px 8px; border-radius: 4px;
          background: hsl(var(--brand) / 0.05);
          color: hsl(var(--brand));
          font-size: 0.65rem; font-weight: 800;
          text-transform: uppercase; letter-spacing: 0.05em;
          margin-left: auto;
        }

        .audit-desc {
          font-size: 0.78rem; font-weight: 500;
          color: hsl(var(--text-main));
          margin: 0; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
        }

        .audit-sublabel {
          font-size: 0.72rem; font-weight: 500;
          color: hsl(var(--text-muted));
          white-space: nowrap;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 0.8s linear infinite; }

        /* Estilos do Dossiê Visual */
        .dossier-tab-header {
          display: flex; gap: 8px;
          border-bottom: 1px solid hsl(var(--border));
          padding-bottom: 12px; margin-bottom: 16px;
          grid-column: span 2;
        }
        .dossier-tab-btn {
          padding: 6px 12px; border-radius: 8px;
          font-size: 0.75rem; font-weight: 700;
          cursor: pointer; transition: all 0.2s;
          background: transparent; border: 1px solid transparent;
          color: hsl(var(--text-muted));
        }
        .dossier-tab-btn.active {
          background: hsl(var(--brand) / 0.08);
          border-color: hsl(var(--brand) / 0.2);
          color: hsl(var(--brand));
        }

        .dossier-slip {
          padding: 24px; border-radius: 16px;
          background: linear-gradient(135deg, hsl(var(--bg-main)) 0%, hsl(var(--bg-sidebar)) 100%);
          border: 1.5px dashed hsl(var(--brand) / 0.25);
          display: flex; flex-direction: column; gap: 12px;
          grid-column: span 2; position: relative;
          box-shadow: 0 8px 32px rgba(0,0,0,0.02);
        }
        .dossier-slip::before {
          content: ''; position: absolute;
          top: -1px; left: 10%; right: 10%; height: 2px;
          background: linear-gradient(90deg, transparent, hsl(var(--brand) / 0.5), transparent);
        }
        .dossier-slip-header {
          display: flex; justify-content: space-between; align-items: center;
        }
        .dossier-slip-category {
          font-size: 0.65rem; font-weight: 950;
          text-transform: uppercase; letter-spacing: 0.08em;
          color: hsl(var(--text-muted));
        }
        .dossier-slip-amount {
          display: flex; align-items: baseline; gap: 6px;
          justify-content: center; padding: 12px 0;
          border-bottom: 1px solid hsl(var(--border));
          margin-bottom: 6px;
        }
        .dossier-slip-amount .currency {
          font-size: 1.1rem; font-weight: 800; color: hsl(var(--text-muted));
        }
        .dossier-slip-amount .value {
          font-size: 2.2rem; font-weight: 950; color: hsl(var(--text-main));
          letter-spacing: -0.02em;
        }
        .dossier-slip-desc {
          font-size: 0.85rem; font-weight: 750; color: hsl(var(--text-main));
          text-align: center;
        }
        .dossier-slip-footer {
          display: flex; flex-direction: column; gap: 8px;
          background: hsl(var(--bg-main) / 0.4);
          padding: 12px; border-radius: 12px;
          border: 1px solid hsl(var(--border));
          margin-top: 8px;
        }
        .dossier-slip-meta-item {
          display: flex; justify-content: space-between; font-size: 0.72rem;
        }
        .dossier-slip-meta-item .meta-label {
          color: hsl(var(--text-muted)); font-weight: 600;
        }
        .dossier-slip-meta-item .meta-val {
          color: hsl(var(--text-main)); font-weight: 700;
        }

        .diff-grid-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-top: 20px; margin-bottom: 12px; grid-column: span 2;
        }
        .diff-grid-title {
          font-size: 0.72rem; font-weight: 950;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
        }

        .diff-table {
          width: 100%; border-collapse: separate; border-spacing: 0;
          grid-column: span 2; border: 1px solid hsl(var(--border));
          border-radius: 12px; overflow: hidden;
          background: hsl(var(--bg-sidebar) / 0.5);
        }
        .diff-table th {
          background: hsl(var(--bg-sidebar));
          padding: 10px 14px; text-align: left;
          font-size: 0.67rem; font-weight: 850;
          text-transform: uppercase; letter-spacing: 0.05em;
          color: hsl(var(--text-muted));
          border-bottom: 1px solid hsl(var(--border));
        }
        .diff-table td {
          padding: 12px 14px; font-size: 0.75rem;
          border-bottom: 1px solid hsl(var(--border));
        }
        .diff-table tr:last-child td {
          border-bottom: none;
        }
        .diff-row-changed {
          background: hsl(var(--brand) / 0.02);
        }
        .diff-badge {
          display: inline-block; padding: 2px 6px; border-radius: 6px;
          font-family: monospace; font-size: 0.7rem; font-weight: 600;
        }
        .diff-badge.old {
          background: hsl(var(--destructive) / 0.08);
          color: hsl(var(--destructive));
          text-decoration: line-through;
        }
        .diff-badge.new {
          background: hsl(161 64% 39% / 0.08);
          color: hsl(161 64% 39%);
        }
      `}</style>
    </div>
  );
};
