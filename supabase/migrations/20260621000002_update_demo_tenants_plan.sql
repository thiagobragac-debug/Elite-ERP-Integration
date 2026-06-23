-- Atualiza todos os tenants existentes que estão com o plano "DEMO" para "Porteira Aberta"
UPDATE public.tenants
SET plano = 'Porteira Aberta'
WHERE plano = 'DEMO';
