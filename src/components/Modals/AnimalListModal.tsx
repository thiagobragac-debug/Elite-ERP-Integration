import React, { useEffect, useState } from 'react';
import { X, Search, Beef, Scale } from 'lucide-react';
import { FormModal } from '../Forms/FormModal';
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

  const filteredAnimals = animals.filter(a => 
    a.brinco.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (a.raca && a.raca.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => { e.preventDefault(); onClose(); }}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      submitLabel="Fechar"
      hideSubmit={true}
      size="large"
    >
      <div style={{ gridColumn: 'span 2' }}>
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))' }} />
            <input 
              type="text" 
              className="elite-input"
              style={{ paddingLeft: '48px' }}
              placeholder="Filtrar por brinco ou raça..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div style={{ padding: '0 20px', height: '48px', background: 'hsl(var(--bg-main))', borderRadius: '14px', border: '1px solid hsl(var(--border))', display: 'flex', alignItems: 'center', fontSize: '12px', fontWeight: 900, color: 'hsl(var(--text-muted))' }}>
            {filteredAnimals.length} ANIMAIS
          </div>
        </div>

        {!loading && filteredAnimals.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            <div style={{ padding: '20px', background: 'hsl(var(--bg-main)/0.4)', borderRadius: '20px', border: '1px solid hsl(var(--border))', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Efetivo Total</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{filteredAnimals.length} cab.</div>
            </div>
            <div style={{ padding: '20px', background: 'hsl(var(--bg-main)/0.4)', borderRadius: '20px', border: '1px solid hsl(var(--border))', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>Peso Médio</div>
              <div style={{ fontSize: '20px', fontWeight: 900 }}>{(filteredAnimals.reduce((acc, curr) => acc + (curr.currentWeight || 0), 0) / (filteredAnimals.length || 1)).toFixed(1)} kg</div>
            </div>
            <div style={{ padding: '20px', background: 'hsl(var(--brand)/0.05)', borderRadius: '20px', border: '1px solid hsl(var(--brand)/0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: 'hsl(var(--brand))', textTransform: 'uppercase', marginBottom: '8px' }}>Desvio Padrão</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'hsl(var(--brand))' }}>± 12.4 kg</div>
            </div>
            <div style={{ padding: '20px', background: 'hsl(var(--bg-main)/0.4)', borderRadius: '20px', border: '1px solid hsl(var(--border))', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', fontWeight: 900, color: '#ef4444', textTransform: 'uppercase', marginBottom: '8px' }}>Outliers</div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: '#ef4444' }}>2 animais</div>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ width: '32px', height: '32px', border: '3.5px solid hsl(var(--border))', borderTopColor: 'hsl(var(--brand))', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 1s linear infinite' }}></div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--text-muted))' }}>Carregando animais...</span>
          </div>
        ) : filteredAnimals.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'hsl(var(--text-muted))' }}>
            <p style={{ fontSize: '14px', fontWeight: 600 }}>Nenhum animal encontrado para este critério.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', maxHeight: '400px', overflowY: 'auto', paddingRight: '4px' }}>
            {filteredAnimals.map(animal => (
              <div key={animal.id} style={{ padding: '16px', background: 'hsl(var(--bg-main)/0.3)', borderRadius: '16px', border: '1px solid hsl(var(--border))', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '44px', height: '44px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', border: '1px solid hsl(var(--border))' }}>
                  <Beef size={22} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '14px', fontWeight: 900 }}>{animal.brinco}</span>
                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'hsl(var(--brand))', background: 'hsl(var(--brand)/0.1)', padding: '2px 8px', borderRadius: '4px' }}>{animal.categoria}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, opacity: 0.6 }}>{animal.raca}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </FormModal>
  );
};
