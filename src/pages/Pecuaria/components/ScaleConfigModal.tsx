import React, { useState, useEffect, useRef } from 'react';
import {
  Wifi,
  Bluetooth,
  Usb,
  CheckCircle2,
  AlertCircle,
  Settings2,
  Cpu,
  RefreshCw,
  Search,
  Terminal,
  Play,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';

interface ScaleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ConnectionType = 'WIFI' | 'BLUETOOTH' | 'USB';
type ScaleBrand = 'TRUTEST' | 'GALLAGHER' | 'COIMMA' | 'DIGISTAR' | 'OUTRO';

export const ScaleConfigModal: React.FC<ScaleConfigModalProps> = ({ isOpen, onClose }) => {
  const [connectionType, setConnectionType] = useState<ConnectionType>(
    (localStorage.getItem('tauze_scale_type') as ConnectionType) || 'BLUETOOTH'
  );
  const [brand, setBrand] = useState<ScaleBrand>(
    (localStorage.getItem('tauze_scale_brand') as ScaleBrand) || 'TRUTEST'
  );

  // Connection Flow State
  const [isConnecting, setIsConnecting] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>(
    localStorage.getItem('tauze_scale_connected') === 'true' ? 'CONNECTED' : 'IDLE'
  );
  const [connectionStep, setConnectionStep] = useState<string>('');

  // Forms states
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [port, setPort] = useState('8080');
  const [comPort, setComPort] = useState('COM3');
  const [baudRate, setBaudRate] = useState('9600');

  const [isScanning, setIsScanning] = useState(false);
  const [scannedDevice, setScannedDevice] = useState<string | null>(null);

  // Terminal State
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Simulate Terminal Data when connected
  useEffect(() => {
    let interval: number;
    if (status === 'CONNECTED') {
      const generateWeight = () => (Math.random() * (550 - 250) + 250).toFixed(1);

      setTerminalLogs((prev) => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] LINK ESTABLISHED. WAITING DATA...`,
      ]);

      interval = window.setInterval(() => {
        const header = brand === 'GALLAGHER' ? '$W' : brand === 'TRUTEST' ? 'RW' : 'WT';
        const rawString = `${header},00${generateWeight()},KG\\r\\n`;
        setTerminalLogs((prev) => {
          const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] RAW: ${rawString}`];
          return newLogs.slice(-15); // keep last 15
        });
      }, 1500);
    } else {
      setTerminalLogs([]);
    }

    return () => clearInterval(interval);
  }, [status, brand]);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [terminalLogs]);

  const handleScanBluetooth = () => {
    setIsScanning(true);
    setScannedDevice(null);
    setTimeout(() => {
      setScannedDevice(`${brand}-XR-${Math.floor(Math.random() * 9000) + 1000}`);
      setIsScanning(false);
    }, 2500);
  };

  const handleConnect = () => {
    setIsConnecting(true);
    setStatus('CONNECTING');
    setConnectionStep('Pingando interface de rede...');
    setTerminalLogs([`[${new Date().toLocaleTimeString()}] INIT CONNECTION SEQUENCE...`]);

    // Step 2
    setTimeout(() => {
      setConnectionStep(`Autenticando protocolo ${brand}...`);
    }, 1000);

    // Step 3
    setTimeout(() => {
      setConnectionStep('Aguardando string de dados...');
    }, 2500);

    // Concluded
    setTimeout(() => {
      setIsConnecting(false);
      setStatus('CONNECTED');
      setConnectionStep('');
      localStorage.setItem('tauze_scale_connected', 'true');
      localStorage.setItem('tauze_scale_brand', brand);
      localStorage.setItem('tauze_scale_type', connectionType);
    }, 3800);
  };

  const handleDisconnect = () => {
    setStatus('IDLE');
    setConnectionStep('');
    localStorage.removeItem('tauze_scale_connected');
    localStorage.removeItem('tauze_scale_brand');
    localStorage.removeItem('tauze_scale_type');
  };

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        handleConnect();
      }}
      title="Configuração de Balança"
      subtitle="Integração em tempo real com troncos e balanças eletrônicas"
      icon={Settings2}
      submitLabel={
        isConnecting
          ? 'Conectando...'
          : status === 'CONNECTED'
            ? 'Salvar Configuração'
            : 'Testar Conexão'
      }
      loading={isConnecting}
      size="medium"
    >
      <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="tauze-field-group">
          <label className="tauze-label">Marca/Fabricante do Equipamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
            {(['TRUTEST', 'GALLAGHER', 'COIMMA', 'DIGISTAR', 'OUTRO'] as ScaleBrand[]).map((b) => (
              <button
                key={b}
                type="button"
                className="brand-config-btn"
                disabled={status === 'CONNECTED' || isConnecting}
                style={{
                  padding: '14px 10px',
                  borderRadius: '12px',
                  border: `1.5px solid ${brand === b ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                  background:
                    brand === b ? 'hsl(var(--brand) / 0.12)' : 'hsl(var(--bg-main) / 0.3)',
                  color: brand === b ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: status === 'CONNECTED' || isConnecting ? 'not-allowed' : 'pointer',
                  opacity: status === 'CONNECTED' || isConnecting ? (brand === b ? 1 : 0.5) : 1,
                  transition: 'all 0.2s ease',
                  boxShadow: brand === b ? '0 4px 12px hsl(var(--brand) / 0.08)' : 'none',
                }}
                onClick={() => setBrand(b)}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="tauze-field-group">
          <label className="tauze-label">Tipo de Comunicação</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              className="conn-config-btn"
              disabled={status === 'CONNECTED' || isConnecting}
              style={{
                flex: 1,
                padding: '16px 10px',
                borderRadius: '16px',
                border: `1.5px solid ${connectionType === 'BLUETOOTH' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background:
                  connectionType === 'BLUETOOTH'
                    ? 'hsl(var(--brand) / 0.12)'
                    : 'hsl(var(--bg-main) / 0.3)',
                color:
                  connectionType === 'BLUETOOTH'
                    ? 'hsl(var(--text-main))'
                    : 'hsl(var(--text-muted))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: status === 'CONNECTED' || isConnecting ? 'not-allowed' : 'pointer',
                opacity:
                  status === 'CONNECTED' || isConnecting
                    ? connectionType === 'BLUETOOTH'
                      ? 1
                      : 0.5
                    : 1,
                transition: 'all 0.2s ease',
                boxShadow:
                  connectionType === 'BLUETOOTH' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none',
              }}
              onClick={() => {
                setConnectionType('BLUETOOTH');
                setScannedDevice(null);
              }}
            >
              <Bluetooth
                size={22}
                style={{
                  color:
                    connectionType === 'BLUETOOTH'
                      ? 'hsl(var(--brand))'
                      : 'hsl(var(--text-muted) / 0.8)',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                BLUETOOTH
              </span>
            </button>
            <button
              type="button"
              className="conn-config-btn"
              disabled={status === 'CONNECTED' || isConnecting}
              style={{
                flex: 1,
                padding: '16px 10px',
                borderRadius: '16px',
                border: `1.5px solid ${connectionType === 'WIFI' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background:
                  connectionType === 'WIFI'
                    ? 'hsl(var(--brand) / 0.12)'
                    : 'hsl(var(--bg-main) / 0.3)',
                color:
                  connectionType === 'WIFI' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: status === 'CONNECTED' || isConnecting ? 'not-allowed' : 'pointer',
                opacity:
                  status === 'CONNECTED' || isConnecting
                    ? connectionType === 'WIFI'
                      ? 1
                      : 0.5
                    : 1,
                transition: 'all 0.2s ease',
                boxShadow:
                  connectionType === 'WIFI' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none',
              }}
              onClick={() => setConnectionType('WIFI')}
            >
              <Wifi
                size={22}
                style={{
                  color:
                    connectionType === 'WIFI'
                      ? 'hsl(var(--brand))'
                      : 'hsl(var(--text-muted) / 0.8)',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                WI-FI / IP
              </span>
            </button>
            <button
              type="button"
              className="conn-config-btn"
              disabled={status === 'CONNECTED' || isConnecting}
              style={{
                flex: 1,
                padding: '16px 10px',
                borderRadius: '16px',
                border: `1.5px solid ${connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--border) / 0.6)'}`,
                background:
                  connectionType === 'USB'
                    ? 'hsl(var(--brand) / 0.12)'
                    : 'hsl(var(--bg-main) / 0.3)',
                color:
                  connectionType === 'USB' ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                cursor: status === 'CONNECTED' || isConnecting ? 'not-allowed' : 'pointer',
                opacity:
                  status === 'CONNECTED' || isConnecting ? (connectionType === 'USB' ? 1 : 0.5) : 1,
                transition: 'all 0.2s ease',
                boxShadow:
                  connectionType === 'USB' ? '0 6px 16px hsl(var(--brand) / 0.08)' : 'none',
              }}
              onClick={() => setConnectionType('USB')}
            >
              <Usb
                size={22}
                style={{
                  color:
                    connectionType === 'USB' ? 'hsl(var(--brand))' : 'hsl(var(--text-muted) / 0.8)',
                }}
              />
              <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '0.5px' }}>
                USB / SERIAL
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Fields based on Connection Type */}
        <div
          style={{
            background: 'hsl(var(--bg-card) / 0.5)',
            border: '1px dashed hsl(var(--border))',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {connectionType === 'BLUETOOTH' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                  Dispositivo Pareado
                </span>
                {status !== 'CONNECTED' && (
                  <button
                    type="button"
                    onClick={handleScanBluetooth}
                    disabled={isScanning}
                    className="glass-btn secondary"
                    style={{
                      padding: '6px 12px',
                      fontSize: '11px',
                      borderRadius: '8px',
                      display: 'flex',
                      gap: '6px',
                      alignItems: 'center',
                    }}
                  >
                    {isScanning ? (
                      <RefreshCw size={14} className="spin-slow" />
                    ) : (
                      <Search size={14} />
                    )}
                    {isScanning ? 'Procurando...' : 'Escanear'}
                  </button>
                )}
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  background: 'hsl(var(--bg-main))',
                  borderRadius: '8px',
                  border: '1px solid hsl(var(--border) / 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <Bluetooth
                  size={18}
                  style={{ color: scannedDevice ? 'hsl(var(--brand))' : 'hsl(var(--text-muted))' }}
                />
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: scannedDevice ? 'hsl(var(--text-main))' : 'hsl(var(--text-muted) / 0.7)',
                  }}
                >
                  {scannedDevice || 'Nenhum dispositivo selecionado'}
                </span>
                {scannedDevice && (
                  <CheckCircle2 size={16} style={{ color: '#10b981', marginLeft: 'auto' }} />
                )}
              </div>
            </div>
          )}

          {connectionType === 'WIFI' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="tauze-field-group">
                <label className="tauze-label">Endereço IP Local</label>
                <input
                  type="text"
                  className="tauze-input"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  placeholder="Ex: 192.168.1.100"
                  disabled={status === 'CONNECTED'}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">Porta TCP</label>
                <input
                  type="text"
                  className="tauze-input"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="Ex: 8080"
                  disabled={status === 'CONNECTED'}
                />
              </div>
            </div>
          )}

          {connectionType === 'USB' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="tauze-field-group">
                <label className="tauze-label">Porta COM</label>
                <select
                  className="tauze-input"
                  value={comPort}
                  onChange={(e) => setComPort(e.target.value)}
                  disabled={status === 'CONNECTED'}
                >
                  <option value="COM1">COM1</option>
                  <option value="COM2">COM2</option>
                  <option value="COM3">COM3</option>
                  <option value="COM4">COM4</option>
                  <option value="/dev/ttyUSB0">/dev/ttyUSB0</option>
                </select>
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label">Baud Rate</label>
                <select
                  className="tauze-input"
                  value={baudRate}
                  onChange={(e) => setBaudRate(e.target.value)}
                  disabled={status === 'CONNECTED'}
                >
                  <option value="4800">4800</option>
                  <option value="9600">9600</option>
                  <option value="19200">19200</option>
                  <option value="38400">38400</option>
                  <option value="115200">115200</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Live Terminal & Diagnostics */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '16px',
            background:
              status === 'CONNECTED'
                ? 'rgba(16, 185, 129, 0.06)'
                : status === 'ERROR'
                  ? 'rgba(239, 68, 68, 0.06)'
                  : 'hsl(var(--bg-main) / 0.4)',
            border:
              status === 'CONNECTED'
                ? '1.5px solid rgba(16, 185, 129, 0.25)'
                : status === 'ERROR'
                  ? '1.5px solid rgba(239, 68, 68, 0.25)'
                  : '1px solid hsl(var(--border) / 0.5)',
            transition: 'all 0.3s ease',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {status === 'IDLE' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: 'hsl(var(--text-muted))',
                padding: '4px 0',
              }}
            >
              <Cpu size={22} style={{ color: 'hsl(var(--brand))' }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>
                Aguardando parâmetros para iniciar pareamento...
              </span>
            </div>
          )}

          {status === 'CONNECTING' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                color: 'hsl(var(--brand))',
                padding: '4px 0',
              }}
            >
              <RefreshCw size={22} className="spin-slow" />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '13px', fontWeight: 800 }}>Diagnosticando...</span>
                <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.8 }}>
                  {connectionStep}
                </span>
              </div>
            </div>
          )}

          {status === 'CONNECTED' && (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  color: '#10b981',
                  padding: '4px 0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div style={{ position: 'relative' }}>
                    <CheckCircle2 size={24} style={{ color: '#10b981' }} />
                    <span
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#10b981',
                        boxShadow: '0 0 8px #10b981',
                        animation: 'pulse 1.5s infinite',
                      }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 900,
                        color: 'hsl(var(--text-main))',
                      }}
                    >
                      Ligação Estabelecida ({brand})
                    </div>
                    <div
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 700,
                        color: '#10b981',
                        marginTop: '2px',
                      }}
                    >
                      Streaming de porta ativo • {connectionType}
                    </div>
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
                      padding: '6px 16px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
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
                </div>
              </div>

              {/* LIVE TERMINAL */}
              <div
                style={{
                  background: '#050505',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  marginTop: '8px',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    background: '#111',
                    borderBottom: '1px solid #333',
                  }}
                >
                  <Terminal size={12} color="#888" />
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: '#888',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                    }}
                  >
                    Raw Data Console
                  </span>
                  <div
                    style={{
                      marginLeft: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Play size={10} color="#10b981" />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#10b981' }}>LIVE</span>
                  </div>
                </div>
                <div
                  style={{
                    height: '110px',
                    padding: '12px',
                    overflowY: 'auto',
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '11px',
                    lineHeight: '1.6',
                    color: '#10b981',
                  }}
                >
                  {terminalLogs.length === 0 ? (
                    <div style={{ color: '#555', fontStyle: 'italic' }}>
                      Aguardando transmissão...
                    </div>
                  ) : (
                    terminalLogs.map((log, i) => (
                      <div key={i} style={{ wordBreak: 'break-all' }}>
                        {log}
                      </div>
                    ))
                  )}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            </>
          )}

          {status === 'ERROR' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                color: '#ef4444',
                padding: '4px 0',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <AlertCircle size={22} />
                <span style={{ fontSize: '13px', fontWeight: 800 }}>
                  Falha ao localizar dispositivo.
                </span>
              </div>
              <span style={{ fontSize: '11px', fontWeight: 600, opacity: 0.9, marginLeft: '36px' }}>
                Dica: Verifique se a balança {brand} está no mesmo segmento de rede e configurada no
                modo Servidor/Streaming.
              </span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .spin-slow { animation: spin 2s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0; } 100% { transform: scale(1); opacity: 0; } }
        .brand-config-btn:not(:disabled):hover {
          border-color: hsl(var(--brand) / 0.7) !important;
          background: hsl(var(--brand) / 0.05) !important;
          color: hsl(var(--brand)) !important;
        }
        .conn-config-btn:not(:disabled):hover {
          border-color: hsl(var(--brand) / 0.7) !important;
          background: hsl(var(--brand) / 0.05) !important;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px hsl(var(--brand) / 0.05);
        }
      `}</style>
    </SidePanel>
  );
};
