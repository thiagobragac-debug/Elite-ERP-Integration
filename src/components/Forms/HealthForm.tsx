import { showValidationAlert } from '../../utils/validationAlert';
import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';
import './HealthForm.css';

import {
  HeartPulse,
  Calendar,
  Search,
  FlaskConical,
  Stethoscope,
  Clock,
  Layers,
  Activity,
  FileText,
  Hash,
  AlertCircle,
  ShieldAlert,
  BellRing,
  UserCheck,
  X,
  Plus,
  Trash2,
  ChevronRight,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { SearchableSelect } from './SearchableSelect';
import { ConsumptionCart } from './ConsumptionCart';
import { useTenant } from '../../contexts/TenantContext';
import { useFarmFilter } from '../../hooks/useFarmFilter';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface HealthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  loading?: boolean;
  actionId?: number;
}

export const HealthForm: React.FC<HealthFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeTenantId } = useTenant();
  const { applyFarmFilter } = useFarmFilter();
  const [activeEtapa, setActiveEtapa] = useState('contexto');
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `health_form_${activeTenantId}`,
    initialState: {
      tipo: 'vacina',
      titulo: '',
      animal_id: '',
      lote_id: '',
      data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0],
      produto: '',
      produto_id: '',
      dose: '',
      via_aplicacao: 'IM',
      local_aplicacao: '',
      carencia_abate_dias: '',
      carencia_leite_dias: '',
      reforco_dias: '',
      veterinario: '',
      aplicador: '',
      temperatura_aplicacao: '',
      data_revisao: '',
      receituario: '',
      observacao: '',
      status: 'REALIZADO',
    },
    isOpen,
    isEditMode: !!initialData,
  });

  const [loading, setLoading] = useState(false);

  const [animals, setAnimals] = useState<any[]>([]);
  const [lots, setLots] = useState<any[]>([]);
  const [animalSearchQuery, setAnimalSearchQuery] = useState('');
  const [loteSearchQuery, setLoteSearchQuery] = useState('');
  const [showAnimalDropdown, setShowAnimalDropdown] = useState(false);
  const [showLoteDropdown, setShowLoteDropdown] = useState(false);
  const [animalSelected, setAnimalSelected] = useState<any>(null);
  const [loteSelected, setLoteSelected] = useState<any>(null);

  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [produtosAplicados, setProdutosAplicados] = useState<any[]>([]);

  // Temporary inputs for adding a product
  const [tempProduct, setTempProduct] = useState<any>(null);
  const [tempProductName, setTempProductName] = useState('');
  const [tempDose, setTempDose] = useState('');
  const [tempVia, setTempVia] = useState('IM');
  const [tempLocal, setTempLocal] = useState('');
  const [tempCarenciaAbate, setTempCarenciaAbate] = useState('');
  const [tempCarenciaLeite, setTempCarenciaLeite] = useState('');

  const animalSearchRef = React.useRef<HTMLDivElement>(null);
  const loteSearchRef = React.useRef<HTMLDivElement>(null);
  const productSearchRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (animalSearchRef.current && !animalSearchRef.current.contains(e.target as Node)) {
        setShowAnimalDropdown(false);
      }
      if (loteSearchRef.current && !loteSearchRef.current.contains(e.target as Node)) {
        setShowLoteDropdown(false);
      }
      if (productSearchRef.current && !productSearchRef.current.contains(e.target as Node)) {
        setShowProductDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchAnimalsAndLots = async () => {
    try {
      if (!activeTenantId) return;

      // 1. Fetch Animals
      const { data: animalData } = await applyFarmFilter(
        supabase
          .from('animais')
          .select('id, brinco, raca, categoria, sexo').eq('tenant_id', activeTenantId)
          .ilike('status', 'ativo')
      );
      if (animalData) setAnimals(animalData);

      // 2. Fetch Lots
      const { data: loteData } = await applyFarmFilter(
        supabase
          .from('lotes')
          .select('id, nome, status').eq('tenant_id', activeTenantId)
          .ilike('status', 'ativo')
      );
      if (loteData) setLots(loteData);

      // 3. Fetch Products from inventory
      const { data: prodData } = await applyFarmFilter(
        supabase
          .from('produtos')
          .select('id, nome, unidade, custo_medio, ean, marca, categoria_id, carencia_abate_dias, carencia_leite_dias').eq('tenant_id', activeTenantId)
          .eq('is_storable', true)
      );
      if (prodData) setAvailableProducts(prodData);
    } catch (err) {
      console.error('Error fetching animals or lots or products:', err);
    }
  };

  React.useEffect(() => {
    if (isOpen && activeTenantId) {
      fetchAnimalsAndLots();
    }
  }, [isOpen, activeTenantId]);

  React.useEffect(() => {
    if (!actionId) {
      return;
    } // Ignore on initial mount / refresh
    setActiveEtapa('contexto');
    setAnimalSelected(null);
    setLoteSelected(null);
    setAnimalSearchQuery('');
    setLoteSearchQuery('');
    setProdutosAplicados([]);
    setTempProductName('');
    setTempDose('');
    setTempVia('IM');
    setTempLocal('');
    setTempCarenciaAbate('');
    setTempCarenciaLeite('');
    setTempProduct(null);

    if (initialData) {
      setFormData({
        tipo: initialData.tipo || 'vacina',
        titulo: initialData.titulo || '',
        animal_id: initialData.animal_id || '',
        lote_id: initialData.lote_id || '',
        data_manejo:
          initialData.data_manejo ||
          new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
        produto: initialData.produto || '',
        produto_id: initialData.produto_id || '',
        dose: initialData.dose || '',
        via_aplicacao: initialData.via_aplicacao || 'IM',
        local_aplicacao: initialData.local_aplicacao || '',
        carencia_abate_dias: initialData.carencia_abate_dias?.toString() || '',
        carencia_leite_dias: initialData.carencia_leite_dias?.toString() || '',
        reforco_dias: initialData.reforco_dias?.toString() || '',
        veterinario: initialData.veterinario || '',
        aplicador: initialData.aplicador || '',
        temperatura_aplicacao: initialData.temperatura_aplicacao || '',
        data_revisao: initialData.data_revisao || '',
        receituario: initialData.receituario || '',
        observacao: initialData.observacao || '',
        status: initialData.status || 'REALIZADO',
      });
      if (initialData.produto) {
        setProdutosAplicados([
          {
            id: Date.now().toString(),
            produto: initialData.produto,
            nome: initialData.produto,
            produto_id: initialData.produto_id || null,
            dose: initialData.dose || '',
            quantidade: initialData.dose
              ? Number(String(initialData.dose).replace(/[^0-9.]/g, ''))
              : '',
            via_aplicacao: initialData.via_aplicacao || 'IM',
            local_aplicacao: initialData.local_aplicacao || '',
            carencia_abate_dias: initialData.carencia_abate_dias || 0,
            carencia_leite_dias: initialData.carencia_leite_dias || 0,
            custo_total: initialData.custo || 0,
          },
        ]);
      }
    } else {
      setFormData({
        tipo: 'vacina',
        titulo: '',
        animal_id: '',
        lote_id: '',
        data_manejo: new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0],
        produto: '',
        produto_id: '',
        dose: '',
        via_aplicacao: 'IM',
        local_aplicacao: '',
        carencia_abate_dias: '',
        carencia_leite_dias: '',
        reforco_dias: '',
        veterinario: '',
        aplicador: '',
        temperatura_aplicacao: '',
        data_revisao: '',
        receituario: '',
        observacao: '',
        status: 'REALIZADO',
      });
    }
  }, [initialData, isOpen, actionId]);

  // Set selected objects when list or formData changes
  React.useEffect(() => {
    if (formData.animal_id && animals.length > 0) {
      const animal = animals.find((a) => a.id === formData.animal_id);
      if (animal) {
        setAnimalSelected(animal);
        setAnimalSearchQuery(animal.brinco);
      }
    } else {
      setAnimalSelected(null);
      setAnimalSearchQuery('');
    }

    if (formData.lote_id && lots.length > 0) {
      const lote = lots.find((l) => l.id === formData.lote_id);
      if (lote) {
        setLoteSelected(lote);
        setLoteSearchQuery(lote.nome);
      }
    } else {
      setLoteSelected(null);
      setLoteSearchQuery('');
    }
  }, [animals, lots, formData.animal_id, formData.lote_id]);

  // Synchronize carencia_dias when multi-product list changes
  React.useEffect(() => {
    if (produtosAplicados.length > 0) {
      const maxCarenciaAbate = Math.max(...produtosAplicados.map((p) => parseInt(p.carencia_abate_dias) || 0));
      const maxCarenciaLeite = Math.max(...produtosAplicados.map((p) => parseInt(p.carencia_leite_dias) || 0));
      setFormData((prev) => ({
        ...prev,
        carencia_abate_dias: maxCarenciaAbate > 0 ? String(maxCarenciaAbate) : '',
        carencia_leite_dias: maxCarenciaLeite > 0 ? String(maxCarenciaLeite) : '',
      }));
    } else {
      setFormData(prev => ({ ...prev, carencia_abate_dias: '', carencia_leite_dias: '' }));
    }
  }, [produtosAplicados]);

  const handleAddProduto = () => {
    if (!tempProduct?.id) {
      showValidationAlert('⚠️ Selecione um produto cadastrado no estoque. Produtos avulsos não são permitidos.');
      return;
    }
    if (!tempDose || Number(String(tempDose).replace(/[^0-9.]/g, '')) <= 0) {
      showValidationAlert('⚠️ Informe a dosagem aplicada.');
      return;
    }
    const custoUnitario = Number(tempProduct?.custo_medio || 0);
    const parsedDose = Number(String(tempDose).replace(/[^0-9.]/g, '')) || 1;
    if (custoUnitario === 0) {
      toast(
        '⚠️  Custo médio do produto é R$0,00. Será atualizado automaticamente quando uma entrada for registrada no estoque.',
        { icon: '⚠️ ', duration: 4000 }
      );
    }
    setProdutosAplicados((prev) => [
      ...prev,
      {
        produto: tempProduct.nome,
        produto_id: tempProduct.id,
        dose: tempDose.trim(),
        via_aplicacao: tempVia,
        local_aplicacao: tempLocal.trim(),
        carencia_abate_dias: tempCarenciaAbate.trim(),
        carencia_leite_dias: tempCarenciaLeite.trim(),
        custo_medio: custoUnitario,
        custo_total: parsedDose * custoUnitario,
      },
    ]);
    // Reset temp inputs
    setTempProductName('');
    setTempDose('');
    setTempVia('IM');
    setTempLocal('');
    setTempCarenciaAbate('');
    setTempCarenciaLeite('');
    setTempProduct(null);
  };

  const handleRemoveProduto = (idx: number) => {
    setProdutosAplicados((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const isAplicacaoDone =
      initialData || formData.tipo === 'cirurgia'
        ? !!formData.produto
        : produtosAplicados.length > 0;

    if (!isAplicacaoDone) {
      showValidationAlert('⚠️  Por favor, adicione ao menos um fármaco ou insumo na etapa de Aplicação.');
      setActiveEtapa('aplicacao');
      return;
    }

    if (!formData.animal_id && !formData.lote_id) {
      showValidationAlert('⚠️ Selecione o animal ou lote alvo no Contexto.');
      setActiveEtapa('contexto');
      return;
    }

    const todayDate = new Date(); todayDate.setHours(0,0,0,0);
    const manejoDate = new Date(formData.data_manejo + 'T00:00:00');
    if (formData.status === 'REALIZADO' && manejoDate > todayDate) {
      toast.error('⚠️ Data futura não permitida para status REALIZADO.');
      setActiveEtapa('contexto');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        produtos: initialData || formData.tipo === 'cirurgia' ? [] : produtosAplicados,
      };
      await onSubmit(payload);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  // --- HEALTH ENGINE ---
  const healthStats = useMemo(() => {
    let bloqueioAbate = null;
    let bloqueioLeite = null;
    let dataReforco = null;

    if (formData.data_manejo) {
      const baseDate = new Date(formData.data_manejo);
      if (!isNaN(baseDate.getTime())) {
        // Regra 1: Carência Abate
        const carenciaAbate = parseInt(formData.carencia_abate_dias);
        if (carenciaAbate > 0) {
          const dAbate = new Date(baseDate);
          dAbate.setDate(dAbate.getDate() + carenciaAbate);
          bloqueioAbate = dAbate.toLocaleDateString('pt-BR');
        }

        // Regra 1.1: Carência Leite
        const carenciaLeite = parseInt(formData.carencia_leite_dias);
        if (carenciaLeite > 0) {
          const dLeite = new Date(baseDate);
          dLeite.setDate(dLeite.getDate() + carenciaLeite);
          bloqueioLeite = dLeite.toLocaleDateString('pt-BR');
        }

        // Regra 2: Reforço Vacinal
        const reforco = parseInt(formData.reforco_dias);
        if (reforco > 0 && formData.tipo === 'vacina') {
          const dReforco = new Date(baseDate);
          dReforco.setDate(dReforco.getDate() + reforco);
          dataReforco = dReforco.toLocaleDateString('pt-BR');
        }
      }
    }
    return { bloqueioAbate, bloqueioLeite, dataReforco };
  }, [formData.data_manejo, formData.carencia_abate_dias, formData.carencia_leite_dias, formData.reforco_dias, formData.tipo]);

  const limitingProductInfo = useMemo(() => {
    if (produtosAplicados.length === 0) return null;
    let maxAbate = -1;
    let maxLeite = -1;
    let limitProductAbate = null;
    let limitProductLeite = null;
    for (const p of produtosAplicados) {
      const pCarenciaAbate = parseInt(p.carencia_abate_dias) || 0;
      if (pCarenciaAbate > maxAbate) {
        maxAbate = pCarenciaAbate;
        limitProductAbate = p;
      }
      const pCarenciaLeite = parseInt(p.carencia_leite_dias) || 0;
      if (pCarenciaLeite > maxLeite) {
        maxLeite = pCarenciaLeite;
        limitProductLeite = p;
      }
    }
    return {
      abate: maxAbate > 0 ? { dias: maxAbate, nome: limitProductAbate?.produto || limitProductAbate?.nome } : null,
      leite: maxLeite > 0 ? { dias: maxLeite, nome: limitProductLeite?.produto || limitProductLeite?.nome } : null,
    };
  }, [produtosAplicados]);

  const handleAnimalChange = (animal: any) => {
    setFormData((prev) => ({ ...prev, animal_id: animal.id, lote_id: '' }));
    setAnimalSelected(animal);
    setLoteSelected(null);
    setLoteSearchQuery('');
  };

  const clearAnimal = () => {
    setFormData((prev) => ({ ...prev, animal_id: '' }));
    setAnimalSelected(null);
    setAnimalSearchQuery('');
  };

  const handleLoteChange = (lote: any) => {
    setFormData((prev) => ({ ...prev, lote_id: lote.id, animal_id: '' }));
    setLoteSelected(lote);
    setAnimalSelected(null);
    setAnimalSearchQuery('');
  };

  const clearLote = () => {
    setFormData((prev) => ({ ...prev, lote_id: '' }));
    setLoteSelected(null);
    setLoteSearchQuery('');
  };

  const filteredAnimals = animals.filter((a) =>
    a.brinco?.toLowerCase().includes(animalSearchQuery.toLowerCase())
  );

  const filteredLots = lots.filter((l) =>
    l.nome?.toLowerCase().includes(loteSearchQuery.toLowerCase())
  );

  const ETAPAS_CONFIG = [
    { id: 'contexto', label: '1. Contexto & Alvos', icon: UserCheck, color: '#3b82f6' },
    { id: 'aplicacao', label: '2. Fármacos / Procedimento', icon: FlaskConical, color: '#f59e0b' },
    { id: 'regras', label: '3. Carência & Alertas', icon: AlertCircle, color: '#10b981' },
  ];

  const isContextoDone = !!formData.titulo.trim() && (!!formData.animal_id || !!formData.lote_id);
  const isAplicacaoDone =
    initialData || formData.tipo === 'cirurgia' ? !!formData.produto : produtosAplicados.length > 0;
  const isRegrasDone = !!formData.status;

  return (
    <SidePanel
      size="xlarge"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Registro Sanitário' : 'Novo Registro Sanitário'}
      subtitle={initialData ? `Editando: ${initialData.titulo || initialData.tipo || 'Registro'} — ${initialData.data_manejo ? new Date(initialData.data_manejo + 'T00:00:00').toLocaleDateString('pt-BR') : ''}` : 'Registre vacinas, medicamentos ou tratamentos.'}
      icon={HeartPulse}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Registro'}
    >
      {/* Dashboard Top */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div
          style={{
            flex: 1,
            minWidth: '250px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <span
              style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: 700,
                color: 'hsl(var(--text-muted))',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              Status Atual
            </span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 900,
                color: formData.status === 'REALIZADO' ? '#10b981' : '#f59e0b',
              }}
            >
              {formData.status === 'REALIZADO' ? 'Realizado' : 'Pendente'}
            </span>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
              Manejo dia {new Date(formData.data_manejo).toLocaleDateString('pt-BR')}
            </div>
          </div>
          <div
            style={{
              background: 'hsl(var(--bg-card))',
              padding: '12px',
              borderRadius: '50%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
            }}
          >
            <Activity size={24} style={{ color: 'hsl(var(--text-main))' }} />
          </div>
        </div>

        {/* Alertas Rápidos no Dashboard */}
        <div
          style={{
            flex: 1,
            minWidth: '200px',
            padding: '16px',
            background: 'hsl(var(--bg-main))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '12px',
          }}
        >
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: 700,
              color: 'hsl(var(--text-muted))',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            Previsões do Protocolo
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {healthStats.bloqueioAbate ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(0 84% 45%)',
                }}
              >
                <ShieldAlert size={14} /> Bloqueado para Abate até: {healthStats.bloqueioAbate}
              </div>
            ) : (
              <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
                Sem carência de abate estipulada.
              </div>
            )}

            {healthStats.dataReforco ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'hsl(217 91% 50%)',
                }}
              >
                <BellRing size={14} /> Revacinar em: {healthStats.dataReforco}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px' }}>
        {/* Left Sidebar - Phase Navigation */}
        <div
          style={{
            width: '220px',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {ETAPAS_CONFIG.map((et) => {
            let isCompleted = false;
            if (et.id === 'contexto') {
              isCompleted = isContextoDone;
            }
            if (et.id === 'aplicacao') {
              isCompleted = isAplicacaoDone;
            }
            if (et.id === 'regras') {
              isCompleted = isRegrasDone;
            }

            const isActive = activeEtapa === et.id;
            const Icon = et.icon;

            return (
              <button
                key={et.id}
                type="button"
                onClick={() => setActiveEtapa(et.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  background: isActive ? `${et.color}15` : 'transparent',
                  color: isActive ? et.color : 'hsl(var(--text-secondary))',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: isActive ? 700 : 500,
                  transition: 'all 0.2s',
                  boxShadow: isActive ? `inset 3px 0 0 ${et.color}` : 'none',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: isCompleted
                      ? et.color
                      : isActive
                        ? `${et.color}30`
                        : 'hsl(var(--bg-main))',
                    color: isCompleted ? '#fff' : isActive ? et.color : 'hsl(var(--text-muted))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isCompleted ? <UserCheck size={16} /> : <Icon size={16} />}
                </div>
                <span style={{ fontSize: '13px', flex: 1 }}>{et.label}</span>
                {isActive && <ChevronRight size={16} opacity={0.5} />}
              </button>
            );
          })}
        </div>

        {/* Right Content - Form Fields */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            background: 'hsl(var(--bg-card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '16px',
            padding: '24px',
          }}
        >
          <div
            style={{
              marginBottom: '24px',
              paddingBottom: '16px',
              borderBottom: '1px solid hsl(var(--border))',
            }}
          >
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '18px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {ETAPAS_CONFIG.find((e) => e.id === activeEtapa)?.label}
            </h3>
            <p style={{ margin: 0, fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
              {activeEtapa === 'contexto' && 'Defina os dados da operação e os animais/lotes alvo.'}
              {activeEtapa === 'aplicacao' &&
                'Especifique os medicamentos, dosagens e via de aplicação.'}
              {activeEtapa === 'regras' &&
                'Configure a carência de abate, retorno ao leite e revacinação.'}
            </p>
          </div>

          {activeEtapa === 'contexto' && (
            <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <FileText size={14} /> Título / Descrição
                </label>
                <input
                  className="tauze-input"
                  type="text"
                  placeholder="Ex: Vacinação contra Aftosa"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                />
              </div>

              <div className="tauze-input-grid grid-col-3">
                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Stethoscope size={14} /> Tipo de Manejo
                  </label>
                  <SearchableSelect
                    value={formData.tipo}
                    onChange={(val: any) => setFormData({ ...formData, tipo: val })}
                    options={[
                      { value: `vacina`, label: `Vacina` },
                      { value: `medicamento`, label: `Medicamento / Vermífugo` },
                      { value: `cirurgia`, label: `Cirurgia / Procedimento` },
                    ]}
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Clock size={14} /> Data do Manejo
                  </label>
                  <input
                    className="tauze-input"
                    type="date"
                    value={formData.data_manejo}
                    onChange={(e) => setFormData({ ...formData, data_manejo: e.target.value })}
                    required
                  />
                </div>

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Activity size={14} /> Status
                  </label>
                  <SearchableSelect
                    value={formData.status}
                    onChange={(val: any) => setFormData({ ...formData, status: val })}
                    options={[
                      { value: `REALIZADO`, label: `Realizado` },
                      { value: `PENDENTE`, label: `Pendente` },
                    ]}
                  />
                </div>
              </div>

              <div className="tauze-input-grid grid-col-2">

                {/* Animal Selection Autocomplete */}
                <div className="tauze-field-group" style={{ position: 'relative' }}>
                  <label
                    className="tauze-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Search size={14} /> Animal (Foco Individual)
                  </label>

                  {animalSelected ? (
                    /* CHIP */
                    <div
                      className="animal-chip animate-fade-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'hsl(var(--brand) / 0.08)',
                        border: '1.5px solid hsl(var(--brand) / 0.3)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        cursor: 'default',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'hsl(var(--brand))',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {animalSelected.brinco?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '13px',
                            color: 'hsl(var(--text-main))',
                          }}
                        >
                          #{animalSelected.brinco}
                        </div>
                        {animalSelected.raca && (
                          <div
                            style={{
                              fontSize: '10px',
                              color: 'hsl(var(--text-muted))',
                              fontWeight: 600,
                            }}
                          >
                            {animalSelected.raca}
                            {animalSelected.categoria ? ` · ${animalSelected.categoria}` : ''}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={clearAnimal}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--text-muted))',
                          padding: '2px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        title="Remover animal"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* SEARCH INPUT */
                    <div
                      className="autocomplete-wrapper"
                      style={{ position: 'relative', width: '100%' }}
                      ref={animalSearchRef}
                    >
                      <div
                        className="search-input-container"
                        style={{ position: 'relative', width: '100%' }}
                      >
                        <input
                          className="tauze-input"
                          type="text"
                          placeholder={
                            formData.lote_id
                              ? 'Bloqueado (Lote selecionado)'
                              : 'Digite para filtrar pelo brinco...'
                          }
                          value={animalSearchQuery}
                          onChange={(e) => {
                            setAnimalSearchQuery(e.target.value);
                            setShowAnimalDropdown(true);
                          }}
                          onFocus={() => !formData.lote_id && setShowAnimalDropdown(true)}
                          disabled={!!formData.lote_id}
                          style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                          autoComplete="off"
                        />
                        <Search
                          size={16}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'hsl(var(--text-muted))',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {showAnimalDropdown && !formData.lote_id && (
                        <div
                          className="autocomplete-dropdown animate-fade-in"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            width: '100%',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            background: 'hsl(var(--bg-card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '14px',
                            zIndex: 999,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {filteredAnimals.length === 0 ? (
                            <div
                              style={{
                                padding: '16px',
                                color: 'hsl(var(--text-muted))',
                                fontSize: '13px',
                                fontWeight: 600,
                                textAlign: 'center',
                              }}
                            >
                              Nenhum animal ativo encontrado
                            </div>
                          ) : (
                            filteredAnimals.map((a: any, idx: number) => (
                              <div
                                key={a.id}
                                onClick={() => {
                                  setAnimalSearchQuery(a.brinco);
                                  handleAnimalChange(a);
                                  setShowAnimalDropdown(false);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    idx < filteredAnimals.length - 1
                                      ? '1px solid hsl(var(--border) / 0.5)'
                                      : 'none',
                                  transition: 'background 0.15s',
                                }}
                                className="autocomplete-option"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: 'hsl(var(--brand) / 0.1)',
                                      color: 'hsl(var(--brand))',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 900,
                                    }}
                                  >
                                    #{a.brinco?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        color: 'hsl(var(--text-main))',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                      }}
                                    >
                                      #{a.brinco}
                                      {a.sexo && (
                                        <span
                                          style={{
                                            fontSize: '9px',
                                            fontWeight: 800,
                                            background:
                                              a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                                ? 'hsl(217 91% 60% / 0.12)'
                                                : 'hsl(316 73% 69% / 0.12)',
                                            color:
                                              a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                                ? 'hsl(217 91% 60%)'
                                                : 'hsl(316 73% 60%)',
                                            padding: '1px 5px',
                                            borderRadius: '4px',
                                          }}
                                        >
                                          {a.sexo === 'M' || a.sexo === 'MACHO' || a.sexo === 'm'
                                            ? '♂ Macho'
                                            : '♀ Fêmea'}
                                        </span>
                                      )}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: 'hsl(var(--text-muted))',
                                        marginTop: '2px',
                                      }}
                                    >
                                      {a.raca || 'Nelore'}
                                      {a.categoria ? ` · ${a.categoria}` : ''}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lote Selection Autocomplete */}
                <div className="tauze-field-group" style={{ position: 'relative' }}>
                  <label
                    className="tauze-label"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Layers size={14} /> Lote (Foco Coletivo)
                  </label>

                  {loteSelected ? (
                    /* CHIP */
                    <div
                      className="animal-chip animate-fade-in"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'hsl(var(--brand) / 0.08)',
                        border: '1.5px solid hsl(var(--brand) / 0.3)',
                        borderRadius: '12px',
                        padding: '10px 14px',
                        cursor: 'default',
                      }}
                    >
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'hsl(var(--brand))',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '11px',
                          fontWeight: 900,
                          flexShrink: 0,
                        }}
                      >
                        {loteSelected.nome?.slice(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 800,
                            fontSize: '13px',
                            color: 'hsl(var(--text-main))',
                          }}
                        >
                          {loteSelected.nome}
                        </div>
                        <div
                          style={{
                            fontSize: '10px',
                            color: 'hsl(var(--text-muted))',
                            fontWeight: 600,
                          }}
                        >
                          Lote Ativo
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearLote}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'hsl(var(--text-muted))',
                          padding: '2px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                        title="Remover lote"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    /* SEARCH INPUT */
                    <div
                      className="autocomplete-wrapper"
                      style={{ position: 'relative', width: '100%' }}
                      ref={loteSearchRef}
                    >
                      <div
                        className="search-input-container"
                        style={{ position: 'relative', width: '100%' }}
                      >
                        <input
                          className="tauze-input"
                          type="text"
                          placeholder={
                            formData.animal_id
                              ? 'Bloqueado (Animal selecionado)'
                              : 'Digite para filtrar pelo lote...'
                          }
                          value={loteSearchQuery}
                          onChange={(e) => {
                            setLoteSearchQuery(e.target.value);
                            setShowLoteDropdown(true);
                          }}
                          onFocus={() => !formData.animal_id && setShowLoteDropdown(true)}
                          disabled={!!formData.animal_id}
                          style={{ paddingRight: '36px', width: '100%', boxSizing: 'border-box' }}
                          autoComplete="off"
                        />
                        <Search
                          size={16}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'hsl(var(--text-muted))',
                            pointerEvents: 'none',
                          }}
                        />
                      </div>

                      {showLoteDropdown && !formData.animal_id && (
                        <div
                          className="autocomplete-dropdown animate-fade-in"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            width: '100%',
                            maxHeight: '220px',
                            overflowY: 'auto',
                            background: 'hsl(var(--bg-card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '14px',
                            zIndex: 999,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {filteredLots.length === 0 ? (
                            <div
                              style={{
                                padding: '16px',
                                color: 'hsl(var(--text-muted))',
                                fontSize: '13px',
                                fontWeight: 600,
                                textAlign: 'center',
                              }}
                            >
                              Nenhum lote ativo encontrado
                            </div>
                          ) : (
                            filteredLots.map((l: any, idx: number) => (
                              <div
                                key={l.id}
                                onClick={() => {
                                  setLoteSearchQuery(l.nome);
                                  handleLoteChange(l);
                                  setShowLoteDropdown(false);
                                }}
                                style={{
                                  padding: '12px 16px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  borderBottom:
                                    idx < filteredLots.length - 1
                                      ? '1px solid hsl(var(--border) / 0.5)'
                                      : 'none',
                                  transition: 'background 0.15s',
                                }}
                                className="autocomplete-option"
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div
                                    style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: 'hsl(var(--brand) / 0.1)',
                                      color: 'hsl(var(--brand))',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '11px',
                                      fontWeight: 900,
                                    }}
                                  >
                                    #{l.nome?.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        color: 'hsl(var(--text-main))',
                                      }}
                                    >
                                      {l.nome}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: '11px',
                                        color: 'hsl(var(--text-muted))',
                                        marginTop: '2px',
                                      }}
                                    >
                                      Status: {l.status}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeEtapa === 'aplicacao' && (
            <div className="animate-slide-up">
              {formData.tipo === 'cirurgia' ? (
                /* ── CIRURGIA: campos do procedimento + carrinho de insumos cirúrgicos ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {/* Descrição e responsável */}
                  <div className="tauze-input-grid grid-col-3">
                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <FlaskConical size={14} /> Descrição do Procedimento
                      </label>
                      <input
                        className="tauze-input"
                        type="text"
                        placeholder="Ex: Castração Inguinal"
                        value={formData.produto}
                        onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                      />
                    </div>

                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <UserCheck size={14} /> Veterinário Responsável
                      </label>
                      <input
                        className="tauze-input"
                        type="text"
                        placeholder="Nome do Médico Veterinário"
                        value={formData.veterinario}
                        onChange={(e) => setFormData({ ...formData, veterinario: e.target.value })}
                      />
                    </div>

                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <UserCheck size={14} /> Auxiliar / Aplicador
                      </label>
                      <input
                        className="tauze-input"
                        type="text"
                        placeholder="Ex: Técnico de campo"
                        value={formData.aplicador}
                        onChange={(e) => setFormData({ ...formData, aplicador: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Carrinho de insumos do procedimento */}
                  <ConsumptionCart
                    items={produtosAplicados}
                    onChange={setProdutosAplicados}
                    title="Insumos do Procedimento"
                    subtitle="Anestésicos, material de sutura, antissépticos e outros insumos consumidos na cirurgia."
                    showHealthFields={true}
                    filterModule="bovinocultura_sanidade"
                  />
                </div>
              ) : initialData ? (
                /* ── EDIÇÃOO de registro existente (produto único legado) ── */
                <div className="tauze-input-grid grid-col-2">
                  <div
                    className="tauze-field-group"
                    style={{ gridColumn: 'span 1' }}
                    ref={productSearchRef}
                  >
                    <label className="tauze-label">
                      <FlaskConical size={14} /> Fármaco / Insumo (Estoque)
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        className="tauze-input"
                        type="text"
                        placeholder="Buscar no estoque..."
                        value={formData.produto}
                        onChange={(e) => {
                          setFormData({ ...formData, produto: e.target.value, produto_id: '' });
                          setShowProductDropdown(true);
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        style={{
                          borderColor:
                            formData.produto && !formData.produto_id ? '#f59e0b' : undefined,
                        }}
                      />
                      {formData.produto_id && (
                        <div
                          style={{
                            position: 'absolute',
                            right: '8px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            background: '#10b981',
                            color: '#fff',
                            borderRadius: '6px',
                            padding: '2px 8px',
                            fontSize: '10px',
                            fontWeight: 800,
                          }}
                        >
                          {`R$${Number(availableProducts.find((p) => p.id === formData.produto_id)?.custo_medio || 0).toFixed(2)}/un`}
                        </div>
                      )}
                      {showProductDropdown && (
                        <div
                          className="autocomplete-dropdown animate-fade-in"
                          style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            width: '100%',
                            maxHeight: '200px',
                            overflowY: 'auto',
                            background: 'hsl(var(--bg-card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '14px',
                            zIndex: 999,
                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {availableProducts.filter((p) =>
                            p.nome?.toLowerCase().includes((formData.produto || '').toLowerCase())
                          ).length === 0 ? (
                            <div
                              style={{
                                padding: '12px',
                                color: '#f87171',
                                fontSize: '12.5px',
                                textAlign: 'center',
                                fontWeight: 700,
                              }}
                            >
                              ⚠️ Produto não encontrado no estoque. Cadastre-o em Insumos.
                            </div>
                          ) : (
                            availableProducts
                              .filter((p) =>
                                p.nome
                                  ?.toLowerCase()
                                  .includes((formData.produto || '').toLowerCase())
                              )
                              .map((p: any) => (
                                <div
                                  key={p.id}
                                  onClick={() => {
                                    setFormData((prev) => ({
                                      ...prev,
                                      produto: p.nome,
                                      produto_id: p.id,
                                    }));
                                    setShowProductDropdown(false);
                                  }}
                                  className="autocomplete-option"
                                  style={{
                                    padding: '10px 16px',
                                    cursor: 'pointer',
                                    borderBottom: '1px solid hsl(var(--border) / 0.5)',
                                    transition: 'background 0.15s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                  }}
                                >
                                  <div>
                                    <div
                                      style={{
                                        fontWeight: 800,
                                        fontSize: '13px',
                                        color: 'hsl(var(--text-main))',
                                      }}
                                    >
                                      {p.nome}
                                    </div>
                                    {p.marca && (
                                      <div
                                        style={{
                                          fontSize: '10px',
                                          color: 'hsl(var(--text-muted))',
                                          marginTop: '2px',
                                          fontWeight: 600,
                                        }}
                                      >
                                        Marca: {p.marca}
                                      </div>
                                    )}
                                  </div>
                                  <div
                                    style={{
                                      textAlign: 'right',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      color: '#10b981',
                                      flexShrink: 0,
                                      marginLeft: '8px',
                                    }}
                                  >
                                    {`R$${Number(p.custo_medio || 0).toFixed(2)}/un`}
                                  </div>
                                </div>
                              ))
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Hash size={14} /> Dose / Quantidade
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: 2ml"
                      value={formData.dose}
                      onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Activity size={14} /> Via de Aplicação
                    </label>
                    <SearchableSelect
                      value={formData.via_aplicacao}
                      onChange={(val: any) => setFormData({ ...formData, via_aplicacao: val })}
                      options={[
                        { value: `IM`, label: `Intramuscular (IM)` },
                        { value: `SC`, label: `Subcutânea (SC)` },
                        { value: `ORAL`, label: `Oral` },
                        { value: `TOPICO`, label: `Tópico` },
                        { value: `IV`, label: `Intravenosa (IV)` },
                      ]}
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Hash size={14} /> Local de Aplicação
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Ex: Tábua do Pescoço, Garupa..."
                      value={formData.local_aplicacao}
                      onChange={(e) =>
                        setFormData({ ...formData, local_aplicacao: e.target.value })
                      }
                    />
                  </div>

                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <UserCheck size={14} /> Aplicador / Responsável
                    </label>
                    <input
                      className="tauze-input"
                      type="text"
                      placeholder="Quem aplicou?"
                      value={formData.aplicador}
                      onChange={(e) => setFormData({ ...formData, aplicador: e.target.value })}
                    />
                  </div>
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <Activity size={14} /> Temp. Aplicação (°C)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      placeholder="Ex: 38.5"
                      value={formData.temperatura_aplicacao}
                      onChange={(e) => setFormData({ ...formData, temperatura_aplicacao: e.target.value })}
                    />
                  </div>
                </div>
              ) : (
                /* ── NOVO REGISTRO: ConsumptionCart multi-produto ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <ConsumptionCart
                    items={produtosAplicados}
                    onChange={setProdutosAplicados}
                    title="Fármacos / Insumos"
                    subtitle="Informe os medicamentos ou vacinas aplicados, com baixa automática de estoque."
                    showHealthFields={true}
                    filterModule="bovinocultura_sanidade"
                  />
                </div>
              )}
            </div>
          )}
          {activeEtapa === 'regras' && (
            <div className="animate-slide-up">
              <div className="tauze-input-grid grid-col-3">
                {formData.tipo === 'vacina' && (
                  <div className="tauze-field-group">
                    <label className="tauze-label">
                      <BellRing size={14} /> Reforço Agendado (Dias)
                    </label>
                    <input
                      className="tauze-input"
                      type="number"
                      placeholder="Ex: 21 (Opcional)"
                      value={formData.reforco_dias}
                      onChange={(e) => setFormData({ ...formData, reforco_dias: e.target.value })}
                    />
                  </div>
                )}

                {formData.tipo !== 'cirurgia' && (
                  <>
                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <AlertCircle size={14} /> Carência Abate (Dias)
                      </label>
                      <input
                        className="tauze-input"
                        type="number"
                        placeholder="Ex: 30"
                        value={formData.carencia_abate_dias}
                        onChange={(e) => setFormData({ ...formData, carencia_abate_dias: e.target.value })}
                      />
                      {limitingProductInfo?.abate && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--text-muted))',
                            marginTop: '4px',
                            display: 'block',
                          }}
                        >
                          Maior carência do lote:{' '}
                          <strong style={{ color: 'hsl(var(--brand))' }}>{limitingProductInfo.abate.dias} dias</strong>{' '}
                          (<strong>{limitingProductInfo.abate.nome}</strong>)
                        </span>
                      )}
                    </div>

                    <div className="tauze-field-group">
                      <label className="tauze-label">
                        <AlertCircle size={14} /> Carência Leite (Dias)
                      </label>
                      <input
                        className="tauze-input"
                        type="number"
                        placeholder="Ex: 5"
                        value={formData.carencia_leite_dias}
                        onChange={(e) => setFormData({ ...formData, carencia_leite_dias: e.target.value })}
                      />
                      {limitingProductInfo?.leite && (
                        <span
                          style={{
                            fontSize: '11px',
                            color: 'hsl(var(--text-muted))',
                            marginTop: '4px',
                            display: 'block',
                          }}
                        >
                          Maior carência do lote:{' '}
                          <strong style={{ color: 'hsl(var(--brand))' }}>{limitingProductInfo.leite.dias} dias</strong>{' '}
                          (<strong>{limitingProductInfo.leite.nome}</strong>)
                        </span>
                      )}
                    </div>
                  </>
                )}

                <div className="tauze-field-group">
                  <label className="tauze-label">
                    <Calendar size={14} /> Data de Revisão
                  </label>
                  <input
                    className="tauze-input"
                    type="date"
                    value={formData.data_revisao}
                    onChange={(e) => setFormData({ ...formData, data_revisao: e.target.value })}
                  />
                </div>

                <div className="tauze-field-group" style={{ gridColumn: 'span 2' }}>
                  <label className="tauze-label">
                    <FileText size={14} /> Nº Receituário Agronômico / Veterinário
                  </label>
                  <input
                    className="tauze-input"
                    type="text"
                    placeholder="Ex: REC-12345"
                    value={formData.receituario}
                    onChange={(e) => setFormData({ ...formData, receituario: e.target.value })}
                  />
                </div>


                <div className="tauze-field-group" style={{ gridColumn: 'span 3' }}>
                  <label className="tauze-label">
                    <FileText size={14} /> Observações
                  </label>
                  <textarea
                    className="tauze-input tauze-textarea"
                    placeholder="Notas adicionais..."
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    rows={2}
                  />
                </div>

                {/* PAINÉIS ORÃCULOS DE SANIDADE (RISCO E PREDIÇÃOO) */}
                {healthStats.bloqueioAbate && (
                  <div
                    style={{
                      gridColumn: 'span 3',
                      marginTop: '12px',
                      padding: '16px',
                      background: 'hsl(0 84% 60% / 0.1)',
                      border: '1.5px dashed hsl(0 84% 60% / 0.4)',
                      borderRadius: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'hsl(0 84% 45%)',
                        fontWeight: 800,
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <ShieldAlert size={18} /> BLOQUEIO PARA ABATE
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--text-main))',
                        lineHeight: '1.5',
                        marginTop: '8px',
                      }}
                    >
                      Respeitando a carência farmacológica informada, a liberação sanitária oficial para abate só ocorrerá no dia{' '}
                      <strong style={{ color: 'hsl(0 84% 45%)', fontWeight: 900 }}>
                        {healthStats.bloqueioAbate}
                      </strong>
                      .
                    </div>
                  </div>
                )}

                {healthStats.bloqueioLeite && (
                  <div
                    style={{
                      gridColumn: 'span 3',
                      marginTop: '12px',
                      padding: '16px',
                      background: 'hsl(32 98% 60% / 0.1)',
                      border: '1.5px dashed hsl(32 98% 60% / 0.4)',
                      borderRadius: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'hsl(32 98% 45%)',
                        fontWeight: 800,
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <ShieldAlert size={18} /> BLOQUEIO PARA LEITE (DESCARTE)
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--text-main))',
                        lineHeight: '1.5',
                        marginTop: '8px',
                      }}
                    >
                      O descarte do leite está determinado até o dia{' '}
                      <strong style={{ color: 'hsl(32 98% 45%)', fontWeight: 900 }}>
                        {healthStats.bloqueioLeite}
                      </strong>
                      . Após esta data, o leite estará apto para ordenha e consumo.
                    </div>
                  </div>
                )}

                {healthStats.dataReforco && (
                  <div
                    style={{
                      gridColumn: 'span 3',
                      marginTop: '12px',
                      padding: '16px',
                      background: 'hsl(217 91% 60% / 0.1)',
                      border: '1.5px dashed hsl(217 91% 60% / 0.4)',
                      borderRadius: '12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'hsl(217 91% 50%)',
                        fontWeight: 800,
                        fontSize: '13px',
                        marginBottom: '4px',
                      }}
                    >
                      <Calendar size={18} /> REFORÇO VACINAL AGENDADO
                    </div>
                    <div
                      style={{
                        fontSize: '13px',
                        color: 'hsl(var(--text-main))',
                        lineHeight: '1.5',
                        marginTop: '8px',
                      }}
                    >
                      Uma revacinação será cobrada na agenda sanitária da fazenda para o dia{' '}
                      <strong style={{ color: 'hsl(217 91% 50%)', fontWeight: 900 }}>
                        {healthStats.dataReforco}
                      </strong>
                      .
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </SidePanel>
  );
};
