-- Adicionando novas colunas sugeridas na melhoria de processo reprodutivo

ALTER TABLE public.eventos_reprodutivos
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS custo numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tecnico text,
  ADD COLUMN IF NOT EXISTS partida_semen text,
  ADD COLUMN IF NOT EXISTS metodo_diagnostico text,
  ADD COLUMN IF NOT EXISTS numero_fetos text,
  ADD COLUMN IF NOT EXISTS peso_nascimento numeric,
  ADD COLUMN IF NOT EXISTS retencao_placenta boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dificuldade_parto integer,
  ADD COLUMN IF NOT EXISTS teat_sealant boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS periodo_secagem integer,
  ADD COLUMN IF NOT EXISTS dias_gestacao integer,
  ADD COLUMN IF NOT EXISTS sexo_cria text,
  ADD COLUMN IF NOT EXISTS id_cria text,
  ADD COLUMN IF NOT EXISTS touro text,
  ADD COLUMN IF NOT EXISTS ecc numeric,
  ADD COLUMN IF NOT EXISTS observacoes text;

DO $$ 
BEGIN
  BEGIN
    UPDATE public.eventos_reprodutivos SET observacoes = observacao WHERE observacoes IS NULL;
  EXCEPTION
    WHEN undefined_column THEN 
      NULL;
  END;
END $$;
