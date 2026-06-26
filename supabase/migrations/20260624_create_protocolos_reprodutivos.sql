-- ═══════════════════════════════════════════════════════════════
-- PROTOCOLOS REPRODUTIVOS — Migration Completa
-- Tauze ERP — Sprint 1
-- ═══════════════════════════════════════════════════════════════

-- ── 1. TEMPLATES DE PROTOCOLO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_templates (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  nome          text NOT NULL,
  descricao     text,
  tipo          text NOT NULL DEFAULT 'IATF',   -- "IATF" | "Monta" | "Custom"
  is_sistema    boolean NOT NULL DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE public.protocolo_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_templates_read" ON public.protocolo_templates;
CREATE POLICY "protocolo_templates_read" ON public.protocolo_templates
  FOR SELECT USING (tenant_id IS NULL OR tenant_id = auth_helpers.get_auth_tenant());

DROP POLICY IF EXISTS "protocolo_templates_write" ON public.protocolo_templates;
CREATE POLICY "protocolo_templates_write" ON public.protocolo_templates
  FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant() AND is_sistema = false);

-- ── 2. ETAPAS DOS TEMPLATES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_template_etapas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id     uuid NOT NULL REFERENCES public.protocolo_templates(id) ON DELETE CASCADE,
  nome_etapa      text NOT NULL,
  dia_relativo    integer NOT NULL DEFAULT 0,
  tipo_acao       text NOT NULL DEFAULT 'farmaco', -- "farmaco"|"ia"|"diagnostico"|"observacao"
  instrucao       text,
  obrigatorio     boolean NOT NULL DEFAULT true,
  ordem           integer NOT NULL DEFAULT 0
);

ALTER TABLE public.protocolo_template_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_template_etapas_read" ON public.protocolo_template_etapas;
CREATE POLICY "protocolo_template_etapas_read" ON public.protocolo_template_etapas
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.protocolo_templates t
      WHERE t.id = template_id
        AND (t.tenant_id IS NULL OR t.tenant_id = auth_helpers.get_auth_tenant())
    )
  );

DROP POLICY IF EXISTS "protocolo_template_etapas_write" ON public.protocolo_template_etapas;
CREATE POLICY "protocolo_template_etapas_write" ON public.protocolo_template_etapas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.protocolo_templates t
      WHERE t.id = template_id
        AND t.tenant_id = auth_helpers.get_auth_tenant()
        AND t.is_sistema = false
    )
  );

-- ── 3. PROTOCOLOS EM EXECUÇÃO ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolos_reprodutivos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  fazenda_id      uuid REFERENCES public.fazendas(id),
  template_id     uuid REFERENCES public.protocolo_templates(id),
  nome            text NOT NULL,
  tipo            text NOT NULL DEFAULT 'IATF',
  data_inicio     date NOT NULL DEFAULT CURRENT_DATE,
  status          text NOT NULL DEFAULT 'ativo',  -- "rascunho"|"ativo"|"concluido"|"cancelado"
  tecnico_resp    text,
  touro_id        text,          -- para Monta Natural
  data_fim_monta  date,          -- fim da estação de monta
  observacoes     text,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE public.protocolos_reprodutivos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolos_reprodutivos_tenant" ON public.protocolos_reprodutivos;
CREATE POLICY "protocolos_reprodutivos_tenant" ON public.protocolos_reprodutivos
  FOR ALL USING (tenant_id = auth_helpers.get_auth_tenant());

-- ── 4. ETAPAS CONCRETAS DO PROTOCOLO ──────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_etapas (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id        uuid NOT NULL REFERENCES public.protocolos_reprodutivos(id) ON DELETE CASCADE,
  template_etapa_id   uuid REFERENCES public.protocolo_template_etapas(id),
  nome_etapa          text NOT NULL,
  dia_relativo        integer NOT NULL DEFAULT 0,
  data_prevista       date NOT NULL,
  data_realizada      date,
  status              text NOT NULL DEFAULT 'pendente', -- "pendente"|"realizada"|"pulada"|"atrasada"
  notas               text,
  ordem               integer NOT NULL DEFAULT 0
);

ALTER TABLE public.protocolo_etapas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_etapas_tenant" ON public.protocolo_etapas;
CREATE POLICY "protocolo_etapas_tenant" ON public.protocolo_etapas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.protocolos_reprodutivos p
      WHERE p.id = protocolo_id
        AND p.tenant_id = auth_helpers.get_auth_tenant()
    )
  );

