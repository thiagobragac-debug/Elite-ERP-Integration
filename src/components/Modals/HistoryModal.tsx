import React from 'react';
import { X, History, Calendar, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { SidePanel } from '../Layout/SidePanel';
import { EmptyState } from '../Feedback/EmptyState';

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  value?: string;
  status?: 'success' | 'warning' | 'info';
  userName?: string;
  userAvatar?: string;
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
    <SidePanel
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
      <div style={{ gridColumn: 'span 4' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3.5px solid hsl(var(--border))', borderTopColor: 'hsl(var(--brand))', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Carregando histórico...</span>
          </div>
        ) : items.length === 0 ? (
          <div style={{ padding: '24px 0' }}>
            <EmptyState 
              icon={History}
              title="Nenhum registro encontrado"
              description="Não há histórico ou movimentações registradas para este item."
            />
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxHeight: '500px', overflowY: 'auto', paddingRight: '4px' }}>
            {Object.entries(
              items.reduce((acc, item) => {
                const d = new Date(item.date);
                const monthYear = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
                if (!acc[key]) acc[key] = [];
                acc[key].push(item);
                return acc;
              }, {} as Record<string, typeof items>)
            ).map(([month, monthItems], groupIdx) => (
              <div key={month} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</div>
                  <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }}></div>
                </div>
                
                {monthItems.map((item, idx) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (groupIdx * 0.1) + (idx * 0.05) }}
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
                        {item.userName && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' }}>
                            {item.userAvatar ? (
                              <img src={item.userAvatar} alt={item.userName} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'hsl(var(--brand)/0.2)', color: 'hsl(var(--brand))', fontSize: '9px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>
                                {item.userName.charAt(0)}
                              </div>
                            )}
                            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>{item.userName}</span>
                          </div>
                        )}
                      </div>
                      {item.value && (
                        <div style={{ 
                          fontSize: '14px', fontWeight: 900, padding: '6px 14px', borderRadius: '10px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))',
                          color: item.status === 'success' ? '#16a34a' : item.status === 'warning' ? '#f59e0b' : 'hsl(var(--text-main))'
                        }}>
                          {item.value}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </SidePanel>
  );
};
