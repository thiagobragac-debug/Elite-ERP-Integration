import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Terminal, 
  Check, 
  Cpu, 
  Truck, 
  TrendingUp, 
  ArrowRight,
  ChevronDown,
  Activity,
  Layers,
  Database,
  Sliders,
  DollarSign,
  Award,
  Map,
  Scale,
  Calendar,
  Compass,
  AlertCircle,
  ShoppingCart,
  FileText,
  PieChart,
  CheckCircle2,
  Users,
  Settings,
  RefreshCw
} from 'lucide-react';

// Tauze official emerald logo (#00b865) with vertical central gap
const TauzeLogo: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 24, className, color = '#00b865' }) => (
  <svg 
    viewBox="0 0 100 100" 
    width={size} 
    height={size} 
    className={className}
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
  >
    <path 
      d="M 46,75 C 46,63 45,42 42,34 C 38,24 28,18 12,21 C 6,22 2,25 0,27 C 4,21 12,13 26,13 C 40,13 46,24 46,41 L 46,75 Z" 
      fill={color} 
    />
    <path 
      d="M 54,75 C 54,63 55,42 58,34 C 62,24 72,18 88,21 C 94,22 98,25 100,27 C 96,21 88,13 74,13 C 60,13 54,24 54,41 L 54,75 Z" 
      fill={color} 
    />
  </svg>
);

