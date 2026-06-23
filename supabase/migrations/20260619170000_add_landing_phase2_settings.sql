-- Tabela de Leads capturados na Landing Page
CREATE TABLE IF NOT EXISTS public.saas_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  company_name text,
  notes text,
  status text DEFAULT 'Pendente', -- Pendente, Contatado, Arquivado, Convertido
  created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS na tabela saas_leads
ALTER TABLE public.saas_leads ENABLE ROW LEVEL SECURITY;

-- Política para permitir que qualquer um insira Leads
CREATE POLICY "Leitura/Escrita pública para inserção de leads"
  ON public.saas_leads FOR INSERT
  WITH CHECK (true);

-- Política para leitura/update/delete restrita a SAAS_ADMIN
CREATE POLICY "Apenas SAAS_ADMIN gerencia leads"
  ON public.saas_leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SAAS_ADMIN'
    )
  );

-- Adiciona novas colunas na tabela system_settings
ALTER TABLE public.system_settings 
ADD COLUMN IF NOT EXISTS landing_features jsonb DEFAULT '[
  {"icon": "🐄", "title": "Pecuária & GMD", "desc": "Pesagem RFID, lotes, reprodução e previsão de abate com curvas de engorda automáticas"},
  {"icon": "🌱", "title": "Agrícola & Solo", "desc": "Gestão de talhões, plantios, pulverizações e rendimento físico por safra"},
  {"icon": "🚜", "title": "Frota & Diesel", "desc": "Telemetria, horímetros, OS automáticas e controle de combustível por máquina"},
  {"icon": "🛒", "title": "Compras & Estoque", "desc": "Pipeline completo de cotações, aprovação de preços, estoque mínimo e importação de XML"},
  {"icon": "💰", "title": "Financeiro & Fluxo", "desc": "Contas a pagar/receber, conciliação Open Finance, DRE, EBITDA e custos por @ ou sacas"},
  {"icon": "🛡️", "title": "Segurança & Auditoria", "desc": "Gestão de acessos por cargos/fazendas, log de auditoria, MFA e bloqueio por IP (System Guard)"},
  {"icon": "📊", "title": "BI & Relatórios", "desc": "Dashboards executivos dinâmicos, relatórios em PDF/Excel e exportações inteligentes"},
  {"icon": "🌾", "title": "LCDPR & Fisco", "desc": "Geração automática do Livro Caixa Digital do Produtor Rural e obrigações fiscais agrícolas"}
]'::jsonb,
ADD COLUMN IF NOT EXISTS landing_chat_script text,
ADD COLUMN IF NOT EXISTS landing_mockup_type text DEFAULT 'simulador',
ADD COLUMN IF NOT EXISTS landing_mockup_image_url text,
ADD COLUMN IF NOT EXISTS landing_mockup_video_embed text;

-- Assegurar que os valores padrão sejam preenchidos na linha existente (id = 1)
UPDATE public.system_settings
SET 
  landing_features = COALESCE(landing_features, '[
    {"icon": "🐄", "title": "Pecuária & GMD", "desc": "Pesagem RFID, lotes, reprodução e previsão de abate com curvas de engorda automáticas"},
    {"icon": "🌱", "title": "Agrícola & Solo", "desc": "Gestão de talhões, plantios, pulverizações e rendimento físico por safra"},
    {"icon": "🚜", "title": "Frota & Diesel", "desc": "Telemetria, horímetros, OS automáticas e controle de combustível por máquina"},
    {"icon": "🛒", "title": "Compras & Estoque", "desc": "Pipeline completo de cotações, aprovação de preços, estoque mínimo e importação de XML"},
    {"icon": "💰", "title": "Financeiro & Fluxo", "desc": "Contas a pagar/receber, conciliação Open Finance, DRE, EBITDA e custos por @ ou sacas"},
    {"icon": "🛡️", "title": "Segurança & Auditoria", "desc": "Gestão de acessos por cargos/fazendas, log de auditoria, MFA e bloqueio por IP (System Guard)"},
    {"icon": "📊", "title": "BI & Relatórios", "desc": "Dashboards executivos dinâmicos, relatórios em PDF/Excel e exportações inteligentes"},
    {"icon": "🌾", "title": "LCDPR & Fisco", "desc": "Geração automática do Livro Caixa Digital do Produtor Rural e obrigações fiscais agrícolas"}
  ]'::jsonb),
  landing_mockup_type = COALESCE(landing_mockup_type, 'simulador')
WHERE id = 1;
