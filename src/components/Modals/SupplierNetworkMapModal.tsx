import React from 'react';
import { SidePanel } from '../Layout/SidePanel';
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
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const STATE_COORDS: Record<string, [number, number]> = {
  "AC":[-9.97499,-67.8243],"AL":[-9.66599,-35.735],"AP":[0.034934,-51.0694],"AM":[-3.10719,-60.0261],"BA":[-12.9714,-38.5111],"CE":[-3.71722,-38.5434],"DF":[-15.7801,-47.9292],"ES":[-19.318,-40.354],"GO":[-16.6864,-49.2643],"MA":[-2.53073,-44.3068],"MT":[-15.5961,-56.0966],"MS":[-20.4427,-54.6463],"MG":[-19.9208,-43.9378],"PA":[-1.45502,-48.5024],"PB":[-7.11532,-34.861],"PR":[-25.4284,-49.2733],"PE":[-8.04756,-34.877],"PI":[-5.08921,-42.8016],"RJ":[-22.9068,-43.1729],"RN":[-5.79448,-35.211],"RS":[-30.0277,-51.2287],"RO":[-8.76116,-63.9004],"RR":[2.8235,-60.6758],"SC":[-27.5969,-48.5495],"SP":[-23.5505,-46.6333],"SE":[-10.9472,-37.0731],"TO":[-10.1843,-48.3336]
};

const getCoord = (sup: any): [number, number] => {
  if (sup.latitude && sup.latitude !== 0) return [sup.latitude, sup.longitude];
  
  const hash = String(sup.id || sup.nome).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const state = sup.estado?.toUpperCase();
  
  if (state && STATE_COORDS[state]) {
    const jitterLat = ((hash % 10) - 5) * 0.05;
    const jitterLng = (((hash * 3) % 10) - 5) * 0.05;
    return [STATE_COORDS[state][0] + jitterLat, STATE_COORDS[state][1] + jitterLng];
  }
  
  return [-15 - ((hash % 13)), -50 - ((hash % 7))];
};

const defaultIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const selectedIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

L.Marker.prototype.options.icon = defaultIcon;
interface SupplierNetworkMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  suppliers: any[];
}

function MapBounds({ markers, focusedCoord }: { markers: [number, number][], focusedCoord?: [number, number] | null }) {
  const map = useMap();
  React.useEffect(() => {
    if (focusedCoord) {
      map.flyTo(focusedCoord, 7, { duration: 1.5 });
    } else if (markers.length > 0) {
      const bounds = L.latLngBounds(markers);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
      }
    }
  }, [markers, focusedCoord, map]);
  return null;
}

