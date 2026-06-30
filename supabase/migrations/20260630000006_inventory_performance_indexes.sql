-- Index for Inventory Dashboard performance optimizations

-- 1. Index on movimentacoes_estoque for the "Recent Movements" query.
-- The dashboard fetches recent movements using: 
-- .eq('tenant_id', ...) .order('created_at', { ascending: false }) .limit(6)
-- Without this index, PostgreSQL has to sort all rows for the tenant in memory.
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_tenant_created 
ON public.movimentacoes_estoque(tenant_id, created_at DESC);

-- 2. Index on movimentacoes_estoque for the "Outgoing Movements 30 Days" query.
-- The dashboard fetches:
-- .eq('tenant_id', ...) .in('tipo', ['out', 'SAIDA']) .gte('data_movimentacao', '...')
CREATE INDEX IF NOT EXISTS idx_movimentacoes_estoque_tenant_tipo_data 
ON public.movimentacoes_estoque(tenant_id, tipo, data_movimentacao DESC);

-- 3. Index on produtos for the main inventory grid (InventoryManagement).
-- The grid queries:
-- .eq('tenant_id', ...) .is('deleted_at', null) .order('nome', { ascending: true })
CREATE INDEX IF NOT EXISTS idx_produtos_tenant_deleted_nome 
ON public.produtos(tenant_id, deleted_at, nome);

-- 4. Index on produtos(categoria_id) to speed up JOINs with categorias_sistema
-- in vw_inventory_valuation_summary and other views.
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id 
ON public.produtos(categoria_id);
