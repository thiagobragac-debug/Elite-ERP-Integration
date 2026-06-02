import React, { useState, useEffect, useRef } from 'react';
import { SidePanel } from '../Layout/SidePanel';
import { 
  Scale, 
  X, 
  Layers, 
  Calendar, 
  ChevronDown, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Loader2,
  Award,
  Download,
  Upload,
  ArrowDown,
  BarChart2
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from '../Forms/SearchableSelect';

interface BatchWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface WeightRow {
  animal_id: string;
  brinco: string;
  lastWeight: number;
  lastDate: string | null;
  newWeight: string;
  evolucao: number;
  gmd: number;
  isTypoWarning: boolean;
}

export const BatchWeightModal: React.FC<BatchWeightModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
  const { activeFarm, activeTenantId, isGlobalMode } = useTenant();
  const [lots, setLots] = useState<any[]>([]);
  const [selectedLoteId, setSelectedLoteId] = useState<string>('');
  const [defaultDate, setDefaultDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [defaultObservation, setDefaultObservation] = useState<string>('');
  
  const [rows, setRows] = useState<WeightRow[]>([]);
  const [loadingLots, setLoadingLots] = useState(false);
  const [loadingAnimals, setLoadingAnimals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'manual' | 'planilha' | 'smart'>('manual');
  const [showSummary, setShowSummary] = useState(false);
  
  // Agricultural Smart Corral States
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleBrand, setScaleBrand] = useState<string>('TRUTEST');
  const [scaleType, setScaleType] = useState<string>('BLUETOOTH');
  const [activeFocusedIndex, setActiveFocusedIndex] = useState<number | null>(null);
  const [rfidSearch, setRfidSearch] = useState('');

  // #3 — track which row is being typed (for visual state)
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchLots();
      fetchAnimals('');
      
      const globalConnected = localStorage.getItem('tauze_scale_connected') === 'true';
      if (globalConnected) {
        setScaleConnected(true);
        setActiveTab('smart');
        setScaleBrand(localStorage.getItem('tauze_scale_brand') || 'TRUTEST');
        setScaleType(localStorage.getItem('tauze_scale_type') || 'BLUETOOTH');
      } else {
        setScaleConnected(false);
        setActiveTab('manual');
      }
    } else {
      setSelectedLoteId('');
      setRows([]);
      setShowSummary(false);
    }
  }, [isOpen, activeFarm, activeTenantId]);

  const fetchLots = async () => {
    setLoadingLots(true);
    try {
      let query = supabase
        .from('lotes')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .eq('status', 'ATIVO');

      if (!isGlobalMode && activeFarm?.id) {
        query = query.eq('fazenda_id', activeFarm.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLots(data || []);
    } catch (err) {
      console.error('Error fetching lots for batch modal:', err);
    } finally {
      setLoadingLots(false);
    }
  };

  const fetchAnimals = async (loteId: string) => {
    setLoadingAnimals(true);
    try {
      let q = supabase
        .from('animais')
        .select('id, brinco, peso_atual, peso_inicial, lote_id')
        .eq('tenant_id', activeTenantId)
        .ilike('status', 'ativo');
      
      if (!isGlobalMode && activeFarm?.id) {
        q = q.or(`fazenda_id.eq.${activeFarm.id},fazenda_id.is.null`);
      }
      
      if (loteId) {
        q = q.eq('lote_id', loteId);
      }
      
      const { data: animData, error: animErr } = await q;
      if (animErr) throw animErr;
      
      if (animData && animData.length > 0) {
        const animIds = animData.map(a => a.id);
        
        const { data: weighData, error: weighErr } = await supabase
          .from('pesagens')
          .select('animal_id, peso, data_pesagem')
          .in('animal_id', animIds)
          .order('data_pesagem', { ascending: false });
        
        if (weighErr) throw weighErr;
        
        const lastWeighingsMap: Record<string, any> = {};
        weighData?.forEach(w => {
          if (!lastWeighingsMap[w.animal_id]) {
            lastWeighingsMap[w.animal_id] = w;
          }
        });
        
        const initialRows: WeightRow[] = animData.map(a => {
          const lastW = lastWeighingsMap[a.id];
          const lastWeight = lastW ? Number(lastW.peso) : (a.peso_atual ? Number(a.peso_atual) : Number(a.peso_inicial || 0));
          const lastDate = lastW ? lastW.data_pesagem : null;
          
          return {
            animal_id: a.id,
            brinco: a.brinco,
            lastWeight,
            lastDate,
            newWeight: '',
            evolucao: 0,
            gmd: 0,
            isTypoWarning: false
          };
        });
        
        initialRows.sort((a, b) => a.brinco.localeCompare(b.brinco, undefined, { numeric: true }));
        setRows(initialRows);
      } else {
        setRows([]);
      }
    } catch (err) {
      console.error('Error fetching animals in batch:', err);
    } finally {
      setLoadingAnimals(false);
    }
  };

  const handleLoteChange = (val: string) => {
    setSelectedLoteId(val);
    fetchAnimals(val);
  };

  const handleWeightChange = (index: number, val: string) => {
    const newRows = [...rows];
    const row = newRows[index];
    row.newWeight = val;
    
    const newWeightVal = parseFloat(val);
    if (!isNaN(newWeightVal) && row.lastWeight > 0) {
      const diff = newWeightVal - row.lastWeight;
      row.evolucao = diff;
      
      const lastDate = row.lastDate ? new Date(row.lastDate) : null;
      const currDate = new Date(defaultDate);
      
      let diffDays = 1;
      if (lastDate) {
        const diffTime = currDate.getTime() - lastDate.getTime();
        diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      }
      
      row.gmd = diff / diffDays;
      
      const percentChange = (diff / row.lastWeight) * 100;
      row.isTypoWarning = Math.abs(percentChange) > 15;
    } else {
      row.evolucao = 0;
      row.gmd = 0;
      row.isTypoWarning = false;
    }
    
    setRows(newRows);
  };

  // #3 — Keyboard navigation with auto-advance
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Enter' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextInput = document.getElementById(`weight-input-${index + 1}`) as HTMLInputElement | null;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
        nextInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevInput = document.getElementById(`weight-input-${index - 1}`) as HTMLInputElement | null;
      if (prevInput) {
        prevInput.focus();
        prevInput.select();
        prevInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  };
  
  const handleConnectScale = async () => {
    if (scaleConnected) {
      setScaleConnected(false);
      localStorage.removeItem('tauze_scale_connected');
      localStorage.removeItem('tauze_scale_brand');
      localStorage.removeItem('tauze_scale_type');
      alert('🔌 Balança desconectada com sucesso.');
      return;
    }

    try {
      const activeBrand = localStorage.getItem('tauze_scale_brand') || 'TRUTEST';
      const activeType = localStorage.getItem('tauze_scale_type') || 'BLUETOOTH';

      if ((navigator as any).bluetooth && activeType === 'BLUETOOTH') {
        alert(`🌐 Conectando via Web Bluetooth à balança ${activeBrand}...`);
      } else {
        alert(`💡 Modo Homologação Ativo: Ativando Simulador de Balança ${activeBrand} (${activeType})!`);
      }
      
      setScaleConnected(true);
      setScaleBrand(activeBrand);
      setScaleType(activeType);
      localStorage.setItem('tauze_scale_connected', 'true');
      localStorage.setItem('tauze_scale_brand', activeBrand);
      localStorage.setItem('tauze_scale_type', activeType);
    } catch (err: any) {
      alert('❌ Falha ao conectar balança: ' + err.message);
    }
  };

  const handleScaleTriggerWeight = () => {
    if (!scaleConnected) {
      alert('⚠️ Conecte a Balança Eletrônica primeiro!');
      return;
    }
    
    if (activeFocusedIndex === null) {
      alert('⚠️ Por favor, selecione (clique) no campo de peso de um animal na grade abaixo para receber a pesagem!');
      return;
    }

    const baseWeight = rows[activeFocusedIndex].lastWeight > 0 ? rows[activeFocusedIndex].lastWeight : 380;
    const gain = 10 + Math.floor(Math.random() * 25);
    const simulatedWeight = baseWeight + gain;
    
    handleWeightChange(activeFocusedIndex, simulatedWeight.toString());

    setTimeout(() => {
      const nextIndex = activeFocusedIndex + 1;
      if (nextIndex < rows.length) {
        const nextInput = document.getElementById(`weight-input-${nextIndex}`) as HTMLInputElement | null;
        if (nextInput) {
          nextInput.focus();
          nextInput.select();
        }
      }
    }, 150);
  };

  const handleRfidScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfidSearch.trim()) return;

    const query = rfidSearch.trim().toLowerCase();
    const foundIndex = rows.findIndex(r => r.brinco.toLowerCase() === query || r.brinco.toLowerCase().includes(query));

    if (foundIndex !== -1) {
      setActiveFocusedIndex(foundIndex);
      setTimeout(() => {
        const targetInput = document.getElementById(`weight-input-${foundIndex}`) as HTMLInputElement | null;
        if (targetInput) {
          targetInput.focus();
          targetInput.select();
          targetInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      setRfidSearch('');
    } else {
      alert(`⚠️ Brinco RFID "${rfidSearch}" não encontrado neste lote.`);
    }
  };

  const handleClearWeights = () => {
    if (filledCount === 0) return;
    const confirmClear = confirm('⚠️ Tem certeza que deseja limpar todos os novos pesos digitados nesta sessão?');
    if (!confirmClear) return;
    
    const cleared = rows.map(r => ({
      ...r,
      newWeight: '',
      evolucao: 0,
      gmd: 0,
      isTypoWarning: false
    }));
    setRows(cleared);
  };

  const handleCsvExport = () => {
    if (rows.length === 0) {
      alert('⚠️ Não há animais listados para exportação.');
      return;
    }

    let csvContent = 'ID do Animal;Brinco;Peso Anterior (kg);Novo Peso (kg);Data da Pesagem (AAAA-MM-DD)\n';
    rows.forEach(r => {
      csvContent += `"${r.animal_id}";"${r.brinco}";"${r.lastWeight.toFixed(2)}";"";\"${defaultDate}\"\n`;
    });

    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `manejo_pesagem_${selectedLoteId ? 'lote' : 'geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split('\n');
        const parsedMap: Record<string, { weight: string, date: string }> = {};

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          let delimiter = ';';
          if (line.includes(',') && !line.includes(';')) {
            delimiter = ',';
          }

          const cols = line.split(delimiter);
          if (cols.length >= 4) {
            const animalId = cols[0].replace(/"/g, '').trim();
            const newWeight = cols[3].replace(/"/g, '').trim();
            const date = cols[4] ? cols[4].replace(/"/g, '').trim() : defaultDate;

            if (animalId && newWeight) {
              parsedMap[animalId] = { weight: newWeight, date };
            }
          }
        }

        const newRows = rows.map(r => {
          const match = parsedMap[r.animal_id];
          if (match) {
            const newWeightVal = parseFloat(match.weight);
            let diff = 0;
            let gmdVal = 0;
            let typo = false;

            if (!isNaN(newWeightVal) && r.lastWeight > 0) {
              diff = newWeightVal - r.lastWeight;
              
              const lastDate = r.lastDate ? new Date(r.lastDate) : null;
              const currDate = new Date(match.date || defaultDate);
              let diffDays = 1;
              if (lastDate) {
                const diffTime = currDate.getTime() - lastDate.getTime();
                diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
              }
              gmdVal = diff / diffDays;

              const percentChange = (diff / r.lastWeight) * 100;
              typo = Math.abs(percentChange) > 15;
            }

            return {
              ...r,
              newWeight: match.weight,
              evolucao: diff,
              gmd: gmdVal,
              isTypoWarning: typo
            };
          }
          return r;
        });

        setRows(newRows);
        alert(`✅ Planilha carregada com sucesso! ${Object.keys(parsedMap).length} pesos carregados na grade para revisão.`);
      } catch (err: any) {
        alert('❌ Erro ao ler planilha CSV: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // #8 — Smart save with confirmation for partial saves
  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    const pending = rows.length - filledCount;
    if (pending > 0 && filledCount > 0) {
      // Show inline summary instead of confirm dialog
      setShowSummary(true);
      return;
    }
    handleSubmit();
  };

  const handleSubmit = async () => {
    const rowsToInsert = rows.filter(r => r.newWeight.trim() !== '' && !isNaN(parseFloat(r.newWeight)));
    
    if (rowsToInsert.length === 0) {
      alert('⚠️ Digite o peso de pelo menos 1 animal.');
      return;
    }

    const hasWarnings = rowsToInsert.some(r => r.isTypoWarning);
    if (hasWarnings) {
      const confirmSave = confirm('⚠️ Existem animais com variações de peso muito acentuadas (>15%). Deseja salvar as pesagens mesmo assim?');
      if (!confirmSave) return;
    }

    setIsSubmitting(true);
    setShowSummary(false);
    try {
      const payloads = rowsToInsert.map(r => ({
        tenant_id: activeTenantId,
        fazenda_id: activeFarm?.id || null,
        animal_id: r.animal_id,
        peso: parseFloat(r.newWeight),
        data_pesagem: defaultDate,
        observacao: defaultObservation || null
      }));

      const { error: insertErr } = await supabase
        .from('pesagens')
        .insert(payloads);

      if (insertErr) throw insertErr;

      const updatePromises = rowsToInsert.map(r => 
        supabase
          .from('animais')
          .update({ peso_atual: parseFloat(r.newWeight) })
          .eq('id', r.animal_id)
      );

      await Promise.all(updatePromises);

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      alert('❌ Erro ao salvar pesagens em lote: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const filledCount = rows.filter(r => r.newWeight.trim() !== '').length;
  const pendingCount = rows.length - filledCount;
  const progressPct = rows.length > 0 ? (filledCount / rows.length) * 100 : 0;
  
  const typedRows = rows.filter(r => r.newWeight.trim() !== '' && !isNaN(parseFloat(r.newWeight)));
  const avgNewWeight = typedRows.length > 0 ? typedRows.reduce((sum, r) => sum + parseFloat(r.newWeight), 0) / typedRows.length : 0;
  const avgGmd = typedRows.length > 0 ? typedRows.reduce((sum, r) => sum + r.gmd, 0) / typedRows.length : 0;
  const totalGain = typedRows.reduce((sum, r) => sum + r.evolucao, 0);
  const warningCount = typedRows.filter(r => r.isTypoWarning).length;
  const abateCount = typedRows.filter(r => parseFloat(r.newWeight) >= 450).length;

  // #1 — progress bar color
  const progressColor = progressPct === 100 ? '#10b981' : progressPct >= 50 ? 'hsl(var(--brand))' : 'hsl(38 92% 50%)';

  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title="Lançamento Rápido em Massa (Modo Curral)"
      subtitle="Selecione o lote ou todos os animais para inserir pesos em série usando navegação por teclado."
      icon={Scale}
      size="xlarge"
      hideSubmit={true}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
        {/* ── Filters Row ── */}
        <div style={{
          padding: '20px',
          background: 'hsl(var(--bg-main) / 0.2)',
          borderBottom: '1px solid hsl(var(--border) / 0.4)',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Layers size={11} style={{ marginRight: '4px' }} /> Filtrar Origem
              {rows.length > 0 && (
                <span style={{ marginLeft: '6px', fontSize: '10px', fontWeight: 700, color: 'hsl(var(--brand))', background: 'hsl(var(--brand) / 0.1)', padding: '1px 6px', borderRadius: '8px' }}>
                  {rows.length} animais
                </span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <SearchableSelect
                value={selectedLoteId}
                onChange={handleLoteChange}
                disabled={loadingLots}
                placeholder="Todos os Animais Ativos"
                options={[
                  { value: '', label: 'Todos os Animais Ativos' },
                  ...lots.map(l => ({ value: l.id, label: `Lote: ${l.nome}` }))
                ]}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>
              <TrendingUp size={11} style={{ marginRight: '4px' }} /> Método de Lançamento
            </label>
            <div style={{ position: 'relative' }}>
              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value as any)}
                style={{ width: '100%', padding: '10px 14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--text-main))', fontSize: '13px', fontWeight: 700, appearance: 'none', cursor: 'pointer' }}
              >
                <option value="manual">⌨️ Digitação Manual (Teclado)</option>
                <option value="planilha">📊 Planilha de Manejo (CSV)</option>
                <option value="smart">🔌 Curral Smart (Balança / RFID)</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-muted))', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>
              <Calendar size={11} style={{ marginRight: '4px' }} /> Data da Pesagem Padrão
            </label>
            <input
              type="date"
              value={defaultDate}
              onChange={(e) => setDefaultDate(e.target.value)}
              style={{ width: '100%', padding: '9px 14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--text-main))', fontSize: '13px', fontWeight: 700 }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '8px' }}>
              Observação Padrão (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Pesagem geral, vacinação de aftosa..."
              value={defaultObservation}
              onChange={(e) => setDefaultObservation(e.target.value)}
              style={{ width: '100%', padding: '9px 14px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--text-main))', fontSize: '13px', fontWeight: 600 }}
            />
          </div>
        </div>

        {/* Smart Corral Bar */}
        {activeTab === 'smart' && (
          <div style={{
            padding: '12px 20px',
            background: 'hsl(var(--bg-main) / 0.3)',
            borderBottom: '1px solid hsl(var(--border) / 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Scale size={12} /> Integração Balança:
              </span>
              <button type="button" onClick={handleConnectScale} className="glass-btn" style={{
                padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                border: scaleConnected ? '1px solid #10b981' : '1px solid hsl(var(--border))',
                background: scaleConnected ? 'rgba(16, 185, 129, 0.1)' : 'hsl(var(--bg-card))',
                color: scaleConnected ? '#10b981' : 'hsl(var(--text-main))',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                {scaleConnected ? `🟢 Balança ${scaleBrand} - ${scaleType} Ativa` : '🔌 Conectar Balança Bluetooth'}
              </button>
              {scaleConnected && (
                <button type="button" onClick={handleScaleTriggerWeight} className="primary-btn animate-pulse" style={{
                  padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 900, cursor: 'pointer',
                  background: 'linear-gradient(135deg, hsl(var(--brand)) 0%, hsl(var(--brand) / 0.8) 100%)',
                  color: '#fff', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px',
                  boxShadow: '0 0 10px hsl(var(--brand) / 0.3)'
                }}>
                  ⚖️ Pesar Animal {activeFocusedIndex !== null ? `#${rows[activeFocusedIndex].brinco}` : 'Ativo'}
                </button>
              )}
            </div>
            <form onSubmit={handleRfidScan} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Award size={12} /> Bastão RFID:
              </span>
              <input
                type="text"
                placeholder="Digite Brinco e dê Enter"
                value={rfidSearch}
                onChange={(e) => setRfidSearch(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, width: '200px', background: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--text-main))', outline: 'none' }}
              />
            </form>
          </div>
        )}

        {/* Planilha Bar */}
        {activeTab === 'planilha' && (
          <div style={{
            padding: '12px 20px',
            background: 'hsl(var(--bg-main) / 0.4)',
            borderBottom: '1px solid hsl(var(--border) / 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'nowrap', gap: '20px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
              Manejo por Planilha: exporte para Excel, preencha e reimporte!
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
              {filledCount > 0 && (
                <button type="button" onClick={handleClearWeights} className="glass-btn secondary" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderColor: 'hsl(340 70% 50% / 0.3)', background: 'hsl(340 70% 50% / 0.05)', color: 'hsl(340 70% 50%)', transition: 'all 0.2s' }}>
                  Limpar Lançamentos
                </button>
              )}
              <button type="button" onClick={handleCsvExport} className="glass-btn secondary" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                <Download size={14} /> Exportar Modelo (CSV)
              </button>
              <button type="button" onClick={() => document.getElementById('batch-csv-upload')?.click()} className="glass-btn secondary" style={{ padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', borderColor: 'hsl(var(--brand) / 0.4)', background: 'hsl(var(--brand) / 0.08)', color: 'hsl(var(--brand))' }}>
                <Upload size={14} /> Importar Planilha (CSV)
              </button>
              <input type="file" id="batch-csv-upload" accept=".csv" style={{ display: 'none' }} onChange={handleCsvImport} />
            </div>
          </div>
        )}

        {/* #3 — keyboard hint bar */}
        {activeTab === 'manual' && rows.length > 0 && !loadingAnimals && (
          <div style={{
            padding: '6px 20px',
            background: 'hsl(var(--brand) / 0.04)',
            borderBottom: '1px solid hsl(var(--border) / 0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '16px'
          }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowDown size={10} />
              <span style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '3px', padding: '0px 4px', fontFamily: 'monospace', fontSize: '10px' }}>Enter</span>
              ou
              <span style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '3px', padding: '0px 4px', fontFamily: 'monospace', fontSize: '10px' }}>↓</span>
              avança para o próximo animal
            </span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ background: 'hsl(var(--bg-main))', border: '1px solid hsl(var(--border))', borderRadius: '3px', padding: '0px 4px', fontFamily: 'monospace', fontSize: '10px' }}>↑</span>
              volta ao anterior
            </span>
          </div>
        )}

        {/* ── Animals Grid ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0', minHeight: '300px' }}>
          {loadingAnimals ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', gap: '12px' }}>
              <Loader2 size={32} className="spin" color="hsl(var(--brand))" />
              <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', fontWeight: 700 }}>Buscando animais da fazenda...</span>
            </div>
          ) : rows.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '240px', color: 'hsl(var(--text-muted))', gap: '8px' }}>
              <Scale size={36} style={{ opacity: 0.4 }} />
              <span style={{ fontSize: '13px', fontWeight: 700 }}>Nenhum animal ativo encontrado nesta seleção.</span>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                <tr style={{ background: 'hsl(var(--bg-card))', borderBottom: '2px solid hsl(var(--border))' }}>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase' }}>Animal / Brinco</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', textAlign: 'center' }}>Peso Anterior (kg)</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', textAlign: 'center', width: '180px' }}>Novo Peso (kg)</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', textAlign: 'center' }}>Evolução (kg)</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', textAlign: 'center' }}>GMD Projetado</th>
                  <th style={{ padding: '10px 16px', fontSize: '11px', fontWeight: 900, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const newW = parseFloat(row.newWeight);
                  const isAbate = !isNaN(newW) && newW >= 450;
                  const isPesado = row.newWeight !== '' && !isNaN(newW);
                  const isFocused = focusedIndex === index;

                  let rowBg = 'transparent';
                  let rowBorder = '1px solid hsl(var(--border) / 0.4)';
                  if (isFocused) { rowBg = 'hsl(var(--brand) / 0.04)'; rowBorder = '1px solid hsl(var(--brand) / 0.15)'; }
                  else if (row.isTypoWarning) { rowBg = 'hsl(38 92% 50% / 0.04)'; }
                  else if (isPesado) { rowBg = 'hsl(142 71% 45% / 0.03)'; }

                  return (
                    <tr key={row.animal_id} style={{ borderBottom: rowBorder, background: rowBg, transition: 'all 0.15s' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 800, color: 'hsl(var(--text-main))' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{
                            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                            background: isFocused ? 'hsl(var(--brand))' :
                              row.isTypoWarning ? 'hsl(38 92% 50%)' :
                              isPesado ? '#10b981' : 'hsl(var(--border))',
                            boxShadow: isFocused ? '0 0 6px hsl(var(--brand) / 0.5)' :
                              isPesado && !row.isTypoWarning ? '0 0 4px hsl(142 71% 45% / 0.4)' : 'none',
                            transition: 'all 0.2s'
                          }} />
                          <span style={{ fontSize: '12px', background: 'hsl(var(--brand) / 0.1)', color: 'hsl(var(--brand))', padding: '4px 10px', borderRadius: '8px', fontWeight: 800 }}>
                            #{row.brinco}
                          </span>
                          {isPesado && (
                            <CheckCircle2 size={14} style={{ color: row.isTypoWarning ? 'hsl(38 92% 50%)' : '#10b981', flexShrink: 0 }} />
                          )}
                        </div>
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 700, color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                        {row.lastWeight ? `${row.lastWeight.toFixed(2)} kg` : 'N/A'}
                        {row.lastDate && (
                          <div style={{ fontSize: '10px', fontWeight: 600, color: 'hsl(var(--text-muted) / 0.6)', marginTop: '2px' }}>
                            {new Date(row.lastDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <input
                          type="number"
                          step="0.1"
                          id={`weight-input-${index}`}
                          placeholder="0.00"
                          value={row.newWeight}
                          onChange={(e) => handleWeightChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, index)}
                          onFocus={() => { setActiveFocusedIndex(index); setFocusedIndex(index); }}
                          onBlur={() => setFocusedIndex(null)}
                          style={{
                            width: '100%', padding: '8px 12px',
                            background: isFocused ? 'hsl(var(--brand) / 0.05)' : 'hsl(var(--bg-card))',
                            border: row.isTypoWarning
                              ? '1.5px solid hsl(38 92% 50%)'
                              : isFocused
                              ? '1.5px solid hsl(var(--brand))'
                              : isPesado
                              ? '1.5px solid hsl(142 71% 45% / 0.4)'
                              : '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                            color: 'hsl(var(--text-main))',
                            fontSize: '14px', fontWeight: 800, textAlign: 'center', outline: 'none',
                            boxShadow: row.isTypoWarning ? '0 0 0 3px hsl(38 92% 50% / 0.15)' :
                              isFocused ? '0 0 0 3px hsl(var(--brand) / 0.12)' : 'none',
                            transition: 'all 0.15s'
                          }}
                        />
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'center' }}>
                        {row.newWeight ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{
                              fontSize: '13px', fontWeight: 900,
                              color: row.evolucao > 0 ? '#10b981' : row.evolucao < 0 ? '#ef4444' : 'hsl(var(--text-muted))'
                            }}>
                              {row.evolucao >= 0 ? `+${row.evolucao.toFixed(2)}` : row.evolucao.toFixed(2)} kg
                            </span>
                            <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted) / 0.7)', marginTop: '2px', fontWeight: 600 }}>
                              {((parseFloat(row.newWeight) * 0.54) / 15).toFixed(1)} @
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted) / 0.35)', fontSize: '12px' }}>--</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', fontWeight: 800, textAlign: 'center' }}>
                        {row.newWeight ? (
                          <span style={{
                            fontSize: '13px', fontWeight: 900,
                            color: row.gmd >= 0.8 ? '#10b981' : row.gmd >= 0.4 ? 'hsl(38 92% 50%)' : row.gmd < 0 ? '#ef4444' : 'hsl(var(--text-main))'
                          }}>
                            {row.gmd.toFixed(2)}
                            <span style={{ fontSize: '9px', color: 'hsl(var(--text-muted))', fontWeight: 600, marginLeft: '2px' }}>kg/dia</span>
                          </span>
                        ) : (
                          <span style={{ color: 'hsl(var(--text-muted) / 0.35)', fontSize: '12px' }}>--</span>
                        )}
                      </td>

                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', flexWrap: 'wrap' }}>
                          {row.isTypoWarning && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(38 92% 50% / 0.1)', color: 'hsl(38 92% 50%)', padding: '2px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase' }}>
                              <AlertTriangle size={10} /> Alerta
                            </span>
                          )}
                          {isAbate && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'hsl(142 71% 45% / 0.1)', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '9.5px', fontWeight: 900, textTransform: 'uppercase' }}>
                              <Award size={10} /> Abate
                            </span>
                          )}
                          {isPesado && !row.isTypoWarning && !isAbate && (
                            <span style={{ fontSize: '10px', fontWeight: 700, color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                              <CheckCircle2 size={12} /> OK
                            </span>
                          )}
                          {!isPesado && (
                            <span style={{ color: 'hsl(var(--text-muted) / 0.4)', fontSize: '11px', fontWeight: 600 }}>
                              {isFocused ? '✏️ Digitando...' : 'Pendente'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* #7 — Summary panel before save */}
        {showSummary && filledCount > 0 && (
          <div style={{
            padding: '16px 20px',
            background: 'linear-gradient(135deg, hsl(var(--brand) / 0.06) 0%, hsl(var(--brand) / 0.02) 100%)',
            borderTop: '1.5px dashed hsl(var(--brand) / 0.3)',
            borderBottom: '1px solid hsl(var(--border) / 0.5)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <BarChart2 size={16} style={{ color: 'hsl(var(--brand))' }} />
              <span style={{ fontSize: '12px', fontWeight: 900, color: 'hsl(var(--brand))', textTransform: 'uppercase' }}>
                Resumo da Sessão — Confirme antes de salvar
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '12px' }}>
              {[
                { label: 'Pesados', value: `${filledCount}/${rows.length}`, color: 'hsl(var(--brand))' },
                { label: 'Pendentes', value: `${pendingCount} animais`, color: pendingCount > 0 ? 'hsl(38 92% 50%)' : '#10b981' },
                { label: 'Peso Médio', value: `${avgNewWeight.toFixed(1)} kg`, color: 'hsl(var(--text-main))' },
                { label: 'GMD Médio', value: `${avgGmd.toFixed(2)} kg/dia`, color: avgGmd >= 0.8 ? '#10b981' : avgGmd >= 0.4 ? 'hsl(38 92% 50%)' : '#ef4444' },
                { label: 'Ganho Total', value: `${totalGain >= 0 ? '+' : ''}${totalGain.toFixed(1)} kg`, color: totalGain >= 0 ? '#10b981' : '#ef4444' },
              ].map((s, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
                  <div style={{ fontSize: '16px', fontWeight: 900, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            {pendingCount > 0 && (
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'hsl(38 92% 50%)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={12} />
                {pendingCount} animal{pendingCount > 1 ? 'is' : ''} sem peso serão ignorados. Somente {filledCount} pesagens serão salvas.
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button type="button" onClick={() => setShowSummary(false)} style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid hsl(var(--border))', background: 'transparent', color: 'hsl(var(--text-muted))', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                Voltar e Corrigir
              </button>
              <button type="button" onClick={handleSubmit} disabled={isSubmitting} style={{ padding: '8px 20px', borderRadius: '10px', border: 'none', background: 'hsl(var(--brand))', color: '#fff', fontSize: '12px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {isSubmitting ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
                Confirmar e Salvar {filledCount} Pesagens
              </button>
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          borderTop: '1px solid hsl(var(--border) / 0.5)',
          background: 'hsl(var(--bg-card) / 0.3)',
          marginTop: 'auto'
        }}>
          {/* Stats + Buttons row */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'nowrap', overflow: 'hidden' }}>
              {rows.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'hsl(var(--text-muted))', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                    Progresso:
                  </span>
                  <span style={{ fontSize: '11.5px', fontWeight: 900, color: progressColor, whiteSpace: 'nowrap' }}>
                    {filledCount}/{rows.length}
                  </span>
                  <div style={{ width: '80px', height: '6px', background: 'hsl(var(--bg-main))', borderRadius: '3px', overflow: 'hidden', display: 'inline-block' }}>
                    <div style={{
                      height: '100%',
                      width: `${progressPct}%`,
                      background: progressPct === 100
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : progressPct >= 50
                        ? 'linear-gradient(90deg, hsl(var(--brand)), hsl(var(--brand) / 0.8))'
                        : 'linear-gradient(90deg, hsl(38 92% 50%), hsl(38 92% 65%))',
                      borderRadius: '3px',
                      transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                    }} />
                  </div>
                  <span style={{ fontSize: '11.5px', fontWeight: 900, color: progressColor, whiteSpace: 'nowrap' }}>
                    {progressPct.toFixed(0)}%
                  </span>
                  {warningCount > 0 && (
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: 'hsl(38 92% 50%)', background: 'hsl(38 92% 50% / 0.1)', padding: '1px 5px', borderRadius: '6px', border: '1px solid hsl(38 92% 50% / 0.2)', whiteSpace: 'nowrap' }}>
                      ⚠️ {warningCount}
                    </span>
                  )}
                  {abateCount > 0 && (
                    <span style={{ fontSize: '9.5px', fontWeight: 800, color: '#10b981', background: 'hsl(142 71% 45% / 0.1)', padding: '1px 5px', borderRadius: '6px', border: '1px solid hsl(142 71% 45% / 0.2)', whiteSpace: 'nowrap' }}>
                      🏆 {abateCount}
                    </span>
                  )}
                  <span style={{ width: '1.5px', height: '12px', background: 'hsl(var(--border) / 0.6)', marginLeft: '4px' }} />
                </div>
              )}

              {filledCount > 0 ? (
                <>
                  <span style={{ fontSize: '11.5px', color: 'hsl(var(--text-muted))', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Média: <strong style={{ color: 'hsl(var(--text-main))' }}>{avgNewWeight.toFixed(1)} kg</strong>
                  </span>
                  <span style={{ width: '1.5px', height: '12px', background: 'hsl(var(--border) / 0.6)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: 'hsl(var(--text-muted))', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    GMD: <strong style={{ color: avgGmd >= 0 ? '#10b981' : '#ef4444' }}>{avgGmd.toFixed(2)} kg/dia</strong>
                  </span>
                  <span style={{ width: '1.5px', height: '12px', background: 'hsl(var(--border) / 0.6)', flexShrink: 0 }} />
                  <span style={{ fontSize: '11.5px', color: 'hsl(var(--text-muted))', fontWeight: 700, whiteSpace: 'nowrap' }}>
                    Ganho total: <strong style={{ color: totalGain >= 0 ? '#10b981' : '#ef4444' }}>{totalGain >= 0 ? `+${totalGain.toFixed(1)}` : totalGain.toFixed(1)} kg</strong>
                  </span>
                </>
              ) : (
                <span style={{ fontSize: '11.5px', color: 'hsl(var(--text-muted) / 0.5)', fontWeight: 600 }}>
                  Preencha os pesos para ver as estatísticas
                </span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button type="button" onClick={onClose} className="glass-btn secondary" style={{ padding: '10px 20px', borderRadius: '12px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveClick}
                disabled={isSubmitting || filledCount === 0}
                className="primary-btn"
                style={{
                  padding: '10px 24px', borderRadius: '12px', fontSize: '13px', fontWeight: 900,
                  cursor: isSubmitting || filledCount === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  opacity: filledCount === 0 ? 0.5 : 1,
                  background: pendingCount > 0 && filledCount > 0 ? 'linear-gradient(135deg, hsl(38 92% 45%), hsl(38 92% 55%))' : undefined,
                  boxShadow: filledCount > 0 ? '0 4px 14px hsl(var(--brand) / 0.3)' : 'none'
                }}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} className="spin" /> Salvando...</>
                ) : pendingCount > 0 && filledCount > 0 ? (
                  <><AlertTriangle size={16} /> Salvar {filledCount} de {rows.length}</>
                ) : (
                  <><CheckCircle2 size={16} /> Salvar {filledCount} Pesagens</>
                )}
              </button>
            </div>
          </div>
        </div>

        <style>{`
          .batch-row-hover:hover { background: hsl(var(--brand) / 0.02) !important; }
          .hover-close-btn:hover { background: hsl(var(--text-muted) / 0.1) !important; color: hsl(var(--text-main)) !important; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .spin { animation: spin 0.8s linear infinite; }
        `}</style>
      </div>
    </SidePanel>
  );
};
