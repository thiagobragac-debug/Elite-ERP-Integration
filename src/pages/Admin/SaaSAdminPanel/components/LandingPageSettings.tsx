import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, Plus, Trash2, Layout, Award, HelpCircle, FileText, Smartphone, Mail, AlertTriangle, Eye, Image as ImageIcon, ChevronUp, ChevronDown } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useSystemSettings } from '../../../../contexts/SystemSettingsContext';
import { ToggleSwitch } from '../../../../components/UI/ToggleSwitch';
import toast from 'react-hot-toast';

/* ─── LIVE PREVIEW COMPONENTS ────────────────────────────────────────────── */
const PreviewHero: React.FC<{ title: string; subtitle: string; cta: string }> = ({ title, subtitle, cta }) => (
  <div style={{ padding: '60px 40px', textAlign: 'center', background: 'radial-gradient(circle at center, rgba(0,184,101,0.15) 0%, transparent 60%)' }}>
    <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 16, lineHeight: 1.1 }}>{title || 'O Sistema Completo para sua Operação'}</h1>
    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 400, margin: '0 auto 32px' }}>{subtitle || 'Acompanhe rebanho, frota, e fluxo de caixa em um único lugar.'}</p>
    <div style={{ display: 'inline-block', padding: '12px 24px', background: 'var(--brand, #00b865)', color: '#fff', borderRadius: 8, fontWeight: 700, fontSize: 13 }}>
      {cta || 'Comece Agora'}
    </div>
  </div>
);

const PreviewFeatures: React.FC = () => (
  <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--brand, #00b865)', letterSpacing: '0.1em', textAlign: 'center', marginBottom: 8 }}>RECURSOS</div>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 32 }}>Tudo que você precisa</div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {[1, 2, 3, 4].map(i => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: 16, borderRadius: 12 }}>
          <div style={{ width: 24, height: 24, background: 'rgba(0,184,101,0.2)', borderRadius: 6, marginBottom: 12 }} />
          <div style={{ width: '80%', height: 10, background: 'rgba(255,255,255,0.2)', borderRadius: 4, marginBottom: 8 }} />
          <div style={{ width: '60%', height: 8, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
        </div>
      ))}
    </div>
  </div>
);

const PreviewTestimonials: React.FC<{ items: any[] }> = ({ items }) => (
  <div style={{ padding: '40px 20px' }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 32 }}>O que dizem os produtores</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {(items.length > 0 ? items.slice(0, 2) : [1, 2]).map((item, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.04)', padding: 20, borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontStyle: 'italic', marginBottom: 16 }}>
            "{item.text || 'Excelente sistema, mudou completamente a forma como gerencio minha fazenda.'}"
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{item.name || 'João Silva'}</div>
              <div style={{ fontSize: 10, color: 'var(--brand, #00b865)' }}>{item.role || 'Pecuarista'}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const PreviewFaq: React.FC<{ items: any[] }> = ({ items }) => (
  <div style={{ padding: '40px 20px', background: 'rgba(255,255,255,0.02)' }}>
    <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', textAlign: 'center', marginBottom: 32 }}>Perguntas Frequentes</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {(items.length > 0 ? items.slice(0, 3) : [1, 2, 3]).map((item, i) => (
        <div key={i} style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>{item.q || 'Como funciona o pagamento?'}</span>
          <span style={{ color: 'rgba(255,255,255,0.3)' }}>+</span>
        </div>
      ))}
    </div>
  </div>
);

