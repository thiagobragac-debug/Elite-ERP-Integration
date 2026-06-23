-- Adiciona colunas de configuração da landing page na tabela global system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS landing_hero_title text DEFAULT 'Tecnologia de Precisão que Transforma sua Produção',
ADD COLUMN IF NOT EXISTS landing_hero_subtitle text DEFAULT 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.',
ADD COLUMN IF NOT EXISTS landing_hero_cta text DEFAULT 'Teste Gratuito',
ADD COLUMN IF NOT EXISTS landing_show_ticker boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS landing_show_mockup boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS landing_show_faq boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS landing_faq_items jsonb DEFAULT '[
  {"q": "O sistema funciona sem internet no campo?", "a": "Sim. O Tauze foi construído offline-first. Todas as pesagens RFID, abastecimentos e registros de campo funcionam sem conexão e sincronizam automaticamente ao retornar ao wi-fi da sede."},
  {"q": "Como funciona a integração bancária?", "a": "Conectamos via Open Finance com BB, Itaú, Bradesco, Sicredi, Cresol e BTG. O extrato é importado automaticamente e o sistema casa os lançamentos com seu controle interno sem digitação."},
  {"q": "É possível gerenciar múltiplas fazendas?", "a": "Sim. O painel central consolida todas as unidades num único dashboard executivo. Você pode filtrar por fazenda, ver o agregado do grupo ou comparar desempenho entre propriedades."},
  {"q": "Quanto tempo leva a implantação?", "a": "A média de go-live completo é de 7 dias úteis. Realizamos a migração dos dados históricos de planilhas, treinamento da equipe e configuração das integrações nesse período."},
  {"q": "O sistema emite NF-e e documentos fiscais?", "a": "Sim. NF-e, CT-e e MDF-e de forma integrada ao módulo de vendas e compras. A nota é gerada automaticamente no momento da venda ou da entrada de mercadoria, sem necessidade de outro sistema."}
]'::jsonb,
ADD COLUMN IF NOT EXISTS landing_whatsapp text DEFAULT '5511999999999',
ADD COLUMN IF NOT EXISTS landing_contact_email text DEFAULT 'contato@tauze.com.br';

-- Assegurar que os valores padrão sejam preenchidos na linha existente (id = 1)
UPDATE public.system_settings
SET 
  landing_hero_title = COALESCE(landing_hero_title, 'Tecnologia de Precisão que Transforma sua Produção'),
  landing_hero_subtitle = COALESCE(landing_hero_subtitle, 'O ERP rural completo para gestão de rebanho, frota, financeiro e balança RFID em uma única plataforma integrada.'),
  landing_hero_cta = COALESCE(landing_hero_cta, 'Teste Gratuito'),
  landing_show_ticker = COALESCE(landing_show_ticker, true),
  landing_show_mockup = COALESCE(landing_show_mockup, true),
  landing_show_faq = COALESCE(landing_show_faq, true),
  landing_faq_items = COALESCE(landing_faq_items, '[
    {"q": "O sistema funciona sem internet no campo?", "a": "Sim. O Tauze foi construído offline-first. Todas as pesagens RFID, abastecimentos e registros de campo funcionam sem conexão e sincronizam automaticamente ao retornar ao wi-fi da sede."},
    {"q": "Como funciona a integração bancária?", "a": "Conectamos via Open Finance com BB, Itaú, Bradesco, Sicredi, Cresol e BTG. O extrato é importado automaticamente e o sistema casa os lançamentos com seu controle interno sem digitação."},
    {"q": "É possível gerenciar múltiplas fazendas?", "a": "Sim. O painel central consolida todas as unidades num único dashboard executivo. Você pode filtrar por fazenda, ver o agregado do grupo ou comparar desempenho entre propriedades."},
    {"q": "Quanto tempo leva a implantação?", "a": "A média de go-live completo é de 7 dias úteis. Realizamos a migração dos dados históricos de planilhas, treinamento da equipe e configuração das integrações nesse período."},
    {"q": "O sistema emite NF-e e documentos fiscais?", "a": "Sim. NF-e, CT-e e MDF-e de forma integrada ao módulo de vendas e compras. A nota é gerada automaticamente no momento da venda ou da entrada de mercadoria, sem necessidade de outro sistema."}
  ]'::jsonb),
  landing_whatsapp = COALESCE(landing_whatsapp, '5511999999999'),
  landing_contact_email = COALESCE(landing_contact_email, 'contato@tauze.com.br')
WHERE id = 1;
