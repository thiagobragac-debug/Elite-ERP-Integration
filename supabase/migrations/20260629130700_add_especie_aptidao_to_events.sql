-- Add columns to tables
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.pastos ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.pastos ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.confinamento ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.confinamento ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.nutricao_animais ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.nutricao_animais ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.sanidade_animais ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.sanidade_animais ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.sanidade ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.pesagens ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.pesagens ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.eventos_reprodutivos ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.eventos_reprodutivos ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS aptidao_id TEXT;
ALTER TABLE public.protocolo_animais ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.protocolo_animais ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

-- Trigger function
CREATE OR REPLACE FUNCTION public.trg_inherit_animal_especie_aptidao()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.animal_id IS NOT NULL THEN
    IF NEW.especie_id IS NULL OR NEW.aptidao_id IS NULL THEN
      SELECT COALESCE(NEW.especie_id, especie_id), COALESCE(NEW.aptidao_id, aptidao_id)
      INTO NEW.especie_id, NEW.aptidao_id
      FROM public.animais
      WHERE id = NEW.animal_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
DROP TRIGGER IF EXISTS trg_pesagens_inherit ON public.pesagens;
CREATE TRIGGER trg_pesagens_inherit BEFORE INSERT OR UPDATE ON public.pesagens FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

DROP TRIGGER IF EXISTS trg_nutricao_inherit ON public.nutricao_animais;
CREATE TRIGGER trg_nutricao_inherit BEFORE INSERT OR UPDATE ON public.nutricao_animais FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

DROP TRIGGER IF EXISTS trg_sanidade_animais_inherit ON public.sanidade_animais;
CREATE TRIGGER trg_sanidade_animais_inherit BEFORE INSERT OR UPDATE ON public.sanidade_animais FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

DROP TRIGGER IF EXISTS trg_sanidade_inherit ON public.sanidade;
CREATE TRIGGER trg_sanidade_inherit BEFORE INSERT OR UPDATE ON public.sanidade FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

DROP TRIGGER IF EXISTS trg_eventos_rep_inherit ON public.eventos_reprodutivos;
CREATE TRIGGER trg_eventos_rep_inherit BEFORE INSERT OR UPDATE ON public.eventos_reprodutivos FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

DROP TRIGGER IF EXISTS trg_protocolo_animais_inherit ON public.protocolo_animais;
CREATE TRIGGER trg_protocolo_animais_inherit BEFORE INSERT OR UPDATE ON public.protocolo_animais FOR EACH ROW EXECUTE FUNCTION public.trg_inherit_animal_especie_aptidao();

-- For confinamento, it has lote_id instead of animal_id in some schemas, let's trigger on it if we add lote check? Wait, let's skip confinamento trigger for now, the user just asked for fields.

NOTIFY pgrst, 'reload schema';
