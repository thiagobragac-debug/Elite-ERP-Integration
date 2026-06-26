-- Adiciona campos ausentes para suportar o novo formulário completo
ALTER TABLE public.sanidade
  ADD COLUMN IF NOT EXISTS carencia_leite_dias integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS bloquear_romaneio boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS notificar_fim_carencia boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS veterinario text,
  ADD COLUMN IF NOT EXISTS data_liberacao date,
  ADD COLUMN IF NOT EXISTS gerar_documento boolean DEFAULT false;

-- Índice para consulta de bloqueio no Romaneio (critical path)
CREATE INDEX IF NOT EXISTS idx_sanidade_bloquear_romaneio
  ON public.sanidade (tenant_id, fazenda_id, bloquear_romaneio, data_liberacao)
  WHERE bloquear_romaneio = true;
