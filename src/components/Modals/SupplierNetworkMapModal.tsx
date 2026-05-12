import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  MapPin, 
  Globe, 
  Navigation, 
  Building2,
  TrendingUp,
  Search
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SupplierNetworkMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
}

export const SupplierNetworkMapModal: React.FC<SupplierNetworkMapModalProps> = ({
  isOpen,
  onClose,
  suppliers
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);

  if (!isOpen) return null;

  // Filter suppliers based on search
  const filteredSuppliers = suppliers.filter(sup => 
    sup.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sup.estado?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  // Group by state for the visualization
  const stateStats = filteredSuppliers.reduce((acc: any, curr: any) => {
    const state = curr.estado || 'N/A';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  return createPortal(
    <div className="elite-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="elite-modal-container xlarge"
        style={{ maxWidth: '1200px', width: '95%', padding: 0 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="elite-modal-header" style={{ borderBottom: '1px solid #e2e8f0', background: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="icon-wrapper" style={{ 
              background: 'hsl(var(--brand) / 0.1)', 
              width: '44px', 
              height: '44px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'hsl(var(--brand))'
            }}>
              <Globe size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Mapa de Rede de Suprimentos</h3>
              <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
                Inteligência geográfica e logística da base de fornecedores
              </p>
            </div>
          </div>
          <button 
            className="elite-close-x-btn" 
            onClick={onClose} 
            style={{ 
              color: '#64748b', 
              background: '#f1f5f9',
              border: 'none',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              zIndex: 10
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="map-modal-body">
          <div className="map-sidebar">
            <div className="sidebar-section">
              <div className="inner-search-wrapper">
                <Search size={14} className="s-icon" />
                <input 
                  type="text" 
                  placeholder="Localizar fornecedor..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4>RESUMO DA REDE</h4>
                {selectedIds.length > 0 && (
                  <button 
                    onClick={() => setSelectedIds([])}
                    style={{ fontSize: '9px', fontWeight: 900, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    LIMPAR ({selectedIds.length})
                  </button>
                )}
              </div>
              <div className="stat-mini">
                <span className="label">Total Exibido</span>
                <span className="value" style={{ color: '#0f172a' }}>{filteredSuppliers.length}</span>
              </div>
            </div>

            <div className="sidebar-section" style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <h4>FILTRAR POR ESTADO</h4>
              <div className="state-list" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                {Object.entries(stateStats).length > 0 ? (
                  Object.entries(stateStats).sort((a: any, b: any) => b[1] - a[1]).map(([state, count]) => (
                    <div key={state} className="state-item">
                      <span className="s-name" style={{ color: '#475569' }}>{state === 'N/A' ? 'OUT' : state}</span>
                      <div className="s-bar-bg">
                        <div className="s-bar-fill" style={{ width: `${Math.max(10, (count as number / suppliers.length) * 100)}%` }}></div>
                      </div>
                      <span className="s-count" style={{ color: 'hsl(var(--brand))' }}>{count as number}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted text-[10px] italic">Sem resultados</div>
                )}
              </div>
            </div>

            <div className="sidebar-section">
              <h4>LISTA DE REDE (MULTISELEÇÃO)</h4>
              <div className="mini-supplier-list">
                {filteredSuppliers.slice(0, 15).map(sup => (
                  <div 
                    key={sup.id} 
                    className={`mini-sup-item ${selectedIds.includes(sup.id) ? 'active' : ''}`}
                    onClick={() => toggleSelection(sup.id)}
                  >
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '3px', 
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: selectedIds.includes(sup.id) ? 'hsl(var(--brand))' : 'white'
                    }}>
                      {selectedIds.includes(sup.id) && <X size={8} color="white" />}
                    </div>
                    <span>{sup.nome}</span>
                  </div>
                ))}
                {filteredSuppliers.length > 15 && <div className="more-indicator">+{filteredSuppliers.length - 15} outros</div>}
              </div>
            </div>

            <div className="sidebar-section bottom">
              <button 
                className="optimize-btn" 
                onClick={() => alert(`Otimizando rotas para ${selectedIds.length || filteredSuppliers.length} fornecedores...`)}
                style={{ background: 'hsl(var(--brand))', color: 'white' }}
              >
                <Navigation size={14} />
                OTIMIZAR SELEÇÃO
              </button>
            </div>
          </div>

          <div className="map-viz-container">
            <div className="map-grid-overlay"></div>
            <div className="radar-ping"></div>
            
            <svg viewBox="0 0 500 500" className="brazil-svg">
              <path 
                fill="#f8fafc" 
                stroke="#cbd5e1" 
                strokeWidth="1.5"
                d="M160,80 C180,60 250,50 300,60 C350,70 420,100 440,150 C460,200 430,350 380,420 C330,490 200,480 150,450 C100,420 80,300 100,200 C120,100 140,100 160,80 Z" 
                className="map-shape"
              />
              
              <path d="M250,60 L250,460" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />
              <path d="M100,250 L440,250" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4" />

              {filteredSuppliers.map((sup, idx) => {
                const seed = sup.id?.length || idx;
                const x = 140 + ((seed * 71) % 220);
                const y = 100 + ((seed * 37) % 300);
                const isSelected = selectedIds.includes(sup.id);
                
                return (
                  <motion.g 
                    key={sup.id || idx}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: isSelected ? 1.5 : 1 }}
                    whileHover={{ scale: 1.5 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className={`map-node-group ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(sup.id)}
                  >
                    <circle cx={x} cy={y} r={isSelected ? 16 : 12} fill={isSelected ? 'hsl(var(--brand) / 0.2)' : 'hsl(var(--brand) / 0.1)'} className="map-node-glow" />
                    <circle cx={x} cy={y} r={isSelected ? 6 : 4} fill={isSelected ? '#0f172a' : 'hsl(var(--brand))'} className="map-pin-pulse" />
                    <circle cx={x} cy={y} r={2} fill="white" />
                    
                    <g className={`map-label ${isSelected ? 'force-visible' : ''}`}>
                      <rect x={x + 10} y={y - 10} width="110" height="20" rx="4" fill="white" stroke={isSelected ? 'hsl(var(--brand))' : '#e2e8f0'} strokeWidth="1" />
                      <text x={x + 15} y={y + 4} fontSize="8" fontWeight="800" fill={isSelected ? 'hsl(var(--brand))' : '#1e293b'}>{sup.nome?.split(' ')[0]}</text>
                    </g>
                  </motion.g>
                );
              })}
            </svg>

            <div className="map-controls">
              <button className="ctrl-btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}><TrendingUp size={16} /></button>
              <button className="ctrl-btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}><MapPin size={16} /></button>
              <button className="ctrl-btn" style={{ background: 'white', border: '1px solid #e2e8f0', color: '#64748b' }}><Search size={16} /></button>
            </div>

            <div className="map-overlay-card" style={{ background: 'white', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <div className="pulse-active" style={{ width: '8px', height: '8px', background: 'hsl(var(--brand))', borderRadius: '50%' }}></div>
              <div>
                <h5 style={{ color: 'hsl(var(--brand))' }}>HUB LOGÍSTICO ATIVO</h5>
                <p style={{ color: '#64748b' }}>Otimização baseada na Localização Principal</p>
              </div>
            </div>
          </div>
        </div>

        <div className="elite-modal-footer" style={{ background: 'white', borderTop: '1px solid #e2e8f0', padding: '16px 32px' }}>
          <button type="button" className="glass-btn secondary" onClick={onClose} style={{ marginLeft: 'auto', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#475569' }}>
            FECHAR MAPA
          </button>
        </div>
      </motion.div>

      <style>{`
        .map-modal-body {
          display: flex;
          height: 550px;
          max-height: 60vh;
          background: #f8fafc;
        }

        .elite-close-x-btn:hover {
          background: #ef4444 !important;
          color: white !important;
          transform: rotate(90deg);
        }

        .map-sidebar {
          width: 280px;
          border-right: 1px solid #e2e8f0;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: white;
          overflow-y: auto;
        }

        .inner-search-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .inner-search-wrapper .s-icon {
          position: absolute;
          left: 12px;
          color: #94a3b8;
        }

        .inner-search-wrapper input {
          width: 100%;
          height: 38px;
          padding: 0 12px 0 36px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          transition: all 0.2s;
        }

        .inner-search-wrapper input:focus {
          outline: none;
          border-color: hsl(var(--brand));
          background: white;
          box-shadow: 0 0 0 3px hsl(var(--brand) / 0.1);
        }

        .mini-supplier-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 8px;
        }

        .mini-sup-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s;
          border: 1px solid transparent;
        }

        .mini-sup-item:hover {
          background: #f1f5f9;
          color: #1e293b;
        }

        .mini-sup-item.active {
          background: hsl(var(--brand) / 0.08);
          color: hsl(var(--brand));
          border-color: hsl(var(--brand) / 0.2);
        }

        .more-indicator {
          font-size: 10px;
          color: #94a3b8;
          font-style: italic;
          padding-left: 12px;
          margin-top: 4px;
        }

        .sidebar-section h4 {
          font-size: 10px;
          font-weight: 900;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
          color: #94a3b8;
          text-transform: uppercase;
        }

        .map-label.force-visible {
          opacity: 1 !important;
        }

        .stat-mini {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .stat-mini .label { font-size: 11px; color: #64748b; font-weight: 600; }
        .stat-mini .value { font-size: 14px; font-weight: 800; }

        .state-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .state-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .state-item .s-name { font-size: 10px; font-weight: 800; width: 25px; }
        .state-item .s-count { font-size: 10px; font-weight: 800; width: 15px; text-align: right; }

        .s-bar-bg {
          flex: 1;
          height: 4px;
          background: #f1f5f9;
          border-radius: 2px;
          overflow: hidden;
        }

        .s-bar-fill {
          height: 100%;
          background: hsl(var(--brand));
          box-shadow: 0 0 8px hsl(var(--brand) / 0.2);
        }

        .map-viz-container {
          flex: 1;
          position: relative;
          background: radial-gradient(circle at center, #ffffff 0%, #f1f5f9 100%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .map-grid-overlay {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px);
          background-size: 30px 30px;
          pointer-events: none;
        }

        .brazil-svg {
          width: 75%;
          height: 75%;
        }

        .map-node-group {
          cursor: pointer;
        }

        .map-label {
          opacity: 0;
          transition: opacity 0.3s ease;
          pointer-events: none;
        }

        .map-node-group:hover .map-label {
          opacity: 1;
        }

        .map-node-glow {
          animation: node-glow 3s infinite;
        }

        @keyframes node-glow {
          0%, 100% { transform: scale(1); opacity: 0.1; }
          50% { transform: scale(1.5); opacity: 0.2; }
        }

        .map-pin-pulse {
          animation: pin-pulse 2s infinite;
        }

        @keyframes pin-pulse {
          0% { r: 4; opacity: 0.8; stroke-width: 0; stroke: hsl(var(--brand)); }
          100% { r: 12; opacity: 0; stroke-width: 1.5; stroke: hsl(var(--brand)); }
        }

        .map-controls {
          position: absolute;
          right: 20px;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .ctrl-btn {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        }

        .ctrl-btn:hover {
          color: hsl(var(--brand));
          border-color: hsl(var(--brand));
          transform: translateY(-2px);
        }

        .map-overlay-card {
          position: absolute;
          top: 20px;
          right: 20px;
          padding: 12px 16px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .map-overlay-card h5 { margin: 0; font-size: 10px; font-weight: 900; letter-spacing: 0.05em; }
        .map-overlay-card p { margin: 2px 0 0; font-size: 10px; font-weight: 600; }

        .optimize-btn {
          width: 100%;
          padding: 12px;
          border: none;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 900;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          cursor: pointer;
          transition: 0.2s;
          box-shadow: 0 6px 15px hsl(var(--brand) / 0.2);
        }

        .optimize-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 20px hsl(var(--brand) / 0.3);
        }

        .sidebar-section.bottom {
          margin-top: auto;
        }
      `}</style>
    </div>,
    document.body
  );
};
