-- Adicionar colunas para customização de cores da Sidebar
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS sidebar_bg_color text;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS sidebar_font_color text;
