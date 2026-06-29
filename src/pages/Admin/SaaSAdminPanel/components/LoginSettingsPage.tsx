import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LogIn, Save, BarChart2, Eye, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useSystemSettings } from '../../../../contexts/SystemSettingsContext';
import toast from 'react-hot-toast';

/* ─── MINI LOGIN PREVIEW ─────────────────────────────────────────────────── */
const LoginPreview: React.FC<{ title: string; subtitle: string; kpis: any[] }> = ({ title, subtitle, kpis }) => (
  <div style={{
    width: '100%',
    background: '#080d18',
    borderRadius: 16,
    border: '1px solid rgba(255,255,255,0.07)',
    overflow: 'hidden',
    boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    fontFamily: 'Inter, sans-serif',
  }}>
    {/* Top accent */}
    <div style={{ height: 3, background: 'linear-gradient(90deg, #00b865, #3b82f6, #8b5cf6)' }} />
    <div style={{ padding: '24px 20px' }}>
      {/* Title */}
      <div style={{ fontSize: 17, fontWeight: 900, color: '#fff', lineHeight: 1.2, marginBottom: 8 }}>
        {title || 'Bem-vindo de volta à sua operação.'}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, marginBottom: 20 }}>
        {subtitle || 'Acompanhe rebanho, frota e finanças em tempo real.'}
      </div>
      {/* KPI grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(kpis || []).slice(0, 4).map((kpi: any, i: number) => (
          <div key={i} style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 10,
            padding: '12px',
          }}>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em', marginBottom: 4, textTransform: 'uppercase' }}>
              {kpi.label || 'INDICADOR'}
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: kpi.color || '#00b865', letterSpacing: '-0.02em' }}>
              {kpi.value || '—'}
            </div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>
              {kpi.change || ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ─── KPI EDITOR ROW ─────────────────────────────────────────────────────── */
const KpiRow: React.FC<{
  kpi: any; idx: number;
  onChange: (idx: number, field: string, val: string) => void;
  onRemove: (idx: number) => void;
}> = ({ kpi, idx, onChange, onRemove }) => (
  <div style={{
    background: 'hsl(var(--bg-main))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 12,
    padding: 16,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))', letterSpacing: '0.06em' }}>KPI {idx + 1}</span>
      <button onClick={() => onRemove(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' }}>
        <Trash2 size={13} />
      </button>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
      <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 4, letterSpacing: '0.05em' }}>RÓTULO</label>
        <input className="tauze-input" style={{ fontSize: 12 }} value={kpi.label} placeholder="REBANHO ATIVO" onChange={(e) => onChange(idx, 'label', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 4, letterSpacing: '0.05em' }}>VALOR</label>
        <input className="tauze-input" style={{ fontSize: 12 }} value={kpi.value} placeholder="4.820 cab." onChange={(e) => onChange(idx, 'value', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 4, letterSpacing: '0.05em' }}>VARIAÇÃO</label>
        <input className="tauze-input" style={{ fontSize: 12 }} value={kpi.change} placeholder="+3,2% mês" onChange={(e) => onChange(idx, 'change', e.target.value)} />
      </div>
      <div>
        <label style={{ display: 'block', fontSize: 10, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 4, letterSpacing: '0.05em' }}>COR</label>
        <input type="color" value={kpi.color || '#00b865'} onChange={(e) => onChange(idx, 'color', e.target.value)}
          style={{ width: 44, height: 44, padding: 3, border: '2px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', background: 'hsl(var(--bg-card))' }} />
      </div>
    </div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export const LoginSettingsPage: React.FC = () => {
  const { settings, refreshSettings } = useSystemSettings();
  const [loading, setLoading] = useState(false);

  const [loginHeroTitle, setLoginHeroTitle] = useState(settings.login_hero_title || 'Bem-vindo de volta à sua operação.');
  const [loginHeroSubtitle, setLoginHeroSubtitle] = useState(settings.login_hero_subtitle || '');
  const [loginKpis, setLoginKpis] = useState<any[]>(settings.login_kpis || [
    { label: 'REBANHO ATIVO', value: '4.820 cab.', change: '+3,2% mês', positive: true, color: '#00b865', spark: [] },
    { label: 'GMD MÉDIO DO LOTE', value: '1,42 kg/dia', change: 'Meta ✓', positive: true, color: '#3b82f6', spark: [] },
    { label: 'CAIXA CONSOLIDADO', value: 'R$ 2,4M', change: '+12% mês', positive: true, color: '#8b5cf6', spark: [] },
    { label: 'EFICIÊNCIA DIESEL', value: '14,8 L/h', change: '-2% consumo', positive: true, color: '#f59e0b', spark: [] },
  ]);

  useEffect(() => {
    setLoginHeroTitle(settings.login_hero_title || 'Bem-vindo de volta à sua operação.');
    setLoginHeroSubtitle(settings.login_hero_subtitle || '');
    if (settings.login_kpis?.length) setLoginKpis(settings.login_kpis);
  }, [settings]);

  const handleKpiChange = (idx: number, field: string, val: string) => {
    const updated = [...loginKpis];
    updated[idx] = { ...updated[idx], [field]: val };
    setLoginKpis(updated);
  };

  const addKpi = () => {
    if (loginKpis.length >= 6) { toast.error('Máximo de 6 KPIs.'); return; }
    setLoginKpis([...loginKpis, { label: 'NOVO KPI', value: '—', change: '', positive: true, color: '#00b865', spark: [] }]);
  };

  const removeKpi = (idx: number) => {
    if (loginKpis.length <= 2) { toast.error('Mínimo de 2 KPIs.'); return; }
    setLoginKpis(loginKpis.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single();
      const payload: any = {
        login_hero_title: loginHeroTitle,
        login_hero_subtitle: loginHeroSubtitle,
        login_kpis: loginKpis,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from('system_settings').update(payload).eq('id', existing.id).eq('tenant_id', activeTenantId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_settings').insert(payload);
        if (error) throw error;
      }
      toast.success('Tela de login atualizada!');
      await refreshSettings();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      key="login-settings-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="saas-view-wrapper management-content"
      style={{ width: '100%' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 32, alignItems: 'start' }}>

        {/* ── FORMS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Textos */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LogIn size={18} color="#6366f1" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Textos da Tela de Login</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Exibidos na sidebar ilustrativa ao lado do formulário de acesso</div>
              </div>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>TÍTULO PRINCIPAL</label>
                <input className="tauze-input" value={loginHeroTitle} onChange={(e) => setLoginHeroTitle(e.target.value)} placeholder="Bem-vindo de volta à sua operação." />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>SUBTÍTULO</label>
                <textarea className="tauze-input" style={{ minHeight: 80, resize: 'vertical' }} value={loginHeroSubtitle} onChange={(e) => setLoginHeroSubtitle(e.target.value)} placeholder="Acompanhe rebanho, frota, finanças e colheita em tempo real — tudo em um único painel unificado." />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,184,101,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BarChart2 size={16} color="#00b865" />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>KPIs Ilustrativos</div>
                  <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Cards de métricas exibidos como referência visual na tela de login ({loginKpis.length}/6)</div>
                </div>
              </div>
              <button onClick={addKpi} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <Plus size={13} /> Adicionar KPI
              </button>
            </div>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {loginKpis.map((kpi, idx) => (
                <KpiRow key={idx} kpi={kpi} idx={idx} onChange={handleKpiChange} onRemove={removeKpi} />
              ))}
            </div>
          </div>
        </div>

        {/* ── PREVIEW ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'hsl(var(--text-muted))', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={11} /> PRÉVIA AO VIVO
          </div>
          <LoginPreview title={loginHeroTitle} subtitle={loginHeroSubtitle} kpis={loginKpis} />
          <p style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 12, lineHeight: 1.5, textAlign: 'center' }}>
            Esta coluna aparece ao lado do formulário de login na tela de acesso.
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, paddingTop: 24, borderTop: '1px solid hsl(var(--border))' }}>
        <button className="primary-btn" onClick={handleSave} disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 28px', fontSize: 14 }}>
          {loading
            ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Salvando...</>
            : <><Save size={16} />Salvar Configurações do Login</>}
        </button>
      </div>
    </motion.div>
  );
};
