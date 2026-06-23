-- Seed initial SaaS Addons

INSERT INTO public.saas_addons (name, description, type, price, billing_cycle, is_active, metadata)
VALUES
  (
    'Pacote +5 Usuários', 
    'Aumente o limite de usuários simultâneos no seu ERP em 5 licenças extras.', 
    'Recurso/Usuários', 
    49.90, 
    'monthly', 
    true, 
    '{"users": 5}'::jsonb
  ),
  (
    'Pacote +500 Animais', 
    'Expanda a capacidade do seu rebanho no sistema em 500 cabeças adicionais.', 
    'Recurso/Usuários', 
    99.90, 
    'monthly', 
    true, 
    '{"animals": 500}'::jsonb
  ),
  (
    'Armazenamento Extra 10GB', 
    'Aumente o espaço para anexos, fotos de animais e documentos na nuvem.', 
    'Armazenamento', 
    29.90, 
    'monthly', 
    true, 
    '{"storage_gb": 10}'::jsonb
  ),
  (
    'SLA Prioritário (WhatsApp 24/7)', 
    'Tenha acesso direto a um especialista agro via WhatsApp com resposta em até 15 minutos.', 
    'Serviço/Consultoria', 
    149.90, 
    'monthly', 
    true, 
    '{"sla_priority": true}'::jsonb
  ),
  (
    'Módulo: BI & Analytics Avançado', 
    'Acesso completo a relatórios personalizados e dashboards gerenciais avançados.', 
    'Módulo', 
    59.90, 
    'monthly', 
    true, 
    '{"analytics_advanced": true}'::jsonb
  )
ON CONFLICT DO NOTHING;
