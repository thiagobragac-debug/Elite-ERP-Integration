import React from 'react';
import { X, History, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FormModal } from '../Forms/FormModal';

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
  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onClose(); }}
      title={title}
      subtitle={subtitle}
      icon={History}
      submitLabel="Fechar"
      hideSubmit={true}
      size="medium"
    >
      <div style={{ gridColumn: 'span 2' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3.5px solid hsl(var(--border))', borderTopColor: 'hsl(var(--brand))', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Carregando histórico...</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Nenhum registro encontrado.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
            {items.map((item, idx) => (
              <motion.div 
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                style={{ 
                  padding: '20px', background: 'hsl(var(--bg-main)/0.4)', borderRadius: '20px', border: '1px solid hsl(var(--border))',
                  display: 'flex', flexDirection: 'column', gap: '12px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px', fontWeight: 800, color: 'hsl(var(--brand))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Calendar size={12} />
                  <span>{new Date(item.date).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'hsl(var(--text-main))', marginBottom: '2px' }}>{item.title}</h3>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--text-muted))' }}>{item.subtitle}</p>
                  </div>
                  {item.value && (
                    <div style={{ 
                      fontSize: '14px', fontWeight: 900, padding: '6px 14px', borderRadius: '10px', background: 'white', border: '1px solid hsl(var(--border))',
                      color: item.status === 'success' ? '#16a34a' : item.status === 'warning' ? '#f59e0b' : 'hsl(var(--text-main))'
                    }}>
                      {item.value}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </FormModal>
  );
};
