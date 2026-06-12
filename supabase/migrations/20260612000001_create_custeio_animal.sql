-- ==========================================================
-- MIGRATION: Custeio Individual e Snapshot de Valores (ERP Diamante)
-- ==========================================================

-- 1. Histórico de Movimentação do Animal
CREATE TABLE IF NOT EXISTS public.historico_movimentacao_animal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  fazenda_id uuid REFERENCES public.fazendas(id),
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
  lote_origem_id uuid REFERENCES public.lotes(id),
  lote_destino_id uuid REFERENCES public.lotes(id),
  data_movimentacao timestamptz DEFAULT now(),
  motivo text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.historico_movimentacao_animal ENABLE ROW LEVEL SECURITY;

-- 2. Tabela de Custos do Animal (O "Taxímetro")
CREATE TABLE IF NOT EXISTS public.custos_animal (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  fazenda_id uuid REFERENCES public.fazendas(id),
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
  lote_id uuid REFERENCES public.lotes(id),
  produto_id uuid REFERENCES public.produtos(id),
  dieta_id uuid REFERENCES public.dietas(id),
  fase text DEFAULT 'RECRIA', -- RECRIA ou CONFINAMENTO
  data_consumo date DEFAULT CURRENT_DATE,
  quantidade_consumida numeric DEFAULT 0,
  valor_unitario_aplicado numeric DEFAULT 0,
  valor_total_aplicado numeric DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.custos_animal ENABLE ROW LEVEL SECURITY;

-- 3. Sanidade Individualizada (Vacinas/Manejo por animal)
CREATE TABLE IF NOT EXISTS public.sanidade_animais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id),
  fazenda_id uuid REFERENCES public.fazendas(id),
  sanidade_id uuid REFERENCES public.sanidade(id) ON DELETE CASCADE,
  animal_id uuid REFERENCES public.animais(id) ON DELETE CASCADE,
  produto_id uuid REFERENCES public.produtos(id),
  quantidade_dose numeric DEFAULT 0,
  valor_unitario_aplicado numeric DEFAULT 0,
  valor_total_aplicado numeric DEFAULT 0,
  data_aplicacao date DEFAULT CURRENT_DATE,
  fase text DEFAULT 'RECRIA',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.sanidade_animais ENABLE ROW LEVEL SECURITY;

-- 4. Função RPC para Recálculo em Cascata (Sincronização com Motor de Estoque)
CREATE OR REPLACE FUNCTION public.recalcular_custos_animal(p_produto_id uuid, p_data_inicio date, p_novo_custo_medio numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Atualiza os tratos/nutrição
  UPDATE public.custos_animal
  SET 
    valor_unitario_aplicado = p_novo_custo_medio,
    valor_total_aplicado = quantidade_consumida * p_novo_custo_medio
  WHERE produto_id = p_produto_id AND data_consumo >= p_data_inicio;

  -- Atualiza as aplicações de sanidade
  UPDATE public.sanidade_animais
  SET 
    valor_unitario_aplicado = p_novo_custo_medio,
    valor_total_aplicado = quantidade_dose * p_novo_custo_medio
  WHERE produto_id = p_produto_id AND data_aplicacao >= p_data_inicio;
END;
$$;

-- 5. Trigger Automático ao alterar Custo Médio
CREATE OR REPLACE FUNCTION public.trigger_recalcular_custeio_animal()
RETURNS trigger AS $$
BEGIN
  IF NEW.custo_medio IS DISTINCT FROM OLD.custo_medio THEN
     -- Por padrão, recalcula a partir da data atual. O Motor de Estoque pode invocar a RPC diretamente para datas passadas.
     PERFORM public.recalcular_custos_animal(NEW.id, CURRENT_DATE, NEW.custo_medio);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_produtos_custo_medio_update ON public.produtos;
CREATE TRIGGER trg_produtos_custo_medio_update
AFTER UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.trigger_recalcular_custeio_animal();
