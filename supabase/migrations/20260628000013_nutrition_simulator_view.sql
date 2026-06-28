-- Migration para criar a View que alimenta o Simulador Nutricional no Backend

CREATE OR REPLACE VIEW vw_lotes_simulador AS
SELECT 
    l.id AS lote_id,
    l.nome AS nome,
    l.tenant_id,
    l.fazenda_id,
    COUNT(a.id) AS num_animais,
    COALESCE(AVG(NULLIF(a.peso_atual, 0)), 0) AS peso_medio
FROM lotes l
LEFT JOIN animais a ON a.lote_id = l.id AND UPPER(a.status) = 'ATIVO'
WHERE UPPER(l.status) = 'ATIVO'
GROUP BY l.id, l.nome, l.tenant_id, l.fazenda_id;
