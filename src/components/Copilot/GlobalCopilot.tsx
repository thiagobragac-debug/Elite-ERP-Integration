import React, { useState, useEffect } from 'react';
import { Sparkles, X, ArrowUpRight, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './GlobalCopilot.css';

const promptMenu: Record<string, { label: string; prompts: string[] }> = {
  pecuaria: {
    label: '🐄 Pecuária',
    prompts: ['Qual pasto tem melhor GMD hoje?', 'Resumo da projeção de abate', 'Animais com desvio de meta no GMD', 'Qual a taxa de prenhez do último mês?']
  },
  mercado: {
    label: '📈 Mercado',
    prompts: ['Analisar histórico do Boi Gordo (CEPEA)', 'Qual a tendência de Sazonalidade da arroba?', 'Comparar Boi Gordo com Milho (B3)']
  },
  financeiro: {
    label: '💰 Financeiro',
    prompts: ['Resumo financeiro do mês', 'Qual meu nível de Inadimplência?', 'Previsão de Runway e fluxo de caixa']
  },
  agricultura: {
    label: '🌾 Agricultura',
    prompts: ['Produtividade média por hectare', 'Status do plantio da Safra atual']
  },
  comercial: {
    label: '🤝 Comercial',
    prompts: ['Ticket médio de vendas', 'Volume comercializado no mês']
  },
  estoque: {
    label: '📦 Suprimentos / Estoque',
    prompts: ['Produtos com estoque crítico', 'Acuracidade do inventário', 'Saving de compras do mês']
  },
  frota: {
    label: '🚛 Logística & Frota',
    prompts: ['Consumo médio de Diesel', 'Disponibilidade de frota atual', 'Custo de manutenção por hora']
  }
};

export const GlobalCopilot: React.FC = () => {
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(true);
  const [copilotInput, setCopilotInput] = useState('');
  const [suggestionCategory, setSuggestionCategory] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<any[]>([
    { type: 'system', text: 'Olá! Sou o Tauze Copilot. O novo módulo de Inteligência de Mercado e Gráficos de Previsão já estão conectados ao meu sistema. Como posso ajudar na sua gestão hoje?' }
  ]);
  
  const location = useLocation();

  useEffect(() => {
    // Context Awareness based on URL
    if (isCopilotOpen && chatHistory.length === 1) {
      const path = location.pathname.toLowerCase();
      if (path.includes('/financeiro')) {
        setSuggestionCategory('financeiro');
      } else if (path.includes('/pecuaria')) {
        setSuggestionCategory('pecuaria');
      } else if (path.includes('/mercado')) {
        setSuggestionCategory('mercado');
      } else if (path.includes('/estoque') || path.includes('/suprimentos')) {
        setSuggestionCategory('estoque');
      } else if (path.includes('/vendas') || path.includes('/comercial')) {
        setSuggestionCategory('comercial');
      } else if (path.includes('/maquinas') || path.includes('/frota')) {
        setSuggestionCategory('frota');
      } else if (path.includes('/agricultura')) {
        setSuggestionCategory('agricultura');
      } else {
        setSuggestionCategory(null);
      }
    }
  }, [location.pathname, isCopilotOpen]);

  const handleCopilotSend = () => {
    if (!copilotInput.trim()) return;
    
    const newUserMsg = { type: 'user', text: copilotInput };
    setChatHistory(prev => [...prev, newUserMsg]);
    setCopilotInput('');
    
    // Simulate AI response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { 
        type: 'system', 
        text: `Entendi! Processando sua solicitação baseada no contexto atual do sistema... Em breve trarei resultados detalhados.` 
      }]);
    }, 1000);
  };

  const handleSendPrompt = (prompt: string) => {
    setCopilotInput(prompt);
    // You could immediately send it too, but matching existing behavior we just populate input
  };

  return (
    <>
      <AnimatePresence>
        {isCopilotOpen && (
          <motion.div 
            initial={{ opacity: 0, y: 100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.9 }}
            className="tauze-copilot-overlay"
          >
            <div className="copilot-header">
              <div className="c-info">
                <Sparkles size={18} />
                <span>TAUZE COPILOT AI</span>
              </div>
              <button className="close-copilot-btn" onClick={() => setIsCopilotOpen(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="copilot-chat">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`msg ${msg.type}`}>
                  {msg.text}
                </div>
              ))}
              {chatHistory.length === 1 && suggestionCategory === null && (
                <>
                  <div className="msg-title" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase' }}>Escolha um módulo para explorar:</div>
                  {Object.entries(promptMenu).map(([key, item]) => (
                    <div key={key} className="msg suggestion" onClick={() => setSuggestionCategory(key)}>
                      {item.label} <ChevronRight size={14} style={{ float: 'right', marginTop: '2px' }} />
                    </div>
                  ))}
                </>
              )}
              {chatHistory.length === 1 && suggestionCategory !== null && (
                <>
                  <div className="msg-title" style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px', paddingLeft: '8px', textTransform: 'uppercase' }}>{promptMenu[suggestionCategory]?.label} - Sugestões:</div>
                  <div className="msg suggestion back-btn" onClick={() => setSuggestionCategory(null)} style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8' }}>
                    🔙 Voltar aos módulos
                  </div>
                  {promptMenu[suggestionCategory]?.prompts.map((prompt, idx) => (
                    <div key={idx} className="msg suggestion" onClick={() => handleSendPrompt(prompt)}>
                      {prompt}
                    </div>
                  ))}
                </>
              )}
            </div>
            <div className="copilot-input">
              <input 
                type="text" 
                placeholder="Pergunte qualquer coisa..." 
                value={copilotInput}
                onChange={(e) => setCopilotInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCopilotSend()}
              />
              <button className="send-btn" onClick={handleCopilotSend}><ArrowUpRight size={18} /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button className={`copilot-floating-btn ${isMinimized ? 'minimized' : ''}`} onClick={() => setIsCopilotOpen(true)}>
        <Sparkles size={24} />
        {!isMinimized && <span>Tauze Copilot</span>}
        <div 
          className="copilot-minimize-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setIsMinimized(!isMinimized);
          }}
          title={isMinimized ? "Expandir botão" : "Minimizar botão"}
        >
          {isMinimized ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </div>
      </button>
    </>
  );
};
