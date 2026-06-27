-- Migration: Criar tabela de historico de romaneios

CREATE TABLE IF NOT EXISTS public.romaneio_historico (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  romaneio_id UUID NOT NULL REFERENCES public.romaneios(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  observacao TEXT
);

ALTER TABLE public.romaneio_historico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view history for their tenants" ON public.romaneio_historico
  FOR SELECT USING (
    tenant_id IN (
      SELECT user_profiles.tenant_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert history for their tenants" ON public.romaneio_historico
  FOR INSERT WITH CHECK (
    tenant_id IN (
      SELECT user_profiles.tenant_id 
      FROM user_profiles 
      WHERE user_profiles.user_id = auth.uid()
    )
  );

-- Function to handle status change logging
CREATE OR REPLACE FUNCTION public.log_romaneio_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.romaneio_historico (
        romaneio_id,
        tenant_id,
        status_anterior,
        status_novo,
        usuario_id,
        observacao
      ) VALUES (
        NEW.id,
        NEW.tenant_id,
        OLD.status,
        NEW.status,
        auth.uid(),
        'Alteração de status via ' || TG_OP
      );
    END IF;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.romaneio_historico (
      romaneio_id,
      tenant_id,
      status_anterior,
      status_novo,
      usuario_id,
      observacao
    ) VALUES (
      NEW.id,
      NEW.tenant_id,
      NULL,
      NEW.status,
      auth.uid(),
      'Criação de romaneio'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically log status changes
DROP TRIGGER IF EXISTS romaneio_status_trigger ON public.romaneios;
CREATE TRIGGER romaneio_status_trigger
AFTER INSERT OR UPDATE ON public.romaneios
FOR EACH ROW
EXECUTE FUNCTION public.log_romaneio_status_change();
