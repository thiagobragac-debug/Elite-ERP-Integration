-- Migration: Criação da tabela de Certificados Digitais

CREATE TABLE IF NOT EXISTS certificados_digitais (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    company_id UUID NOT NULL REFERENCES fazendas(id) ON DELETE CASCADE,
    
    titular VARCHAR(255) NOT NULL,
    cnpj_cpf VARCHAR(20) NOT NULL,
    data_vencimento TIMESTAMP WITH TIME ZONE NOT NULL,
    
    pfx_base64 TEXT NOT NULL,
    senha TEXT NOT NULL, -- Em produção real, usar pgcrypto ou Supabase Vault
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    CONSTRAINT certificados_digitais_tenant_company_key UNIQUE (tenant_id, company_id)
);

-- RLS
ALTER TABLE certificados_digitais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificados_tenant" ON certificados_digitais
    FOR ALL
    USING (tenant_id = auth_helpers.get_auth_tenant());
