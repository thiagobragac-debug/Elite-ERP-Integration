import { Search, Bell, HelpCircle, LogOut, Sun, Moon, Github } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-search">
        <Search size={20} className="search-icon" />
        <input type="text" placeholder="Pesquisar animais, lotes, notas..." />
      </div>

      <div className="header-actions">
        <div className="sync-status" title="GitHub Sincronizado (Elite v5.0 Cloud)">
          <Github size={18} />
          <div className="status-dot-pulse"></div>
        </div>

        <button className="action-btn" onClick={toggleTheme} title={theme === 'light' ? 'Mudar para modo escuro' : 'Mudar para modo claro'}>
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
        
        <button className="action-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>

        <button className="action-btn" title="Ajuda & Suporte">
          <HelpCircle size={20} />
        </button>
        
        <div className="user-profile-wrapper">
          <div className="user-profile">
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
          
          <div className="user-dropdown">
            <button className="dropdown-item" onClick={logout}>
              <LogOut size={16} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
