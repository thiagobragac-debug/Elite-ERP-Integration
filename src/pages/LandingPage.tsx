import React, { useEffect } from 'react';
import { useLandingPageData } from './LandingPage/hooks/useLandingPageData';
import { TickerSection } from './LandingPage/components/TickerSection';
import { HeroSection } from './LandingPage/components/HeroSection';
import { InteractiveAppMockup } from './LandingPage/components/InteractiveAppMockup';
import { FeaturesSection } from './LandingPage/components/FeaturesSection';
import { WorkflowSection } from './LandingPage/components/WorkflowSection';
import { PricingSection } from './LandingPage/components/PricingSection';
import { FAQSection } from './LandingPage/components/FAQSection';
import { FooterSection } from './LandingPage/components/FooterSection';
import { FloatingWhatsApp } from './LandingPage/components/FloatingWhatsApp';
import { useSystemSettings } from '../contexts/SystemSettingsContext';
import './LandingPage/LandingPage.css';

export const LandingPage: React.FC = () => {
  const { settings } = useSystemSettings();
  const {
    scrolled,
    activeTab,
    setActiveTab,
    faqOpen,
    setFaqOpen,
    weighing,
    weight,
    purchaseStep,
    setPurchaseStep,
    fuelPct,
    plans,
    loadingPlans,
    activeCampaign,
    tickerData,
    handleWeigh,
  } = useLandingPageData();

  useEffect(() => {
    if (settings.landing_seo_description) {
      let meta = document.querySelector('meta[name="description"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'description');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', settings.landing_seo_description);
    }

    if (settings.landing_seo_keywords) {
      let meta = document.querySelector('meta[name="keywords"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'keywords');
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', settings.landing_seo_keywords);
    }

    if (settings.landing_analytics_id) {
      const existingGa = document.getElementById('ga-script');
      if (!existingGa) {
        const script = document.createElement('script');
        script.id = 'ga-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.landing_analytics_id}`;
        document.head.appendChild(script);

        const scriptInline = document.createElement('script');
        scriptInline.id = 'ga-inline';
        scriptInline.innerHTML = `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${settings.landing_analytics_id}');
        `;
        document.head.appendChild(scriptInline);
      }
    }

    if (settings.landing_pixel_id) {
      const existingPixel = document.getElementById('fb-pixel');
      if (!existingPixel) {
        const scriptInline = document.createElement('script');
        scriptInline.id = 'fb-pixel';
        scriptInline.innerHTML = `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${settings.landing_pixel_id}');
          fbq('track', 'PageView');
        `;
        document.head.appendChild(scriptInline);
      }
    }
  }, [settings.landing_seo_description, settings.landing_seo_keywords, settings.landing_analytics_id, settings.landing_pixel_id]);

  return (
    <div
      style={{
        background: '#080d14',
        minHeight: '100vh',
        fontFamily: "'Inter', sans-serif",
        color: '#fff',
        overflowX: 'hidden',
      }}
    >
      {settings.landing_show_ticker && <TickerSection tickerData={tickerData} />}

      <HeroSection scrolled={scrolled} />

      <FeaturesSection />

      <style>{`
        .video-embed-container iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          border: none;
        }
      `}</style>

      {settings.landing_show_mockup && (!settings.landing_mockup_type || settings.landing_mockup_type === 'simulador') && (
        <InteractiveAppMockup
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          weighing={weighing}
          weight={weight}
          handleWeigh={handleWeigh}
          fuelPct={fuelPct}
          purchaseStep={purchaseStep}
          setPurchaseStep={setPurchaseStep}
        />
      )}

      {settings.landing_show_mockup && settings.landing_mockup_type === 'video' && (
        <section style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1020, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>
              DEMONSTRAÇÃO EM VÍDEO
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, marginBottom: 30, letterSpacing: '-0.02em', color: '#fff' }}>
              Conheça o sistema em ação
            </h2>
            <div 
              className="glass-card" 
              style={{ 
                padding: '16px', 
                borderRadius: '24px', 
                overflow: 'hidden', 
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
              }}
            >
              <div 
                className="video-embed-container"
                style={{ 
                  position: 'relative', 
                  paddingBottom: '56.25%', 
                  height: 0, 
                  overflow: 'hidden', 
                  borderRadius: '16px' 
                }}
                dangerouslySetInnerHTML={{ 
                  __html: settings.landing_mockup_video_embed || '<iframe width="560" height="315" src="https://www.youtube.com/embed/dQw4w9WgXcQ" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>' 
                }}
              />
            </div>
          </div>
        </section>
      )}

      {settings.landing_show_mockup && settings.landing_mockup_type === 'imagem' && (
        <section style={{ padding: '80px 40px', background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1020, margin: '0 auto', textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#00b865', letterSpacing: '0.1em', marginBottom: 14 }}>
              PREVIEW DA PLATAFORMA
            </div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 900, marginBottom: 30, letterSpacing: '-0.02em', color: '#fff' }}>
              Interface moderna e intuitiva
            </h2>
            <div 
              className="glass-card" 
              style={{ 
                padding: '12px', 
                borderRadius: '24px', 
                background: 'rgba(255, 255, 255, 0.015)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}
            >
              <img 
                src={settings.landing_mockup_image_url || 'https://images.unsplash.com/photo-1595152772835-219674b2a8a6?auto=format&fit=crop&q=80&w=1200'} 
                alt="Dashboard Preview" 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.06)'
                }} 
              />
            </div>
          </div>
        </section>
      )}

      <WorkflowSection />

      <PricingSection
        plans={plans}
        activeCampaign={activeCampaign}
        loadingPlans={loadingPlans}
      />

      {settings.landing_show_faq && (
        <FAQSection faqOpen={faqOpen} setFaqOpen={setFaqOpen} />
      )}

      <FooterSection />

      {/* Botão de Contato Rápido (Exibido apenas se o número for cadastrado no Admin) */}
      <FloatingWhatsApp phoneNumber={settings.landing_whatsapp || ''} />
    </div>
  );
};
