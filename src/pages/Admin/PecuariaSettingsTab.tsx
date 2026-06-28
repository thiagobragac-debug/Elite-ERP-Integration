import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useTenant } from '../../contexts/TenantContext';
import toast from 'react-hot-toast';

export const PecuariaSettingsTab: React.FC<{
  activeTab: string;
  triggerSave: number;
  onSaveStatus: (saving: boolean, success: boolean) => void;
}> = ({ triggerSave, onSaveStatus }) => {
  const { activeTenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [fazendaId, setFazendaId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    rendimentoCarcaca: 50,
    pesoBoiGordo: 500,
    idadeBoiGordo: 36,
    pesoVaca: 450,
    idadeVaca: 36,
  });

  useEffect(() => {
    fetchSettings();
  }, [activeTenantId]);

  useEffect(() => {
    if (triggerSave > 0) {
      handleSave();
    }
  }, [triggerSave]);

  const fetchSettings = async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      // Pega a primeira fazenda do tenant para configurações globais da pecuária
      const { data, error } = await supabase
        .from('fazendas')
        .select('id, configuracoes')
        .eq('tenant_id', activeTenantId)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setFazendaId(data.id);
        const configPecuaria = data.configuracoes?.pecuaria || {};
        setFormData({
          rendimentoCarcaca: configPecuaria.rendimentoCarcaca || 50,
          pesoBoiGordo: configPecuaria.pesoBoiGordo || 500,
          idadeBoiGordo: configPecuaria.idadeBoiGordo || 36,
          pesoVaca: configPecuaria.pesoVaca || 450,
          idadeVaca: configPecuaria.idadeVaca || 36,
        });
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!fazendaId) {
      toast.error('Nenhuma fazenda encontrada para este tenant.');
      return;
    }
    onSaveStatus(true, false);

    try {
      // Buscar configuracoes atuais
      const { data: currentData } = await supabase
        .from('fazendas')
        .select('configuracoes')
        .eq('id', fazendaId)
        .single();

      const newConfig = {
        ...(currentData?.configuracoes || {}),
        pecuaria: formData,
      };

      const { error } = await supabase
        .from('fazendas')
        .update({ configuracoes: newConfig })
        .eq('id', fazendaId);

      if (error) throw error;

      toast.success('Parâmetros zootécnicos atualizados com sucesso!');
      onSaveStatus(false, true);
      setTimeout(() => onSaveStatus(false, false), 3000);
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar os parâmetros.');
      onSaveStatus(false, false);
    }
  };

  if (loading) {
    return (
      <div className="hub-content" style={{ padding: '24px', opacity: 0.5 }}>
        Carregando parâmetros...
      </div>
    );
  }

  return (
    <div className="hub-content animate-fade-in" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      <div className="tauze-alert warning" style={{ display: 'flex', gap: '12px', padding: '16px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', color: '#f59e0b' }}>
        <AlertCircle size={20} style={{ flexShrink: 0 }} />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>Impacto Global</h4>
          <p style={{ margin: 0, fontSize: '13px', opacity: 0.9 }}>
            Alterar estes parâmetros afetará o cálculo de custo de arroba produzida e a classificação automática de todos os animais ativos.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        
        {/* Rendimento */}
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Rendimento de Carcaça
          </h3>
          <div className="tauze-input-group">
            <label className="tauze-label">Rendimento Padrão (%)</label>
            <input
              type="number"
              className="tauze-input"
              value={formData.rendimentoCarcaca}
              onChange={(e) => setFormData({ ...formData, rendimentoCarcaca: Number(e.target.value) })}
              min={30}
              max={70}
              step={0.1}
            />
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
              Utilizado para converter Kg Vivo em Arroba Produzida. (Padrão sugerido: 50%)
            </span>
          </div>
        </div>

        {/* Machos */}
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Limites para Machos
          </h3>
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-input-group">
              <label className="tauze-label">Peso Boi Gordo (Kg)</label>
              <input
                type="number"
                className="tauze-input"
                value={formData.pesoBoiGordo}
                onChange={(e) => setFormData({ ...formData, pesoBoiGordo: Number(e.target.value) })}
              />
            </div>
            <div className="tauze-input-group">
              <label className="tauze-label">Idade (Meses)</label>
              <input
                type="number"
                className="tauze-input"
                value={formData.idadeBoiGordo}
                onChange={(e) => setFormData({ ...formData, idadeBoiGordo: Number(e.target.value) })}
              />
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Acima destes valores, o animal é classificado automaticamente como "Boi Gordo".
          </span>
        </div>

        {/* Fêmeas */}
        <div style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '16px', color: 'var(--text-main)' }}>
            Limites para Fêmeas
          </h3>
          <div className="form-grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="tauze-input-group">
              <label className="tauze-label">Peso Vaca (Kg)</label>
              <input
                type="number"
                className="tauze-input"
                value={formData.pesoVaca}
                onChange={(e) => setFormData({ ...formData, pesoVaca: Number(e.target.value) })}
              />
            </div>
            <div className="tauze-input-group">
              <label className="tauze-label">Idade (Meses)</label>
              <input
                type="number"
                className="tauze-input"
                value={formData.idadeVaca}
                onChange={(e) => setFormData({ ...formData, idadeVaca: Number(e.target.value) })}
              />
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', display: 'block' }}>
            Acima destes valores, o animal é classificado automaticamente como "Vaca".
          </span>
        </div>

      </div>
    </div>
  );
};