export const LandingPage: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState<'pecuaria' | 'frota' | 'vendas' | 'compras' | 'financas' | 'bi'>('pecuaria');
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  
  // Interactive Flow Timeline Active Step
  const [flowStep, setFlowStep] = useState<number>(0);

  // Process ROI Calculator states
  const [herdScale, setHerdScale] = useState(1200);
  const [harvestHectares, setHarvestHectares] = useState(2000);
  const [adminTimeSaved, setAdminTimeSaved] = useState(40); // monthly hours saved

  // Module 1: Pecuária state
  const [selectedCow, setSelectedCow] = useState<'bov-A' | 'bov-B'>('bov-A');
  const [cowWeight, setCowWeight] = useState(482.4);
  const [isWeighing, setIsWeighing] = useState(false);

  // Module 2: Fleet status active machinery
  const [activeTractor, setActiveTractor] = useState<'trator-1' | 'colheitadeira-1'>('trator-1');
  const [fuelLevel, setFuelLevel] = useState(84);

  // Module 3: Vendas contract active approval state
  const [contractApproved, setContractApproved] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);

  // Module 4: Compras order approval tracker
  const [purchaseStep, setPurchaseStep] = useState<'requisicao' | 'cotado' | 'aprovado'>('requisicao');

  // Module 5: Financas reconciliation active state
  const [reconciliationStatus, setReconciliationStatus] = useState<'pending' | 'reconciled'>('pending');
  const [reconciling, setReconciling] = useState(false);

  // Scroll event for navbar elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Tractor fuel consumption simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setFuelLevel(prev => {
        if (prev <= 10) return 95; // auto-refuel
        return prev - 1;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // RFID Weighing action simulation
  const handleWeigh = (cow: 'bov-A' | 'bov-B') => {
    if (isWeighing) return;
    setSelectedCow(cow);
    setIsWeighing(true);
    const targetWeight = cow === 'bov-A' ? 482.4 : 518.9;

    let steps = 0;
    const interval = setInterval(() => {
      setCowWeight(prev => {
        const diff = targetWeight - prev;
        if (Math.abs(diff) < 0.1 || steps > 12) {
          clearInterval(interval);
          setIsWeighing(false);
          return targetWeight;
        }
        steps++;
        return parseFloat((prev + diff * 0.4).toFixed(1));
      });
    }, 80);
  };

  // Contract approval action simulation
  const handleApproveContract = () => {
    if (contractApproved || contractLoading) return;
    setContractLoading(true);
    setTimeout(() => {
      setContractLoading(false);
      setContractApproved(true);
    }, 1200);
  };

  // Reconcilation action simulation
  const handleReconcile = () => {
    if (reconciliationStatus === 'reconciled' || reconciling) return;
    setReconciling(true);
    setTimeout(() => {
      setReconciling(false);
      setReconciliationStatus('reconciled');
    }, 1500);
  };

  // ROI Calculations
  const rfidSavingValue = herdScale * 38; // R$38 saved per head
  const fuelSavingValue = harvestHectares * 18.5; // R$18.5 saved per hectare
  const adminSavingValue = adminTimeSaved * 12 * 75; // R$75 hourly cost saved
  const totalProcessSavings = Math.round(rfidSavingValue + fuelSavingValue + adminSavingValue);

  return (
    <div className="tauze-erp-matrix">

      {/* -------------------- STATS COMMODITY BAR -------------------- */}
      <div className="commodities-ticker">
        <div className="ticker-container">
          <div className="ticker-slide">
            <span className="ticker-node"><span className="ticker-indicator"></span> BOI GORDO B3 (BGI): R$ 286,40/@ <span className="text-positive">(+0,85%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> SOJA PARANAGUÁ: R$ 138,50/sc <span className="text-positive">(+1,20%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> MILHO B3 (CCM): R$ 68,10/sc <span className="text-negative">(-0,45%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> DÓLAR COMERCIAL: R$ 5,13 <span className="text-negative">(-0,28%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> CONVERSÃO DE COMPRAS NF-e: 100% AUTOMATIZADA</span>
            <span className="ticker-node"><span className="ticker-indicator"></span> INTEGRAÇÃO DE BANCOS API: ATIVA (6 BANCOS)</span>
          </div>
          <div className="ticker-slide">
            <span className="ticker-node"><span className="ticker-indicator"></span> BOI GORDO B3 (BGI): R$ 286,40/@ <span className="text-positive">(+0,85%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> SOJA PARANAGUÁ: R$ 138,50/sc <span className="text-positive">(+1,20%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> MILHO B3 (CCM): R$ 68,10/sc <span className="text-negative">(-0,45%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> DÓLAR COMERCIAL: R$ 5,13 <span className="text-negative">(-0,28%)</span></span>
            <span className="ticker-node"><span className="ticker-indicator"></span> CONVERSÃO DE COMPRAS NF-e: 100% AUTOMATIZADA</span>
            <span className="ticker-node"><span className="ticker-indicator"></span> INTEGRAÇÃO DE BANCOS API: ATIVA (6 BANCOS)</span>
          </div>
        </div>
      </div>

      {/* -------------------- NAVIGATION NAVBAR -------------------- */}
      <nav className={`matrix-navbar ${scrolled ? 'elevated' : ''}`}>
        <div className="navbar-inner">
          <div className="brand-logo-group">
            <div className="brand-badge">
              <TauzeLogo size={34} />
            </div>
            <div className="brand-title-column">
              <span className="brand-name">tauze</span>
              <span className="brand-description">Enterprise Agribusiness Suite</span>
            </div>
          </div>

          <div className="navbar-links">
            <a href="#modulos">Módulos do Sistema</a>
            <a href="#fluxo-processos">Fluxo de Processos</a>
            <a href="#simulador-processos">Simulador de Economia</a>
            <a href="#faq">Dúvidas Frequentes</a>
          </div>

          <div className="navbar-actions">
            <Link to="/login" className="btn-access-suite">
              <Terminal size={14} />
              <span>Acessar o ERP</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------- CINEMATIC MODULES HERO -------------------- */}
      <header className="matrix-hero">
        <div className="radial-glow-layer"></div>
        <div className="dots-layout-layer"></div>

        <div className="hero-content-box">
          <span className="hero-eyebrow-badge">
            <Sparkles size={11} className="badge-spark" />
            <span>SISTEMA DE GESTÃO INTEGRAL RURAL</span>
          </span>

          <h1 className="hero-main-title">
            O ERP completo do agronegócio.<br />
            Do pasto ao faturamento em uma única plataforma.
          </h1>

          <p className="hero-subtext">
            Integre todos os processos da sua fazenda. Controle a pesagem voluntária RFID, acompanhe a telemetria 
            de frotas, execute compras e cotações, fature contratos de grãos e realize conciliação bancária 
            automatizada de ponta a ponta.
          </p>

          <div className="hero-actions-row">
            <a href="#modulos" className="btn-primary-action">
              <span>Explorar Módulos Operacionais</span>
              <ArrowRight size={16} />
            </a>
            <a href="#simulador-processos" className="btn-secondary-action">
              <span>Calcular Retorno Operacional</span>
            </a>
          </div>
        </div>

        {/* Hero Features Bar */}
        <div className="hero-quick-features">
          <div className="quick-item">
            <Scale size={16} className="text-emerald" />
            <strong>RFID & Balança Voluntária</strong>
          </div>
          <div className="quick-item">
            <Truck size={16} className="text-emerald" />
            <strong>Telemetria & Consumos Frota</strong>
          </div>
          <div className="quick-item">
            <FileText size={16} className="text-emerald" />
            <strong>Faturamento & Contratos de Grãos</strong>
          </div>
          <div className="quick-item">
            <DollarSign size={16} className="text-emerald" />
            <strong>Conciliação Bancária Sem Planilhas</strong>
          </div>
        </div>
      </header>

      {/* -------------------- CORE MODULES SHOWCASE (THE CONSOLE) -------------------- */}
      <section id="modulos" className="modules-showcase-section">
        <div className="section-head-centered">
          <span className="section-pre-title">RECURSOS DO SISTEMA</span>
          <h2>Explore os Módulos Integrados da Plataforma</h2>
          <p>
            Clique nas abas abaixo para visualizar as telas reais de cada módulo e entender como o 
            <strong> tauze</strong> automatiza a rotina operacional do seu negócio rural.
          </p>
        </div>

        <div className="matrix-console-board">
          {/* Module Selector Sidebar */}
          <div className="console-navigation-sidebar">
            <div className="sidebar-group-title">MÓDULOS DE FLUXO ATIVOS</div>
            
            <button 
              className={`module-tab-btn ${activeModule === 'pecuaria' ? 'active' : ''}`}
              onClick={() => setActiveModule('pecuaria')}
            >
              <div className="tab-icon-wrap"><Scale size={16} /></div>
              <div className="tab-texts">
                <strong>🌾 Módulo Pecuária</strong>
                <span>RFID e monitoramento de peso voluntário</span>
              </div>
            </button>

            <button 
              className={`module-tab-btn ${activeModule === 'frota' ? 'active' : ''}`}
              onClick={() => setActiveModule('frota')}
            >
              <div className="tab-icon-wrap"><Truck size={16} /></div>
              <div className="tab-texts">
                <strong>🚜 Módulo Frotas & Campo</strong>
                <span>Telemetria, manutenção e combustível</span>
              </div>
            </button>

            <button 
              className={`module-tab-btn ${activeModule === 'vendas' ? 'active' : ''}`}
              onClick={() => setActiveModule('vendas')}
            >
              <div className="tab-icon-wrap"><FileText size={16} /></div>
              <div className="tab-texts">
                <strong>💼 Módulo Vendas & Contratos</strong>
                <span>Contratos de safras e faturamento</span>
              </div>
            </button>

            <button 
              className={`module-tab-btn ${activeModule === 'compras' ? 'active' : ''}`}
              onClick={() => setActiveModule('compras')}
            >
              <div className="tab-icon-wrap"><ShoppingCart size={16} /></div>
              <div className="tab-texts">
                <strong>🛒 Módulo Compras & Estoque</strong>
                <span>Cotações, pipeline de pedidos e insumos</span>
              </div>
            </button>

            <button 
              className={`module-tab-btn ${activeModule === 'financas' ? 'active' : ''}`}
              onClick={() => setActiveModule('financas')}
            >
              <div className="tab-icon-wrap"><DollarSign size={16} /></div>
              <div className="tab-texts">
                <strong>💰 Módulo Finanças & Conciliação</strong>
                <span>Fluxo de caixa e conciliação bancária</span>
              </div>
            </button>

            <button 
              className={`module-tab-btn ${activeModule === 'bi' ? 'active' : ''}`}
              onClick={() => setActiveModule('bi')}
            >
              <div className="tab-icon-wrap"><PieChart size={16} /></div>
              <div className="tab-texts">
                <strong>📊 Módulo BI & Inteligência</strong>
                <span>EBITDA, lucratividade e relatórios DRE</span>
              </div>
            </button>
          </div>

          {/* Dynamic Interface Simulator Workspace */}
          <div className="console-display-workspace">
            <div className="workspace-header-bar">
              <div className="window-controls">
                <span className="dot dot-close"></span>
                <span className="dot dot-minimize"></span>
                <span className="dot dot-expand"></span>
              </div>
              <div className="workspace-path-bar">tauze://plataforma/modulo-{activeModule}/dashboard-operacional</div>
              <span className="live-badge">SISTEMA ATIVO</span>
            </div>

            <div className="workspace-body-container">
              
              {/* 1. PECUÁRIA MODULE INTERFACE */}
              {activeModule === 'pecuaria' && (
                <div className="module-fade-in pecuaria-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>BALANÇA RFID VOLUNTÁRIA</span>
                        <div className="status-badge"><span className="pulse-dot"></span>LIVESTOCK FEED</div>
                      </div>

                      <div className="rfid-cattle-box">
                        <div className="weigh-led-card">
                          <span className="label">BRINCO ATIVO NA ANTENA</span>
                          <strong className={isWeighing ? 'anim-digits' : ''}>{cowWeight.toFixed(1)} <span className="unit">KG</span></strong>
                          <div className="status-row">
                            <span className="status-glow"></span>
                            <span>RFID LIDO: {selectedCow === 'bov-A' ? '#BR-104' : '#BR-212'}</span>
                          </div>
                        </div>

                        <div className="cattle-selector-widget">
                          <span className="widget-label">Aproximar Bovino da Balança de Passagem:</span>
                          <div className="cattle-buttons">
                            <button 
                              className={`cattle-btn ${selectedCow === 'bov-A' ? 'active' : ''}`}
                              onClick={() => handleWeigh('bov-A')}
                            >
                              <strong>Brinco #BR-104 (Lote A)</strong>
                              <span>Média GMD: +1,45 kg/dia</span>
                            </button>
                            <button 
                              className={`cattle-btn ${selectedCow === 'bov-B' ? 'active' : ''}`}
                              onClick={() => handleWeigh('bov-B')}
                            >
                              <strong>Brinco #BR-212 (Lote B)</strong>
                              <span>Média GMD: +1,18 kg/dia</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">PECUÁRIA DE PRECISÃO</span>
                      <h3>Curvas de Peso e Nutrição Automáticas</h3>
                      <p>
                        A pesagem tradicional no curral gera alto estresse nos animais, acarretando perda 
                        de até 4 arrobas no dia do manejo. Nossa balança autônoma instalada no bebedouro 
                        monitora a pesagem voluntária sempre que o gado bebe água, gerando GMD diário instantâneo.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Curvas de GMD em tempo real</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Previsão exata de data de abate</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Alerta de fuga ou inatividade no lote</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. FLEET MODULE INTERFACE */}
              {activeModule === 'frota' && (
                <div className="module-fade-in fleet-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>CENTRO DE TELEMETRIA DE CAMPO</span>
                        <div className="status-badge"><span className="pulse-dot"></span>GPS ATIVO</div>
                      </div>

                      <div className="fleet-machinery-card">
                        <div className="machinery-selector">
                          <button 
                            className={`machinery-tab ${activeTractor === 'trator-1' ? 'active' : ''}`}
                            onClick={() => { setActiveTractor('trator-1'); setFuelLevel(84); }}
                          >
                            Trator John Deere 8R
                          </button>
                          <button 
                            className={`machinery-tab ${activeTractor === 'colheitadeira-1' ? 'active' : ''}`}
                            onClick={() => { setActiveTractor('colheitadeira-1'); setFuelLevel(62); }}
                          >
                            Colheitadeira Case 9250
                          </button>
                        </div>

                        <div className="machinery-live-specs">
                          <div className="spec-item">
                            <span className="lbl">Diesel no Tanque</span>
                            <strong className="text-emerald">{fuelLevel}%</strong>
                            <div className="progress-bar-container">
                              <div className="bar" style={{ width: `${fuelLevel}%` }}></div>
                            </div>
                          </div>
                          
                          <div className="spec-details-row">
                            <div>
                              <span className="lbl">Status</span>
                              <strong className="text-positive">OPERANDO</strong>
                            </div>
                            <div>
                              <span className="lbl">Consumo Médio</span>
                              <strong>{activeTractor === 'trator-1' ? '14,2 L/h' : '28,4 L/h'}</strong>
                            </div>
                            <div>
                              <span className="lbl">Próxima Manutenção</span>
                              <strong>42 Horas</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">CONTROLE DE FROTAS</span>
                      <h3>Gestão de Diesel, Horas e Manutenções</h3>
                      <p>
                        Acompanhe em tempo real a velocidade, rota de plantio e consumo de combustível do seu maquinário. 
                        A plataforma do Tauze centraliza manutenções preventivas e previne gargalos operacionais antes 
                        que as colheitadeiras parem no campo.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Rastreamento e telemetria offline-first</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Alertas de excesso de velocidade ou ociosidade</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Controle de abastecimento direto na fazenda</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. SALES MODULE INTERFACE */}
              {activeModule === 'vendas' && (
                <div className="module-fade-in sales-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>MINUTA DE CONTRATO DE SAINDA // GRÃOS</span>
                        <div className="status-badge">B3 COMPLIANT</div>
                      </div>

                      <div className="sales-contract-interactive-box">
                        <div className="contract-sheet">
                          <div className="sheet-row">
                            <span>Tipo de Contrato:</span>
                            <strong>Venda de Grãos (Soja) // Safra 2026</strong>
                          </div>
                          <div className="sheet-row">
                            <span>Comprador:</span>
                            <strong>Cargill Agrícola S/A</strong>
                          </div>
                          <div className="sheet-row">
                            <span>Volume Negociado:</span>
                            <strong>15.000 Sacas (900 Toneladas)</strong>
                          </div>
                          <div className="sheet-row">
                            <span>Preço Fechado por Saca:</span>
                            <strong className="text-emerald">R$ 138,50 / sc</strong>
                          </div>
                          <div className="sheet-divider"></div>
                          <div className="sheet-total">
                            <span>Valor Total do Contrato:</span>
                            <strong>R$ 2.077.500,00</strong>
                          </div>
                        </div>

                        <button 
                          className={`btn-approve-contract ${contractApproved ? 'success' : ''}`}
                          onClick={handleApproveContract}
                        >
                          {contractLoading ? (
                            <span>Aprovando contrato...</span>
                          ) : contractApproved ? (
                            <span className="flex-row"><Check size={16} /> Contrato Faturado e Aprovado</span>
                          ) : (
                            <span>Assinar e Faturar Contrato</span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">VENDAS & CONTRATOS</span>
                      <h3>Faturamento de Safras sem Erros de Registro</h3>
                      <p>
                        Registre minutas, controle o saldo de entregas e fature contratos de venda de grãos ou cabeças de gado. 
                        A plataforma se conecta diretamente ao faturamento fiscal eletrônico, automatizando a baixa do estoque 
                        de silagem no momento em que o grão sai da fazenda.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Emissão de notas fiscais de venda automatizada</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Acompanhamento físico de entregas por contrato</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Integração de travas físicas com a Bolsa de Grãos</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. PURCHASING MODULE INTERFACE */}
              {activeModule === 'compras' && (
                <div className="module-fade-in purchasing-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>PEDIDO DE RECOMPRA AUTOMÁTICA</span>
                        <div className="status-badge">ESTOQUE MÍNIMO</div>
                      </div>

                      <div className="purchasing-pipeline-box">
                        <div className="pipeline-visual-steps">
                          <div className={`step-node ${purchaseStep === 'requisicao' ? 'active' : ''}`}>
                            <span className="num">01</span>
                            <span>Requisição</span>
                          </div>
                          <div className="step-connector"></div>
                          <div className={`step-node ${purchaseStep === 'cotado' ? 'active' : ''}`}>
                            <span className="num">02</span>
                            <span>Cotação</span>
                          </div>
                          <div className="step-connector"></div>
                          <div className={`step-node ${purchaseStep === 'aprovado' ? 'active' : ''}`}>
                            <span className="num">03</span>
                            <span>Ordem Gerada</span>
                          </div>
                        </div>

                        <div className="purchase-info-sheet">
                          <div className="item-row">
                            <span>Insumo Necessário:</span>
                            <strong>Fertilizante NPK (15 Toneladas)</strong>
                          </div>
                          <div className="item-row">
                            <span>Fornecedor Sugerido:</span>
                            <strong>Nutrien Agrossoluções S/A</strong>
                          </div>
                          <div className="item-row">
                            <span>Valor da Melhor Cotação:</span>
                            <strong className="text-emerald">R$ 64.500,00</strong>
                          </div>
                        </div>

                        <div className="pipeline-controls">
                          {purchaseStep === 'requisicao' && (
                            <button className="btn-pipeline" onClick={() => setPurchaseStep('cotado')}>Consultar Cotações do Sistema</button>
                          )}
                          {purchaseStep === 'cotado' && (
                            <button className="btn-pipeline" onClick={() => setPurchaseStep('aprovado')}>Aprovar Ordem de Compra</button>
                          )}
                          {purchaseStep === 'aprovado' && (
                            <button className="btn-pipeline success-btn" onClick={() => setPurchaseStep('requisicao')}>Resetar Simulador</button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">COMPRAS & INVENTÁRIO</span>
                      <h3>Abastecimento Inteligente de Insumos</h3>
                      <p>
                        Não corra o risco de ficar sem defensivos no meio do plantio. O módulo de compras 
                        do Tauze monitora os níveis mínimos de inventário físico da fazenda, sugere ordens de recompra 
                        autônomas e envia requisições aos fornecedores homologados para cotação automatizada.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Cotação multi-fornecedor automática</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Lançamento de notas de entrada via importação de XML</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Rastreamento de validade e lotes de vacinas e químicos</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. FINANCAS MODULE INTERFACE */}
              {activeModule === 'financas' && (
                <div className="module-fade-in finance-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>CONCILIAÇÃO BANCÁRIA DIGITAL AUTOMATIZADA</span>
                        <div className="status-badge">INTEGRAÇÃO BANCO API</div>
                      </div>

                      <div className="reconciliation-interactive-box">
                        <div className="reconcile-split-cards">
                          {/* Left Bank Statement */}
                          <div className="reconcile-card bank-statement">
                            <span className="card-lbl">EXTRATO DO BANCO</span>
                            <div className="entry-row">
                              <span className="title">BUNGE ALIMENTOS (Crédito)</span>
                              <strong className="text-positive">R$ 138.500,00</strong>
                            </div>
                            <span className="time">Recebido em: 22/05/2026</span>
                          </div>

                          <div className="reconcile-action-connector">
                            {reconciliationStatus === 'pending' ? (
                              <button 
                                className={`btn-reconcile-trigger ${reconciling ? 'loading' : ''}`}
                                onClick={handleReconcile}
                              >
                                {reconciling ? 'Cruzando...' : 'Conciliar Lote'}
                              </button>
                            ) : (
                              <div className="stamp-success">
                                <Check size={14} />
                                <span>Lote Casado</span>
                              </div>
                            )}
                          </div>

                          {/* Right ERP Invoice ledger */}
                          <div className="reconcile-card erp-ledger">
                            <span className="card-lbl">CONTRATO / LANÇAMENTO INTERNO</span>
                            <div className="entry-row">
                              <span className="title">NF-e Venda Bunge #9842</span>
                              <strong className="text-positive">R$ 138.500,00</strong>
                            </div>
                            <span className="time">Emissão em: 21/05/2026</span>
                          </div>
                        </div>

                        <div className="reconciliation-progress-indicator">
                          <span className="title">Status de Reconciliação do Mês:</span>
                          <div className="progress-bar-reconciled">
                            <div className={`bar ${reconciliationStatus === 'reconciled' ? 'full' : 'half'}`}></div>
                          </div>
                          <span className="percentage">
                            {reconciliationStatus === 'reconciled' ? '100% dos Lançamentos Fechados!' : '92% Fechado'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">CONCILIAÇÃO FINANCEIRA</span>
                      <h3>Casamento Automático de Extratos sem Planilhas</h3>
                      <p>
                        A tarefa exaustiva de conferir linha por linha do extrato bancário com as notas fiscais emitidas 
                        acabou. O Tauze se conecta às suas contas correntes corporativas via API e cruza 
                        automaticamente os depósitos recebidos com os respectivos contratos e faturas emitidos no ERP.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Integração nativa com Banco do Brasil, Itaú, Bradesco e Sicredi</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Previsão diária de fluxo de caixa operacional</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Baixa fiscal imediata ao detectar depósitos</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 6. BI & INTELLIGENCE MODULE INTERFACE */}
              {activeModule === 'bi' && (
                <div className="module-fade-in bi-module">
                  <div className="interface-splits">
                    <div className="interactive-pane">
                      <div className="panel-title-row">
                        <span>DEMONSTRATIVO DE RESULTADO OPERACIONAL (DRE)</span>
                        <div className="status-badge">EBITDA REAL</div>
                      </div>

                      <div className="bi-analytics-box">
                        <div className="analytics-grid">
                          <div className="analytic-card">
                            <span className="lbl">Faturamento Líquido</span>
                            <strong>R$ 4.250.000,00</strong>
                            <span className="subtext text-positive">+14% vs Safra anterior</span>
                          </div>
                          
                          <div className="analytic-card">
                            <span className="lbl">Custo Operacional Total</span>
                            <strong>R$ 2.450.000,00</strong>
                            <span className="subtext text-negative">-2% sob cotações inteligentes</span>
                          </div>

                          <div className="analytic-card full-card">
                            <span className="lbl">Margem EBITDA da Safra</span>
                            <div className="ebitda-row">
                              <strong className="text-emerald">42.3%</strong>
                              <span className="lbl-status">EXCELENTE RENTABILIDADE</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="feature-description-pane">
                      <span className="badge-module">INTELiGÊNCIA & BI</span>
                      <h3>Lucratividade Real na Ponta do Lápis</h3>
                      <p>
                        A tomada de decisão estratégica depende de dados rápidos e confiáveis. Nosso módulo 
                        de Business Intelligence calcula e consolida automaticamente sua margem EBITDA da safra, 
                        distribuindo custos operacionais em contas de custeio detalhadas de defensivos, frotas e pessoal.
                      </p>
                      
                      <div className="feature-bullets-grid">
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>DRE automatizado atualizado diariamente</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Distribuição exata de custos de plantio e colheita</span></div>
                        <div className="bullet-row"><CheckCircle2 size={14} className="text-emerald" /> <span>Visão unificada para consolidar múltiplas fazendas</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </section>

      {/* -------------------- UNIFIED OPERATIONAL FLUID TIMELINE -------------------- */}
      <section id="fluxo-processos" className="unified-timeline-section">
        <div className="container-inner-layout">
          <div className="section-head-centered">
            <span className="section-pre-title">INTEGRAÇÃO DE PROCESSOS</span>
            <h2>O Fluxo Contínuo da Fazenda ao Banco</h2>
            <p>
              Em um ERP tradicional, os módulos funcionam como caixas isoladas. No <strong>tauze</strong>, 
              cada atividade operacional alimenta de forma automática o próximo passo do seu negócio.
            </p>
          </div>

          <div className="operational-flow-visual-hub">
            {/* Timeline Steps Left */}
            <div className="flow-steps-column">
              {[
                { title: "1. Entrada de Insumos & Compras", desc: "A nota fiscal eletrônica (NF-e) do fornecedor é importada no sistema. O estoque de adubos e químicos é abastecido imediatamente no estoque.", icon: <ShoppingCart size={16} /> },
                { title: "2. Manejo Físico de Pastagens & Rastreio", desc: "A pesagem voluntária monitora os brincos RFID das cabeças de gado. O sistema recalcula o GMD do lote e prevê a data ótima para abate.", icon: <Scale size={16} /> },
                { title: "3. Telemetria de Frota & Colheita", desc: "Os tratores realizam o serviço no campo. O consumo de diesel é lançado, as horas são atualizadas e o grão colhido alimenta o estoque físico.", icon: <Truck size={16} /> },
                { title: "4. Travamento de Preço & Venda", desc: "No momento ótimo indicado pelo mercado ou pelo volume, emite-se o contrato de venda de soja ou carne e a nota fiscal é enviada ao cliente.", icon: <FileText size={16} /> },
                { title: "5. Recebimento & Conciliação Bancária", desc: "O pagamento cai no banco corporativo. A API do Tauze reconhece a transação, casa o extrato com a nota e gera o saldo positivo no caixa.", icon: <DollarSign size={16} /> }
              ].map((step, idx) => (
                <button 
                  key={idx}
                  className={`flow-selector-btn ${flowStep === idx ? 'active' : ''}`}
                  onClick={() => setFlowStep(idx)}
                >
                  <div className="bullet-num">{idx + 1}</div>
                  <div className="texts">
                    <strong>{step.title}</strong>
                    <span>Clique para entender o fluxo de dados</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Simulated Live Process Card Right */}
            <div className="flow-screen-viewer">
              <div className="viewer-card">
                <div className="card-top-head">
                  <div className="icon-badge-flow">
                    {[<ShoppingCart size={18} />, <Scale size={18} />, <Truck size={18} />, <FileText size={18} />, <DollarSign size={18} />][flowStep]}
                  </div>
                  <strong>FLUXO DE INTEGRAÇÃO EM TEMPO REAL</strong>
                </div>

                <div className="card-body-flow">
                  <h4>
                    {
                      [
                        "Como as Compras abastecem o Inventário",
                        "Como o RFID automatiza a engorda de animais",
                        "Como a Telemetria se integra aos custos operacionais",
                        "Como as Vendas faturam e programam entregas",
                        "Como a API bancária liquida o fluxo financeiro"
                      ][flowStep]
                    }
                  </h4>
                  <p>
                    {
                      [
                        "Ao adquirir adubo ou defensivos, a importação do XML da NF-e cria a requisição de compras, atualiza o inventário por depósito físico e planeja o cronograma de contas a pagar no módulo financeiro sem redigitação de dados.",
                        "À medida que o boi transita pela porteira com brinco RFID voluntário, as antenas transmitem as pesagens. O sistema gera a estimativa de custos de engorda por arroba e agenda no painel financeiro a receita projetada de abate.",
                        "Toda telemetria de combustíveis e horas das máquinas é processada. Ao detectar abastecimento, o sistema atualiza o centro de custo de cada talhão de terra e planeja automaticamente a recompra preventiva de diesel.",
                        "A colheita ou engorda entra no estoque. O operador fecha o contrato e emite a NF-e. O sistema calcula taxas comerciais, faz a baixa automática no almoxarifado de insumos e agenda a cobrança ativa.",
                        "O depósito do comprador é identificado no extrato bancário. A inteligência do Tauze lê a assinatura digital, casa o montante líquido correspondente com a venda pendente e atualiza os dashboards de BI em tempo real."
                      ][flowStep]
                    }
                  </p>

                  <div className="flow-interactive-status-badge">
                    <span className="live-pulse"></span>
                    <span>INTEGRAÇÃO DE BANCO DE DADOS CONCLUÍDA</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- INTERACTIVE CAPITAL PROCESS CALCULATOR (LEDGER) -------------------- */}
      <section id="simulador-processos" className="process-roi-section">
        <div className="roi-layout-box">
          <div className="section-head-centered">
            <span className="section-pre-title">SIMULADOR DE ECONOMIA</span>
            <h2>O Impacto Financeiro dos Processos do ERP</h2>
            <p>
              Ajuste as métricas de escala da sua fazenda e veja na fatura timbrada a estimativa de economia 
              anual assegurada ao unificar e otimizar seus fluxos de trabalho.
            </p>
          </div>

          <div className="roi-calculator-layout">
            {/* Silders Panel Left */}
            <div className="sliders-control-desk">
              <span className="desk-eyebrow">PARÂMETROS DE PRODUÇÃO</span>
              <h3>Configure seus Custos</h3>

              {/* Slider 1: Herd scale */}
              <div className="slider-control-group">
                <div className="label-row">
                  <span>Rebanho Ativo (Cabeças):</span>
                  <strong>{herdScale.toLocaleString('pt-BR')} cab.</strong>
                </div>
                <input 
                  type="range" 
                  min="200" 
                  max="12000" 
                  step="100" 
                  value={herdScale} 
                  onChange={(e) => setHerdScale(parseInt(e.target.value))}
                  className="matrix-range"
                />
              </div>

              {/* Slider 2: Hectares */}
              <div className="slider-control-group">
                <div className="label-row">
                  <span>Área de Cultivo (Hectares):</span>
                  <strong>{harvestHectares.toLocaleString('pt-BR')} ha</strong>
                </div>
                <input 
                  type="range" 
                  min="300" 
                  max="25000" 
                  step="100" 
                  value={harvestHectares} 
                  onChange={(e) => setHarvestHectares(parseInt(e.target.value))}
                  className="matrix-range"
                />
              </div>

              {/* Slider 3: Admin time */}
              <div className="slider-control-group">
                <div className="label-row">
                  <span>Horas Administrativas Gastas (Mensais):</span>
                  <strong>{adminTimeSaved} horas</strong>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="160" 
                  step="5" 
                  value={adminTimeSaved} 
                  onChange={(e) => setAdminTimeSaved(parseInt(e.target.value))}
                  className="matrix-range"
                />
              </div>
            </div>

            {/* Printable Invoice Right */}
            <div className="printable-invoice-wrapper">
              <div className="invoice-paper">
                <div className="invoice-head">
                  <span className="brand">TAUZE SYSTEMS RETAIL</span>
                  <span className="title">DEMONSTRATIVO DE RETORNO SOBRE O PROCESSO</span>
                  <span className="date">DATA DE ANÁLISE: 2026-05-22</span>
                </div>

                <div className="dotted-separator"></div>

                <div className="invoice-entries">
                  <div className="invoice-entry-row">
                    <span>Otimização RFID Pecuária (Fim do estresse de manejo)</span>
                    <strong className="text-positive">+ R$ {Math.round(rfidSavingValue).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="invoice-entry-row">
                    <span>Diesel & Desgaste Otimizado (Telemetria)</span>
                    <strong className="text-positive">+ R$ {Math.round(fuelSavingValue).toLocaleString('pt-BR')}</strong>
                  </div>
                  <div className="invoice-entry-row">
                    <span>Redução de Horas Administrativas (Conciliação API)</span>
                    <strong className="text-positive">+ R$ {Math.round(adminSavingValue).toLocaleString('pt-BR')}</strong>
                  </div>
                </div>

                <div className="dotted-separator"></div>

                <div className="invoice-total-section">
                  <span>RETORNO ANUAL ESTIMADO</span>
                  <span className="total-val">R$ {totalProcessSavings.toLocaleString('pt-BR')}</span>
                </div>

                <div className="invoice-footer">
                  <div className="gold-stamp">
                    <Award size={14} />
                    <span>PROCESSOS CERTIFICADOS</span>
                  </div>
                  <p>Valores médios projetados com base no ganho operacional relatado por produtores parceiros.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- OPERATIONAL FAQ SECTION -------------------- */}
      <section className="matrix-faq-section" id="faq">
        <div className="container-inner-layout">
          <div className="section-head-centered">
            <span className="section-pre-title">SUPORTE & OPERAÇÕES</span>
            <h2>Respostas a Dúvidas Operacionais</h2>
            <p>
              Fique por dentro de todos os detalhes práticos de funcionamento do sistema para a gestão da sua fazenda.
            </p>
          </div>

          <div className="faq-accordion-container">
            {[
              {
                q: "Como a conciliação bancária automática funciona sem planilhas?",
                a: "A plataforma do Tauze utiliza integrações seguras via APIs bancárias. O sistema monitora suas contas correntes homologadas e reconhece pagamentos recebidos de grãos ou carne. A inteligência do ERP cruza o valor depositado com o saldo em aberto das faturas fiscais (NF-e) geradas na venda, realizando a baixa e atualizando o fluxo de caixa de forma automática."
              },
              {
                q: "A balança RFID voluntária pode ser usada em pastos sem energia elétrica?",
                a: "Sim. A balança embarcada Tauze possui sistemas de alimentação solar redundantes e bateria de altíssima autonomia. A transmissão de dados é offline-first: o hardware armazena as pesagens localmente e transmite ao roteador central via ondas de rádio de longo alcance LoraWAN (até 15km de distância)."
              },
              {
                q: "O módulo de compras consegue importar dados de cotações externas?",
                a: "Com certeza. No momento em que você cria uma requisição de compras (ex: Fertilizantes), o sistema dispara solicitações automáticas aos distribuidores parceiros cadastrados. Eles preenchem os preços em um formulário digital simplificado e o ERP agrupa todas as respostas em um pipeline visual de custos, indicando o melhor preço de mercado."
              },
              {
                q: "Como o sistema ajuda no controle de defensivos químicos e estoque?",
                a: "O módulo de Compras e Estoque registra a entrada de defensivos via XML de NF-e e monitora prazos de validade e dosagens. O controle de inventário físico dá baixa imediata de silagem ou fertilizantes no momento em que as ordens de serviço do módulo Frotas & Campo são executadas no solo."
              }
            ].map((faq, index) => (
              <div 
                key={index} 
                className={`faq-block ${faqOpen === index ? 'expanded' : ''}`}
                onClick={() => setFaqOpen(faqOpen === index ? null : index)}
              >
                <div className="faq-head-row">
                  <strong>{faq.q}</strong>
                  <ChevronDown size={18} className="arrow-icon" />
                </div>
                <div className="faq-body-content">
                  <p>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* -------------------- SPECIFICATIONS TECHNICAL SHEET -------------------- */}
      <section className="technical-specs-sheet">
        <div className="container-inner-layout">
          <div className="specs-card-matrix">
            <span className="specs-eyebrow">DIRETRIZ TÉCNICA</span>
            <h3>Ficha Técnica das Funcionalidades do ERP</h3>
            <p className="specs-sub font-sm">Abaixo da interface elegante, operam integrações de alta engenharia:</p>
            
            <div className="specs-matrix-grid">
              <div className="matrix-row">
                <span className="property">EMISSÃO FISCAL</span>
                <span className="detail">Compatível com NF-e (Produtor Rural), MDF-e e CT-e</span>
              </div>
              <div className="matrix-row">
                <span className="property">CONEXÃO OFF-GRID</span>
                <span className="detail">Transmissão de balança e frotas via LoraWAN (915 MHz)</span>
              </div>
              <div className="matrix-row">
                <span className="property">INTEGRAÇÃO BANCÁRIA</span>
                <span className="detail">Conexão segura via APIs Open Finance com os maiores bancos</span>
              </div>
              <div className="matrix-row">
                <span className="property">PADRÃO RFID ANTENA</span>
                <span className="detail">Compatibilidade com padrão internacional ISO 11784 e 11785</span>
              </div>
              <div className="matrix-row">
                <span className="property">MONITORAMENTO DE DIESEL</span>
                <span className="detail">Leitura direta em bocal de abastecimento e telemetria de tanque</span>
              </div>
              <div className="matrix-row">
                <span className="property">REQUISITOS DE HARDWARE</span>
                <span className="detail">Operável via tablet, smartphone ou desktop com sincronismo em tempo real</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------- BRAND FOOTER -------------------- */}
      <footer className="matrix-footer">
        <div className="footer-top-columns">
          <div className="footer-brand-side">
            <div className="brand-logo-inline">
              <TauzeLogo size={38} />
              <span className="title">tauze</span>
            </div>
            <p className="desc">
              Simplificando a gestão operacional, financeira e física do agronegócio moderno.
            </p>
          </div>

          <div className="footer-links-side">
            <div className="links-column">
              <h4>Módulos Principais</h4>
              <a href="#modulos">Pecuária</a>
              <a href="#modulos">Frotas</a>
              <a href="#modulos">Vendas</a>
              <a href="#modulos">Compras</a>
            </div>
            <div className="links-column">
              <h4>Financeiro</h4>
              <span className="text-tag">API Bancária Integrada</span>
              <span className="text-tag">NF-e Automática</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p>&copy; 2026 Tauze Systems. Todos os direitos reservados. Foco na operacionalização e crescimento do seu negócio rural.</p>
        </div>
      </footer>

      {/* -------------------- EMBEDDED SYSTEM MODULAR DESIGN -------------------- */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Outfit:wght@400;500;600;700;800;900&display=swap');

        .tauze-erp-matrix {
          /* Color Design Tokens */
          --bg-canvas: #faf9f6;          /* Luxurious warm off-white alabaster */
          --bg-card: rgba(255, 255, 255, 0.85); /* Premium clean glass */
          --text-main: #131c16;          /* Deep obsidian carbon text */
          --text-muted: #4e5651;         /* Warm readability graphite */
          --accent: #00b865;             /* Signature vibrant emerald */
          --accent-hover: #009953;
          --gold: #c5a880;               /* Soft warm luxury gold/brass */
          --gold-light: rgba(197, 160, 115, 0.08);
          --border-premium: rgba(197, 160, 115, 0.22); /* Gold hairline border */
          --border-light: rgba(19, 28, 22, 0.06);     /* Micro hairline border */
          --shadow-luxe: 0 25px 50px rgba(19, 28, 22, 0.03), inset 0 1px 0 rgba(255, 255, 255, 0.9);
          
          background-color: var(--bg-canvas);
          color: var(--text-main);
          font-family: 'Inter', sans-serif;
          min-height: 100vh;
          overflow-x: clip;
          position: relative;
          scroll-behavior: smooth;
        }

        /* Helpers */
        .text-positive { color: var(--accent); }
        .text-negative { color: #ff5f56; }
        .text-gold { color: var(--gold); }
        .font-sm { font-size: 0.85rem; }
        .flex-row { display: flex; align-items: center; gap: 6px; }

        /* --- TICKER COMMODITIES BAR --- */
        .commodities-ticker {
          background: #0f1411;
          color: #ffffff;
          height: 38px;
          display: flex;
          align-items: center;
          overflow: hidden;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1001;
          border-bottom: 1px solid rgba(255, 255, 255, 0.04);
        }

        .ticker-container {
          display: flex;
          white-space: nowrap;
          width: max-content;
        }

        .ticker-slide {
          display: flex;
          animation: infiniteTickerSlide 34s linear infinite;
        }

        @keyframes infiniteTickerSlide {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }

        .ticker-node {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 600;
          margin-right: 48px;
          letter-spacing: 0.03em;
          color: rgba(255, 255, 255, 0.75);
        }

        .ticker-indicator {
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: var(--accent);
          display: inline-block;
        }

        /* --- NAVBAR --- */
        .matrix-navbar {
          position: fixed;
          top: 38px;
          left: 0;
          right: 0;
          z-index: 1000;
          height: 86px;
          display: flex;
          align-items: center;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border-bottom: 1px solid transparent;
        }

        .matrix-navbar.elevated {
          background: rgba(250, 249, 246, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          height: 72px;
          border-bottom: 1px solid var(--border-premium);
          box-shadow: 0 10px 30px rgba(19, 28, 22, 0.02);
        }

        .navbar-inner {
          max-width: 1240px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-title-column {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .brand-name {
          font-family: 'Outfit', sans-serif;
          font-weight: 900;
          font-size: 1.6rem;
          letter-spacing: -0.04em;
          color: var(--text-main);
          line-height: 1;
        }

        .brand-description {
          font-family: 'Outfit', sans-serif;
          font-size: 0.6rem;
          font-weight: 700;
          color: var(--gold);
          letter-spacing: 0.12em;
          margin-top: 2px;
          text-transform: uppercase;
        }

        .navbar-links {
          display: flex;
          gap: 36px;
        }

        .navbar-links a {
          font-size: 0.88rem;
          font-weight: 600;
          color: var(--text-muted);
          text-decoration: none;
          transition: color 0.25s;
        }

        .navbar-links a:hover {
          color: var(--text-main);
        }

        .btn-access-suite {
          background: var(--text-main);
          color: #ffffff;
          padding: 10px 18px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s;
        }

        .btn-access-suite:hover {
          background: #000000;
          transform: translateY(-1.5px);
          box-shadow: 0 6px 18px rgba(19, 28, 22, 0.08);
        }

        /* --- HERO --- */
        .matrix-hero {
          position: relative;
          padding: 200px 24px 80px 24px;
          min-height: 75vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }

        .radial-glow-layer {
          position: absolute;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(0, 184, 101, 0.04) 0%, transparent 70%);
          z-index: 1;
        }

        .dots-layout-layer {
          position: absolute;
          inset: 0;
          background-image: 
            radial-gradient(var(--border-premium) 1px, transparent 1px);
          background-size: 32px 32px;
          opacity: 0.25;
          z-index: 1;
        }

        .hero-content-box {
          position: relative;
          z-index: 2;
          max-width: 900px;
        }

        .hero-eyebrow-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.8);
          border: 1px solid var(--border-premium);
          padding: 8px 16px;
          border-radius: 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-main);
          margin-bottom: 28px;
          box-shadow: 0 4px 12px rgba(19, 28, 22, 0.02);
        }

        .hero-main-title {
          font-family: 'Lora', serif;
          font-size: 3.8rem;
          font-weight: 500;
          line-height: 1.15;
          color: var(--text-main);
          letter-spacing: -0.02em;
          margin-bottom: 24px;
        }

        .hero-subtext {
          font-size: 1.15rem;
          line-height: 1.7;
          color: var(--text-muted);
          max-width: 760px;
          margin: 0 auto 36px auto;
        }

        .hero-actions-row {
          display: flex;
          justify-content: center;
          gap: 16px;
        }

        .btn-primary-action {
          background: var(--accent);
          color: #ffffff;
          padding: 16px 28px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all 0.3s;
          box-shadow: 0 10px 25px rgba(0, 184, 101, 0.15);
        }

        .btn-primary-action:hover {
          background: var(--accent-hover);
          transform: translateY(-2px);
          box-shadow: 0 12px 30px rgba(0, 184, 101, 0.22);
        }

        .btn-secondary-action {
          background: rgba(255, 255, 255, 0.9);
          color: var(--text-main);
          border: 1px solid var(--border-premium);
          padding: 16px 28px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
          transition: all 0.3s;
        }

        .btn-secondary-action:hover {
          background: #ffffff;
          border-color: var(--gold);
          transform: translateY(-2px);
        }

        .hero-quick-features {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 36px;
          max-width: 1100px;
          width: 100%;
          margin: 64px auto 0 auto;
          border-top: 1px solid var(--border-premium);
          padding-top: 32px;
        }

        .quick-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .quick-item strong {
          font-weight: 700;
        }

        /* --- CONSOLE WORKSPACE BOARD --- */
        .modules-showcase-section {
          padding: 100px 24px;
          max-width: 1240px;
          margin: 0 auto;
        }

        .section-head-centered {
          text-align: center;
          max-width: 700px;
          margin: 0 auto 56px auto;
        }

        .section-pre-title {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--gold);
          margin-bottom: 12px;
          text-transform: uppercase;
        }

        .section-head-centered h2 {
          font-family: 'Lora', serif;
          font-size: 2.4rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
        }

        .section-head-centered p {
          color: var(--text-muted);
          line-height: 1.6;
        }

        .matrix-console-board {
          background: var(--bg-card);
          border: 1px solid var(--border-premium);
          border-radius: 16px;
          padding: 24px;
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 24px;
          box-shadow: var(--shadow-luxe);
        }

        .console-navigation-sidebar {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sidebar-group-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          text-transform: uppercase;
          padding-left: 12px;
          margin-bottom: 8px;
          text-align: left;
        }

        .module-tab-btn {
          position: relative;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 14px 16px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: flex-start;
          gap: 16px;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }

        .module-tab-btn .tab-icon-wrap {
          background: rgba(19, 28, 22, 0.04);
          color: var(--text-muted);
          width: 34px;
          height: 34px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .module-tab-btn .tab-texts strong {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 700;
          color: var(--text-main);
          margin-bottom: 4px;
          transition: color 0.3s;
        }

        .module-tab-btn .tab-texts span {
          display: block;
          font-size: 0.74rem;
          color: var(--text-muted);
          line-height: 1.3;
        }

        /* Hover & Active Button Styles */
        .module-tab-btn:hover {
          background: rgba(255, 255, 255, 0.5);
          border-color: rgba(197, 160, 115, 0.12);
        }

        .module-tab-btn.active {
          background: #ffffff;
          border-color: var(--border-premium);
          box-shadow: 0 10px 30px rgba(19, 28, 22, 0.02);
        }

        .module-tab-btn.active .tab-icon-wrap {
          background: var(--gold-light);
          color: var(--accent);
        }

        .module-tab-btn.active .tab-texts strong {
          color: var(--accent);
        }

        /* Display Frame (Mac style) */
        .console-display-workspace {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          min-height: 380px;
          box-shadow: inset 0 0 40px rgba(19, 28, 22, 0.01);
        }

        .workspace-header-bar {
          background: #FAF8F4;
          height: 40px;
          padding: 0 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-light);
        }

        .window-controls {
          display: flex;
          gap: 6px;
        }

        .window-controls .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .dot-close { background: #ff5f56; }
        .dot-minimize { background: #ffbd2e; }
        .dot-expand { background: #27c93f; }

        .workspace-path-bar {
          font-family: monospace;
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .live-badge {
          background: var(--gold-light);
          color: var(--gold);
          border: 1px solid var(--border-premium);
          font-size: 0.62rem;
          font-weight: 800;
          padding: 2px 8px;
          border-radius: 12px;
          letter-spacing: 0.05em;
        }

        .workspace-body-container {
          flex: 1;
          padding: 24px;
          display: flex;
          align-items: stretch;
        }

        .module-fade-in {
          animation: fadeEffectMatrix 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
        }

        @keyframes fadeEffectMatrix {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* --- STYLES FOR SIMULATORS --- */
        .interface-splits {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: center;
          height: 100%;
          text-align: left;
        }

        .interactive-pane {
          background: #FAF9F6;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 16px;
          min-height: 280px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .panel-title-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          margin-bottom: 12px;
        }

        .status-badge {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--accent);
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: heartBeatMatrix 1.8s infinite;
        }

        @keyframes heartBeatMatrix {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.3); }
        }

        .feature-description-pane {
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .badge-module {
          display: inline-block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: var(--gold);
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .feature-description-pane h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 12px;
          line-height: 1.25;
        }

        .feature-description-pane p {
          font-size: 0.84rem;
          line-height: 1.5;
          color: var(--text-muted);
          margin-bottom: 20px;
        }

        .feature-bullets-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .bullet-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }

        /* 1. Pecuária Simulator */
        .rfid-cattle-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .weigh-led-card {
          background: #ffffff;
          border: 1px solid var(--border-premium);
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 8px 20px rgba(19, 28, 22, 0.02);
        }

        .weigh-led-card .label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.62rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .weigh-led-card strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 800;
          color: var(--text-main);
        }

        .weigh-led-card strong.anim-digits {
          color: var(--accent);
          animation: digitWeigh 0.15s infinite alternate;
        }

        @keyframes digitWeigh {
          from { opacity: 0.6; }
          to { opacity: 1; }
        }

        .weigh-led-card .unit {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .weigh-led-card .status-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          color: var(--text-muted);
          margin-top: 8px;
        }

        .status-glow {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }

        .cattle-selector-widget .widget-label {
          font-size: 0.74rem;
          font-weight: 600;
          color: var(--text-main);
          display: block;
          margin-bottom: 8px;
        }

        .cattle-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .cattle-btn {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          text-align: left;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.25s;
        }

        .cattle-btn strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          color: var(--text-main);
        }

        .cattle-btn span {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        .cattle-btn:hover {
          border-color: var(--gold);
        }

        .cattle-btn.active {
          border-color: var(--accent);
          background: var(--gold-light);
        }

        .cattle-btn.active strong {
          color: var(--accent);
        }

        /* 2. Fleet & Campo */
        .fleet-machinery-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .machinery-selector {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 8px;
        }

        .machinery-tab {
          background: transparent;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
        }

        .machinery-tab.active {
          background: var(--gold-light);
          color: var(--gold);
        }

        .machinery-live-specs {
          background: #ffffff;
          border: 1px solid var(--border-light);
          padding: 16px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(19, 28, 22, 0.01);
        }

        .machinery-live-specs .lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .machinery-live-specs strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          color: var(--text-main);
        }

        .progress-bar-container {
          background: var(--border-light);
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
          margin-top: 8px;
          margin-bottom: 16px;
        }

        .progress-bar-container .bar {
          background: var(--accent);
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .spec-details-row {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          border-top: 1px solid var(--border-light);
          padding-top: 12px;
        }

        .spec-details-row strong {
          font-size: 0.85rem;
        }

        /* 3. Sales Contracts */
        .sales-contract-interactive-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contract-sheet {
          background: #ffffff;
          border: 1px solid var(--border-premium);
          padding: 16px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sheet-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .sheet-row span {
          color: var(--text-muted);
        }

        .sheet-row strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .sheet-divider {
          border-top: 1px dashed var(--border-premium);
          margin: 4px 0;
        }

        .sheet-total {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85rem;
        }

        .sheet-total span {
          font-weight: 700;
        }

        .sheet-total strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          color: var(--accent);
        }

        .btn-approve-contract {
          background: var(--text-main);
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-approve-contract:hover {
          background: #000000;
        }

        .btn-approve-contract.success {
          background: var(--accent);
          cursor: default;
        }

        /* 4. Purchasing order requisitions */
        .purchasing-pipeline-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pipeline-visual-steps {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid var(--border-light);
        }

        .step-node {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          opacity: 0.35;
          transition: opacity 0.3s;
        }

        .step-node.active {
          opacity: 1;
        }

        .step-node .num {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--text-main);
          color: #ffffff;
          font-size: 0.65rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .step-node.active .num {
          background: var(--accent);
        }

        .step-node span {
          font-size: 0.65rem;
          font-weight: 700;
        }

        .step-connector {
          flex: 1;
          height: 2px;
          background: var(--border-light);
          margin: 0 8px;
        }

        .purchase-info-sheet {
          background: #ffffff;
          border: 1px solid var(--border-light);
          padding: 12px;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .item-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.78rem;
        }

        .item-row span {
          color: var(--text-muted);
        }

        .item-row strong {
          color: var(--text-main);
          font-family: 'Outfit', sans-serif;
        }

        .btn-pipeline {
          width: 100%;
          background: var(--gold);
          color: #ffffff;
          border: none;
          padding: 10px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s;
        }

        .btn-pipeline:hover {
          background: #b5956c;
        }

        .btn-pipeline.success-btn {
          background: var(--text-main);
        }

        /* 5. Bank Reconciliation */
        .reconciliation-interactive-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .reconcile-split-cards {
          display: grid;
          grid-template-columns: 1fr 90px 1fr;
          gap: 8px;
          align-items: center;
        }

        .reconcile-card {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 12px;
          box-shadow: 0 4px 10px rgba(19, 28, 22, 0.01);
        }

        .reconcile-card .card-lbl {
          font-family: 'Outfit', sans-serif;
          font-size: 0.58rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
          display: block;
          margin-bottom: 6px;
        }

        .reconcile-card.bank-statement {
          border-left: 3px solid var(--gold);
        }

        .reconcile-card.erp-ledger {
          border-left: 3px solid var(--accent);
        }

        .entry-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .entry-row .title {
          font-size: 0.74rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .entry-row strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
        }

        .reconcile-card .time {
          font-size: 0.65rem;
          color: var(--text-muted);
          display: block;
          margin-top: 6px;
        }

        .reconcile-action-connector {
          display: flex;
          justify-content: center;
        }

        .btn-reconcile-trigger {
          background: var(--text-main);
          color: #ffffff;
          border: none;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 6px 10px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-reconcile-trigger:hover {
          background: #000000;
        }

        .stamp-success {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
          border: 1px solid var(--accent);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 4px;
          transform: rotate(-3deg);
        }

        .reconciliation-progress-indicator {
          background: #ffffff;
          border: 1px solid var(--border-light);
          padding: 12px;
          border-radius: 8px;
        }

        .reconciliation-progress-indicator .title {
          font-size: 0.74rem;
          font-weight: 600;
          display: block;
          margin-bottom: 6px;
        }

        .progress-bar-reconciled {
          background: var(--border-light);
          height: 6px;
          border-radius: 3px;
          overflow: hidden;
          margin-bottom: 6px;
        }

        .progress-bar-reconciled .bar {
          background: var(--accent);
          height: 100%;
          border-radius: 3px;
          transition: width 0.4s ease;
        }

        .progress-bar-reconciled .bar.half { width: 92%; }
        .progress-bar-reconciled .bar.full { width: 100%; }

        .reconciliation-progress-indicator .percentage {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--accent);
        }

        /* 6. BI & Analytics */
        .bi-analytics-box {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .analytic-card {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          padding: 14px;
        }

        .analytic-card.full-card {
          grid-column: 1 / span 2;
        }

        .analytic-card .lbl {
          font-size: 0.65rem;
          color: var(--text-muted);
          display: block;
          margin-bottom: 4px;
        }

        .analytic-card strong {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          color: var(--text-main);
          display: block;
        }

        .analytic-card .subtext {
          font-size: 0.68rem;
          font-weight: 700;
          margin-top: 4px;
          display: block;
        }

        .ebitda-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .ebitda-row strong {
          font-size: 1.8rem;
        }

        .ebitda-row .lbl-status {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
        }

        /* --- UNIFIED FLUID OPERATIONAL FLOW TIMELINE --- */
        .unified-timeline-section {
          padding: 100px 24px;
          background: #FAF9F6;
          border-top: 1px solid var(--border-premium);
          border-bottom: 1px solid var(--border-premium);
        }

        .container-inner-layout {
          max-width: 1040px;
          margin: 0 auto;
        }

        .operational-flow-visual-hub {
          display: grid;
          grid-template-columns: 1fr 420px;
          gap: 32px;
          margin-top: 56px;
          align-items: center;
        }

        .flow-steps-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .flow-selector-btn {
          background: #ffffff;
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          width: 100%;
        }

        .flow-selector-btn .bullet-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(19, 28, 22, 0.04);
          color: var(--text-muted);
          font-family: 'Outfit', sans-serif;
          font-size: 0.88rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s;
        }

        .flow-selector-btn .texts strong {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          color: var(--text-main);
          margin-bottom: 2px;
        }

        .flow-selector-btn .texts span {
          display: block;
          font-size: 0.74rem;
          color: var(--text-muted);
        }

        .flow-selector-btn:hover {
          border-color: var(--gold);
        }

        .flow-selector-btn.active {
          border-color: var(--accent);
          box-shadow: 0 8px 25px rgba(0, 184, 101, 0.03);
        }

        .flow-selector-btn.active .bullet-num {
          background: var(--accent);
          color: #ffffff;
        }

        .flow-selector-btn.active .texts strong {
          color: var(--accent);
        }

        /* Flow screen viewer right */
        .flow-screen-viewer {
          perspective: 1000px;
        }

        .viewer-card {
          background: #ffffff;
          border: 1px solid var(--border-premium);
          border-radius: 16px;
          padding: 32px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
          position: relative;
        }

        .card-top-head {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-light);
          padding-bottom: 16px;
        }

        .icon-badge-flow {
          background: var(--gold-light);
          color: var(--gold);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .card-top-head strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.06em;
          color: var(--text-muted);
        }

        .card-body-flow h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          font-weight: 800;
          color: var(--text-main);
          margin-bottom: 12px;
        }

        .card-body-flow p {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--text-muted);
          margin-bottom: 24px;
        }

        .flow-interactive-status-badge {
          background: rgba(0, 184, 101, 0.08);
          color: var(--accent);
          border: 1px solid var(--accent);
          padding: 8px 12px;
          border-radius: 6px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          letter-spacing: 0.02em;
        }

        .live-pulse {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          animation: heartBeatMatrix 1.8s infinite;
        }

        /* --- PROCESS ROI SECTION --- */
        .process-roi-section {
          padding: 100px 24px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .roi-calculator-layout {
          display: grid;
          grid-template-columns: 1fr 480px;
          gap: 40px;
          align-items: center;
          margin-top: 48px;
        }

        .sliders-control-desk {
          background: #ffffff;
          border: 1px solid var(--border-premium);
          border-radius: 16px;
          padding: 36px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
        }

        .desk-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 0.68rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 12px;
          display: block;
        }

        .sliders-control-desk h3 {
          font-family: 'Outfit', sans-serif;
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 28px;
        }

        .slider-control-group {
          margin-bottom: 24px;
        }

        .slider-control-group .label-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.88rem;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .slider-control-group strong {
          color: var(--accent);
        }

        .matrix-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: var(--border-premium);
          outline: none;
        }

        .matrix-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid #ffffff;
          box-shadow: 0 2px 6px rgba(19, 28, 22, 0.15);
          transition: transform 0.1s;
        }

        .matrix-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        /* Printable Invoice Receipt */
        .printable-invoice-wrapper {
          perspective: 1000px;
        }

        .invoice-paper {
          background: #fdfcf9;
          border: 1px solid #e8e3d5;
          box-shadow: 0 30px 60px rgba(28, 24, 20, 0.05), inset 0 0 100px rgba(197, 160, 115, 0.03);
          padding: 40px;
          border-radius: 4px;
          text-align: left;
          position: relative;
          background-image: 
            linear-gradient(rgba(197, 160, 115, 0.05) 1px, transparent 1px);
          background-size: 100% 28px;
        }

        .invoice-head {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 24px;
        }

        .invoice-head .brand {
          font-family: 'Outfit', sans-serif;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }

        .invoice-head .title {
          font-family: 'Lora', serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--text-main);
        }

        .invoice-head .date {
          font-family: monospace;
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .dotted-separator {
          border-top: 1px dashed rgba(197, 160, 115, 0.4);
          margin: 16px 0;
        }

        .invoice-entries {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 24px 0;
        }

        .invoice-entry-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.84rem;
          line-height: 1.4;
        }

        .invoice-entry-row span {
          color: var(--text-muted);
          max-width: 260px;
        }

        .invoice-entry-row strong {
          font-family: 'Outfit', sans-serif;
          color: var(--text-main);
        }

        .invoice-total-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: 24px 0;
        }

        .invoice-total-section span {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-main);
          letter-spacing: 0.05em;
        }

        .invoice-total-section .total-val {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 900;
          color: var(--accent);
        }

        .invoice-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          border-top: 1px solid rgba(19, 28, 22, 0.05);
          padding-top: 24px;
        }

        .gold-stamp {
          border: 2px double var(--gold);
          color: var(--gold);
          padding: 6px 12px;
          border-radius: 4px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 6px;
          transform: rotate(-6deg);
        }

        .invoice-footer p {
          font-size: 0.62rem;
          color: var(--text-muted);
          max-width: 180px;
          line-height: 1.4;
          text-align: right;
        }

        /* --- OPERATIONAL FAQ --- */
        .matrix-faq-section {
          padding: 100px 24px;
          background: #ffffff;
          border-top: 1px solid var(--border-premium);
        }

        .faq-accordion-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 48px;
        }

        .faq-block {
          background: var(--bg-canvas);
          border: 1px solid var(--border-light);
          border-radius: 12px;
          padding: 24px;
          cursor: pointer;
          transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
        }

        .faq-head-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .faq-head-row strong {
          font-family: 'Outfit', sans-serif;
          font-size: 0.98rem;
          color: var(--text-main);
        }

        .faq-block .arrow-icon {
          color: var(--text-muted);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-body-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .faq-body-content p {
          font-size: 0.88rem;
          line-height: 1.6;
          color: var(--text-muted);
          padding-top: 16px;
          margin: 0;
        }

        /* Expanded accordion states */
        .faq-block.expanded {
          border-color: var(--gold);
          background: #ffffff;
          box-shadow: 0 15px 35px rgba(19, 28, 22, 0.02);
        }

        .faq-block.expanded .arrow-icon {
          transform: rotate(180deg);
          color: var(--accent);
        }

        .faq-block.expanded .faq-body-content {
          max-height: 200px;
        }

        /* --- TECHNICAL SPECIFICATIONS INDEX --- */
        .technical-specs-sheet {
          padding: 80px 24px;
          background: #faf9f6;
          border-top: 1px solid var(--border-premium);
        }

        .specs-card-matrix {
          border: 1px solid var(--border-premium);
          background: #ffffff;
          border-radius: 12px;
          padding: 40px;
          text-align: left;
          box-shadow: var(--shadow-luxe);
        }

        .specs-eyebrow {
          font-family: 'Outfit', sans-serif;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--gold);
          letter-spacing: 0.1em;
          display: block;
          margin-bottom: 12px;
        }

        .specs-card-matrix h3 {
          font-family: 'Lora', serif;
          font-size: 1.8rem;
          font-weight: 500;
          color: var(--text-main);
          margin-bottom: 8px;
        }

        .specs-sub {
          color: var(--text-muted);
          margin-bottom: 32px;
          display: block;
        }

        .specs-matrix-grid {
          display: grid;
          grid-template-columns: 1fr;
          border-top: 1px solid var(--border-light);
        }

        .matrix-row {
          display: grid;
          grid-template-columns: 240px 1fr;
          padding: 16px 0;
          border-bottom: 1px solid var(--border-light);
          align-items: center;
        }

        .matrix-row .property {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: var(--text-muted);
          letter-spacing: 0.05em;
        }

        .matrix-row .detail {
          font-size: 0.88rem;
          color: var(--text-main);
          font-weight: 500;
        }

        /* --- FOOTER --- */
        .matrix-footer {
          background: #0f1411;
          color: #ffffff;
          padding: 80px 24px 40px 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }

        .footer-top-columns {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 48px;
          margin-bottom: 32px;
        }

        .footer-brand-side {
          max-width: 320px;
          text-align: left;
        }

        .brand-logo-inline {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .brand-logo-inline .title {
          font-family: 'Outfit', sans-serif;
          font-size: 1.8rem;
          font-weight: 900;
          letter-spacing: -0.04em;
          color: #ffffff;
        }

        .footer-brand-side .desc {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.6;
        }

        .footer-links-side {
          display: flex;
          gap: 64px;
          text-align: left;
        }

        .links-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .links-column h4 {
          font-family: 'Outfit', sans-serif;
          font-size: 0.78rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.4);
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .links-column a {
          font-size: 0.88rem;
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          transition: color 0.25s;
        }

        .links-column a:hover {
          color: var(--accent);
        }

        .text-tag {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #ffffff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-family: monospace;
          display: inline-block;
          margin-bottom: 4px;
        }

        .footer-bottom-row {
          max-width: 1200px;
          margin: 0 auto;
          text-align: center;
          font-size: 0.74rem;
          color: rgba(255, 255, 255, 0.4);
        }

        /* --- RESPONSIVENESS AND LAYOUT ALIGNMENT --- */
        @media (max-width: 991px) {
          .hero-main-title {
            font-size: 2.8rem;
          }
          
          .matrix-console-board {
            grid-template-columns: 1fr;
          }

          .interface-splits {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .operational-flow-visual-hub {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .roi-calculator-layout {
            grid-template-columns: 1fr;
            gap: 32px;
          }
          
          .printable-invoice-wrapper {
            max-width: 480px;
            margin: 0 auto;
          }

          .hero-quick-features {
            flex-direction: column;
            align-items: center;
            gap: 16px;
          }

          .matrix-row {
            grid-template-columns: 1fr;
            gap: 6px;
          }
        }

        @media (max-width: 576px) {
          .hero-main-title {
            font-size: 2.2rem;
          }

          .navbar-links {
            display: none;
          }

          .hero-actions-row {
            flex-direction: column;
            gap: 12px;
          }

          .btn-primary-action, .btn-secondary-action {
            width: 100%;
            justify-content: center;
          }

          .invoice-paper {
            padding: 20px;
          }

          .footer-top-columns {
            flex-direction: column;
            gap: 32px;
          }
        }
      `}</style>
    </div>
  );
};