export const SupplierNetworkMapModal: React.FC<SupplierNetworkMapModalProps> = ({
  isOpen,
  onClose,
  suppliers
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [focusedCoord, setFocusedCoord] = React.useState<[number, number] | null>(null);
  const [showRoute, setShowRoute] = React.useState(false);

  if (!isOpen) return null;

  const uniqueCategories = Array.from(new Set(suppliers.map(s => s.categoria_nome || 'Geral').filter(Boolean)));

  const filteredSuppliers = suppliers.filter(sup => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      sup.nome?.toLowerCase().includes(term) || 
      sup.estado?.toLowerCase().includes(term) ||
      sup.cidade?.toLowerCase().includes(term) ||
      sup.logradouro?.toLowerCase().includes(term);
      
    const cat = sup.categoria_nome || 'Geral';
    const matchesCategory = selectedCategory ? cat === selectedCategory : true;
    
    // Filter out 0,0 coordinates that default to Africa
    const lat = sup.latitude !== undefined && sup.latitude !== null && sup.latitude !== 0 ? sup.latitude : null;
    const hasValidCoords = lat !== null || true; // Allow all for now, we assign mock coords below if missing
    
    return matchesSearch && matchesCategory && hasValidCoords;
  });

  const toggleSelection = (id: string) => {
    setShowRoute(false);
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleOptimize = () => {
    if (selectedIds.length < 2) {
      toast.error('Selecione pelo menos 2 fornecedores na lista para otimizar uma rota.');
      return;
    }
    setShowRoute(true);
    toast.success(`Rota otimizada simulada para ${selectedIds.length} paradas!`);
  };

  // Group by state for the visualization
  const stateStats = filteredSuppliers.reduce((acc: any, curr: any) => {
    const state = curr.estado || 'N/A';
    acc[state] = (acc[state] || 0) + 1;
    return acc;
  }, {});

  return (
    <SidePanel 
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      title="Mapa de Rede de Suprimentos"
      subtitle="Inteligência geográfica e logística da base de fornecedores"
      icon={Globe}
      hideSubmit={true}
    >
        <div className="map-modal-body" style={{ margin: '-32px' }}>
          <div className="map-sidebar">
            <div className="sidebar-section">
              <div className="inner-search-wrapper">
                <Search size={14} className="s-icon" />
                <input 
                  type="text" 
                  placeholder="Localizar parceiro..." 
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

            <div className="sidebar-section">
              <h4>CATEGORIA DE RISCO</h4>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', 
                  fontSize: '12px', color: '#1e293b', background: '#fff', cursor: 'pointer'
                }}
              >
                <option value="">Todas as Categorias</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
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
                {filteredSuppliers.slice(0, 15).map((sup, idx) => (
                  <div 
                    key={sup.id} 
                    className={`mini-sup-item ${selectedIds.includes(sup.id) ? 'active' : ''}`}
                    onClick={() => {
                      toggleSelection(sup.id);
                      setFocusedCoord(getCoord(sup));
                    }}
                  >
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '3px', 
                      border: '1px solid #cbd5e1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
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
                onClick={handleOptimize}
                style={{ background: 'hsl(var(--brand))', color: 'white' }}
              >
                <Navigation size={14} />
                OTIMIZAR SELEÇÃO
              </button>
            </div>
          </div>

          <div className="map-viz-container" style={{ position: 'relative' }}>
            <MapContainer 
              center={[-14.235, -51.925]} 
              zoom={4} 
              style={{ height: '100%', width: '100%', zIndex: 1 }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              />
              
              <MapBounds 
                markers={showRoute ? selectedIds.map(id => {
                  const sup = filteredSuppliers.find(s => s.id === id);
                  return sup ? getCoord(sup) : [0,0];
                }).filter(c => c[0] !== 0) : filteredSuppliers.map(sup => getCoord(sup))} 
                focusedCoord={focusedCoord}
              />
              
              {showRoute && selectedIds.length > 1 && (
                <Polyline 
                  positions={selectedIds.map(id => {
                    const sup = filteredSuppliers.find(s => s.id === id);
                    return sup ? getCoord(sup) : [0,0];
                  }).filter(c => c[0] !== 0)}
                  color="#10b981"
                  weight={4}
                  opacity={0.7}
                  dashArray="10, 10"
                />
              )}
              
              {filteredSuppliers.map((sup, idx) => {
                const [lat, lng] = getCoord(sup);
                const isSelected = selectedIds.includes(sup.id);
                
                return (
                  <Marker 
                    key={sup.id || idx} 
                    position={[lat, lng]}
                    icon={isSelected ? selectedIcon : defaultIcon}
                    eventHandlers={{
                      click: () => {
                        toggleSelection(sup.id);
                        setFocusedCoord([lat, lng]);
                      }
                    }}
                  >
                    <Popup>
                      <div style={{ fontWeight: 800 }}>{sup.nome}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontWeight: 600 }}>
                        {sup.categoria_nome || 'Geral'}
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                        <MapPin size={10} style={{ display: 'inline', marginRight: 4 }} />
                        {sup.cidade ? `${sup.cidade} - ` : ''}{sup.estado || 'N/A'}
                      </div>
                      <div style={{ marginTop: '12px' }}>
                        <button 
                          onClick={() => toggleSelection(sup.id)}
                          style={{
                            padding: '4px 8px', borderRadius: '4px', border: 'none',
                            background: selectedIds.includes(sup.id) ? '#ef4444' : 'hsl(var(--brand))',
                            color: 'white', fontSize: '10px', fontWeight: 800, cursor: 'pointer', width: '100%'
                          }}
                        >
                          {selectedIds.includes(sup.id) ? 'Remover Seleção' : 'Selecionar'}
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>

            <div className="map-controls">
              <button className="ctrl-btn" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', color: '#64748b' }}><TrendingUp size={16} /></button>
              <button className="ctrl-btn" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', color: '#64748b' }}><MapPin size={16} /></button>
              <button className="ctrl-btn" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', color: '#64748b' }}><Search size={16} /></button>
            </div>

            <div className="map-overlay-card" style={{ background: 'hsl(var(--bg-card))', border: '1px solid #e2e8f0', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
              <div className="pulse-active" style={{ width: '8px', height: '8px', background: 'hsl(var(--brand))', borderRadius: '50%' }}></div>
              <div>
                <h5 style={{ color: 'hsl(var(--brand))' }}>HUB LOGÍSTICO ATIVO</h5>
                <p style={{ color: '#64748b' }}>Otimização baseada na Localização Principal</p>
              </div>
            </div>
          </div>
        </div>

      <style>{`
        .map-modal-body {
          display: flex;
          height: calc(100vh - 120px);
          background: hsl(var(--bg-main));
          border-bottom-left-radius: 24px;
          border-bottom-right-radius: 24px;
          overflow: hidden;
        }

        .tauze-close-x-btn:hover {
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
          background: hsl(var(--bg-card));
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
          background: hsl(var(--bg-main));
          border: 1px solid hsl(var(--border));
          border-radius: 10px;
          font-size: 12px;
          font-weight: 600;
          color: #1e293b;
          transition: all 0.2s;
        }

        .inner-search-wrapper input:focus {
          outline: none;
          border-color: hsl(var(--brand));
          background: hsl(var(--bg-card));
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
          background: hsl(var(--bg-main));
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
          background: hsl(var(--bg-main));
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
    </SidePanel>
  );
};
