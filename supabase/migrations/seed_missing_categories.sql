INSERT INTO public.categorias_sistema (tenant_id, modulo, nome, cor, is_system, is_active)
SELECT t.id, 'estoque', c.nome, c.cor, true, true
FROM public.tenants t
CROSS JOIN (
  VALUES 
    ('Combustível', '#ef4444'), 
    ('Peças', '#64748b'), 
    ('Medicamentos', '#3b82f6'), 
    ('Ração', '#b45309'), 
    ('Vacinas', '#ec4899'), 
    ('EPI', '#0f172a')
) AS c(nome, cor)
WHERE NOT EXISTS (
  SELECT 1 FROM public.categorias_sistema cs 
  WHERE cs.tenant_id = t.id AND cs.modulo = 'estoque' AND cs.nome = c.nome
);
