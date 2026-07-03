
CREATE TABLE public.lotes_compra (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    fornecedor_id uuid REFERENCES public.parceiros(id) ON DELETE SET NULL,
    nota_fiscal text,
    gta text,
    data_compra date NOT NULL,
    valor_total numeric(12,2) DEFAULT 0,
    quantidade_cabecas integer NOT NULL,
    fazenda_destino_id uuid REFERENCES public.fazendas(id) ON DELETE SET NULL,
    status text DEFAULT 'Concluído' NOT NULL,
    nota_entrada_id uuid REFERENCES public.notas_entrada(id) ON DELETE SET NULL
);

ALTER TABLE public.animais ADD COLUMN lote_compra_id uuid REFERENCES public.lotes_compra(id) ON DELETE SET NULL;
