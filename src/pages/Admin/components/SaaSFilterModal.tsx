import React from 'react';
import { createPortal } from 'react-dom';
import { X, Filter, Globe, CreditCard, Activity, Calendar, DollarSign, HardDrive } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SaaSFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    status: string;
    plan: string;
    minUsers: number;
    maxUsers: number;
    dateStart: string;
    dateEnd: string;
    minPrice?: number;
    maxPrice?: number;
    minStorage?: number;
    maxStorage?: number;
    minDiscount?: number;
    maxDiscount?: number;
  };
  setFilters: (filters: any) => void;
  activeTab: string;
}

export const SaaSFilterModal: React.FC<SaaSFilterModalProps> = ({ 
  isOpen, 
  onClose, 
  filters, 
  setFilters,
  activeTab
}) => {
  const getButtonStyle = (isSelected: boolean, colorType: 'indigo' | 'amber' | 'emerald') => {
    let activeColor = '#6366f1';
    let shadowColor = 'rgba(99, 102, 241, 0.15)';
    if (colorType === 'amber') {
      activeColor = '#f59e0b';
      shadowColor = 'rgba(245, 158, 11, 0.15)';
    } else if (colorType === 'emerald') {
      activeColor = '#10b981';
      shadowColor = 'rgba(16, 185, 129, 0.15)';
    }

    return {
      padding: '12px 16px',
      borderRadius: '12px',
      fontSize: '11px',
      fontWeight: 700,
      border: '1px solid',
      cursor: 'pointer',
      transition: 'all 0.2s',
      background: isSelected ? activeColor : '#ffffff',
      color: isSelected ? '#ffffff' : 'hsl(var(--text-muted))',
      borderColor: isSelected ? activeColor : 'hsl(var(--border))',
      boxShadow: isSelected ? `0 4px 12px ${shadowColor}` : 'none',
      outline: 'none',
      width: '100%',
      textAlign: 'center' as const
    };
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '1px solid hsl(var(--border))',
    outline: 'none',
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
    background: 'hsl(var(--bg-card))',
    transition: 'all 0.2s'
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 999999,
          display: 'flex',
          justifyContent: 'flex-end',
          pointerEvents: 'auto'
        }}>
          {/* Backdrop Blur */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.4)',
              backdropFilter: 'blur(4px)'
            }}
          />

          {/* Sliding Drawer Content */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              height: '100vh',
              background: 'hsl(var(--bg-card))',
              boxShadow: '-10px 0 50px rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1000000,
              borderTopLeftRadius: '24px',
              borderBottomLeftRadius: '24px',
              overflow: 'hidden'
            }}
          >
            {/* Header */}
            <div style={{
              padding: '28px 24px',
              background: '#0b1329', // Dark Navy background
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#10b981'
                }}>
                  <Filter size={18} />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: '#ffffff', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
                    {activeTab === 'plans' ? 'Filtros de Planos' : activeTab === 'billing' ? 'Filtros de Cobrança' : activeTab === 'campaigns' ? 'Filtros de Campanhas' : 'Filtros de Tenants'}
                  </h2>
                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: '700', color: 'hsl(var(--text-muted))' }}>
                    Refine a busca por critérios de governança.
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#475569',
                  background: 'hsl(var(--bg-card))',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div style={{
              flex: 1,
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              overflowY: 'auto'
            }}>
              
              {/* 1. TAB TENANTS */}
              {activeTab === 'tenants' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status da Instância <span style={{ color: '#94a3b8' }}>⚡</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {['all', 'Ativo', 'Suspenso'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters({ ...filters, status: s })}
                          style={getButtonStyle(filters.status === s, 'indigo')}
                        >
                          {s === 'all' ? 'TODOS STATUS' : s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Plano Assinado <span style={{ color: '#94a3b8' }}>💎</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {['all', 'Starter', 'Pro', 'Enterprise', 'DEMO'].map((p) => (
                        <button
                          key={p}
                          onClick={() => setFilters({ ...filters, plan: p })}
                          style={getButtonStyle(filters.plan === p, 'amber')}
                        >
                          {p === 'all' ? 'TODOS PLANOS' : p.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Volume de Usuários <span style={{ color: '#94a3b8' }}>👥</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO</span>
                        <input 
                          type="number" 
                          value={filters.minUsers}
                          onChange={(e) => setFilters({ ...filters, minUsers: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO</span>
                        <input 
                          type="number" 
                          value={filters.maxUsers}
                          onChange={(e) => setFilters({ ...filters, maxUsers: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Janela de Provisionamento <span style={{ color: '#94a3b8' }}>📅</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>INÍCIO</span>
                        <input 
                          type="date" 
                          value={filters.dateStart}
                          onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>FIM</span>
                        <input 
                          type="date" 
                          value={filters.dateEnd}
                          onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 2. TAB PLANS */}
              {activeTab === 'plans' && (
                <>
                  {/* Price Range */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <DollarSign size={14} style={{ color: '#10b981' }} /> Faixa de Preço (Mensal)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO (R$)</span>
                        <input 
                          type="number" 
                          value={filters.minPrice ?? 0}
                          onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO (R$)</span>
                        <input 
                          type="number" 
                          value={filters.maxPrice ?? 10000}
                          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Users limit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Globe size={14} style={{ color: '#6366f1' }} /> Limite de Usuários do Plano
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO</span>
                        <input 
                          type="number" 
                          value={filters.minUsers}
                          onChange={(e) => setFilters({ ...filters, minUsers: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO</span>
                        <input 
                          type="number" 
                          value={filters.maxUsers}
                          onChange={(e) => setFilters({ ...filters, maxUsers: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Storage Limit */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <HardDrive size={14} style={{ color: '#f59e0b' }} /> Limite de Storage (GB)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO (GB)</span>
                        <input 
                          type="number" 
                          value={filters.minStorage ?? 0}
                          onChange={(e) => setFilters({ ...filters, minStorage: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO (GB)</span>
                        <input 
                          type="number" 
                          value={filters.maxStorage ?? 1000}
                          onChange={(e) => setFilters({ ...filters, maxStorage: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* 3. TAB BILLING */}
              {activeTab === 'billing' && (
                <>
                  {/* Invoice Status */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status da Fatura <span style={{ color: '#94a3b8' }}>⚡</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {['all', 'paga', 'pendente', 'atrasada'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters({ ...filters, status: s })}
                          style={getButtonStyle(filters.status === s, 'emerald')}
                        >
                          {s === 'all' ? 'TODAS FATURAS' : s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invoice Amount Range */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <DollarSign size={14} style={{ color: '#10b981' }} /> Valor da Cobrança (R$)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO</span>
                        <input 
                          type="number" 
                          value={filters.minPrice ?? 0}
                          onChange={(e) => setFilters({ ...filters, minPrice: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO</span>
                        <input 
                          type="number" 
                          value={filters.maxPrice ?? 10000}
                          onChange={(e) => setFilters({ ...filters, maxPrice: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Invoice Due Date Window */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Janela de Vencimento <span style={{ color: '#94a3b8' }}>📅</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>INÍCIO</span>
                        <input 
                          type="date" 
                          value={filters.dateStart}
                          onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>FIM</span>
                        <input 
                          type="date" 
                          value={filters.dateEnd}
                          onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              {/* 4. TAB CAMPAIGNS */}
              {activeTab === 'campaigns' && (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Status da Campanha <span style={{ color: '#94a3b8' }}>⚡</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                      {['all', 'ativa', 'pausada', 'expirada'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters({ ...filters, status: s })}
                          style={getButtonStyle(filters.status === s, 'amber')}
                        >
                          {s === 'all' ? 'TODAS' : s.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <Activity size={14} style={{ color: '#f59e0b' }} /> Faixa de Desconto (%)
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÍNIMO (%)</span>
                        <input 
                          type="number" 
                          value={filters.minDiscount ?? 0}
                          onChange={(e) => setFilters({ ...filters, minDiscount: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>MÁXIMO (%)</span>
                        <input 
                          type="number" 
                          value={filters.maxDiscount ?? 100}
                          onChange={(e) => setFilters({ ...filters, maxDiscount: Number(e.target.value) })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: '800', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Período de Vigência <span style={{ color: '#94a3b8' }}>📅</span>
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>INÍCIO</span>
                        <input 
                          type="date" 
                          value={filters.dateStart}
                          onChange={(e) => setFilters({ ...filters, dateStart: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '9px', fontWeight: '700', color: '#94a3b8' }}>FIM</span>
                        <input 
                          type="date" 
                          value={filters.dateEnd}
                          onChange={(e) => setFilters({ ...filters, dateEnd: e.target.value })}
                          style={inputStyle}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{
              padding: '20px 24px',
              background: 'hsl(var(--bg-main))',
              borderTop: '1px solid hsl(var(--border))',
              display: 'flex',
              gap: '12px'
            }}>
              <button 
                onClick={() => {
                  setFilters({
                    status: 'all',
                    plan: 'all',
                    minUsers: 0,
                    maxUsers: 1000,
                    dateStart: '',
                    dateEnd: '',
                    minPrice: 0,
                    maxPrice: 10000,
                    minStorage: 0,
                    maxStorage: 1000,
                    minDiscount: 0,
                    maxDiscount: 100
                  });
                }}
                style={{
                  flex: 1,
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: 'hsl(var(--text-muted))',
                  border: '1px solid hsl(var(--border))',
                  background: 'hsl(var(--bg-card))',
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                LIMPAR TUDO
              </button>
              <button 
                onClick={onClose}
                style={{
                  flex: 2,
                  padding: '14px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: 900,
                  color: '#ffffff',
                  border: 'none',
                  background: '#10b981', // Clean Emerald Green
                  cursor: 'pointer',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.2s',
                  outline: 'none'
                }}
              >
                {activeTab === 'plans' ? 'FILTRAR PLANOS' : activeTab === 'billing' ? 'FILTRAR COBRANÇAS' : activeTab === 'campaigns' ? 'FILTRAR CAMPANHAS' : 'FILTRAR TENANTS'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
