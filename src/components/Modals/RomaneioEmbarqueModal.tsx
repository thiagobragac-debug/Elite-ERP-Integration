import React, { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  Truck,
  Scale,
  Beef,
  Plus,
  Trash2,
  Search,
  FileText,
  MapPin,
  User,
  Calendar,
  X,
  CheckCircle2,
  Hash,
  AlertCircle
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Animal {
  id: string;
  brinco: string;
  raca: string;
  peso_atual: number;
  sexo: string;
  categoria: string;
  status: string;
}

interface RomaneioEmbarqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGerarNF: (romaneioData: any) => void;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const mockAnimais: Animal[] = [
  { id: 'a1', brinco: '101', raca: 'Nelore', peso_atual: 520, sexo: 'M', categoria: 'Boi Gordo', status: 'Ativo' },
  { id: 'a2', brinco: '102', raca: 'Nelore', peso_atual: 498, sexo: 'M', categoria: 'Boi Gordo', status: 'Ativo' },
  { id: 'a3', brinco: '203', raca: 'Angus', peso_atual: 545, sexo: 'M', categoria: 'Boi Gordo', status: 'Ativo' },
  { id: 'a4', brinco: '305', raca: 'Brahman', peso_atual: 380, sexo: 'F', categoria: 'Novilha', status: 'Ativo' },
  { id: 'a5', brinco: '410', raca: 'Nelore', peso_atual: 280, sexo: 'M', categoria: 'Garrote', status: 'Ativo' },
];

// ─── Component ────────────────────────────────────────────────────────────────

export const RomaneioEmbarqueModal: React.FC<RomaneioEmbarqueModalProps> = ({
  isOpen,
  onClose,
  onGerarNF
}) => {
  // Step 1 - Animal selection
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Animal[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [animaisSelecionados, setAnimaisSelecionados] = useState<Animal[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Step 2 - Embarque data
  const [formData, setFormData] = useState({
    comprador: '',
    data_embarque: new Date().toISOString().split('T')[0],
    destino: '',
    gta_numero: '',
    placa_veiculo: '',
    motorista: '',
    observacoes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open/close
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setShowDropdown(false);
      setAnimaisSelecionados([]);
      setFormData({
        comprador: '',
        data_embarque: new Date().toISOString().split('T')[0],
        destino: '',
        gta_numero: '',
        placa_veiculo: '',
        motorista: '',
        observacoes: ''
      });
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Derived values
  const pesoTotal = animaisSelecionados.reduce((sum, a) => sum + a.peso_atual, 0);
  const custoMedio = animaisSelecionados.length > 0
    ? (pesoTotal / animaisSelecionados.length).toFixed(1)
    : '0';

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    const selectedIds = new Set(animaisSelecionados.map(a => a.id));
    const filtered = mockAnimais.filter(
      a =>
        !selectedIds.has(a.id) &&
        (a.brinco.toLowerCase().includes(q.toLowerCase()) ||
          a.raca.toLowerCase().includes(q.toLowerCase()) ||
          a.categoria.toLowerCase().includes(q.toLowerCase()))
    );
    setSearchResults(filtered);
    setShowDropdown(true);
  };

  const handleAddAnimal = (animal: Animal) => {
    setAnimaisSelecionados(prev => [...prev, animal]);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
  };

  const handleRemoveAnimal = (id: string) => {
    setAnimaisSelecionados(prev => prev.filter(a => a.id !== id));
  };

  const buildRomaneioData = () => ({
    animais: animaisSelecionados,
    comprador: formData.comprador,
    data_embarque: formData.data_embarque,
    destino: formData.destino,
    gta_numero: formData.gta_numero,
    placa_veiculo: formData.placa_veiculo,
    motorista: formData.motorista,
    observacoes: formData.observacoes,
    peso_total: pesoTotal,
    quantidade: animaisSelecionados.length
  });

  const handleSalvarRomaneio = (e: React.FormEvent) => {
    e.preventDefault();
    if (animaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um animal para o embarque.');
      return;
    }
    if (!formData.comprador) {
      toast.error('Informe o Comprador / Destinatário.');
      return;
    }
    if (!formData.data_embarque) {
      toast.error('Informe a Data do Embarque.');
      return;
    }
    toast.success('Romaneio salvo com sucesso!');
    onClose();
  };

  const handleGerarNFe = () => {
    if (animaisSelecionados.length === 0) {
      toast.error('Selecione ao menos um animal para o embarque.');
      return;
    }
    if (!formData.comprador) {
      toast.error('Informe o Comprador / Destinatário.');
      return;
    }
    if (!formData.data_embarque) {
      toast.error('Informe a Data do Embarque.');
      return;
    }

    const romaneioData = buildRomaneioData();
    setIsSubmitting(true);

    toast.promise(
      new Promise<void>((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'Gerando NF-e de Saída...',
        success: 'NF-e emitida com sucesso! Redirecionando...',
        error: 'Falha ao gerar NF-e. Tente novamente.'
      }
    ).then(() => {
      setIsSubmitting(false);
      onGerarNF(romaneioData);
      onClose();
    }).catch(() => {
      setIsSubmitting(false);
    });
  };

  // ─── Footer ──────────────────────────────────────────────────────────────────

  const customFooter = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      {/* Summary */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '10px',
          background: 'hsl(var(--bg-main))',
          border: '1px solid hsl(var(--border))'
        }}>
          <Beef size={14} style={{ color: 'hsl(var(--brand))' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {animaisSelecionados.length} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>animais</span>
          </span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 14px', borderRadius: '10px',
          background: 'hsl(var(--bg-main))',
          border: '1px solid hsl(var(--border))'
        }}>
          <Scale size={14} style={{ color: '#10b981' }} />
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            {pesoTotal.toLocaleString('pt-BR')} <span style={{ color: 'hsl(var(--text-muted))', fontWeight: 600 }}>kg total</span>
          </span>
        </div>
        {animaisSelecionados.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '10px',
            background: 'hsl(142 71% 45% / 0.08)',
            border: '1px solid hsl(142 71% 45% / 0.2)'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
              Média: <strong style={{ color: '#10b981' }}>{custoMedio} kg/@</strong>
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          type="button"
          onClick={onClose}
          className="glass-btn secondary"
          style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={handleSalvarRomaneio}
          disabled={isSubmitting}
          className="glass-btn"
          style={{
            padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700,
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            border: '1px solid hsl(var(--border))',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}
        >
          <FileText size={15} />
          Salvar Romaneio
        </button>

        <button
          type="button"
          onClick={handleGerarNFe}
          disabled={isSubmitting || animaisSelecionados.length === 0}
          style={{
            padding: '10px 22px', borderRadius: '12px', fontSize: '13px', fontWeight: 900,
            cursor: isSubmitting || animaisSelecionados.length === 0 ? 'not-allowed' : 'pointer',
            opacity: animaisSelecionados.length === 0 ? 0.5 : 1,
            display: 'flex', alignItems: 'center', gap: '8px',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: '#fff',
            border: 'none',
            boxShadow: animaisSelecionados.length > 0 ? '0 4px 16px rgba(16, 185, 129, 0.4)' : 'none',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <Truck size={15} />
          Salvar e Gerar NF-e de Saída
        </button>
      </div>
    </div>
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!isOpen) return null;

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={(e) => e.preventDefault()}
      title="Romaneio de Embarque"
      subtitle="Selecione os animais e preencha os dados para emissão da NF-e de Saída de gado."
      icon={Truck}
      size="xxlarge"
      hideSubmit={true}
      customFooter={customFooter}
    >
      {/* ── PASSO 01 — Seleção de Animais ─────────────────────────────────── */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Seleção de Animais para Embarque</h4>
        </div>

        {/* Search Field */}
        <div style={{ marginBottom: '16px' }} ref={searchRef}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute', left: '14px', top: '50%',
                transform: 'translateY(-50%)',
                color: 'hsl(var(--text-muted))',
                pointerEvents: 'none'
              }}
            />
            <input
              className="tauze-input"
              type="text"
              placeholder="Buscar por brinco, raça ou categoria..."
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              style={{ paddingLeft: '42px' }}
              autoComplete="off"
            />

            {/* Dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0, right: 0,
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                zIndex: 1000,
                overflow: 'hidden',
                maxHeight: '280px',
                overflowY: 'auto'
              }}>
                {searchResults.map((animal, idx) => (
                  <div
                    key={animal.id}
                    onClick={() => handleAddAnimal(animal)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 16px',
                      cursor: 'pointer',
                      borderBottom: idx < searchResults.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                      transition: 'background 0.15s'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.06)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'hsl(var(--brand) / 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'hsl(var(--brand))', flexShrink: 0
                      }}>
                        <Beef size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                          #{animal.brinco}
                          <span style={{
                            marginLeft: '8px', fontSize: '10px', fontWeight: 700,
                            background: animal.sexo === 'M' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                            color: animal.sexo === 'M' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                            padding: '1px 6px', borderRadius: '4px'
                          }}>
                            {animal.sexo === 'M' ? 'Macho' : 'Fêmea'}
                          </span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                          {animal.raca} · {animal.categoria}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{
                        fontSize: '13px', fontWeight: 900, color: '#10b981'
                      }}>
                        {animal.peso_atual} kg
                      </span>
                      <div style={{
                        width: '28px', height: '28px', borderRadius: '8px',
                        background: 'hsl(var(--brand) / 0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'hsl(var(--brand))'
                      }}>
                        <Plus size={14} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showDropdown && searchQuery.length > 0 && searchResults.length === 0 && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                left: 0, right: 0,
                background: 'hsl(var(--bg-card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '14px',
                padding: '20px',
                textAlign: 'center',
                zIndex: 1000,
                boxShadow: '0 12px 40px rgba(0,0,0,0.2)'
              }}>
                <AlertCircle size={20} style={{ color: 'hsl(var(--text-muted))', marginBottom: '6px' }} />
                <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', margin: 0, fontWeight: 600 }}>
                  Nenhum animal encontrado com "{searchQuery}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Animals Table */}
        {animaisSelecionados.length === 0 ? (
          <div style={{
            border: '2px dashed hsl(var(--border) / 0.6)',
            borderRadius: '16px',
            padding: '48px 24px',
            textAlign: 'center',
            background: 'hsl(var(--bg-main) / 0.3)'
          }}>
            <Beef size={32} style={{ color: 'hsl(var(--text-muted) / 0.4)', marginBottom: '12px' }} />
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: 'hsl(var(--text-muted))' }}>
              Nenhum animal selecionado
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'hsl(var(--text-muted) / 0.7)' }}>
              Use o campo de busca acima para adicionar animais ao embarque
            </p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr auto',
              gap: '0',
              padding: '10px 16px',
              background: 'hsl(var(--bg-main))',
              borderRadius: '12px 12px 0 0',
              border: '1px solid hsl(var(--border))',
              borderBottom: 'none'
            }}>
              {['# Brinco', 'Raça', 'Peso Atual', 'Categoria', ''].map((h, i) => (
                <div key={i} style={{
                  fontSize: '10px', fontWeight: 900, color: 'hsl(var(--text-muted))',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  textAlign: i === 4 ? 'center' : 'left'
                }}>
                  {h}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: '0 0 12px 12px',
              overflow: 'hidden'
            }}>
              {animaisSelecionados.map((animal, idx) => (
                <div
                  key={animal.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1.5fr 1.2fr 1.5fr auto',
                    gap: '0',
                    padding: '12px 16px',
                    borderBottom: idx < animaisSelecionados.length - 1 ? '1px solid hsl(var(--border) / 0.5)' : 'none',
                    background: idx % 2 === 0 ? 'hsl(var(--bg-card))' : 'hsl(var(--bg-main) / 0.3)',
                    transition: 'background 0.15s',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'hsl(var(--brand) / 0.04)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = idx % 2 === 0 ? 'hsl(var(--bg-card))' : 'hsl(var(--bg-main) / 0.3)')}
                >
                  {/* Brinco */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '8px',
                      background: 'hsl(var(--brand) / 0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'hsl(var(--brand))', flexShrink: 0, fontSize: '11px', fontWeight: 900
                    }}>
                      {idx + 1}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '13px', color: 'hsl(var(--text-main))' }}>
                      #{animal.brinco}
                    </span>
                    <span style={{
                      fontSize: '9px', fontWeight: 800,
                      background: animal.sexo === 'M' ? 'hsl(217 91% 60% / 0.12)' : 'hsl(316 73% 69% / 0.12)',
                      color: animal.sexo === 'M' ? 'hsl(217 91% 60%)' : 'hsl(316 73% 60%)',
                      padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase'
                    }}>
                      {animal.sexo === 'M' ? '♂' : '♀'}
                    </span>
                  </div>

                  {/* Raça */}
                  <div style={{ fontSize: '13px', color: 'hsl(var(--text-main))', fontWeight: 600 }}>
                    {animal.raca}
                  </div>

                  {/* Peso */}
                  <div style={{ fontWeight: 800, fontSize: '13px', color: '#10b981' }}>
                    {animal.peso_atual} kg
                  </div>

                  {/* Categoria */}
                  <div>
                    <span style={{
                      fontSize: '11px', fontWeight: 700,
                      background: 'hsl(var(--brand) / 0.1)',
                      color: 'hsl(var(--brand))',
                      padding: '3px 10px', borderRadius: '6px'
                    }}>
                      {animal.categoria}
                    </span>
                  </div>

                  {/* Remove */}
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveAnimal(animal.id)}
                      title="Remover animal"
                      style={{
                        width: '30px', height: '30px', borderRadius: '8px',
                        background: 'hsl(0 84% 60% / 0.08)',
                        border: '1px solid hsl(0 84% 60% / 0.2)',
                        color: 'hsl(0 84% 60%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'hsl(0 84% 60% / 0.15)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'hsl(0 84% 60% / 0.08)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary Footer */}
            <div style={{
              marginTop: '12px',
              padding: '12px 16px',
              background: 'linear-gradient(135deg, hsl(var(--brand) / 0.06) 0%, hsl(142 71% 45% / 0.06) 100%)',
              border: '1px solid hsl(var(--brand) / 0.15)',
              borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                  {animaisSelecionados.length} {animaisSelecionados.length === 1 ? 'animal selecionado' : 'animais selecionados'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                  Peso total: <strong style={{ color: '#10b981', fontWeight: 900 }}>{pesoTotal.toLocaleString('pt-BR')} kg</strong>
                </span>
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
                  Média: <strong style={{ color: 'hsl(var(--brand))', fontWeight: 900 }}>{custoMedio} kg</strong>
                </span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* ── PASSO 02 — Dados do Embarque ──────────────────────────────────── */}
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Dados do Embarque e Documentação</h4>
        </div>

        {/* Row 1: Comprador + Data */}
        <div className="tauze-input-grid" style={{ gridTemplateColumns: '2fr 1fr', marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <User size={14} /> Comprador / Destinatário
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Nome do comprador ou empresa"
              value={formData.comprador}
              onChange={(e) => setFormData({ ...formData, comprador: e.target.value })}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data do Embarque
            </label>
            <input
              className="tauze-input"
              type="date"
              value={formData.data_embarque}
              onChange={(e) => setFormData({ ...formData, data_embarque: e.target.value })}
              required
            />
          </div>
        </div>

        {/* Row 2: Destino + GTA */}
        <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <MapPin size={14} /> Destino
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: Frigorífico X, Fazenda ABC"
              value={formData.destino}
              onChange={(e) => setFormData({ ...formData, destino: e.target.value })}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> GTA Saída — Número
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: GTA-2024-00123"
              value={formData.gta_numero}
              onChange={(e) => setFormData({ ...formData, gta_numero: e.target.value })}
            />
          </div>
        </div>

        {/* Row 3: Placa + Motorista */}
        <div className="tauze-input-grid grid-col-2" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Truck size={14} /> Placa do Veículo
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: ABC-1234"
              value={formData.placa_veiculo}
              onChange={(e) => setFormData({ ...formData, placa_veiculo: e.target.value.toUpperCase() })}
              style={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <User size={14} /> Motorista
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Nome completo do motorista"
              value={formData.motorista}
              onChange={(e) => setFormData({ ...formData, motorista: e.target.value })}
            />
          </div>
        </div>

        {/* Row 4: Observações */}
        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Observações
            </label>
            <textarea
              className="tauze-input tauze-textarea"
              placeholder="Informações adicionais sobre o embarque, condições, acordos especiais..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>
      </section>

      {/* ── Info Banner ─────────────────────────────────────────────────────── */}
      <div style={{
        padding: '14px 18px',
        background: 'linear-gradient(135deg, hsl(var(--brand) / 0.05) 0%, hsl(142 71% 45% / 0.05) 100%)',
        border: '1px solid hsl(var(--brand) / 0.15)',
        borderRadius: '14px',
        display: 'flex', alignItems: 'center', gap: '14px',
        marginTop: '-8px'
      }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: 'hsl(var(--brand) / 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: 'hsl(var(--brand))'
        }}>
          <Scale size={18} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
            Romaneio de Embarque
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
            Salve o romaneio para registrar o movimento, ou gere diretamente a NF-e de Saída de gado com os dados preenchidos.
          </p>
        </div>
      </div>

      {/* Inline styles */}
      <style>{`
        .romaneio-row-hover:hover {
          background: hsl(var(--brand) / 0.04) !important;
        }
      `}</style>
    </SidePanel>
  );
};
