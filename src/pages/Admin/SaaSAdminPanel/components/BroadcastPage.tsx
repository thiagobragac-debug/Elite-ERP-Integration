import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Save, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useSystemSettings } from '../../../../contexts/SystemSettingsContext';
import { ToggleSwitch } from '../../../../components/UI/ToggleSwitch';
import toast from 'react-hot-toast';

export const BroadcastPage: React.FC = () => {
  const { settings, refreshSettings } = useSystemSettings();
  const [loading, setLoading] = useState(false);

  const [broadcastActive, setBroadcastActive] = useState(settings.broadcast_active || false);
  const [broadcastMessage, setBroadcastMessage] = useState(settings.broadcast_message || '');

  useEffect(() => {
    setBroadcastActive(settings.broadcast_active || false);
    setBroadcastMessage(settings.broadcast_message || '');
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single();
      const payload: any = {
        broadcast_active: broadcastActive,
        broadcast_message: broadcastMessage,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from('system_settings').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_settings').insert(payload);
        if (error) throw error;
      }
      toast.success('Comunicado salvo com sucesso!');
      await refreshSettings();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isDirty = broadcastActive !== settings.broadcast_active || broadcastMessage !== settings.broadcast_message;

  return (
    <motion.div
      key="broadcast-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="saas-view-wrapper management-content"
      style={{ width: '100%', maxWidth: 800 }}
    >
      <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={18} color="#f59e0b" />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Comunicado Global do Sistema</div>
              <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Exibido como banner no topo para todos os usuários de todas as empresas</div>
            </div>
          </div>
          <ToggleSwitch checked={broadcastActive} onChange={setBroadcastActive} size="sm" labelOn="ATIVO" labelOff="INATIVO" showStatus />
        </div>

        <div style={{ padding: 24 }}>
          {broadcastActive && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={16} color="#f59e0b" />
              <span style={{ fontSize: 13, color: '#f59e0b', fontWeight: 600 }}>Banner ativo — todos os usuários verão essa mensagem ao entrar no sistema.</span>
            </div>
          )}

          <div className="tauze-field-group">
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>MENSAGEM DO ALERTA</label>
            <textarea
              className="tauze-input"
              style={{ minHeight: 120, resize: 'vertical' }}
              value={broadcastMessage}
              onChange={(e) => setBroadcastMessage(e.target.value)}
              placeholder="Ex: Realizaremos manutenção programada no domingo (21/06) das 02h às 04h. O sistema poderá ficar instável."
              disabled={!broadcastActive}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32, paddingTop: 24, borderTop: '1px solid hsl(var(--border))' }}>
        {isDirty && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f59e0b' }}>
            <AlertTriangle size={14} />
            <span>Há alterações não salvas</span>
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={loading}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14 }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Salvando...</>
              : <><Save size={16} />Salvar Comunicado</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
