-- Tabela Global de Configurações do Sistema (Single Row)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id integer PRIMARY KEY DEFAULT 1,
  system_name text NOT NULL DEFAULT 'Tauze ERP',
  logo_base64 text,
  favicon_base64 text,
  brand_color text DEFAULT '#00b865',
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política de Leitura Pública (Qualquer um pode ler as cores e logo do sistema, até não-logados na Landing Page)
CREATE POLICY "Leitura pública para system_settings"
  ON public.system_settings FOR SELECT
  USING (true);

-- Política de Update restrita a SAAS_ADMIN
CREATE POLICY "Apenas SAAS_ADMIN pode atualizar system_settings"
  ON public.system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'SAAS_ADMIN'
    )
  );

-- Inserir a linha única inicial
INSERT INTO public.system_settings (id, system_name, brand_color)
VALUES (1, 'Tauze ERP', '#00b865')
ON CONFLICT (id) DO NOTHING;
