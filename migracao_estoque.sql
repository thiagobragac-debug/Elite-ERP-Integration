-- 1. Adicionando campos para Soft Delete nas tabelas principais
ALTER TABLE produtos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE movimentacoes_estoque ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE depositos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Garantir que as visualizações padrões desconsiderem itens deletados nas policies RLS (Opcional se tratarem via UI, mas recomendado)
-- Você pode recriar as políticas RLS aqui se houver um padrão.

-- 3. Criação da Tabela de Saldos por Depósito
CREATE TABLE IF NOT EXISTS saldos_estoque (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    deposito_id UUID NOT NULL REFERENCES depositos(id) ON DELETE CASCADE,
    quantidade NUMERIC(15,4) NOT NULL DEFAULT 0,
    tenant_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Garantir que a constraint unique existe mesmo se a tabela já existia antes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'saldos_estoque_produto_id_deposito_id_key'
    ) THEN
        ALTER TABLE saldos_estoque ADD CONSTRAINT saldos_estoque_produto_id_deposito_id_key UNIQUE (produto_id, deposito_id);
    END IF;
END
$$;

-- Habilitar RLS e Política Tenant Isolation para saldos_estoque
ALTER TABLE saldos_estoque ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'saldos_estoque' AND policyname = 'Tenant Isolation'
    ) THEN
        CREATE POLICY "Tenant Isolation" ON saldos_estoque FOR ALL USING (tenant_id::text = auth.jwt()->>'tenant_id');
    END IF;
END
$$;

-- 4. Migrar os dados existentes: produtos.estoque_atual -> saldos_estoque
-- Para produtos que não possuem depósito vinculado diretamente, podemos criar um "Depósito Principal" (se não houver nenhum do tenant) ou vincular ao primeiro depósito do tenant.
DO $$
DECLARE
    r RECORD;
    v_deposito_id UUID;
BEGIN
    FOR r IN (SELECT id, estoque_atual, tenant_id FROM produtos WHERE estoque_atual IS NOT NULL AND estoque_atual > 0)
    LOOP
        -- Pega o primeiro depósito da fazenda/tenant
        SELECT id INTO v_deposito_id FROM depositos WHERE tenant_id::text = r.tenant_id::text LIMIT 1;
        
        -- Se não tiver depósito, cria um "Depósito Padrão - Migração"
        IF v_deposito_id IS NULL THEN
            v_deposito_id := gen_random_uuid();
            INSERT INTO depositos (id, nome, status, tenant_id, fazenda_id)
            VALUES (v_deposito_id, 'Depósito Padrão (Migração)', 'Ativo', r.tenant_id, r.tenant_id); -- Assumindo fazenda_id = tenant_id por segurança na migração, revise depois se a arquitetura separar.
        END IF;

        -- Insere saldo (ON CONFLICT DO NOTHING se rodar script mais de uma vez)
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (r.id, v_deposito_id, r.estoque_atual, r.tenant_id)
        ON CONFLICT (produto_id, deposito_id) DO NOTHING;
    END LOOP;
END
$$;

-- 5. Criar Função RPC para Inserir Movimentação e Atualizar Saldo (Transaction-safe)
CREATE OR REPLACE FUNCTION registrar_movimentacao_estoque(payload JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_produto_id UUID;
    v_deposito_id UUID;
    v_quantidade NUMERIC;
    v_tipo TEXT;
    v_tenant_id UUID;
    v_custo_unitario NUMERIC;
    v_movimentacao_id UUID;
BEGIN
    -- Extrair dados do payload
    v_produto_id := (payload->>'produto_id')::UUID;
    v_deposito_id := (payload->>'deposito_id')::UUID;
    v_quantidade := (payload->>'quantidade')::NUMERIC;
    v_tipo := payload->>'tipo';
    v_tenant_id := (payload->>'tenant_id')::UUID;
    v_custo_unitario := COALESCE((payload->>'custo_unitario')::NUMERIC, 0);

    -- 1. Inserir Movimentação
    INSERT INTO movimentacoes_estoque (
        produto_id, deposito_id, quantidade, tipo, data_movimentacao, 
        origem_destino, responsavel, custo_unitario, lote, data_validade, tenant_id, fazenda_id
    ) VALUES (
        v_produto_id, v_deposito_id, v_quantidade, v_tipo, 
        COALESCE(payload->>'data_movimentacao', NOW()::TEXT)::TIMESTAMP,
        payload->>'origem_destino', payload->>'responsavel', v_custo_unitario,
        payload->>'lote', (payload->>'data_validade')::DATE, v_tenant_id, (payload->>'fazenda_id')::UUID
    ) RETURNING id INTO v_movimentacao_id;

    -- 2. Atualizar ou Inserir Saldo na tabela saldos_estoque de forma atômica
    IF v_tipo = 'ENTRADA' THEN
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) 
        DO UPDATE SET quantidade = saldos_estoque.quantidade + EXCLUDED.quantidade, updated_at = NOW();
        
        -- Atualizar o Custo Médio na tabela produtos (Lógica simplificada: média ponderada)
        -- Na prática comercial, o custo médio é (Estoque Anterior * Custo Anterior + Qtde Nova * Custo Novo) / (Estoque Anterior + Qtde Nova)
        -- Aqui atualizaremos apenas se o custo unitário for > 0
        IF v_custo_unitario > 0 THEN
            UPDATE produtos 
            SET custo_medio = (
                COALESCE(custo_medio, 0) + v_custo_unitario -- Simplificado para demonstração. Ajuste conforme sua contabilidade.
            ) / 2
            WHERE id = v_produto_id;
        END IF;

    ELSIF v_tipo = 'SAIDA' THEN
        INSERT INTO saldos_estoque (produto_id, deposito_id, quantidade, tenant_id)
        VALUES (v_produto_id, v_deposito_id, -v_quantidade, v_tenant_id)
        ON CONFLICT (produto_id, deposito_id) 
        DO UPDATE SET quantidade = saldos_estoque.quantidade - EXCLUDED.quantidade, updated_at = NOW();
    END IF;

    -- 3. Atualizar estoque_atual legado por retrocompatibilidade (Opcional, mas previne quebra do frontend em outras telas que leem produtos diretamente)
    UPDATE produtos
    SET estoque_atual = (
        SELECT SUM(quantidade) FROM saldos_estoque WHERE produto_id = v_produto_id
    )
    WHERE id = v_produto_id;

    RETURN jsonb_build_object('success', true, 'movimentacao_id', v_movimentacao_id);
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;
