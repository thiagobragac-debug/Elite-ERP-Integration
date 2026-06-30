import React, { useState, useEffect, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';
import { usePermissions } from '../../hooks/usePermissions';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  Truck,
  Calendar,
  Layers,
  Settings,
  Hash,
  Activity,
  Tag,
  DollarSign,
  Gauge,
  Clock,
  FileText,
  Wifi,
  Lock,
  MapPin,
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { DateInput } from '../../components/Form/DateInput';
import { showValidationAlert } from '../../utils/validationAlert';

// ─── Section Badge ───────────────────────────────────────────────────────────
const SectionBadge = ({
  step,
  label,
  complete,
}: {
  step: string;
  label: string;
  complete: boolean;
}) => (
  <div className="tauze-section-header">
    <div
      className="tauze-section-badge"
      style={
        complete
          ? { background: 'rgba(16,185,129,0.15)', color: '#10b981', transition: 'all 0.3s' }
          : { transition: 'all 0.3s' }
      }
    >
      {complete ? '✓' : step}
    </div>
    <h4 className="tauze-section-title">{label}</h4>
  </div>
);

// ─── Validation Schema ────────────────────────────────────────────────────────
const getMachineSchema = (unidadeMedida: string) => {
  const currentYear = new Date().getFullYear();
  return z.object({
    nome: z.string().min(1, 'O Nome do Ativo é obrigatório.'),
    marca: z.string().min(1, 'A Marca é obrigatória.'),
    modelo: z.string().min(1, 'O Modelo é obrigatório.'),
    categoria: z.string().min(1, 'A Categoria é obrigatória.'),
    unidade_id: z.string().min(1, 'O Centro de Custo é obrigatório.'),
    ano_fabricacao: z.coerce.number()
      .min(1950, 'Ano de fabricação irreal.')
      .max(currentYear + 1, 'Ano de fabricação não pode ser maior que o próximo ano.')
      .optional()
      .or(z.literal('')),
    ano_modelo: z.coerce.number()
      .min(1950, 'Ano do modelo irreal.')
      .max(currentYear + 2, 'Ano do modelo inválido.')
      .optional()
      .or(z.literal('')),
    horimetro_inicial: unidadeMedida === 'horas'
      ? z.coerce.number().min(0, 'O horímetro inicial não pode ser negativo.')
      : z.any().optional(),
    quilometragem_inicial: unidadeMedida === 'km'
      ? z.coerce.number().min(0, 'A quilometragem inicial não pode ser negativa.')
      : z.any().optional(),
    placa: unidadeMedida === 'km' 
      ? z.string().min(7, 'Placa é obrigatória para veículos de rua.')
      : z.string().optional(),
    chassi: unidadeMedida === 'horas'
      ? z.string().min(3, 'Chassi/Série é altamente recomendado para maquinário (mín 3 caracteres).')
      : z.string().optional(),
    status: z.enum(['active', 'maintenance', 'broken', 'inactive', 'reforming']),
    propriedade: z.string().min(1, 'A Propriedade é obrigatória.')
  });
};

interface MachineFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const MachineForm: React.FC<MachineFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { activeTenantId } = useTenant();
  const { can } = usePermissions();

  const INITIAL_MACHINE_FORM = {
    nome: '',
    patrimonio: '',
    marca: '',
    modelo: '',
    categoria: '',
    horimetro_inicial: '0',
    quilometragem_inicial: '0',
    placa: '',
    ano_fabricacao: new Date().getFullYear().toString(),
    ano_modelo: new Date().getFullYear().toString(),
    status: 'active',
    chassi: '',
    combustivel: 'Diesel',
    capacidade_tanque: '',
    valor_compra: '',
    potencia: '',
    peso_operacional: '',
    intervalo_revisao: '250',
    consumo_estimado: '',
    data_proxima_revisao: '',
    observacoes: '',
    unidade_medida: 'horas',
    propriedade: 'Próprio',
    telemetry_id: '',
    telemetry_provider: 'Nenhum',
  };

  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `machine_form_${activeTenantId}`,
    initialState: INITIAL_MACHINE_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [farms, setFarms] = useState<any[]>([]);
  const [marcasOptions, setMarcasOptions] = useState<{value: string, label: string}[]>([]);
  const [modelosOptions, setModelosOptions] = useState<{value: string, label: string}[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    if (activeTenantId) {
      fetchCategories();
    }
  }, [isOpen, activeTenantId, actionId]);

  const fetchCategories = async () => {
    if (!activeTenantId) return;
    const [catRes, farmsRes, machinesRes] = await Promise.all([
      supabase
        .from('categorias_sistema')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .eq('modulo', 'frota')
        .eq('is_active', true)
        .order('nome'),
      supabase
        .from('unidades_produtivas')
        .select('id, nome')
        .eq('tenant_id', activeTenantId)
        .order('nome'),
      supabase
        .from('maquinas')
        .select('marca, modelo')
        .eq('tenant_id', activeTenantId),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (farmsRes.data) setFarms(farmsRes.data);
    
    if (machinesRes.data) {
      const uniqueMarcas = Array.from(new Set(machinesRes.data.map(m => m.marca).filter(Boolean)));
      const uniqueModelos = Array.from(new Set(machinesRes.data.map(m => m.modelo).filter(Boolean)));
      setMarcasOptions(uniqueMarcas.map(m => ({ value: m as string, label: m as string })));
      setModelosOptions(uniqueModelos.map(m => ({ value: m as string, label: m as string })));
    }
  };

  const handleCategoriaChange = async (val: string) => {
    setFormData({ ...formData, categoria: val });
    if (val && !categories.find((c) => String(c.nome) === val)) {
      try {
        await supabase.from('categorias_sistema').insert({
          tenant_id: activeTenantId,
          modulo: 'frota',
          nome: val,
          is_active: true,
        });
        toast.success(`Categoria "${val}" criada com sucesso.`);
        fetchCategories();
      } catch (err) {
        console.error('[MachineForm] Erro ao criar categoria:', err);
        toast.error('Erro ao salvar nova categoria.');
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    
    if (initialData) {
      setFormData({
        nome: initialData.nome || '',
        patrimonio: initialData.patrimonio || '',
        marca: initialData.marca || '',
        modelo: initialData.modelo || '',
        categoria: initialData.categoria || '',
        horimetro_inicial: initialData.horimetro_atual?.toString() || '0',
        quilometragem_inicial: initialData.quilometragem_atual?.toString() || '0',
        placa: initialData.placa || '',
        ano_fabricacao: initialData.ano?.toString() || new Date().getFullYear().toString(),
        ano_modelo: initialData.ano_modelo?.toString() || new Date().getFullYear().toString(),
        status: initialData.status || 'active',
        chassi: initialData.chassi || '',
        combustivel: initialData.combustivel || 'Diesel',
        capacidade_tanque: initialData.capacidade_tanque?.toString() || '',
        valor_compra: initialData.valor_compra?.toString() || '',
        potencia: initialData.potencia?.toString() || '',
        peso_operacional: initialData.peso_operacional?.toString() || '',
        intervalo_revisao: initialData.intervalo_revisao?.toString() || '250',
        consumo_estimado: initialData.consumo_estimado?.toString() || '',
        data_proxima_revisao: initialData.data_proxima_revisao || '',
        unidade_medida: initialData.unidade_medida || 'horas',
        unidade_id: initialData.unidade_id || '',
        propriedade: initialData.propriedade || 'Próprio',
        telemetry_id: initialData.telemetry_id || '',
        telemetry_provider: initialData.telemetry_provider || 'Nenhum',
      });
    }
  }, [initialData, isOpen, actionId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const schema = getMachineSchema(formData.unidade_medida);
    const parsed = schema.safeParse(formData);

    if (!parsed.success) {
      const issues = parsed.error?.issues || (parsed.error as any)?.errors;
      if (issues && issues.length > 0) {
        toast.error(
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>Verifique os campos obrigatórios:</strong>
            <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', lineHeight: '1.4' }}>
              {issues.map((err: any, idx: number) => (
                <li key={idx}>{err.message}</li>
              ))}
            </ul>
          </div>,
          { duration: 6000 }
        );
      } else {
        showValidationAlert('Preencha todos os campos obrigatórios.');
      }
      return;
    }

    setLoading(true);
    try {
      const sanitizedData = {
        ...formData,
        peso_operacional: formData.peso_operacional ? Number(formData.peso_operacional) : null,
        capacidade_tanque: formData.capacidade_tanque ? Number(formData.capacidade_tanque) : null,
        valor_compra: formData.valor_compra ? Number(formData.valor_compra) : null,
        consumo_estimado: formData.consumo_estimado ? Number(formData.consumo_estimado) : null,
        intervalo_revisao: formData.intervalo_revisao ? Number(formData.intervalo_revisao) : null,
        horimetro_inicial: formData.horimetro_inicial ? Number(formData.horimetro_inicial) : 0,
        quilometragem_inicial: formData.quilometragem_inicial ? Number(formData.quilometragem_inicial) : 0,
        potencia: formData.potencia ? Number(formData.potencia) : null,
      };
      await onSubmit(sanitizedData);
      clearDraft();
    } finally {
      setLoading(false);
    }
  };

  const sectionProgress = useMemo(() => {
    return {
      s1: !!(formData.nome.trim() && formData.marca.trim() && formData.modelo.trim() && formData.categoria),
      s2: !!(formData.unidade_id && formData.combustivel),
      s3: !!(formData.valor_compra || formData.intervalo_revisao || formData.data_proxima_revisao),
      s4: !!(formData.telemetry_id || formData.telemetry_provider !== 'Nenhum'),
      s5: !!(formData.observacoes)
    };
  }, [formData]);

  const reqIndicator = <span style={{ color: '#ef4444', marginLeft: '2px' }}>*</span>;

  return (
    <SidePanel
      size="large"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Máquina' : 'Nova Máquina / Veículo'}
      subtitle="Cadastre um novo ativo na sua frota."
      icon={Truck}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Ativo'}
      hideSubmit={!can('frota', 'write')}
    >
      {/* ══════════════════════════════════════════════════════════════════
          1 — IDENTIFICAÇÃO PRINCIPAL
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 01" label="Identificação Principal" complete={sectionProgress.s1} />
        
        {/* Linha 1 */}
        <div className="tauze-input-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr 1.2fr', gap: '16px', alignItems: 'flex-end', marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Patrimônio / Frota
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="TR-01"
              value={formData.patrimonio}
              onChange={(e) => setFormData({ ...formData, patrimonio: e.target.value })}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Truck size={14} /> Nome do Ativo {reqIndicator}
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: Trator John Deere 7J..."
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value.toUpperCase() })}
              required
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Settings size={14} /> Categoria {reqIndicator}
            </label>
            <SearchableSelect
              value={formData.categoria}
              onChange={handleCategoriaChange}
              options={[
                { value: '', label: 'Selecionar...' },
                ...(categories || []).map((cat) => ({
                  value: String(cat.nome),
                  label: String(cat.nome),
                })),
              ]}
              creatable={true}
            />
          </div>
        </div>

        {/* Linha 2 */}
        <div className="tauze-input-grid grid-col-3" style={{ alignItems: 'flex-end', marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Tag size={14} /> Marca {reqIndicator}
            </label>
            <SearchableSelect
              value={formData.marca}
              onChange={(val: any) => setFormData({ ...formData, marca: val })}
              options={marcasOptions}
              creatable={true}
              placeholder="Selecionar ou digitar..."
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Layers size={14} /> Modelo {reqIndicator}
            </label>
            <SearchableSelect
              value={formData.modelo}
              onChange={(val: any) => setFormData({ ...formData, modelo: val })}
              options={modelosOptions}
              creatable={true}
              placeholder="Selecionar ou digitar..."
            />
          </div>
          <div className="tauze-field-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label className="tauze-label" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                <Calendar size={12} /> Ano Fab.
              </label>
              <input
                className="tauze-input"
                type="number"
                placeholder="Ex: 2024"
                value={formData.ano_fabricacao}
                onChange={(e) => setFormData({ ...formData, ano_fabricacao: e.target.value })}
              />
            </div>
            <div>
              <label className="tauze-label" style={{ fontSize: '11px', whiteSpace: 'nowrap' }}>
                <Calendar size={12} /> Ano Mod.
              </label>
              <input
                className="tauze-input"
                type="number"
                placeholder="Ex: 2025"
                value={formData.ano_modelo}
                onChange={(e) => setFormData({ ...formData, ano_modelo: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Linha 3 (Condicional de Placa vs Chassi) */}
        <div className="tauze-input-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ fontWeight: formData.unidade_medida === 'km' ? 800 : 600 }}>
              <Hash size={14} /> Placa / Registro {formData.unidade_medida === 'km' && reqIndicator}
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="ABC-1234 ou ABC1D23"
              value={formData.placa}
              maxLength={8}
              onChange={(e) => {
                let val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                if (val.length > 3) {
                  val = val.substring(0, 3) + '-' + val.substring(3, 7);
                }
                setFormData({ ...formData, placa: val });
              }}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label" style={{ fontWeight: formData.unidade_medida === 'horas' ? 800 : 600 }}>
              <Hash size={14} /> Chassi / Série {formData.unidade_medida === 'horas' && reqIndicator}
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Número de série..."
              value={formData.chassi}
              onChange={(e) => setFormData({ ...formData, chassi: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          2 — OPERAÇÃO E CONTROLE
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 02" label="Operação e Controle" complete={sectionProgress.s2} />
        
        {/* Linha 1 */}
        <div className="tauze-input-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <MapPin size={14} /> Centro de Custo (Fazenda)
            </label>
            <SearchableSelect
              value={formData.unidade_id}
              onChange={(val: any) => setFormData({ ...formData, unidade_id: val })}
              options={[
                { value: '', label: 'Selecionar...' },
                ...(farms || []).map((f) => ({ value: String(f.id), label: String(f.nome) })),
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Settings size={14} /> Combustível
            </label>
            <SearchableSelect
              value={formData.combustivel}
              onChange={(val: any) => setFormData({ ...formData, combustivel: val })}
              options={[
                { value: 'Diesel', label: 'Diesel' },
                { value: 'Diesel S10', label: 'Diesel S10' },
                { value: 'Gasolina', label: 'Gasolina' },
                { value: 'Etanol', label: 'Etanol' },
                { value: 'Arla 32', label: 'Arla 32' },
              ]}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Activity size={14} /> Cap. Tanque (L)
            </label>
            <input
              className="tauze-input"
              type="number"
              placeholder="Ex: 400"
              value={formData.capacidade_tanque}
              onChange={(e) => setFormData({ ...formData, capacidade_tanque: e.target.value })}
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Propriedade {reqIndicator}
            </label>
            <SearchableSelect
              value={formData.propriedade}
              onChange={(val: any) => setFormData({ ...formData, propriedade: val })}
              options={[
                { value: 'Próprio', label: 'Próprio' },
                { value: 'Alugado', label: 'Alugado' },
                { value: 'Comodato', label: 'Comodato' },
                { value: 'Terceiro', label: 'Terceiro' },
              ]}
            />
          </div>
        </div>

        {/* Linha 2 */}
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Gauge size={14} /> Unidade de Medida
            </label>
            <div
              className="tauze-form-radio-group"
              style={{ 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                height: '42px', 
                padding: '4px', 
                background: 'var(--bg-card-hover, #f8fafc)',
                border: '1px solid var(--border-color, #e2e8f0)',
                borderRadius: '8px',
                marginTop: '0'
              }}
            >
              {['horas', 'km'].map((t) => (
                <div
                  key={t}
                  className={`tauze-form-radio-item ${formData.unidade_medida === t ? 'active' : ''}`}
                  onClick={() => setFormData({ ...formData, unidade_medida: t })}
                  style={{ 
                    height: '100%', 
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxSizing: 'border-box',
                    background: formData.unidade_medida === t ? 'white' : 'transparent',
                    boxShadow: formData.unidade_medida === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: formData.unidade_medida === t ? 'var(--text-primary, #0f172a)' : 'var(--text-muted, #64748b)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <span style={{ textTransform: 'uppercase', fontSize: '12px', fontWeight: formData.unidade_medida === t ? 700 : 500 }}>
                    {t === 'horas' ? 'Horímetro' : 'Hodômetro'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {formData.unidade_medida === 'horas' ? (
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Clock size={14} /> Horímetro Inicial (h) {reqIndicator}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="tauze-input"
                  type="number"
                  placeholder="Ex: 500"
                  value={formData.horimetro_inicial}
                  readOnly={!!initialData}
                  style={{ opacity: initialData ? 0.7 : 1, background: initialData ? '#f8fafc' : undefined, borderColor: !initialData && formData.horimetro_inicial === '0' ? '#eab308' : undefined }}
                  title={initialData ? 'Bloqueado: Base de cálculo para manutenções não pode ser alterada.' : 'Crucial para o plano de manutenção'}
                  onChange={(e) =>
                    !initialData && setFormData({ ...formData, horimetro_inicial: e.target.value })
                  }
                />
                {!!initialData && <Lock size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />}
              </div>
            </div>
          ) : (
            <div className="tauze-field-group">
              <label className="tauze-label">
                <Gauge size={14} /> KM Inicial {reqIndicator}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  className="tauze-input"
                  type="number"
                  placeholder="Ex: 10000"
                  value={formData.quilometragem_inicial}
                  readOnly={!!initialData}
                  style={{ opacity: initialData ? 0.7 : 1, background: initialData ? '#f8fafc' : undefined, borderColor: !initialData && formData.quilometragem_inicial === '0' ? '#eab308' : undefined }}
                  title={initialData ? 'Bloqueado: Base de cálculo para manutenções não pode ser alterada.' : 'Crucial para o plano de manutenção'}
                  onChange={(e) =>
                    !initialData && setFormData({ ...formData, quilometragem_inicial: e.target.value })
                  }
                />
                {!!initialData && <Lock size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />}
              </div>
            </div>
          )}

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Activity size={14} /> Potência (cv)
            </label>
            <input
              className="tauze-input"
              type="number"
              placeholder="Ex: 125"
              value={formData.potencia}
              onChange={(e) => setFormData({ ...formData, potencia: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          3 — INDICADORES E MANUTENÇÃO
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 03" label="Indicadores Financeiros e Manutenção" complete={sectionProgress.s3} />
        <div className="tauze-input-grid grid-col-3" style={{ marginBottom: '16px' }}>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Activity size={14} /> Peso Op. (kg)
            </label>
            <input
              className="tauze-input"
              type="number"
              placeholder="Ex: 5800"
              value={formData.peso_operacional}
              onChange={(e) => setFormData({ ...formData, peso_operacional: e.target.value })}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Activity size={14} /> Meta Consumo (
              {formData.unidade_medida === 'horas' ? 'L/h' : 'km/L'})
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.1"
              placeholder={formData.unidade_medida === 'horas' ? 'Ex: 14.5' : 'Ex: 8.5'}
              value={formData.consumo_estimado}
              onChange={(e) => setFormData({ ...formData, consumo_estimado: e.target.value })}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <DollarSign size={14} /> Valor Compra (R$)
            </label>
            <input
              className="tauze-input"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.valor_compra}
              onChange={(e) => setFormData({ ...formData, valor_compra: e.target.value })}
            />
          </div>
        </div>

        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Settings size={14} /> Revisão Base Preventiva (
              {formData.unidade_medida === 'horas' ? 'h' : 'km'})
            </label>
            <input
              className="tauze-input"
              type="number"
              placeholder={formData.unidade_medida === 'horas' ? 'Ex: 250' : 'Ex: 10000'}
              value={formData.intervalo_revisao}
              onChange={(e) => setFormData({ ...formData, intervalo_revisao: e.target.value })}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Calendar size={14} /> Data Próx. Revisão
            </label>
            <DateInput
              className="tauze-input"
              type="date"
              value={formData.data_proxima_revisao}
              onChange={(e) =>
                setFormData({ ...formData, data_proxima_revisao: e.target.value })
              }
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          4 — INTEGRAÇÃO & TELEMETRIA
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section">
        <SectionBadge step="PASSO 04" label="Integração & Telemetria" complete={sectionProgress.s4} />
        
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Wifi size={14} /> Provedor de Telemetria
            </label>
            <SearchableSelect
              value={formData.telemetry_provider}
              onChange={(val: any) => setFormData({ ...formData, telemetry_provider: val })}
              options={[
                { value: 'Nenhum', label: 'Sem Integração' },
                { value: 'Solis', label: 'Solis AgTech' },
                { value: 'JohnDeere', label: 'John Deere Operations Center' },
                { value: 'Trimble', label: 'Trimble Ag' },
                { value: 'Custom', label: 'API Customizada' },
              ]}
            />
          </div>
          
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> ID do Dispositivo (Tracker ID)
            </label>
            <input
              className="tauze-input"
              type="text"
              placeholder="Ex: IMEI ou Serial do rastreador"
              value={formData.telemetry_id}
              disabled={formData.telemetry_provider === 'Nenhum'}
              style={{ opacity: formData.telemetry_provider === 'Nenhum' ? 0.6 : 1, background: formData.telemetry_provider === 'Nenhum' ? '#f8fafc' : undefined }}
              onChange={(e) => setFormData({ ...formData, telemetry_id: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          5 — STATUS E OBSERVAÇÕES
      ══════════════════════════════════════════════════════════════════ */}
      <section className="tauze-form-section" style={{ marginBottom: 0 }}>
        <SectionBadge step="PASSO 05" label="Status e Observações" complete={sectionProgress.s5} />
        
        {/* HEADER DE STATUS (Business Rule) */}
        <div style={{ marginBottom: '24px' }}>
          <h4
            className="tauze-label"
            style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Activity size={14} /> Status Atual da Máquina
          </h4>
          <div
            className="tauze-form-radio-group"
            style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginTop: 0 }}
          >
            <div
              className={`tauze-form-radio-item ${formData.status === 'active' ? 'active-operacional' : ''}`}
              onClick={() => setFormData({ ...formData, status: 'active' })}
            >
              Operacional
            </div>
            <div
              className={`tauze-form-radio-item ${formData.status === 'maintenance' ? 'active-manutencao' : ''}`}
              onClick={() => setFormData({ ...formData, status: 'maintenance' })}
            >
              Em Manutenção
            </div>
            <div
              className={`tauze-form-radio-item ${formData.status === 'broken' ? 'active-parado' : ''}`}
              onClick={() => setFormData({ ...formData, status: 'broken' })}
            >
              Quebrado
            </div>
            <div
              className={`tauze-form-radio-item ${formData.status === 'reforming' ? 'active-reforma' : ''}`}
              onClick={() => setFormData({ ...formData, status: 'reforming' })}
            >
              Em Reforma
            </div>
            <div
              className={`tauze-form-radio-item ${formData.status === 'inactive' ? 'active-inativa' : ''}`}
              onClick={() => setFormData({ ...formData, status: 'inactive' })}
            >
              Inativo
            </div>
          </div>
        </div>

        <div className="tauze-input-grid grid-col-1">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Observações Gerais
            </label>
            <textarea
              className="tauze-input tauze-textarea"
              placeholder="Histórico de avarias, notas sobre garantia ou especificações extras..."
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              rows={3}
            />
          </div>
        </div>
      </section>
    </SidePanel>
  );
};
