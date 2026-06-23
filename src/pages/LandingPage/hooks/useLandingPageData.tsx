import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';

export function useLandingPageData() {
  const [scrolled, setScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [weighing, setWeighing] = useState(false);
  const [weight, setWeight] = useState(482.4);
  const [purchaseStep, setPurchaseStep] = useState(0);
  const [fuelPct, setFuelPct] = useState(78);

  const [plans, setPlans] = useState<any[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);

  const [tickerData, setTickerData] = useState<[string, string, string, boolean][]>([
    ['🐂 BOI GORDO B3', 'R$ 286,40/@', '+0,85%', true],
    ['🌾 SOJA B3', 'R$ 138,50/sc', '+1,20%', true],
    ['🌽 MILHO B3', 'R$ 68,10/sc', '-0,45%', false],
    ['☕ CAFÉ ARÁBICA B3', 'R$ 1.050,00/sc', '+0,30%', true],
    ['💵 DÓLAR COMERCIAL', 'R$ 5,13', '-0,28%', false],
    ['💶 EURO COMERCIAL', 'R$ 5,50', '+0,10%', true],
    ['🛢️ PETRÓLEO BRENT', '$ 82,50/bbl', '+0,50%', true],
  ]);

  // Dynamic rolling future contract helper
  const getDynamicTicker = (base: 'BGI' | 'CCM' | 'SJC' | 'ICF', monthsAhead = 12): string => {
    const date = new Date();
    date.setMonth(date.getMonth() + monthsAhead);

    const monthLetters = ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'];
    const activeMonthsMap = {
      BGI: ['F', 'G', 'H', 'J', 'K', 'M', 'N', 'Q', 'U', 'V', 'X', 'Z'],
      CCM: ['F', 'H', 'K', 'N', 'U', 'X'],
      SJC: ['F', 'H', 'K', 'N', 'U', 'X'],
      ICF: ['H', 'K', 'U', 'Z'],
    };

    const activeLetters = activeMonthsMap[base];
    let monthIndex = date.getMonth();
    let letter = monthLetters[monthIndex];

    while (!activeLetters.includes(letter)) {
      date.setMonth(date.getMonth() + 1);
      monthIndex = date.getMonth();
      letter = monthLetters[monthIndex];
    }

    const year = date.getFullYear().toString().slice(-2);
    return `${base}${letter}${year}.SA`;
  };

  const fetchRealTimeTicker = async () => {
    try {
      // 1. Fetch Dólar and Euro from AwesomeAPI (direct, no CORS issue)
      let usdVal = 'R$ 5,13';
      let usdChg = '-0,28%';
      let usdUp = false;
      try {
        const usdRes = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
        if (usdRes.ok) {
          const usdData = await usdRes.json();
          if (usdData.USDBRL) {
            const bidVal = parseFloat(usdData.USDBRL.bid);
            const pct = parseFloat(usdData.USDBRL.pctChange);
            usdVal = `R$ ${bidVal.toFixed(2).replace('.', ',')}`;
            usdChg = `${pct >= 0 ? '+' : ''}${pct.toFixed(2).replace('.', ',')}%`;
            usdUp = pct >= 0;
          }
        }
      } catch (e) {
        console.error('Erro ao buscar cotação do Dólar:', e);
      }

      let eurVal = 'R$ 5,50';
      let eurChg = '+0,10%';
      let eurUp = true;
      try {
        const eurRes = await fetch('https://economia.awesomeapi.com.br/last/EUR-BRL');
        if (eurRes.ok) {
          const eurData = await eurRes.json();
          if (eurData.EURBRL) {
            const bidVal = parseFloat(eurData.EURBRL.bid);
            const pct = parseFloat(eurData.EURBRL.pctChange);
            eurVal = `R$ ${bidVal.toFixed(2).replace('.', ',')}`;
            eurChg = `${pct >= 0 ? '+' : ''}${pct.toFixed(2).replace('.', ',')}%`;
            eurUp = pct >= 0;
          }
        }
      } catch (e) {
        console.error('Erro ao buscar cotação do Euro:', e);
      }

      // 2. Tickers dynamic calculation
      const bgiTicker = getDynamicTicker('BGI', 12);
      const ccmTicker = getDynamicTicker('CCM', 12);
      const sjcTicker = getDynamicTicker('SJC', 12);
      const icfTicker = getDynamicTicker('ICF', 12);

      // 3. Fetch from Yahoo Finance using CORS proxy (allorigins)
      const fetchYahooQuote = async (ticker: string) => {
        try {
          const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`)}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const result = data?.chart?.result?.[0];
            const meta = result?.meta;
            if (meta) {
              const price = meta.regularMarketPrice;
              const prevClose = meta.previousClose;
              const chgPct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
              return { price, chgPct };
            }
          }
        } catch (err) {
          console.error(`Erro ao buscar Yahoo ticker ${ticker}:`, err);
        }
        return null;
      };

      const [bgiQuote, ccmQuote, sjcQuote, icfQuote, brentQuote] = await Promise.all([
        fetchYahooQuote(bgiTicker),
        fetchYahooQuote(ccmTicker),
        fetchYahooQuote(sjcTicker),
        fetchYahooQuote(icfTicker),
        fetchYahooQuote('BZ=F'),
      ]);

      const newTicker: [string, string, string, boolean][] = [
        [
          `🐂 BOI GORDO B3 (${bgiTicker.replace('.SA', '')})`,
          bgiQuote ? `R$ ${bgiQuote.price.toFixed(2).replace('.', ',')}/@` : 'R$ 286,40/@',
          bgiQuote
            ? `${bgiQuote.chgPct >= 0 ? '+' : ''}${bgiQuote.chgPct.toFixed(2).replace('.', ',')}%`
            : '+0,85%',
          bgiQuote ? bgiQuote.chgPct >= 0 : true,
        ],
        [
          `🌾 SOJA B3 (${sjcTicker.replace('.SA', '')})`,
          sjcQuote ? `R$ ${sjcQuote.price.toFixed(2).replace('.', ',')}/sc` : 'R$ 138,50/sc',
          sjcQuote
            ? `${sjcQuote.chgPct >= 0 ? '+' : ''}${sjcQuote.chgPct.toFixed(2).replace('.', ',')}%`
            : '+1,20%',
          sjcQuote ? sjcQuote.chgPct >= 0 : true,
        ],
        [
          `🌽 MILHO B3 (${ccmTicker.replace('.SA', '')})`,
          ccmQuote ? `R$ ${ccmQuote.price.toFixed(2).replace('.', ',')}/sc` : 'R$ 68,10/sc',
          ccmQuote
            ? `${ccmQuote.chgPct >= 0 ? '+' : ''}${ccmQuote.chgPct.toFixed(2).replace('.', ',')}%`
            : '-0,45%',
          ccmQuote ? ccmQuote.chgPct >= 0 : false,
        ],
        [
          `☕ CAFÉ ARÁBICA B3 (${icfTicker.replace('.SA', '')})`,
          icfQuote ? `R$ ${icfQuote.price.toFixed(2).replace('.', ',')}/sc` : 'R$ 1.050,00/sc',
          icfQuote
            ? `${icfQuote.chgPct >= 0 ? '+' : ''}${icfQuote.chgPct.toFixed(2).replace('.', ',')}%`
            : '+0,30%',
          icfQuote ? icfQuote.chgPct >= 0 : true,
        ],
        ['💵 DÓLAR COMERCIAL', usdVal, usdChg, usdUp],
        ['💶 EURO COMERCIAL', eurVal, eurChg, eurUp],
        [
          '🛢️ PETRÓLEO BRENT',
          brentQuote ? `$ ${brentQuote.price.toFixed(2).replace('.', ',')}/bbl` : '$ 82,50/bbl',
          brentQuote
            ? `${brentQuote.chgPct >= 0 ? '+' : ''}${brentQuote.chgPct.toFixed(2).replace('.', ',')}%`
            : '+0,50%',
          brentQuote ? brentQuote.chgPct >= 0 : true,
        ],
      ];

      setTickerData(newTicker);
    } catch (error) {
      console.error('Erro na atualização geral do ticker:', error);
    }
  };

  useEffect(() => {
    const fetchSaaSPlans = async () => {
      try {
        setLoadingPlans(true);
        const { data, error } = await supabase
          .from('saas_plans')
          .select('*')
          .eq('is_public', true)
          .order('price', { ascending: true });

        // Fetch active campaigns
        const nowIso = new Date().toISOString();
        const { data: campaignData } = await supabase
          .from('saas_campaigns')
          .select('*')
          .eq('is_active', true)
          .gte('end_date', nowIso)
          .lte('start_date', nowIso)
          .order('discount_percentage', { ascending: false })
          .limit(1);

        if (campaignData && campaignData.length > 0) {
          setActiveCampaign(campaignData[0]);
        }

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const mappedPlans = data.map((p: any) => {
            const numPrice = Number(p.price) || 0;
            return {
              id: p.id,
              name: p.name || 'Sem Nome',
              price: numPrice,
              usersLimit: p.users_limit || p.usersLimit || 5,
              animalsLimit: p.animals_limit || p.animalsLimit || 1000,
              storageLimit: p.storage_gb || p.storageLimit || 20,
              features: Array.isArray(p.features)
                ? p.features
                : p.features
                  ? p.features.split('\n')
                  : [],
              isPopular:
                p.name?.toLowerCase().includes('precision') ||
                p.name?.toLowerCase().includes('pro') ||
                p.name?.toLowerCase().includes('diamond'),
            };
          });
          const publicPlans = mappedPlans.filter(
            (p: any) =>
              p.price > 0 &&
              !p.name.toLowerCase().includes('free') &&
              !p.name.toLowerCase().includes('gratis') &&
              !p.name.toLowerCase().includes('gratuito')
          );
          setPlans(publicPlans);
        } else {
          // Standard agricultural fallback presets
          setPlans([
            {
              id: 'starter',
              name: 'Fazenda Starter',
              price: 499,
              usersLimit: 5,
              animalsLimit: 1000,
              storageLimit: 20,
              features: [
                'Controle de Rebanho & Pesagem Manual',
                'Controle de Abastecimentos & Máquinas',
                'Contas a Pagar e Contas a Receber',
                'Suporte via WhatsApp em Horário Comercial',
                'App Offline para Campo incluído',
              ],
            },
            {
              id: 'pro',
              name: 'Diamond Precision',
              price: 999,
              usersLimit: 20,
              animalsLimit: 5000,
              storageLimit: 100,
              features: [
                'Pesagem Inteligente RFID Automática',
                'Telemetria Completa de Frota JD/Case',
                'Conciliação Bancária via Open Finance',
                'Cotações Multi-Fornecedor & Compras',
                'DRE, EBITDA & Custos Reais por Arroba',
                'Suporte Prioritário VIP 24/7',
                'App Offline para Campo incluído',
              ],
              isPopular: true,
            },
            {
              id: 'enterprise',
              name: 'Cinturão Verde Enterprise',
              price: 2499,
              usersLimit: 999,
              animalsLimit: 99999,
              storageLimit: 1000,
              features: [
                'Múltiplas Fazendas & Holdings no mesmo Painel',
                'Integração direta com Balanças e Bastões RFID',
                'Relatório LCDPR e Compliance Fiscal Completo',
                'Módulo BI Customizado & Exportações Ilimitadas',
                'Consultoria Técnica de Implantação e Migração Dedicada',
              ],
            },
          ]);
        }
      } catch (err) {
        console.error('Erro ao buscar planos saas_plans:', err);
        // Fallback presets
        setPlans([
          {
            id: 'starter',
            name: 'Fazenda Starter',
            price: 499,
            usersLimit: 5,
            animalsLimit: 1000,
            storageLimit: 20,
            features: [
              'Controle de Rebanho & Pesagem Manual',
              'Controle de Abastecimentos & Máquinas',
              'Contas a Pagar e Contas a Receber',
              'Suporte via WhatsApp em Horário Comercial',
              'App Offline para Campo incluído',
            ],
          },
          {
            id: 'pro',
            name: 'Diamond Precision',
            price: 999,
            usersLimit: 20,
            animalsLimit: 5000,
            storageLimit: 100,
            features: [
              'Pesagem Inteligente RFID Automática',
              'Telemetria Completa de Frota JD/Case',
              'Conciliação Bancária via Open Finance',
              'Cotações Multi-Fornecedor & Compras',
              'DRE, EBITDA & Custos Reais por Arroba',
              'Suporte Prioritário VIP 24/7',
            ],
            isPopular: true,
          },
          {
            id: 'enterprise',
            name: 'Cinturão Verde Enterprise',
            price: 2499,
            usersLimit: 999,
            animalsLimit: 99999,
            storageLimit: 1000,
            features: [
              'Múltiplas Fazendas & Holdings no mesmo Painel',
              'Integração direta com Balanças e Bastões RFID',
              'Relatório LCDPR e Compliance Fiscal Completo',
              'Módulo BI Customizado & Exportações Ilimitadas',
              'Consultoria Técnica de Implantação e Migração Dedicada',
            ],
          },
        ]);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchSaaSPlans();
  }, []);

  useEffect(() => {
    fetchRealTimeTicker();
    const interval = setInterval(fetchRealTimeTicker, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setFuelPct((p) => (p <= 20 ? 95 : p - 1)), 4000);
    return () => clearInterval(t);
  }, []);

  const handleWeigh = () => {
    if (weighing) {
      return;
    }
    setWeighing(true);
    const target = 524.8;
    let v = weight;
    const t = setInterval(() => {
      v = v + (target - v) * 0.4;
      setWeight(parseFloat(v.toFixed(1)));
      if (Math.abs(target - v) < 0.2) {
        setWeight(target);
        clearInterval(t);
        setWeighing(false);
      }
    }, 80);
  };

  return {
    scrolled,
    activeTab,
    setActiveTab,
    faqOpen,
    setFaqOpen,
    weighing,
    setWeighing,
    weight,
    setWeight,
    purchaseStep,
    setPurchaseStep,
    fuelPct,
    setFuelPct,
    plans,
    loadingPlans,
    activeCampaign,
    tickerData,
    handleWeigh,
  };
}
