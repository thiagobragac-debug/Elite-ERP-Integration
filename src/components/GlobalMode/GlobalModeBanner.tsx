import React from 'react';
import { Globe, X, ChevronRight } from 'lucide-react';
import { useTenant } from '../../contexts/TenantContext';

/**
 * GlobalModeBanner
 * Displays a persistent banner at the top of every page when
 * Visão Global is active, indicating aggregated data across all farms.
 */
export const GlobalModeBanner: React.FC = () => {
  const { isGlobalMode, setGlobalMode, farms, setActiveFarm, activeFarm } = useTenant();

  if (!isGlobalMode) return null;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      background: 'linear-gradient(135deg, rgba(56,189,248,0.08), rgba(99,102,241,0.06))',
      border: '1px solid rgba(56,189,248,0.25)',
      borderRadius: '14px',
      padding: '10px 18px',
      marginBottom: '20px',
      fontSize: '12px',
      fontWeight: 700,
      color: '#38bdf8',
      boxShadow: '0 0 24px rgba(56,189,248,0.06)',
      backdropFilter: 'blur(8px)',
    }}>
      {/* Icon */}
      <Globe size={16} style={{ flexShrink: 0, animation: 'spin 8s linear infinite' }} />

      {/* Text */}
      <div style={{ flex: 1 }}>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '11px' }}>
          🌐 Visão Global Ativa
        </span>
        <span style={{ color: 'rgba(56,189,248,0.6)', fontWeight: 500, marginLeft: '8px' }}>
          — Exibindo dados consolidados de todas as {farms.length} unidade{farms.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Farm quick-switch pills */}
      {farms.slice(0, 4).map(farm => (
        <button
          key={farm.id}
          onClick={() => {
            setActiveFarm(farm);
          }}
          style={{
            padding: '4px 12px',
            background: activeFarm?.id === farm.id ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: '20px',
            color: '#94a3b8',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
          }}
          title={`Filtrar por ${farm.name}`}
        >
          <ChevronRight size={10} />
          {farm.name}
        </button>
      ))}

      {/* Dismiss / switch to specific farm */}
      <button
        onClick={() => setGlobalMode(false)}
        title="Sair do modo global"
        style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(56,189,248,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'rgba(56,189,248,0.6)',
          cursor: 'pointer',
          transition: 'all 0.2s',
          flexShrink: 0,
        }}
      >
        <X size={12} />
      </button>
    </div>
  );
};
