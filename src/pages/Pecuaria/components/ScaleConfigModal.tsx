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
  const [connectionType, setConnectionType] = useState<ConnectionType>('BLUETOOTH');
  const [brand, setBrand] = useState<ScaleBrand>('TRUTEST');
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTED' | 'ERROR'>('IDLE');

  const handleConnect = () => {
    setIsConnecting(true);
    setStatus('IDLE');
    
    // Simulação de conexão com hardware
    setTimeout(() => {
      setIsConnecting(false);
      setStatus('CONNECTED');
    }, 2000);
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
      <div style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="elite-field-group">
          <label className="elite-label">Marca/Fabricante do Equipamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {(['TRUTEST', 'GALLAGHER', 'COIMMA', 'DIGISTAR', 'OUTRO'] as ScaleBrand[]).map(b => (
              <button 
                key={b}
                type="button"
                style={{ 
                  padding: '12px 8px', borderRadius: '12px', border: `1.5px solid ${brand === b ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                  background: brand === b ? 'hsl(var(--brand)/0.05)' : 'white',
                  color: brand === b ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s'
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
              style={{ 
                flex: 1, padding: '20px', borderRadius: '20px', border: `1.5px solid ${connectionType === 'BLUETOOTH' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                background: connectionType === 'BLUETOOTH' ? 'hsl(var(--brand)/0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer'
              }}
              onClick={() => setConnectionType('BLUETOOTH')}
            >
              <Bluetooth size={24} style={{ color: connectionType === 'BLUETOOTH' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }} />
              <span style={{ fontSize: '11px', fontWeight: 900 }}>BLUETOOTH</span>
            </button>
            <button 
              type="button"
              style={{ 
                flex: 1, padding: '20px', borderRadius: '20px', border: `1.5px solid ${connectionType === 'WIFI' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                background: connectionType === 'WIFI' ? 'hsl(var(--brand)/0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer'
              }}
              onClick={() => setConnectionType('WIFI')}
            >
              <Wifi size={24} style={{ color: connectionType === 'WIFI' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }} />
              <span style={{ fontSize: '11px', fontWeight: 900 }}>WI-FI / IP</span>
            </button>
            <button 
              type="button"
              style={{ 
                flex: 1, padding: '20px', borderRadius: '20px', border: `1.5px solid ${connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--border))'}`,
                background: connectionType === 'USB' ? 'hsl(var(--brand)/0.05)' : 'white',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer'
              }}
              onClick={() => setConnectionType('USB')}
            >
              <Usb size={24} style={{ color: connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }} />
              <span style={{ fontSize: '11px', fontWeight: 900 }}>USB / SERIAL</span>
            </button>
          </div>
        </div>

        <div style={{ padding: '20px', borderRadius: '20px', background: 'hsl(var(--bg-main)/0.5)', border: '1px solid hsl(var(--border))' }}>
          {status === 'IDLE' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'hsl(var(--text-muted))' }}>
              <Cpu size={20} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>Aguardando configuração para pareamento...</span>
            </div>
          )}
          {status === 'CONNECTED' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#16a34a' }}>
              <CheckCircle2 size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 900 }}>Dispositivo Conectado com Sucesso!</div>
                <div style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8 }}>Streaming de dados ativo: 0.00 kg</div>
              </div>
              <RefreshCw size={16} className="spin-slow" />
            </div>
          )}
          {status === 'ERROR' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#dc2626' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '13px', fontWeight: 900 }}>Falha ao localizar dispositivo. Verifique a conexão.</span>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .spin-slow { animation: spin 3s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </FormModal>
  );
};
