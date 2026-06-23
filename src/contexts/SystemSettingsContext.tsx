import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

interface SystemSettings {
  system_name: string;
  logo_base64: string | null;
  favicon_base64: string | null;
  brand_color: string;
  sidebar_bg_color: string | null;
  sidebar_font_color: string | null;
  landing_hero_title: string;
  landing_hero_subtitle: string;
  landing_hero_cta: string;
  landing_show_ticker: boolean;
  landing_show_mockup: boolean;
  landing_show_faq: boolean;
  landing_faq_items: Array<{ q: string; a: string }>;
  landing_whatsapp: string;
  landing_contact_email: string;
  landing_testimonials: Array<{ name: string; role: string; text: string }>;
  landing_analytics_id: string | null;
  landing_pixel_id: string | null;
  landing_seo_description: string;
  landing_seo_keywords: string;
  landing_social_instagram: string | null;
  landing_social_linkedin: string | null;
  landing_social_youtube: string | null;
  landing_features: Array<{ icon: string; title: string; desc: string }>;
  landing_chat_script: string | null;
  landing_mockup_type: string;
  landing_mockup_image_url: string | null;
  landing_mockup_video_embed: string | null;
  broadcast_active: boolean;
  broadcast_message: string;
  login_hero_title: string;
  login_hero_subtitle: string;
  login_kpis: Array<{
    label: string;
    value: string;
    change: string;
    positive: boolean;
    color: string;
    spark: number[];
  }>;
}

