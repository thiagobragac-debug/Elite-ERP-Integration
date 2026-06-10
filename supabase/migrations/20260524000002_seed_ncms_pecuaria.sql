-- Injeta os principais NCMs do Agronegócio (Foco em Pecuária e Grãos) para todos os Tenants
INSERT INTO public.estoque_ncms (tenant_id, codigo, descricao, is_active)
SELECT 
  t.id, 
  ncm.codigo, 
  ncm.descricao, 
  true
FROM public.tenants t
CROSS JOIN (
  VALUES 
    -- Rações e Nutrição Animal
    ('2309.90.90', 'Preparações dos tipos utilizados na alimentação de animais (Rações e Suplementos Minerais)'),
    ('1005.90.10', 'Milho em grão (para consumo animal)'),
    ('1201.90.00', 'Soja, mesmo triturada (exceto para semeadura)'),
    
    -- Saúde Animal (Veterinária)
    ('3002.42.10', 'Vacinas para medicina veterinária'),
    ('3004.90.99', 'Outros medicamentos e antibióticos preparados para fins veterinários'),
    ('3808.91.19', 'Inseticidas, carrapaticidas e acaricidas'),
    
    -- Pastagem e Agricultura
    ('1209.29.90', 'Sementes de plantas forrageiras (Sementes de Pastagem/Capim)'),
    ('3105.20.00', 'Adubos (fertilizantes) minerais ou químicos NPK'),
    
    -- Infraestrutura da Fazenda
    ('7313.00.00', 'Arame farpado, de ferro ou aço (Cercas e Currais)'),
    ('2710.19.21', 'Óleo Diesel (Combustível para maquinário agrícola)'),

    -- Animais Vivos
    ('0102.21.10', 'Bovinos reprodutores de raça pura (Reprodutores com registro)'),
    ('0102.29.90', 'Outros bovinos vivos (Gado comercial / Corte e recria)')
) as ncm(codigo, descricao)
WHERE NOT EXISTS (
  SELECT 1 FROM public.estoque_ncms en 
  WHERE en.tenant_id = t.id AND en.codigo = ncm.codigo
);
