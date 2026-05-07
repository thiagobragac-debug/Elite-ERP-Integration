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
          <header className="modal-header">
            <div className="header-icon">
              <History size={24} />
            </div>
            <div className="header-text">
              <h2>{title}</h2>
              {subtitle && <p>{subtitle}</p>}
            </div>
            <button className="close-btn" onClick={onClose}>
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
            <button className="secondary-btn" onClick={onClose}>Fechar</button>
          </footer>
        </motion.div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .history-modal-content {
          width: 100%;
          max-width: 600px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
          background: white;
          padding: 0;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          border-bottom: 1px solid var(--border);
          background: var(--bg-main);
        }

        .header-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--primary-light);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-text h2 {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .header-text p {
          font-size: 0.875rem;
          color: var(--text-muted);
        }

        .close-btn {
          margin-left: auto;
          color: var(--text-muted);
          transition: color 0.2s;
        }

        .close-btn:hover {
          color: var(--text-main);
        }

        .history-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .history-item {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          background: var(--bg-main);
          border-radius: 12px;
          border: 1px solid var(--border);
        }

        .item-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          text-transform: uppercase;
        }

        .item-main {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .item-info h3 {
          font-size: 0.9375rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .item-info p {
          font-size: 0.8125rem;
          color: var(--text-muted);
        }

        .item-value {
          font-size: 1.125rem;
          font-weight: 800;
          color: var(--text-main);
          padding: 4px 12px;
          background: white;
          border-radius: 8px;
          border: 1px solid var(--border);
        }

        .item-value.success { color: #10b981; border-color: #10b98130; background: #10b98105; }
        .item-value.warning { color: #f59e0b; border-color: #f59e0b30; background: #f59e0b05; }
        .item-value.info { color: #3b82f6; border-color: #3b82f630; background: #3b82f605; }

        .modal-footer {
          padding: 16px 24px;
          border-top: 1px solid var(--border);
          display: flex;
          justify-content: flex-end;
          background: var(--bg-main);
        }

        .loading-state, .empty-state {
          padding: 48px;
          text-align: center;
          color: var(--text-muted);
        }

        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          margin: 0 auto 16px;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </AnimatePresence>
  );
};
