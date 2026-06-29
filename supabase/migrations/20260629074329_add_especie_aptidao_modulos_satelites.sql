-- Adicionando os campos nas 8 tabelas de forma segura
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.lotes ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.pastos ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.pastos ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.pesagens ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.pesagens ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.nutricao_animais ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.nutricao_animais ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.sanidade_animais ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.sanidade_animais ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.eventos_reprodutivos ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.eventos_reprodutivos ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.confinamento ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.confinamento ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS especie_id TEXT;
ALTER TABLE public.romaneios ADD COLUMN IF NOT EXISTS aptidao_id TEXT;

-- Criação da função de trigger para herança (buscando do animal_id)
CREATE OR REPLACE FUNCTION inherit_especie_aptidao_from_animal()
RETURNS TRIGGER AS $
BEGIN
  -- Se os campos vierem nulos no INSERT ou UPDATE, tentamos herdar do cadastro do animal
  IF NEW.animal_id IS NOT NULL THEN
    IF NEW.especie_id IS NULL OR NEW.aptidao_id IS NULL THEN
      SELECT
        COALESCE(NEW.especie_id, especie_id),
        COALESCE(NEW.aptidao_id, aptidao_id)
      INTO
        NEW.especie_id,
        NEW.aptidao_id
      FROM public.animais
      WHERE id = NEW.animal_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Aplicando a trigger nas tabelas que referenciam um animal_id específico
DROP TRIGGER IF EXISTS trg_inherit_pesagens ON public.pesagens;
CREATE TRIGGER trg_inherit_pesagens
BEFORE INSERT OR UPDATE ON public.pesagens
FOR EACH ROW EXECUTE FUNCTION inherit_especie_aptidao_from_animal();

DROP TRIGGER IF EXISTS trg_inherit_nutricao_animais ON public.nutricao_animais;
CREATE TRIGGER trg_inherit_nutricao_animais
BEFORE INSERT OR UPDATE ON public.nutricao_animais
FOR EACH ROW EXECUTE FUNCTION inherit_especie_aptidao_from_animal();

DROP TRIGGER IF EXISTS trg_inherit_sanidade_animais ON public.sanidade_animais;
CREATE TRIGGER trg_inherit_sanidade_animais
BEFORE INSERT OR UPDATE ON public.sanidade_animais
FOR EACH ROW EXECUTE FUNCTION inherit_especie_aptidao_from_animal();

DROP TRIGGER IF EXISTS trg_inherit_eventos_reprodutivos ON public.eventos_reprodutivos;
CREATE TRIGGER trg_inherit_eventos_reprodutivos
BEFORE INSERT OR UPDATE ON public.eventos_reprodutivos
FOR EACH ROW EXECUTE FUNCTION inherit_especie_aptidao_from_animal();


