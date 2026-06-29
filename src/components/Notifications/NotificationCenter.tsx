import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  CreditCard,
  Scale,
  Beef,
  Clock,
} from 'lucide-react';
import { LoadingSkeleton } from '../Feedback/LoadingSkeleton';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { useFarmFilter } from '../../hooks/useFarmFilter';

import { isValidUUID } from '../../utils/validation';

interface Notification {
  id: string;
  type: 'alert' | 'info' | 'success' | 'warning';
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: any;
}

export const NotificationCenter: React.FC = () => {
  const { activeTenantId, activeFarmId, applyFarmFilter } = useFarmFilter();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications();
  }, [activeFarmId, activeTenantId]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchNotifications = async () => {
    if (!activeTenantId || !isValidUUID(activeTenantId)) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const notes: Notification[] = [];
    try {
      let billsQuery = supabase
        .from('contas_pagar')
        .select('id, descricao, data_vencimento, valor_total').eq('tenant_id', activeTenantId)
        .eq('status', 'PENDENTE')
        .lt('data_vencimento', new Date().toISOString())
        .order('data_vencimento', { ascending: true })
        .limit(15);

      let weightsQuery = supabase
        .from('pesagens')
        .select('id, created_at, peso').eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      let animalsQuery = supabase
        .from('animais')
        .select('id, brinco, created_at').eq('tenant_id', activeTenantId)
        .order('created_at', { ascending: false })
        .limit(10);

      billsQuery = applyFarmFilter(billsQuery);
      weightsQuery = applyFarmFilter(weightsQuery);
      animalsQuery = applyFarmFilter(animalsQuery);

      const [billsResult, weightsResult, animalsResult] = await Promise.all([
        billsQuery,
        weightsQuery,
        animalsQuery,
      ]);

      const bills = billsResult.data || [];
      bills.forEach((b) =>
        notes.push({
          id: `bill-${b.id}`,
          type: 'alert',
          title: 'Conta em Atraso',
          description: `${b.descricao} · ${Number(b.valor_total).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
          time: new Date(b.data_vencimento).toLocaleDateString('pt-BR'),
          read: false,
          icon: CreditCard,
        })
      );

      const weights = weightsResult.data || [];
      weights.forEach((w) =>
        notes.push({
          id: `w-${w.id}`,
          type: 'info',
          title: 'Nova Pesagem Registrada',
          description: `Peso: ${w.peso}kg — registrado com sucesso no sistema.`,
          time: new Date(w.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: true,
          icon: Scale,
        })
      );

      const animals = animalsResult.data || [];
      animals.forEach((a) =>
        notes.push({
          id: `ani-${a.id}`,
          type: 'success',
          title: 'Animal Cadastrado',
          description: `Brinco #${a.brinco} adicionado ao rebanho.`,
          time: new Date(a.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          read: true,
          icon: Beef,
        })
      );
    } catch (err) {
      console.error(err);
    }
    notes.sort((a, b) => (a.read ? 1 : -1));
    setNotifications(notes);
    setLoading(false);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const dismiss = (id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id));

  const typeConfig = {
    alert: { color: '#ef4444', bg: '#ef444415' },
    warning: { color: '#f59e0b', bg: '#f59e0b15' },
    info: { color: '#3b82f6', bg: '#3b82f615' },
    success: { color: '#10b981', bg: '#10b98115' },
  };

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button
        className="action-btn"
        onClick={() => setOpen((o) => !o)}
        style={{ position: 'relative' }}
        title="Central de Notificações"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: '#ef4444',
              color: '#fff',
              fontSize: '0.6rem',
              fontWeight: 900,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid hsl(var(--bg-main))',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 12px)',
              width: '380px',
              zIndex: 9999,
              background: 'hsl(var(--bg-card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '20px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid hsl(var(--border))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: 'hsl(var(--bg-card))',
                position: 'sticky',
                top: 0,
                zIndex: 10,
              }}
            >
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: '0.85rem', color: 'hsl(var(--text-main))' }}
                >
                  Notificações
                </div>
                <div
                  style={{
                    fontSize: '0.7rem',
                    color: 'hsl(var(--text-muted))',
                    fontWeight: 500,
                    marginTop: '2px',
                  }}
                >
                  {unreadCount > 0 ? `${unreadCount} não lidas` : 'Tudo em dia'}
                </div>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    color: 'hsl(var(--brand))',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Marcar lidas
                </button>
              )}
            </div>

            {/* List */}
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {loading ? (
                <LoadingSkeleton variant="table" rows={3} columns={2} fullScreen={false} />
              ) : notifications.length === 0 ? (
                <div
                  style={{ padding: '40px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}
                >
                  <CheckCircle2
                    size={40}
                    style={{
                      margin: '0 auto 12px',
                      opacity: 0.3,
                      display: 'block',
                      color: '#10b981',
                    }}
                  />
                  <p
                    style={{ fontWeight: 800, fontSize: '0.9rem', color: 'hsl(var(--text-main))' }}
                  >
                    Tudo certo por aqui!
                  </p>
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Nenhum alerta ou notificação pendente.
                  </p>
                </div>
              ) : (
                notifications.map((n) => {
                  const cfg = typeConfig[n.type];
                  return (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 16px',
                        borderBottom: '1px solid hsl(var(--border))',
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'flex-start',
                        background: n.read ? 'transparent' : 'hsl(var(--brand) / 0.03)',
                        transition: 'background 0.2s',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        if (n.read) e.currentTarget.style.background = 'hsl(var(--border) / 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = n.read ? 'transparent' : 'hsl(var(--brand) / 0.03)';
                      }}
                    >
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: cfg.bg,
                          color: cfg.color,
                        }}
                      >
                        <n.icon size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: 600,
                              color: 'hsl(var(--text-main))',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            {n.title}
                            {!n.read && (
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: 'hsl(var(--brand))',
                                  display: 'inline-block',
                                }}
                              />
                            )}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              dismiss(n.id);
                            }}
                            style={{ color: 'hsl(var(--text-muted))', padding: '2px', transition: 'color 0.2s' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'hsl(var(--text-main))')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'hsl(var(--text-muted))')}
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p
                          style={{
                            fontSize: '0.75rem',
                            color: 'hsl(var(--text-muted))',
                            margin: '2px 0 4px',
                            fontWeight: 400,
                            lineHeight: 1.4,
                          }}
                        >
                          {n.description}
                        </p>
                        <span
                          style={{
                            fontSize: '0.65rem',
                            color: 'hsl(var(--text-muted))',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Clock size={10} />
                          {n.time}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>


          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
