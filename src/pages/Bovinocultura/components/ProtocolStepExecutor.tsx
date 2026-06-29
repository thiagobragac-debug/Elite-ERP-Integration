import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Play, FlaskConical, Check, Minus, ChevronDown,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabase';
import { useFarmFilter } from '../../../hooks/useFarmFilter';

interface ProtocolStepExecutorProps {
  isOpen: boolean;
  onClose: () => void;
  etapa: any;
  protocolo: any;
  animais: any[];
  onSuccess: () => void;
}

const MOTIVOS_PULO = ['Doença', 'Saiu do Lote', 'Morte', 'Recusa', 'Outro'];

export const ProtocolStepExecutor: React.FC<ProtocolStepExecutorProps> = ({
  isOpen,
  onClose,
  etapa,
  protocolo,
  animais,
  onSuccess,
}) => {
  const { activeTenantId, activeFarmId, insertPayload } = useFarmFilter();
  const [dataRealizada, setDataRealizada] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [notas, setNotas] = useState('');
  // Estado individual de cada animal: 'aplicado' | 'pulado'
  const [animalStatus, setAnimalStatus] = useState<Record<string, { status: 'aplicado' | 'pulado'; motivo?: string }>>({});

  const getStatus = (animalId: string) =>
    animalStatus[animalId] ?? { status: 'aplicado' };

  const toggleAnimal = (animalId: string) => {
    setAnimalStatus((prev) => ({
      ...prev,
      [animalId]: {
        status: prev[animalId]?.status === 'pulado' ? 'aplicado' : 'pulado',
        motivo: prev[animalId]?.status === 'pulado' ? undefined : prev[animalId]?.motivo,
      },
    }));
  };

  const setMotivo = (animalId: string, motivo: string) => {
    setAnimalStatus((prev) => ({
      ...prev,
      [animalId]: { status: 'pulado', motivo },
    }));
  };

  const marcarTodos = () => setAnimalStatus({});
  const desmarcarTodos = () => {
    const next: typeof animalStatus = {};
    animais.forEach((pa) => {
      next[pa.animal_id] = { status: 'pulado', motivo: 'Outro' };
    });
    setAnimalStatus(next);
  };

  const aplicados = animais.filter((pa) => getStatus(pa.animal_id).status === 'aplicado');
  const pulados = animais.filter((pa) => getStatus(pa.animal_id).status === 'pulado');

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!etapa || !protocolo) {return;}

      // 1. Atualizar etapa como realizada
      await supabase
        .from('protocolo_etapas')
        .update({
          status: 'realizada',
          data_realizada: dataRealizada,
          notas,
        })
        .eq('id', etapa.id)
        .eq('tenant_id', activeTenantId);

      // 2. Gerar 1 evento_reprodutivo por animal aplicado
      if (aplicados.length > 0) {
        const eventos = aplicados.map((pa) => ({
          animal_id: pa.animal_id,
          tipo_evento: etapa.tipo_acao === 'ia' ? 'IATF' : etapa.tipo_acao === 'diagnostico' ? 'Toque' : 'Protocolo',
          data_evento: dataRealizada,
          status: 'completed',
          observacoes: `Etapa "${etapa.nome_etapa}" do protocolo "${protocolo.nome}"`,
          protocolo_etapa_id: etapa.id,
          tenant_id: activeTenantId,
          fazenda_id: activeFarmId,
        }));
        await supabase.from('eventos_reprodutivos').insert(eventos);
      }

      // 3. Atualizar protocolo_animais dos pulados (adicionar observação)
      for (const pa of pulados) {
        const motivo = getStatus(pa.animal_id).motivo || 'Outro';
        await supabase
          .from('protocolo_animais')
          .update({
            observacoes: `Pulado na etapa "${etapa.nome_etapa}" — motivo: ${motivo}`,
          })
          .eq('id', pa.id)
          .eq('tenant_id', activeTenantId);
      }
    },
    onSuccess,
    onError: (err: any) => console.error('Erro ao executar etapa:', err),
  });

  if (!isOpen || !etapa) {return null;}

  return createPortal(
    <AnimatePresence>
      <div
        className="tauze-sidebar-overlay"
        onMouseDown={(e) => { if (e.target === e.currentTarget) {onClose();} }}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="tauze-sidebar-modal"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="tauze-sidebar-header">
            <div className="header-content" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-wrapper primary">
                <Play size={20} />
              </div>
              <div>
                <h3>Executar Etapa</h3>
                <p>{etapa.nome_etapa} · {protocolo?.nome}</p>
              </div>
            </div>
            <button onClick={onClose}><X size={20} /></button>
          </div>

          {/* Body */}
          <div className="tauze-sidebar-body">
            {/* Data e notas */}
            <div className="form-section">
              <div className="form-grid-2">
                <div className="form-group">
                  <label className="form-label">Data de Realização</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dataRealizada}
                    onChange={(e) => setDataRealizada(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">Observações da Etapa</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Anotações, intercorrências..."
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Resumo */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span style={{ color: 'hsl(142 71% 45%)' }}>✓ {aplicados.length} aplicados</span>
              <span style={{ color: 'hsl(38 92% 45%)' }}>↷ {pulados.length} pulados</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                <button
                  onClick={marcarTodos}
                  style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Marcar Todos
                </button>
                <button
                  onClick={desmarcarTodos}
                  style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  Desmarcar Todos
                </button>
              </div>
            </div>

            {/* Lista de animais */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {animais.map((pa: any) => {
                const animal = pa.animais;
                const st = getStatus(pa.animal_id);
                const isPulado = st.status === 'pulado';
                return (
                  <div
                    key={pa.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isPulado ? 'hsl(38 92% 50% / 0.08)' : 'hsl(142 71% 45% / 0.06)',
                      border: `1px solid ${isPulado ? 'hsl(38 92% 50% / 0.25)' : 'hsl(142 71% 45% / 0.2)'}`,
                      transition: 'all 0.2s',
                    }}
                  >
                    {/* Toggle */}
                    <button
                      onClick={() => toggleAnimal(pa.animal_id)}
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '6px',
                        background: isPulado ? 'hsl(38 92% 50%)' : 'hsl(142 71% 45%)',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {isPulado ? <Minus size={12} color="white" /> : <Check size={12} color="white" />}
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 800, fontSize: '13px' }}>
                        #{animal?.brinco || '?'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginLeft: '6px' }}>
                        {animal?.categoria}
                      </span>
                    </div>

                    {/* Motivo se pulado */}
                    {isPulado && (
                      <div style={{ position: 'relative' }}>
                        <select
                          className="form-input"
                          style={{ padding: '2px 8px', fontSize: '11px', height: '28px', minWidth: '110px' }}
                          value={st.motivo || ''}
                          onChange={(e) => setMotivo(pa.animal_id, e.target.value)}
                        >
                          <option value="">Motivo...</option>
                          {MOTIVOS_PULO.map((m) => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="tauze-sidebar-footer">
            <button className="glass-btn secondary" style={{ flex: 1 }} onClick={onClose}>
              CANCELAR
            </button>
            <button
              className="primary-btn"
              style={{ flex: 1 }}
              disabled={executeMutation.isPending}
              onClick={() => executeMutation.mutate()}
            >
              {executeMutation.isPending ? 'Salvando...' : `CONFIRMAR (${aplicados.length} animais)`}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
