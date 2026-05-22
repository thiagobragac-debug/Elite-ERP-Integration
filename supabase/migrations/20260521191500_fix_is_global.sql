-- Corrige a visualização dos parceiros antigos definindo-os como globais
UPDATE public.parceiros 
SET is_global = true 
WHERE fazendas_vinculadas IS NULL OR array_length(fazendas_vinculadas, 1) IS NULL;
