import React, { useState, useEffect } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import {
  Wheat,
  FileText,
  Plus,
  Trash2,
  LayoutList,
  Search,
} from 'lucide-react';
import { DateInput } from '../../components/Form/DateInput';

interface BatchFeedFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any[]) => void;
}

export const BatchFeedForm: React.FC<BatchFeedFormProps> = ({ isOpen, onClose, onSubmit }) => {
  const { activeFarm } = useTenant();

  const [dataTrato, setDataTrato] = usePersistentState(
    'BatchFeedForm_data',
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
  );
  const [dietaId, setDietaId] = usePersistentState('BatchFeedForm_dieta', '');
  const [depositoId, setDepositoId] = usePersistentState('BatchFeedForm_deposito', '');

  const [items, setItems] = usePersistentState<any[]>('BatchFeedForm_items', []);

  const [loading, setLoading] = useState(false);
  const [lotes, setLotes] = useState<any[]>([]);
  const [animais, setAnimais] = useState<any[]>([]);
  const [dietas, setDietas] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);

  const [mode, setMode] = useState<'LOTE' | 'ANIMAL'>('LOTE');

  const isDadosDone = !!dataTrato && !!dietaId && !!depositoId;
  const isLotesDone =
    items.length > 0 &&
    items.every((i) => (mode === 'LOTE' ? !!i.lote_id : !!i.animal_id) && !!i.quantidade_kg);


  useEffect(() => {
    if (isOpen && activeFarm) {
      fetchData();
    }
  }, [isOpen, activeFarm]);

  const fetchData = async () => {
    const { data: lotesData } = await supabase
      .from('lotes')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'ATIVO');
    if (lotesData) {
      setLotes(lotesData);
    }

    const { data: animaisData } = await supabase
      .from('animais')
      .select('id, brinco, brinco_eletronico, raca, categoria')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'Ativo');
    if (animaisData) {
      setAnimais(animaisData);
    }

    const { data: dietasData } = await supabase
      .from('dietas')
      .select('id, nome, ingredientes')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'active');
    if (dietasData) {
      setDietas(dietasData);
    }

    const { data: depData } = await supabase
      .from('depositos')
      .select('id, nome')
      .eq('fazenda_id', activeFarm?.id || '')
      .eq('status', 'ativo');
    if (depData) {
      setDepositos(depData);
    }
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), lote_id: '', animal_id: '', quantidade_kg: '' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: string, field: string, value: any) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedDiet = dietas.find((d) => String(d.id) === String(dietaId));
      if (!selectedDiet) {
        throw new Error('Dieta não encontrada.');
      }

      const payloads = items
        .filter((i) => (mode === 'LOTE' ? i.lote_id : i.animal_id) && i.quantidade_kg)
        .map((item) => {
          // Expand the diet composition based on total KG consumed
          const insumos = (selectedDiet.ingredientes || []).map((comp: any) => {
            // comp.quantidade is percentage (0-100) or total kg
            const qtdInsumo = (Number(item.quantidade_kg) * Number(comp.quantidade)) / 100;
            return {
              produto_id: comp.produto_id,
              quantidade: isNaN(qtdInsumo) ? 0 : qtdInsumo,
              deposito_id: depositoId || comp.deposito_id || null,
              custo_medio: comp.custo_medio || 0,
            };
          });

          return {
            lote_id: mode === 'LOTE' ? item.lote_id : null,
            animal_id: mode === 'ANIMAL' ? item.animal_id : null,
            dieta_id: dietaId,
            data_trato: dataTrato,
            deposito_id: depositoId,
            observacoes: 'Lançamento via Planilha de Trato',
            insumos,
          };
        });

      if (payloads.length === 0) {
        throw new Error('Nenhum lote preenchido corretamente.');
      }

      await onSubmit(payloads);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      size="850px"
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Planilha de Trato (Nutrição)"
      subtitle="Lance o consumo de trato para múltiplos lotes de uma vez."
      icon={Wheat}
      loading={loading}
      submitLabel="Lançar Trato e Baixar Estoque"
      submitDisabled={!isDadosDone || !isLotesDone}
    >
      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 01</div>
          <h4 className="tauze-section-title">Dados do Trato</h4>
        </div>
        <p style={{ margin: '0 0 16px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          Informações sobre data, dieta e local de retirada (Depósito) do estoque.
        </p>

        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">Data do Trato</label>
            <DateInput
              className="tauze-input"
              value={dataTrato}
              onChange={(e) => setDataTrato(e.target.value)}
              required
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">Dieta Fornecida</label>
            <SearchableSelect
              value={dietaId}
              onChange={(val: any) => setDietaId(val)}
              options={dietas.map((d) => ({ value: d.id, label: d.nome }))}
              placeholder="Selecione a Dieta..."
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">Depósito de Origem (Baixa de Estoque)</label>
            <SearchableSelect
              value={depositoId}
              onChange={(val: any) => setDepositoId(val)}
              options={depositos.map((d) => ({ value: d.id, label: d.nome }))}
              placeholder="Buscar depósito..."
              icon={<Search size={14} />}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <div className="tauze-section-header">
          <div className="tauze-section-badge">PASSO 02</div>
          <h4 className="tauze-section-title">Distribuição do Trato</h4>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <div>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
              Tabela de distribuição do trato para os lotes (baseado na dieta).
            </p>
            <div
              style={{
                display: 'flex',
                gap: '8px',
                background: 'hsl(var(--bg-main))',
                padding: '4px',
                borderRadius: '8px',
                width: 'max-content',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setMode('LOTE');
                  setItems([]);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: mode === 'LOTE' ? '#fff' : 'transparent',
                  color: mode === 'LOTE' ? '#000' : 'hsl(var(--text-muted))',
                  fontWeight: mode === 'LOTE' ? 600 : 400,
                  boxShadow: mode === 'LOTE' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Por Lote / Curral
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('ANIMAL');
                  setItems([]);
                }}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  background: mode === 'ANIMAL' ? '#fff' : 'transparent',
                  color: mode === 'ANIMAL' ? '#000' : 'hsl(var(--text-muted))',
                  fontWeight: mode === 'ANIMAL' ? 600 : 400,
                  boxShadow: mode === 'ANIMAL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Por Animal Individual
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAddItem}
            className="secondary-btn"
            style={{ fontSize: '11px', padding: '6px 12px' }}
          >
            <Plus size={14} /> Adicionar Linha
          </button>
        </div>

        <div
          style={{
            overflowX: 'auto',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '500px' }}>
            <thead>
              <tr style={{ background: 'hsl(var(--bg-main))' }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                  }}
                >
                  {mode === 'LOTE' ? 'Lote / Curral' : 'Animal'}
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '11px',
                    color: 'hsl(var(--text-muted))',
                    width: '150px',
                  }}
                >
                  Total Tratado (KG)
                </th>
                <th style={{ padding: '12px', width: '50px' }} />
              </tr>
            </thead>
            <tbody>
              {items.map((item, _idx) => (
                <tr key={item.id} style={{ borderTop: '1px solid hsl(var(--border))' }}>
                  <td style={{ padding: '8px 12px' }}>
                    {mode === 'LOTE' ? (
                      <SearchableSelect
                        value={item.lote_id}
                        onChange={(val: any) => updateItem(item.id, 'lote_id', val)}
                        options={lotes.map((l) => ({ value: l.id, label: l.nome }))}
                        placeholder="Selecione o lote..."
                        height="36px"
                      />
                    ) : (
                      <SearchableSelect
                        value={item.animal_id}
                        onChange={(val: any) => updateItem(item.id, 'animal_id', val)}
                        options={animais.map((a) => ({
                          value: a.id,
                          label:
                            `Brinco: ${a.brinco} ${a.brinco_eletronico ? `(E: ${a.brinco_eletronico})` : ''} - ${a.raca || ''} ${a.categoria || ''}`.trim(),
                        }))}
                        placeholder="Busque por brinco, raça..."
                        height="36px"
                      />
                    )}
                  </td>
                  <td style={{ padding: '8px 12px' }}>
                    <input
                      type="number"
                      step="0.01"
                      className="tauze-input"
                      style={{ height: '36px', textAlign: 'center' }}
                      value={item.quantidade_kg}
                      onChange={(e) => updateItem(item.id, 'quantidade_kg', e.target.value)}
                      placeholder="0.0"
                    />
                  </td>
                  <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ef4444',
                        cursor: 'pointer',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      padding: '24px',
                      textAlign: 'center',
                      color: 'hsl(var(--text-muted))',
                      fontSize: '12px',
                    }}
                  >
                    Nenhum lote adicionado. Clique em "Adicionar Linha".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </SidePanel>
  );
};
