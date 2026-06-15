-- Migration for produto_embalagens table
CREATE TABLE IF NOT EXISTS produto_embalagens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
    descricao TEXT NOT NULL,
    fator NUMERIC(15,4) NOT NULL,
    fazenda_id UUID REFERENCES fazendas(id),
    tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE produto_embalagens ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "produto_embalagens_select" ON produto_embalagens FOR SELECT USING (tenant_id = auth.uid());
CREATE POLICY "produto_embalagens_insert" ON produto_embalagens FOR INSERT WITH CHECK (tenant_id = auth.uid());
CREATE POLICY "produto_embalagens_update" ON produto_embalagens FOR UPDATE USING (tenant_id = auth.uid());
CREATE POLICY "produto_embalagens_delete" ON produto_embalagens FOR DELETE USING (tenant_id = auth.uid());
