import toast from "react-hot-toast";
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Fuse from 'fuse.js';
import {
  Search,
  Command,
  ArrowRight,
  X,
  LayoutDashboard,
  Settings,
  Users,
  Activity,
  Truck,
  ShoppingCart,
  TrendingUp,
  Package,
  Wallet,
  Globe,
  FileText,
  Building2,
  Plus,
  DollarSign,
  Moon,
  MapPin,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useTenant } from '../../contexts/TenantContext';
import { formatShortcut } from '../../utils/keyboard';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

type CommandAction = () => void | Promise<void>;

interface CommandItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ size?: number }>;
  path?: string;
  action?: CommandAction;
  category: string;
  keywords?: string[];
  shortcut?: string;
}

const COMMANDS: CommandItem[] = [
  // Quick Navigation - Major Modules
  {
    id: 'nav-dashboard',
    title: 'Ir para Dashboard',
    icon: LayoutDashboard,
    path: '/painel',
    category: 'Navegação Rápida',
    keywords: ['dashboard', 'painel', 'home', 'início', 'principal'],
    shortcut: '⌘+1',
  },
  {
    id: 'nav-pecuaria',
    title: 'Abrir Pecuária',
    icon: Activity,
    path: '/pecuaria/dashboard',
    category: 'Navegação Rápida',
    keywords: ['pecuária', 'animais', 'gado', 'rebanho', 'livestock', 'bovinos'],
    shortcut: '⌘+2',
  },
  {
    id: 'nav-financeiro',
    title: 'Abrir Financeiro',
    icon: Wallet,
    path: '/financeiro/intelligence',
    category: 'Navegação Rápida',
    keywords: ['financeiro', 'finance', 'contas', 'pagamento', 'receita', 'despesa'],
    shortcut: '⌘+3',
  },
  {
    id: 'nav-estoque',
    title: 'Abrir Estoque',
    icon: Package,
    path: '/estoque/dashboard',
    category: 'Navegação Rápida',
    keywords: ['estoque', 'inventory', 'insumos', 'produtos', 'materiais'],
    shortcut: '⌘+4',
  },
  {
    id: 'nav-frota',
    title: 'Abrir Frota',
    icon: Truck,
    path: '/frota/dashboard',
    category: 'Navegação Rápida',
    keywords: ['frota', 'fleet', 'máquinas', 'equipamentos', 'veículos', 'abastecimento'],
    shortcut: '⌘+5',
  },
  {
    id: 'nav-compras',
    title: 'Abrir Compras',
    icon: ShoppingCart,
    path: '/compras/dashboard',
    category: 'Navegação Rápida',
    keywords: ['compras', 'purchases', 'fornecedores', 'pedidos', 'cotação'],
    shortcut: '⌘+6',
  },
  {
    id: 'nav-vendas',
    title: 'Abrir Vendas',
    icon: TrendingUp,
    path: '/vendas/dashboard',
    category: 'Navegação Rápida',
    keywords: ['vendas', 'sales', 'clientes', 'crm', 'pedidos', 'comercial'],
    shortcut: '⌘+7',
  },
  {
    id: 'nav-mercado',
    title: 'Abrir Mercado',
    icon: Globe,
    path: '/mercado/indicadores',
    category: 'Navegação Rápida',
    keywords: ['mercado', 'market', 'indicadores', 'preços', 'cotações', 'cepea'],
    shortcut: '⌘+8',
  },
  {
    id: 'nav-admin',
    title: 'Abrir Administração',
    icon: Settings,
    path: '/admin/intelligence',
    category: 'Navegação Rápida',
    keywords: ['admin', 'administração', 'configurações', 'usuários', 'settings'],
    shortcut: '⌘+9',
  },

  // Quick Business Actions
  {
    id: 'action-register-animal',
    title: 'Registrar novo animal',
    icon: Plus,
    path: '/pecuaria/animal',
    category: 'Ações Rápidas',
    keywords: ['registrar', 'novo', 'animal', 'cadastrar', 'adicionar', 'boi', 'gado'],
    shortcut: '⌘+N',
  },
  {
    id: 'action-launch-payment',
    title: 'Lançar pagamento',
    icon: DollarSign,
    path: '/financeiro/pagar',
    category: 'Ações Rápidas',
    keywords: ['pagamento', 'pagar', 'lançar', 'conta', 'despesa', 'financeiro'],
    shortcut: '⌘+P',
  },
  {
    id: 'action-switch-farm',
    title: 'Alternar fazenda',
    icon: MapPin,
    category: 'Ações Rápidas',
    keywords: ['alternar', 'trocar', 'mudar', 'fazenda', 'propriedade', 'unidade'],
    shortcut: '⌘+F',
  },
  {
    id: 'action-toggle-theme',
    title: 'Modo escuro/claro',
    icon: Moon,
    category: 'Ações Rápidas',
    keywords: ['modo', 'escuro', 'claro', 'tema', 'theme', 'dark', 'light'],
    shortcut: '⌘+T',
  },

  // Dashboard
  {
    id: 'dashboard',
    title: 'Dashboard Executivo',
    icon: LayoutDashboard,
    path: '/painel',
    category: 'Navegação Principal',
    keywords: ['dashboard', 'painel', 'inicio'],
  },

  // Administração
  {
    id: 'admin-intelligence',
    title: 'Intelligence Hub',
    icon: Settings,
    path: '/admin/intelligence',
    category: 'Administração',
    keywords: ['intelligence', 'hub', 'dashboard', 'admin', 'administração', 'painel'],
  },
  {
    id: 'admin-aprovacoes',
    title: 'Aprovações',
    icon: Settings,
    path: '/admin/aprovacoes',
    category: 'Administração',
    keywords: ['aprovações', 'approvals', 'aprovar', 'autorizar', 'workflow'],
  },
  {
    id: 'admin-usuarios',
    title: 'Gestão de Usuários',
    icon: Users,
    path: '/admin/usuarios',
    category: 'Administração',
    keywords: ['usuários', 'users', 'gestão', 'gerenciar', 'pessoas', 'equipe', 'perfis', 'permissões'],
  },
  {
    id: 'admin-empresa',
    title: 'Empresas & Fazendas',
    icon: Building2,
    path: '/admin/config',
    category: 'Administração',
    keywords: ['empresas', 'fazendas', 'propriedades', 'unidades', 'config', 'configuração', 'organização'],
  },
  {
    id: 'admin-config',
    title: 'Configurações',
    icon: Settings,
    path: '/admin/configuracoes',
    category: 'Administração',
    keywords: ['configurações', 'settings', 'config', 'ajustes', 'preferências', 'sistema'],
  },
  {
    id: 'admin-assinatura',
    title: 'Assinatura & Planos',
    icon: Settings,
    path: '/admin/assinatura',
    category: 'Administração',
    keywords: ['assinatura', 'subscription', 'planos', 'plans', 'billing', 'faturamento', 'pagamento'],
  },
  {
    id: 'admin-auditoria',
    title: 'Logs de Auditoria',
    icon: FileText,
    path: '/admin/auditoria',
    category: 'Administração',
    keywords: ['auditoria', 'audit', 'logs', 'histórico', 'registro', 'atividades', 'rastreamento'],
  },

  // Mercado
  {
    id: 'mercado-indicadores',
    title: 'Indicadores de Mercado',
    icon: Globe,
    path: '/mercado/indicadores',
    category: 'Mercado',
  },
  {
    id: 'mercado-analise',
    title: 'Análise Avançada',
    icon: Globe,
    path: '/mercado/analise',
    category: 'Mercado',
  },
  {
    id: 'mercado-sazonalidade',
    title: 'Sazonalidade',
    icon: Globe,
    path: '/mercado/sazonalidade',
    category: 'Mercado',
  },
  {
    id: 'mercado-b3',
    title: 'Calculadora B3',
    icon: Globe,
    path: '/mercado/b3',
    category: 'Mercado',
  },

  // Pecuária
  {
    id: 'pec-dashboard',
    title: 'Dashboard de Pecuária',
    icon: Activity,
    path: '/pecuaria/dashboard',
    category: 'Pecuária',
  },
  {
    id: 'pec-animal',
    title: 'Gestão de Animais',
    icon: Activity,
    path: '/pecuaria/animal',
    category: 'Pecuária',
  },
  {
    id: 'pec-romaneio',
    title: 'Embarques & Romaneios',
    icon: Activity,
    path: '/pecuaria/romaneios',
    category: 'Pecuária',
  },
  {
    id: 'pec-lote',
    title: 'Gestão de Lotes',
    icon: Activity,
    path: '/pecuaria/lote',
    category: 'Pecuária',
  },
  {
    id: 'pec-pasto',
    title: 'Gestão de Pastos',
    icon: Activity,
    path: '/pecuaria/pasto',
    category: 'Pecuária',
  },
  {
    id: 'pec-pesagem',
    title: 'Gestão de Pesagens & GMD',
    icon: Activity,
    path: '/pecuaria/pesagem',
    category: 'Pecuária',
  },
  {
    id: 'pec-confinamento',
    title: 'Confinamento',
    icon: Activity,
    path: '/pecuaria/confinamento',
    category: 'Pecuária',
  },
  {
    id: 'pec-reproducao',
    title: 'Reprodução',
    icon: Activity,
    path: '/pecuaria/reproducao',
    category: 'Pecuária',
  },
  {
    id: 'pec-nutricao',
    title: 'Nutrição',
    icon: Activity,
    path: '/pecuaria/nutricao',
    category: 'Pecuária',
  },
  {
    id: 'pec-sanidade',
    title: 'Sanidade',
    icon: Activity,
    path: '/pecuaria/sanidade',
    category: 'Pecuária',
  },

  // Máquina & Frota
  {
    id: 'frota-dashboard',
    title: 'Dashboard de Frota',
    icon: Truck,
    path: '/frota/dashboard',
    category: 'Máquina & Frota',
  },
  {
    id: 'frota-maquina',
    title: 'Máquinas & Equipamentos',
    icon: Truck,
    path: '/frota/maquina',
    category: 'Máquina & Frota',
  },
  {
    id: 'frota-abastecimento',
    title: 'Abastecimentos',
    icon: Truck,
    path: '/frota/abastecimento',
    category: 'Máquina & Frota',
  },
  {
    id: 'frota-manutencao',
    title: 'Manutenções',
    icon: Truck,
    path: '/frota/manutencao',
    category: 'Máquina & Frota',
  },

  // Compra & Cotação
  {
    id: 'compras-dashboard',
    title: 'Dashboard de Compras',
    icon: ShoppingCart,
    path: '/compras/dashboard',
    category: 'Compras',
  },
  {
    id: 'compras-fornecedor',
    title: 'Fornecedores',
    icon: Users,
    path: '/compras/fornecedores',
    category: 'Compras',
  },
  {
    id: 'compras-solicitacao',
    title: 'Solicitações de Compra',
    icon: ShoppingCart,
    path: '/compras/solicitacao',
    category: 'Compras',
  },
  {
    id: 'compras-cotacao',
    title: 'Mapas de Cotação',
    icon: ShoppingCart,
    path: '/compras/cotacao',
    category: 'Compras',
  },
  {
    id: 'compras-pedido',
    title: 'Pedidos de Compra',
    icon: ShoppingCart,
    path: '/compras/pedido',
    category: 'Compras',
  },
  {
    id: 'compras-nota',
    title: 'Notas Fiscais de Entrada',
    icon: FileText,
    path: '/compras/nota',
    category: 'Compras',
  },

  // Venda & CRM
  {
    id: 'vendas-dashboard',
    title: 'Dashboard de Vendas',
    icon: TrendingUp,
    path: '/vendas/dashboard',
    category: 'Vendas & CRM',
  },
  {
    id: 'vendas-cliente',
    title: 'Clientes',
    icon: Users,
    path: '/vendas/parceiros',
    category: 'Vendas & CRM',
  },
  {
    id: 'vendas-pedido',
    title: 'Pedidos de Venda',
    icon: TrendingUp,
    path: '/vendas/pedido',
    category: 'Vendas & CRM',
  },
  {
    id: 'vendas-contrato',
    title: 'Contratos & Hedge',
    icon: FileText,
    path: '/vendas/contrato',
    category: 'Vendas & CRM',
  },
  {
    id: 'vendas-nota',
    title: 'Notas Fiscais de Saída',
    icon: FileText,
    path: '/vendas/notas',
    category: 'Vendas & CRM',
  },

  // Estoque
  {
    id: 'estoque-dashboard',
    title: 'Dashboard de Estoque',
    icon: Package,
    path: '/estoque/dashboard',
    category: 'Estoque',
  },
  {
    id: 'estoque-insumo',
    title: 'Insumos e Serviços',
    icon: Package,
    path: '/estoque/insumo',
    category: 'Estoque',
  },
  {
    id: 'estoque-deposito',
    title: 'Depósitos',
    icon: Building2,
    path: '/estoque/deposito',
    category: 'Estoque',
  },
  {
    id: 'estoque-movimentacao',
    title: 'Movimentações',
    icon: Package,
    path: '/estoque/movimentacao',
    category: 'Estoque',
  },
  {
    id: 'estoque-inventario',
    title: 'Inventário',
    icon: FileText,
    path: '/estoque/inventario',
    category: 'Estoque',
  },

  // Financeiro
  {
    id: 'fin-intelligence',
    title: 'Dashboard Financeiro',
    icon: Wallet,
    path: '/financeiro/intelligence',
    category: 'Financeiro',
  },
  {
    id: 'fin-fluxo',
    title: 'Fluxo de Caixa',
    icon: TrendingUp,
    path: '/financeiro/fluxo',
    category: 'Financeiro',
  },
  {
    id: 'fin-contas',
    title: 'Contas Bancária',
    icon: Building2,
    path: '/financeiro/contas',
    category: 'Financeiro',
  },
  {
    id: 'fin-pagar',
    title: 'Contas a Pagar',
    icon: Wallet,
    path: '/financeiro/pagar',
    category: 'Financeiro',
  },
  {
    id: 'fin-receber',
    title: 'Contas a Receber',
    icon: Wallet,
    path: '/financeiro/receber',
    category: 'Financeiro',
  },
  {
    id: 'fin-conciliacao',
    title: 'Conciliações Bancária',
    icon: FileText,
    path: '/financeiro/conciliacao',
    category: 'Financeiro',
  },
  {
    id: 'fin-lcdpr',
    title: 'Livro Caixa (LCDPR)',
    icon: FileText,
    path: '/financeiro/lcdpr',
    category: 'Financeiro',
  },

  // Relatórios
  {
    id: 'relatorios',
    title: 'Central de Relatórios',
    icon: FileText,
    path: '/relatorios',
    category: 'Navegação Principal',
  },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showFarmSelector, setShowFarmSelector] = useState(false);
  const navigate = useNavigate();
  const { toggleTheme } = useTheme();
  const { farms, activeFarm, setActiveFarm } = useTenant();

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(COMMANDS, {
      keys: [
        { name: 'title', weight: 3 },
        { name: 'category', weight: 1.5 },
        { name: 'keywords', weight: 2 },
      ],
      threshold: 0.4, // 0.0 = exact match, 1.0 = match anything
      ignoreLocation: true,
      minMatchCharLength: 1,
      shouldSort: true,
    });
  }, []);

  // Enhanced filtering using Fuse.js for fuzzy matching
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return COMMANDS;
    }

    const results = fuse.search(query);
    return results.map((result) => result.item);
  }, [query, fuse]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Parent handles opening, but this is a failsafe
      }

      if (!isOpen) {
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const handleSelect = (cmd: CommandItem) => {
    try {
      // Handle special actions
      if (cmd.id === 'action-toggle-theme') {
        toggleTheme();
        onClose();
        setQuery('');
        return;
      }

      if (cmd.id === 'action-switch-farm') {
        setShowFarmSelector(true);
        return;
      }

      // Execute custom action if provided
      if (cmd.action) {
        cmd.action();
        onClose();
        setQuery('');
        return;
      }

      // Navigate if path is provided
      if (cmd.path) {
        navigate(cmd.path);
        onClose();
        setQuery('');
      }
    } catch (error) {
      console.error('Error executing command:', error);
      // Show error message to user with better context
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao executar ação "${cmd.title}": ${errorMessage}\n\nPor favor, tente novamente.`);
    }
  };

  const handleFarmSelect = (farm: typeof farms[0]) => {
    setActiveFarm(farm);
    setShowFarmSelector(false);
    onClose();
    setQuery('');
  };

  const handleBackFromFarmSelector = () => {
    setShowFarmSelector(false);
  };

  if (!isOpen) {
    return null;
  }

  // Farm selector view
  if (showFarmSelector) {
    return createPortal(
      <AnimatePresence>
        <div className="command-palette-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="command-palette-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-header">
              <MapPin size={20} className="search-icon" />
              <div style={{ flex: 1, fontSize: '1.125rem', fontWeight: 600, color: 'hsl(var(--text-main))' }}>
                Selecione uma fazenda
              </div>
              <button
                onClick={handleBackFromFarmSelector}
                style={{
                  background: 'hsl(var(--bg-main))',
                  border: '1px solid hsl(var(--border))',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  color: 'hsl(var(--text-muted))',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Voltar
              </button>
            </div>

            <div className="results-body">
              {farms.length > 0 ? (
                <div className="commands-list">
                  {farms.map((farm) => (
                    <div
                      key={farm.id}
                      className={`command-item ${activeFarm?.id === farm.id ? 'selected' : ''}`}
                      onClick={() => handleFarmSelect(farm)}
                    >
                      <div className="cmd-icon">
                        <MapPin size={18} />
                      </div>
                      <div className="cmd-info">
                        <span className="cmd-title">{farm.name}</span>
                        <span className="cmd-category">
                          {farm.location} • {farm.totalArea.toFixed(0)} ha
                        </span>
                      </div>
                      {activeFarm?.id === farm.id && (
                        <motion.div layoutId="arrow" className="cmd-arrow">
                          <ArrowRight size={16} />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <X size={48} />
                  <p>Nenhuma fazenda disponível</p>
                </div>
              )}
            </div>

            <div className="palette-footer">
              <div className="footer-item">
                <kbd>↵</kbd> <span>Selecionar</span>
              </div>
              <div className="footer-item">
                <kbd>ESC</kbd> <span>Voltar</span>
              </div>
              <div className="footer-item">
                <Command size={14} /> <span>Tauze Search</span>
              </div>
            </div>
          </motion.div>

          <style>{`
            .command-palette-overlay {
              position: fixed;
              inset: 0;
              background: hsla(222, 47%, 11%, 0.8);
              backdrop-filter: blur(12px);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding-top: 10vh;
              z-index: 100000;
            }

            .command-palette-content {
              width: 100%;
              max-width: 640px;
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            .search-header {
              padding: 20px 24px;
              display: flex;
              align-items: center;
              gap: 16px;
              border-bottom: 1px solid hsl(var(--border));
              background: hsla(var(--bg-main) / 0.5);
            }

            .search-icon {
              color: hsl(var(--brand));
            }

            .search-header input {
              flex: 1;
              background: transparent;
              border: none;
              outline: none;
              font-size: 1.125rem;
              font-family: var(--font-main);
              color: hsl(var(--text-main));
            }

            .command-hint kbd {
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 700;
            }

            .results-body {
              max-height: 400px;
              overflow-y: auto;
              padding: 12px;
            }

            .commands-list {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .command-item {
              padding: 12px 16px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 16px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .command-item.selected {
              background: hsl(var(--brand) / 0.1);
              transform: translateX(4px);
            }

            .cmd-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              display: flex;
              align-items: center;
              justify-content: center;
              color: hsl(var(--text-muted));
              transition: all 0.2s;
            }

            .command-item.selected .cmd-icon {
              background: hsl(var(--brand));
              color: white;
              border-color: hsl(var(--brand));
            }

            .cmd-info {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            .cmd-title {
              font-size: 0.9375rem;
              font-weight: 700;
              color: hsl(var(--text-main));
            }

            .cmd-category {
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 500;
            }

            .cmd-shortcut {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .cmd-shortcut kbd {
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 700;
            }

            .cmd-arrow {
              color: hsl(var(--brand));
            }

            .no-results {
              padding: 48px;
              text-align: center;
              color: hsl(var(--text-muted));
            }

            .no-results p {
              margin-top: 16px;
              font-weight: 600;
            }

            .palette-footer {
              padding: 12px 24px;
              background: hsla(var(--bg-main) / 0.5);
              border-top: 1px solid hsl(var(--border));
              display: flex;
              gap: 16px;
            }

            .footer-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 600;
            }

            .footer-item kbd {
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              padding: 2px 6px;
              border-radius: 4px;
            }
          `}</style>
        </div>
      </AnimatePresence>,
      document.body
    );
  }

  if (!isOpen) {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="command-palette-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="command-palette-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input
                autoFocus
                type="text"
                placeholder="Busque por páginas, ferramentas ou comandos (Ex: Animais)"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <div className="command-hint">
                <kbd>ESC</kbd>
              </div>
            </div>

            <div className="results-body">
              {filteredCommands.length > 0 ? (
                <div className="commands-list">
                  {filteredCommands.map((cmd, idx) => (
                    <div
                      key={cmd.id}
                      className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(cmd)}
                    >
                      <div className="cmd-icon">
                        <cmd.icon size={18} />
                      </div>
                      <div className="cmd-info">
                        <span className="cmd-title">{cmd.title}</span>
                        <span className="cmd-category">{cmd.category}</span>
                      </div>
                      {cmd.shortcut && (
                        <div className="cmd-shortcut">
                          <kbd>{formatShortcut(cmd.shortcut)}</kbd>
                        </div>
                      )}
                      {idx === selectedIndex && (
                        <motion.div layoutId="arrow" className="cmd-arrow">
                          <ArrowRight size={16} />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <X size={48} />
                  <p>Nenhum comando encontrado para "{query}"</p>
                </div>
              )}
            </div>

            <div className="palette-footer">
              <div className="footer-item">
                <kbd>↵</kbd> <span>Selecionar</span>
              </div>
              <div className="footer-item">
                <kbd>↑↓</kbd> <span>Navegar</span>
              </div>
              <div className="footer-item">
                <Command size={14} /> <span>Tauze Search</span>
              </div>
            </div>
          </motion.div>

          <style>{`
            .command-palette-overlay {
              position: fixed;
              inset: 0;
              background: hsla(222, 47%, 11%, 0.8);
              backdrop-filter: blur(12px);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding-top: 10vh;
              z-index: 100000;
            }

            .command-palette-content {
              width: 100%;
              max-width: 640px;
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            .search-header {
              padding: 20px 24px;
              display: flex;
              align-items: center;
              gap: 16px;
              border-bottom: 1px solid hsl(var(--border));
              background: hsla(var(--bg-main) / 0.5);
            }

            .search-icon {
              color: hsl(var(--brand));
            }

            .search-header input {
              flex: 1;
              background: transparent;
              border: none;
              outline: none;
              font-size: 1.125rem;
              font-family: var(--font-main);
              color: hsl(var(--text-main));
            }

            .command-hint kbd {
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 700;
            }

            .results-body {
              max-height: 400px;
              overflow-y: auto;
              padding: 12px;
            }

            .commands-list {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .command-item {
              padding: 12px 16px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 16px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .command-item.selected {
              background: hsl(var(--brand) / 0.1);
              transform: translateX(4px);
            }

            .cmd-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              display: flex;
              align-items: center;
              justify-content: center;
              color: hsl(var(--text-muted));
              transition: all 0.2s;
            }

            .command-item.selected .cmd-icon {
              background: hsl(var(--brand));
              color: white;
              border-color: hsl(var(--brand));
            }

            .cmd-info {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            .cmd-title {
              font-size: 0.9375rem;
              font-weight: 700;
              color: hsl(var(--text-main));
            }

            .cmd-category {
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 500;
            }

            .cmd-shortcut {
              display: flex;
              align-items: center;
              gap: 4px;
            }

            .cmd-shortcut kbd {
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 700;
            }

            .cmd-arrow {
              color: hsl(var(--brand));
            }

            .no-results {
              padding: 48px;
              text-align: center;
              color: hsl(var(--text-muted));
            }

            .no-results p {
              margin-top: 16px;
              font-weight: 600;
            }

            .palette-footer {
              padding: 12px 24px;
              background: hsla(var(--bg-main) / 0.5);
              border-top: 1px solid hsl(var(--border));
              display: flex;
              gap: 16px;
            }

            .footer-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 600;
            }

            .footer-item kbd {
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              padding: 2px 6px;
              border-radius: 4px;
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
