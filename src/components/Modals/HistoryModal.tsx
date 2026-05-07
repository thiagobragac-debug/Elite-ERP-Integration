import React from 'react';
import { X, History, Calendar, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  value?: string;
  status?: 'success' | 'warning' | 'info';
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  items: HistoryItem[];
  loading?: boolean;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  items,
  loading 
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div 
          className="premium-card history-modal-content"
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          onClick={e => e.stopPropagation()}
        >
          <header className="modal-header-premium">
            <div className="header-icon-elite">
              <History size={24} />
            </div>
            <div className="header-text-elite">
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button className="close-btn-premium" onClick={onClose} title="Fechar">
              <X size={20} />
            </button>
          </header>

          <div className="history-body">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <span>Carregando histórico...</span>
              </div>
            ) : items.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum registro encontrado.</p>
              </div>
            ) : (
              <div className="history-list">
                {items.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="history-item"
                  >
                    <div className="item-date">
                      <Calendar size={14} />
                      <span>{new Date(item.date).toLocaleDateString()}</span>
                    </div>
                    <div className="item-main">
                      <div className="item-info">
                        <h3>{item.title}</h3>
                        <p>{item.subtitle}</p>
                      </div>
                      {item.value && (
                        <div className={`item-value ${item.status || ''}`}>
                          {item.value}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <footer className="modal-footer">
            <button className="close-btn-premium" onClick={onClose}>Fechar</button>
          </footer>
        </motion.div>
      </div>

      <style>{`        .modal-overlay {
          position: fixed; inset: 0;
          background: rgba(2, 6, 23, 0.6); backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          z-index: 10000; padding: 20px;
        }

        .history-modal-content {
          width: 100%; max-width: 600px; max-height: 85vh;
          display: flex; flex-direction: column;
          background: hsl(var(--bg-card));
          padding: 0; overflow: hidden;
          border-radius: 28px; border: 1px solid hsl(var(--border));
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
        }

        .modal-header-premium {
          display: flex; align-items: center; gap: 16px;
          padding: 24px 32px; border-bottom: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main) / 0.3);
        }

        .header-icon-elite {
          width: 48px; height: 48px; border-radius: 14px;
          background: hsl(var(--brand) / 0.1); color: hsl(var(--brand));
          display: flex; align-items: center; justify-content: center;
          border: 1px solid hsl(var(--brand) / 0.2);
        }

        .header-text-elite h2 { font-size: 1.1rem; font-weight: 800; color: hsl(var(--text-main)); text-transform: uppercase; letter-spacing: 0.02em; }
        .header-text-elite p { font-size: 0.85rem; color: hsl(var(--text-muted)); font-weight: 500; margin-top: 2px; }

        .close-btn-premium {
          margin-left: auto; width: 36px; height: 36px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 10px; border: 1px solid hsl(var(--border));
          background: hsl(var(--bg-main)); color: hsl(var(--text-muted));
          cursor: pointer; transition: 0.2s;
        }
        .close-btn-premium:hover { background: hsl(var(--bg-card)); color: hsl(var(--brand)); border-color: hsl(var(--brand)); transform: rotate(90deg); }

        .history-body { flex: 1; overflow-y: auto; padding: 32px; }
        .history-list { display: flex; flex-direction: column; gap: 12px; }

        .history-item {
          display: flex; flex-direction: column; gap: 10px;
          padding: 20px; background: hsl(var(--bg-main) / 0.5);
          border-radius: 20px; border: 1px solid hsl(var(--border));
          transition: 0.2s;
        }
        .history-item:hover { border-color: hsl(var(--brand) / 0.3); background: hsl(var(--bg-card)); }

        .item-date {
          display: flex; align-items: center; gap: 8px;
          font-size: 0.7rem; font-weight: 800;
          color: hsl(var(--brand)); text-transform: uppercase; letter-spacing: 0.05em;
        }

        .item-main { display: flex; justify-content: space-between; align-items: center; gap: 16px; }
        .item-info h3 { font-size: 0.95rem; font-weight: 700; color: hsl(var(--text-main)); margin-bottom: 2px; }
        .item-info p { font-size: 0.8rem; color: hsl(var(--text-muted)); font-weight: 500; }

        .item-value {
          font-size: 1rem; font-weight: 800; color: hsl(var(--text-main));
          padding: 6px 14px; background: hsl(var(--bg-card));
          border-radius: 10px; border: 1px solid hsl(var(--border));
        }
        .item-value.success { color: hsl(161 64% 39%); border-color: hsl(161 64% 39% / 0.3); background: hsl(161 64% 39% / 0.05); }
        .item-value.warning { color: hsl(38 92% 50%); border-color: hsl(38 92% 50% / 0.3); background: hsl(38 92% 50% / 0.05); }
        .item-value.info { color: hsl(var(--brand)); border-color: hsl(var(--brand) / 0.3); background: hsl(var(--brand) / 0.05); }

        .modal-footer {
          padding: 20px 32px; border-top: 1px solid hsl(var(--border));
          display: flex; justify-content: flex-end; background: hsl(var(--bg-main) / 0.3);
        }

        .loading-state, .empty-state { padding: 48px; text-align: center; color: hsl(var(--text-muted)); font-weight: 600; }
        .spinner { width: 32px; height: 32px; border: 3px solid hsl(var(--border)); border-top-color: hsl(var(--brand)); border-radius: 50%; margin: 0 auto 16px; animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </AnimatePresence>
  );
};
