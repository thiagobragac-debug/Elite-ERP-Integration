import React, { useState, useMemo } from 'react';
import { useFormDraft } from '../../hooks/useFormDraft';

import {
  Map,
  Maximize,
  MapPin,
  Building2,
  FileText,
  Hash,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  AlertTriangle,
  Leaf,
  Briefcase,
  Landmark,
  Truck,
  Scale
} from 'lucide-react';
import { SidePanel } from '../Layout/SidePanel';
import { useTenant } from '../../contexts/TenantContext';
import { SearchableSelect } from './SearchableSelect';
import { FormSection } from './UI/FormSection';

interface FarmFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
  actionId?: number;
}

export const FarmForm: React.FC<FarmFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  actionId,
}) => {
  const { companies, activeTenantId } = useTenant();
  const INITIAL_FORM = {
    name: '',
    registrationNumber: '',
    nirf: '',
    car: '',
    situacao_ambiental: 'Regular',
    tipo_exploracao: 'Própria',
    totalArea: '',
    area_util: '',
    location: '',
    municipio: '',
    uf: '',
    companyId: '',
    description: '',
    configuracoes: {
      peso_minimo_abate_kg: '',
      capacidade_max_truck: '',
      capacidade_max_carreta: '',
      capacidade_max_bitrem: '',
      capacidade_max_rodotrem: ''
    }
  };
  const { formData, setFormData, clearDraft } = useFormDraft({
    key: `farm_form_${activeTenantId}`,
    initialState: INITIAL_FORM,
    isOpen,
    isEditMode: !!initialData,
  });

  const [loading, setLoading] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [obsOpen, setObsOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);

  React.useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData({
      name: initialData.nome || initialData.name || '',
      registrationNumber: initialData.ie_produtor || initialData.registrationNumber || '',
      nirf: initialData.nirf || '',
      car: initialData.car || '',
      situacao_ambiental: initialData.situacao_ambiental || 'Regular',
      tipo_exploracao: initialData.tipo_exploracao || 'Própria',
      totalArea: (initialData.area_total || initialData.totalArea)?.toString() || '',
      area_util: initialData.area_util?.toString() || '',
      location: initialData.localizacao || initialData.location || '',
      municipio: initialData.municipio || '',
      uf: initialData.uf || '',
      companyId: initialData.unidade_id || initialData.companyId || '',
      description: initialData.description || '',
      configuracoes: {
        peso_minimo_abate_kg: initialData.configuracoes?.peso_minimo_abate_kg || '',
        capacidade_max_truck: initialData.configuracoes?.capacidade_max_truck || '',
        capacidade_max_carreta: initialData.configuracoes?.capacidade_max_carreta || '',
        capacidade_max_bitrem: initialData.configuracoes?.capacidade_max_bitrem || '',
        capacidade_max_rodotrem: initialData.configuracoes?.capacidade_max_rodotrem || ''
      }
    });
  }, [isOpen, initialData]);

  // --- MOTOR MATEMÁTICO DE APROVEITAMENTO ---
  const aproveitamento = useMemo(() => {
    const t = parseFloat(formData.totalArea);
    const u = parseFloat(formData.area_util);
    if (!isNaN(t) && !isNaN(u) && t > 0) {
      const percent = (u / t) * 100;
      return percent > 100 ? 100 : percent;
    }
    return 0;
  }, [formData.totalArea, formData.area_util]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      clearDraft();
    } catch (err) {
      console.error('Error in FarmForm handleSubmit:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidePanel
      size="medium"
      isOpen={isOpen}
      onClose={onClose}
      onCancel={() => { clearDraft(); onClose(); }}
      onSubmit={handleSubmit}
      title={initialData ? 'Editar Fazenda' : 'Cadastrar Nova Fazenda'}
      subtitle={
        initialData
          ? 'Atualize os dados da sua unidade produtiva.'
          : 'Adicione uma unidade produtiva e vincule a uma empresa.'
      }
      icon={Map}
      loading={loading}
      submitLabel={initialData ? 'Salvar Alterações' : 'Salvar Fazenda'}
    >
      <section className="tauze-form-section">
        <FormSection title="Identificação Básica" badge="PASSO 01" marginTop={0} />
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Map size={14} /> Nome da Fazenda / Unidade
            </label>
            <input
              type="text"
              className="tauze-input"
              placeholder="Ex: Fazenda Santa Maria, Unidade Sul..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Building2 size={14} /> Empresa Responsável
            </label>
            <SearchableSelect
              value={formData.companyId}
              onChange={(val: any) => setFormData({ ...formData, companyId: val })}
              options={[
                { value: ``, label: `Selecione a empresa...` },
                ...(companies || []).map((c) => ({ value: String(c.id), label: String(c.name) })),
              ]}
            />
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <FormSection title="Compliance e Registros Oficiais" badge="PASSO 02" marginTop={0} />
        <div className="tauze-input-grid grid-col-3">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <FileText size={14} /> Inscrição Estadual (IE)
            </label>
            <input
              type="text"
              className="tauze-input"
              placeholder="Número da IE..."
              value={formData.registrationNumber}
              onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
            />
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Hash size={14} /> NIRF
              <span className="nirf-badge">Receita Federal</span>
            </label>
            <input
              type="text"
              className="tauze-input"
              placeholder="Ex: 1234567-8"
              value={formData.nirf}
              onChange={(e) => setFormData({ ...formData, nirf: e.target.value })}
            />
            <small className="field-hint">Obrigatório para o LCDPR</small>
          </div>

          <div className="tauze-field-group">
            <label className="tauze-label">
              <Leaf
                size={14}
                style={{ color: formData.situacao_ambiental === 'Regular' ? '#10b981' : '#ef4444' }}
              />
              Cadastro Ambiental (CAR)
            </label>
            <input
              type="text"
              className="tauze-input"
              placeholder="BR-0000..."
              value={formData.car}
              onChange={(e) => setFormData({ ...formData, car: e.target.value })}
            />
          </div>
        </div>
        <div className="tauze-input-grid grid-col-3" style={{ marginTop: '16px' }}>
          <div className="tauze-field-group span-1">
            <label className="tauze-label">Situação Ambiental (IBAMA)</label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background:
                  formData.situacao_ambiental === 'Regular'
                    ? 'hsl(var(--brand)/0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                borderRadius: '12px',
                border: `1px solid ${formData.situacao_ambiental === 'Regular' ? 'hsl(var(--brand)/0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              <select
                className="tauze-input"
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  height: 'auto',
                  fontWeight: 700,
                  color:
                    formData.situacao_ambiental === 'Regular' ? 'hsl(var(--brand))' : '#ef4444',
                  width: '100%',
                  outline: 'none',
                  boxShadow: 'none',
                }}
                value={formData.situacao_ambiental}
                onChange={(e) => setFormData({ ...formData, situacao_ambiental: e.target.value })}
              >
                <option value="Regular">✔ Regular / Ativo</option>
                <option value="Pendente">⚠ Pendente / Em Análise</option>
                <option value="Suspenso">⛔ Suspenso / Embargado</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <FormSection title="Gestão Fundiária (LCDPR)" badge="PASSO 03" marginTop={0} />
        <div className="tauze-field-group full-width">
          <label className="tauze-label">
            <Landmark size={14} /> Tipo de Exploração
          </label>
          <div className="tauze-form-radio-group" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {['Própria', 'Arrendada', 'Parceria', 'Comodato'].map((t) => (
              <div
                key={t}
                className={`tauze-form-radio-item ${formData.tipo_exploracao === t ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, tipo_exploracao: t })}
              >
                <span style={{ textTransform: 'capitalize' }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="tauze-form-section">
        <FormSection title="Inteligência Agronômica" badge="PASSO 04" marginTop={0} />
        <div className="tauze-input-grid grid-col-2">
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Maximize size={14} /> Área Total (ha)
            </label>
            <input
              type="number"
              className="tauze-input"
              step="0.01"
              placeholder="Ex: 1000.00"
              value={formData.totalArea}
              onChange={(e) => setFormData({ ...formData, totalArea: e.target.value })}
              required
            />
          </div>
          <div className="tauze-field-group">
            <label className="tauze-label">
              <Leaf size={14} /> Área Útil / Produtiva (ha)
            </label>
            <input
              type="number"
              className="tauze-input"
              step="0.01"
              placeholder="Ex: 800.00"
              value={formData.area_util}
              onChange={(e) => setFormData({ ...formData, area_util: e.target.value })}
            />
          </div>
        </div>

        {parseFloat(formData.totalArea) > 0 && parseFloat(formData.area_util) > 0 && (
          <div
            style={{
              marginTop: '16px',
              background: 'hsl(var(--bg-main)/0.5)',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid hsl(var(--border))',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '8px',
                fontSize: '12px',
                fontWeight: 800,
              }}
            >
              <span>Aproveitamento Produtivo</span>
              <span
                style={{
                  color:
                    aproveitamento >= 80 ? '#10b981' : aproveitamento >= 50 ? '#f59e0b' : '#ef4444',
                }}
              >
                {aproveitamento.toFixed(1)}%
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'hsl(var(--border))',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${aproveitamento}%`,
                  background:
                    aproveitamento >= 80 ? '#10b981' : aproveitamento >= 50 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <FormSection
          title="Localização Padrão IBGE"
          badge="PASSO 05"
          marginTop={0}
          onClick={() => setLocOpen(!locOpen)}
          rightElement={
            <div style={{ color: 'hsl(var(--text-muted))' }}>
              {locOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          }
          className="interactive-header"
        />

        {locOpen && (
          <div style={{ padding: '24px' }}>
            <div className="tauze-input-grid grid-col-3">
              <div className="tauze-field-group">
                <label className="tauze-label">Município</label>
                <input
                  type="text"
                  className="tauze-input"
                  placeholder="Ex: Jataí"
                  value={formData.municipio}
                  onChange={(e) => setFormData({ ...formData, municipio: e.target.value })}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label">UF</label>
                <input
                  type="text"
                  className="tauze-input"
                  placeholder="GO"
                  maxLength={2}
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })}
                />
              </div>

              <div className="tauze-field-group">
                <label className="tauze-label">
                  <MapPin size={14} /> Exibição da Cidade/UF
                </label>
                <input
                  type="text"
                  className="tauze-input"
                  placeholder="Ex: Jataí - GO"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <FormSection
          title="Detalhes Finais"
          badge="PASSO 06"
          marginTop={0}
          onClick={() => setObsOpen(!obsOpen)}
          rightElement={
            <div style={{ color: 'hsl(var(--text-muted))' }}>
              {obsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          }
          className="interactive-header"
        />

        {obsOpen && (
          <div style={{ padding: '24px' }}>
            <div className="tauze-input-grid grid-col-1">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <FileText size={14} /> Observações / Descrição
                </label>
                <textarea
                  className="tauze-input tauze-textarea"
                  placeholder="Breve descrição da atividade principal da unidade..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tauze-form-section" style={{ padding: 0 }}>
        <FormSection
          title="Configurações Operacionais & Logística"
          badge="PASSO 07"
          marginTop={0}
          onClick={() => setConfigOpen(!configOpen)}
          rightElement={
            <div style={{ color: 'hsl(var(--text-muted))' }}>
              {configOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </div>
          }
          className="interactive-header"
        />

        {configOpen && (
          <div style={{ padding: '24px' }}>
            <div className="tauze-input-grid grid-col-2">
              <div className="tauze-field-group">
                <label className="tauze-label">
                  <Scale size={14} /> Peso Mín. Abate (kg/cbç)
                </label>
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Ex: 500"
                  step="0.1"
                  value={formData.configuracoes.peso_minimo_abate_kg}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    configuracoes: { ...formData.configuracoes, peso_minimo_abate_kg: e.target.value ? Number(e.target.value) : '' } 
                  })}
                />
              </div>
            </div>
            
            <label className="tauze-label" style={{ marginTop: '16px', display: 'block', borderBottom: '1px solid var(--border)', paddingBottom: '8px', marginBottom: '16px' }}>
              <Truck size={14} /> Capacidade Máxima de Frota (Cabeças)
            </label>
            <div className="tauze-input-grid grid-col-4">
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ fontSize: '11px' }}>TRUCK</label>
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Ex: 18"
                  value={formData.configuracoes.capacidade_max_truck}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    configuracoes: { ...formData.configuracoes, capacidade_max_truck: e.target.value ? Number(e.target.value) : '' } 
                  })}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ fontSize: '11px' }}>CARRETA</label>
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Ex: 25"
                  value={formData.configuracoes.capacidade_max_carreta}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    configuracoes: { ...formData.configuracoes, capacidade_max_carreta: e.target.value ? Number(e.target.value) : '' } 
                  })}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ fontSize: '11px' }}>BI-TREM</label>
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Ex: 32"
                  value={formData.configuracoes.capacidade_max_bitrem}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    configuracoes: { ...formData.configuracoes, capacidade_max_bitrem: e.target.value ? Number(e.target.value) : '' } 
                  })}
                />
              </div>
              <div className="tauze-field-group">
                <label className="tauze-label" style={{ fontSize: '11px' }}>RODO-TREM</label>
                <input
                  type="number"
                  className="tauze-input"
                  placeholder="Ex: 45"
                  value={formData.configuracoes.capacidade_max_rodotrem}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    configuracoes: { ...formData.configuracoes, capacidade_max_rodotrem: e.target.value ? Number(e.target.value) : '' } 
                  })}
                />
              </div>
            </div>
          </div>
        )}
      </section>

      <style>{`
        .nirf-badge {
          margin-left: 6px; font-size: 9px; font-weight: 800;
          padding: 1px 6px; border-radius: 5px;
          background: hsl(var(--brand) / 0.12); color: hsl(var(--brand));
          border: 1px solid hsl(var(--brand) / 0.25);
          letter-spacing: 0.06em; text-transform: uppercase; vertical-align: middle;
        }
        .field-hint {
          display: block; margin-top: 4px; font-size: 11px;
          color: hsl(var(--text-muted)); font-style: italic;
        }
      `}</style>
    </SidePanel>
  );
};
