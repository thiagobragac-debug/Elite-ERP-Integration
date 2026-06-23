-- Adiciona colunas para configurações avançadas da landing page na tabela global system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS landing_testimonials jsonb DEFAULT '[
  {"name": "Carlos Mendes", "role": "Pecuarista · 3.200 cabeças · MS", "text": "A pesagem RFID eliminou o estresse do manejo. Antes perdia 2 arrobas por animal no dia da pesagem. Hoje o sistema registra sozinho toda semana."},
  {"name": "Adriana Fonseca", "role": "Gestora Agrícola · 8.500 ha · GO", "text": "O controle de diesel foi o que me convenceu. Em 60 dias identificamos um desvio de R$ 38 mil no consumo de combustível que nunca teríamos encontrado em planilha."},
  {"name": "Roberto Pinheiro", "role": "Produtor Integrado · MT", "text": "A conciliação bancária economizou 3 dias de trabalho do meu financeiro todo mês. O sistema casa os lançamentos automaticamente com uma taxa de 94% de acerto."}
]'::jsonb,
ADD COLUMN IF NOT EXISTS landing_analytics_id text,
ADD COLUMN IF NOT EXISTS landing_pixel_id text,
ADD COLUMN IF NOT EXISTS landing_seo_description text DEFAULT 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.',
ADD COLUMN IF NOT EXISTS landing_seo_keywords text DEFAULT 'erp rural, gestao fazenda, rfid pecuaria, controle frota agricola',
ADD COLUMN IF NOT EXISTS landing_social_instagram text,
ADD COLUMN IF NOT EXISTS landing_social_linkedin text,
ADD COLUMN IF NOT EXISTS landing_social_youtube text;

-- Assegurar que os valores padrão sejam preenchidos na linha existente (id = 1)
UPDATE public.system_settings
SET 
  landing_testimonials = COALESCE(landing_testimonials, '[
    {"name": "Carlos Mendes", "role": "Pecuarista · 3.200 cabeças · MS", "text": "A pesagem RFID eliminou o estresse do manejo. Antes perdia 2 arrobas por animal no dia da pesagem. Hoje o sistema registra sozinho toda semana."},
    {"name": "Adriana Fonseca", "role": "Gestora Agrícola · 8.500 ha · GO", "text": "O controle de diesel foi o que me convenceu. Em 60 dias identificamos um desvio de R$ 38 mil no consumo de combustível que nunca teríamos encontrado em planilha."},
    {"name": "Roberto Pinheiro", "role": "Produtor Integrado · MT", "text": "A conciliação bancária economizou 3 dias de trabalho do meu financeiro todo mês. O sistema casa os lançamentos automaticamente com uma taxa de 94% de acerto."}
  ]'::jsonb),
  landing_seo_description = COALESCE(landing_seo_description, 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.'),
  landing_seo_keywords = COALESCE(landing_seo_keywords, 'erp rural, gestao fazenda, rfid pecuaria, controle frota agricola')
WHERE id = 1;