-- ── 5. ANIMAIS DO PROTOCOLO ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.protocolo_animais (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo_id     uuid NOT NULL REFERENCES public.protocolos_reprodutivos(id) ON DELETE CASCADE,
  animal_id        uuid NOT NULL REFERENCES public.animais(id),
  lote_id          uuid REFERENCES public.lotes(id),
  resultado_final  text,          -- "Prenha"|"Vazia"|"Descartada"|null
  data_diagnostico date,
  observacoes      text,
  UNIQUE(protocolo_id, animal_id)
);

ALTER TABLE public.protocolo_animais ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "protocolo_animais_tenant" ON public.protocolo_animais;
CREATE POLICY "protocolo_animais_tenant" ON public.protocolo_animais
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.protocolos_reprodutivos p
      WHERE p.id = protocolo_id
        AND p.tenant_id = auth_helpers.get_auth_tenant()
    )
  );

-- ── 6. VÍNCULO NOS EVENTOS AVULSOS ────────────────────────────
ALTER TABLE public.eventos_reprodutivos
  ADD COLUMN IF NOT EXISTS protocolo_etapa_id uuid REFERENCES public.protocolo_etapas(id);

-- ── 7. ÍNDICES DE PERFORMANCE ──────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_protocolos_tenant     ON public.protocolos_reprodutivos(tenant_id);
CREATE INDEX IF NOT EXISTS idx_protocolos_status     ON public.protocolos_reprodutivos(status);
CREATE INDEX IF NOT EXISTS idx_protocolo_etapas_prot ON public.protocolo_etapas(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_protocolo_etapas_data ON public.protocolo_etapas(data_prevista);
CREATE INDEX IF NOT EXISTS idx_protocolo_animais_prot ON public.protocolo_animais(protocolo_id);
CREATE INDEX IF NOT EXISTS idx_protocolo_animais_ani  ON public.protocolo_animais(animal_id);
CREATE INDEX IF NOT EXISTS idx_eventos_etapa          ON public.eventos_reprodutivos(protocolo_etapa_id);

-- ── 8. SEED — TEMPLATES DO SISTEMA ────────────────────────────
-- (tenant_id = NULL = global para todos os tenants)

-- Template 1: Ovsynch
WITH t AS (
  INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
  VALUES ('Ovsynch', 'Protocolo clássico de sincronização para IATF. D0: GnRH, D7: PGF2α, D9: GnRH, D11: IA, D41: Toque.', 'IATF', true)
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO public.protocolo_template_etapas (template_id, nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
SELECT t.id, e.nome_etapa, e.dia_relativo, e.tipo_acao, e.instrucao, e.obrigatorio, e.ordem
FROM t, (VALUES
  ('D0 — GnRH',   0,  'farmaco',      'Aplicar GnRH (2ml IM). Iniciar implante de progesterona se protocolo combinado.', true, 1),
  ('D7 — PGF2α',  7,  'farmaco',      'Aplicar PGF2α (2ml IM). Remover implante de progesterona.', true, 2),
  ('D9 — GnRH',   9,  'farmaco',      'Aplicar GnRH (2ml IM). Pré-IA.', true, 3),
  ('D11 — IA',    11, 'ia',           'Realizar inseminação artificial. Registrar touro/partida de sêmen.', true, 4),
  ('D41 — Toque', 41, 'diagnostico',  'Diagnóstico de prenhez por palpação retal ou ultrassonografia.', false, 5)
) AS e(nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
WHERE t.id IS NOT NULL;

-- Template 2: J-Synch
WITH t AS (
  INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
  VALUES ('J-Synch', 'Protocolo com cipionato de estradiol. Menor intervalo entre PGF2α e IA. Boa taxa de concepção.', 'IATF', true)
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO public.protocolo_template_etapas (template_id, nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
SELECT t.id, e.nome_etapa, e.dia_relativo, e.tipo_acao, e.instrucao, e.obrigatorio, e.ordem
FROM t, (VALUES
  ('D0 — GnRH',                 0,  'farmaco',     'Aplicar GnRH (2ml IM) + implante de progesterona.', true, 1),
  ('D7 — PGF2α + Remoção',      7,  'farmaco',     'Aplicar PGF2α (2ml IM) e remover implante.', true, 2),
  ('D9 — Cipionato Estradiol',  9,  'farmaco',     'Aplicar cipionato de estradiol (1ml IM).', true, 3),
  ('D11 — IA',                  11, 'ia',          'Realizar inseminação artificial.', true, 4),
  ('D41 — Toque',               41, 'diagnostico', 'Diagnóstico de prenhez.', false, 5)
) AS e(nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
WHERE t.id IS NOT NULL;

-- Template 3: Presynch-Ovsynch
WITH t AS (
  INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
  VALUES ('Presynch-Ovsynch', 'Protocolo de pré-sincronização seguido de Ovsynch. Maior taxa de concepção em vacas em anestro.', 'IATF', true)
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO public.protocolo_template_etapas (template_id, nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
SELECT t.id, e.nome_etapa, e.dia_relativo, e.tipo_acao, e.instrucao, e.obrigatorio, e.ordem
FROM t, (VALUES
  ('D0 — PGF2α (1ª)',     0,  'farmaco',     'Primeira aplicação de PGF2α para pré-sincronização.', true, 1),
  ('D14 — PGF2α (2ª)',    14, 'farmaco',     'Segunda aplicação de PGF2α.', true, 2),
  ('D28 — GnRH',          28, 'farmaco',     'Início do Ovsynch (D0 do Ovsynch).', true, 3),
  ('D35 — PGF2α',         35, 'farmaco',     'Aplicar PGF2α + remover implante.', true, 4),
  ('D37 — GnRH',          37, 'farmaco',     'Pré-IA.', true, 5),
  ('D39 — IA',            39, 'ia',          'Realizar inseminação artificial.', true, 6),
  ('D69 — Toque',         69, 'diagnostico', 'Diagnóstico de prenhez.', false, 7)
) AS e(nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
WHERE t.id IS NOT NULL;

-- Template 4: CO-Synch 72h
WITH t AS (
  INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
  VALUES ('CO-Synch 72h', 'Protocolo simplificado: GnRH + IA simultâneos no D9. Reduz número de manejos.', 'IATF', true)
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO public.protocolo_template_etapas (template_id, nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
SELECT t.id, e.nome_etapa, e.dia_relativo, e.tipo_acao, e.instrucao, e.obrigatorio, e.ordem
FROM t, (VALUES
  ('D0 — GnRH',           0,  'farmaco',     'Aplicar GnRH + implante de progesterona.', true, 1),
  ('D7 — PGF2α',          7,  'farmaco',     'Aplicar PGF2α + remover implante.', true, 2),
  ('D9 — GnRH + IA',      9,  'ia',          'Aplicar GnRH e realizar IA simultaneamente (72h após PGF2α).', true, 3),
  ('D39 — Toque',         39, 'diagnostico', 'Diagnóstico de prenhez.', false, 4)
) AS e(nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
WHERE t.id IS NOT NULL;

-- Template 5: Monta Natural (Estação de Monta)
WITH t AS (
  INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
  VALUES ('Monta Natural', 'Estação de monta com touro em repasse. Duração padrão de 60 a 90 dias. Toque ao final.', 'Monta', true)
  ON CONFLICT DO NOTHING
  RETURNING id
)
INSERT INTO public.protocolo_template_etapas (template_id, nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
SELECT t.id, e.nome_etapa, e.dia_relativo, e.tipo_acao, e.instrucao, e.obrigatorio, e.ordem
FROM t, (VALUES
  ('Entrada do Touro',     0,  'observacao',  'Colocar o touro no lote de fêmeas. Verificar ECC e condição reprodutiva.', true, 1),
  ('Avaliação Intermediária', 30, 'observacao', 'Verificar aceitação das fêmeas e condição do touro (meio da estação).', false, 2),
  ('Retirada do Touro',    90, 'observacao',  'Retirar o touro. Registrar data de fim da estação.', true, 3),
  ('Toque de Diagnóstico', 120,'diagnostico', 'Diagnóstico de prenhez 30 dias após o fim da estação.', true, 4)
) AS e(nome_etapa, dia_relativo, tipo_acao, instrucao, obrigatorio, ordem)
WHERE t.id IS NOT NULL;

-- Template 6: Protocolo Livre (sem etapas)
INSERT INTO public.protocolo_templates (nome, descricao, tipo, is_sistema)
VALUES ('Protocolo Livre', 'Crie suas próprias etapas de forma personalizada.', 'Custom', true)
ON CONFLICT DO NOTHING;
