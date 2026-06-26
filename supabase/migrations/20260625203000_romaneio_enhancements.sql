-- Migration: Romaneio de Embarque — Melhorias de campos e status de animais
-- Data: 2026-06-25
-- Descrição: Adiciona campos de GTA, CNPJ comprador, preço por arroba e novos status para rastreabilidade de embarque

-- 1. Novas colunas na tabela romaneios
ALTER TABLE public.romaneios
  ADD COLUMN IF NOT EXISTS gta_numero text,
  ADD COLUMN IF NOT EXISTS gta_serie text,
  ADD COLUMN IF NOT EXISTS comprador_cnpj text,
  ADD COLUMN IF NOT EXISTS preco_por_arroba numeric DEFAULT 330.00,
  ADD COLUMN IF NOT EXISTS tipo_veiculo text DEFAULT 'TRUCK' CHECK (tipo_veiculo IN ('TRUCK','CARRETA','BITREM','OUTRO')),
  ADD COLUMN IF NOT EXISTS motorista_cpf text,
  ADD COLUMN IF NOT EXISTS data_chegada date;

-- 2. Adicionar novos status de animais (EM_EMBARQUE, EM_TRANSITO)
-- Primeiro verificar se existe uma constraint de check no status dos animais e removê-la
DO $$
BEGIN
  -- Remover constraint antiga se existir
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'animais' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.animais DROP CONSTRAINT IF EXISTS animais_status_check;
  END IF;
END;
$$;

-- Adicionar constraint atualizada com novos status
ALTER TABLE public.animais
  DROP CONSTRAINT IF EXISTS animais_status_check;

ALTER TABLE public.animais
  ADD CONSTRAINT animais_status_check
  CHECK (status IN ('ATIVO', 'Ativo', 'Abatido', 'Vendido', 'Morto', 'EM_EMBARQUE', 'EM_TRANSITO', 'TRANSFERIDO'));

-- 3. Comentários descritivos
COMMENT ON COLUMN public.romaneios.gta_numero IS 'Número da GTA (Guia de Trânsito Animal) emitida pelo MAPA — obrigatória para transporte interestadual';
COMMENT ON COLUMN public.romaneios.gta_serie IS 'Série da GTA';
COMMENT ON COLUMN public.romaneios.comprador_cnpj IS 'CPF ou CNPJ do comprador / destinatário — exigido na NF-e de saída';
COMMENT ON COLUMN public.romaneios.preco_por_arroba IS 'Preço negociado por arroba (30kg) em reais — padrão R$ 330,00';
COMMENT ON COLUMN public.romaneios.tipo_veiculo IS 'Tipo de veículo de transporte: TRUCK, CARRETA, BITREM ou OUTRO';
COMMENT ON COLUMN public.romaneios.motorista_cpf IS 'CPF do motorista responsável pelo transporte';
COMMENT ON COLUMN public.romaneios.data_chegada IS 'Data de chegada ao destino — preenchida ao confirmar conclusão';
COMMENT ON COLUMN public.animais.status IS 'Status atual do animal: ATIVO=na fazenda, EM_EMBARQUE=reservado para romaneio, EM_TRANSITO=em trânsito no caminhão, Abatido=abatido no frigorífico, Vendido=vendido para outra fazenda, Morto=morte na fazenda, TRANSFERIDO=transferido para outra fazenda do grupo';
