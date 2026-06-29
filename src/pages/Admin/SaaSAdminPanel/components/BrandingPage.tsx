import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Palette, Upload, Save, CheckCircle2, AlertTriangle,
  Image as ImageIcon, PaintBucket, Monitor, Smartphone,
  Eye, RotateCcw
} from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useSystemSettings } from '../../../../contexts/SystemSettingsContext';
import toast from 'react-hot-toast';

/* ─── MINI SIDEBAR PREVIEW ───────────────────────────────────────────────── */
const SidebarPreview: React.FC<{ name: string; color: string; logo: string | null; bgColor?: string; fontColor?: string }> = ({
  name, color, logo, bgColor, fontColor
}) => {
  const bg = bgColor || '#0a0f1a';
  const font = fontColor || 'rgba(255,255,255,0.75)';
  const fontActive = fontColor || '#ffffff';

  return (
    <div style={{
      width: 200,
      background: bg,
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.06)',
      boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{ padding: '14px 16px', borderBottom: `1px solid ${color}22`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}1a`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
          {logo
            ? <img src={logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            : <div style={{ width: 14, height: 14, background: color, borderRadius: 3 }} />}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: fontActive, maxWidth: 110, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{name || 'Tauze ERP'}</div>
          <div style={{ fontSize: 8, color: `${font}66`, letterSpacing: '0.08em', marginTop: 1 }}>SISTEMA DE GESTÃO</div>
        </div>
      </div>
      {/* Nav */}
      {[
        { label: 'Dashboard', active: true },
        { label: 'Financeiro', active: false },
        { label: 'Bovinocultura', active: false },
        { label: 'Estoque', active: false },
        { label: 'Relatórios', active: false },
      ].map((item, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '9px 16px',
          background: item.active ? `${color}18` : 'transparent',
          borderLeft: item.active ? `3px solid ${color}` : '3px solid transparent',
          cursor: 'default',
        }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: item.active ? color : `${font}33` }} />
          <span style={{ fontSize: 11, color: item.active ? fontActive : font, fontWeight: item.active ? 700 : 400 }}>
            {item.label}
          </span>
        </div>
      ))}
      {/* Bottom button */}
      <div style={{ padding: 12, borderTop: `1px solid rgba(255,255,255,0.06)`, marginTop: 4 }}>
        <div style={{ padding: '8px 12px', background: color, borderRadius: 8, textAlign: 'center', fontSize: 10, fontWeight: 700, color: '#fff', letterSpacing: '0.05em' }}>
          NOVO REGISTRO
        </div>
      </div>
    </div>
  );
};

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
export const BrandingPage: React.FC = () => {
  const { settings, refreshSettings } = useSystemSettings();
  const [loading, setLoading] = useState(false);

  const [systemName, setSystemName] = useState(settings.system_name || 'Tauze ERP');
  const [brandColor, setBrandColor] = useState(settings.brand_color || '#00b865');
  const [logoBase64, setLogoBase64] = useState<string | null>(settings.logo_base64);
  const [faviconBase64, setFaviconBase64] = useState<string | null>(settings.favicon_base64);
  const [sidebarBgColor, setSidebarBgColor] = useState(settings.sidebar_bg_color || '');
  const [sidebarFontColor, setSidebarFontColor] = useState(settings.sidebar_font_color || '');

  useEffect(() => {
    setSystemName(settings.system_name || 'Tauze ERP');
    setBrandColor(settings.brand_color || '#00b865');
    setLogoBase64(settings.logo_base64);
    setFaviconBase64(settings.favicon_base64);
    setSidebarBgColor(settings.sidebar_bg_color || '');
    setSidebarFontColor(settings.sidebar_font_color || '');
  }, [settings]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) { toast.error('O arquivo deve ter no máximo 300KB.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (type === 'logo') setLogoBase64(result);
      else setFaviconBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single();
      const payload: any = {
        system_name: systemName,
        brand_color: brandColor,
        logo_base64: logoBase64,
        favicon_base64: faviconBase64,
        sidebar_bg_color: sidebarBgColor || null,
        sidebar_font_color: sidebarFontColor || null,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from('system_settings').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_settings').insert(payload);
        if (error) throw error;
      }
      // Converte cor hex para HSL sem unidade para ser compatível com hsl(var(--brand))
      const hexToHslComponents = (hex: string): string => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0;
        const l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
          }
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
      };
      if (brandColor.startsWith('#') && brandColor.length === 7) {
        document.documentElement.style.setProperty('--brand', hexToHslComponents(brandColor));
      }
      toast.success('Identidade visual salva com sucesso!');
      await refreshSettings();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isDirty =
    systemName !== (settings.system_name || 'Tauze ERP')
    || brandColor !== (settings.brand_color || '#00b865')
    || logoBase64 !== settings.logo_base64
    || faviconBase64 !== settings.favicon_base64
    || sidebarBgColor !== (settings.sidebar_bg_color || '')
    || sidebarFontColor !== (settings.sidebar_font_color || '');

  return (
    <motion.div
      key="branding-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="saas-view-wrapper management-content"
      style={{ width: '100%' }}
    >
      {/* ── LAYOUT SPLIT ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 32, alignItems: 'start' }}>

        {/* ── FORMS COLUMN ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* BLOCO: IDENTIDADE */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(0,184,101,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Palette size={18} color="var(--brand)" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Marca do Sistema</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Nome e cor principal que aparecem em toda a plataforma</div>
              </div>
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>NOME DO SISTEMA</label>
                <input
                  className="tauze-input"
                  value={systemName}
                  onChange={(e) => setSystemName(e.target.value)}
                  placeholder="Ex: Agro ERP"
                />
                <p style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 6 }}>Aparece na aba do navegador e no menu lateral.</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>COR PRINCIPAL DA MARCA</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ position: 'relative' }}>
                    <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)}
                      style={{ width: 46, height: 46, padding: 3, border: '2px solid hsl(var(--border))', borderRadius: 10, cursor: 'pointer', background: 'hsl(var(--bg-main))' }} />
                  </div>
                  <input className="tauze-input" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} placeholder="#00b865" />
                  <button onClick={() => setBrandColor('#00b865')} title="Restaurar padrão"
                    style={{ width: 38, height: 38, flexShrink: 0, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--bg-main))', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={14} color="hsl(var(--text-muted))" />
                  </button>
                </div>
                <p style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 6 }}>Substituirá o verde padrão em botões e destaques.</p>
              </div>
            </div>
          </div>

          {/* BLOCO: SIDEBAR */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Monitor size={18} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Cores do Menu Lateral</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>Personalize fundo e texto do sidebar — deixe em branco para usar o tema escuro padrão</div>
              </div>
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>COR DE FUNDO</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={sidebarBgColor || '#0a0f1a'} onChange={(e) => setSidebarBgColor(e.target.value)}
                    style={{ width: 46, height: 46, padding: 3, border: '2px solid hsl(var(--border))', borderRadius: 10, cursor: 'pointer', background: 'hsl(var(--bg-main))' }} />
                  <input className="tauze-input" value={sidebarBgColor} onChange={(e) => setSidebarBgColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} placeholder="Padrão do tema" />
                  {sidebarBgColor && (<button onClick={() => setSidebarBgColor('')} style={{ padding: '0 12px', height: 46, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--bg-main))', cursor: 'pointer', fontSize: 11, color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>Limpar</button>)}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8, letterSpacing: '0.05em' }}>COR DO TEXTO</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input type="color" value={sidebarFontColor || '#ffffff'} onChange={(e) => setSidebarFontColor(e.target.value)}
                    style={{ width: 46, height: 46, padding: 3, border: '2px solid hsl(var(--border))', borderRadius: 10, cursor: 'pointer', background: 'hsl(var(--bg-main))' }} />
                  <input className="tauze-input" value={sidebarFontColor} onChange={(e) => setSidebarFontColor(e.target.value)} style={{ flex: 1, fontFamily: 'monospace' }} placeholder="Padrão do tema" />
                  {sidebarFontColor && (<button onClick={() => setSidebarFontColor('')} style={{ padding: '0 12px', height: 46, border: '1px solid hsl(var(--border))', borderRadius: 8, background: 'hsl(var(--bg-main))', cursor: 'pointer', fontSize: 11, color: 'hsl(var(--text-muted))', whiteSpace: 'nowrap' }}>Limpar</button>)}
                </div>
              </div>
            </div>
          </div>

          {/* BLOCO: IMAGENS */}
          <div style={{
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 16,
            overflow: 'hidden',
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageIcon size={18} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))' }}>Logotipo & Favicon</div>
                <div style={{ fontSize: 12, color: 'hsl(var(--text-muted))' }}>PNG ou SVG com fundo transparente. Máximo 300KB cada</div>
              </div>
            </div>
            <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {/* LOGO */}
              <div style={{ border: '2px dashed hsl(var(--border))', borderRadius: 12, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'hsl(var(--bg-main))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                  {logoBase64
                    ? <img src={logoBase64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    : <ImageIcon size={24} color="hsl(var(--text-muted))" />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))', marginBottom: 2 }}>Logo Principal</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>Aparece no menu lateral e na Landing Page</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                    <Upload size={13} /> {logoBase64 ? 'Substituir' : 'Fazer upload'}
                    <input type="file" accept="image/png,image/svg+xml" onChange={(e) => handleFileChange(e, 'logo')} style={{ display: 'none' }} />
                  </label>
                  {logoBase64 && (
                    <button onClick={() => setLogoBase64(null)} style={{ padding: '8px 12px', border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', borderRadius: 8, cursor: 'pointer', fontSize: 12, color: '#ef4444', fontWeight: 600 }}>
                      Remover
                    </button>
                  )}
                </div>
                {logoBase64 && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} color="#00b865" /><span style={{ fontSize: 11, color: '#00b865' }}>Logo carregada</span></div>}
              </div>

              {/* FAVICON */}
              <div style={{ border: '2px dashed hsl(var(--border))', borderRadius: 12, padding: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: 'hsl(var(--bg-main))', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid hsl(var(--border))' }}>
                  {faviconBase64
                    ? <img src={faviconBase64} alt="Favicon" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                    : <PaintBucket size={24} color="hsl(var(--text-muted))" />}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))', marginBottom: 2 }}>Favicon</div>
                  <div style={{ fontSize: 11, color: 'hsl(var(--text-muted))' }}>Ícone na aba do navegador (32×32px ideal)</div>
                </div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                  <Upload size={13} /> {faviconBase64 ? 'Substituir' : 'Fazer upload'}
                  <input type="file" accept="image/png,image/svg+xml,image/x-icon" onChange={(e) => handleFileChange(e, 'favicon')} style={{ display: 'none' }} />
                </label>
                {faviconBase64 && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle2 size={12} color="#00b865" /><span style={{ fontSize: 11, color: '#00b865' }}>Favicon carregado</span></div>}
              </div>
            </div>
          </div>
        </div>

        {/* ── PREVIEW COLUMN ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'hsl(var(--text-muted))', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={11} /> PRÉVIA AO VIVO
          </div>
          <SidebarPreview
            name={systemName}
            color={brandColor}
            logo={logoBase64}
            bgColor={sidebarBgColor}
            fontColor={sidebarFontColor}
          />
          <p style={{ fontSize: 11, color: 'hsl(var(--text-muted))', marginTop: 12, lineHeight: 1.5, textAlign: 'center' }}>
            Atualiza em tempo real conforme você edita os campos ao lado.
          </p>
        </div>
      </div>

      {/* ── FOOTER ── */}
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
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Aplicando...</>
              : <><Save size={16} />Aplicar Identidade Visual</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