const PreviewFooter: React.FC<{ whatsapp: string; systemName: string }> = ({ whatsapp, systemName }) => (
  <div style={{ padding: '40px 20px', background: '#05080f', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
      <div style={{ width: 80, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
        <div style={{ width: 24, height: 24, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
      </div>
    </div>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>© {new Date().getFullYear()} {systemName || 'Tauze ERP'}. Todos os direitos reservados.</div>
  </div>
);

/* ─── MAIN COMPONENT ─────────────────────────────────────────────────────── */
type BuilderSection = 'hero' | 'features' | 'testimonials' | 'faq' | 'seo';

export const LandingPageSettings: React.FC = () => {
  const { settings, refreshSettings } = useSystemSettings();
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [activeSection, setActiveSection] = useState<BuilderSection>('hero');

  // Hero State
  const [heroTitle, setHeroTitle] = useState(settings.landing_hero_title || '');
  const [heroSubtitle, setHeroSubtitle] = useState(settings.landing_hero_subtitle || '');
  const [heroCta, setHeroCta] = useState(settings.landing_hero_cta || '');
  
  // Testimonials State
  const [testimonials, setTestimonials] = useState<any[]>(settings.landing_testimonials || []);
  
  // FAQ State
  const [faqItems, setFaqItems] = useState<any[]>(settings.landing_faq_items || []);

  // SEO, Tracking & Footer
  const [seoDescription, setSeoDescription] = useState(settings.landing_seo_description || '');
  const [seoKeywords, setSeoKeywords] = useState(settings.landing_seo_keywords || '');
  const [analyticsId, setAnalyticsId] = useState(settings.landing_analytics_id || '');
  const [pixelId, setPixelId] = useState(settings.landing_pixel_id || '');
  const [whatsapp, setWhatsapp] = useState(settings.landing_whatsapp || '');
  const [contactEmail, setContactEmail] = useState(settings.landing_contact_email || '');
  const [socialInstagram, setSocialInstagram] = useState(settings.landing_social_instagram || '');
  const [socialLinkedin, setSocialLinkedin] = useState(settings.landing_social_linkedin || '');
  const [socialYoutube, setSocialYoutube] = useState(settings.landing_social_youtube || '');

  // Visibility Toggles
  const [showTicker, setShowTicker] = useState(settings.landing_show_ticker ?? true);
  const [showMockup, setShowMockup] = useState(settings.landing_show_mockup ?? true);
  const [showFaq, setShowFaq] = useState(settings.landing_show_faq ?? true);

  useEffect(() => {
    setHeroTitle(settings.landing_hero_title || '');
    setHeroSubtitle(settings.landing_hero_subtitle || '');
    setHeroCta(settings.landing_hero_cta || '');
    if (settings.landing_testimonials?.length) setTestimonials(settings.landing_testimonials);
    if (settings.landing_faq_items?.length) setFaqItems(settings.landing_faq_items);
    setSeoDescription(settings.landing_seo_description || '');
    setSeoKeywords(settings.landing_seo_keywords || '');
    setAnalyticsId(settings.landing_analytics_id || '');
    setPixelId(settings.landing_pixel_id || '');
    setWhatsapp(settings.landing_whatsapp || '');
    setContactEmail(settings.landing_contact_email || '');
    setSocialInstagram(settings.landing_social_instagram || '');
    setSocialLinkedin(settings.landing_social_linkedin || '');
    setSocialYoutube(settings.landing_social_youtube || '');
    setShowTicker(settings.landing_show_ticker ?? true);
    setShowMockup(settings.landing_show_mockup ?? true);
    setShowFaq(settings.landing_show_faq ?? true);
  }, [settings]);

  useEffect(() => {
    const isDifferent = 
      heroTitle !== (settings.landing_hero_title || '') ||
      heroSubtitle !== (settings.landing_hero_subtitle || '') ||
      heroCta !== (settings.landing_hero_cta || '') ||
      JSON.stringify(testimonials) !== JSON.stringify(settings.landing_testimonials || []) ||
      JSON.stringify(faqItems) !== JSON.stringify(settings.landing_faq_items || []) ||
      seoDescription !== (settings.landing_seo_description || '') ||
      seoKeywords !== (settings.landing_seo_keywords || '') ||
      analyticsId !== (settings.landing_analytics_id || '') ||
      pixelId !== (settings.landing_pixel_id || '') ||
      whatsapp !== (settings.landing_whatsapp || '') ||
      contactEmail !== (settings.landing_contact_email || '') ||
      socialInstagram !== (settings.landing_social_instagram || '') ||
      socialLinkedin !== (settings.landing_social_linkedin || '') ||
      socialYoutube !== (settings.landing_social_youtube || '') ||
      showTicker !== (settings.landing_show_ticker ?? true) ||
      showMockup !== (settings.landing_show_mockup ?? true) ||
      showFaq !== (settings.landing_show_faq ?? true);
      
    setIsDirty(isDifferent);
  }, [
    heroTitle, heroSubtitle, heroCta, testimonials, faqItems, seoDescription, seoKeywords, 
    analyticsId, pixelId, whatsapp, contactEmail, socialInstagram, socialLinkedin, 
    socialYoutube, showTicker, showMockup, showFaq, settings
  ]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: existing } = await supabase.from('system_settings').select('id').limit(1).single();
      const payload: any = {
        landing_hero_title: heroTitle,
        landing_hero_subtitle: heroSubtitle,
        landing_hero_cta: heroCta,
        landing_testimonials: testimonials,
        landing_faq_items: faqItems,
        landing_seo_description: seoDescription,
        landing_seo_keywords: seoKeywords,
        landing_analytics_id: analyticsId,
        landing_pixel_id: pixelId,
        landing_whatsapp: whatsapp,
        landing_contact_email: contactEmail,
        landing_social_instagram: socialInstagram,
        landing_social_linkedin: socialLinkedin,
        landing_social_youtube: socialYoutube,
        landing_show_ticker: showTicker,
        landing_show_mockup: showMockup,
        landing_show_faq: showFaq,
        updated_at: new Date().toISOString(),
      };
      if (existing) {
        const { error } = await supabase.from('system_settings').update(payload).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_settings').insert(payload);
        if (error) throw error;
      }
      toast.success('Landing Page atualizada com sucesso!');
      await refreshSettings();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const renderSectionForm = () => {
    switch (activeSection) {
      case 'hero':
        return (
          <div className="builder-form-anim">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: 24 }}>Dobra Principal (Hero)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="tauze-field-group">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>TÍTULO PRINCIPAL (H1)</label>
                <input className="tauze-input" value={heroTitle} onChange={e => setHeroTitle(e.target.value)} placeholder="O Sistema de Gestão do Produtor do Futuro" />
              </div>
              <div className="tauze-field-group">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>SUBTÍTULO</label>
                <textarea className="tauze-input" style={{ minHeight: 80 }} value={heroSubtitle} onChange={e => setHeroSubtitle(e.target.value)} placeholder="Gerencie rebanho, lavoura e financeiro..." />
              </div>
              <div className="tauze-field-group">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>TEXTO DO BOTÃO PRINCIPAL (CTA)</label>
                <input className="tauze-input" value={heroCta} onChange={e => setHeroCta(e.target.value)} placeholder="Comece seu Teste Grátis" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid hsl(var(--border))' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Exibir Carrossel de Clientes (Ticker)</span>
                  <ToggleSwitch checked={showTicker} onChange={setShowTicker} size="sm" />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'hsl(var(--text-primary))' }}>Exibir Mockup do Sistema</span>
                  <ToggleSwitch checked={showMockup} onChange={setShowMockup} size="sm" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'features':
        return (
          <div className="builder-form-anim">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: 24 }}>Recursos & Benefícios</h3>
            <div style={{ padding: 24, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Layout size={20} color="#3b82f6" />
              </div>
              <div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: '#3b82f6', margin: '0 0 6px' }}>Módulo Gerenciado pelo Código</h4>
                <p style={{ fontSize: 12, color: 'hsl(var(--text-secondary))', margin: 0, lineHeight: 1.5 }}>
                  Os recursos listados na Landing Page são gerados automaticamente a partir dos módulos ativos no sistema (Financeiro, Bovinocultura, etc). Não é necessário configurá-los manualmente aqui.
                </p>
              </div>
            </div>
          </div>
        );
      case 'testimonials':
        return (
          <div className="builder-form-anim">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Depoimentos (Prova Social)</h3>
              <button onClick={() => setTestimonials([...testimonials, { name: '', role: '', text: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {testimonials.map((t, idx) => (
                <div key={idx} style={{ padding: 20, background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))' }}>DEPOIMENTO {idx + 1}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => { if(idx > 0) { const nt = [...testimonials]; const temp = nt[idx]; nt[idx] = nt[idx-1]; nt[idx-1] = temp; setTestimonials(nt); } }} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'hsl(var(--text-muted))' }} disabled={idx === 0}><ChevronUp size={14} /></button>
                      <button onClick={() => { if(idx < testimonials.length-1) { const nt = [...testimonials]; const temp = nt[idx]; nt[idx] = nt[idx+1]; nt[idx+1] = temp; setTestimonials(nt); } }} style={{ background: 'none', border: 'none', cursor: idx === testimonials.length-1 ? 'default' : 'pointer', color: idx === testimonials.length-1 ? 'rgba(255,255,255,0.1)' : 'hsl(var(--text-muted))' }} disabled={idx === testimonials.length-1}><ChevronDown size={14} /></button>
                      <div style={{ width: 1, height: 12, background: 'hsl(var(--border))', margin: '0 4px' }} />
                      <button onClick={() => setTestimonials(testimonials.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <input className="tauze-input" style={{ fontSize: 13 }} value={t.name} onChange={(e) => { const nt = [...testimonials]; nt[idx].name = e.target.value; setTestimonials(nt); }} placeholder="Nome (Ex: João Silva)" />
                    <input className="tauze-input" style={{ fontSize: 13 }} value={t.role} onChange={(e) => { const nt = [...testimonials]; nt[idx].role = e.target.value; setTestimonials(nt); }} placeholder="Cargo (Ex: Produtor de Soja)" />
                  </div>
                  <textarea className="tauze-input" style={{ fontSize: 13, minHeight: 60 }} value={t.text} onChange={(e) => { const nt = [...testimonials]; nt[idx].text = e.target.value; setTestimonials(nt); }} placeholder="Depoimento..." />
                </div>
              ))}
              {testimonials.length === 0 && <p style={{ fontSize: 13, color: 'hsl(var(--text-muted))', textAlign: 'center', padding: 20 }}>Nenhum depoimento cadastrado.</p>}
            </div>
          </div>
        );
      case 'faq':
        return (
          <div className="builder-form-anim">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Perguntas Frequentes (FAQ)</h3>
                <ToggleSwitch checked={showFaq} onChange={setShowFaq} size="sm" />
              </div>
              <button onClick={() => setFaqItems([...faqItems, { q: '', a: '' }])} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
                <Plus size={14} /> Adicionar
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {faqItems.map((faq, idx) => (
                <div key={idx} style={{ padding: 20, background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'hsl(var(--text-muted))' }}>PERGUNTA {idx + 1}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <button onClick={() => { if(idx > 0) { const nf = [...faqItems]; const temp = nf[idx]; nf[idx] = nf[idx-1]; nf[idx-1] = temp; setFaqItems(nf); } }} style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', color: idx === 0 ? 'rgba(255,255,255,0.1)' : 'hsl(var(--text-muted))' }} disabled={idx === 0}><ChevronUp size={14} /></button>
                      <button onClick={() => { if(idx < faqItems.length-1) { const nf = [...faqItems]; const temp = nf[idx]; nf[idx] = nf[idx+1]; nf[idx+1] = temp; setFaqItems(nf); } }} style={{ background: 'none', border: 'none', cursor: idx === faqItems.length-1 ? 'default' : 'pointer', color: idx === faqItems.length-1 ? 'rgba(255,255,255,0.1)' : 'hsl(var(--text-muted))' }} disabled={idx === faqItems.length-1}><ChevronDown size={14} /></button>
                      <div style={{ width: 1, height: 12, background: 'hsl(var(--border))', margin: '0 4px' }} />
                      <button onClick={() => setFaqItems(faqItems.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'hsl(var(--text-muted))' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                  <input className="tauze-input" style={{ fontSize: 13, marginBottom: 12 }} value={faq.q} onChange={(e) => { const nf = [...faqItems]; nf[idx].q = e.target.value; setFaqItems(nf); }} placeholder="Pergunta (Ex: Tem período de teste grátis?)" />
                  <textarea className="tauze-input" style={{ fontSize: 13, minHeight: 60 }} value={faq.a} onChange={(e) => { const nf = [...faqItems]; nf[idx].a = e.target.value; setFaqItems(nf); }} placeholder="Resposta..." />
                </div>
              ))}
            </div>
          </div>
        );
      case 'seo':
        return (
          <div className="builder-form-anim">
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'hsl(var(--text-primary))', marginBottom: 24 }}>SEO, Contato & Rodapé</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="tauze-field-group">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>DESCRIÇÃO PARA GOOGLE (META SEO)</label>
                <textarea className="tauze-input" style={{ minHeight: 60 }} value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="A melhor plataforma de gestão agrícola..." />
              </div>
              <div className="tauze-field-group">
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>PALAVRAS-CHAVE SEO (SEPARADAS POR VÍRGULA)</label>
                <input className="tauze-input" value={seoKeywords} onChange={e => setSeoKeywords(e.target.value)} placeholder="erp rural, gestão de fazenda, software agro..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>GOOGLE ANALYTICS ID</label>
                  <input className="tauze-input" value={analyticsId} onChange={e => setAnalyticsId(e.target.value)} placeholder="G-XXXXXXXXXX" />
                </div>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>FACEBOOK PIXEL ID</label>
                  <input className="tauze-input" value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="XXXXXXXXXXXXXXX" />
                </div>
              </div>
              <div style={{ height: 1, background: 'hsl(var(--border))', margin: '8px 0' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>WHATSAPP DE VENDAS</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, paddingLeft: 12 }}>
                    <Smartphone size={16} color="hsl(var(--text-muted))" />
                    <input className="tauze-input" style={{ border: 'none', background: 'transparent' }} value={whatsapp} onChange={e => setWhatsapp(e.target.value)} onBlur={() => { if(whatsapp) setWhatsapp(whatsapp.replace(/\D/g, '')) }} placeholder="Ex: 5511999999999" />
                  </div>
                </div>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>EMAIL DE CONTATO</label>
                  <div style={{ display: 'flex', alignItems: 'center', background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: 8, paddingLeft: 12 }}>
                    <Mail size={16} color="hsl(var(--text-muted))" />
                    <input className="tauze-input" style={{ border: 'none', background: 'transparent' }} value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="contato@empresa.com" />
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>INSTAGRAM</label>
                  <input className="tauze-input" value={socialInstagram} onChange={e => setSocialInstagram(e.target.value)} onBlur={() => { if(socialInstagram && !socialInstagram.startsWith('http')) setSocialInstagram('https://' + socialInstagram.replace('@','')) }} placeholder="https://instagram.com/..." />
                </div>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>LINKEDIN</label>
                  <input className="tauze-input" value={socialLinkedin} onChange={e => setSocialLinkedin(e.target.value)} onBlur={() => { if(socialLinkedin && !socialLinkedin.startsWith('http')) setSocialLinkedin('https://' + socialLinkedin) }} placeholder="https://linkedin.com/..." />
                </div>
                <div className="tauze-field-group">
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'hsl(var(--text-muted))', marginBottom: 8 }}>YOUTUBE</label>
                  <input className="tauze-input" value={socialYoutube} onChange={e => setSocialYoutube(e.target.value)} onBlur={() => { if(socialYoutube && !socialYoutube.startsWith('http')) setSocialYoutube('https://' + socialYoutube) }} placeholder="https://youtube.com/..." />
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const navItems: { id: BuilderSection; label: string; icon: React.ElementType }[] = [
    { id: 'hero', label: 'Dobra Principal', icon: Layout },
    { id: 'features', label: 'Benefícios', icon: Award },
    { id: 'testimonials', label: 'Depoimentos', icon: FileText },
    { id: 'faq', label: 'Perguntas FAQ', icon: HelpCircle },
    { id: 'seo', label: 'SEO & Rodapé', icon: Mail },
  ];

  return (
    <motion.div
      key="landing-builder-page"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="saas-view-wrapper management-content"
      style={{ width: '100%' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr 340px', gap: 24, alignItems: 'start', minHeight: 'calc(100vh - 200px)' }}>
        
        {/* ── LEFT NAV (BUILDER MENU) ── */}
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 16, overflow: 'hidden', position: 'sticky', top: 20 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid hsl(var(--border))' }}>
            <h4 style={{ fontSize: 12, fontWeight: 800, color: 'hsl(var(--text-muted))', letterSpacing: '0.08em', margin: 0 }}>CONSTRUTOR DE SITE</h4>
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {navItems.map(item => {
              const active = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(0,184,101,0.08)' : 'transparent',
                    color: active ? '#00b865' : 'hsl(var(--text-secondary))',
                    fontWeight: active ? 700 : 500, fontSize: 13, transition: 'all 0.2s',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={16} /> {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── CENTER EDIT FORM ── */}
        <div style={{ background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: 16, padding: 32, minHeight: 500 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSection} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              {renderSectionForm()}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── RIGHT LIVE PREVIEW ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'hsl(var(--text-muted))', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={11} /> PREVIEW AO VIVO
          </div>
          <div style={{
            width: '100%',
            background: '#04070d',
            borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.07)',
            overflow: 'hidden',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            fontFamily: 'Inter, sans-serif',
            height: 500,
            overflowY: 'auto'
          }}>
            {/* Nav mockup */}
            <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 60, height: 20, background: 'rgba(255,255,255,0.1)', borderRadius: 4 }} />
              <div style={{ width: 40, height: 20, background: 'var(--brand, #00b865)', borderRadius: 4 }} />
            </div>

            {/* Active Section Preview */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <AnimatePresence mode="wait">
                <motion.div key={activeSection} initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.2 }} style={{ height: '100%' }}>
                  {activeSection === 'hero' && <PreviewHero title={heroTitle} subtitle={heroSubtitle} cta={heroCta} />}
                  {activeSection === 'features' && <PreviewFeatures />}
                  {activeSection === 'testimonials' && <PreviewTestimonials items={testimonials} />}
                  {activeSection === 'faq' && <PreviewFaq items={faqItems} />}
                  {activeSection === 'seo' && <PreviewFooter whatsapp={whatsapp} systemName={settings.system_name || 'Tauze ERP'} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* ── GLOBAL FOOTER (SAVE) ── */}
      <div style={{ position: 'sticky', bottom: 20, marginTop: 40 }}>
        {isDirty && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <AlertTriangle size={18} color="#ef4444" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>Você tem alterações não salvas</div>
              <div style={{ fontSize: 12, color: 'rgba(239,68,68,0.8)' }}>Lembre-se de publicar suas alterações antes de sair desta página, caso contrário elas serão perdidas.</div>
            </div>
          </motion.div>
        )}
        <div style={{ background: 'hsl(var(--bg-card))', border: isDirty ? '1px solid #ef4444' : '1px solid hsl(var(--brand))', boxShadow: isDirty ? '0 8px 32px rgba(239,68,68,0.15)' : '0 8px 32px rgba(0,184,101,0.2)', borderRadius: 16, padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.3s' }}>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: 'hsl(var(--text-primary))', margin: 0 }}>Publicar Alterações</h4>
            <p style={{ fontSize: 12, color: 'hsl(var(--text-secondary))', margin: 0 }}>As modificações feitas na Landing Page serão refletidas imediatamente na página principal.</p>
          </div>
          <button
            className="primary-btn"
            onClick={handleSave}
            disabled={loading || !isDirty}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 32px', fontSize: 14,
              opacity: (!isDirty && !loading) ? 0.5 : 1
            }}
          >
            {loading
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />Publicando...</>
              : <><Save size={16} />{isDirty ? 'Publicar Agora' : 'Página Atualizada'}</>}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
