import React, { useState } from 'react';
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
import './NovoRegistroSanitario.css';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FarmacoItem {
  id: string;
  produto: string;
  dose: string;
  unidade: string;
  via: string;
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

// ─── Select Options ───────────────────────────────────────────────────────────

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

// ─── Etapa 0 — Contexto e Alvos ───────────────────────────────────────────────

const EtapaContexto: React.FC = () => (
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
        <label className="nrs-label">Tipo de Manejo</label>
        <div className="nrs-select-wrapper">
          <select className="nrs-select">
            <option>Vacinação</option>
            <option>Medicamento</option>
            <option>Tratamento</option>
            <option>Exame / Diagnóstico</option>
          </select>
          <ChevronDown size={14} className="nrs-select-icon" />
        </div>
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Data do Manejo</label>
        <input
          type="date"
          className="nrs-input"
          defaultValue={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Status</label>
        <div className="nrs-select-wrapper">
          <select className="nrs-select">
            <option>Realizado</option>
            <option>Agendado</option>
            <option>Em andamento</option>
          </select>
          <ChevronDown size={14} className="nrs-select-icon" />
        </div>
      </div>
    </div>

    <div className="nrs-form-grid nrs-form-grid-2">
      <div className="nrs-field">
        <label className="nrs-label">Responsável Técnico</label>
        <input type="text" className="nrs-input" placeholder="Nome do veterinário ou responsável" />
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Fazenda</label>
        <div className="nrs-select-wrapper">
          <select className="nrs-select">
            <option>Fazenda Boa Vista</option>
            <option>Fazenda São João</option>
          </select>
          <ChevronDown size={14} className="nrs-select-icon" />
        </div>
      </div>
    </div>

    <div className="nrs-divider" />

    <div className="nrs-section-label">
      <Users size={14} />
      <span>Alvos do Manejo</span>
    </div>

    <div className="nrs-form-grid nrs-form-grid-2">
      <div className="nrs-field">
        <label className="nrs-label">Tipo de Alvo</label>
        <div className="nrs-select-wrapper">
          <select className="nrs-select">
            <option>Animais individuais</option>
            <option>Lote</option>
            <option>Piquete / Pasto</option>
          </select>
          <ChevronDown size={14} className="nrs-select-icon" />
        </div>
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Selecionar Lote</label>
        <div className="nrs-select-wrapper">
          <select className="nrs-select">
            <option>Lote Terminação A — 12 animais</option>
            <option>Lote Cria 01 — 38 animais</option>
            <option>Lote Recria Sul — 25 animais</option>
          </select>
          <ChevronDown size={14} className="nrs-select-icon" />
        </div>
      </div>
    </div>

    <div className="nrs-field">
      <label className="nrs-label">Observação Geral</label>
      <textarea
        className="nrs-textarea"
        rows={3}
        placeholder="Contexto adicional, condições climáticas, estado geral do rebanho..."
      />
    </div>
  </motion.div>
);

// ─── Etapa 1 — Fármacos e Procedimento ───────────────────────────────────────

interface EtapaFarmacosProps {
  items: FarmacoItem[];
  onAdd: (item: FarmacoItem) => void;
  onEdit: (item: FarmacoItem) => void;
  onDelete: (id: string) => void;
}

const FARMACO_EMPTY: Omit<FarmacoItem, 'id'> = {
  produto: '',
  dose: '',
  unidade: 'mL',
  via: 'Subcutânea (SC)',
  deposito: '',
  lote: '',
  frequencia: 'Dose única',
};

const EtapaFarmacos: React.FC<EtapaFarmacosProps> = ({ items, onAdd, onEdit, onDelete }) => {
  const [form, setForm] = useState<Omit<FarmacoItem, 'id'>>(FARMACO_EMPTY);
  const [editId, setEditId] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.produto.trim()) {
      toast.error('Informe o nome do produto ou vacina.');
      return;
    }
    if (!form.dose.trim()) {
      toast.error('Informe a dose.');
      return;
    }

    if (editId) {
      onEdit({ ...form, id: editId });
      setEditId(null);
    } else {
      onAdd({ ...form, id: crypto.randomUUID() });
    }
    setForm(FARMACO_EMPTY);
    toast.success(editId ? 'Item atualizado.' : 'Item adicionado.');
  };

  const handleEditClick = (item: FarmacoItem) => {
    const { id, ...rest } = item;
    setForm(rest);
    setEditId(id);
  };

  const handleCancel = () => {
    setForm(FARMACO_EMPTY);
    setEditId(null);
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
        <h2 className="nrs-step-title">Fármacos e Procedimento</h2>
        <p className="nrs-step-subtitle">
          Informe medicamentos, vacinas, dosagens e via de aplicação.
        </p>
      </div>

      {/* ── Formulário de adição ─────────────────────────────────────────── */}
      <div className="nrs-farmaco-form">
        <div className="nrs-farmaco-form-header">
          <div className="nrs-section-label">
            <FlaskConical size={14} />
            <span>{editId ? 'Editar Item' : 'Adicionar Item'}</span>
          </div>
          {editId && (
            <button className="nrs-cancel-edit-btn" onClick={handleCancel}>
              <X size={13} />
              Cancelar edição
            </button>
          )}
        </div>

        <div className="nrs-form-grid nrs-form-grid-3">
          {/* Produto */}
          <div className="nrs-field nrs-field-wide">
            <label className="nrs-label">
              <Package size={12} />
              Produto / Vacina
            </label>
            <input
              type="text"
              className="nrs-input"
              placeholder="Ex: Aftovac, Ivermectina 1%..."
              value={form.produto}
              onChange={(e) => handleChange('produto', e.target.value)}
            />
          </div>

          {/* Dose */}
          <div className="nrs-field">
            <label className="nrs-label">
              <Droplets size={12} />
              Dose
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="nrs-input"
              placeholder="Ex: 2.5"
              value={form.dose}
              onChange={(e) => handleChange('dose', e.target.value)}
            />
          </div>

          {/* Unidade */}
          <div className="nrs-field">
            <label className="nrs-label">Unidade</label>
            <div className="nrs-select-wrapper">
              <select
                className="nrs-select"
                value={form.unidade}
                onChange={(e) => handleChange('unidade', e.target.value)}
              >
                {UNIDADE_OPTIONS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
              <ChevronDown size={14} className="nrs-select-icon" />
            </div>
          </div>
        </div>

        <div className="nrs-form-grid nrs-form-grid-4">
          {/* Via */}
          <div className="nrs-field">
            <label className="nrs-label">Via de Aplicação</label>
            <div className="nrs-select-wrapper">
              <select
                className="nrs-select"
                value={form.via}
                onChange={(e) => handleChange('via', e.target.value)}
              >
                {VIA_OPTIONS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
              <ChevronDown size={14} className="nrs-select-icon" />
            </div>
          </div>

          {/* Depósito */}
          <div className="nrs-field">
            <label className="nrs-label">
              <Warehouse size={12} />
              Depósito de Saída
            </label>
            <input
              type="text"
              className="nrs-input"
              placeholder="Ex: Almoxarifado Central"
              value={form.deposito}
              onChange={(e) => handleChange('deposito', e.target.value)}
            />
          </div>

          {/* Lote */}
          <div className="nrs-field">
            <label className="nrs-label">
              <Hash size={12} />
              Lote do Produto
            </label>
            <input
              type="text"
              className="nrs-input"
              placeholder="Ex: LT-2024-001"
              value={form.lote}
              onChange={(e) => handleChange('lote', e.target.value)}
            />
          </div>

          {/* Frequência */}
          <div className="nrs-field">
            <label className="nrs-label">
              <RefreshCw size={12} />
              Frequência
            </label>
            <div className="nrs-select-wrapper">
              <select
                className="nrs-select"
                value={form.frequencia}
                onChange={(e) => handleChange('frequencia', e.target.value)}
              >
                {FREQUENCIA_OPTIONS.map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
              <ChevronDown size={14} className="nrs-select-icon" />
            </div>
          </div>
        </div>

        <div className="nrs-add-row">
          <button className="nrs-add-btn" onClick={handleSubmit}>
            <Plus size={15} />
            {editId ? 'Salvar Alterações' : 'Adicionar Item'}
          </button>
        </div>
      </div>

      {/* ── Tabela de itens ──────────────────────────────────────────────── */}
      {items.length > 0 && (
        <div className="nrs-items-section">
          <div className="nrs-section-label">
            <Activity size={14} />
            <span>Itens Adicionados ({items.length})</span>
          </div>

          <div className="nrs-table-wrapper">
            <table className="nrs-table">
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Dose</th>
                  <th>Unidade</th>
                  <th>Via</th>
                  <th>Depósito</th>
                  <th>Lote</th>
                  <th>Frequência</th>
                  <th className="nrs-th-actions">Ações</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.18 }}
                      className={editId === item.id ? 'nrs-row-editing' : ''}
                    >
                      <td className="nrs-td-produto">
                        <div className="nrs-produto-cell">
                          <span className="nrs-produto-dot" />
                          {item.produto}
                        </div>
                      </td>
                      <td className="nrs-td-number">{item.dose}</td>
                      <td>
                        <span className="nrs-badge nrs-badge-unit">{item.unidade}</span>
                      </td>
                      <td>{item.via}</td>
                      <td className="nrs-td-muted">{item.deposito || '—'}</td>
                      <td className="nrs-td-muted">{item.lote || '—'}</td>
                      <td>{item.frequencia}</td>
                      <td>
                        <div className="nrs-action-btns">
                          <button
                            className="nrs-icon-btn nrs-icon-btn-edit"
                            onClick={() => handleEditClick(item)}
                            title="Editar"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            className="nrs-icon-btn nrs-icon-btn-delete"
                            onClick={() => {
                              onDelete(item.id);
                              if (editId === item.id) handleCancel();
                              toast.success('Item removido.');
                            }}
                            title="Excluir"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length === 0 && (
        <div className="nrs-empty-items">
          <FlaskConical size={28} className="nrs-empty-icon" />
          <p>Nenhum produto adicionado ainda.</p>
          <span>Preencha o formulário acima e clique em "Adicionar Item".</span>
        </div>
      )}
    </motion.div>
  );
};

// ─── Etapa 2 — Carência e Alertas ────────────────────────────────────────────

const EtapaCarencia: React.FC = () => (
  <motion.div
    key="etapa-2"
    initial={{ opacity: 0, x: 16 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -16 }}
    transition={{ duration: 0.22, ease: 'easeOut' }}
    className="nrs-step-content"
  >
    <div className="nrs-step-header">
      <h2 className="nrs-step-title">Carência e Alertas</h2>
      <p className="nrs-step-subtitle">
        Defina os períodos de carência e configure alertas automáticos para o rebanho.
      </p>
    </div>

    <div className="nrs-carencia-alert-box">
      <AlertTriangle size={16} className="nrs-carencia-alert-icon" />
      <div>
        <strong>Atenção: Período de Carência</strong>
        <p>
          Animais em período de carência não podem ser abatidos. O sistema bloqueará
          automaticamente esses animais no módulo de Romaneio.
        </p>
      </div>
    </div>

    <div className="nrs-form-grid nrs-form-grid-3">
      <div className="nrs-field">
        <label className="nrs-label">
          <Clock size={12} />
          Carência para Abate (dias)
        </label>
        <input type="number" min="0" className="nrs-input" placeholder="Ex: 21" defaultValue="0" />
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Carência para Leite (dias)</label>
        <input type="number" min="0" className="nrs-input" placeholder="Ex: 7" defaultValue="0" />
      </div>

      <div className="nrs-field">
        <label className="nrs-label">Data de Liberação Prevista</label>
        <input type="date" className="nrs-input" />
      </div>
    </div>

    <div className="nrs-divider" />

    <div className="nrs-section-label">
      <Activity size={14} />
      <span>Alertas e Notificações</span>
    </div>

    <div className="nrs-check-grid">
      <label className="nrs-check-item">
        <input type="checkbox" className="nrs-checkbox" defaultChecked />
        <div className="nrs-check-box" />
        <div className="nrs-check-content">
          <span className="nrs-check-title">Notificar fim da carência</span>
          <span className="nrs-check-desc">
            Receba um alerta quando o período de carência for encerrado.
          </span>
        </div>
      </label>

      <label className="nrs-check-item">
        <input type="checkbox" className="nrs-checkbox" />
        <div className="nrs-check-box" />
        <div className="nrs-check-content">
          <span className="nrs-check-title">Bloquear no Romaneio</span>
          <span className="nrs-check-desc">
            Impede a inclusão destes animais em romaneios de abate durante a carência.
          </span>
        </div>
      </label>

      <label className="nrs-check-item">
        <input type="checkbox" className="nrs-checkbox" />
        <div className="nrs-check-box" />
        <div className="nrs-check-content">
          <span className="nrs-check-title">Gerar documento sanitário</span>
          <span className="nrs-check-desc">
            Exporta automaticamente o registro em formato PDF ao salvar.
          </span>
        </div>
      </label>
    </div>

    <div className="nrs-divider" />

    <div className="nrs-field">
      <label className="nrs-label">Observações Técnicas</label>
      <textarea
        className="nrs-textarea"
        rows={4}
        placeholder="Reações observadas, condições especiais, próximas doses programadas..."
      />
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const NovoRegistroSanitario: React.FC = () => {
  const navigate = useNavigate();
  const [etapaAtual, setEtapaAtual] = useState<Etapa>(1);
  const [farmacos, setFarmacos] = useState<FarmacoItem[]>([]);
  const [salvando, setSalvando] = useState(false);

  const handlePrev = () => {
    if (etapaAtual > 0) setEtapaAtual((e) => (e - 1) as Etapa);
  };

  const handleNext = () => {
    if (etapaAtual < 2) setEtapaAtual((e) => (e + 1) as Etapa);
  };

  const handleSave = async () => {
    if (farmacos.length === 0) {
      toast.error('Adicione pelo menos um produto na etapa de Fármacos antes de salvar.');
      return;
    }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success('Registro sanitário salvo com sucesso.');
    setSalvando(false);
    navigate('/pecuaria/sanidade');
  };

  const handleCancel = () => {
    navigate('/pecuaria/sanidade');
  };

  // Verificação de completude de etapas
  const etapaCompleta = (e: Etapa): boolean => {
    if (e === 0) return true; // demo
    if (e === 1) return farmacos.length > 0;
    if (e === 2) return false;
    return false;
  };

  return (
    <div className="nrs-root">
      {/* ── Cabeçalho da página ───────────────────────────────────────────── */}
      <div className="nrs-page-header">
        <Breadcrumb
          paths={[
            { label: 'Sanidade', href: '/pecuaria/sanidade' },
            { label: 'Registros', href: '/pecuaria/sanidade' },
            { label: 'Novo Registro Sanitário' },
          ]}
        />

        <div className="nrs-header-content">
          <div className="nrs-header-text">
            <div className="nrs-header-icon-wrap">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="nrs-page-title">Novo Registro Sanitário</h1>
              <p className="nrs-page-subtitle">
                Registre vacinas, medicamentos ou tratamentos realizados no rebanho.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards de Contexto ─────────────────────────────────────────────── */}
      <div className="nrs-context-cards">
        <div className="nrs-context-card">
          <div className="nrs-context-card-icon nrs-ctx-green">
            <CheckCircle2 size={15} />
          </div>
          <div className="nrs-context-card-body">
            <span className="nrs-context-card-label">Status Atual</span>
            <span className="nrs-context-card-value">Realizado</span>
          </div>
        </div>

        <div className="nrs-context-card">
          <div className="nrs-context-card-icon nrs-ctx-blue">
            <Clock size={15} />
          </div>
          <div className="nrs-context-card-body">
            <span className="nrs-context-card-label">Carência Prevista</span>
            <span className="nrs-context-card-value">0 dias</span>
          </div>
        </div>

        <div className="nrs-context-card">
          <div className="nrs-context-card-icon nrs-ctx-amber">
            <Users size={15} />
          </div>
          <div className="nrs-context-card-body">
            <span className="nrs-context-card-label">Animais / Lotes Alvo</span>
            <span className="nrs-context-card-value">12 animais</span>
          </div>
        </div>

        <div className="nrs-context-card">
          <div className="nrs-context-card-icon nrs-ctx-violet">
            <FlaskConical size={15} />
          </div>
          <div className="nrs-context-card-body">
            <span className="nrs-context-card-label">Produtos Adicionados</span>
            <span className="nrs-context-card-value">{farmacos.length} produto{farmacos.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>

      {/* ── Layout principal ──────────────────────────────────────────────── */}
      <div className="nrs-main-layout">
        {/* Stepper lateral */}
        <aside className="nrs-stepper">
          <div className="nrs-stepper-inner">
            <p className="nrs-stepper-label">Progresso</p>

            {ETAPAS.map((etapa, idx) => {
              const isActive = etapaAtual === idx;
              const isDone = etapaAtual > idx || etapaCompleta(idx as Etapa);
              const isPast = etapaAtual > idx;
              const Icon = etapa.icon;

              return (
                <React.Fragment key={etapa.id}>
                  <button
                    className={`nrs-step-item ${isActive ? 'nrs-step-active' : ''} ${isPast ? 'nrs-step-done' : ''}`}
                    onClick={() => setEtapaAtual(idx as Etapa)}
                  >
                    <div className="nrs-step-icon-wrap">
                      {isPast ? (
                        <CheckCircle2 size={16} />
                      ) : (
                        <Icon size={16} />
                      )}
                    </div>
                    <div className="nrs-step-text">
                      <span className="nrs-step-name">{etapa.nome}</span>
                      <span className="nrs-step-desc">{etapa.descricao}</span>
                    </div>
                    {isActive && <ChevronRight size={14} className="nrs-step-chevron" />}
                  </button>

                  {idx < ETAPAS.length - 1 && (
                    <div className={`nrs-step-connector ${isPast ? 'nrs-connector-done' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Barra de progresso */}
          <div className="nrs-progress-bar-wrap">
            <div className="nrs-progress-info">
              <span>Etapa {etapaAtual + 1} de {ETAPAS.length}</span>
              <span>{Math.round(((etapaAtual) / (ETAPAS.length - 1)) * 100)}%</span>
            </div>
            <div className="nrs-progress-track">
              <motion.div
                className="nrs-progress-fill"
                animate={{ width: `${(etapaAtual / (ETAPAS.length - 1)) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        </aside>

        {/* Área principal */}
        <main className="nrs-main-area">
          <AnimatePresence mode="wait">
            {etapaAtual === 0 && <EtapaContexto key="etapa-contexto" />}
            {etapaAtual === 1 && (
              <EtapaFarmacos
                key="etapa-farmacos"
                items={farmacos}
                onAdd={(item) => setFarmacos((p) => [...p, item])}
                onEdit={(updated) =>
                  setFarmacos((p) => p.map((i) => (i.id === updated.id ? updated : i)))
                }
                onDelete={(id) => setFarmacos((p) => p.filter((i) => i.id !== id))}
              />
            )}
            {etapaAtual === 2 && <EtapaCarencia key="etapa-carencia" />}
          </AnimatePresence>
        </main>
      </div>

      {/* ── Rodapé fixo ───────────────────────────────────────────────────── */}
      <footer className="nrs-footer">
        <div className="nrs-footer-inner">
          <button className="nrs-btn nrs-btn-ghost" onClick={handleCancel}>
            <X size={15} />
            Cancelar
          </button>

          <div className="nrs-footer-nav">
            <button
              className="nrs-btn nrs-btn-secondary"
              onClick={handlePrev}
              disabled={etapaAtual === 0}
            >
              <ArrowLeft size={15} />
              Anterior
            </button>

            {etapaAtual < 2 ? (
              <button className="nrs-btn nrs-btn-primary" onClick={handleNext}>
                Próximo
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                className="nrs-btn nrs-btn-success"
                onClick={handleSave}
                disabled={salvando}
              >
                {salvando ? (
                  <>
                    <span className="nrs-spinner" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={15} />
                    Salvar Registro
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NovoRegistroSanitario;
