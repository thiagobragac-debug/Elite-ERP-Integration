-- 1. Create parceiros table based on new advanced structure
CREATE TABLE IF NOT EXISTS public.parceiros (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID REFERENCES public.tenants(id),
    is_global BOOLEAN DEFAULT false,
    fazendas_vinculadas UUID[],
    
    -- Identification
    nome TEXT NOT NULL,
    fantasia TEXT,
    cnpj_cpf TEXT,
    inscricao_estadual TEXT,
    inscricao_municipal TEXT,
    
    -- Contact
    telefone TEXT,
    email TEXT,
    contato TEXT,
    
    -- Address
    cep TEXT,
    tipo_logradouro TEXT,
    logradouro TEXT,
    numero TEXT,
    complemento TEXT,
    bairro TEXT,
    cidade TEXT,
    estado TEXT,
    pais TEXT DEFAULT 'Brasil',
    
    -- Business characteristics
    categoria TEXT,
    status TEXT DEFAULT 'ATIVO' CHECK (status IN ('ATIVO','INATIVO','BLOQUEADO')),
    
    -- Classification flags
    is_customer BOOLEAN DEFAULT false,
    is_supplier BOOLEAN DEFAULT false,
    
    -- Audit
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.parceiros ENABLE ROW LEVEL SECURITY;

-- 2. Migrate data from fornecedores dynamically
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'fornecedores' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'cnpj_cpf') THEN
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, cnpj_cpf, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, cnpj_cpf, email, telefone, true, false, created_at FROM public.fornecedores';
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'fornecedores' AND column_name = 'documento') THEN
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, cnpj_cpf, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, documento, email, telefone, true, false, created_at FROM public.fornecedores';
        ELSE
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, email, telefone, true, false, created_at FROM public.fornecedores';
        END IF;
    END IF;
END $$;

-- 3. Migrate data from clientes dynamically
DO $$ 
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'clientes' AND table_schema = 'public') THEN
        IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'cnpj_cpf') THEN
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, cnpj_cpf, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, cnpj_cpf, email, telefone, false, true, created_at FROM public.clientes';
        ELSIF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'clientes' AND column_name = 'documento') THEN
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, cnpj_cpf, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, documento, email, telefone, false, true, created_at FROM public.clientes';
        ELSE
            EXECUTE 'INSERT INTO public.parceiros (id, tenant_id, nome, email, telefone, is_supplier, is_customer, created_at) SELECT id, tenant_id, nome, email, telefone, false, true, created_at FROM public.clientes';
        END IF;
    END IF;
END $$;

-- 4. Re-point foreign keys
DO $$ 
DECLARE r RECORD;
BEGIN
    FOR r IN (
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_type = 'FOREIGN KEY' 
        AND table_schema = 'public' 
        AND table_name IN ('contas_pagar', 'contas_receber', 'pedidos_compra', 'notas_entrada')
    ) LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.table_name) || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;
END $$;

-- Add new constraints safely
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contas_pagar' AND column_name = 'fornecedor_id') THEN
    ALTER TABLE public.contas_pagar ADD CONSTRAINT fk_contas_pagar_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.parceiros(id);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'contas_receber' AND column_name = 'cliente_id') THEN
    ALTER TABLE public.contas_receber ADD CONSTRAINT fk_contas_receber_cliente FOREIGN KEY (cliente_id) REFERENCES public.parceiros(id);
  END IF;

  IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'pedidos_compra' AND column_name = 'fornecedor_id') THEN
    ALTER TABLE public.pedidos_compra ADD CONSTRAINT fk_pedidos_compra_fornecedor FOREIGN KEY (fornecedor_id) REFERENCES public.parceiros(id);
  END IF;
END $$;

-- Drop old tables if they exist
DROP TABLE IF EXISTS public.fornecedores CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
