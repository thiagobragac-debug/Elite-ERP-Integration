import React, { useRef, useEffect } from 'react';
import {
  Bluetooth,
  Usb,
  Wifi,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Terminal,
  Zap,
  X,
  Copy,
} from 'lucide-react';
import { SidePanel } from '../../../components/Layout/SidePanel';
import { useScale, type ScaleBrand, type ScaleConnectionType } from '../../../contexts/ScaleContext';
import './ScaleConfigModal.css';

interface ScaleConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BRANDS: ScaleBrand[] = ['TRUTEST', 'GALLAGHER', 'COIMMA', 'DIGISTAR', 'OUTRO'];

const BAUD_RATES = ['1200', '2400', '4800', '9600', '19200', '38400', '115200'];

const BT_SUPPORT = 'bluetooth' in navigator;
const SERIAL_SUPPORT = 'serial' in navigator;

export function ScaleConfigModal({ isOpen, onClose }: ScaleConfigModalProps) {
  const { state, setBrand, setConnectionType, connectBluetooth, connectSerial, disconnect } = useScale();
  const { status, brand, connectionType, deviceName, currentWeight, rawLog, errorMessage } = state;

  const terminalRef = useRef<HTMLDivElement>(null);
  const baudRateRef = useRef<string>('9600');

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [rawLog]);

  const isConnected = status === 'CONNECTED';
  const isConnecting = status === 'CONNECTING';
  const isDisabled = isConnected || isConnecting;

  const handleConnect = async () => {
    if (connectionType === 'BLUETOOTH') {
      await connectBluetooth();
    } else {
      await connectSerial(parseInt(baudRateRef.current, 10));
    }
  };

  const handleCopyLogs = () => {
    navigator.clipboard.writeText(rawLog.join('\n'));
  };

  const submitLabel = isConnecting ? 'Conectando...' : isConnected ? 'Salvar Configuração' : 'Conectar Balança';

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Configuração de Balança"
      subtitle="Integração em tempo real com troncos e balanças eletrônicas"
      icon={Zap}
      submitLabel={submitLabel}
      onSubmit={isConnected ? onClose : handleConnect}
      loading={isConnecting}
      size="medium"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ── Marca / Fabricante ──────────────────────────────── */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Marca / Fabricante do Equipamento
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {BRANDS.map((b) => (
              <button
                key={b}
                className={`scale-brand-btn ${brand === b ? 'active' : ''}`}
                onClick={() => setBrand(b)}
                disabled={isDisabled}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* ── Tipo de Comunicação ─────────────────────────────── */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
            Tipo de Comunicação
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Bluetooth */}
            <button
              className={`scale-conn-btn ${connectionType === 'BLUETOOTH' ? 'active' : ''}`}
              onClick={() => setConnectionType('BLUETOOTH')}
              disabled={isDisabled || !BT_SUPPORT}
              title={!BT_SUPPORT ? 'Requer Chrome ou Edge no desktop' : undefined}
            >
              <Bluetooth size={22} />
              BLUETOOTH
              {!BT_SUPPORT && <span className="scale-conn-soon">CHROME</span>}
            </button>

            {/* Wi-Fi — Em breve */}
            <button
              className="scale-conn-btn"
              disabled
              title="Integração Wi-Fi disponível em breve"
            >
              <Wifi size={22} />
              WI-FI / IP
              <span className="scale-conn-soon">EM BREVE</span>
            </button>

            {/* USB */}
            <button
              className={`scale-conn-btn ${connectionType === 'USB' ? 'active' : ''}`}
              onClick={() => setConnectionType('USB')}
              disabled={isDisabled || !SERIAL_SUPPORT}
              title={!SERIAL_SUPPORT ? 'Requer Chrome ou Edge no desktop' : undefined}
            >
              <Usb size={22} />
              USB / SERIAL
              {!SERIAL_SUPPORT && <span className="scale-conn-soon">CHROME</span>}
            </button>
          </div>
        </div>

        {/* ── Campos por tipo ─────────────────────────────────── */}
        {connectionType === 'BLUETOOTH' && !isConnected && (
          <div style={{ padding: 14, background: 'hsl(var(--bg-secondary))', borderRadius: 12, border: '1px solid hsl(var(--border))' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'hsl(var(--text-muted))', marginBottom: 6 }}>
              Dispositivo Pareado
            </p>
            {deviceName ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <CheckCircle2 size={16} color="hsl(142 76% 45%)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--text-main))' }}>{deviceName}</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'hsl(var(--text-muted))' }}>
                <Bluetooth size={14} />
                <span style={{ fontSize: 13 }}>Nenhum dispositivo selecionado — clique em "Conectar Balança"</span>
              </div>
            )}
          </div>
        )}

        {connectionType === 'USB' && !isConnected && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="scale-input-group">
              <label className="scale-input-label">Baud Rate</label>
              <select
                className="tauze-input"
                defaultValue="9600"
                onChange={(e) => { baudRateRef.current = e.target.value; }}
                disabled={isDisabled}
              >
                {BAUD_RATES.map((r) => (
                  <option key={r} value={r}>{r} baud</option>
                ))}
              </select>
            </div>
            <div className="scale-input-group">
              <label className="scale-input-label">Protocolo</label>
              <div style={{ padding: '8px 12px', background: 'hsl(var(--bg-secondary))', borderRadius: 8, border: '1px solid hsl(var(--border))', fontSize: 12, color: 'hsl(var(--text-muted))' }}>
                8N1 — seleção automática
              </div>
            </div>
          </div>
        )}

        {/* ── Painel de status ────────────────────────────────── */}
        {status === 'IDLE' && !deviceName && (
          <div className="scale-status-panel">
            <Cpu size={18} style={{ flexShrink: 0 }} />
            <span>Selecione o fabricante e o tipo de conexão, depois clique em "Conectar Balança".</span>
          </div>
        )}

        {status === 'CONNECTING' && (
          <div className="scale-status-panel connecting">
            <RefreshCw size={18} className="scale-spin" style={{ flexShrink: 0 }} />
            <span>Aguardando autorização do browser para acessar o hardware...</span>
          </div>
        )}

        {status === 'ERROR' && (
          <div className="scale-status-panel error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700 }}>Erro de conexão</div>
              <div style={{ fontSize: 12, marginTop: 2, opacity: 0.8 }}>{errorMessage}</div>
            </div>
          </div>
        )}

        {status === 'CONNECTED' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Status badge */}
            <div className="scale-status-panel connected">
              <div className="scale-live-dot" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>Ligação Estabelecida — {deviceName}</div>
                <div style={{ fontSize: 11, opacity: 0.8, marginTop: 2 }}>
                  {brand} · {connectionType === 'BLUETOOTH' ? 'Bluetooth BLE' : 'USB Serial'}
                </div>
              </div>
              <button
                onClick={disconnect}
                style={{ padding: '4px 12px', background: 'hsl(0 84% 60% / 0.15)', border: '1px solid hsl(0 84% 60% / 0.4)', borderRadius: 8, color: 'hsl(0 84% 60%)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <X size={12} style={{ display: 'inline', marginRight: 4 }} />
                DESCONECTAR
              </button>
            </div>

            {/* Último peso capturado */}
            {currentWeight !== null && (
              <div className="scale-weight-display">
                <Zap size={18} color="hsl(var(--brand))" />
                <span className="scale-weight-value">{currentWeight.toFixed(1)}</span>
                <span className="scale-weight-unit">kg</span>
                <span style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginLeft: 'auto' }}>Último peso recebido</span>
              </div>
            )}

            {/* Terminal */}
            <div className="scale-terminal">
              <div className="scale-terminal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={14} color="hsl(120 50% 55%)" />
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(120 50% 55%)' }}>Raw Data Console</span>
                  <span className="scale-live-badge">LIVE</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleCopyLogs}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(120 30% 40%)' }}
                    title="Copiar logs"
                  >
                    <Copy size={13} />
                  </button>
                </div>
              </div>
              <div className="scale-terminal-body" ref={terminalRef}>
                {rawLog.length === 0 && (
                  <span style={{ opacity: 0.4 }}>Aguardando dados da balança...</span>
                )}
                {rawLog.map((line, i) => (
                  <div
                    key={i}
                    className={line.includes('PESO') ? 'scale-log-weight' : line.includes('ERRO') ? 'scale-log-error' : ''}
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Nota de compatibilidade ─────────────────────────── */}
        <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'flex-start', gap: 6, padding: '8px 12px', background: 'hsl(var(--bg-secondary))', borderRadius: 8 }}>
          <AlertCircle size={13} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>
            Requer <strong>Chrome</strong> ou <strong>Edge</strong> no desktop. Firefox e Safari iOS não suportam Web Bluetooth/Serial.
            {connectionType === 'USB' && ' Certifique-se de que o driver USB-Serial está instalado.'}
          </span>
        </div>

      </div>
    </SidePanel>
  );
}
