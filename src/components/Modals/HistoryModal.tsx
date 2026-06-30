import React from 'react';
import { X, History, Calendar, ArrowRight, Fuel, Wrench, Bell, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { LoadingSkeleton } from '../Feedback/LoadingSkeleton';
import { SidePanel } from '../Layout/SidePanel';
import { EmptyState } from '../Feedback/EmptyState';

interface HistoryItem {
  id: string;
  date: string;
  title: string;
  subtitle: string;
  value?: string;
  status?: 'success' | 'warning' | 'info';
  type?: 'fuel' | 'maintenance' | 'telemetry' | 'default';
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
  loading,
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => {
        e.preventDefault();
        onClose();
      }}
      title={title}
      subtitle={subtitle}
      icon={History}
      submitLabel="Fechar"
      hideSubmit={true}
      size="medium"
    >
      <div style={{ gridColumn: 'span 4' }}>
        {loading ? (
          <LoadingSkeleton variant="table" rows={4} columns={1} fullScreen={false} />
        ) : items.length === 0 ? (
          <div style={{ padding: '24px 0' }}>
            <EmptyState
              icon={History}
              title="Nenhum registro encontrado"
              description="Não há histórico ou movimentações registradas para este item."
            />
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '24px',
              maxHeight: '500px',
              overflowY: 'auto',
              paddingRight: '4px',
            }}
          >
            {Object.entries(
              items.reduce(
                (acc, item) => {
                  const d = new Date(item.date);
                  const monthYear = d.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
                  const key = monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
                  if (!acc[key]) {
                    acc[key] = [];
                  }
                  acc[key].push(item);
                  return acc;
                },
                {} as Record<string, typeof items>
              )
            ).map(([month, monthItems], groupIdx) => (
              <div key={month} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      fontSize: '11px',
                      fontWeight: 900,
                      color: 'hsl(var(--text-muted))',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {month}
                  </div>
                  <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }} />
                </div>

                {monthItems.map((item, idx) => (
                  <div key={item.id} style={{ display: 'flex', gap: '16px', position: 'relative' }}>
                    {/* Timeline Line */}
                    {idx !== monthItems.length - 1 && (
                      <div style={{ position: 'absolute', left: '23px', top: '48px', bottom: '-12px', width: '2px', background: 'hsl(var(--border))' }} />
                    )}
                    
                    {/* Timeline Icon Node */}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: item.type === 'fuel' ? 'rgba(59, 130, 246, 0.1)' : item.type === 'maintenance' ? 'rgba(245, 158, 11, 0.1)' : item.type === 'telemetry' ? 'rgba(239, 68, 68, 0.1)' : 'hsl(var(--bg-card))',
                      border: `1px solid ${item.type === 'fuel' ? '#3b82f6' : item.type === 'maintenance' ? '#f59e0b' : item.type === 'telemetry' ? '#ef4444' : 'hsl(var(--border))'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: item.type === 'fuel' ? '#3b82f6' : item.type === 'maintenance' ? '#f59e0b' : item.type === 'telemetry' ? '#ef4444' : 'hsl(var(--text-muted))',
                      flexShrink: 0,
                      zIndex: 1,
                    }}>
                      {item.type === 'fuel' ? <Fuel size={20} /> : item.type === 'maintenance' ? <Wrench size={20} /> : item.type === 'telemetry' ? <Bell size={20} /> : <Activity size={20} />}
                    </div>

                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: groupIdx * 0.1 + idx * 0.05 }}
                      style={{
                        flex: 1,
                        padding: '16px',
                        background: 'hsl(var(--bg-main)/0.4)',
                        borderRadius: '16px',
                        border: '1px solid hsl(var(--border))',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          fontSize: '10px',
                          fontWeight: 800,
                          color: 'hsl(var(--brand))',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}
                      >
                        <Calendar size={12} />
                        <span>{new Date(item.date).toLocaleDateString()}</span>
                      </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '16px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: 'hsl(var(--text-main))',
                            marginBottom: '2px',
                          }}
                        >
                          {item.title}
                        </h3>
                        <p
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: 'hsl(var(--text-muted))',
                          }}
                        >
                          {item.subtitle}
                        </p>
                        {item.userName && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              marginTop: '8px',
                            }}
                          >
                            {item.userAvatar ? (
                              <img
                                src={item.userAvatar}
                                alt={item.userName}
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  objectFit: 'cover',
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '16px',
                                  height: '16px',
                                  borderRadius: '50%',
                                  background: 'hsl(var(--brand)/0.2)',
                                  color: 'hsl(var(--brand))',
                                  fontSize: '9px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 900,
                                }}
                              >
                                {item.userName.charAt(0)}
                              </div>
                            )}
                            <span
                              style={{
                                fontSize: '10px',
                                color: 'hsl(var(--text-muted))',
                                fontWeight: 700,
                              }}
                            >
                              {item.userName}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.value && (
                        <div
                          style={{
                            fontSize: '14px',
                            fontWeight: 900,
                            padding: '6px 14px',
                            borderRadius: '10px',
                            background: 'hsl(var(--bg-card))',
                            border: '1px solid hsl(var(--border))',
                            color:
                              item.status === 'success'
                                ? '#16a34a'
                                : item.status === 'warning'
                                  ? '#f59e0b'
                                  : 'hsl(var(--text-main))',
                          }}
                        >
                          {item.value}
                        </div>
                      )}
                    </div>
                  </motion.div>
                  </div>
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
