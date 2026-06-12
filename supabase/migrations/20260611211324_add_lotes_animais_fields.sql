-- Adiciona campos faltantes do formulário de lotes
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS finalidade text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS descricao text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS capacidade integer DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS data_inicio date;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS data_fim_prevista date;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS dias_ciclo integer;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS peso_entrada numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS gmd_alvo numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS peso_alvo numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS pasto_id uuid REFERENCES public.pastos(id);
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS sexo_permitido text DEFAULT 'MISTO';
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS regime_alimentar text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS custo_diario numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS cor text DEFAULT '#6366f1';
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS programa_bonificacao text;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS meta_rendimento_carcaca numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS peso_carcaca_alvo numeric DEFAULT 0;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS exige_rastreabilidade boolean DEFAULT false;

-- Adiciona campo de brinco eletrônico na tabela animais
ALTER TABLE public.animais ADD COLUMN IF NOT EXISTS brinco_eletronico text;
