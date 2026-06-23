import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Globe,
  CreditCard,
  ArrowRight,
  TrendingUp,
  Settings,
  Activity,
  X
} from 'lucide-react';

interface SaaSCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tenantsList: any[];
  plansList: any[];
  handleTabChange: (tabId: any) => void;
  openEditTenant: (tenant: any) => void;
  openEditPlan: (plan: any) => void;
}

export const SaaSCommandPalette: React.FC<SaaSCommandPaletteProps> = ({
  isOpen,
  onClose,
  tenantsList,
  plansList,
  handleTabChange,
  openEditTenant,
  openEditPlan,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset states when closed/opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Command items (static actions & navigation)
  const navigationItems = [
    { id: 'nav-overview', type: 'nav', title: 'Navegar para Visão Global', icon: Globe, tab: 'overview' },
    { id: 'nav-analytics', type: 'nav', title: 'Navegar para Analytics & BI', icon: TrendingUp, tab: 'analytics' },
    { id: 'nav-billing', type: 'nav', title: 'Navegar para Monitor Financeiro', icon: Settings, tab: 'billing' },
    { id: 'nav-tenants', type: 'nav', title: 'Navegar para Gestão de Tenants', icon: Globe, tab: 'tenants' },
    { id: 'nav-plans', type: 'nav', title: 'Navegar para Catálogo de Planos', icon: CreditCard, tab: 'plans' },
    { id: 'nav-health', type: 'nav', title: 'Navegar para Saúde da Rede', icon: Activity, tab: 'health' },
  ];

  // Filtering list
  const filteredNavigation = navigationItems.filter(item =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const filteredTenants = query.trim() === '' ? [] : tenantsList.filter(t =>
    t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.id.toString().toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5); // limit to 5 results

  const filteredPlans = query.trim() === '' ? [] : plansList.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3); // limit to 3 results

  const allResults = [
    ...filteredNavigation,
    ...filteredPlans.map(p => ({ ...p, id: `plan-${p.id}`, type: 'plan', title: `Configurar Plano: ${p.name}`, icon: CreditCard })),
    ...filteredTenants.map(t => ({ ...t, id: `tenant-${t.id}`, type: 'tenant', title: `Editar Parceiro: ${t.name}`, icon: Globe })),
  ];

  // Navigate through options with keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, allResults.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allResults[selectedIndex]) {
          handleSelect(allResults[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allResults]);

  const handleSelect = (item: any) => {
    if (item.type === 'nav') {
      handleTabChange(item.tab);
    } else if (item.type === 'tenant') {
      const originalTenant = tenantsList.find(t => t.id === item.id.replace('tenant-', ''));
      if (originalTenant) openEditTenant(originalTenant);
    } else if (item.type === 'plan') {
      const originalPlan = plansList.find(p => p.id === item.id.replace('plan-', ''));
      if (originalPlan) openEditPlan(originalPlan);
    }
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(8px)',
          zIndex: 999999,
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '15vh',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            width: '100%',
            maxWidth: '640px',
            maxHeight: '480px',
            background: 'hsl(var(--bg-card))',
            borderRadius: '16px',
            border: '1px solid hsl(var(--border) / 0.8)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search Input Wrapper */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid hsl(var(--border) / 0.6)',
              gap: '12px',
            }}
          >
            <Search size={20} style={{ color: 'hsl(var(--brand))' }} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Buscar parceiros, planos ou comandos de navegação..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              style={{
                flex: 1,
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 700,
                color: 'hsl(var(--text-main))',
              }}
            />
            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'hsl(var(--text-muted))',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Results List */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {allResults.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>Nenhum resultado encontrado para "{query}"</span>
              </div>
            ) : (
              allResults.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 16px',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      background: isSelected ? 'hsl(var(--brand) / 0.08)' : 'transparent',
                      border: isSelected ? '1px solid hsl(var(--brand) / 0.2)' : '1px solid transparent',
                      transition: 'background 0.1s ease',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isSelected ? 'hsl(var(--brand) / 0.15)' : 'hsl(var(--border) / 0.4)',
                          color: isSelected ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Icon size={16} />
                      </div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isSelected ? 800 : 700,
                          color: isSelected ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                        }}
                      >
                        {item.title}
                      </span>
                    </div>

                    {isSelected && (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: 'hsl(var(--brand))',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        Executar <ArrowRight size={12} />
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Palette Footer instructions */}
          <div
            style={{
              padding: '10px 20px',
              borderTop: '1px solid hsl(var(--border) / 0.6)',
              background: 'hsl(var(--muted) / 0.2)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '10px',
              fontWeight: 800,
              color: 'hsl(var(--text-muted))',
            }}
          >
            <span>Navegue com ↑ ↓ e pressione Enter</span>
            <span>ESC para fechar</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
