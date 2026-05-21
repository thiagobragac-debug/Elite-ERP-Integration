import React from 'react';
import { Search, Bell, HelpCircle, LogOut, Sun, Moon, GitBranch, User } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { NotificationCenter } from '../Notifications/NotificationCenter';
import { CepeaBadge } from '../Market/CepeaBadge';
import './Header.css';

interface HeaderProps {
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenProfile = () => {} }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const isFleetRoute = location.pathname.startsWith('/frota');

  return (
    <header className="header">
      <div className="header-search">
        <Search size={20} className="search-icon" />
        <input 
          type="text" 
          placeholder={isFleetRoute ? "Pesquisar máquinas, OS, abastecimentos..." : "Pesquisar animais, lotes, notas..."} 
        />
      </div>

      <CepeaBadge />

      <div className="header-actions">
        {(location.pathname.startsWith('/admin') || location.pathname.startsWith('/saas')) && (
          <div className="sync-status" title="GitHub Sincronizado (Tauze v5.0 Cloud)">
            <GitBranch size={18} />
            <div className="status-dot-pulse"></div>
          </div>
        )}

        <button className="action-btn" onClick={toggleTheme} title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <NotificationCenter />

        <button className="action-btn" title="Ajuda & Suporte">
          <HelpCircle size={20} />
        </button>
        
        <div className="user-profile-wrapper" ref={dropdownRef}>
          <div 
            className="user-profile" 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            style={{ cursor: 'pointer' }}
          >
            <div className="user-info">
              <span className="user-name">{user?.name || 'Usuário'}</span>
              <span className="user-role">Administrador</span>
            </div>
            <div className="user-avatar-container">
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt={user.name} 
                  className="user-avatar"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement?.classList.add('show-initials');
                  }}
                />
              ) : null}
              <div className="user-initials">
                {(user?.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
          
          <div className={`user-dropdown ${isDropdownOpen ? 'open' : ''}`}>
            <button className="dropdown-item" onClick={() => { setIsDropdownOpen(false); navigate('/admin/perfil'); }}>
              <User size={16} />
              <span>Meu Perfil</span>
            </button>
            <button className="dropdown-item logout" onClick={() => { setIsDropdownOpen(false); logout(); }}>
              <LogOut size={16} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
