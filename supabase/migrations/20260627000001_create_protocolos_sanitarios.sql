-- ═══════════════════════════════════════════════════════════════
-- PROTOCOLOS SANITÁRIOS — Migration
-- ═══════════════════════════════════════════════════════════════

-- ── 1. TEMPLATES DE PROTOCOLO SANITÁRIO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_sanitario_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  fazenda_id    uuid REFERENCES public.fazendas(id),
  nome          text NOT NULL,
  descricao     text,
  categoria     text NOT NULL DEFAULT 'VACINAÇÃO', -- "VACINAÇÃO" | "SANIDADE" | "NUTRIÇÃO"
  is_sistema    boolean NOT NULL DEFAULT false,
  status        text NOT NULL DEFAULT 'ativo',
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.protocolo_sanitario_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_sanitario_templates_read" ON public.protocolo_sanitario_templates;
CREATE POLICY "protocolo_sanitario_templates_read" ON public.protocolo_sanitario_templates
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "protocolo_sanitario_templates_write" ON public.protocolo_sanitario_templates;
CREATE POLICY "protocolo_sanitario_templates_write" ON public.protocolo_sanitario_templates
  FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() AND is_sistema = false);

-- ── 2. ETAPAS DOS TEMPLATES SANITÁRIOS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_sanitario_etapas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES public.protocolo_sanitario_templates(id) ON DELETE CASCADE,
  dia_relativo    integer NOT NULL DEFAULT 0,
  produto_id      uuid REFERENCES public.produtos(id),
  produto_nome    text, -- Fallback case
  dose            text,
  via             text,
  ordem           integer NOT NULL DEFAULT 0
);

ALTER TABLE public.protocolo_sanitario_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_sanitario_etapas_read" ON public.protocolo_sanitario_etapas;
CREATE POLICY "protocolo_sanitario_etapas_read" ON public.protocolo_sanitario_etapas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.protocolo_sanitario_templates t
      WHERE t.id = template_id
        AND (t.tenant_id IS NULL OR t.tenant_id = auth_helpers.get_auth_tenant())
    )
  );

DROP POLICY IF EXISTS "protocolo_sanitario_etapas_write" ON public.protocolo_sanitario_etapas;
CREATE POLICY "protocolo_sanitario_etapas_write" ON public.protocolo_sanitario_etapas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.protocolo_sanitario_templates t
      WHERE t.id = template_id
        AND t.tenant_id = auth_helpers.get_auth_tenant()
        AND t.is_sistema = false
    )
  );

-- ── 3. INSERIR PROTOCOLOS SEMENTE DO SISTEMA ──────────────────────────────────
DO $$ 
DECLARE
  v_template_id uuid;
BEGIN
  -- Vermifugação Estratégica
  INSERT INTO public.protocolo_sanitario_templates (nome, descricao, categoria, is_sistema)
  VALUES ('Vermifugação Estratégica', 'Protocolo base de controle de parasitas para todo o rebanho.', 'SANIDADE', true)
  RETURNING id INTO v_template_id;

  INSERT INTO public.protocolo_sanitario_etapas (template_id, dia_relativo, produto_nome, dose, via)
  VALUES (v_template_id, 0, 'Ivermectina 3.5%', '1ml/50kg', 'Subcutânea');

  -- Protocolo Reclamatória (Clostridiose)
  INSERT INTO public.protocolo_sanitario_templates (nome, descricao, categoria, is_sistema)
  VALUES ('Protocolo Reclamatória', 'Vacinação e reforço contra Clostridiose.', 'VACINAÇÃO', true)
  RETURNING id INTO v_template_id;

  INSERT INTO public.protocolo_sanitario_etapas (template_id, dia_relativo, produto_nome, dose, via, ordem)
  VALUES 
    (v_template_id, 0, 'Clostridiose 10v', '2ml', 'Subcutânea', 0),
    (v_template_id, 30, 'Reforço Clostridiose', '2ml', 'Subcutânea', 1);

END $$;
