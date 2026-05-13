import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Command, ArrowRight, X, LayoutGrid, Users, DollarSign, Activity, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMANDS = [
  { id: 'home', title: 'Landing Page', icon: Globe, path: '/', category: 'Navegação' },
  { id: 'dashboard', title: 'Dashboard Executivo', icon: LayoutGrid, path: '/dashboard', category: 'Navegação' },
  { id: 'animals', title: 'Gestão de Animais', icon: Activity, path: '/pecuaria/animais', category: 'Pecuária' },
  { id: 'lots', title: 'Gestão de Lotes', icon: LayoutGrid, path: '/pecuaria/lotes', category: 'Pecuária' },
  { id: 'cashflow', title: 'Fluxo de Caixa', icon: DollarSign, path: '/financeiro/fluxo-caixa', category: 'Financeiro' },
  { id: 'payable', title: 'Contas a Pagar', icon: DollarSign, path: '/financeiro/pagar', category: 'Financeiro' },
  { id: 'receivable', title: 'Contas a Receber', icon: DollarSign, path: '/financeiro/receber', category: 'Financeiro' },
  { id: 'accounts', title: 'Contas Bancárias', icon: LayoutGrid, path: '/financeiro/contas', category: 'Financeiro' },
];

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        isOpen ? onClose() : null; // Parent handles opening, but this is a failsafe
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          handleSelect(filteredCommands[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  const handleSelect = (path: string) => {
    navigate(path);
    onClose();
    setQuery('');
  };

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="command-palette-overlay" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="command-palette-content"
            onClick={e => e.stopPropagation()}
          >
            <div className="search-header">
              <Search size={20} className="search-icon" />
              <input 
                autoFocus
                type="text" 
                placeholder="Busque por páginas, ferramentas ou comandos (Ex: Animais)" 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <div className="command-hint">
                <kbd>ESC</kbd>
              </div>
            </div>

            <div className="results-body">
              {filteredCommands.length > 0 ? (
                <div className="commands-list">
                  {filteredCommands.map((cmd, idx) => (
                    <div 
                      key={cmd.id}
                      className={`command-item ${idx === selectedIndex ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => handleSelect(cmd.path)}
                    >
                      <div className="cmd-icon">
                        <cmd.icon size={18} />
                      </div>
                      <div className="cmd-info">
                        <span className="cmd-title">{cmd.title}</span>
                        <span className="cmd-category">{cmd.category}</span>
                      </div>
                      {idx === selectedIndex && (
                        <motion.div layoutId="arrow" className="cmd-arrow">
                          <ArrowRight size={16} />
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results">
                  <X size={48} />
                  <p>Nenhum comando encontrado para "{query}"</p>
                </div>
              )}
            </div>

            <div className="palette-footer">
              <div className="footer-item">
                <kbd>↵</kbd> <span>Selecionar</span>
              </div>
              <div className="footer-item">
                <kbd>↑↓</kbd> <span>Navegar</span>
              </div>
              <div className="footer-item">
                <Command size={14} /> <span>Elite Search</span>
              </div>
            </div>
          </motion.div>

          <style>{`
            .command-palette-overlay {
              position: fixed;
              inset: 0;
              background: hsla(222, 47%, 11%, 0.8);
              backdrop-filter: blur(12px);
              display: flex;
              align-items: flex-start;
              justify-content: center;
              padding-top: 10vh;
              z-index: 100000;
            }

            .command-palette-content {
              width: 100%;
              max-width: 640px;
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              border-radius: 16px;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
              overflow: hidden;
              display: flex;
              flex-direction: column;
            }

            .search-header {
              padding: 20px 24px;
              display: flex;
              align-items: center;
              gap: 16px;
              border-bottom: 1px solid hsl(var(--border));
              background: hsla(var(--bg-main) / 0.5);
            }

            .search-icon {
              color: hsl(var(--brand));
            }

            .search-header input {
              flex: 1;
              background: transparent;
              border: none;
              outline: none;
              font-size: 1.125rem;
              font-family: var(--font-main);
              color: hsl(var(--text-main));
            }

            .command-hint kbd {
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              padding: 4px 8px;
              border-radius: 6px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 700;
            }

            .results-body {
              max-height: 400px;
              overflow-y: auto;
              padding: 12px;
            }

            .commands-list {
              display: flex;
              flex-direction: column;
              gap: 4px;
            }

            .command-item {
              padding: 12px 16px;
              border-radius: 12px;
              display: flex;
              align-items: center;
              gap: 16px;
              cursor: pointer;
              transition: all 0.2s;
            }

            .command-item.selected {
              background: hsl(var(--brand) / 0.1);
              transform: translateX(4px);
            }

            .cmd-icon {
              width: 36px;
              height: 36px;
              border-radius: 10px;
              background: hsl(var(--bg-main));
              border: 1px solid hsl(var(--border));
              display: flex;
              align-items: center;
              justify-content: center;
              color: hsl(var(--text-muted));
              transition: all 0.2s;
            }

            .command-item.selected .cmd-icon {
              background: hsl(var(--brand));
              color: white;
              border-color: hsl(var(--brand));
            }

            .cmd-info {
              display: flex;
              flex-direction: column;
              flex: 1;
            }

            .cmd-title {
              font-size: 0.9375rem;
              font-weight: 700;
              color: hsl(var(--text-main));
            }

            .cmd-category {
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 500;
            }

            .cmd-arrow {
              color: hsl(var(--brand));
            }

            .no-results {
              padding: 48px;
              text-align: center;
              color: hsl(var(--text-muted));
            }

            .no-results p {
              margin-top: 16px;
              font-weight: 600;
            }

            .palette-footer {
              padding: 12px 24px;
              background: hsla(var(--bg-main) / 0.5);
              border-top: 1px solid hsl(var(--border));
              display: flex;
              gap: 16px;
            }

            .footer-item {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 0.75rem;
              color: hsl(var(--text-muted));
              font-weight: 600;
            }

            .footer-item kbd {
              background: hsl(var(--bg-card));
              border: 1px solid hsl(var(--border));
              padding: 2px 6px;
              border-radius: 4px;
            }
          `}</style>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};
