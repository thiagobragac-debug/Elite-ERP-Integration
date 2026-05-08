import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Wifi, 
  Bluetooth, 
  Usb, 
  CheckCircle2, 
  AlertCircle, 
  Settings2, 
  Info,
  Radio,
  Cpu,
  RefreshCw,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isConnected, setIsConnected] = useState(false);
  const [step, setStep] = useState(1);

  const handleConnect = () => {
    setIsConnecting(true);
    // Simulating connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    }, 2500);
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <div className="scale-modal-overlay" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="scale-modal-container"
          onClick={e => e.stopPropagation()}
        >
          <header className="scale-modal-header">
            <div className="title-group">
              <div className="icon-badge">
                <Wifi size={20} className="text-brand" />
              </div>
              <div>
                <h2>Configuração de Balança</h2>
                <p>Integração de hardware via Elite Bridge v5.0</p>
              </div>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          </header>

          <div className="scale-modal-body">
            <div className="setup-steps">
              <div className={`step-item ${step >= 1 ? 'active' : ''}`}>1. Protocolo</div>
              <div className="step-line"></div>
              <div className={`step-item ${step >= 2 ? 'active' : ''}`}>2. Parâmetros</div>
              <div className="step-line"></div>
              <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3. Validação</div>
            </div>

            {step === 1 && (
              <div className="step-content animate-fade-in">
                <label className="section-label">Selecione o Método de Conexão</label>
                <div className="connection-grid">
                  {[
                    { id: 'BLUETOOTH', icon: Bluetooth, label: 'Bluetooth LE', desc: 'Conexão direta sem fio' },
                    { id: 'WIFI', icon: Wifi, label: 'Wi-Fi / TCP-IP', desc: 'Via rede local ou Elite Bridge' },
                    { id: 'USB', icon: Usb, label: 'USB Serial', desc: 'Conexão física por cabo' }
                  ].map((type) => (
                    <button 
                      key={type.id}
                      className={`conn-card ${connectionType === type.id ? 'active' : ''}`}
                      onClick={() => setConnectionType(type.id as ConnectionType)}
                    >
                      <type.icon size={24} />
                      <div className="text-left">
                        <span className="label">{type.label}</span>
                        <span className="desc">{type.desc}</span>
                      </div>
                      <div className="radio-circle">
                        {connectionType === type.id && <div className="inner"></div>}
                      </div>
                    </button>
                  ))}
                </div>

                <div style={{ marginTop: '24px' }}>
                  <label className="section-label">Marca do Indicador</label>
                  <select 
                    className="elite-select" 
                    value={brand}
                    onChange={(e) => setBrand(e.target.value as ScaleBrand)}
                  >
                    <option value="TRUTEST">Tru-Test (Protocolo S3/ID5000)</option>
                    <option value="GALLAGHER">Gallagher (W-Series)</option>
                    <option value="COIMMA">Coimma (KM Series)</option>
                    <option value="DIGISTAR">Digi-Star (TMR Track)</option>
                    <option value="OUTRO">Outro (Protocolo Genérico NMEA)</option>
                  </select>
                </div>

                <button className="primary-btn-full" onClick={() => setStep(2)}>
                  PRÓXIMO PASSO
                  <Zap size={16} />
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content animate-fade-in">
                <div className="config-form">
                  <div className="form-row">
                    <div className="form-field">
                      <label>Baud Rate</label>
                      <select className="elite-select"><option>9600</option><option>19200</option><option>115200</option></select>
                    </div>
                    <div className="form-field">
                      <label>Data Bits</label>
                      <select className="elite-select"><option>8</option><option>7</option></select>
                    </div>
                  </div>
                  <div className="form-field">
                    <label>Filtro de Estabilização</label>
                    <div className="toggle-group">
                      <button className="toggle-btn active">DINÂMICO (Animal Vivo)</button>
                      <button className="toggle-btn">ESTÁTICO</button>
                    </div>
                  </div>
                  
                  <div className="info-box">
                    <Info size={16} />
                    <p>O protocolo <strong>{brand}</strong> foi pré-carregado com as configurações de fábrica otimizadas.</p>
                  </div>
                </div>

                <div className="actions-footer">
                  <button className="text-btn" onClick={() => setStep(1)}>VOLTAR</button>
                  <button className="primary-btn" onClick={() => { handleConnect(); setStep(3); }}>
                    {isConnecting ? <RefreshCw className="animate-spin" /> : <Zap size={16} />}
                    INICIAR SINCRONIZAÇÃO
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="step-content animate-fade-in text-center py-8">
                {isConnecting ? (
                  <div className="connecting-state">
                    <div className="pulse-container">
                      <div className="pulse-ring"></div>
                      <div className="pulse-ring delay-1"></div>
                      <div className="pulse-ring delay-2"></div>
                      <Cpu size={48} className="text-brand relative z-10" />
                    </div>
                    <h3>Buscando Hardware...</h3>
                    <p>Tentando pareamento via {connectionType}</p>
                    <div className="terminal-log">
                      <code>{'>'} Buscando portas disponíveis...</code>
                      <code>{'>'} Protocolo {brand} selecionado...</code>
                      <code>{'>'} Handshake inicial enviado...</code>
                    </div>
                  </div>
                ) : isConnected ? (
                  <div className="success-state">
                    <div className="success-icon-wrapper">
                      <CheckCircle2 size={64} className="text-success" />
                    </div>
                    <h3 className="text-success">Balança Conectada!</h3>
                    <p>Dados de pesagem serão capturados automaticamente.</p>
                    <div className="connection-pill">
                      <div className="online-dot"></div>
                      <span>ONLINE: TRU-TEST ID5000</span>
                    </div>
                  </div>
                ) : (
                  <div className="error-state">
                    <AlertCircle size={64} className="text-danger" />
                    <h3>Falha na Conexão</h3>
                    <p>Não foi possível encontrar o dispositivo.</p>
                    <button className="outline-btn" onClick={() => setStep(1)}>TENTAR NOVAMENTE</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <style>{`
            .scale-modal-overlay {
              position: fixed; inset: 0; background: rgba(15, 23, 42, 0.6);
              backdrop-filter: blur(8px); z-index: 10000; display: flex;
              align-items: center; justify-content: center; padding: 20px;
            }
            .scale-modal-container {
              background: hsl(var(--bg-card)); width: 100%; max-width: 500px;
              border-radius: 24px; border: 1px solid hsl(var(--border));
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); overflow: hidden;
            }
            .scale-modal-header {
              padding: 24px; border-bottom: 1px solid hsl(var(--border));
              display: flex; justify-content: space-between; align-items: center;
              background: linear-gradient(to bottom, hsl(var(--bg-card)), hsl(var(--bg-main)));
            }
            .title-group { display: flex; gap: 16px; align-items: center; }
            .icon-badge {
              width: 40px; height: 40px; border-radius: 12px;
              background: hsl(var(--brand) / 0.1); display: flex;
              align-items: center; justify-content: center;
            }
            .scale-modal-header h2 { font-size: 18px; font-weight: 800; color: hsl(var(--text-main)); margin: 0; }
            .scale-modal-header p { font-size: 12px; color: hsl(var(--text-muted)); margin: 2px 0 0; }
            
            .scale-modal-body { padding: 24px; }
            
            .setup-steps {
              display: flex; align-items: center; justify-content: space-between;
              margin-bottom: 32px; padding: 0 10px;
            }
            .step-item { font-size: 11px; font-weight: 900; color: hsl(var(--text-muted)); transition: 0.3s; }
            .step-item.active { color: hsl(var(--brand)); }
            .step-line { flex: 1; height: 2px; background: hsl(var(--border)); margin: 0 15px; border-radius: 1px; }
            
            .section-label { display: block; font-size: 11px; font-weight: 900; color: hsl(var(--text-muted)); letter-spacing: 0.1em; margin-bottom: 12px; }
            
            .connection-grid { display: flex; flex-direction: column; gap: 10px; }
            .conn-card {
              display: flex; align-items: center; gap: 16px; padding: 16px;
              background: hsl(var(--bg-main) / 0.5); border: 1px solid hsl(var(--border));
              border-radius: 16px; cursor: pointer; transition: 0.2s; color: hsl(var(--text-muted));
            }
            .conn-card:hover { border-color: hsl(var(--brand) / 0.5); background: hsl(var(--bg-main)); }
            .conn-card.active { border-color: hsl(var(--brand)); background: hsl(var(--brand) / 0.05); color: hsl(var(--text-main)); }
            .conn-card .label { display: block; font-weight: 800; font-size: 14px; }
            .conn-card .desc { display: block; font-size: 12px; opacity: 0.7; }
            .radio-circle { width: 18px; height: 18px; border-radius: 50%; border: 2px solid hsl(var(--border)); margin-left: auto; display: flex; align-items: center; justify-content: center; }
            .conn-card.active .radio-circle { border-color: hsl(var(--brand)); }
            .radio-circle .inner { width: 8px; height: 8px; border-radius: 50%; background: hsl(var(--brand)); }
            
            .primary-btn-full {
              width: 100%; height: 48px; background: hsl(var(--brand)); color: white;
              border: none; border-radius: 14px; font-weight: 900; font-size: 13px;
              display: flex; align-items: center; justify-content: center; gap: 10px;
              margin-top: 32px; cursor: pointer; transition: 0.2s;
            }
            .primary-btn-full:hover { transform: translateY(-2px); box-shadow: 0 4px 12px hsl(var(--brand) / 0.3); }

            .config-form { display: flex; flex-direction: column; gap: 20px; }
            .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
            .form-field label { display: block; font-size: 11px; font-weight: 800; color: hsl(var(--text-muted)); margin-bottom: 8px; }
            
            .toggle-group { display: flex; background: hsl(var(--bg-main)); padding: 4px; border-radius: 10px; gap: 4px; }
            .toggle-btn { flex: 1; padding: 8px; font-size: 11px; font-weight: 800; border: none; border-radius: 8px; background: transparent; color: hsl(var(--text-muted)); cursor: pointer; }
            .toggle-btn.active { background: white; color: black; box-shadow: var(--shadow-sm); }
            
            .info-box { display: flex; gap: 12px; padding: 12px; background: hsl(var(--brand) / 0.05); border-radius: 12px; font-size: 12px; color: hsl(var(--brand)); align-items: center; margin-top: 12px; }
            .info-box p { margin: 0; }
            
            .actions-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 32px; }
            
            .connecting-state { display: flex; flex-direction: column; align-items: center; gap: 20px; }
            .pulse-container { position: relative; width: 100px; height: 100px; display: flex; align-items: center; justify-content: center; }
            .pulse-ring { position: absolute; width: 100%; height: 100%; border: 2px solid hsl(var(--brand)); border-radius: 50%; animation: pulse 2s infinite; }
            .delay-1 { animation-delay: 0.5s; }
            .delay-2 { animation-delay: 1s; }
            
            @keyframes pulse { 0% { transform: scale(0.5); opacity: 0; } 50% { opacity: 0.5; } 100% { transform: scale(1.5); opacity: 0; } }
            
            .terminal-log { background: #0f172a; border-radius: 12px; padding: 16px; width: 100%; text-align: left; margin-top: 24px; font-family: monospace; font-size: 11px; color: #94a3b8; }
            .terminal-log code { display: block; margin-bottom: 4px; }
            
            .success-icon-wrapper { width: 100px; height: 100px; background: #ecfdf5; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
            .connection-pill { display: inline-flex; align-items: center; gap: 8px; padding: 6px 12px; background: #064e3b; color: #6ee7b7; border-radius: 20px; font-size: 11px; font-weight: 900; margin-top: 16px; }
            .online-dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: blink 1s infinite; }
            
            @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
            
            .text-success { color: #10b981; }
            .text-brand { color: hsl(var(--brand)); }
            .text-danger { color: #ef4444; }
          `}</style>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
