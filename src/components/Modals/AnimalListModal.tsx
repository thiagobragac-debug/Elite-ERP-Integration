import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Beef, Scale } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface AnimalListModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  filterField: string;
  filterValue: string;
  icon?: any;
}

export const AnimalListModal: React.FC<AnimalListModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  subtitle,
  filterField,
  filterValue,
  icon: Icon = Beef
}) => {
  const [animals, setAnimals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && filterValue) {
      fetchAnimals();
    }
  }, [isOpen, filterValue]);

  const fetchAnimals = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('animais')
      .select('*, pesagens(peso)')
      .eq(filterField, filterValue);
    
    if (data) {
      const animalsWithWeight = data.map(animal => {
        const latestWeight = animal.pesagens && animal.pesagens.length > 0 
          ? animal.pesagens[animal.pesagens.length - 1].peso 
          : 0;
        return { ...animal, currentWeight: latestWeight };
      });
      setAnimals(animalsWithWeight);
    }
    setLoading(false);
  };

  if (!isOpen) return null;

  const filteredAnimals = animals.filter(a => 
    a.brinco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.raca && a.raca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <header className="modal-header">
          <div className="header-icon">
            <Icon size={24} />
          </div>
          <div className="header-text">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="animal-list-body" style={{ padding: '24px', overflowY: 'auto' }}>
          <div className="list-filters">
            <div className="search-box">
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Filtrar por brinco ou raça..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="count-badge">
              {filteredAnimals.length} animais
            </div>
          </div>

          {!loading && filteredAnimals.length > 0 && (
            <div className="lot-summary-row">
              <div className="summary-item">
                <span className="label">Total Animais</span>
                <span className="value">{filteredAnimals.length}</span>
              </div>
              <div className="summary-item">
                <span className="label">Peso Total</span>
                <span className="value">
                  {filteredAnimals.reduce((acc, curr) => acc + (curr.currentWeight || 0), 0).toLocaleString()} kg
                </span>
              </div>
              <div className="summary-item">
                <span className="label">Peso Médio</span>
                <span className="value">
                  {(filteredAnimals.reduce((acc, curr) => acc + (curr.currentWeight || 0), 0) / (filteredAnimals.length || 1)).toFixed(1)} kg
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <span>Carregando animais...</span>
            </div>
          ) : filteredAnimals.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum animal encontrado para este critério.</p>
            </div>
          ) : (
            <div className="animals-grid">
              {filteredAnimals.map(animal => (
                <div key={animal.id} className="animal-mini-card">
                  <div className="animal-avatar">
                    <Beef size={20} />
                  </div>
                  <div className="animal-info">
                    <div className="animal-top">
                      <span className="brinco">{animal.brinco}</span>
                      <span className="category-tag">{animal.categoria}</span>
                    </div>
                    <div className="animal-bottom">
                      <span className="raca">{animal.raca}</span>
                      <span className="weight">
                        <Scale size={12} />
                        {animal.currentWeight} kg
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <footer className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>,
    document.body
  );
};