interface SystemSettingsContextProps {
  settings: SystemSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SystemSettings = {
  system_name: 'Tauze ERP',
  logo_base64: null,
  favicon_base64: null,
  brand_color: '#00b865',
  sidebar_bg_color: null,
  sidebar_font_color: null,
  landing_hero_title: 'Tecnologia de Precisão que Transforma sua Produção',
  landing_hero_subtitle: 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.',
  landing_hero_cta: 'Teste Gratuito',
  landing_show_ticker: true,
  landing_show_mockup: true,
  landing_show_faq: true,
  landing_faq_items: [],
  landing_whatsapp: '5511999999999',
  landing_contact_email: 'contato@tauze.com.br',
  landing_testimonials: [],
  landing_analytics_id: null,
  landing_pixel_id: null,
  landing_seo_description: '',
  landing_seo_keywords: '',
  landing_social_instagram: null,
  landing_social_linkedin: null,
  landing_social_youtube: null,
  landing_features: [],
  landing_chat_script: null,
  landing_mockup_type: 'image',
  landing_mockup_image_url: null,
  landing_mockup_video_embed: null,
  broadcast_active: false,
  broadcast_message: '',
  login_hero_title: 'Bem-vindo de volta à sua operação.',
  login_hero_subtitle: 'Acompanhe rebanho, frota, finanças e colheita em tempo real — tudo em um único painel unificado.',
  login_kpis: [
    {
      label: 'REBANHO ATIVO',
      value: '4.820 cab.',
      change: '+3,2% mês',
      positive: true,
      color: '#00b865',
      spark: [42, 44, 41, 45, 48, 47, 50, 52]
    },
    {
      label: 'GMD MÉDIO DO LOTE',
      value: '1,42 kg/dia',
      change: 'Meta ✓',
      positive: true,
      color: '#3b82f6',
      spark: [1.1, 1.2, 1.15, 1.28, 1.3, 1.35, 1.4, 1.42]
    },
    {
      label: 'CAIXA CONSOLIDADO',
      value: 'R$ 2,4M',
      change: '+12% mês',
      positive: true,
      color: '#8b5cf6',
      spark: [2.1, 2.15, 2.1, 2.2, 2.25, 2.3, 2.35, 2.4]
    },
    {
      label: 'EFICIÊNCIA DIESEL',
      value: '14,8 L/h',
      change: '-2% consumo',
      positive: true,
      color: '#f59e0b',
      spark: [16.2, 16.0, 15.8, 15.5, 15.2, 15.0, 14.9, 14.8]
    }
  ]
};

const SystemSettingsContext = createContext<SystemSettingsContextProps>({
  settings: defaultSettings,
  loading: true,
  refreshSettings: async () => {},
});

// Helper to convert HEX to HSL values for CSS variables (e.g., "161 64% 39%")
function hexToHSL(hex: string) {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.substring(1, 3), 16);
    g = parseInt(hex.substring(3, 5), 16);
    b = parseInt(hex.substring(5, 7), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const SystemSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (!error && data) {
        setSettings({
          system_name: data.system_name || 'Tauze ERP',
          logo_base64: data.logo_base64,
          favicon_base64: data.favicon_base64,
          brand_color: data.brand_color || '#00b865',
          sidebar_bg_color: data.sidebar_bg_color || null,
          sidebar_font_color: data.sidebar_font_color || null,
          landing_hero_title: data.landing_hero_title || 'Tecnologia de Precisão que Transforma sua Produção',
          landing_hero_subtitle: data.landing_hero_subtitle || 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.',
          landing_hero_cta: data.landing_hero_cta || 'Teste Gratuito',
          landing_show_ticker: data.landing_show_ticker ?? true,
          landing_show_mockup: data.landing_show_mockup ?? true,
          landing_show_faq: data.landing_show_faq ?? true,
          landing_faq_items: Array.isArray(data.landing_faq_items) ? data.landing_faq_items : [],
          landing_whatsapp: data.landing_whatsapp || '5511999999999',
          landing_contact_email: data.landing_contact_email || 'contato@tauze.com.br',
          landing_testimonials: Array.isArray(data.landing_testimonials) ? data.landing_testimonials : [],
          landing_analytics_id: data.landing_analytics_id || null,
          landing_pixel_id: data.landing_pixel_id || null,
          landing_seo_description: data.landing_seo_description || 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.',
          landing_seo_keywords: data.landing_seo_keywords || 'erp rural, gestao fazenda, rfid pecuaria, controle frota agricola',
          landing_social_instagram: data.landing_social_instagram || null,
          landing_social_linkedin: data.landing_social_linkedin || null,
          landing_social_youtube: data.landing_social_youtube || null,
          landing_features: Array.isArray(data.landing_features) ? data.landing_features : [],
          landing_chat_script: data.landing_chat_script || null,
          landing_mockup_type: data.landing_mockup_type || 'simulador',
          landing_mockup_image_url: data.landing_mockup_image_url || null,
          landing_mockup_video_embed: data.landing_mockup_video_embed || null,
          broadcast_active: data.broadcast_active ?? false,
          broadcast_message: data.broadcast_message || '',
          login_hero_title: data.login_hero_title || 'Bem-vindo de volta à sua operação.',
          login_hero_subtitle: data.login_hero_subtitle || 'Acompanhe rebanho, frota, finanças e colheita em tempo real — tudo em um único painel unificado.',
          login_kpis: Array.isArray(data.login_kpis) ? data.login_kpis : defaultSettings.login_kpis,
        });
      }
    } catch (err) {
      console.warn('SystemSettingsContext: Failed to fetch settings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Apply visual changes globally whenever settings change
  useEffect(() => {
    if (!loading) {
      // 1. Update Document Title
      document.title = settings.system_name;

      // 2. Update CSS Variables for Brand Color
      if (settings.brand_color && settings.brand_color.startsWith('#')) {
        const hslValue = hexToHSL(settings.brand_color);
        document.documentElement.style.setProperty('--brand', hslValue);
      } else {
        document.documentElement.style.setProperty('--brand', settings.brand_color);
      }

      // 3. Update Favicon
      if (settings.favicon_base64) {
        let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.head.appendChild(link);
        }
        link.href = settings.favicon_base64;
      }

      // 4. Update Sidebar Colors
      if (settings.sidebar_bg_color) {
        document.documentElement.style.setProperty('--sidebar-bg-custom', settings.sidebar_bg_color);
      } else {
        document.documentElement.style.removeProperty('--sidebar-bg-custom');
      }

      if (settings.sidebar_font_color) {
        document.documentElement.style.setProperty('--sidebar-font-custom', settings.sidebar_font_color);
      } else {
        document.documentElement.style.removeProperty('--sidebar-font-custom');
      }

      // 5. SEO Description & Keywords
      if (settings.landing_seo_description) {
        let metaDesc = document.querySelector("meta[name='description']") as HTMLMetaElement;
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.content = settings.landing_seo_description;
      }
      if (settings.landing_seo_keywords) {
        let metaKeys = document.querySelector("meta[name='keywords']") as HTMLMetaElement;
        if (!metaKeys) {
          metaKeys = document.createElement('meta');
          metaKeys.name = 'keywords';
          document.head.appendChild(metaKeys);
        }
        metaKeys.content = settings.landing_seo_keywords;
      }

      // 6. Inject Google Analytics
      if (settings.landing_analytics_id) {
        const id = settings.landing_analytics_id;
        const srcId = 'ga-gtag-src';
        const inlineId = 'ga-gtag-inline';
        if (!document.getElementById(srcId)) {
          const script = document.createElement('script');
          script.id = srcId;
          script.async = true;
          script.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
          document.head.appendChild(script);
        }
        let inlineScript = document.getElementById(inlineId);
        if (!inlineScript) {
          inlineScript = document.createElement('script');
          inlineScript.id = inlineId;
          document.head.appendChild(inlineScript);
        }
        inlineScript.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `;
      }

      // 7. Inject Facebook Pixel
      if (settings.landing_pixel_id) {
        const id = settings.landing_pixel_id;
        const scriptId = 'fb-pixel-script';
        const noscriptId = 'fb-pixel-noscript';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.innerHTML = `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${id}');
            fbq('track', 'PageView');
          `;
          document.head.appendChild(script);
        }
        if (!document.getElementById(noscriptId)) {
          const noscript = document.createElement('noscript');
          noscript.id = noscriptId;
          noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1" />;`;
          document.body.appendChild(noscript);
        }
      }

      // 8. Inject Chat Script (Crisp, JivoChat, WhatsApp, etc.)
      if (settings.landing_chat_script) {
        const containerId = 'landing-chat-container';
        let container = document.getElementById(containerId);
        if (!container) {
          container = document.createElement('div');
          container.id = containerId;
          document.body.appendChild(container);

          try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(settings.landing_chat_script, 'text/html');
            const elements = Array.from(doc.body.childNodes);
            elements.forEach((el) => {
              if (el.nodeName === 'SCRIPT') {
                const s = document.createElement('script');
                Array.from((el as HTMLScriptElement).attributes).forEach((attr) => s.setAttribute(attr.name, attr.value));
                s.innerHTML = (el as HTMLScriptElement).innerHTML;
                container?.appendChild(s);
              } else {
                container?.appendChild(el.cloneNode(true));
              }
            });
          } catch (e) {
            console.error('SystemSettingsContext: Failed to parse and inject chat script', e);
          }
        }
      }
    }
  }, [settings, loading]);

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SystemSettingsContext.Provider>
  );
};

export const useSystemSettings = () => useContext(SystemSettingsContext);
