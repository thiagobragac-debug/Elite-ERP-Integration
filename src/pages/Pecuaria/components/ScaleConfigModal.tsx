import React, { useState } from 'react';
import { 
  Wifi, 
  Bluetooth, 
  Usb, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { FormModal } from '../../../components/Forms/FormModal';

interface ScaleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionType = 'WIFI' | 'BLUETOOTH' | 'USB';
type ScaleBrand = 'TRUTEST' | 'GALLAGHER' | 'COIMMA' | 'DIGISTAR' | 'OUTRO';

export const ScaleConfigModal: React.FC<ScaleConfigModalProps> = ({ isOpen, onClose }) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    (localStorage.getItem('elite_scale_type') as ConnectionType) || 'BLUETOOTH'
  );
  const [brand, setBrand] = useState<ScaleBrand>(
    (localStorage.getItem('elite_scale_brand') as ScaleBrand) || 'TRUTEST'
  );
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>(
    localStorage.getItem('elite_scale_connected') === 'true' ? 'CONNECTED' : 'IDLE'
  );

  const handleConnect = () => {
    setIsConnecting(true);
    setStatus('IDLE');
    
    // Simulação de conexão com hardware
    setTimeout(() => {
      setIsConnecting(false);
      setStatus('CONNECTED');
      localStorage.setItem('elite_scale_connected', 'true');
      localStorage.setItem('elite_scale_brand', brand);
      localStorage.setItem('elite_scale_type', connectionType);
    }, 2000);
  };

  const handleDisconnect = () => {
    setStatus('IDLE');
    localStorage.removeItem('elite_scale_connected');
    localStorage.removeItem('elite_scale_brand');
    localStorage.removeItem('elite_scale_type');
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); handleConnect(); }}
      title="Configuração de Balança"
      subtitle="Integração em tempo real com troncos e balanças eletrônicas"
      icon={Settings2}
      submitLabel={isConnecting ? "Conectando..." : "Testar Conexão"}
      loading={isConnecting}
      size="medium"
    >
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="elite-field-group">
          <label className="elite-label">Marca/Fabricante do Equipamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {(['TRUTEST', 'GALLAGHER', 'COIMMA', 'DIGISTAR', 'OUTRO'] as ScaleBrand[]).map(b => (
              <button 
                key={b}
                type="button"
                className="brand-config-btn"
                style={{ 
                  padding: '14px 10px', 
                  borderRadius: '12px', 
                  border: `1.5px solid ${brand === b ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                  background: brand === b ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-main) / 0.3)',
                  color: brand === b ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  fontSize: '11px', 
                  fontWeight: 800, 
                  cursor: 'pointer', 
                  transition: 'all 0.2s ease',
                  boxShadow: brand === b ? '0 4px 12px hsl(var(--brand) / 0.08)' : 'none'
                }}
                onClick={() => setBrand(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="elite-field-group">
          <label className="elite-label">Tipo de Comunicação</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              type="button"
              className="conn-config-btn"
              style={{ 
                flex: 1, 
                padding: '24px 16px', 
                borderRadius: '16px', 
                border: `1.5px solid ${connectionType === 'BLUETOOTH' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background: connectionType === 'BLUETOOTH' ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-main) / 0.3)',
                color: connectionType === 'BLUETOOTH' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: connectionType === 'BLUETOOTH' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none'
              }}
              onClick={() => setConnectionType('BLUETOOTH')}
            >
              <Bluetooth size={26} style={{ color: connectionType === 'BLUETOOTH' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted) / 0.8)' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>BLUETOOTH</span>
            </button>
            <button 
              type="button"
              className="conn-config-btn"
              style={{ 
                flex: 1, 
                padding: '24px 16px', 
                borderRadius: '16px', 
                border: `1.5px solid ${connectionType === 'WIFI' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background: connectionType === 'WIFI' ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-main) / 0.3)',
                color: connectionType === 'WIFI' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: connectionType === 'WIFI' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none'
              }}
              onClick={() => setConnectionType('WIFI')}
            >
              <Wifi size={26} style={{ color: connectionType === 'WIFI' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted) / 0.8)' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>WI-FI / IP</span>
            </button>
            <button 
              type="button"
              className="conn-config-btn"
              style={{ 
                flex: 1, 
                padding: '24px 16px', 
                borderRadius: '16px', 
                border: `1.5px solid ${connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background: connectionType === 'USB' ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-main) / 0.3)',
                color: connectionType === 'USB' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                gap: '12px', 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: connectionType === 'USB' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none'
              }}
              onClick={() => setConnectionType('USB')}
            >
              <Usb size={26} style={{ color: connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted) / 0.8)' }} />
              <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.5px' }}>USB / SERIAL</span>
            </button>
          </div>
        </div>

        <div style={{ 
          padding: '16px 20px', 
          borderRadius: '16px', 
          background: status === 'CONNECTED' ? 'rgba(16, 185, 129, 0.06)' : status === 'ERROR' ? 'rgba(239, 68, 68, 0.06)' : 'hsl(var(--bg-main) / 0.4)',
          border: status === 'CONNECTED' ? '1.5px solid rgba(16, 185, 129, 0.25)' : status === 'ERROR' ? '1.5px solid rgba(239, 68, 68, 0.25)' : '1px solid hsl(var(--border) / 0.5)',
          transition: 'all 0.3s ease'
        }}>
          {status === 'IDLE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'hsl(var(--text-muted))', padding: '4px 0' }}>
              <Cpu size={22} style={{ color: 'hsl(var(--brand))' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Aguardando configuração para pareamento...</span>
            </div>
          )}
          {status === 'CONNECTED' && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', color: '#10b981', padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                <CheckCircle2 size={22} style={{ color: '#10b981' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>Balança Virtual Conectada (Simulação)</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: '#10b981', opacity: 0.95, marginTop: '2px' }}>Streaming de dados ativo: 0.00 kg</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleDisconnect}
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    color: '#ef4444',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.22)';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
                  }}
                >
                  Desconectar
                </button>
                <RefreshCw size={18} className="spin-slow" style={{ color: '#10b981' }} />
              </div>
            </div>
          )}
          {status === 'ERROR' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: '#ef4444', padding: '4px 0' }}>
              <AlertCircle size={22} />
              <span style={{ fontSize: '13px', fontWeight: 800 }}>Falha ao localizar dispositivo. Verifique a conexão.</span>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .brand-config-btn:hover {
          border-color: hsl(var(--brand) / 0.7) !important;
          background: hsl(var(--brand) / 0.05) !important;
          color: hsl(var(--brand)) !important;
        }
        .conn-config-btn:hover {
          border-color: hsl(var(--brand) / 0.7) !important;
          background: hsl(var(--brand) / 0.05) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px hsl(var(--brand) / 0.05);
        }
      `}</style>
    </FormModal>
  );
};
